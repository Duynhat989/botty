<template>
  <div class="b-card b-card-pad-lg panel page-panel web-plugin-panel">
    <h2 class="b-title-sm panel-title">Plugin chat website</h2>
    <p class="b-caption panel-intro">
      Gắn một dòng script vào website — khách chat với bot ở góc màn hình (giống widget Messenger).
      Dùng chung cấu hình AI, tài liệu và kho hàng như Facebook. Lịch sử lưu kênh <strong>web</strong>.
    </p>

    <label class="b-switch order-toggle">
      <input
        v-model="enabledModel"
        type="checkbox"
      />
      <span class="b-switch-track" aria-hidden="true" />
      Bật plugin trên website
    </label>

    <p v-if="!bot.hasGeminiKey" class="b-msg-warn plugin-warn">
      Cần cấu hình Gemini hoặc gói Botty AI (
      <RouterLink :to="tabRouteSetup">Nội dung → Gemini</RouterLink>
      ) trước khi widget trả lời khách.
    </p>

    <div class="plugin-grid">
      <label class="b-field">
        <span>Màu chủ đạo</span>
        <div class="color-row">
          <input v-model="configModel.accentColor" class="b-input color-hex" type="text" maxlength="7" placeholder="#2563eb" />
          <input v-model="configModel.accentColor" class="color-swatch" type="color" aria-label="Chọn màu" />
        </div>
      </label>

      <label class="b-field">
        <span>Vị trí nút chat</span>
        <select v-model="configModel.position" class="b-input">
          <option value="bottom-right">Góc dưới — phải</option>
          <option value="bottom-left">Góc dưới — trái</option>
        </select>
      </label>

      <label class="b-field">
        <span>Tiêu đề hộp chat</span>
        <input v-model="configModel.title" class="b-input" type="text" maxlength="80" :placeholder="bot.name" />
      </label>

      <label class="b-field">
        <span>Phụ đề (tuỳ chọn)</span>
        <input v-model="configModel.subtitle" class="b-input" type="text" maxlength="120" placeholder="Trả lời trong giờ hành chính" />
      </label>

      <div class="b-field span-2 welcome-block">
        <span class="welcome-block-label">Tin chào khi mở chat</span>
        <p class="b-micro welcome-block-hint">Mỗi ô = một tin bot gửi liền khi khách mở hộp chat (tối đa {{ WELCOME_MAX }} tin).</p>
        <ul class="welcome-list" role="list">
          <li
            v-for="(_msg, idx) in configModel.welcomeMessages"
            :key="'welcome-' + idx"
            class="welcome-row"
          >
            <span class="welcome-idx" aria-hidden="true">{{ idx + 1 }}</span>
            <input
              v-model="configModel.welcomeMessages[idx]"
              class="b-input welcome-input"
              type="text"
              maxlength="500"
              :placeholder="idx === 0 ? 'Xin chào! Bạn cần hỗ trợ gì?' : 'Tin chào tiếp theo…'"
              @input="syncWelcomeMeta"
            />
            <button
              v-if="configModel.welcomeMessages.length > 1"
              type="button"
              class="b-btn b-btn--ghost b-btn--sm welcome-remove"
              :aria-label="'Xóa tin chào ' + (idx + 1)"
              @click="removeWelcomeMessage(idx)"
            >
              Xóa
            </button>
          </li>
        </ul>
        <button
          v-if="configModel.welcomeMessages.length < WELCOME_MAX"
          type="button"
          class="b-btn b-btn--ghost b-btn--sm welcome-add"
          @click="addWelcomeMessage"
        >
          + Thêm tin chào
        </button>
      </div>

      <fieldset class="launcher-fieldset span-2">
        <legend class="b-caption">Nút nổi (góc màn hình)</legend>
        <label class="b-field launcher-size-field">
          <span>Kích thước nút</span>
          <div class="size-pills" role="radiogroup" aria-label="Kích thước nút chat">
            <label
              v-for="opt in launcherSizeOptions"
              :key="opt.value"
              class="size-pill"
              :class="{ on: Number(configModel.launcherSize) === opt.value }"
            >
              <input v-model.number="configModel.launcherSize" type="radio" :value="opt.value" />
              <span class="size-pill__dot" :style="{ width: opt.dot + 'px', height: opt.dot + 'px' }" aria-hidden="true" />
              <span class="size-pill__label">{{ opt.label }}</span>
            </label>
          </div>
        </label>

        <div class="launcher-modes">
          <label class="b-choice-card" :class="{ on: configModel.launcherMode === 'icon' }">
            <input v-model="configModel.launcherMode" type="radio" value="icon" />
            <span class="b-choice-title">Icon ảnh</span>
            <span class="b-micro b-choice-hint">Mặc định ảnh đại diện bot</span>
          </label>
          <label class="b-choice-card" :class="{ on: configModel.launcherMode === 'text' }">
            <input v-model="configModel.launcherMode" type="radio" value="text" />
            <span class="b-choice-title">Chữ</span>
            <span class="b-micro b-choice-hint">VD: Chat, Hỗ trợ</span>
          </label>
        </div>

        <div v-if="configModel.launcherMode === 'text'" class="launcher-text-field">
          <label class="b-field">
            <span>Nhãn nút</span>
            <input v-model="configModel.launcherLabel" class="b-input" type="text" maxlength="40" placeholder="Chat" />
          </label>
        </div>

        <div v-else class="launcher-icon-block">
          <div class="launcher-icon-row">
            <img
              :src="launcherPreviewSrc"
              alt=""
              class="launcher-preview"
              :width="launcherPreviewPx"
              :height="launcherPreviewPx"
            />
            <div class="launcher-icon-actions">
              <label class="b-btn b-btn--ghost b-btn--sm icon-pick">
                <input type="file" class="b-file-input" accept="image/jpeg,image/png,image/webp,image/gif" :disabled="iconBusy" @change="onIconPick" />
                {{ iconBusy ? 'Đang tải…' : 'Tải icon' }}
              </label>
              <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="useBotAvatar">
                Dùng ảnh bot
              </button>
            </div>
          </div>
          <label class="b-field">
            <span>URL icon (tuỳ chọn)</span>
            <input v-model="configModel.launcherIconUrl" class="b-input" type="url" placeholder="Để trống = ảnh đại diện bot" />
          </label>
        </div>
      </fieldset>

      <label class="b-field span-2">
        <span>Domain được phép (tuỳ chọn)</span>
        <textarea
          v-model="originsText"
          class="b-textarea"
          rows="3"
          placeholder="shop.example.com&#10;*.myshop.com&#10;Để trống = mọi website"
        />
        <small class="b-micro">Một domain mỗi dòng. Hỗ trợ <code>*.tenmien.com</code>.</small>
      </label>
    </div>

    <section class="embed-block">
      <div class="embed-head">
        <h3 class="setup-h">Mã nhúng</h3>
        <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="copySnippet">
          {{ copied ? 'Đã sao chép' : 'Sao chép' }}
        </button>
      </div>
      <p class="b-micro">Dán vào <code>&lt;/body&gt;</code> trên mọi trang cần hiện chat.</p>
      <pre class="embed-pre" tabindex="0">{{ embedSnippet }}</pre>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/api'
import { resolveBotAvatarUrl } from '@/utils/botAvatar'

const props = defineProps({
  bot: { type: Object, required: true },
  form: { type: Object, required: true },
  tabRouteSetup: { type: Object, required: true },
})

const LAUNCHER_SIZE_PX = { 1: 48, 2: 56, 3: 64, 4: 72, 5: 80 }

const launcherSizeOptions = [
  { value: 1, label: 'Rất nhỏ', dot: 10 },
  { value: 2, label: 'Nhỏ', dot: 12 },
  { value: 3, label: 'Vừa', dot: 14 },
  { value: 4, label: 'Lớn', dot: 16 },
  { value: 5, label: 'Rất lớn', dot: 18 },
]

const copied = ref(false)
const iconBusy = ref(false)
let copyTimer

const apiOrigin = computed(() =>
  String(import.meta.env.VITE_API_URL || 'http://localhost:2053/api').replace(/\/api\/?$/, ''),
)

const launcherPreviewPx = computed(() => {
  const n = Number(props.form.webWidgetConfig?.launcherSize)
  return LAUNCHER_SIZE_PX[n] || LAUNCHER_SIZE_PX[3]
})

const launcherPreviewSrc = computed(() => {
  const custom = String(props.form.webWidgetConfig?.launcherIconUrl || '').trim()
  if (custom) {
    if (/^https?:\/\//i.test(custom)) return custom
    return `${apiOrigin.value}${custom.startsWith('/') ? '' : '/'}${custom}`
  }
  return resolveBotAvatarUrl(props.bot)
})

function useBotAvatar() {
  props.form.webWidgetConfig.launcherIconUrl = ''
}

async function onIconPick(ev) {
  const file = ev.target?.files?.[0]
  ev.target.value = ''
  if (!file || iconBusy.value) return
  iconBusy.value = true
  try {
    const data = await api.bots.uploadWebWidgetIcon(props.bot.id, file)
    props.form.webWidgetConfig.launcherIconUrl = data?.launcherIconUrl || data?.url || ''
  } catch (e) {
    console.error(e)
  } finally {
    iconBusy.value = false
  }
}

const enabledModel = computed({
  get: () => Boolean(props.form.webWidgetEnabled),
  set: (v) => {
    props.form.webWidgetEnabled = v
  },
})

const configModel = computed(() => props.form.webWidgetConfig)

const WELCOME_MAX = 12

function syncWelcomeMeta() {
  const cfg = props.form.webWidgetConfig
  if (!cfg) return
  const lines = (Array.isArray(cfg.welcomeMessages) ? cfg.welcomeMessages : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
  cfg.welcomeText = lines[0] || ''
}

function ensureWelcomeInputs() {
  const cfg = props.form.webWidgetConfig
  if (!cfg) return
  let msgs = Array.isArray(cfg.welcomeMessages) ? cfg.welcomeMessages.map((s) => String(s ?? '')) : []
  if (!msgs.length) {
    const legacy = String(cfg.welcomeText || '').trim()
    msgs = legacy ? [legacy] : ['']
  }
  cfg.welcomeMessages = msgs.length > WELCOME_MAX ? msgs.slice(0, WELCOME_MAX) : msgs
  syncWelcomeMeta()
}

function addWelcomeMessage() {
  const list = props.form.webWidgetConfig?.welcomeMessages
  if (!Array.isArray(list) || list.length >= WELCOME_MAX) return
  list.push('')
}

function removeWelcomeMessage(idx) {
  const list = props.form.webWidgetConfig?.welcomeMessages
  if (!Array.isArray(list) || list.length <= 1) return
  list.splice(idx, 1)
  syncWelcomeMeta()
}

watch(() => props.bot?.id, ensureWelcomeInputs, { immediate: true })

watch(
  () => props.form.webWidgetConfig?.launcherSize,
  (v) => {
    const n = Number(v)
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      props.form.webWidgetConfig.launcherSize = 3
    }
  },
  { immediate: true },
)

const originsText = computed({
  get() {
    const list = props.form.webWidgetConfig?.allowedOrigins
    return Array.isArray(list) ? list.join('\n') : ''
  },
  set(raw) {
    const lines = String(raw || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    props.form.webWidgetConfig.allowedOrigins = lines
  },
})

const embedSnippet = computed(() => {
  if (props.bot.embedSnippet) return props.bot.embedSnippet
  const base = String(import.meta.env.VITE_API_URL || 'http://localhost:2053/api').replace(/\/api\/?$/, '')
  return `<script src="${base}/embed/botty-widget.js" data-bot="${props.bot.id}" async><\/script>`
})

async function copySnippet() {
  try {
    await navigator.clipboard.writeText(embedSnippet.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

watch(
  () => props.bot?.embedSnippet,
  () => {
    copied.value = false
  },
)
</script>

<style scoped>
.web-plugin-panel {
  max-width: 720px;
}

.plugin-warn {
  margin: 12px 0 0;
}

.plugin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
  margin-top: 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .plugin-grid {
    grid-template-columns: 1fr;
  }
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-hex {
  flex: 1;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 14px;
}

.color-swatch {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--b-border);
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
}

.embed-block {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--b-border);
}

.embed-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.setup-h {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.launcher-fieldset {
  margin: 4px 0 0;
  padding: 14px 14px 4px;
  border: 1px solid var(--b-border);
  border-radius: 12px;
}

.launcher-size-field {
  margin: 10px 0 0;
}

.size-pills {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-top: 6px;
}

@media (max-width: 620px) {
  .size-pills {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.size-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px 8px;
  border: 1px solid var(--b-border);
  border-radius: 10px;
  cursor: pointer;
  background: var(--b-surface);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.size-pill input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.size-pill.on {
  border-color: var(--b-accent, #2563eb);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--b-accent, #2563eb) 35%, transparent);
  background: color-mix(in srgb, var(--b-accent, #2563eb) 8%, var(--b-surface));
}

.size-pill__dot {
  border-radius: 50%;
  background: var(--b-accent, #2563eb);
  opacity: 0.85;
}

.size-pill__label {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  color: var(--b-text-muted, #64748b);
}

.size-pill.on .size-pill__label {
  color: var(--b-text, #0f172a);
}

.launcher-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 10px 0 12px;
}

@media (max-width: 520px) {
  .launcher-modes {
    grid-template-columns: 1fr;
  }
}

.launcher-text-field {
  margin-bottom: 4px;
}

.launcher-icon-block {
  margin-bottom: 4px;
}

.launcher-icon-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.launcher-preview {
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.35);
  border: 2px solid var(--b-border);
  background: var(--b-surface-2);
}

.launcher-icon-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-pick {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.welcome-block-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.welcome-block-hint {
  margin: 0 0 10px;
}

.welcome-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.welcome-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.welcome-idx {
  flex-shrink: 0;
  width: 1.5rem;
  font-size: 12px;
  font-weight: 700;
  color: var(--b-text-muted, #64748b);
  text-align: center;
}

.welcome-input {
  flex: 1;
  min-width: 0;
}

.welcome-remove {
  flex-shrink: 0;
}

.welcome-add {
  margin-top: 8px;
}

.embed-pre {
  margin: 10px 0 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12.5px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
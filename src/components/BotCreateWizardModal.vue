<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title" @click.self="tryClose">
      <div class="modal b-card">
        <header class="modal-head">
          <div>
            <p class="b-kicker">Tạo bot</p>
            <h2 id="wizard-title" class="b-title-sm">Thiết lập từng bước</h2>
          </div>
          <button type="button" class="close" aria-label="Đóng" @click="tryClose">×</button>
        </header>

        <ol class="steps" aria-label="Tiến trình">
          <li
            v-for="(s, i) in stepLabels"
            :key="s"
            :class="{ done: step > i + 1, on: step === i + 1 }"
          >
            <span class="num">{{ i + 1 }}</span>
            <span class="label">{{ s }}</span>
          </li>
        </ol>

        <section v-show="step === 1" class="body">
          <p class="b-caption">Đặt tên bot — khách sẽ thấy tên này trong ngữ cảnh hỗ trợ.</p>
          <label class="b-field">
            <span>Tên bot</span>
            <input
              v-model="form.name"
              class="b-input"
              type="text"
              placeholder="VD: Shop ABC — Messenger"
              autocomplete="off"
              @keydown.enter.prevent="nextFromStep1"
            />
          </label>
        </section>

        <section v-show="step === 2" class="body">
          <p class="b-caption">App Meta + Page + webhook. Có thể bỏ qua token và cấu hình đầy đủ ở tab Facebook sau.</p>
          <div class="wiz-grid">
            <label class="b-field">
              <span>App ID</span>
              <input v-model="form.facebookAppId" class="b-input" type="text" inputmode="numeric" autocomplete="off" />
            </label>
            <label class="b-field">
              <span>App Secret</span>
              <input
                v-model="form.facebookAppSecret"
                class="b-input"
                type="password"
                autocomplete="off"
                placeholder="Có thể thêm sau"
              />
            </label>
          </div>
          <label class="b-field">
            <span>Page ID</span>
            <input v-model="form.facebookPageId" class="b-input" type="text" inputmode="numeric" autocomplete="off" />
          </label>
          <label class="b-field">
            <span>Verify token</span>
            <input v-model="form.facebookVerifyToken" class="b-input" type="text" autocomplete="off" />
          </label>
          <label class="b-field">
            <span>Page Access Token</span>
            <input
              v-model="form.facebookPageAccessToken"
              class="b-input"
              type="password"
              autocomplete="off"
              placeholder="EAA… (có thể thêm sau)"
            />
          </label>
          <div v-if="bot?.webhookUrl" class="b-codebox">
            <label>Webhook URL</label>
            <code>{{ bot.webhookUrl }}</code>
            <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="copyWebhook">Sao chép</button>
          </div>
        </section>

        <section v-show="step === 3" class="body">
          <p class="b-caption">Chọn cách bot gọi Gemini.</p>
          <label class="mode-opt">
            <input v-model="form.aiProvider" type="radio" value="own" />
            Tự nhập Gemini API key
          </label>
          <label class="mode-opt">
            <input v-model="form.aiProvider" type="radio" value="botty" />
            Gói Botty AI (không cần key)
          </label>

          <template v-if="form.aiProvider === 'own'">
            <label class="b-field">
              <span class="key-label-row">
                Gemini API key
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Lấy key</a>
              </span>
              <div class="input-reveal">
                <input
                  v-model="form.geminiApiKey"
                  class="b-input input-reveal__input"
                  :type="showGeminiKey ? 'text' : 'password'"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="AIza…"
                />
                <button
                  type="button"
                  class="input-reveal__btn"
                  :aria-label="showGeminiKey ? 'Ẩn API key' : 'Hiện API key'"
                  @click="showGeminiKey = !showGeminiKey"
                >
                  <EyeOff v-if="showGeminiKey" :size="18" aria-hidden="true" />
                  <Eye v-else :size="18" aria-hidden="true" />
                </button>
              </div>
            </label>
          </template>
          <div v-else class="upgrade-hint b-card b-card-pad">
            <p class="b-caption">Cần gói Botty AI đang hoạt động (hội thoại tính theo tháng, từ 149k).</p>
            <RouterLink to="/pricing" class="b-btn b-btn--ghost b-btn--sm" target="_blank">Xem gói</RouterLink>
          </div>

          <label class="b-field">
            <span>Model</span>
            <input v-model="form.geminiModel" class="b-input" type="text" placeholder="gemini-3.1-flash-lite" />
          </label>
        </section>

        <section v-show="step === 4" class="body done">
          <p class="b-title-sm">Bot đã sẵn sàng cấu hình thêm</p>
          <p class="b-caption">Mã bot:</p>
          <code class="bot-id">{{ bot?.id }}</code>
          <p class="b-caption">
            Tiếp tục thêm tài liệu, kho hàng và instruction trong màn cấu hình chi tiết.
          </p>
        </section>

        <p v-if="error" class="b-msg-err footer-msg">{{ error }}</p>

        <footer class="modal-foot">
          <button v-if="step > 1 && step < 4" type="button" class="b-btn b-btn--ghost" :disabled="saving" @click="back">
            Quay lại
          </button>
          <button v-if="step === 1" type="button" class="b-btn b-btn--primary" :disabled="saving || !form.name.trim()" @click="nextFromStep1">
            {{ saving ? 'Đang tạo…' : 'Tiếp theo' }}
          </button>
          <button v-else-if="step === 2" type="button" class="b-btn b-btn--primary" :disabled="saving || !form.facebookVerifyToken.trim()" @click="nextFromStep2">
            {{ saving ? 'Đang lưu…' : 'Tiếp theo' }}
          </button>
          <button
            v-else-if="step === 3"
            type="button"
            class="b-btn b-btn--primary"
            :disabled="saving || !canFinishGeminiStep"
            @click="nextFromStep3"
          >
            {{ saving ? 'Đang lưu…' : 'Tiếp theo' }}
          </button>
          <template v-else>
            <button type="button" class="b-btn b-btn--ghost" @click="finish(false)">Đóng</button>
            <button type="button" class="b-btn b-btn--primary" @click="finish(true)">Mở cấu hình chi tiết</button>
          </template>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api, ApiError, apiMessage } from '@/api'
import { confirm as askConfirm } from '@/composables/useConfirm'
import { attachEncryptedGeminiKey } from '@/utils/geminiKeyCrypto'
import { ensureGeminiPinForUser } from '@/utils/ensureGeminiPin'
import { saveLocalGeminiPin } from '@/utils/geminiPinLocal'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'created'])

const router = useRouter()
const auth = useAuthStore()

const canFinishGeminiStep = computed(() => {
  if (form.aiProvider === 'botty') return Boolean(auth.user?.bottyPlan?.active)
  if (!auth.user?.hasGeminiPin) return false
  return Boolean(form.geminiApiKey.trim()) && auth.user?.hasGeminiPin
})
const showGeminiKey = ref(false)
const step = ref(1)
const saving = ref(false)
const error = ref('')
const bot = ref(null)

const stepLabels = ['Tên bot', 'Facebook', 'Gemini', 'Hoàn tất']

const form = reactive({
  name: '',
  facebookPageId: '',
  facebookAppId: '',
  facebookAppSecret: '',
  facebookVerifyToken: '',
  facebookPageAccessToken: '',
  aiProvider: 'own',
  geminiApiKey: '',
  geminiKeyPin: '',
  geminiModel: 'gemini-3.1-flash-lite',
})

function reset() {
  step.value = 1
  saving.value = false
  error.value = ''
  bot.value = null
  form.name = ''
  form.facebookPageId = ''
  form.facebookAppId = ''
  form.facebookAppSecret = ''
  form.facebookVerifyToken = ''
  form.facebookPageAccessToken = ''
  form.aiProvider = 'own'
  form.geminiApiKey = ''
  form.geminiModel = 'gemini-3.1-flash-lite'
  showGeminiKey.value = false
}

watch(
  () => props.open,
  (v) => {
    if (v) reset()
  },
)

function close() {
  emit('update:open', false)
}

async function tryClose() {
  if (step.value > 1 && bot.value && step.value < 4) {
    const ok = await askConfirm({
      title: 'Đóng wizard',
      message: 'Đóng wizard? Bot đã tạo — bạn có thể cấu hình tiếp trong danh sách.',
      confirmLabel: 'Đóng',
      danger: false,
    })
    if (!ok) return
  }
  close()
}

async function nextFromStep1() {
  if (!form.name.trim() || saving.value) return
  error.value = ''
  saving.value = true
  try {
    const data = await api.bots.create({ name: form.name.trim() })
    bot.value = data.bot
    form.facebookVerifyToken = data.bot?.facebookVerifyToken || ''
    step.value = 2
    emit('created')
  } catch (e) {
    error.value = e instanceof ApiError ? apiMessage(e) : 'Không tạo được bot. Thử lại.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function patchBot(body) {
  if (!bot.value?.id) throw new Error('NO_BOT')
  const data = await api.bots.update(bot.value.id, body)
  bot.value = data.bot
  if (data.bot?.facebookVerifyToken) {
    form.facebookVerifyToken = data.bot.facebookVerifyToken
  }
}

async function nextFromStep2() {
  if (!form.facebookVerifyToken.trim() || saving.value) return
  error.value = ''
  saving.value = true
  try {
    const body = {
      facebookVerifyToken: form.facebookVerifyToken.trim(),
      facebookPageId: form.facebookPageId.trim(),
      facebookAppId: form.facebookAppId.trim(),
    }
    if (form.facebookAppSecret.trim()) body.facebookAppSecret = form.facebookAppSecret.trim()
    if (form.facebookPageAccessToken.trim()) {
      body.facebookPageAccessToken = form.facebookPageAccessToken.trim()
    }
    await patchBot(body)
    step.value = 3
  } catch (e) {
    error.value = 'Lưu Facebook thất bại.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function nextFromStep3() {
  if (!canFinishGeminiStep.value || saving.value) return
  error.value = ''
  saving.value = true
  try {
    const body = {
      aiProvider: form.aiProvider,
      geminiModel: form.geminiModel.trim() || 'gemini-3.1-flash-lite',
      status: 'active',
    }
    if (form.aiProvider === 'own') {
      const pin = await ensureGeminiPinForUser(auth.user?.id)
      await attachEncryptedGeminiKey(body, form.geminiApiKey, pin)
      saveLocalGeminiPin(auth.user?.id, pin)
    }
    await patchBot(body)
    step.value = 4
    emit('created')
  } catch (e) {
    error.value = 'Lưu Gemini thất bại.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

function back() {
  error.value = ''
  if (step.value > 1) step.value -= 1
}

function finish(goDetail) {
  const id = bot.value?.id
  close()
  if (goDetail && id) router.push(`/bots/${id}/test`)
}

function copyWebhook() {
  if (bot.value?.webhookUrl) navigator.clipboard?.writeText(bot.value.webhookUrl)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.modal {
  width: min(520px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px 12px;
  border-bottom: 1px solid var(--b-border);
}

.close {
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: var(--b-muted);
  cursor: pointer;
  padding: 0 4px;
}

.close:hover {
  color: var(--b-ink);
}

.mode-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 14px;
  cursor: pointer;
}

.upgrade-hint {
  margin: 12px 0;
  display: grid;
  gap: 8px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  list-style: none;
  margin: 0;
  padding: 14px 22px;
  border-bottom: 1px solid var(--b-border);
  background: var(--b-surface-2);
}

.steps li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--b-muted);
}

.steps li .num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--b-border-strong);
  background: #fff;
}

.steps li.on {
  color: var(--b-accent-hover);
}

.steps li.on .num {
  background: var(--b-accent);
  border-color: var(--b-accent);
  color: #fff;
}

.steps li.done .num {
  background: var(--b-accent-soft);
  border-color: var(--b-accent);
  color: var(--b-accent);
}

.body {
  padding: 20px 22px;
  flex: 1;
}

.body.done {
  display: grid;
  gap: 8px;
}

.bot-id {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  word-break: break-all;
  color: var(--b-ink-secondary);
}

.footer-msg {
  padding: 0 22px;
}

.wiz-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

@media (max-width: 520px) {
  .wiz-grid {
    grid-template-columns: 1fr;
  }
}

.modal-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px 20px;
  border-top: 1px solid var(--b-border);
}

.key-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.key-label-row a {
  font-size: 12px;
  font-weight: 500;
}

.input-reveal {
  position: relative;
  display: flex;
  align-items: stretch;
}

.input-reveal__input {
  width: 100%;
  padding-right: 44px;
}

.input-reveal__btn {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 0 10px 10px 0;
  background: transparent;
  color: var(--b-muted);
  cursor: pointer;
}

.input-reveal__btn:hover {
  color: var(--b-ink);
}
</style>
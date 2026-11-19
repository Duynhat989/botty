<template>
  <div class="test-shell" key="test">
    <div class="test-stage">
      <header class="test-compact-bar">
        <button
          type="button"
          class="tools-open-btn"
          aria-haspopup="dialog"
          :aria-expanded="toolsOpen"
          @click="openTools"
        >
          Gợi ý & công cụ
        </button>
        <span class="test-compact-meta">{{ bot.name }}</span>
      </header>

      <div class="test-stage-main">
      <section class="session-panel" aria-labelledby="session-heading">
        <h2 id="session-heading" class="session-panel-title">Phiên chat</h2>
        <p class="session-panel-meta">Bot nhớ tin trong phiên này (lưu server).</p>
        <code class="session-chip">{{ sessionShort }}</code>
        <p class="side-stat"><strong>{{ chatMessages.length }}</strong> tin trong phiên</p>
        <button
          type="button"
          class="b-btn b-btn--primary b-btn--sm session-new-btn"
          :disabled="testLoading"
          @click="startNewTestSession"
        >
          Tạo phiên mới
        </button>
        <p class="b-micro session-new-hint">Phiên mới = bot không nhớ tin phiên cũ (ngôn ngữ theo tin đầu tiên mới).</p>

        <RouterLink :to="tabRoute('dashboard')" class="b-btn b-btn--ghost b-btn--sm session-dash-link">
          Xem Dashboard
        </RouterLink>

        <div v-if="!bot.hasGeminiKey" class="warn-box session-warn">
          <template v-if="bot.usesBottyAi">
            Bot đang chế độ <strong>Botty AI</strong> nhưng chưa có gói hoạt động.
            <RouterLink to="/pricing">Nâng cấp gói</RouterLink>
            hoặc đổi sang Gemini key trong
            <RouterLink :to="tabRoute('setup', 'gemini')">Cấu hình</RouterLink>.
          </template>
          <template v-else>
            Chưa có Gemini API key.
            <RouterLink :to="tabRoute('setup', 'gemini')">Cấu hình Gemini</RouterLink>
            và lưu.
          </template>
        </div>
      </section>

      <section class="phone-panel" aria-labelledby="phone-heading">
        <header class="phone-panel-head">
          <h2 id="phone-heading" class="main-title">Hội thoại mẫu</h2>
          <p class="main-caption">Tỷ lệ điện thoại — thử như khách Messenger</p>
        </header>

        <div class="phone-frame" role="region" aria-label="Khung chat mẫu">
          <div class="phone-notch" aria-hidden="true" />
          <div class="phone-screen">
            <div class="phone-status-bar" aria-hidden="true">
              <span>Messenger</span>
              <span class="phone-signal">●●●</span>
            </div>

            <div class="chat-shell">
              <div ref="chatScroll" class="chat-log" role="log" aria-live="polite">
                <p v-if="!chatMessages.length && !testLoading" class="chat-empty b-caption">
                  Bấm <strong>Gợi ý & công cụ</strong> hoặc gõ tin nhắn khách mẫu.
                </p>
                <TransitionGroup name="bubble" tag="div" class="chat-stream">
                  <div
                    v-for="(m, i) in chatMessages"
                    :key="'m-' + i"
                    class="chat-bubble"
                    :class="m.role"
                  >
                    <span class="chat-role">{{ m.role === 'user' ? 'Khách' : bot.name }}</span>
                    <p v-if="m.text" class="chat-text">{{ m.text }}</p>
                    <div v-if="m.imageUrls?.length" class="chat-images">
                      <img
                        v-for="(url, j) in m.imageUrls"
                        :key="'img-' + j"
                        :src="url"
                        alt="Ảnh khách gửi"
                        class="chat-user-img"
                        loading="lazy"
                      />
                    </div>
                    <img
                      v-if="m.qrImageUrl"
                      :src="m.qrImageUrl"
                      alt="Mã QR thanh toán"
                      class="payment-qr"
                      loading="lazy"
                    />
                  </div>
                </TransitionGroup>
                <div v-if="testLoading" class="chat-bubble bot typing">
                  <span class="chat-role">{{ bot.name }}</span>
                  <span class="typing-dots" aria-label="Bot đang trả lời">
                    <span /><span /><span />
                  </span>
                </div>
              </div>

              <div v-if="pendingImages.length" class="compose-previews">
                <div v-for="(url, i) in pendingImages" :key="'p-' + i" class="compose-thumb">
                  <img :src="url" alt="" />
                  <button type="button" class="compose-thumb-remove" aria-label="Xóa ảnh" @click="removePendingImage(i)">
                    ×
                  </button>
                </div>
              </div>

              <form class="chat-compose" @submit.prevent="sendTest">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="compose-file"
                  @change="onPickImages"
                />
                <button
                  type="button"
                  class="compose-attach"
                  title="Gửi ảnh"
                  :disabled="testLoading || !bot.hasGeminiKey || pendingImages.length >= maxComposeImages"
                  @click="fileInputRef?.click()"
                >
                  Ảnh
                </button>
                <textarea
                  ref="composeAreaRef"
                  v-model="testInput"
                  class="b-input chat-input chat-textarea"
                  rows="1"
                  placeholder="Nhắn tin… (Enter gửi, Shift+Enter xuống dòng)"
                  :disabled="testLoading || !bot.hasGeminiKey"
                  autocomplete="off"
                  @keydown="onComposeKeydown"
                  @input="resizeCompose"
                />
                <button
                  type="submit"
                  class="b-btn b-btn--primary b-btn--sm compose-send"
                  :disabled="testLoading || !canSendTest || !bot.hasGeminiKey"
                >
                  {{ testLoading ? '…' : 'Gửi' }}
                </button>
              </form>
              <p v-if="testError" class="b-msg-err chat-err">{{ testError }}</p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="toolsOpen"
        class="tools-popup-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tools-popup-title"
      >
        <button type="button" class="tools-popup-backdrop" aria-label="Đóng" @click="closeTools" />
        <div class="tools-popup-panel">
          <header class="tools-popup-head">
            <div class="side-brand">
              <img src="/logo.png" alt="" width="28" height="28" />
              <div>
                <p id="tools-popup-title" class="side-title">Thử phản hồi</p>
                <p class="side-sub">{{ bot.name }}</p>
              </div>
            </div>
            <button type="button" class="tools-close-btn" aria-label="Đóng" @click="closeTools">×</button>
          </header>

          <div class="tools-popup-body">
            <section class="side-block">
              <h3 class="side-h">Trạng thái</h3>
              <ul class="side-list">
                <li>
                  <span class="dot" :class="bot.hasGeminiKey ? 'ok' : 'err'" />
                  Gemini {{ bot.hasGeminiKey ? 'OK' : 'Thiếu key' }}
                </li>
                <li>
                  <span class="dot" :class="bot.orderClosingEnabled ? 'ok' : 'off'" />
                  Chốt đơn {{ bot.orderClosingEnabled ? 'Bật' : 'Tắt' }}
                </li>
                <li v-if="bot.shopIndustryLabel">
                  <span class="dot ok" />
                  Ngành {{ bot.shopIndustryLabel }}
                </li>
              </ul>
            </section>

            <nav class="side-block" aria-label="Cấu hình liên quan">
              <h3 class="side-h">Đi tới</h3>
              <RouterLink
                v-for="link in quickLinks"
                :key="link.to"
                :to="link.to"
                class="side-link"
                @click="closeTools"
              >
                {{ link.label }}
              </RouterLink>
            </nav>

            <section class="side-block">
              <h3 class="side-h">Gợi ý tin thử</h3>
              <button
                v-for="(sample, i) in samples"
                :key="i"
                type="button"
                class="sample-btn"
                :disabled="testLoading || !bot.hasGeminiKey"
                @click="useSample(sample)"
              >
                {{ sample }}
              </button>
            </section>
          </div>

          <footer class="tools-popup-foot">
            <button
              type="button"
              class="b-btn b-btn--ghost b-btn--sm side-clear"
              :disabled="!chatMessages.length"
              @click="clearTestChat"
            >
              Xóa hội thoại
            </button>
            <button type="button" class="b-btn b-btn--primary b-btn--sm" @click="closeTools">Đóng</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/api'
import { confirm as askConfirm } from '@/composables/useConfirm'
const props = defineProps({
  bot: { type: Object, required: true },
  tabRoute: { type: Function, required: true },
})

const testInput = ref('')
const testLoading = ref(false)
const testError = ref('')
const chatMessages = ref([])
const chatScroll = ref(null)
const composeAreaRef = ref(null)
const fileInputRef = ref(null)
const pendingImages = ref([])
const testSessionId = ref('')
const toolsOpen = ref(false)
const maxComposeImages = 4

const canSendTest = computed(
  () => Boolean(testInput.value.trim() || pendingImages.value.length),
)

const samples = [
  'Shop còn hàng size M không ạ?',
  'Cho mình xem giá và màu còn lại.',
  'Mình muốn chốt 1 cái, ship Q1.',
  'Freeship đơn từ bao nhiêu?',
]

const quickLinks = computed(() => [
  { label: 'Gemini', to: props.tabRoute('setup', 'gemini') },
  { label: 'Kho hàng', to: props.tabRoute('inventory') },
  { label: 'Giọng điệu', to: props.tabRoute('setup', 'voice') },
  { label: 'Chốt đơn', to: props.tabRoute('setup', 'orders') },
])

const sessionShort = computed(() => {
  const s = testSessionId.value || ''
  if (s.length <= 12) return s || '…'
  return `${s.slice(0, 8)}…${s.slice(-4)}`
})

function sessionStorageKey() {
  return `botty-test-session-${props.bot.id}`
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function ensureTestSessionId() {
  const key = sessionStorageKey()
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = createSessionId()
    sessionStorage.setItem(key, id)
  }
  testSessionId.value = id
  return id
}

function persistTestSessionId(id) {
  sessionStorage.setItem(sessionStorageKey(), id)
  testSessionId.value = id
}

async function startNewTestSession() {
  if (chatMessages.value.length) {
    const ok = await askConfirm({
      title: 'Tạo phiên mới',
      message: 'Tạo phiên mới? Hội thoại hiện tại sẽ ẩn (vẫn lưu server theo mã phiên cũ).',
      confirmLabel: 'Tạo phiên',
      danger: false,
    })
    if (!ok) return
  }
  const id = createSessionId()
  persistTestSessionId(id)
  chatMessages.value = []
  testError.value = ''
  testInput.value = ''
  pendingImages.value = []
}

let paymentPollTimer = null

function stopPaymentPoll() {
  if (paymentPollTimer) {
    clearInterval(paymentPollTimer)
    paymentPollTimer = null
  }
}

function startPaymentPoll() {
  stopPaymentPoll()
  let ticks = 0
  paymentPollTimer = setInterval(async () => {
    ticks += 1
    if (ticks > 36) {
      stopPaymentPoll()
      return
    }
    const sid = ensureTestSessionId()
    try {
      const billing = await api.bots.chatBillingStatus(props.bot.id, {
        channel: 'test',
        sessionId: sid,
      })
      const st = billing?.focus?.status
      if (st === 'paid' || st === 'cancelled') {
        stopPaymentPoll()
        await loadTestHistory({ silent: true })
        return
      }
    } catch {
      /* ignore poll errors */
    }
    await loadTestHistory({ silent: true })
  }, 5000)
}

async function loadTestHistory(opts = {}) {
  if (!props.bot.hasGeminiKey) return
  const sid = ensureTestSessionId()
  try {
    const data = await api.bots.chatHistory(props.bot.id, sid)
    const prevLen = chatMessages.value.length
    chatMessages.value = Array.isArray(data?.messages)
      ? data.messages.map((m) => ({
          role: m.role,
          text: m.text,
          qrImageUrl: m.qrImageUrl || null,
          imageUrls: Array.isArray(m.imageUrls) ? m.imageUrls : [],
        }))
      : []
    if (
      opts.silent &&
      chatMessages.value.length > prevLen &&
      chatMessages.value[chatMessages.value.length - 1]?.text?.includes('đã ghi nhận')
    ) {
      stopPaymentPoll()
      await nextTick()
      chatScroll.value?.scrollTo?.({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })
    }
  } catch (e) {
    if (!opts.silent) console.error(e)
  }
}

async function clearTestChat() {
  const sid = testSessionId.value || ensureTestSessionId()
  const ok = await askConfirm({
    title: 'Xóa hội thoại',
    message: 'Xóa hội thoại thử? Bot sẽ không nhớ các tin trước trong phiên này.',
    confirmLabel: 'Xóa',
    danger: true,
  })
  if (!ok) return
  try {
    await api.bots.clearChatHistory(props.bot.id, sid)
    chatMessages.value = []
    testError.value = ''
  } catch (e) {
    testError.value = 'Không xóa được lịch sử.'
    console.error(e)
  }
}

function openTools() {
  toolsOpen.value = true
}

function closeTools() {
  toolsOpen.value = false
}

function onToolsKeydown(e) {
  if (e.key === 'Escape') closeTools()
}

watch(toolsOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', onToolsKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onToolsKeydown)
    document.body.style.overflow = ''
  }
})

function useSample(text) {
  testInput.value = text
  closeTools()
  nextTick(resizeCompose)
}

function onComposeKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendTest()
  }
}

function resizeCompose() {
  const el = composeAreaRef.value
  if (!el) return
  el.style.height = 'auto'
  const next = Math.min(el.scrollHeight, 120)
  el.style.height = `${Math.max(36, next)}px`
}

function removePendingImage(index) {
  pendingImages.value = pendingImages.value.filter((_, i) => i !== index)
}

async function onPickImages(e) {
  const input = e.target
  const files = Array.from(input?.files || [])
  input.value = ''
  if (!files.length) return
  testError.value = ''

  const room = maxComposeImages - pendingImages.value.length
  if (room <= 0) {
    testError.value = `Tối đa ${maxComposeImages} ảnh mỗi tin.`
    return
  }

  const maxBytes = 10 * 1024 * 1024
  for (const file of files.slice(0, room)) {
    if (file.size > maxBytes) {
      testError.value = 'Ảnh quá lớn (tối đa ~10MB).'
      continue
    }
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      pendingImages.value.push(dataUrl)
    } catch {
      testError.value = 'Không đọc được ảnh. Thử JPG/PNG khác.'
    }
  }
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

async function sendTest() {
  const text = testInput.value.trim()
  const images = [...pendingImages.value]
  if ((!text && !images.length) || testLoading.value || !props.bot.hasGeminiKey) return
  testError.value = ''
  chatMessages.value.push({
    role: 'user',
    text,
    imageUrls: images.length ? images : [],
  })
  testInput.value = ''
  pendingImages.value = []
  nextTick(resizeCompose)
  testLoading.value = true
  await nextTick()
  chatScroll.value?.scrollTo?.({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })

  try {
    const sid = testSessionId.value || ensureTestSessionId()
    const data = await api.bots.test(props.bot.id, text, sid, images)
    chatMessages.value.push({
      role: 'bot',
      text: data.reply || '—',
      qrImageUrl: data.paymentQrImageUrl || null,
    })
    if (data.paymentQrImageUrl) startPaymentPoll()
  } catch (e) {
    const code = e?.messageCode || e?.code
    if (code === 'BOTTY_PLAN_REQUIRED') {
      testError.value = 'Cần gói Botty AI — xem trang Gói cước để nâng cấp.'
    } else if (code === 'BOTTY_MONTHLY_LIMIT' || code === 'BOTTY_DAILY_LIMIT') {
      testError.value = 'Đã hết hạn mức hội thoại trong tháng. Nâng gói hoặc chờ tháng mới.'
    } else {
      testError.value = 'Không gửi được thử. Kiểm tra Gemini / gói Botty hoặc thử lại.'
    }
    console.error(e)
  } finally {
    testLoading.value = false
    await nextTick()
    chatScroll.value?.scrollTo?.({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })
  }
}

onMounted(() => {
  loadTestHistory()
  nextTick(resizeCompose)
})
onUnmounted(() => {
  stopPaymentPoll()
  window.removeEventListener('keydown', onToolsKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.test-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: #fff;
  box-shadow: var(--b-shadow);
  overflow: hidden;
}

.test-stage {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: clamp(8px, 1.5vw, 16px);
  min-width: 0;
  min-height: 0;
  flex: 1;
  height: 100%;
  overflow: hidden;
  padding: 10px 16px 14px;
  background: linear-gradient(180deg, #fafcfb 0%, #fff 100%);
}

.test-compact-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  flex-shrink: 0;
}

.tools-open-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--b-border);
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.tools-open-btn:hover {
  border-color: #a7f3c0;
  background: var(--b-accent-soft);
  color: var(--b-ink);
}

.test-compact-meta {
  font-size: 12px;
  color: var(--b-muted);
}

.test-stage-main {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: clamp(12px, 2vw, 24px);
  flex: 1;
  min-height: 0;
  width: 100%;
}

.session-panel {
  flex: 0 0 min(260px, 34%);
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding: 14px 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: #fff;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
}

.session-panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--b-ink);
}

.session-panel-meta {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-muted);
}

.session-dash-link {
  margin-top: 4px;
  width: 100%;
  justify-content: center;
}

.session-warn {
  margin-top: auto;
  margin-bottom: 0;
}

.phone-panel {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: min(420px, 100%);
  overflow: hidden;
  container-type: size;
  container-name: phone-slot;
}

.phone-panel-head {
  width: 100%;
  text-align: center;
  flex-shrink: 0;
}

.phone-frame {
  position: relative;
  flex: 0 1 auto;
  min-height: 0;
  min-width: 0;
  height: 100cqb;
  width: min(380px, 100cqi, calc(100cqb * 9 / 19.5));
  max-height: 100cqb;
  max-width: min(380px, 100cqi);
  aspect-ratio: 9 / 19.5;
  align-self: center;
  padding: 10px;
  border-radius: 32px;
  background: linear-gradient(145deg, #2d3748 0%, #1a202c 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 20px 48px -12px rgba(15, 23, 42, 0.35);
}

.phone-notch {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 22px;
  border-radius: 0 0 14px 14px;
  background: #1a202c;
  z-index: 2;
  pointer-events: none;
}

.phone-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 24px;
  overflow: hidden;
  background: #f0f4f2;
}

.phone-status-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 14px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--b-ink-secondary);
  background: #fff;
  border-bottom: 1px solid var(--b-border);
}

.phone-signal {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--b-accent);
}

.tools-popup-root {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: grid;
  place-items: center;
  padding: 16px;
}

.tools-popup-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  margin: 0;
  background: rgba(28, 20, 12, 0.42);
  backdrop-filter: blur(6px);
  cursor: pointer;
}

.tools-popup-panel {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
  max-height: min(88dvh, 720px);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid var(--b-border);
  background: linear-gradient(180deg, #f8faf9 0%, #fff 55%);
  box-shadow: 0 24px 56px -18px rgba(28, 20, 12, 0.28);
  overflow: hidden;
  animation: tools-pop-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tools-pop-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tools-popup-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--b-border);
  flex-shrink: 0;
}

.tools-popup-head .side-brand {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.tools-close-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 22px;
  line-height: 1;
  color: var(--b-muted);
  cursor: pointer;
}

.tools-close-btn:hover {
  background: #fff;
  color: var(--b-ink);
}

.tools-popup-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 8px;
}

.tools-popup-body .side-block:last-child {
  border-bottom: none;
}

.tools-popup-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--b-border);
  flex-shrink: 0;
}

.tools-popup-foot .side-clear {
  flex: 1;
  min-width: 140px;
}

.side-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--b-border);
}

.side-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--b-ink);
}

.side-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--b-muted);
}

.side-block {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.side-h {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--b-muted);
}

.side-meta {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-muted);
}

.session-chip {
  display: block;
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--b-border);
  word-break: break-all;
}

.side-stat {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--b-ink-secondary);
}

.side-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: var(--b-ink-secondary);
}

.side-list li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}

.dot.ok {
  background: var(--b-accent);
}

.dot.err {
  background: var(--b-danger);
}

.dot.off {
  background: #cbd5e1;
}

.side-link {
  display: block;
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--b-ink-secondary);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.side-link:hover {
  border-color: var(--b-border);
  background: #fff;
  color: var(--b-accent-hover);
}

.sample-btn {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--b-border);
  background: #fff;
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  color: var(--b-ink-secondary);
  cursor: pointer;
}

.sample-btn:hover:not(:disabled) {
  border-color: #a7f3c0;
  background: var(--b-accent-soft);
}

.sample-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.session-new-btn {
  width: 100%;
  margin-top: 10px;
}

.session-new-hint {
  margin: 8px 0 0;
  line-height: 1.4;
}

.main-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.main-caption {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--b-muted);
}

.warn-box {
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: var(--b-radius-sm);
  border: 1px solid #fde68a;
  background: var(--b-warn-soft);
  font-size: 12.5px;
  color: var(--b-warn-ink);
  margin-bottom: 6px;
}

.warn-box a {
  color: var(--b-accent);
  font-weight: 600;
}

.chat-shell {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 6px;
  overflow: hidden;
  padding: 0 8px 8px;
}

.chat-log {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding: 8px 6px;
  border: none;
  border-radius: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-stream {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.chat-stream .chat-bubble.user {
  align-self: flex-end;
}

.chat-stream .chat-bubble.bot {
  align-self: flex-start;
}

.chat-empty {
  margin: auto;
  text-align: center;
}

.chat-bubble {
  max-width: 92%;
  padding: 8px 11px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.chat-bubble.user {
  border-color: #c6e9d4;
  background: var(--b-accent-soft);
}

.chat-role {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--b-muted);
  margin-bottom: 4px;
}

.chat-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.payment-qr {
  display: block;
  margin-top: 10px;
  max-width: min(220px, 100%);
  height: auto;
  border-radius: 10px;
  border: 1px solid var(--b-border);
  background: #fff;
}

.bubble-enter-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.bubble-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.typing-dots {
  display: inline-flex;
  gap: 5px;
  padding: 4px 2px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.1s ease-in-out infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.compose-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 4px;
}

.compose-thumb {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--b-border);
  background: #fff;
}

.compose-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compose-thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.compose-file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.chat-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.chat-user-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}

.chat-compose {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding: 8px;
  border: 1px solid var(--b-border);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.06);
}

.compose-attach {
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: #f8faf9;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-ink-secondary);
  cursor: pointer;
}

.compose-attach:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compose-attach:not(:disabled):hover {
  border-color: #a7f3c0;
  background: var(--b-accent-soft);
}

.chat-textarea {
  resize: none;
  min-height: 36px;
  max-height: 120px;
  line-height: 1.4;
  overflow-y: auto;
  padding-top: 8px;
  padding-bottom: 8px;
}

.compose-send {
  flex-shrink: 0;
  align-self: flex-end;
}

.chat-err {
  margin: 0 4px;
  font-size: 12px;
}

.chat-compose .chat-input {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  border: none;
  background: transparent;
  box-shadow: none;
}

.chat-compose .chat-input:focus {
  outline: none;
  box-shadow: none;
}

@media (max-width: 900px) {
  .test-stage {
    padding: 10px 12px 12px;
  }

  .test-stage-main {
    flex-direction: column;
    align-items: stretch;
    min-height: 0;
  }

  .session-panel {
    flex: 0 0 auto;
    max-width: none;
    width: 100%;
    max-height: min(28dvh, 220px);
  }

  .phone-panel {
    max-width: none;
    flex: 1 1 0;
    min-height: 0;
  }

  .phone-panel-head {
    flex-shrink: 0;
  }

  .phone-frame {
    width: min(340px, 100cqi, calc(100cqb * 9 / 19.5));
    max-width: min(340px, 100cqi);
    margin: 0 auto;
  }

  .tools-popup-root {
    place-items: end center;
    padding: 12px;
  }

  .tools-popup-panel {
    width: 100%;
    max-height: min(86dvh, 640px);
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
}

@supports not (height: 1cqb) {
  .phone-frame {
    flex: 1 1 0;
    height: 100%;
    width: auto;
    max-height: 100%;
    max-width: min(380px, 100%);
  }
}

@media (prefers-reduced-div: reduce) {
  .bubble-enter-active {
    transition: opacity 0.15s ease;
  }

  .bubble-enter-from {
    transform: none;
  }

  .typing-dots span {
    animation: none;
    opacity: 0.7;
  }
}
</style>
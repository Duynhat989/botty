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
        <header class="session-head">
          <p class="session-kicker">Phiên thử</p>
          <h2 id="session-heading" class="session-panel-title">Bộ nhớ chat</h2>
          <p class="session-panel-meta">Lịch sử gắn với mã phiên — bot dùng để trả lời liên tục.</p>
        </header>

        <div class="session-card">
          <div class="session-metric">
            <span class="session-metric-value">{{ chatMessages.length }}</span>
            <span class="session-metric-label">tin trong phiên</span>
          </div>

          <div class="session-id-block">
            <span class="session-id-label">Mã phiên</span>
            <div class="session-id-row">
              <code class="session-chip" :title="fullSessionId">{{ sessionShort }}</code>
              <button
                type="button"
                class="session-copy"
                :disabled="!fullSessionId"
                @click="copySessionId"
              >
                {{ copySessionOk ? 'Đã chép' : 'Sao chép' }}
              </button>
            </div>
          </div>
        </div>

        <div class="session-actions">
          <button
            type="button"
            class="b-btn b-btn--primary b-btn--sm"
            :disabled="testLoading"
            @click="startNewTestSession"
          >
            Phiên mới
          </button>
          <RouterLink :to="tabRoute('dashboard')" class="b-btn b-btn--ghost b-btn--sm">
            Dashboard
          </RouterLink>
        </div>
        <p class="b-caption session-new-hint">
          Phiên mới: bot quên tin cũ; ngôn ngữ trả lời lấy theo tin khách đầu tiên của phiên đó.
        </p>

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

      <section class="phone-panel" aria-label="Thử phản hồi">
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
                  Phiên mới: bot gửi <strong>chào phiên</strong> trước (nếu bật trong Cấu hình). Sau đó gõ tin khách mẫu.
                </p>
                <div v-else class="chat-log-anchor">
                  <div class="chat-stream">
                    <div
                      v-for="m in chatMessages"
                      :key="m._key"
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
                          @load="scrollChatToBottom('auto')"
                        />
                      </div>
                      <img
                        v-if="m.qrImageUrl"
                        :src="m.qrImageUrl"
                        alt="Mã QR thanh toán"
                        class="payment-qr"
                        loading="lazy"
                        @load="scrollChatToBottom('auto')"
                      />
                    </div>
                  </div>
                  <div v-if="testLoading" class="chat-bubble bot typing">
                    <span class="chat-role">{{ bot.name }}</span>
                    <span class="typing-dots" aria-label="Bot đang trả lời">
                      <span /><span /><span />
                    </span>
                  </div>
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
                  aria-label="Đính kèm ảnh"
                  title="Đính kèm ảnh"
                  :disabled="testLoading || !bot.hasGeminiKey || pendingImages.length >= maxComposeImages"
                  @click="fileInputRef?.click()"
                >
                  <ImagePlus :size="20" :stroke-width="2" aria-hidden="true" />
                </button>
                <textarea
                  ref="composeAreaRef"
                  v-model="testInput"
                  class="compose-field"
                  rows="1"
                  placeholder="Nhắn tin…"
                  :disabled="testLoading || !bot.hasGeminiKey"
                  autocomplete="off"
                  @keydown="onComposeKeydown"
                  @input="resizeCompose"
                />
                <button
                  type="submit"
                  class="compose-send"
                  :class="{ 'compose-send--busy': testLoading }"
                  aria-label="Gửi tin"
                  :disabled="testLoading || !canSendTest || !bot.hasGeminiKey"
                >
                  <Loader2 v-if="testLoading" class="compose-send-spin" :size="18" aria-hidden="true" />
                  <Send v-else :size="18" :stroke-width="2.25" aria-hidden="true" />
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
import { ImagePlus, Loader2, Send } from '@lucide/vue'
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
let chatMessageSeq = 0

function withMessageKey(entry) {
  chatMessageSeq += 1
  return { ...entry, _key: `msg-${chatMessageSeq}` }
}

function scrollChatToBottom(behavior = 'auto') {
  const run = () => {
    const el = chatScroll.value
    if (!el) return
    const top = el.scrollHeight - el.clientHeight
    if (behavior === 'smooth' && typeof el.scrollTo === 'function') {
      el.scrollTo({ top, behavior: 'smooth' })
    } else {
      el.scrollTop = top
    }
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
  })
}

function mapHistoryMessage(m, index) {
  return withMessageKey({
    role: m.role,
    text: m.text,
    qrImageUrl: m.qrImageUrl || null,
    imageUrls: Array.isArray(m.imageUrls) ? m.imageUrls : [],
    isSessionGreeting: Boolean(m.isSessionGreeting),
    _historyIndex: index,
  })
}

function appendSessionGreetings(greetings) {
  for (const g of greetings) {
    chatMessages.value.push(
      withMessageKey({
        role: 'bot',
        text: g.text || '',
        imageUrls: g.imageUrl ? [g.imageUrl] : [],
        isSessionGreeting: true,
      }),
    )
  }
}

async function deliverSessionGreetingIfNew() {
  if (!props.bot.sessionGreetingEnabled) return
  const sid = ensureTestSessionId()
  try {
    const data = await api.bots.triggerSessionGreeting(props.bot.id, sid)
    const greetings = Array.isArray(data?.sessionGreetings) ? data.sessionGreetings : []
    if (greetings.length) {
      appendSessionGreetings(greetings)
      scrollChatToBottom('smooth')
    }
  } catch (e) {
    console.error(e)
  }
}

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
  { label: 'Mục tiêu', to: props.tabRoute('setup', 'goals') },
])

const copySessionOk = ref(false)
let copySessionTimer = null

const fullSessionId = computed(() => String(testSessionId.value || '').trim())

const sessionShort = computed(() => {
  const s = fullSessionId.value
  if (!s) return '…'
  if (s.length <= 14) return s
  return `${s.slice(0, 8)}…${s.slice(-4)}`
})

async function copySessionId() {
  const id = fullSessionId.value || ensureTestSessionId()
  if (!id) return
  try {
    await navigator.clipboard.writeText(id)
    copySessionOk.value = true
    if (copySessionTimer) clearTimeout(copySessionTimer)
    copySessionTimer = setTimeout(() => {
      copySessionOk.value = false
      copySessionTimer = null
    }, 2000)
  } catch {
    /* ignore */
  }
}

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
  await deliverSessionGreetingIfNew()
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
    chatMessageSeq = 0
    chatMessages.value = Array.isArray(data?.messages)
      ? data.messages.map((m, i) => mapHistoryMessage(m, i))
      : []
    if (!chatMessages.value.length) {
      await deliverSessionGreetingIfNew()
    }
    scrollChatToBottom('auto')
    if (
      opts.silent &&
      chatMessages.value.length > prevLen &&
      chatMessages.value[chatMessages.value.length - 1]?.text?.includes('đã ghi nhận')
    ) {
      stopPaymentPoll()
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
  chatMessages.value.push(
    withMessageKey({
      role: 'user',
      text,
      imageUrls: images.length ? images : [],
    }),
  )
  testInput.value = ''
  pendingImages.value = []
  nextTick(resizeCompose)
  testLoading.value = true
  scrollChatToBottom('smooth')

  try {
    const sid = testSessionId.value || ensureTestSessionId()
    const data = await api.bots.test(props.bot.id, text, sid, images)
    const prodImgs = Array.isArray(data.productImageUrls) ? data.productImageUrls : []
    const bubbles = Array.isArray(data.bubbles) && data.bubbles.length ? data.bubbles : null
    if (bubbles) {
      for (let i = 0; i < bubbles.length; i++) {
        chatMessages.value.push(
          withMessageKey({
            role: 'bot',
            text: bubbles[i] || '—',
            qrImageUrl: i === bubbles.length - 1 ? data.paymentQrImageUrl || null : null,
            imageUrls: i === bubbles.length - 1 ? prodImgs : [],
          }),
        )
        const bubbleMs = Math.min(4000, Math.max(150, Number(props.bot.replyBubbleDelayMs) || 650))
        await new Promise((r) => setTimeout(r, i === 0 ? 0 : bubbleMs))
        scrollChatToBottom('smooth')
      }
    } else {
      chatMessages.value.push(
        withMessageKey({
          role: 'bot',
          text: data.reply || '—',
          qrImageUrl: data.paymentQrImageUrl || null,
          imageUrls: prodImgs,
        }),
      )
    }
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
    scrollChatToBottom('smooth')
  }
}

watch(
  () => chatMessages.value.length,
  () => scrollChatToBottom('auto'),
)

watch(testLoading, (loading) => {
  if (loading) scrollChatToBottom('smooth')
})

onMounted(() => {
  loadTestHistory()
  nextTick(resizeCompose)
})
onUnmounted(() => {
  stopPaymentPoll()
  window.removeEventListener('keydown', onToolsKeydown)
  document.body.style.overflow = ''
  if (copySessionTimer) clearTimeout(copySessionTimer)
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
  flex: 0 0 min(268px, 34%);
  max-width: 292px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding: 1rem 1.1rem 1.15rem;
  border-radius: 18px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  box-shadow: 0 8px 24px -22px rgba(15, 23, 42, 0.28);
}

.session-head {
  margin: 0;
}

.session-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--b-accent-hover);
}

.session-panel-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--b-ink);
}

.session-panel-meta {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--b-muted);
}

.session-card {
  padding: 12px 12px 11px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
  display: grid;
  gap: 12px;
}

.session-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-metric-value {
  font-size: 1.75rem;
  font-weight: 750;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--b-ink);
}

.session-metric-label {
  font-size: 12px;
  color: var(--b-muted);
}

.session-id-block {
  display: grid;
  gap: 6px;
}

.session-id-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--b-accent);
}

.session-id-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
}

.session-chip {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--b-border);
  color: var(--b-ink-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-copy {
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-ink-secondary);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.session-copy:hover:not(:disabled) {
  border-color: var(--accent-border, var(--color-accent-border));
  color: var(--b-accent-hover);
  background: var(--b-accent-soft);
}

.session-copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.session-actions .b-btn {
  flex: 1 1 auto;
  justify-content: center;
  min-width: 7rem;
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

.session-new-hint {
  margin: 0;
  line-height: 1.45;
  font-size: 12px;
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
  overflow-x: hidden;
  padding: 8px 6px;
  border: none;
  border-radius: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
}

.chat-log-anchor {
  margin-top: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
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
  margin: auto 0 auto;
  padding: 12px 8px;
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
  padding: 6px 8px 0;
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
  align-items: flex-end;
  gap: 4px;
  margin: 0 6px 4px;
  padding: 6px 6px 6px 4px;
  border: 1px solid var(--b-border);
  border-radius: 22px;
  background: var(--color-surface);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
}

.compose-attach {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: 1px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--b-accent-hover);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.compose-attach:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.compose-attach:not(:disabled):hover {
  background: var(--b-accent-soft);
  color: var(--b-accent);
}

.compose-attach:not(:disabled):active {
  transform: scale(0.96);
}

.compose-field {
  flex: 1;
  min-width: 0;
  min-height: 38px;
  max-height: 120px;
  margin: 0;
  padding: 9px 4px 9px 2px;
  border: none;
  border-radius: 0;
  resize: none;
  font: inherit;
  font-size: 15px;
  line-height: 1.4;
  color: var(--b-ink);
  background: transparent;
  overflow-y: auto;
}

.compose-field::placeholder {
  color: #94a3b8;
}

.compose-field:focus {
  outline: none;
}

.compose-field:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.compose-send {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 2px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--b-accent);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    opacity 0.15s ease;
}

.compose-send:not(:disabled):hover {
  background: var(--b-accent-hover);
}

.compose-send:not(:disabled):active {
  transform: scale(0.94);
}

.compose-send:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.compose-send--busy {
  opacity: 0.85;
}

.compose-send-spin {
  animation: compose-spin 0.75s linear infinite;
}

@keyframes compose-spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-err {
  margin: 4px 12px 0;
  font-size: 12px;
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
    max-height: none;
  }

  .session-actions .b-btn {
    flex: 1 1 calc(50% - 4px);
  }

  .phone-panel {
    max-width: none;
    flex: 1 1 0;
    min-height: 0;
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
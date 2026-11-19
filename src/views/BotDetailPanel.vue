<template>
  <div class="b-studio detail-shell" :class="{ 'detail-shell--test': tab === 'test' }">
    <aside class="detail-sidebar b-card">
      <RouterLink to="/config" class="back">
        <ArrowLeft :size="16" aria-hidden="true" />
        Danh sách bot
      </RouterLink>

      <div class="side-head">
        <p class="b-kicker head-kicker">Cấu hình bot</p>
        <h1 class="b-title-sm side-title">{{ bot.name }}</h1>
        <p class="b-micro head-meta">
          Mã bot: <code class="bot-code">{{ bot.id }}</code>
        </p>
        <div class="head-badges">
          <span class="b-badge" :class="form.status === 'active' ? 'b-badge--ok' : 'b-badge--off'">
            {{ form.status === 'active' ? 'Đang chạy' : 'Tạm dừng' }}
          </span>
          <span class="b-badge" :class="bot.hasGeminiKey ? 'b-badge--ok' : 'b-badge--err'">
            {{ bot.hasGeminiKey ? 'Gemini OK' : 'Thiếu Gemini' }}
          </span>
          <span v-if="form.orderClosingEnabled" class="b-badge b-badge--ok">Chốt đơn bật</span>
        </div>
      </div>

      <nav class="side-nav" aria-label="Cấu hình theo trang">
        <RouterLink
          v-for="t in tabs"
          :key="t.id"
          :to="tabRoute(t.id)"
          class="side-link"
          :class="{ 'is-on': tab === t.id }"
        >
          {{ t.label }}
        </RouterLink>
      </nav>

      <button type="button" class="b-btn b-btn--danger b-btn--sm side-delete" @click="removeBot">
        Xóa bot
      </button>
    </aside>

    <div class="detail-main">
    <div class="panel-stage">
      <Transition :name="panelTransition" mode="out-in">
    <div v-if="tab === 'facebook'" key="facebook" class="b-card b-card-pad-lg panel page-panel">
      <h2 class="b-title-sm panel-title">Facebook và Webhook</h2>
      <form class="panel-form-plain" @submit.prevent>
      <label class="b-field">
        <span>Page Access Token</span>
        <input
          v-model="form.facebookPageAccessToken"
          class="b-input"
          type="password"
          autocomplete="off"
          placeholder="Nhập token mới để thay thế"
        />
        <small v-if="bot.facebookPageAccessTokenMasked">Đã lưu {{ bot.facebookPageAccessTokenMasked }}</small>
      </label>
      <label class="b-field">
        <span>Verify token</span>
        <input v-model="form.facebookVerifyToken" class="b-input" type="text" autocomplete="off" />
      </label>
      <div class="b-codebox">
        <label>Webhook URL</label>
        <code>{{ bot.webhookUrl }}</code>
        <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="copy(bot.webhookUrl)">
          Sao chép
        </button>
      </div>
      <ol class="steps">
        <li>Meta Developer → Messenger → Webhooks — dán URL trên.</li>
        <li>Verify token trùng với giá trị bạn đã lưu.</li>
        <li>Đăng ký sự kiện <code>messages</code> và <code>messaging_postbacks</code>.</li>
      </ol>
      </form>
    </div>

    <BotDetailContentSetup
      v-else-if="tab === 'setup'"
      key="setup"
      v-model="setupSection"
      :bot="bot"
      :form="form"
      :documents="props.documents"
      v-model:doc-title="docTitle"
      v-model:doc-content="docContent"
      :doc-saving="docSaving"
      @add-doc="addDoc"
      @delete-doc="deleteDoc"
    >
      <template #templates>
        <BotPromptTemplateSection
          title="Phong cách trò chuyện"
          kind="chat_style"
          :global="promptCatalog.chatStyle.global"
          :mine="promptCatalog.chatStyle.mine"
          :loading="templatesLoading"
          :selected-key="form.conversationStyle"
          @add="openTemplateEditor('chat_style')"
          @edit="(tpl) => openTemplateEditor('chat_style', tpl)"
          @remove="removeTemplate"
          @select="onSelectChatStyle"
        />
        <BotPromptTemplateSection
          title="Mẫu theo loại hình"
          kind="industry"
          :global="promptCatalog.industry.global"
          :mine="promptCatalog.industry.mine"
          :loading="templatesLoading"
          @add="openTemplateEditor('industry')"
          @edit="(tpl) => openTemplateEditor('industry', tpl)"
          @remove="removeTemplate"
          @apply="applyInstructionTemplate"
        />
        <p class="b-micro tpl-note">
          Mẫu chung do admin tạo — mọi người dùng. Mẫu của bạn chỉ tài khoản bạn. Bấm mẫu loại hình để điền instruction; chọn phong cách rồi <strong>Lưu cấu hình</strong>.
        </p>
      </template>
    </BotDetailContentSetup>

    <div v-else-if="tab === 'inventory'" key="inventory" class="b-card b-card-pad-lg panel page-panel">
      <h2 class="b-title-sm panel-title">Kho hàng</h2>
      <BotInventoryEditor ref="inventoryRef" v-model="inventory" />
    </div>

    <BotDetailDashboard v-else-if="tab === 'dashboard'" key="dashboard" :bot="bot" @reload="emit('reload')" />

    <BotDetailActivityHistory
      v-else-if="tab === 'history'"
      key="history"
      :bot="bot"
    />

    <BotDetailTestPanel v-else-if="tab === 'test'" key="test" :bot="bot" :tab-route="tabRoute" />

      </Transition>
    </div>

    <footer class="b-sticky-bar" :class="{ 'hide-on-test': tab === 'test' || tab === 'dashboard' || tab === 'history' }">
      <label class="b-switch">
        <input
          type="checkbox"
          :checked="form.status === 'active'"
          @change="form.status = $event.target.checked ? 'active' : 'paused'"
        />
        <span class="b-switch-track" aria-hidden="true" />
        Bot đang chạy
      </label>
      <button type="button" class="b-btn b-btn--primary" :disabled="saving" @click="save">
        {{ saving ? 'Đang lưu…' : 'Lưu cấu hình' }}
      </button>
      <p v-if="message" class="b-msg-ok">{{ message }}</p>
      <p v-if="saveError" class="b-msg-err">{{ saveError }}</p>
    </footer>

    <BotPromptTemplateEditorModal
      :open="editorOpen"
      :kind="editorKind"
      :template="editorTemplate"
      :is-admin="isAdmin"
      @close="editorOpen = false"
      @saved="onTemplatesSaved"
    />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { api } from '@/api'
import BotInventoryEditor from '@/components/BotInventoryEditor.vue'
import BotPromptTemplateSection from '@/components/BotPromptTemplateSection.vue'
import BotPromptTemplateEditorModal from '@/components/BotPromptTemplateEditorModal.vue'
import BotDetailDashboard from '@/components/BotDetailDashboard.vue'
import BotDetailActivityHistory from '@/components/BotDetailActivityHistory.vue'
import BotDetailTestPanel from '@/components/BotDetailTestPanel.vue'
import BotDetailContentSetup from '@/components/BotDetailContentSetup.vue'
import { fillInstructionTemplate } from '@/constants/instructionTemplates'
import { DEFAULT_CHAT_STYLE } from '@/constants/chatStyles'
import {
  DEFAULT_REPLY_LANGUAGE,
  DEFAULT_REPLY_LANGUAGE_MODE,
} from '@/constants/replyLanguages'
import { cloneOrderClosingPayment } from '@/constants/orderClosingPayment'
import { attachEncryptedGeminiKey, isValidGeminiPin } from '@/utils/geminiKeyCrypto'
import { loadLocalGeminiPin, saveLocalGeminiPin, clearLocalGeminiPin } from '@/utils/geminiPinLocal'
import { ensureGeminiPinForUser } from '@/utils/ensureGeminiPin'
import { useAuthStore } from '@/stores/auth'
import { confirm as askConfirm } from '@/composables/useConfirm'

const props = defineProps({
  bot: { type: Object, required: true },
  documents: { type: Array, default: () => [] },
})

const emit = defineEmits(['reload'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const saving = ref(false)
const message = ref('')
const saveError = ref('')
const TAB_IDS = ['test', 'dashboard', 'history', 'facebook', 'setup', 'inventory']
const SETUP_SECTION_IDS = ['gemini', 'docs', 'voice', 'orders']
const LEGACY_TAB_MAP = {
  gemini: 'gemini',
  docs: 'docs',
  instruction: 'voice',
  orders: 'orders',
}

const tabs = [
  { id: 'test', label: 'Thử phản hồi' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'Lịch sử phản hồi' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'setup', label: 'Nội dung & AI' },
  { id: 'inventory', label: 'Kho hàng' },
]

const slideDir = ref(1)

const tab = computed(() => {
  const raw = String(route.params.tab || route.query.tab || 'test')
  if (LEGACY_TAB_MAP[raw]) return 'setup'
  return TAB_IDS.includes(raw) ? raw : 'test'
})

const setupSection = computed({
  get() {
    const h = (route.hash || '').replace(/^#/, '')
    if (SETUP_SECTION_IDS.includes(h)) return h
    const raw = String(route.params.tab || '')
    if (LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw]
    return 'gemini'
  },
  set(id) {
    if (!SETUP_SECTION_IDS.includes(id)) return
    router.replace({ name: 'bot-detail', params: { id: props.bot.id, tab: 'setup' }, hash: `#${id}` })
  },
})

const panelTransition = computed(() =>
  slideDir.value >= 0 ? 'panel-slide-next' : 'panel-slide-prev'
)

function tabRoute(id, sectionId) {
  const link = { name: 'bot-detail', params: { id: props.bot.id, tab: id } }
  if (id === 'setup' && sectionId && SETUP_SECTION_IDS.includes(sectionId)) {
    link.hash = `#${sectionId}`
  }
  return link
}

function redirectLegacyTab() {
  const raw = String(route.params.tab || route.query.tab || '')
  if (LEGACY_TAB_MAP[raw]) {
    router.replace({
      name: 'bot-detail',
      params: { id: route.params.id, tab: 'setup' },
      hash: `#${LEGACY_TAB_MAP[raw]}`,
    })
    return true
  }
  return false
}

const form = reactive({
  facebookPageAccessToken: '',
  facebookVerifyToken: '',
  geminiApiKey: '',
  geminiKeyPin: '',
  aiProvider: 'own',
  geminiModel: 'gemini-3.1-flash-lite',
  shopName: '',
  shopIndustryLabel: '',
  shopIndustrySlug: '',
  conversationStyle: DEFAULT_CHAT_STYLE,
  replyLanguageMode: DEFAULT_REPLY_LANGUAGE_MODE,
  replyLanguageDefault: DEFAULT_REPLY_LANGUAGE,
  instructions: '',
  status: 'active',
  orderClosingEnabled: false,
  orderClosingReminderEnabled: false,
  orderClosingReminderText: '',
  orderClosingNote: '',
  orderClosingPayment: cloneOrderClosingPayment(),
})

const inventory = ref({ mode: 'manual', products: [], api: {} })
const inventoryRef = ref(null)
const docTitle = ref('')
const docContent = ref('')
const docSaving = ref(false)
const pickedTemplateId = ref('')
const promptCatalog = ref({
  industry: { global: [], mine: [] },
  chatStyle: { global: [], mine: [] },
})
const templatesLoading = ref(false)
const editorOpen = ref(false)
const editorKind = ref('industry')
const editorTemplate = ref(null)

function syncFromBot(b) {
  form.facebookVerifyToken = b.facebookVerifyToken || ''
  form.geminiModel = b.geminiModel || 'gemini-3.1-flash-lite'
  form.aiProvider = b.aiProvider || 'own'
  form.shopName = b.shopName || ''
  form.shopIndustryLabel = b.shopIndustryLabel || ''
  form.shopIndustrySlug = b.shopIndustrySlug || ''
  form.conversationStyle = b.conversationStyle || DEFAULT_CHAT_STYLE
  form.replyLanguageMode = b.replyLanguageMode || DEFAULT_REPLY_LANGUAGE_MODE
  form.replyLanguageDefault = b.replyLanguageDefault || DEFAULT_REPLY_LANGUAGE
  form.instructions = b.instructions || ''
  form.status = b.status || 'active'
  form.orderClosingEnabled = Boolean(b.orderClosingEnabled)
  form.orderClosingReminderEnabled = Boolean(b.orderClosingReminderEnabled)
  form.orderClosingReminderText = b.orderClosingReminderText || ''
  form.orderClosingNote = b.orderClosingNote || ''
  form.orderClosingPayment = cloneOrderClosingPayment(b.orderClosingPayment)
  inventory.value = b.inventory
    ? JSON.parse(JSON.stringify(b.inventory))
    : { mode: 'manual', products: [], api: {} }
}

function hydrateGeminiPinFromLocal() {
  const p = loadLocalGeminiPin(auth.user?.id)
  if (p) form.geminiKeyPin = p
}

onMounted(() => {
  syncFromBot(props.bot)
  hydrateGeminiPinFromLocal()
  if (redirectLegacyTab()) return
  const q = route.query.tab
  if (q && (TAB_IDS.includes(String(q)) || LEGACY_TAB_MAP[String(q)])) {
    if (LEGACY_TAB_MAP[String(q)]) {
      router.replace({
        name: 'bot-detail',
        params: { id: route.params.id, tab: 'setup' },
        hash: `#${LEGACY_TAB_MAP[String(q)]}`,
      })
    } else if (route.params.tab !== q) {
      router.replace({ name: 'bot-detail', params: { id: route.params.id, tab: String(q) } })
    }
  } else if (!route.params.tab) {
    router.replace({ name: 'bot-detail', params: { id: route.params.id, tab: 'test' } })
  }
})
watch(() => props.bot, (b) => syncFromBot(b), { deep: true })

async function save() {
  saveError.value = ''
  message.value = ''

  const invPayload = inventoryRef.value?.getValue?.() || inventory.value
  if (inventoryRef.value && !inventoryRef.value.validate()) {
    saveError.value = 'Kho hàng: header API không hợp lệ'
    router.push(tabRoute('inventory'))
    return
  }

  const body = {
    facebookVerifyToken: form.facebookVerifyToken,
    aiProvider: form.aiProvider,
    geminiModel: form.geminiModel,
    shopName: form.shopName.trim(),
    shopIndustryLabel: form.shopIndustryLabel.trim(),
    shopIndustrySlug: form.shopIndustrySlug.trim() || null,
    conversationStyle: form.conversationStyle,
    replyLanguageMode: form.replyLanguageMode,
    replyLanguageDefault: form.replyLanguageDefault,
    instructions: form.instructions,
    status: form.status,
    inventory: invPayload,
    orderClosingEnabled: form.orderClosingEnabled,
    orderClosingReminderEnabled: form.orderClosingReminderEnabled,
    orderClosingReminderText: form.orderClosingReminderText.trim(),
    orderClosingNote: form.orderClosingNote,
    orderClosingPayment: cloneOrderClosingPayment(form.orderClosingPayment),
  }
  if (form.facebookPageAccessToken.trim()) {
    body.facebookPageAccessToken = form.facebookPageAccessToken.trim()
  }
  let pinUsed = ''
  if (form.geminiApiKey.trim()) {
    try {
      pinUsed = await ensureGeminiPinForUser(auth.user?.id)
    } catch {
      return
    }
    if (!isValidGeminiPin(pinUsed)) return
    try {
      await attachEncryptedGeminiKey(body, form.geminiApiKey, pinUsed)
    } catch (e) {
      saveError.value = 'Mã hóa Gemini key thất bại — thử lại'
      console.error(e)
      return
    }
  }

  saving.value = true
  try {
    await api.bots.update(props.bot.id, body)
    if (pinUsed) saveLocalGeminiPin(auth.user?.id, pinUsed)
    form.facebookPageAccessToken = ''
    form.geminiApiKey = ''
    form.geminiKeyPin = loadLocalGeminiPin(auth.user?.id)
    message.value = 'Đã lưu'
    emit('reload')
  } catch (e) {
    if (e?.code === 'GEMINI_PIN_WRONG') {
      clearLocalGeminiPin(auth.user?.id)
      form.geminiKeyPin = ''
      saveError.value = e?.message || 'PIN không đúng — nhập lại PIN trên máy này'
    } else {
      saveError.value = e?.message || 'Lưu thất bại'
    }
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function addDoc() {
  docSaving.value = true
  try {
    await api.bots.addDocument(props.bot.id, {
      title: docTitle.value.trim(),
      content: docContent.value.trim(),
    })
    docTitle.value = ''
    docContent.value = ''
    emit('reload')
  } catch (e) {
    console.error(e)
  } finally {
    docSaving.value = false
  }
}

async function deleteDoc(docId) {
  const ok = await askConfirm({ title: 'Xóa tài liệu', message: 'Xóa tài liệu này?', confirmLabel: 'Xóa', danger: true })
  if (!ok) return
  await api.bots.deleteDocument(props.bot.id, docId)
  emit('reload')
}

async function removeBot() {
  const ok = await askConfirm({
    title: 'Xóa bot',
    message: 'Xóa hẳn bot này? Hành động không thể hoàn tác.',
    confirmLabel: 'Xóa bot',
    danger: true,
  })
  if (!ok) return
  await api.bots.remove(props.bot.id)
  router.push('/')
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => {
    message.value = 'Đã sao chép webhook'
  })
}

function instructionShopLabel() {
  return form.shopName.trim() || props.bot.name
}

async function loadPromptTemplates() {
  templatesLoading.value = true
  try {
    const data = await api.bots.promptTemplatesList()
    promptCatalog.value = {
      industry: data?.industry || { global: [], mine: [] },
      chatStyle: data?.chatStyle || { global: [], mine: [] },
    }
  } catch (e) {
    console.error(e)
  } finally {
    templatesLoading.value = false
  }
}

watch(
  () => tab.value,
  (next, prev) => {
    if (prev && next !== prev) {
      const ni = TAB_IDS.indexOf(next)
      const pi = TAB_IDS.indexOf(prev)
      slideDir.value = ni >= pi ? 1 : -1
    }
    if (next === 'setup') loadPromptTemplates()
    if (next === 'setup' && !route.hash) {
      router.replace({
        name: 'bot-detail',
        params: { id: props.bot.id, tab: 'setup' },
        hash: '#gemini',
      })
    }
  },
  { immediate: true },
)

watch(
  () => route.hash,
  () => {
    if (tab.value === 'setup' && setupSection.value === 'voice') loadPromptTemplates()
  },
)

function openTemplateEditor(kind, tpl = null) {
  editorKind.value = kind
  editorTemplate.value = tpl
  editorOpen.value = true
}

async function onTemplatesSaved() {
  await loadPromptTemplates()
  message.value = 'Đã lưu mẫu'
}

async function removeTemplate(tpl) {
  const ok = await askConfirm({
    title: 'Xóa mẫu',
    message: `Xóa mẫu "${tpl.label}"?`,
    confirmLabel: 'Xóa',
    danger: true,
  })
  if (!ok) return
  try {
    await api.bots.deletePromptTemplate(tpl.id)
    await loadPromptTemplates()
    message.value = 'Đã xóa mẫu'
  } catch (e) {
    console.error(e)
    saveError.value = 'Không xóa được mẫu'
  }
}

function onSelectChatStyle(tpl) {
  form.conversationStyle = tpl.id
  message.value = `Phong cách: ${tpl.label} — nhớ Lưu cấu hình`
}

async function applyInstructionTemplate(tpl) {
  const filled = fillInstructionTemplate(tpl.body, instructionShopLabel())
  if (form.instructions.trim()) {
    const ok = await askConfirm({
      title: 'Thay instruction',
      message: `Thay instruction hiện tại bằng mẫu "${tpl.label}"? (không thể hoàn tác trước khi lưu)`,
      confirmLabel: 'Thay',
      danger: false,
    })
    if (!ok) return
  }
  form.instructions = filled
  form.shopIndustryLabel = tpl.label
  form.shopIndustrySlug = tpl.slug || ''
  pickedTemplateId.value = tpl.id
  message.value = `Đã áp dụng mẫu ${tpl.label} — chỉ bán đúng ngành & sản phẩm trong kho`
}
</script>

<style scoped>
.detail-shell {
  /* Ghi đè .b-studio (max 860px) — chỉ chừa ~10% lề hai bên */
  width: min(100%, 90vw);
  max-width: none;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(248px, 280px) minmax(0, 1fr);
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: stretch;
}

.detail-shell--test {
  width: min(100%, 90vw);
  max-width: none;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

.detail-shell--test .detail-sidebar {
  align-self: stretch;
  max-height: 100%;
  top: 0;
  position: relative;
}

.detail-shell--test .detail-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.detail-shell--test .panel-stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 900px) {
  .detail-shell {
    grid-template-columns: 1fr;
  }
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 14px 18px;
  position: sticky;
  top: 76px;
  align-self: start;
  max-height: calc(100dvh - 88px);
  overflow-y: auto;
}

.side-head {
  padding-top: 4px;
}

.side-title {
  font-size: clamp(18px, 2.5vw, 22px);
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.side-link {
  display: block;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--b-muted);
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
  transition: background 0.2s ease, color 0.2s ease;
}

.detail-sidebar .side-delete {
  white-space: normal;
  line-height: 1.35;
  min-height: 2.5rem;
}

.side-link:hover {
  color: var(--b-ink-secondary);
  background: var(--b-surface-2);
}

.side-link.is-on,
.side-link.router-link-active {
  color: var(--b-ink);
  font-weight: 600;
  background: var(--b-accent-soft);
}

.side-delete {
  margin-top: auto;
  width: 100%;
}

.detail-main {
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-main > .b-sticky-bar {
  position: static;
  bottom: auto;
  flex-shrink: 0;
  margin-top: auto;
}

.detail-shell--test .page-panel,
.detail-shell--test :deep(.test-shell) {
  width: 100%;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--b-muted);
  text-decoration: none;
  width: fit-content;
}

.back:hover {
  color: var(--b-accent);
}

.head-kicker {
  margin-bottom: 4px;
}

.head-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.head-meta {
  margin: 0.35rem 0 0;
}

.panel-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-stage :deep(> *) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.detail-main :deep(.page-panel),
.detail-main :deep(.setup-panel) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page-panel {
  box-shadow: var(--b-shadow);
  border: 1px solid var(--b-border);
}

.panel-slide-next-enter-active,
.panel-slide-next-leave-active,
.panel-slide-prev-enter-active,
.panel-slide-prev-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-next-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.panel-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

.panel-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.panel-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(14px);
}

.bot-code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--b-ink-secondary);
  word-break: break-all;
}

.panel-title {
  margin: 0 0 14px;
}

.panel-intro {
  margin: -6px 0 16px;
}

.panel-intro a {
  color: var(--b-accent);
}

.steps {
  margin: 18px 0 0;
  padding-left: 1.15rem;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--b-muted);
}

.steps code {
  font-size: 13px;
  color: var(--b-ink-secondary);
}

.doc-form {
  margin-bottom: 1.25rem;
}

.doc-list {
  overflow: hidden;
  padding: 0;
  border-radius: var(--b-radius);
}

.doc-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-top: 1px solid var(--b-border);
}

.doc-item:first-child {
  border-top: none;
}

.doc-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--b-ink);
}

.doc-preview {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--b-muted);
  line-height: 1.45;
}

.text-danger {
  border: none;
  background: none;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--b-danger);
  cursor: pointer;
  padding: 0.25rem;
}

.text-danger:hover {
  text-decoration: underline;
}

.test-panel .panel-intro {
  margin-bottom: 14px;
}

.warn-box {
  padding: 12px 14px;
  border-radius: var(--b-radius-sm);
  border: 1px solid #fde68a;
  background: var(--b-warn-soft);
  font-size: 14px;
  color: var(--b-warn-ink);
  margin-bottom: 14px;
}

.warn-box a {
  color: var(--b-accent);
  font-weight: 600;
}

.test-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.test-head-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.test-pill {
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--b-border);
  background: #fff;
  color: var(--b-ink-secondary);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.test-pill:hover {
  border-color: #bbf7d0;
  background: var(--b-accent-soft);
}

.chat-shell {
  display: grid;
  gap: 12px;
}

.chat-log {
  min-height: 280px;
  max-height: min(52vh, 440px);
  overflow-y: auto;
  padding: 16px 14px;
  border: 1px solid var(--b-border);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8faf9 0%, #f1f5f3 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  max-width: 88%;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
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
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--b-ink);
  white-space: pre-wrap;
}

.chat-compose {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--b-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
}

.chat-compose .chat-input {
  flex: 1;
  min-width: 200px;
  border: none;
  background: transparent;
  box-shadow: none;
}

.chat-compose .chat-input:focus {
  outline: none;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .panel-slide-next-enter-active,
  .panel-slide-next-leave-active,
  .panel-slide-prev-enter-active,
  .panel-slide-prev-leave-active,
  .bubble-enter-active {
    transition: opacity 0.15s ease;
  }

  .panel-slide-next-enter-from,
  .panel-slide-next-leave-to,
  .panel-slide-prev-enter-from,
  .panel-slide-prev-leave-to,
  .bubble-enter-from {
    transform: none;
  }

  .typing-dots span {
    animation: none;
    opacity: 0.7;
  }
}

.hide-on-test {
  display: none;
}

.order-toggle {
  margin: 12px 0 16px;
}

.test-hint {
  margin: 0 0 12px;
}

.instruct-panel .panel-intro {
  margin-bottom: 18px;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.style-block {
  margin-top: 18px;
}

.style-card {
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: #fff;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.style-card:hover {
  border-color: #a7f3c0;
}

.style-card.picked {
  border-color: var(--b-accent);
  box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
}

.style-sample {
  display: block;
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--b-muted);
  font-style: italic;
}

.tpl-block {
  margin: 20px 0 22px;
  padding: 16px;
  border-radius: 14px;
  border: 1px dashed var(--b-border-strong);
  background: var(--b-surface-2);
}

.tpl-label {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.tpl-card {
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: #fff;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.tpl-card:hover {
  border-color: #a7f3c0;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.08);
  transform: translateY(-1px);
}

.tpl-card.picked {
  border-color: var(--b-accent);
  box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
}

.tpl-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--b-ink);
}

.tpl-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--b-muted);
  line-height: 1.4;
}

.tpl-note {
  margin: 12px 0 0;
}

.instruct-area {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
}
</style>
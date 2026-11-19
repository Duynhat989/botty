<template>
  <div class="setup-panel page-panel">
    <header class="setup-top">
      <h2 class="b-title-sm panel-title">Nội dung & AI</h2>
      <p class="b-caption panel-intro">Gemini, tài liệu, giọng điệu và chốt đơn trong một màn hình.</p>
    </header>

    <nav class="setup-subnav" aria-label="Phần cấu hình">
      <button
        v-for="s in sections"
        :key="s.id"
        type="button"
        class="setup-tab"
        :class="{ on: modelValue === s.id }"
        @click="emit('update:modelValue', s.id)"
      >
        {{ s.label }}
      </button>
    </nav>

    <div class="setup-body">
      <section v-show="modelValue === 'gemini'" id="section-gemini" class="setup-section">
        <form class="setup-form-plain" @submit.prevent>
        <h3 class="setup-h">Gemini</h3>

        <fieldset class="ai-mode-fieldset">
          <legend class="b-caption">Nguồn AI</legend>
          <div class="b-choice-grid b-choice-grid--2">
            <label class="b-choice-card" :class="{ on: form.aiProvider === 'own' }">
              <input v-model="form.aiProvider" type="radio" value="own" />
              <span class="b-choice-title">Gemini API key của tôi</span>
              <span class="b-micro b-choice-hint">Key từ Google AI Studio</span>
            </label>
            <label class="b-choice-card" :class="{ on: form.aiProvider === 'botty' }">
              <input v-model="form.aiProvider" type="radio" value="botty" />
              <span class="b-choice-title">Gói Botty AI</span>
              <span class="b-micro b-choice-hint">Không cần tự nhập key</span>
            </label>
          </div>
        </fieldset>

        <div v-if="form.aiProvider === 'botty' && bot.bottyPlanRequired" class="upgrade-box">
          <p class="upgrade-title">Cần gói Botty AI đang hoạt động</p>
          <p class="b-caption">
            Chọn gói theo hội thoại/tháng (không cần API key). Sau thanh toán, bot dùng AI do hệ thống cấp.
          </p>
          <RouterLink to="/pricing" class="b-btn b-btn--primary b-btn--sm">Nâng cấp gói</RouterLink>
        </div>
        <p v-else-if="form.aiProvider === 'botty' && bot.hasGeminiKey" class="b-caption ok-hint">
          Gói Botty AI đang hoạt động — bot dùng Gemini hệ thống (không cần key trên bot).
        </p>

        <template v-if="form.aiProvider === 'own'">
        <label class="b-field">
          <span class="key-label-row">
            API key
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Lấy key</a>
          </span>
          <div class="input-reveal">
            <input
              v-model="form.geminiApiKey"
              class="b-input input-reveal__input"
              :type="showGeminiKey ? 'text' : 'password'"
              autocomplete="off"
              spellcheck="false"
              :placeholder="bot.hasGeminiKey ? '••••••••' : 'AIza…'"
            />
            <button
              type="button"
              class="input-reveal__btn"
              :aria-label="showGeminiKey ? 'Ẩn API key' : 'Hiện API key'"
              :aria-pressed="showGeminiKey"
              @click="showGeminiKey = !showGeminiKey"
            >
              <EyeOff v-if="showGeminiKey" :size="18" aria-hidden="true" />
              <Eye v-else :size="18" aria-hidden="true" />
            </button>
          </div>
        </label>
        <label class="b-field">
          <span>Model</span>
          <input
            v-model="form.geminiModel"
            class="b-input"
            type="text"
            placeholder="gemini-3.1-flash-lite"
          />
        </label>
        </template>

        <label v-if="form.aiProvider === 'botty'" class="b-field">
          <span>Model</span>
          <input
            v-model="form.geminiModel"
            class="b-input"
            type="text"
            placeholder="gemini-3.1-flash-lite"
          />
        </label>
        </form>
      </section>

      <section v-show="modelValue === 'docs'" id="section-docs" class="setup-section">
        <h3 class="setup-h">Tài liệu</h3>
        <form class="doc-form" @submit.prevent="emit('add-doc')">
          <label class="b-field">
            <span>Tiêu đề</span>
            <input v-model="docTitleModel" class="b-input" required />
          </label>
          <label class="b-field">
            <span>Nội dung</span>
            <textarea
              v-model="docContentModel"
              class="b-textarea"
              rows="5"
              placeholder="FAQ, chính sách, mô tả sản phẩm…"
              required
            />
          </label>
          <button type="submit" class="b-btn b-btn--primary b-btn--sm" :disabled="docSaving">Thêm tài liệu</button>
        </form>
        <div v-if="documents.length" class="b-card doc-list">
          <div v-for="d in documents" :key="d.id" class="doc-item">
            <div>
              <p class="doc-title">{{ d.title }}</p>
              <p class="doc-preview">{{ d.contentPreview }}…</p>
            </div>
            <button type="button" class="text-danger" @click="emit('delete-doc', d.id)">Xóa</button>
          </div>
        </div>
        <p v-else class="b-muted">Chưa có tài liệu.</p>
      </section>

      <section v-show="modelValue === 'voice'" id="section-voice" class="setup-section instruct-panel">
        <h3 class="setup-h">Giọng điệu</h3>
        <p class="b-caption panel-intro">
          Tên shop, phong cách chat và mẫu ngành — bot trả lời ngắn như người thật.
        </p>
        <label class="b-field">
          <span>Tên shop (hiển thị với khách)</span>
          <input
            v-model="form.shopName"
            class="b-input"
            type="text"
            maxlength="120"
            placeholder="VD: Shop Lan — Boutique"
          />
          <small class="b-micro">Để trống sẽ dùng tên bot: {{ bot.name }}</small>
        </label>
        <label class="b-field">
          <span>Thể loại shop</span>
          <input
            v-model="form.shopIndustryLabel"
            class="b-input"
            type="text"
            maxlength="120"
            placeholder="VD: Thời trang, Đồ ăn…"
          />
        </label>

        <div class="lang-block">
          <p class="lang-block-title">Ngôn ngữ phản hồi</p>
          <div class="lang-modes">
            <label
              v-for="m in replyLanguageModes"
              :key="m.value"
              class="b-choice-card lang-mode-card"
              :class="{ on: form.replyLanguageMode === m.value }"
            >
              <input v-model="form.replyLanguageMode" type="radio" :value="m.value" />
              <span class="b-choice-title">{{ m.label }}</span>
              <span class="b-micro b-choice-hint">{{ m.hint }}</span>
            </label>
          </div>
          <label class="b-field lang-default-field">
            <span>{{ form.replyLanguageMode === 'fixed' ? 'Ngôn ngữ cố định' : 'Ngôn ngữ dự phòng (khi chưa có tin khách)' }}</span>
            <select v-model="form.replyLanguageDefault" class="b-input">
              <option v-for="opt in replyLanguageOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>

        <slot name="templates" />
        <label class="b-field">
          <span>Instruction chi tiết</span>
          <textarea
            v-model="form.instructions"
            class="b-textarea instruct-area"
            rows="14"
            placeholder="Chính sách ship, đổi trả…"
          />
        </label>
      </section>

      <section v-show="modelValue === 'greeting'" id="section-greeting" class="setup-section">
        <h3 class="setup-h">Chào & khuyến mãi</h3>
        <p class="b-caption panel-intro">
          Gửi <strong>trước</strong> khi bot trả lời AI: phiên thử mới, hoặc trên Messenger khi khách bấm
          <strong>Bắt đầu (Get Started)</strong>, vào qua link <code>m.me</code> (referral), opt-in plugin, hoặc ngay khi webhook nhận tin.
          Facebook <em>không</em> báo khi khách chỉ mở cửa sổ chat — hãy bật nút Get Started (Botty tự gắn khi kiểm tra kết nối Facebook).
          Khách <strong>xóa hội thoại</strong> rồi bấm <strong>Bắt đầu</strong> lại → Botty <strong>gửi lại</strong> tin chào (nút Bắt đầu do Meta quyết định có hiện hay không).
          Nhiều tin: chữ và/hoặc ảnh (tự nén dưới 5MB).
        </p>
        <label class="b-switch order-toggle">
          <input
            type="checkbox"
            :checked="form.sessionGreetingEnabled"
            @change="form.sessionGreetingEnabled = $event.target.checked"
          />
          <span class="b-switch-track" aria-hidden="true" />
          Bật chào & tin khuyến mãi đầu phiên
        </label>

        <div v-if="form.sessionGreetingEnabled" class="greeting-list">
          <div
            v-for="(item, idx) in form.sessionGreetings"
            :key="item._key"
            class="greeting-item b-card b-card-pad"
          >
            <form class="greeting-item-form" @submit.prevent>
            <div class="greeting-item-head">
              <span class="b-micro">Tin {{ idx + 1 }}</span>
              <button
                type="button"
                class="text-danger"
                :disabled="form.sessionGreetings.length <= 1"
                @click="removeGreetingItem(idx)"
              >
                Xóa
              </button>
            </div>
            <label class="b-field">
              <span>Nội dung</span>
              <textarea
                v-model="item.text"
                class="b-textarea"
                rows="3"
                placeholder="Xin chào! Shop đang giảm 20%…"
              />
            </label>
            <div class="greeting-image-field">
              <span class="b-field-label">Ảnh khuyến mãi (tuỳ chọn)</span>
              <div class="greeting-image-actions">
                <label class="greeting-pick">
                  <input
                    type="file"
                    class="sr-only"
                    :accept="greetingImageAccept"
                    :disabled="greetingUploading === idx"
                    @change="onGreetingImagePick(idx, $event)"
                  />
                  <span class="b-btn b-btn--ghost b-btn--sm">
                    {{ greetingUploading === idx ? 'Đang tải…' : item.imageUrl ? 'Đổi ảnh' : 'Chọn ảnh' }}
                  </span>
                </label>
                <button
                  v-if="item.imageUrl"
                  type="button"
                  class="text-danger"
                  :disabled="greetingUploading === idx"
                  @click="clearGreetingImage(idx)"
                >
                  Gỡ ảnh
                </button>
              </div>
              <p class="b-micro greeting-image-hint">JPG, PNG, WebP, GIF — hệ thống nén xuống dưới 5MB.</p>
              <p v-if="greetingImageError && greetingErrorIndex === idx" class="b-msg-err greeting-img-err">
                {{ greetingImageError }}
              </p>
            </div>
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              alt="Xem trước ảnh chào phiên"
              class="greeting-preview"
              loading="lazy"
            />
            </form>
          </div>
          <button
            type="button"
            class="b-btn b-btn--ghost b-btn--sm"
            :disabled="form.sessionGreetings.length >= 12"
            @click="addGreetingItem"
          >
            + Thêm tin
          </button>
        </div>
      </section>

      <section v-show="modelValue === 'orders'" id="section-orders" class="setup-section">
        <h3 class="setup-h">Chốt đơn</h3>
        <p class="b-caption panel-intro">
          Bật để bot hướng dẫn khách xác nhận sản phẩm, SĐT, địa chỉ và tóm tắt đơn trong chat.
        </p>
        <label class="b-switch order-toggle">
          <input
            type="checkbox"
            :checked="form.orderClosingEnabled"
            @change="form.orderClosingEnabled = $event.target.checked"
          />
          <span class="b-switch-track" aria-hidden="true" />
          Bật chốt đơn tự động
        </label>
        <template v-if="form.orderClosingEnabled">
          <p class="b-micro order-field-hint">
            Bot sẽ hỏi: họ tên, SĐT, địa chỉ
            <template v-if="form.orderClosingPayment.collectInstallerName">, tên người lắp đặt</template>
            trước khi chốt.
          </p>

          <label class="b-switch order-toggle">
            <input
              type="checkbox"
              :checked="form.orderClosingReminderEnabled"
              @change="form.orderClosingReminderEnabled = $event.target.checked"
            />
            <span class="b-switch-track" aria-hidden="true" />
            Nhắc chốt đơn (tối đa 1 lần/ngày)
          </label>
          <p v-if="form.orderClosingReminderEnabled" class="b-micro order-field-hint">
            Khách chưa từng chốt đơn sẽ được nhắn thêm một dòng nhắc khi chat; mỗi ngày tối đa một lần.
          </p>
          <label v-if="form.orderClosingReminderEnabled" class="b-field">
            <span>Nội dung nhắc (tuỳ chọn)</span>
            <textarea
              v-model="form.orderClosingReminderText"
              class="b-textarea"
              rows="3"
              placeholder="Để trống dùng mẫu mặc định của shop"
            />
          </label>

          <label class="b-switch order-toggle">
            <input
              type="checkbox"
              :checked="form.orderClosingOutboundEnabled"
              @change="form.orderClosingOutboundEnabled = $event.target.checked"
            />
            <span class="b-switch-track" aria-hidden="true" />
            Tự động nhắn Messenger nếu chưa chốt đơn trong ngày
          </label>
          <p v-if="form.orderClosingOutboundEnabled" class="b-micro order-field-hint">
            Botty tự gửi <strong>tin riêng</strong> (không chờ khách nhắn) tối đa 1 lần/ngày/khách,
            khi khách đã nhắn trong <strong>24h</strong> và chưa có đơn chốt hôm nay. Dùng chung nội dung nhắc ở trên.
            Gửi thủ công: tab <strong>Lịch sử phản hồi</strong>.
          </p>

          <label class="b-switch order-toggle">
            <input v-model="form.orderClosingPayment.collectInstallerName" type="checkbox" />
            <span class="b-switch-track" aria-hidden="true" />
            Hỏi tên người lắp đặt / người nhận tại chỗ
          </label>

          <label class="b-switch order-toggle">
            <input v-model="form.orderClosingPayment.paymentEnabled" type="checkbox" />
            <span class="b-switch-track" aria-hidden="true" />
            Gửi thông tin chuyển khoản + link QR khi chốt
          </label>

          <div v-if="form.orderClosingPayment.paymentEnabled" class="pay-block b-card b-card-pad">
            <p class="b-micro pay-block-title">Tài khoản nhận tiền</p>
            <div class="grid2">
              <label class="b-field bank-select-field">
                <span>Ngân hàng (mã path QR)</span>
                <select
                  v-model="form.orderClosingPayment.bankCode"
                  class="b-input"
                  @change="onBankCodePicked"
                >
                  <option v-if="legacyBankOption" :value="legacyBankOption.code">
                    {{ legacyBankOption.code }} — {{ legacyBankOption.label }}
                  </option>
                  <option v-for="b in vietnamBanks" :key="b.code" :value="b.code">
                    {{ b.code }} — {{ b.shortName }}
                  </option>
                </select>
                <small class="b-micro bank-select-hint">{{ bankSelectHint }}</small>
              </label>
              <label class="b-field">
                <span>Tên hiển thị (tuỳ chỉnh)</span>
                <input v-model="form.orderClosingPayment.bankName" class="b-input" placeholder="VietinBank" />
              </label>
              <label class="b-field">
                <span>Số tài khoản</span>
                <input v-model="form.orderClosingPayment.accountNumber" class="b-input" placeholder="108867592530" />
              </label>
              <label class="b-field">
                <span>Chủ tài khoản</span>
                <input v-model="form.orderClosingPayment.accountHolder" class="b-input" placeholder="Dinh Viet Duy" />
              </label>
            </div>
            <label class="b-field">
              <span>Prefix nội dung CK</span>
              <input v-model="form.orderClosingPayment.memoPrefix" class="b-input" placeholder="BOTTY" />
            </label>
            <label class="b-field">
              <span>Link ảnh QR Pay2S (quicklink — GET trả PNG)</span>
              <input
                v-model="form.orderClosingPayment.qrTemplate"
                class="b-input"
                type="url"
                placeholder="https://payment.pay2s.vn/quicklink/..."
              />
              <small class="b-micro">
                Biến: {bankCode} {accountNumber} (STK) {accountHolder} {amount} {memo}. Path dùng STK shop, không phải SĐT khách.
                {phone} chỉ khi template tùy chỉnh cần SĐT khách.
              </small>
            </label>
          </div>

          <label class="b-field">
            <span>Quy tắc bổ sung (tuỳ chọn)</span>
            <textarea
              v-model="form.orderClosingNote"
              class="b-textarea"
              rows="5"
              placeholder="VD: Freeship đơn từ 500k, COD không hỗ trợ…"
            />
          </label>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Eye, EyeOff } from '@lucide/vue'
import { api, ApiError, apiMessage } from '@/api'
import { compressImageFile, GREETING_IMAGE_ACCEPT, GREETING_IMAGE_MAX_BYTES } from '@/utils/imageCompress'
import {
  REPLY_LANGUAGE_MODES,
  REPLY_LANGUAGE_OPTIONS,
} from '@/constants/replyLanguages'
import {
  VIETNAM_BANKS,
  findBankByCode,
  defaultBankNameForCode,
} from '@/constants/vietnamBanks'
import { useAuthStore } from '@/stores/auth'
import { isValidGeminiPin } from '@/utils/geminiKeyCrypto'
import { hasLocalGeminiPin, loadLocalGeminiPin } from '@/utils/geminiPinLocal'

const props = defineProps({
  modelValue: { type: String, default: 'gemini' },
  bot: { type: Object, required: true },
  form: { type: Object, required: true },
  documents: { type: Array, default: () => [] },
  docTitle: { type: String, default: '' },
  docContent: { type: String, default: '' },
  docSaving: { type: Boolean, default: false },
})

const auth = useAuthStore()
const showGeminiKey = ref(false)
const greetingUploading = ref(-1)
const greetingImageError = ref('')
const greetingErrorIndex = ref(-1)
const greetingImageAccept = GREETING_IMAGE_ACCEPT

watch(
  () => auth.user?.id,
  (uid) => {
    if (uid && hasLocalGeminiPin(uid) && !isValidGeminiPin(props.form?.geminiKeyPin)) {
      props.form.geminiKeyPin = loadLocalGeminiPin(uid)
    }
  },
  { immediate: true },
)

const sections = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'docs', label: 'Tài liệu' },
  { id: 'voice', label: 'Giọng điệu' },
  { id: 'greeting', label: 'Chào phiên' },
  { id: 'orders', label: 'Chốt đơn' },
]

function greetingKey() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

async function onGreetingImagePick(idx, event) {
  greetingImageError.value = ''
  greetingErrorIndex.value = -1
  const input = event.target
  const file = input?.files?.[0]
  input.value = ''
  if (!file || !props.bot?.id) return

  greetingUploading.value = idx
  try {
    const blob = await compressImageFile(file, { maxBytes: GREETING_IMAGE_MAX_BYTES })
    const uploadFile = new File([blob], 'greeting.jpg', { type: blob.type || 'image/jpeg' })
    const data = await api.bots.uploadGreetingImage(props.bot.id, uploadFile)
    if (props.form.sessionGreetings?.[idx]) {
      props.form.sessionGreetings[idx].imageUrl = data?.url || ''
    }
  } catch (err) {
    greetingErrorIndex.value = idx
    if (err instanceof ApiError) {
      greetingImageError.value = apiMessage(err)
    } else if (err?.message === 'IMAGE_FORMAT') {
      greetingImageError.value = 'Chỉ hỗ trợ JPG, PNG, WebP hoặc GIF.'
    } else if (err?.message === 'IMAGE_TOO_LARGE') {
      greetingImageError.value = 'Ảnh quá lớn — chọn ảnh khác hoặc crop nhỏ hơn.'
    } else {
      greetingImageError.value = 'Không tải được ảnh. Thử lại.'
    }
  } finally {
    greetingUploading.value = -1
  }
}

function clearGreetingImage(idx) {
  if (props.form.sessionGreetings?.[idx]) {
    props.form.sessionGreetings[idx].imageUrl = ''
  }
  if (greetingErrorIndex.value === idx) {
    greetingImageError.value = ''
    greetingErrorIndex.value = -1
  }
}

function addGreetingItem() {
  if (!Array.isArray(props.form.sessionGreetings)) {
    props.form.sessionGreetings = []
  }
  if (props.form.sessionGreetings.length >= 12) return
  props.form.sessionGreetings.push({ _key: greetingKey(), text: '', imageUrl: '' })
}

function removeGreetingItem(index) {
  if (!Array.isArray(props.form.sessionGreetings) || props.form.sessionGreetings.length <= 1) return
  props.form.sessionGreetings.splice(index, 1)
}

const emit = defineEmits(['update:modelValue', 'update:docTitle', 'update:docContent', 'add-doc', 'delete-doc'])

const replyLanguageModes = REPLY_LANGUAGE_MODES
const replyLanguageOptions = REPLY_LANGUAGE_OPTIONS
const vietnamBanks = VIETNAM_BANKS

const bankSelectHint = computed(() => {
  const b = findBankByCode(props.form?.orderClosingPayment?.bankCode)
  return b ? b.name : 'Chọn ngân hàng nhận chuyển khoản'
})

const legacyBankOption = computed(() => {
  const code = String(props.form?.orderClosingPayment?.bankCode || '').trim().toUpperCase()
  if (!code || findBankByCode(code)) return null
  return { code, label: 'Mã đã lưu (chọn lại nếu cần)' }
})

function onBankCodePicked() {
  const code = props.form?.orderClosingPayment?.bankCode
  if (props.form?.orderClosingPayment) {
    props.form.orderClosingPayment.bankName = defaultBankNameForCode(code)
  }
}

const docTitleModel = computed({
  get: () => props.docTitle,
  set: (v) => emit('update:docTitle', v),
})

const docContentModel = computed({
  get: () => props.docContent,
  set: (v) => emit('update:docContent', v),
})
</script>

<style scoped>
.setup-panel {
  border: 1px solid var(--b-border);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 20px 22px 24px;
  box-shadow: var(--b-shadow);
}

.setup-top {
  margin-bottom: 16px;
}

.setup-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 22px;
  padding: 4px;
  border-radius: 12px;
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.setup-tab {
  border: none;
  background: transparent;
  padding: 9px 14px;
  border-radius: 9px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--b-muted);
  white-space: nowrap;
  word-break: keep-all;
  flex: 0 0 auto;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.setup-tab:hover {
  color: var(--b-ink-secondary);
  background: rgba(255, 255, 255, 0.7);
}

.setup-tab.on {
  background: var(--color-surface);
  color: var(--b-ink);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.setup-section {
  animation: setup-in 0.22s ease;
}

@keyframes setup-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.setup-h {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
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
}

.doc-preview {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--b-muted);
}

.text-danger {
  border: none;
  background: none;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--b-danger);
  cursor: pointer;
}

.order-toggle {
  margin: 12px 0 16px;
}

.order-field-hint {
  margin: 0 0 12px;
  line-height: 1.45;
}

.greeting-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.greeting-item-form {
  margin: 0;
}

.greeting-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.greeting-image-field {
  margin-bottom: 10px;
}

.b-field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.greeting-image-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.greeting-pick {
  display: inline-block;
  cursor: pointer;
}

.greeting-image-hint {
  margin: 8px 0 0;
}

.greeting-img-err {
  margin: 8px 0 0;
}

.greeting-preview {
  display: block;
  max-width: 200px;
  max-height: 200px;
  margin-top: 8px;
  border-radius: 8px;
  border: 1px solid var(--b-border);
  object-fit: cover;
}

.pay-block {
  margin: 12px 0 18px;
  background: var(--b-surface-2);
}

.pay-block-title {
  margin: 0 0 10px;
  font-weight: 600;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

@media (max-width: 560px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}

.instruct-area {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 13px;
}

.lang-block {
  margin: 8px 0 18px;
  padding: 14px 14px 6px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
}

.lang-block-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.lang-modes {
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
}

@media (min-width: 640px) {
  .lang-modes {
    grid-template-columns: 1fr 1fr;
  }
}

.lang-mode-card {
  margin: 0;
}

.setup-form-plain {
  display: contents;
}

.ai-mode-fieldset {
  border: 1px solid var(--b-border);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 0 0 14px;
}

.ai-mode-fieldset .b-choice-grid {
  margin-top: 8px;
}

.upgrade-box {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #fde68a;
  background: var(--b-warn-soft);
  margin-bottom: 14px;
}

.upgrade-title {
  margin: 0 0 6px;
  font-weight: 600;
  font-size: 14px;
}

.ok-hint {
  color: var(--b-accent-hover);
  margin: 0 0 12px;
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

.lang-default-field {
  margin-top: 10px;
  margin-bottom: 8px;
}

.bank-select-hint {
  display: block;
  margin-top: 6px;
  line-height: 1.4;
}

.bank-select-field select {
  max-width: 100%;
}
</style>
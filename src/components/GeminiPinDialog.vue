<template>
  <Teleport to="body">
    <div
      v-if="state.open"
      class="pin-root"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'gemini-pin-title'"
    >
      <button
        v-if="!state.forced"
        type="button"
        class="pin-backdrop"
        aria-label="Đóng"
        @click="onDismiss"
      />
      <div v-else class="pin-backdrop pin-backdrop--static" aria-hidden="true" />

      <div class="pin-panel" @keydown.escape.prevent="onDismiss">
        <Shield class="pin-icon" :size="28" stroke-width="1.75" aria-hidden="true" />
        <p class="pin-kicker">{{ mode === 'setup' ? 'Bảo mật tài khoản' : 'Xác minh thiết bị' }}</p>
        <h2 id="gemini-pin-title" class="pin-title">
          {{ title }}
        </h2>
        <p class="pin-lede">{{ subtitle }}</p>

        <div v-if="mode === 'setup'" class="pin-steps" aria-hidden="true">
          <span class="pin-step" :class="{ on: setupStep === 1, done: setupStep > 1 }">1</span>
          <span class="pin-step-line" :class="{ on: setupStep > 1 }" />
          <span class="pin-step" :class="{ on: setupStep === 2 }">2</span>
        </div>

        <div class="pin-field">
          <div
            class="pin-cells"
            :key="cellKey"
            role="group"
            :aria-label="mode === 'setup' && setupStep === 2 ? 'Xác nhận PIN' : 'Nhập PIN 6 số'"
            @click="focusInput"
          >
            <span
              v-for="i in 6"
              :key="i"
              class="pin-cell"
              :class="{ filled: !!digits[i - 1], caret: caretIndex === i - 1 && focused }"
            >
              {{ digits[i - 1] ? '•' : '' }}
            </span>
          </div>
          <input
            ref="inputRef"
            v-model="inputValue"
            class="pin-hidden-input"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            autocomplete="one-time-code"
            @focus="focused = true"
            @blur="focused = false"
            @input="onDigitInput"
          />
        </div>

        <p v-if="error" class="pin-err" role="alert">{{ error }}</p>

        <div class="pin-actions">
          <button
            v-if="!state.forced"
            type="button"
            class="b-btn b-btn--ghost"
            :disabled="busy"
            @click="onDismiss"
          >
            Huỷ
          </button>
          <button
            type="button"
            class="b-btn b-btn--primary pin-submit"
            :disabled="busy || !canAdvance"
            @click="onPrimary"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Shield } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { isValidGeminiPin } from '@/utils/geminiKeyCrypto'
import { saveLocalGeminiPin } from '@/utils/geminiPinLocal'
import {
  completeGeminiPinGate,
  dismissGeminiPinGate,
  geminiPinGateState as state,
} from '@/composables/useGeminiPinGate'

const auth = useAuthStore()

const mode = computed(() => state.mode || 'unlock')
const setupStep = ref(1)
const pinFirst = ref('')
const inputValue = ref('')
const error = ref('')
const busy = ref(false)
const focused = ref(false)
const inputRef = ref(null)
const cellKey = ref(0)

const digits = computed(() => {
  const chars = String(inputValue.value || '').replace(/\D/g, '').slice(0, 6).split('')
  while (chars.length < 6) chars.push('')
  return chars
})

const caretIndex = computed(() => Math.min(String(inputValue.value || '').length, 5))

const title = computed(() => {
  if (mode.value === 'unlock') return 'Nhập mã PIN'
  return setupStep.value === 1 ? 'Tạo mã PIN' : 'Xác nhận mã PIN'
})

const subtitle = computed(() => {
  if (mode.value === 'unlock') {
    return 'Mã 6 số — lưu trên máy này để mã hóa API key. Máy khác sẽ hỏi lại một lần.'
  }
  if (setupStep.value === 1) {
    return 'Dùng để mã hóa Gemini API key. PIN không lưu trên server Botty.'
  }
  return 'Nhập lại đúng 6 số vừa chọn.'
})

const canAdvance = computed(() => isValidGeminiPin(inputValue.value))

const primaryLabel = computed(() => {
  if (busy.value) return 'Đang xử lý…'
  if (mode.value === 'setup' && setupStep.value === 1) return 'Tiếp tục'
  if (mode.value === 'setup') return 'Hoàn tất'
  return 'Xác nhận'
})

function focusInput() {
  inputRef.value?.focus()
}

function onDigitInput() {
  error.value = ''
  const v = String(inputValue.value || '').replace(/\D/g, '').slice(0, 6)
  inputValue.value = v
}

function resetFields() {
  setupStep.value = 1
  pinFirst.value = ''
  inputValue.value = ''
  error.value = ''
  busy.value = false
  cellKey.value += 1
}

watch(
  () => state.open,
  async (open) => {
    if (open) {
      resetFields()
      await nextTick()
      focusInput()
    }
  },
)

watch(
  () => auth.user?.hasGeminiPin,
  (has) => {
    if (has && state.mode === 'setup') state.open = false
  },
)

function onDismiss() {
  dismissGeminiPinGate()
}

async function onPrimary() {
  if (!canAdvance.value || busy.value) return
  error.value = ''

  if (mode.value === 'setup' && setupStep.value === 1) {
    pinFirst.value = inputValue.value
    setupStep.value = 2
    inputValue.value = ''
    cellKey.value += 1
    await nextTick()
    focusInput()
    return
  }

  busy.value = true
  try {
    if (mode.value === 'setup') {
      if (inputValue.value !== pinFirst.value) {
        error.value = 'PIN xác nhận không khớp'
        return
      }
      const chosen = pinFirst.value
      await api.auth.setupGeminiPin(chosen, inputValue.value)
      await auth.refreshUser()
      saveLocalGeminiPin(auth.user?.id, chosen)
      state.open = false
      return
    }

    const pin = inputValue.value
    await api.auth.verifyGeminiPin(pin)
    saveLocalGeminiPin(auth.user?.id, pin)
    completeGeminiPinGate(pin)
  } catch (e) {
    if (mode.value === 'unlock') {
      error.value = e?.message || 'PIN không đúng'
      inputValue.value = ''
      cellKey.value += 1
      await nextTick()
      focusInput()
    } else {
      error.value = e?.message || 'Không lưu được PIN'
    }
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.pin-root {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 20px;
}

.pin-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  margin: 0;
  padding: 0;
  background: rgba(28, 20, 12, 0.42);
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.pin-backdrop--static {
  cursor: default;
}

.pin-panel {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
  padding: 28px 26px 22px;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--b-accent, #6366f1) 14%, var(--b-border, #e2e8f0));
  background:
    radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--b-accent, #6366f1) 12%, transparent), transparent 55%),
  #fff;
  box-shadow: 0 28px 64px -22px rgba(15, 23, 42, 0.35), 0 2px 8px rgba(15, 23, 42, 0.06);
  text-align: center;
  animation: pin-in 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pin-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pin-icon {
  color: var(--b-accent, #6366f1);
  margin: 0 auto 8px;
}

.pin-kicker {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--b-muted, #64748b);
}

.pin-title {
  margin: 6px 0 8px;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--b-ink, #0f172a);
}

.pin-lede {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--b-muted, #64748b);
}

.pin-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}

.pin-step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--b-border-strong, #cbd5e1);
  color: var(--b-muted, #64748b);
  background: #fff;
}

.pin-step.on {
  border-color: var(--b-accent, #6366f1);
  background: var(--b-accent, #6366f1);
  color: #fff;
}

.pin-step.done {
  border-color: var(--b-accent, #6366f1);
  background: color-mix(in srgb, var(--b-accent, #6366f1) 12%, #fff);
  color: var(--b-accent, #6366f1);
}

.pin-step-line {
  width: 36px;
  height: 2px;
  border-radius: 2px;
  background: var(--b-border, #e2e8f0);
}

.pin-step-line.on {
  background: var(--b-accent, #6366f1);
}

.pin-field {
  position: relative;
  margin-bottom: 12px;
}

.pin-cells {
  display: flex;
  justify-content: center;
  gap: 10px;
  cursor: text;
}

.pin-cell {
  width: 46px;
  height: 52px;
  border-radius: 14px;
  border: 1.5px solid var(--b-border-strong, #cbd5e1);
  background: var(--b-surface-2, #f8fafc);
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 600;
  color: var(--b-ink, #0f172a);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.pin-cell.filled {
  border-color: color-mix(in srgb, var(--b-accent, #6366f1) 40%, var(--b-border-strong, #cbd5e1));
  background: #fff;
}

.pin-cell.caret {
  border-color: var(--b-accent, #6366f1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--b-accent, #6366f1) 22%, transparent);
}

.pin-hidden-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: text;
}

.pin-err {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--b-danger, #dc2626);
}

.pin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.pin-submit {
  min-width: 120px;
}
</style>
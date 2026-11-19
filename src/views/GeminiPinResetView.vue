<template>
  <section class="pin-reset-page">
    <div class="pin-reset-card b-card b-card-pad">
      <h1 class="b-title-sm">Đặt lại mã PIN tài khoản</h1>
      <p v-if="!token" class="b-msg-err">Link không hợp lệ — mở từ email xác minh.</p>
      <template v-else>
        <p class="b-muted">
          PIN mới sẽ thay PIN cũ. <strong>Mọi Gemini API key trên bot của bạn sẽ bị xóa</strong> — sau đó nhập lại key từng bot.
        </p>
        <label class="b-field">
          <span>PIN mới (6 số)</span>
          <input v-model="pin" class="b-input" type="password" inputmode="numeric" maxlength="6" />
        </label>
        <label class="b-field">
          <span>Nhập lại PIN</span>
          <input v-model="confirmPin" class="b-input" type="password" inputmode="numeric" maxlength="6" />
        </label>
        <p v-if="error" class="b-msg-err">{{ error }}</p>
        <p v-if="success" class="ok-hint">{{ success }}</p>
        <button
          type="button"
          class="b-btn b-btn--primary"
          :disabled="saving || !canSubmit"
          @click="submit"
        >
          {{ saving ? 'Đang lưu…' : 'Xác nhận PIN mới' }}
        </button>
      </template>
      <RouterLink to="/" class="b-btn b-btn--ghost b-btn--sm" style="margin-top: 12px">Về trang chủ</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { isValidGeminiPin } from '@/utils/geminiKeyCrypto'
import { saveLocalGeminiPin } from '@/utils/geminiPinLocal'

const route = useRoute()
const auth = useAuthStore()
const token = computed(() => String(route.query.token || '').trim())

const pin = ref('')
const confirmPin = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')

const canSubmit = computed(() => isValidGeminiPin(pin.value) && pin.value === confirmPin.value)

async function submit() {
  error.value = ''
  success.value = ''
  if (!canSubmit.value) {
    error.value = 'PIN phải 6 chữ số và khớp'
    return
  }
  saving.value = true
  try {
    const chosen = pin.value
    const data = await api.auth.confirmGeminiPinReset(token.value, chosen, confirmPin.value)
    success.value = data?.message || 'Đã đặt PIN mới'
    if (auth.isLoggedIn) {
      await auth.refreshUser()
      saveLocalGeminiPin(auth.user?.id, chosen)
    }
  } catch (e) {
    error.value = e?.message || 'Không đặt lại được PIN'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.pin-reset-page {
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding: 2rem 1.25rem;
}

.pin-reset-card {
  width: min(440px, 100%);
  display: grid;
  gap: 12px;
}

.ok-hint {
  color: var(--b-accent);
  font-size: 14px;
  margin: 0;
}
</style>
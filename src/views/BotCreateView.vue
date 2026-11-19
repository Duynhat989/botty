<template>
  <div class="b-studio create">
    <RouterLink to="/" class="back">
      <ArrowLeft :size="16" aria-hidden="true" />
      Quay lại
    </RouterLink>

    <div class="b-card b-card-pad-lg form-card">
      <p class="b-kicker">Bước 1</p>
      <h1 class="b-title">Tạo bot mới</h1>
      <p class="b-lede b-lede--left">Đặt tên hiển thị — cấu hình Facebook và Gemini ở bước tiếp theo.</p>

      <form class="form" @submit.prevent="submit">
        <label class="b-field">
          <span>Tên bot</span>
          <input
            v-model="name"
            class="b-input"
            type="text"
            placeholder="Ví dụ: Hỗ trợ khách Shop X"
            required
            autocomplete="off"
          />
        </label>

        <button class="b-btn b-btn--primary" type="submit" :disabled="saving">
          {{ saving ? 'Đang tạo…' : 'Tiếp tục' }}
        </button>
        <p v-if="error" class="b-msg-err">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { api } from '@/api'

const router = useRouter()
const name = ref('')
const saving = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const data = await api.bots.create({ name: name.value.trim() })
    const id = data?.bot?.id
    if (id) router.push(`/bots/${id}/test`)
    else router.push('/')
  } catch (e) {
    error.value = 'Không tạo được bot. Thử lại.'
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.create {
  max-width: 560px;
  display: grid;
  gap: 16px;
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

.form {
  margin-top: 1.5rem;
  display: grid;
  gap: 1rem;
}

.form-card .b-lede {
  margin-bottom: 0;
}
</style>
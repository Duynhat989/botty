<template>
  <div class="b-studio report-page">
    <header class="head">
      <p class="b-kicker">Hỗ trợ</p>
      <h1 class="b-title">Báo cáo sự cố</h1>
      <p class="b-lede b-lede--left">Mô tả lỗi webhook, bot không trả lời, thanh toán… để đội kỹ thuật xử lý.</p>
    </header>

    <form class="b-card b-card-pad-lg form" @submit.prevent="submit">
      <label class="b-field">
        <span>Tiêu đề</span>
        <input v-model="subject" class="b-input" required maxlength="200" placeholder="VD: Webhook Facebook 403" />
      </label>
      <label class="b-field">
        <span>Chi tiết</span>
        <textarea
          v-model="description"
          class="b-textarea"
          rows="6"
          required
          placeholder="Thời gian, mã bot, bước tái hiện…"
        />
      </label>
      <p v-if="error" class="b-msg-err">{{ error }}</p>
      <p v-if="success" class="ok-hint">{{ success }}</p>
      <button type="submit" class="b-btn b-btn--primary" :disabled="saving">
        {{ saving ? 'Đang gửi…' : 'Gửi báo cáo' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/api'

const subject = ref('')
const description = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')

async function submit() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    const data = await api.support.reportIncident({
      subject: subject.value.trim(),
      description: description.value.trim(),
    })
    success.value = data?.message || 'Đã gửi báo cáo.'
    subject.value = ''
    description.value = ''
  } catch (e) {
    error.value = e?.message || 'Không gửi được'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.report-page {
  max-width: 560px;
}

.head {
  margin-bottom: 24px;
}

.form {
  display: grid;
  gap: 14px;
}

.ok-hint {
  color: var(--b-accent-hover);
  margin: 0;
}
</style>
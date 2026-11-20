<template>
  <div v-if="open" class="dup-modal-root" role="dialog" aria-modal="true" aria-labelledby="dup-title">
    <button type="button" class="dup-backdrop" aria-label="Đóng" @click="close" />
    <div class="dup-panel">
      <header class="dup-head">
        <h2 id="dup-title" class="dup-title">Sao chép bot</h2>
        <p class="b-caption dup-lede">
          Sao chép kho, tài liệu, mục tiêu và cài đặt từ
          <strong>{{ sourceName }}</strong
          >. Không copy lịch sử chat / thử bot. Bot mới ở trạng thái tạm dừng, chưa gắn Facebook.
        </p>
      </header>
      <label class="b-field">
        <span>Tên bot mới</span>
        <input
          v-model="name"
          class="b-input"
          type="text"
          maxlength="120"
          autofocus
          @keydown.enter.prevent="submit"
        />
      </label>
      <p v-if="error" class="b-msg-err">{{ error }}</p>
      <footer class="dup-foot">
        <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="saving" @click="close">Hủy</button>
        <button type="button" class="b-btn b-btn--primary b-btn--sm" :disabled="saving || !name.trim()" @click="submit">
          {{ saving ? 'Đang sao chép…' : 'Sao chép' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps({
  open: { type: Boolean, default: false },
  sourceId: { type: String, default: '' },
  sourceName: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'duplicated', 'failed'])

const name = ref('')
const saving = ref(false)
const error = ref('')

function defaultName(src) {
  const base = String(src || 'Bot').trim() || 'Bot'
  const suffix = ' (bản sao)'
  if (base.length + suffix.length <= 120) return base + suffix
  return `${base.slice(0, 120 - suffix.length)}${suffix}`
}

function close() {
  if (saving.value) return
  emit('update:open', false)
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = defaultName(props.sourceName)
      error.value = ''
    }
  },
)

async function submit() {
  const trimmed = name.value.trim()
  if (!trimmed || !props.sourceId) return
  saving.value = true
  error.value = ''
  try {
    const data = await api.bots.duplicate(props.sourceId, { name: trimmed })
    emit('duplicated', { bot: data?.bot, documentsCopied: data?.documentsCopied })
    emit('update:open', false)
  } catch (e) {
    if (e?.messageCode === 'BOT_LIMIT_REACHED') {
      error.value = 'Đã đạt giới hạn số bot — nâng cấp gói để sao chép.'
      emit('failed', { code: 'BOT_LIMIT_REACHED', text: error.value })
    } else {
      error.value = 'Không sao chép được. Thử lại sau.'
      emit('failed', { text: error.value })
    }
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dup-modal-root {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dup-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.45);
  cursor: pointer;
}

.dup-panel {
  position: relative;
  width: min(100%, 400px);
  padding: 18px 18px 14px;
  border-radius: 14px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--b-border, #e8eaed);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
}

.dup-head {
  margin-bottom: 12px;
}

.dup-title {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
}

.dup-lede {
  margin: 0;
  text-align: left;
}

.b-field {
  margin-bottom: 8px;
}

.dup-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
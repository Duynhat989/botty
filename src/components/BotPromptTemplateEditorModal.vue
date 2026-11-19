<template>
  <div v-if="open" class="overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal b-card b-card-pad">
      <h3 class="b-title-sm">{{ editing ? 'Sửa mẫu' : 'Thêm mẫu' }} — {{ kindLabel }}</h3>
      <p class="b-caption modal-lede">
        {{ isAdmin ? 'Bật «Mọi người» để mẫu hiện cho toàn bộ user (admin).' : 'Mẫu chỉ bạn thấy và dùng.' }}
      </p>

      <form class="form" @submit.prevent="submit">
        <label class="b-field">
          <span>Tên hiển thị</span>
          <input v-model="form.label" class="b-input" required maxlength="120" />
        </label>
        <label class="b-field">
          <span>Mô tả ngắn</span>
          <input v-model="form.hint" class="b-input" maxlength="200" />
        </label>
        <label v-if="kind === 'chat_style'" class="b-field">
          <span>Câu mẫu (tuỳ chọn)</span>
          <input v-model="form.sample" class="b-input" maxlength="500" />
        </label>
        <label class="b-field">
          <span>{{ kind === 'chat_style' ? 'Nội dung prompt phong cách' : 'Nội dung instruction' }}</span>
          <textarea v-model="form.body" class="b-textarea" rows="12" required />
          <small v-if="kind === 'industry'" class="b-micro">Có thể dùng &#123;&#123;SHOP&#125;&#125; cho tên shop.</small>
        </label>

        <label v-if="isAdmin" class="b-switch global-toggle">
          <input v-model="form.global" type="checkbox" />
          <span class="b-switch-track" aria-hidden="true" />
          Hiển thị cho mọi người (admin)
        </label>

        <p v-if="errorText" class="b-msg-err">{{ errorText }}</p>
        <div class="actions">
          <button type="button" class="b-btn b-btn--ghost" @click="emit('close')">Huỷ</button>
          <button type="submit" class="b-btn b-btn--primary" :disabled="saving">
            {{ saving ? 'Đang lưu…' : 'Lưu mẫu' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps({
  open: { type: Boolean, default: false },
  kind: { type: String, default: 'industry' },
  template: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const errorText = ref('')

const form = reactive({
  label: '',
  hint: '',
  body: '',
  sample: '',
  global: false,
})

const editing = computed(() => Boolean(props.template?.id))

const kindLabel = computed(() => (props.kind === 'chat_style' ? 'Phong cách trò chuyện' : 'Loại hình shop'))

watch(
  () => [props.open, props.template],
  () => {
    if (!props.open) return
    errorText.value = ''
    form.label = props.template?.label || ''
    form.hint = props.template?.hint || ''
    form.body = props.template?.body || ''
    form.sample = props.template?.sample || ''
    form.global = props.template?.scope === 'global'
  },
  { immediate: true },
)

async function submit() {
  errorText.value = ''
  saving.value = true
  try {
    const body = {
      kind: props.kind,
      label: form.label.trim(),
      hint: form.hint.trim(),
      body: form.body.trim(),
      sample: props.kind === 'chat_style' ? form.sample.trim() : undefined,
      global: props.isAdmin ? form.global : false,
    }
    if (editing.value) {
      await api.bots.updatePromptTemplate(props.template.id, body)
    } else {
      await api.bots.createPromptTemplate(body)
    }
    emit('saved')
    emit('close')
  } catch (e) {
    errorText.value = 'Không lưu được mẫu.'
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.modal {
  width: min(520px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
}

.modal-lede {
  margin: 8px 0 16px;
}

.form {
  display: grid;
  gap: 14px;
}

.global-toggle {
  margin-top: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}
</style>
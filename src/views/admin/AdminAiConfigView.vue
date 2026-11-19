<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.aiTitle') }}</h1>
        <p>{{ t('admin.aiLede') }}</p>
      </div>
      <button type="button" class="primary" :disabled="loading" @click="openCreate">
        {{ t('admin.aiAdd') }}
      </button>
    </header>

    <div class="tabs">
      <button type="button" :class="{ on: tab === 'industry' }" @click="tab = 'industry'">
        Ngành (industry)
      </button>
      <button type="button" :class="{ on: tab === 'chat_style' }" @click="tab = 'chat_style'">
        Giọng điệu (chat_style)
      </button>
    </div>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="notice" class="hint ok">{{ notice }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Gợi ý</th>
            <th>Thứ tự</th>
            <th>{{ t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in currentList" :key="item.id">
            <td>
              <strong>{{ item.label }}</strong>
              <span class="mono">{{ item.id }}</span>
            </td>
            <td>{{ item.hint || '—' }}</td>
            <td>{{ item.sortOrder }}</td>
            <td>
              <button type="button" class="linkish" @click="openEdit(item)">Sửa</button>
              <button type="button" class="linkish danger" @click="remove(item)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !currentList.length" class="hint">{{ t('admin.emptyAi') }}</p>
    </div>

    <div v-if="modal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal form" @submit.prevent="save">
        <h3>{{ editing ? 'Sửa mẫu' : 'Thêm mẫu global' }}</h3>
        <label>
          Loại
          <select v-model="form.kind" :disabled="Boolean(editing)">
            <option value="industry">Ngành (instruction)</option>
            <option value="chat_style">Giọng điệu</option>
          </select>
        </label>
        <label>
          Tên hiển thị
          <input v-model="form.label" required maxlength="120" />
        </label>
        <label>
          Gợi ý ngắn
          <input v-model="form.hint" maxlength="200" />
        </label>
        <label v-if="form.kind === 'chat_style'">
          Ví dụ câu trả lời (sample)
          <textarea v-model="form.sample" rows="2" maxlength="500" />
        </label>
        <label>
          Nội dung (body / instruction)
          <textarea v-model="form.body" rows="8" required />
        </label>
        <label>
          Thứ tự
          <input v-model.number="form.sortOrder" type="number" min="0" step="1" />
        </label>
        <div class="modal-actions">
          <button type="button" @click="closeModal">Hủy</button>
          <button type="submit" class="primary" :disabled="saving">{{ saving ? 'Đang lưu…' : t('admin.saveUser') }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'
import { useI18n } from '@/i18n'
import './admin-shared.css'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const tab = ref('industry')
const industry = ref([])
const chatStyle = ref([])
const modal = ref(false)
const editing = ref(null)
const form = ref(emptyForm())

const currentList = computed(() => (tab.value === 'chat_style' ? chatStyle.value : industry.value))

function emptyForm() {
  return {
    kind: 'industry',
    label: '',
    hint: '',
    body: '',
    sample: '',
    sortOrder: 0,
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.admin.promptTemplates()
    industry.value = data.industry || []
    chatStyle.value = data.chatStyle || []
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { ...emptyForm(), kind: tab.value }
  modal.value = true
}

function openEdit(item) {
  editing.value = item
  form.value = {
    kind: item.kind,
    label: item.label,
    hint: item.hint || '',
    body: item.body,
    sample: item.sample || '',
    sortOrder: item.sortOrder || 0,
  }
  modal.value = true
}

function closeModal() {
  modal.value = false
  editing.value = null
}

async function save() {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const body = { ...form.value }
    if (body.kind !== 'chat_style') delete body.sample
    if (editing.value) {
      await api.admin.updatePromptTemplate(editing.value.id, body)
    } else {
      await api.admin.createPromptTemplate(body)
    }
    notice.value = t('admin.userSavedOk')
    closeModal()
    await load()
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

async function remove(item) {
  if (!window.confirm(`Xóa mẫu «${item.label}»?`)) return
  error.value = ''
  try {
    await api.admin.deletePromptTemplate(item.id)
    notice.value = 'Đã xóa mẫu.'
    await load()
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  }
}

onMounted(load)
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
}
.tabs button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  cursor: pointer;
}
.tabs button.on {
  border-color: var(--accent);
  background: #fff9e6;
}
.mono {
  display: block;
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
}
.linkish {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font: inherit;
  margin-right: 8px;
}
.linkish.danger {
  color: #b91c1c;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 16px;
}
.modal {
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  display: grid;
  gap: 10px;
}
.modal h3 {
  margin: 0 0 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
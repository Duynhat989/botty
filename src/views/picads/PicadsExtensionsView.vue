<template>
  <PicadsPage title="Phát hành extension" lede="Tải file .zip / .crx / .xpi và gắn số phiên bản semver.">
    <section class="card api-hint">
      <h2>API công khai (check &amp; tải)</h2>
      <p class="hint-lede">Extension client gọi không cần đăng nhập.</p>
      <pre class="code">{{ publicApiSnippet }}</pre>
    </section>
    <section class="card upload-card">
      <h2>Tải lên bản mới</h2>
      <form class="upload-form" @submit.prevent="upload">
        <label class="field">
          <span>Phiên bản *</span>
          <input
            v-model="version"
            type="text"
            required
            placeholder="1.0.0"
            pattern="[0-9]+(\.[0-9]+){0,3}([\-+][\w.]+)?"
            title="VD: 1.2.0 hoặc 1.0.0-beta.1"
          />
        </label>
        <label class="field">
          <span>Ghi chú</span>
          <textarea v-model="notes" rows="2" placeholder="Thay đổi trong bản này…" />
        </label>
        <label class="field">
          <span>File extension *</span>
          <input ref="fileInput" type="file" accept=".zip,.crx,.xpi" required @change="onFile" />
        </label>
        <p v-if="uploadErr" class="err">{{ uploadErr }}</p>
        <button type="submit" class="btn" :disabled="uploading">
          {{ uploading ? 'Đang tải lên…' : 'Đăng bản' }}
        </button>
      </form>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Danh sách phát hành</h2>
        <button type="button" class="btn-ghost" :disabled="loading" @click="load">Làm mới</button>
      </div>
      <p v-if="loadErr" class="err">{{ loadErr }}</p>
      <div v-if="!releases.length && !loading" class="empty">Chưa có bản extension nào.</div>
      <table v-if="releases.length" class="table">
        <thead>
          <tr>
            <th>Phiên bản</th>
            <th>File</th>
            <th>Kích thước</th>
            <th>Ngày</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in releases" :key="r.id">
            <td><strong>{{ r.version }}</strong></td>
            <td>{{ r.fileName }}</td>
            <td>{{ formatSize(r.fileSize) }}</td>
            <td>{{ formatDate(r.createdAt) }}</td>
            <td class="actions">
              <a class="link" :href="downloadUrl(r.fileUrl)" download>Tải về</a>
              <button type="button" class="danger" @click="remove(r)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </PicadsPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, ApiError } from '@/api'
import { getApiBaseUrl } from '@/api/client'
import PicadsPage from '@/components/picads/PicadsPage.vue'

const version = ref('')
const notes = ref('')
const file = ref(null)
const fileInput = ref(null)
const uploading = ref(false)
const uploadErr = ref('')
const loading = ref(false)
const loadErr = ref('')
const releases = ref([])

const publicApiSnippet = computed(() => {
  const base = getApiBaseUrl().replace(/\/$/, '')
  return [
    `GET ${base}/v3/picads/extensions/check?version=1.0.0`,
    `GET ${base}/v3/picads/extensions/latest`,
    `GET ${base}/v3/picads/extensions/download?latest=1`,
    `GET ${base}/v3/picads/extensions/download?version=1.2.0`,
  ].join('\n')
})

function onFile(ev) {
  file.value = ev.target.files?.[0] || null
}

function formatSize(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN')
}

function downloadUrl(path) {
  const base = getApiBaseUrl().replace(/\/api$/, '')
  return `${base}${path}`
}

async function load() {
  loadErr.value = ''
  loading.value = true
  try {
    const data = await api.picads.extensions()
    releases.value = data.releases || []
  } catch (e) {
    loadErr.value = e instanceof ApiError ? e.messageCode : 'Không tải được danh sách.'
  } finally {
    loading.value = false
  }
}

const uploadMessages = {
  PICADS_VERSION_INVALID: 'Phiên bản không hợp lệ (dùng semver, VD: 1.0.0).',
  PICADS_VERSION_EXISTS: 'Phiên bản này đã tồn tại.',
  PICADS_EXT_FORMAT: 'Chỉ chấp nhận .zip, .crx hoặc .xpi.',
  PICADS_EXT_FILE_REQUIRED: 'Chọn file extension.',
  PICADS_EXT_TOO_LARGE: 'File vượt giới hạn 80MB.',
}

async function upload() {
  uploadErr.value = ''
  if (!file.value) {
    uploadErr.value = 'Chọn file extension.'
    return
  }
  const fd = new FormData()
  fd.append('version', version.value.trim())
  fd.append('notes', notes.value.trim())
  fd.append('file', file.value)
  uploading.value = true
  try {
    await api.picads.uploadExtension(fd)
    version.value = ''
    notes.value = ''
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
    await load()
  } catch (e) {
    uploadErr.value = e instanceof ApiError
      ? (uploadMessages[e.messageCode] || e.messageCode)
      : 'Tải lên thất bại.'
  } finally {
    uploading.value = false
  }
}

async function remove(r) {
  if (!window.confirm(`Xóa bản ${r.version}?`)) return
  try {
    await api.picads.removeExtension(r.id)
    await load()
  } catch {
    window.alert('Không xóa được bản này.')
  }
}

onMounted(load)
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 18px;
}

.upload-card h2,
.card-head h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.upload-form {
  display: grid;
  gap: 12px;
}

.field span {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
}

.btn {
  justify-self: start;
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn-ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 10px 8px;
  text-align: left;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.link {
  color: #4f46e5;
  text-decoration: none;
}

.danger {
  border: 0;
  background: none;
  color: #b91c1c;
  cursor: pointer;
  font-size: 13px;
}

.err {
  color: #b91c1c;
  font-size: 13px;
  margin: 0;
}

.empty {
  color: #64748b;
  font-size: 14px;
}

.api-hint h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.hint-lede {
  margin: 0 0 10px;
  font-size: 13px;
  color: #64748b;
}

.code {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  overflow: auto;
  line-height: 1.5;
}
</style>
<template>
  <form class="form" :class="embedded ? 'form--embedded' : 'b-card b-card-pad-lg'" @submit.prevent="submit">
    <label class="b-field">
      <span>Tiêu đề</span>
      <input
        v-model="subject"
        class="b-input"
        required
        minlength="3"
        maxlength="200"
        placeholder="VD: Bot không trả lời"
      />
    </label>
    <label class="b-field">
      <span>Chi tiết</span>
      <textarea
        v-model="description"
        class="b-textarea"
        rows="6"
        required
        minlength="10"
        placeholder="Thời gian, mã bot, bước tái hiện…"
      />
    </label>

    <div class="attach-block">
      <div class="attach-head">
        <span class="b-label">Ảnh đính kèm</span>
        <span class="b-micro">Tối đa {{ maxImages }} ảnh · mỗi ảnh &lt; 2MB · JPG/PNG/WebP/GIF</span>
      </div>
      <div v-if="images.length" class="thumb-row">
        <figure v-for="(img, idx) in images" :key="idx" class="thumb">
          <img :src="img.dataUrl" alt="" />
          <button type="button" class="thumb-remove" aria-label="Xóa ảnh" @click="removeImage(idx)">×</button>
        </figure>
      </div>
      <label v-if="images.length < maxImages" class="attach-btn">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          class="sr-only"
          @change="onPickImages"
        />
        <span class="b-btn b-btn--ghost b-btn--sm">Chọn ảnh</span>
      </label>
    </div>

    <p v-if="error" class="b-msg-err">{{ error }}</p>
    <p v-if="success" class="ok-hint">{{ success }}</p>
    <button type="submit" class="b-btn b-btn--primary" :disabled="saving">
      {{ saving ? 'Đang gửi…' : 'Gửi báo cáo' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'

defineProps({
  embedded: { type: Boolean, default: false },
})

const maxImages = 2
const maxBytes = 2 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])

const subject = ref('')
const description = ref('')
const images = ref([])
const saving = ref(false)
const error = ref('')
const success = ref('')

function guessMimeFromName(name) {
  const n = String(name || '').toLowerCase()
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  if (n.endsWith('.gif')) return 'image/gif'
  return ''
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

async function onPickImages(event) {
  error.value = ''
  const input = event.target
  const files = [...(input.files || [])]
  input.value = ''
  const room = maxImages - images.value.length
  if (room <= 0) return

  for (const file of files.slice(0, room)) {
    const mime = file.type || guessMimeFromName(file.name)
    if (!allowedTypes.has(mime)) {
      error.value = 'Chỉ hỗ trợ JPG, PNG, WebP hoặc GIF.'
      continue
    }
    if (file.size > maxBytes) {
      error.value = 'Mỗi ảnh phải nhỏ hơn 2MB.'
      continue
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      images.value.push({ name: file.name, dataUrl })
    } catch {
      error.value = 'Không đọc được ảnh.'
    }
  }
}

function removeImage(index) {
  images.value = images.value.filter((_, i) => i !== index)
}

async function submit() {
  error.value = ''
  success.value = ''
  const sub = subject.value.trim()
  const desc = description.value.trim()
  if (sub.length < 3) {
    error.value = 'Tiêu đề cần ít nhất 3 ký tự.'
    return
  }
  if (desc.length < 10) {
    error.value = 'Mô tả cần ít nhất 10 ký tự.'
    return
  }
  saving.value = true
  try {
    const data = await api.support.reportIncident({
      subject: subject.value.trim(),
      description: description.value.trim(),
      attachments: images.value.map(({ name, dataUrl }) => ({ name, dataUrl })),
    })
    success.value = data?.message || 'Đã gửi báo cáo.'
    subject.value = ''
    description.value = ''
    images.value = []
  } catch (e) {
    error.value =
      e instanceof ApiError ? apiMessage(e, 'api.messages.INCIDENT_SUBMIT_FAILED') : e?.message || 'Không gửi được'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 14px;
}

.form--embedded {
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.attach-block {
  display: grid;
  gap: 10px;
}

.attach-head {
  display: grid;
  gap: 4px;
}

.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.thumb {
  position: relative;
  margin: 0;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--b-border);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.attach-btn {
  display: inline-block;
  cursor: pointer;
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

.ok-hint {
  color: var(--b-accent-hover);
  margin: 0;
}
</style>
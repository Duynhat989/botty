<template>
  <div class="bot-avatar-editor" :class="{ 'bot-avatar-editor--compact': compact }">
    <div class="bot-avatar-preview" :class="{ 'is-busy': busy }">
      <img :src="previewSrc" :alt="`Ảnh đại diện ${botName}`" class="bot-avatar-img" />
    </div>
    <div v-if="!compact" class="bot-avatar-meta">
      <p class="bot-avatar-title">Ảnh đại diện bot</p>
      <p class="b-micro bot-avatar-hint">JPG, PNG, WebP hoặc GIF. Dùng mặc định Botty hoặc ảnh riêng.</p>
    </div>
    <div class="bot-avatar-actions">
      <label
        class="b-btn b-btn--ghost b-btn--sm bot-avatar-btn"
        :class="{ 'is-disabled': busy }"
      >
        <input
          type="file"
          class="b-file-input"
          :accept="imageAccept"
          :disabled="busy"
          @change="onPick"
        />
        {{ busy ? 'Đang tải…' : compact ? 'Đổi ảnh' : 'Tải ảnh lên' }}
      </label>
      <button
        type="button"
        class="b-btn b-btn--ghost b-btn--sm"
        :disabled="busy || !hasCustom"
        @click="useDefault"
      >
        {{ compact ? 'Mặc định' : 'Dùng mặc định' }}
      </button>
    </div>
    <p v-if="error" class="b-msg-err bot-avatar-err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { api } from '@/api'
import { compressImageFile, GREETING_IMAGE_ACCEPT, GREETING_IMAGE_MAX_BYTES } from '@/utils/imageCompress'
import { botHasCustomAvatar, resolveBotAvatarUrl } from '@/utils/botAvatar'

const props = defineProps({
  botId: { type: String, required: true },
  botName: { type: String, default: 'Bot' },
  avatarUrl: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['updated'])

const busy = ref(false)
const error = ref('')
const imageAccept = GREETING_IMAGE_ACCEPT

const hasCustom = computed(() => botHasCustomAvatar({ avatarUrl: props.avatarUrl }))
const previewSrc = computed(() => resolveBotAvatarUrl({ avatarUrl: props.avatarUrl }))

function apiMessage(err) {
  return err?.message || err?.data?.message || ''
}

async function onPick(ev) {
  const file = ev.target?.files?.[0]
  ev.target.value = ''
  if (!file || busy.value) return
  error.value = ''
  busy.value = true
  try {
    const blob = await compressImageFile(file, { maxBytes: GREETING_IMAGE_MAX_BYTES, maxEdge: 720 })
    const uploadFile = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' })
    const data = await api.bots.uploadAvatar(props.botId, uploadFile)
    emit('updated', data?.bot || { avatarUrl: data?.avatarUrl })
  } catch (err) {
    if (err?.message === 'IMAGE_FORMAT') {
      error.value = 'Chỉ hỗ trợ JPG, PNG, WebP hoặc GIF.'
    } else {
      error.value = apiMessage(err) || 'Không tải được ảnh. Thử lại.'
    }
    console.error(err)
  } finally {
    busy.value = false
  }
}

async function useDefault() {
  if (busy.value || !hasCustom.value) return
  error.value = ''
  busy.value = true
  try {
    const data = await api.bots.update(props.botId, { clearAvatar: true })
    emit('updated', data?.bot || { avatarUrl: '' })
  } catch (err) {
    error.value = apiMessage(err) || 'Không đặt lại được ảnh mặc định.'
    console.error(err)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.bot-avatar-editor {
  display: grid;
  gap: 10px;
}

.bot-avatar-editor--compact {
  gap: 8px;
}

.bot-avatar-preview {
  width: fit-content;
  border-radius: 16px;
  padding: 3px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--b-accent) 25%, #fff),
    color-mix(in srgb, var(--b-accent) 8%, var(--color-surface))
  );
  box-shadow: 0 10px 24px -16px color-mix(in srgb, var(--b-accent) 40%, transparent);
}

.bot-avatar-editor--compact .bot-avatar-preview {
  margin: 0 auto;
}

.bot-avatar-preview.is-busy {
  opacity: 0.65;
}

.bot-avatar-img {
  display: block;
  width: 88px;
  height: 88px;
  border-radius: 13px;
  object-fit: cover;
  background: var(--b-surface-2);
}

.bot-avatar-editor--compact .bot-avatar-img {
  width: 72px;
  height: 72px;
}

.bot-avatar-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink);
}

.bot-avatar-hint {
  margin: 4px 0 0;
  text-align: left;
}

.bot-avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bot-avatar-editor--compact .bot-avatar-actions {
  justify-content: center;
}

.bot-avatar-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.bot-avatar-btn.is-disabled {
  opacity: 0.55;
  pointer-events: none;
}

.bot-avatar-err {
  margin: 0;
  font-size: 12px;
}
</style>
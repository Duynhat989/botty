<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.settingsTitle') }}</h1>
        <p>{{ t('admin.settingsLede') }}</p>
      </div>
    </header>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="notice" class="hint ok">{{ notice }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <form v-else class="form card" @submit.prevent="save">
      <fieldset class="fieldset">
        <legend>{{ t('admin.storageLegend') }}</legend>
        <p class="hint">{{ t('admin.storageHint') }}</p>

        <div class="radio-row">
          <label class="radio-card" :class="{ on: form.provider === 'server' }">
            <input v-model="form.provider" type="radio" value="server" />
            <span class="radio-title">{{ t('admin.storageServer') }}</span>
            <span class="radio-hint">{{ t('admin.storageServerHint') }}</span>
          </label>
          <label class="radio-card" :class="{ on: form.provider === 'r2' }">
            <input v-model="form.provider" type="radio" value="r2" />
            <span class="radio-title">{{ t('admin.storageR2') }}</span>
            <span class="radio-hint">{{ t('admin.storageR2Hint') }}</span>
          </label>
        </div>

        <p v-if="form.provider === 'r2' && !form.r2.configured" class="alert warn">
          {{ t('admin.storageR2EnvMissing') }}
        </p>

        <template v-if="form.provider === 'r2'">
          <p class="group-label">{{ t('admin.storageR2AuthGroup') }}</p>
          <label>
            {{ t('admin.storageR2Endpoint') }}
            <input
              v-model="form.r2.endpoint"
              type="url"
              autocomplete="off"
              placeholder="https://….r2.cloudflarestorage.com"
            />
          </label>
          <label>
            {{ t('admin.storageR2AccessKey') }}
            <input
              v-model="form.r2.accessKeyId"
              type="text"
              autocomplete="off"
              spellcheck="false"
            />
          </label>
          <label>
            {{ t('admin.storageR2SecretKey') }}
            <input
              v-model="form.r2.secretAccessKey"
              type="password"
              autocomplete="new-password"
              :placeholder="form.r2.hasSecretAccessKey ? t('admin.storageR2SecretKeep') : ''"
            />
            <span v-if="form.r2.hasSecretAccessKey" class="field-hint">{{ t('admin.storageR2SecretKeep') }}</span>
          </label>

          <p class="group-label">{{ t('admin.storageR2PublicGroup') }}</p>
          <label>
            {{ t('admin.storageR2Bucket') }}
            <input
              v-model="form.r2.bucket"
              type="text"
              :placeholder="t('admin.storageR2BucketPh')"
            />
          </label>
          <label>
            {{ t('admin.storageR2PublicUrl') }}
            <input
              v-model="form.r2.publicBaseUrl"
              type="url"
              placeholder="https://media-link.botty.live"
            />
          </label>
        </template>
      </fieldset>

      <div class="actions">
        <button type="submit" class="primary" :disabled="saving">{{ t('admin.save') }}</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'
import { useI18n } from '@/i18n'
import './admin-shared.css'

const { t } = useI18n()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')

const form = reactive({
  provider: 'server',
  r2: {
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    hasSecretAccessKey: false,
    publicBaseUrl: '',
    bucket: '',
    configured: false,
  },
})

function applyR2(data) {
  const r2 = data?.r2 || {}
  form.r2.endpoint = r2.endpoint || ''
  form.r2.accessKeyId = r2.accessKeyId || ''
  form.r2.secretAccessKey = ''
  form.r2.hasSecretAccessKey = Boolean(r2.hasSecretAccessKey)
  form.r2.publicBaseUrl = r2.publicBaseUrl || ''
  form.r2.bucket = r2.bucket || ''
  form.r2.configured = Boolean(r2.configured)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.admin.getStorageSettings()
    form.provider = data?.provider === 'r2' ? 'r2' : 'server'
    applyR2(data)
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const data = await api.admin.updateStorageSettings({
      provider: form.provider,
      r2: {
        endpoint: form.r2.endpoint.trim(),
        accessKeyId: form.r2.accessKeyId.trim(),
        secretAccessKey: form.r2.secretAccessKey.trim(),
        publicBaseUrl: form.r2.publicBaseUrl.trim(),
        bucket: form.r2.bucket.trim(),
      },
    })
    form.provider = data?.provider === 'r2' ? 'r2' : 'server'
    applyR2(data)
    notice.value = t('admin.userSavedOk')
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.card {
  max-width: 640px;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.fieldset legend {
  font-weight: 700;
  margin-bottom: 4px;
}

.group-label {
  margin: 8px 0 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
}

.radio-row {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.radio-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  background: #f9fafb;
}

.radio-card.on {
  border-color: #16a34a;
  background: #f0fdf4;
}

.radio-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-title {
  font-weight: 650;
}

.radio-hint {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.45;
}

.alert.warn {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #92400e;
}

.actions {
  margin-top: 18px;
}
</style>
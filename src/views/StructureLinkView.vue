<template>
  <div class="page" :class="{ 'page--immersive': readOnly, 'page--edit': !readOnly }">
    <div v-if="loading" class="state">{{ t('structure.loading') }}</div>
    <p v-else-if="errorText" class="state error" role="alert">{{ errorText }}</p>
    <template v-else-if="record">
      <p v-if="!readOnly" class="badge page-badge">{{ t('structure.editMode') }}</p>

      <DrawStructurePanel
        :spec="drawSpec"
        v-model:param-values="paramValues"
        @update:spec="drawSpec = $event"
        :title="meta.title || pageTitle"
        :notes="meta.notes || subtitle"
        :problem="record.problem"
        :show-problem="!readOnly"
        :read-only="readOnly"
        :immersive="readOnly"
        full-width
      />

      <section v-if="!readOnly" class="actions">
        <button type="button" class="btn primary" :disabled="saving" @click="save">
          <LoaderCircle v-if="saving" class="spin" :size="18" />
          <span>{{ t('structure.saveLinks') }}</span>
        </button>
      </section>

      <section v-if="!readOnly && links.previewUrl" class="links">
        <div class="link-row">
          <span>{{ t('structure.previewLink') }}</span>
          <input :value="links.previewUrl" readonly />
          <button type="button" class="btn ghost" @click="copy(links.previewUrl)">{{ t('structure.copy') }}</button>
        </div>
        <div class="link-row">
          <span>{{ t('structure.editLink') }}</span>
          <input :value="links.editUrl" readonly />
          <button type="button" class="btn ghost" @click="copy(links.editUrl)">{{ t('structure.copy') }}</button>
        </div>
        <p v-if="copyHint" class="hint">{{ copyHint }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { LoaderCircle } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import DrawStructurePanel from '@/components/DrawStructurePanel.vue'

const props = defineProps({
  mode: { type: String, required: true, validator: (v) => v === 'preview' || v === 'edit' },
})

const route = useRoute()
const { t } = useI18n()
const loading = ref(true)
const saving = ref(false)
const errorText = ref('')
const record = ref(null)
const drawSpec = ref(null)
const paramValues = ref({})
const meta = reactive({ title: '', notes: '' })
const links = reactive({ previewUrl: '', editUrl: '' })
const copyHint = ref('')
const editUuid = ref('')

const readOnly = computed(() => props.mode === 'preview')

const pageTitle = computed(() => meta.title || record.value?.title || t('structure.untitled'))
const subtitle = computed(() => meta.notes || '')

async function load() {
  const uuid = String(route.params.uuid || '')
  loading.value = true
  errorText.value = ''
  try {
    const data =
      props.mode === 'preview'
        ? await api.structures.getPreview(uuid)
        : await api.structures.getEdit(uuid)
    record.value = data
    drawSpec.value = data.structure?.spec || null
    meta.title = data.structure?.meta?.title || data.title || ''
    meta.notes = data.structure?.meta?.notes || ''
    paramValues.value = { ...(data.structure?.paramValues || {}) }
    links.previewUrl = data.previewUrl
    links.editUrl = data.editUrl
    editUuid.value = data.editUuid
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err, 'structure.loadError') : t('structure.loadError')
    record.value = null
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!drawSpec.value || saving.value) return
  saving.value = true
  try {
    const body = {
      problem: record.value?.problem || '',
      mode: record.value?.mode || '2d',
      spec: drawSpec.value,
      meta: { title: meta.title, notes: meta.notes },
      paramValues: { ...paramValues.value },
      title: meta.title,
    }
    const data = await api.structures.update(editUuid.value, body)
    links.previewUrl = data.previewUrl
    links.editUrl = data.editUrl
    copyHint.value = t('structure.saved')
    setTimeout(() => {
      copyHint.value = ''
    }, 2000)
  } catch (err) {
    copyHint.value = err instanceof ApiError ? apiMessage(err) : t('structure.saveError')
  } finally {
    saving.value = false
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyHint.value = t('structure.copied')
  } catch {
    copyHint.value = text
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.page--immersive {
  max-width: none;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page--edit {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 8px 10px 24px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 1.5rem);
  overflow: hidden;
}

.page--edit :deep(.panel--full) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.page--immersive .state {
  margin: auto;
}

.state {
  text-align: center;
  color: #64748b;
  padding: 48px 0;
}

.state.error {
  color: #dc2626;
}

.page-badge {
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  margin: 0 0 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 650;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-row {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 8px;
  align-items: center;
}

.link-row input {
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.link-row span {
  font-size: 12px;
  font-weight: 650;
  color: #64748b;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 650;
  font-size: 14px;
  border: none;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}

.btn.ghost {
  background: #f1f5f9;
  color: #334155;
}

.hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #1d4ed8;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

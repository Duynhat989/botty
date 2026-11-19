<template>
  <div class="history-page">
    <header class="head">
      <p class="eyebrow">{{ t('drawHistory.eyebrow') }}</p>
      <h1 class="title">{{ t('drawHistory.title') }}</h1>
      <p class="lede">{{ t('drawHistory.lede') }}</p>
    </header>

    <div v-if="loading" class="state">{{ t('drawHistory.loading') }}</div>
    <p v-else-if="errorText" class="state error" role="alert">{{ errorText }}</p>

    <div v-else-if="!items.length" class="empty">
      <p class="empty-title">{{ t('drawHistory.emptyTitle') }}</p>
      <p class="empty-body">{{ t('drawHistory.emptyBody') }}</p>
      <RouterLink to="/" class="btn primary">{{ t('drawHistory.goHome') }}</RouterLink>
    </div>

    <ul v-else class="list" role="list">
      <li v-for="item in items" :key="item.id" class="card">
        <div class="card-main">
          <h2 class="card-title">{{ item.name }}</h2>
          <p v-if="item.draw?.problem" class="card-excerpt">{{ item.draw.problem }}</p>
          <div class="card-meta">
            <span class="badge" :class="item.draw?.mode === '3d' ? 'mode-3d' : 'mode-2d'">
              {{ item.draw?.mode === '3d' ? t('draw.mode3dBadge') : t('draw.mode2dBadge') }}
            </span>
            <time :datetime="item.updatedAt">{{ formatWhen(item.updatedAt) }}</time>
          </div>
        </div>
        <div class="card-actions">
          <button type="button" class="btn primary" @click="openProject(item.id)">
            {{ t('drawHistory.open') }}
          </button>
          <button type="button" class="btn ghost danger" @click="removeProject(item)">
            {{ t('drawHistory.delete') }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import { useDrawSessionStore } from '@/stores/drawSession'
import { getSpecParams } from '@/modules/draw.min.js'
import { useConfirm } from '@/composables/useConfirm'

const { t } = useI18n()
const router = useRouter()
const session = useDrawSessionStore()
const { confirm } = useConfirm()

const loading = ref(true)
const errorText = ref('')
const items = ref([])

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function buildParamValues(spec, draftValues) {
  const base = getSpecParams(spec, draftValues || {})
  const out = {}
  for (const p of spec?.params || []) {
    if (!p?.id) continue
    out[p.id] = draftValues?.[p.id] ?? base[p.id] ?? Number(p.value) ?? 0
  }
  return out
}

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    items.value = await api.projects.list({ kind: 'draw' })
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err, 'drawHistory.errLoad') : t('drawHistory.errLoad')
  } finally {
    loading.value = false
  }
}

async function openProject(id) {
  try {
    const row = await api.projects.get(id)
    const draft = row.draft || {}
    const spec = draft.spec
    if (!spec?.commands) {
      errorText.value = t('drawHistory.errOpen')
      return
    }
    const paramValues = buildParamValues(spec, draft.paramValues)
    session.setFromAnalyze({
      problem: draft.problem || '',
      spec,
      title: draft.title || draft.spec?.title || row.name,
      notes: draft.notes || '',
      paramValues,
      meta: draft.meta || null,
    })
    session.setProjectUuid(id)
    session.setEditUuid(draft.editUuid || '')
    await router.push({ name: 'draw' })
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err) : t('drawHistory.errOpen')
  }
}

async function removeProject(item) {
  const ok = await confirm({
    title: t('drawHistory.delete'),
    message: t('drawHistory.confirmDelete', { name: item.name }),
    confirmLabel: t('drawHistory.delete'),
    danger: true,
  })
  if (!ok) return
  try {
    await api.projects.remove(item.id)
    items.value = items.value.filter((x) => x.id !== item.id)
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err) : t('drawHistory.errDelete')
  }
}

onMounted(load)
</script>

<style scoped>
.history-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 20px 64px;
}

.head {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #f97316;
}

.title {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 4vw, 1.85rem);
  font-weight: 800;
  color: #0f172a;
}

.lede {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: #64748b;
}

.state {
  text-align: center;
  color: #64748b;
  padding: 48px 0;
}

.state.error {
  color: #dc2626;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  border: 1px dashed #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
}

.empty-title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #0f172a;
}

.empty-body {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 14px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
}

.card-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 750;
  color: #0f172a;
}

.card-excerpt {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.45;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #94a3b8;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.mode-2d {
  background: #eef2ff;
  color: #4338ca;
}

.mode-3d {
  background: #ecfdf5;
  color: #047857;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 650;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.btn.primary {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
}

.btn.ghost {
  background: #f1f5f9;
  color: #334155;
}

.btn.danger {
  color: #dc2626;
}

@media (max-width: 560px) {
  .card-actions {
    width: 100%;
  }
  .card-actions .btn {
    flex: 1;
  }
}
</style>

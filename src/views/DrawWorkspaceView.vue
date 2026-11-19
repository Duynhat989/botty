<template>
  <div class="draw-page" :class="{ 'draw-page--expanded': session.isExpanded }">
    <header v-if="!session.isExpanded" class="draw-head">
      <router-link :to="{ name: 'home' }" class="back">
        <ArrowLeft :size="18" />
        {{ t('draw.backHome') }}
      </router-link>
      <span v-if="modeBadge" class="mode-badge">{{ modeBadge }}</span>
    </header>

    <DrawStructurePanel
      v-if="drawSpec"
      :spec="drawSpec"
      v-model:param-values="paramValues"
      @update:spec="onSpecUpdate"
      :title="title"
      :notes="notes"
      :problem="problem"
      :show-problem="!writingOnly && !session.isExpanded"
      :writing-only="writingOnly"
      full-width
    />

    <footer v-if="!session.isExpanded" class="draw-foot">
      <button type="button" class="btn ghost" @click="openSave">
        {{ t('structure.saveLinks') }}
      </button>
    </footer>

    <DrawStructureModal
      :open="modalOpen"
      :spec="drawSpec"
      :param-values="paramValues"
      :title="title"
      :notes="notes"
      :problem="problem"
      :mode="drawSpec?.mode || 'auto'"
      :edit-uuid="editUuid"
      @close="modalOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { useDrawSessionStore } from '@/stores/drawSession'
import { getSpecParams } from '@/modules/draw.min.js'
import DrawStructurePanel from '@/components/DrawStructurePanel.vue'
import DrawStructureModal from '@/components/DrawStructureModal.vue'

const { t } = useI18n()
const router = useRouter()
const session = useDrawSessionStore()

const modalOpen = ref(false)

const paramValues = ref({})

const drawSpec = computed(() => session.spec)
const problem = computed(() => session.problem)
const title = computed(() => session.title)
const notes = computed(() => session.notes)
const editUuid = computed(() => session.editUuid)
const writingOnly = computed(() => session.writingOnly)

const modeBadge = computed(() => {
  const m = drawSpec.value?.mode
  if (m === '3d') return t('draw.mode3dBadge')
  if (m === '2d') return t('draw.mode2dBadge')
  return ''
})

function syncParams() {
  if (!drawSpec.value) return
  const base = getSpecParams(drawSpec.value, session.paramValues)
  const next = {}
  for (const p of drawSpec.value.params || []) {
    if (!p?.id) continue
    next[p.id] = session.paramValues[p.id] ?? base[p.id] ?? Number(p.value) ?? 0
  }
  paramValues.value = next
}

function onSpecUpdate(spec) {
  session.patchSpec(spec)
}

function openSave() {
  modalOpen.value = true
}

function onSaved(data) {
  session.setEditUuid(data.editUuid || '')
}

watch(
  paramValues,
  (v) => {
    session.patchParamValues({ ...v })
  },
  { deep: true },
)

watch(drawSpec, () => syncParams(), { deep: true })

onMounted(() => {
  if (!session.ready) {
    router.replace({ name: 'home' })
    return
  }
  if (session.writingOnly) {
    router.replace({ name: 'board' })
    return
  }
  syncParams()
})
</script>

<style scoped>
.draw-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 8px 10px 12px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  max-height: calc(100dvh - 1.5rem);
  overflow: hidden;
}

.draw-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-decoration: none;
}

.back:hover {
  color: #0f172a;
}

.mode-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.draw-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  flex-shrink: 0;
}

.draw-page :deep(.panel--full) {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.draw-page :deep(.panel--full .panel-body) {
  width: 100%;
}

.btn.ghost {
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-weight: 650;
  cursor: pointer;
}

:deep(.panel) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}
</style>

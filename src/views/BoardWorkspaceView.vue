<template>
  <div class="board-page">
    <div class="board-shell">
      <div class="board-canvas">
        <DrawStructurePanel
          v-if="drawSpec"
          ref="panelRef"
          :spec="drawSpec"
          v-model:param-values="paramValues"
          @update:spec="onSpecUpdate"
          :show-problem="false"
          writing-only
          board-mode
          full-width
          :gemini-panel-open="geminiOpen"
          @toggle-gemini="geminiOpen = !geminiOpen"
        />
      </div>
      <BoardGeminiPanel
        v-show="geminiOpen"
        class="board-gemini"
        :capture="captureForGemini"
        @apply-spec="onGeminiSpec"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useDrawSessionStore } from '@/stores/drawSession'
import { getSpecParams } from '@/modules/draw.min.js'
import DrawStructurePanel from '@/components/DrawStructurePanel.vue'
import BoardGeminiPanel from '@/components/BoardGeminiPanel.vue'

const session = useDrawSessionStore()
const panelRef = ref(null)
const geminiOpen = ref(false)

const paramValues = ref({})
const drawSpec = computed(() => session.spec)

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

function onGeminiSpec(spec) {
  if (!spec) return
  session.patchSpec(spec)
  syncParams()
  panelRef.value?.redraw?.()
}

async function captureForGemini() {
  return panelRef.value?.captureForGemini?.() ?? { imageBase64: '', strokesSummary: '' }
}

watch(
  paramValues,
  (v) => {
    session.patchParamValues({ ...v })
  },
  { deep: true },
)

watch(drawSpec, () => syncParams(), { deep: true })

onMounted(async () => {
  // Mỗi lần vào bảng viết là một phiên làm việc độc lập hoàn toàn mới
  session.clear()
  session.ensureBlankWritingCanvas()
  session.writingBoard = true
  syncParams()
  await nextTick()
  panelRef.value?.resetWritingSession?.()
  panelRef.value?.redraw?.()
})

onUnmounted(() => {
  // Dọn dẹp phiên khi rời khỏi trang bảng viết
  session.clear()
})
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: #2a2f36;
  color: #e2e8f0;
}

.board-shell {
  display: flex;
  align-items: stretch;
  gap: 0;
  flex: 1;
  min-height: 0;
}

.board-canvas {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.board-canvas :deep(.panel--full) {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.panel) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.board-gemini {
  flex-shrink: 0;
  margin-left: 14px;
}

.board-gemini :deep(.gemini-panel) {
  border-color: rgba(71, 85, 105, 0.5);
  background: linear-gradient(165deg, #1e2430 0%, #151a22 100%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.board-gemini :deep(.gemini-title),
.board-gemini :deep(.gemini-block) {
  color: #e2e8f0;
}

.board-gemini :deep(.gemini-lede),
.board-gemini :deep(.gemini-meta) {
  color: #94a3b8;
}

.board-gemini :deep(.gemini-prompt) {
  background: #0f1419;
  border-color: #334155;
  color: #f1f5f9;
}

.board-gemini :deep(.gemini-btn) {
  background: #252b36;
  border-color: #475569;
  color: #e2e8f0;
}

@media (max-width: 900px) {
  .board-shell {
    flex-direction: column;
  }

  .board-gemini {
    max-height: 40vh;
    overflow: auto;
  }
}
</style>

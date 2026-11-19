<template>
  <div
    v-for="panel in graphPanels"
    :key="panel.id"
    class="graph-inset"
    :style="panelStyle(panel)"
    @pointerdown.stop
  >
    <header class="inset-head">{{ t('board.radialGraph') }}</header>
    <canvas ref="setCanvasRef(panel.id)" class="inset-canvas" />
    <div v-if="sliders(panel).length" class="inset-sliders">
      <label v-for="p in sliders(panel)" :key="p.id" class="inset-row">
        <span>{{ p.label || p.id }}</span>
        <input
          type="range"
          :value="panelParam(panel, p.id)"
          :min="p.min ?? -10"
          :max="p.max ?? 10"
          :step="p.step ?? 0.1"
          @input="onParam(panel, p.id, $event)"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, nextTick, onMounted, reactive, watch } from 'vue'
import { useI18n } from '@/i18n'
import { getSpecParams, renderDrawSpec } from '@/modules/draw.min.js'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const { t } = useI18n()
const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardRegionGraphInsets requires WRITING_BOARD_KEY')

const canvasMap = reactive({})
const wrapSize = reactive({ w: 320, h: 220 })

const graphPanels = computed(() =>
  (board.regionSidePanels || []).filter((p) => p.kind === 'graph' && p.spec),
)

function setCanvasRef(id) {
  return (el) => {
    if (el) canvasMap[id] = el
    else delete canvasMap[id]
  }
}

function panelStyle(panel) {
  return {
    left: `${panel.nx * 100}%`,
    top: `${panel.ny * 100}%`,
    width: `${panel.nw * 100}%`,
    height: `${panel.nh * 100}%`,
  }
}

function sliders(panel) {
  return panel.spec?.params || []
}

function panelParam(panel, id) {
  return panel.paramValues?.[id] ?? 0
}

function onParam(panel, id, e) {
  if (!panel.paramValues) panel.paramValues = {}
  panel.paramValues[id] = Number(e.target.value)
  drawPanel(panel)
}

function drawPanel(panel) {
  const canvas = canvasMap[panel.id]
  if (!canvas || !panel.spec) return
  const vals = { ...getSpecParams(panel.spec, panel.paramValues), ...panel.paramValues }
  const spec = {
    ...panel.spec,
    canvas: {
      ...(panel.spec.canvas || {}),
      width: Math.max(240, Math.round(wrapSize.w)),
      height: Math.max(160, Math.round(wrapSize.h * 0.72)),
      background: '#2a2f36',
    },
  }
  renderDrawSpec(canvas, spec, vals)
}

function redrawAll() {
  nextTick(() => {
    for (const p of graphPanels.value) drawPanel(p)
  })
}

watch(graphPanels, redrawAll, { deep: true })
onMounted(redrawAll)
</script>

<style scoped>
.graph-inset {
  position: absolute;
  z-index: 3;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  min-height: 120px;
  border-radius: 12px;
  border: 1px solid rgba(52, 211, 153, 0.45);
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  pointer-events: auto;
}

.inset-head {
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6ee7b7;
  border-bottom: 1px solid rgba(71, 85, 105, 0.5);
}

.inset-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 100px;
  display: block;
}

.inset-sliders {
  padding: 6px 10px 8px;
  border-top: 1px solid rgba(71, 85, 105, 0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inset-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  font-size: 10px;
  color: #cbd5e1;
}

.inset-row input {
  width: 100%;
  accent-color: #34d399;
}
</style>

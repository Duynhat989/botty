<template>
  <div
    class="panel"
    :class="{
      'panel--full': fullWidth || immersive,
      'panel--immersive': immersive,
      'panel--board': boardMode,
    }"
  >
    <div
      class="panel-body"
      :class="{
        'panel-body--immersive': immersive,
        'side-resizing': sideResizing,
      }"
      :style="sideLayoutStyle"
    >
      <aside v-if="!immersive && !sideCollapsed && !writingOnly" class="panel-side">
        <header v-if="title || notes || (problem && showProblem)" class="panel-head">
          <h2 v-if="title" class="panel-title">{{ title }}</h2>
          <p v-if="notes" class="panel-notes">{{ notes }}</p>
          <p v-if="problem && showProblem" class="problem">{{ problem }}</p>
        </header>
        <div v-if="show3dTools" class="tool-block">
          <h3 class="controls-title">{{ t('structure.viewPresets') }}</h3>
          <div class="preset-row">
            <button
              v-for="p in viewPresetList"
              :key="p.id"
              type="button"
              class="preset-btn"
              @click="applyViewPreset(p.id)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
        <div v-if="show3dTools" class="tool-block">
          <h3 class="controls-title">{{ t('structure.planesTitle') }}</h3>
          <div class="plane-toggles">
            <label v-for="pl in planeList" :key="pl.which" class="plane-opt">
              <input v-model="planeToggles[pl.which]" type="checkbox" @change="redraw" />
              <span class="plane-swatch" :style="{ background: pl.swatch }" aria-hidden="true"></span>
              <span>{{ pl.label }}</span>
            </label>
          </div>
        </div>
        <DrawWritingBoardSidebar v-if="spec && !immersive && !writingOnly" />
        <div v-if="ruleItems.length" class="tool-block rules-block">
          <h3 class="controls-title">{{ t('structure.rulesTitle') }}</h3>
          <ul class="rules-list">
            <li v-for="(r, i) in ruleItems" :key="i">{{ r.text || r.expr || '—' }}</li>
          </ul>
        </div>
        <div v-if="sliders.length && !readOnly && !immersive" class="tool-block controls">
          <h3 class="controls-title">{{ t('structure.paramsTitle') }}</h3>
          <label v-for="param in sliders" :key="param.id" class="control">
            <span>{{ param.label || param.id }}</span>
            <input
              v-model.number="localValues[param.id]"
              type="range"
              :min="param.min ?? 0"
              :max="param.max ?? 200"
              :step="param.step ?? 1"
              @input="emitValues"
            />
            <em>{{ formatParam(param.id) }}</em>
          </label>
        </div>
        <div v-if="!readOnly && spec" class="tool-block add-block">
          <h3 class="controls-title">{{ t('structure.addPointTitle') }}</h3>
          <div class="add-row">
            <input v-model="newPointId" type="text" maxlength="2" class="add-inp" :placeholder="t('structure.pointId')" />
            <select v-model="newPointBase" class="add-inp">
              <option v-for="pid in pointIds" :key="pid" :value="pid">{{ pid }}</option>
            </select>
            <input v-model.number="newPointAngle" type="number" class="add-inp narrow" :placeholder="t('structure.angleDeg')" />
          </div>
          <button type="button" class="mini-btn" @click="addPoint">{{ t('structure.addPointBtn') }}</button>
          <h3 class="controls-title sub">{{ t('structure.addVarTitle') }}</h3>
          <div class="add-row">
            <input v-model="newVarId" type="text" class="add-inp" :placeholder="t('structure.varId')" />
            <input v-model="newVarExpr" type="text" class="add-inp" :placeholder="t('structure.varExpr')" />
          </div>
          <button type="button" class="mini-btn" @click="addVariable">{{ t('structure.addVarBtn') }}</button>
          <input v-model="newRuleText" type="text" class="add-inp full" :placeholder="t('structure.rulePlaceholder')" />
          <button type="button" class="mini-btn" @click="addRule">{{ t('structure.addRuleBtn') }}</button>
        </div>
        <div v-if="!readOnly && spec" class="tool-block ai-extend-block">
          <h3 class="controls-title">{{ t('structure.aiExtendTitle') }}</h3>
          <label class="select-mode-toggle" :class="{ 'is-on': selectMode }">
            <input v-model="selectMode" type="checkbox" class="select-mode-toggle__input" />
            <span class="select-mode-toggle__copy">
              <span class="select-mode-toggle__title">{{ t('structure.aiExtendSelectMode') }}</span>
              <span class="select-mode-toggle__hint">{{ t('structure.aiExtendSelectModeHint') }}</span>
            </span>
            <span class="select-mode-toggle__track" aria-hidden="true">
              <span class="select-mode-toggle__thumb"></span>
            </span>
          </label>
          <p class="ai-hint">{{ t('structure.aiExtendHint') }}</p>
          <div class="ai-pick-row">
            <label class="ai-pick">
              <span>{{ t('structure.aiExtendPickPoint') }}</span>
              <select v-model="pickPointId" class="add-inp" @change="onPickPointChange">
                <option value="">{{ t('structure.aiExtendPickNone') }}</option>
                <option v-for="pid in pointIds" :key="pid" :value="pid">{{ pid }}</option>
              </select>
            </label>
            <label class="ai-pick">
              <span>{{ t('structure.aiExtendPickEdge') }}</span>
              <select v-model="pickEdgeKey" class="add-inp" @change="onPickEdgeChange">
                <option value="">{{ t('structure.aiExtendPickNone') }}</option>
                <option v-for="e in edgeOptions" :key="e.key" :value="e.key">{{ e.label }}</option>
              </select>
            </label>
          </div>
          <p class="ai-selection">
            {{ t('structure.aiExtendSelection') }}:
            <strong v-if="aiSelection">
              <template v-if="aiSelection.type === 'point'">{{ t('structure.aiExtendPoint') }} {{ aiSelection.id }}</template>
              <template v-else>{{ t('structure.aiExtendEdge') }} {{ aiSelection.from }}{{ aiSelection.to }}</template>
            </strong>
            <span v-else class="muted">{{ t('structure.aiExtendNone') }}</span>
          </p>
          <textarea
            v-model="aiPrompt"
            class="ai-prompt"
            rows="3"
            :placeholder="t('structure.aiExtendPrompt')"
            :disabled="aiExtendBusy"
          />
          <p v-if="aiExtendError" class="ai-error">{{ aiExtendError }}</p>
          <button
            type="button"
            class="mini-btn primary"
            :disabled="aiExtendBusy"
            @click="submitAiExtend"
          >
            {{ aiExtendBusy ? t('structure.aiExtendBusy') : t('structure.aiExtendBtn') }}
          </button>
        </div>
      </aside>
      <div
        v-if="!immersive && !sideCollapsed && !writingOnly"
        class="side-splitter"
        role="separator"
        aria-orientation="vertical"
        :aria-label="t('structure.sideResize')"
        @pointerdown="onSideResizeDown"
      >
        <span class="side-splitter-grip" aria-hidden="true"></span>
      </div>
      <div v-if="!immersive && sideCollapsed && !writingOnly" class="side-rail">
        <button type="button" class="side-rail-btn" :title="t('structure.sideExpand')" @click="expandSide">
          ›
        </button>
      </div>
      <div
        ref="wrapRef"
        class="canvas-wrap"
        :class="{
          dragging: isDragging,
          'can-orbit': show3dTools && !writingBoardOn,
          'orbit-drag': isDragging && lastPointer.mode === 'orbit',
          'select-mode': selectMode,
          'writing-active': writingBoardOn,
          'writing-hand': writingHandMode,
          'board-dark': boardMode,
        }"
        @contextmenu.prevent
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @dblclick="resetView"
      >
        <div
          class="canvas-stage"
          :class="{ 'canvas-stage--board': boardMode }"
          @dragover.prevent="onStageDragOver"
          @drop.prevent="onStageDrop"
        >
          <!-- LỚP KHÔNG GIAN BẢNG VẼ: Luôn lấp đầy màn hình 100% -->
          <div
            class="board-zoom-layer"
            :style="boardZoomLayerStyle"
          >
            <canvas
              ref="canvasRef"
              class="canvas"
              :style="canvasAspectStyle"
              width="800"
              height="560"
            />
            <DrawWritingBoard v-if="spec && !immersive" @wheel="onWheel" />
            <DrawWritingBoardSidebar
              v-if="spec && !immersive && writingOnly && !boardMode"
              class="writing-float-tools"
              @pointerdown.stop
            />
            <BoardParamDock
              v-if="spec && !immersive && boardMode && sliders.length"
              :params="sliders"
              :values="localValues"
              :format="formatParam"
              @update:values="onParamDock"
            />
            <BoardRegionGraphInsets v-if="spec && !immersive && boardMode" />
            <BoardInteractiveDemo v-if="spec && !immersive && boardMode" />
            <BoardGeometryOverlay v-if="spec && !immersive && boardMode" />
            <BoardRegionHud v-if="spec && !immersive && boardMode" />
            <BoardTeachingTools v-if="spec && !immersive && boardMode" />
            <BoardFunctionGrapher v-if="spec && !immersive && boardMode" />
            <BoardProblemGeometryTool v-if="spec && !immersive && boardMode" />
          </div>

          <!-- CÁC THANH CÔNG CỤ CỐ ĐỊNH TRÊN MÀN HÌNH (KHÔNG BỊ PHÓNG TO / THU NHỎ) -->
          <BoardColorRail v-if="spec && !immersive && boardMode" />
          <BoardDockToolbar
            v-if="spec && !immersive && boardMode"
            :gemini-open="geminiPanelOpen"
            @toggle-gemini="emit('toggle-gemini')"
          />

        <!-- Floating Pill khi vừa hoàn thiện nét vẽ -->
        <Transition name="fade-slide">
          <div
            v-if="writingBoardApi.lastBeautifiedNotice"
            class="beautify-float-pill"
            @pointerdown.stop
          >
            <CheckCheck :size="16" class="pill-sparkle" />
            <span class="pill-title">
              Đã nhận diện: <strong>{{ writingBoardApi.lastBeautifiedNotice.label }}</strong>
            </span>
            <button
              type="button"
              class="pill-cta-btn pill-cta-btn--geom"
              title="Chuyển thành đối tượng hình học để đặt điểm, nối đoạn và chỉnh sửa"
              @click="onConvertNoticeToGeometry"
            >
              <MapPin :size="14" />
              <span>Đặt điểm & nối đoạn 📍</span>
            </button>
            <button
              type="button"
              class="pill-cta-btn"
              @click="onConvertNoticeToDemo"
            >
              <Box :size="14" />
              <span>Demo 3D 🎮</span>
            </button>
            <button
              type="button"
              class="pill-undo-btn"
              title="Hoàn tác về nét vẽ tay cũ"
              @click="writingBoardApi.undoLastBeautify()"
            >
              <RotateCcw :size="13" />
            </button>
            <button
              type="button"
              class="pill-close-btn"
              title="Đóng"
              @click="writingBoardApi.clearLastBeautifiedNotice()"
            >
              <X :size="14" />
            </button>
          </div>
        </Transition>
        <DrawViewCube
          v-if="show3dTools && spec"
          :view="view"
          @pick="applyViewPreset"
          @orbit="onViewCubeOrbit"
        />
        <p v-if="spec && !immersive && !writingOnly" class="orbit-hint">{{ t('structure.orbitHint') }}</p>
        <button v-if="viewTouched" type="button" class="reset-view" @click="resetView">
          {{ t('structure.resetView') }}
        </button>
        </div>
      </div>

      <Transition name="float-panel">
        <aside
          v-if="immersive && floatOpen && spec"
          class="preview-float"
          role="complementary"
          :aria-label="t('structure.previewParams')"
        >
          <div class="preview-float-head">
            <h3 class="preview-float-title">{{ t('structure.previewParams') }}</h3>
            <button type="button" class="float-close" :aria-label="t('structure.close')" @click="floatOpen = false">
              ×
            </button>
          </div>
          <div v-if="show3dTools" class="tool-block compact">
            <h4 class="controls-title">{{ t('structure.viewPresets') }}</h4>
            <div class="preset-row">
              <button
                v-for="p in viewPresetList"
                :key="p.id"
                type="button"
                class="preset-btn"
                @click="applyViewPreset(p.id)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
          <div v-if="show3dTools" class="tool-block compact">
            <h4 class="controls-title">{{ t('structure.planesTitle') }}</h4>
            <div class="plane-toggles">
              <label v-for="pl in planeList" :key="pl.which" class="plane-opt">
                <input v-model="planeToggles[pl.which]" type="checkbox" @change="redraw" />
                <span class="plane-swatch" :style="{ background: pl.swatch }" aria-hidden="true"></span>
                <span>{{ pl.label }}</span>
              </label>
            </div>
          </div>
          <div v-if="sliders.length" class="controls compact">
            <h4 class="controls-title">{{ t('structure.paramsTitle') }}</h4>
            <label v-for="param in sliders" :key="param.id" class="control">
              <span>{{ param.label || param.id }}</span>
              <input
                v-model.number="localValues[param.id]"
                type="range"
                :min="param.min ?? 0"
                :max="param.max ?? 200"
                :step="param.step ?? 1"
                @input="emitValues"
              />
              <em>{{ formatParam(param.id) }}</em>
            </label>
          </div>
          <ul v-if="ruleItems.length" class="rules-list compact-rules">
            <li v-for="(r, i) in ruleItems" :key="i">{{ r.text || r.expr || '—' }}</li>
          </ul>
        </aside>
      </Transition>
      <button
        v-if="immersive && !floatOpen && spec"
        type="button"
        class="preview-float-fab"
        @click="floatOpen = true"
      >
        {{ t('structure.previewParams') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import {
  DEFAULT_VIEW,
  VIEW_PRESETS,
  getSpecParams,
  normalizeView,
  collectDrawSegments,
  pickDrawAt,
  renderDrawSpec,
} from '@/modules/draw.min.js'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import DrawViewCube from '@/components/DrawViewCube.vue'
import DrawWritingBoard from '@/components/DrawWritingBoard.vue'
import DrawWritingBoardSidebar from '@/components/DrawWritingBoardSidebar.vue'
import BoardDockToolbar from '@/components/BoardDockToolbar.vue'
import BoardColorRail from '@/components/BoardColorRail.vue'
import BoardParamDock from '@/components/BoardParamDock.vue'
import BoardRegionHud from '@/components/BoardRegionHud.vue'
import BoardRegionGraphInsets from '@/components/BoardRegionGraphInsets.vue'
import BoardInteractiveDemo from '@/components/BoardInteractiveDemo.vue'
import BoardGeometryOverlay from '@/components/BoardGeometryOverlay.vue'
import BoardTeachingTools from '@/components/BoardTeachingTools.vue'
import BoardFunctionGrapher from '@/components/BoardFunctionGrapher.vue'
import BoardProblemGeometryTool from '@/components/BoardProblemGeometryTool.vue'
import { Box, CheckCheck, MapPin, RotateCcw, X } from '@lucide/vue'
import { createWritingBoard, WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import { useDrawSessionStore } from '@/stores/drawSession'

const props = defineProps({
  spec: { type: Object, default: null },
  paramValues: { type: Object, default: () => ({}) },
  title: { type: String, default: '' },
  notes: { type: String, default: '' },
  problem: { type: String, default: '' },
  showProblem: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  /** Preview link: fullscreen canvas + panel thông số mờ */
  immersive: { type: Boolean, default: false },
  /** Canvas trống từ mục Bảng viết — không hiện panel-side */
  writingOnly: { type: Boolean, default: false },
  /** Digital whiteboard (/board) — dock tối, lưới, tẩy */
  boardMode: { type: Boolean, default: false },
  geminiPanelOpen: { type: Boolean, default: true },
})

const emit = defineEmits(['update:paramValues', 'update:spec', 'toggle-gemini'])

const { t, locale } = useI18n()
const drawSession = useDrawSessionStore()

function syncWritingBoardHost() {
  drawSession.setWritingBoardHost(Boolean(props.spec && !props.immersive))
}

watch(
  () => [props.spec, props.immersive],
  syncWritingBoardHost,
  { immediate: true },
)
const canvasRef = ref(null)
const wrapRef = ref(null)
const writingBoardApi = reactive(createWritingBoard(canvasRef))
provide(WRITING_BOARD_KEY, writingBoardApi)

function onConvertNoticeToDemo() {
  const notice = writingBoardApi.lastBeautifiedNotice
  if (!notice) return
  let model = null
  if (notice.type === 'trapezoid_prism' || notice.type === 'truncated_prism') model = 'trapezoid_prism'
  else if (notice.type === 'prism_3d' || notice.type === 'triangular_prism') model = 'triangular_prism'
  else if (notice.type === 'cube_3d') {
    const asp = notice.result?.aspect || (notice.bbox ? notice.bbox.width / Math.max(1e-4, notice.bbox.height) : 1)
    model = notice.result?.subType === 'rectangular_prism' || asp > 1.10 || asp < 0.90 ? 'box' : 'cube'
  }
  else if (notice.type === 'pyramid_3d' || notice.type === 'tetrahedron_3d') model = 'pyramid'
  else if (notice.type === 'cylinder_3d') model = 'cylinder'
  else if (notice.type === 'cone_3d') model = 'cone'
  else if (notice.type === 'equation' || notice.type === 'graph_2d') model = 'graph'
  writingBoardApi.convertStrokesToInteractiveDemo(notice.bbox, model)
}

function onConvertNoticeToGeometry() {
  const notice = writingBoardApi.lastBeautifiedNotice
  if (!notice) return
  writingBoardApi.beautifyStrokesToGeometry(notice.bbox)
}

const writingBoardOn = computed(() => Boolean(writingBoardApi.active))
const writingHandMode = computed(
  () => Boolean(writingBoardApi.active) && writingBoardApi.writingTool === 'hand',
)

function onStageDragOver(e) {
  if (window.__draggedShape || e.dataTransfer) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }
}

function onStageDrop(e) {
  let data = window.__draggedShape
  if (!data) {
    try {
      const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain')
      if (raw) data = JSON.parse(raw)
    } catch (err) {
      console.warn('[DrawStructurePanel] onStageDrop parse error:', err)
    }
  }
  if (!data) return
  e.preventDefault()
  window.__draggedShape = null
  writingBoardApi?.insertPresetShapeAt?.({
    ...data,
    clientX: e.clientX,
    clientY: e.clientY,
  })
}

const localValues = reactive({})
const view = reactive({ ...DEFAULT_VIEW })
const isDragging = ref(false)
const pointerId = ref(null)
const lastPointer = ref({ x: 0, y: 0, mode: 'pan' })
const dragMoved = ref(false)

const planeToggles = reactive({ xy: true, xz: false, yz: false })
const newPointId = ref('P')
const newPointBase = ref('A')
const newPointAngle = ref(45)
const newVarId = ref('')
const newVarExpr = ref('a')
const newRuleText = ref('')
const selectMode = ref(false)
const aiSelection = ref(null)
const pickPointId = ref('')
const pickEdgeKey = ref('')
const aiPrompt = ref('')
const aiExtendBusy = ref(false)
const aiExtendError = ref('')
const lastLayout = ref(null)
const floatOpen = ref(true)

const SIDE_WIDTH_KEY = 'dynageo.drawSideWidth'
const SIDE_COLLAPSED_KEY = 'dynageo.drawSideCollapsed'
const SIDE_MIN = 220
const SIDE_MAX = 520
const sideWidth = ref(300)
const sideCollapsed = ref(false)
const sideResizing = ref(false)

const sideLayoutStyle = computed(() => {
  if (props.immersive) return undefined
  if (props.writingOnly) return { gridTemplateColumns: 'minmax(0, 1fr)' }
  if (sideCollapsed.value) {
    return { gridTemplateColumns: '42px minmax(0, 1fr)' }
  }
  return { gridTemplateColumns: `${Math.round(sideWidth.value)}px 4px minmax(0, 1fr)` }
})

function collapseSide() {
  sideCollapsed.value = true
  try {
    localStorage.setItem(SIDE_COLLAPSED_KEY, '1')
  } catch {
    /* ignore */
  }
  redraw()
}

function expandSide() {
  sideCollapsed.value = false
  try {
    localStorage.setItem(SIDE_COLLAPSED_KEY, '0')
  } catch {
    /* ignore */
  }
  redraw()
}

function onSideResizeDown(e) {
  if (e.button !== 0) return
  e.preventDefault()
  sideResizing.value = true
  const startX = e.clientX
  const startW = sideWidth.value
  const onMove = (ev) => {
    sideWidth.value = Math.max(SIDE_MIN, Math.min(SIDE_MAX, startW + (ev.clientX - startX)))
  }
  const onUp = () => {
    sideResizing.value = false
    try {
      localStorage.setItem(SIDE_WIDTH_KEY, String(Math.round(sideWidth.value)))
    } catch {
      /* ignore */
    }
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    redraw()
  }
  window.addEventListener('pointercancel', onUp)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

const show3dTools = computed(() => {
  const s = props.spec
  if (!s) return false
  return s.mode === '3d' || (s.commands || []).some((c) => c?.op === 'box3d' || c?.op === 'point3d')
})

const viewPresetList = computed(() => {
  void locale.value
  return [
    { id: 'front', label: t('structure.viewFront') },
    { id: 'top', label: t('structure.viewTop') },
    { id: 'right', label: t('structure.viewRight') },
    { id: 'iso', label: t('structure.viewIso') },
  ]
})

const planeList = computed(() => [
  { which: 'xy', label: 'XY', swatch: '#38bdf8' },
  { which: 'xz', label: 'XZ', swatch: '#4ade80' },
  { which: 'yz', label: 'YZ', swatch: '#f472b6' },
])

const sliders = computed(() => {
  const vars = (props.spec?.variables || []).map((v) => ({
    id: v.id,
    label: v.label || v.id,
    value: v.value,
    min: v.min ?? 0,
    max: v.max ?? 240,
    step: v.step ?? 1,
  }))
  return [...(props.spec?.params || []), ...vars]
})

const ruleItems = computed(() => props.spec?.rules || [])

const edgeOptions = computed(() => {
  const segs = collectDrawSegments(props.spec)
  return segs.map((s) => ({
    ...s,
    key: [s.from, s.to].sort().join('|'),
    label: `${s.from}${s.to}`,
  }))
})

function syncPickFieldsFromSelection() {
  const sel = aiSelection.value
  if (!sel) {
    pickPointId.value = ''
    pickEdgeKey.value = ''
    return
  }
  if (sel.type === 'point') {
    pickPointId.value = sel.id
    pickEdgeKey.value = ''
  } else {
    pickEdgeKey.value = [sel.from, sel.to].sort().join('|')
    pickPointId.value = ''
  }
}

function onPickPointChange() {
  const id = pickPointId.value
  if (!id) {
    if (aiSelection.value?.type === 'point') aiSelection.value = null
    redraw()
    return
  }
  pickEdgeKey.value = ''
  aiSelection.value = { type: 'point', id }
  redraw()
}

function onPickEdgeChange() {
  const key = pickEdgeKey.value
  if (!key) {
    if (aiSelection.value?.type === 'edge') aiSelection.value = null
    redraw()
    return
  }
  const e = edgeOptions.value.find((x) => x.key === key)
  if (!e) return
  pickPointId.value = ''
  aiSelection.value = { type: 'edge', from: e.from, to: e.to }
  redraw()
}

const pointIds = computed(() => {
  const ids = new Set()
  for (const c of props.spec?.commands || []) {
    if (c?.id) ids.add(String(c.id).toUpperCase())
  }
  return [...ids].sort()
})

const viewTouched = computed(() => {
  const v = normalizeView(view)
  return Boolean(v.yaw || v.pitch || v.zoom !== 1 || v.panX || v.panY)
})

const boardZoomFactor = computed(() => {
  const z = Number(writingBoardApi?.boardZoom)
  return Number.isFinite(z) && z > 0 ? z : 1
})

/** Thu nhỏ: Giữ nguyên layer 100% full-screen và không translate/scale layer thành mini-map. */
const boardZoomLayerStyle = computed(() => {
  if (!props.boardMode) return {}
  const z = boardZoomFactor.value
  if (z >= 1) {
    return {
      width: '100%',
      height: '100%',
      transform: z === 1 ? 'none' : `scale(${z})`,
      transformOrigin: 'center center',
      transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
    }
  }
  // Khi z < 1 (thu nhỏ): Giữ layer phủ 100% viewport.
  // Nội dung và độ phân giải canvas được tự động mở rộng bao quát toàn màn hình
  // thông qua specWithCanvasSize (world bounds mở rộng) mà không thu nhỏ khung DOM thành một hộp mini-map.
  return {
    width: '100%',
    height: '100%',
    transform: 'none',
    transformOrigin: 'center center',
    transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
  }
})

const canvasAspectStyle = computed(() => {
  const c = props.spec?.canvas
  const w = Number(c?.width) || 800
  const h = Number(c?.height) || 560
  const ratio = `${w} / ${h}`
  if (props.boardMode) {
    return {
      width: '100%',
      height: '100%',
      display: 'block',
      flex: '1 1 auto',
      aspectRatio: 'auto',
    }
  }
  if (props.fullWidth || props.immersive) {
    return {
      width: '100%',
      height: '100%',
      flex: '1 1 auto',
      minWidth: 0,
      minHeight: 0,
      aspectRatio: 'auto',
    }
  }
  return { aspectRatio: ratio }
})

function defaultViewForSpec(spec) {
  if (spec?.mode === '3d') {
    return { yaw: 0.75, pitch: 0.55, zoom: 1, panX: 0, panY: 0 }
  }
  return { yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 }
}

function resetView() {
  Object.assign(view, defaultViewForSpec(props.spec))
  redraw()
}

function syncLocals() {
  if (!props.spec) return
  const base = getSpecParams(props.spec, props.paramValues)
  Object.keys(localValues).forEach((k) => delete localValues[k])
  for (const p of sliders.value) {
    if (!p?.id) continue
    localValues[p.id] = props.paramValues[p.id] ?? base[p.id] ?? Number(p.value) ?? 0
  }
}

function specForRender() {
  if (!props.spec) return null
  const commands = (props.spec.commands || []).filter((c) => {
    if (c?.op !== 'plane') return true
    const w = String(c.which || c.plane || 'xy').toLowerCase()
    return Boolean(planeToggles[w])
  })
  return { ...props.spec, commands }
}

function applyViewPreset(id) {
  const p = VIEW_PRESETS[id]
  if (!p) return
  Object.assign(view, { ...p, zoom: view.zoom, panX: view.panX, panY: view.panY })
  redraw()
}

function onViewCubeOrbit({ dyaw, dpitch }) {
  view.yaw += Number(dyaw) || 0
  view.pitch += Number(dpitch) || 0
  const lim = Math.PI / 2 - 0.12
  view.pitch = Math.max(-lim, Math.min(lim, view.pitch))
  redraw()
}

function cloneSpec() {
  return JSON.parse(JSON.stringify(props.spec))
}

function addPoint() {
  const id = String(newPointId.value || '').trim().toUpperCase()
  if (!id || !props.spec) return
  const spec = cloneSpec()
  spec.commands = spec.commands || []
  spec.commands.push({
    op: 'point',
    id,
    base: newPointBase.value || 'A',
    dist: '{{a}}',
    angleDeg: Number(newPointAngle.value) || 0,
    label: id,
  })
  emit('update:spec', spec)
  redraw()
}

function addVariable() {
  const id = String(newVarId.value || '').trim()
  if (!id || !props.spec) return
  const spec = cloneSpec()
  spec.variables = spec.variables || []
  spec.variables.push({
    id,
    label: id,
    expr: newVarExpr.value || 'a',
    value: 120,
    min: 40,
    max: 280,
    step: 2,
  })
  newVarId.value = ''
  emit('update:spec', spec)
  syncLocals()
  redraw()
}

function addRule() {
  const text = String(newRuleText.value || '').trim()
  if (!text || !props.spec) return
  const spec = cloneSpec()
  spec.rules = spec.rules || []
  spec.rules.push({ text })
  newRuleText.value = ''
  emit('update:spec', spec)
}

function specWithCanvasSize(base) {
  if (!base || !wrapRef.value) return base
  if (!props.fullWidth && !props.immersive && !props.boardMode) return base
  const pad = props.boardMode ? 0 : 4
  const maxW = Math.max(280, Math.floor(wrapRef.value.clientWidth - pad))
  const maxH = Math.max(220, Math.floor(wrapRef.value.clientHeight - pad))

  if (props.boardMode) {
    // Whiteboard toán học: Tăng độ phân giải lên chuẩn HiDPI / Retina sắc nét
    // Khi zoom-out: tăng kích thước world theo 1/z để nội dung nhỏ lại và canvas vẫn full khung
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const z = boardZoomFactor.value
    const boost = z < 1 ? 1 / z : 1
    const targetW = Math.max(800, maxW) * boost
    const targetH = Math.max(560, maxH) * boost
    return {
      ...base,
      canvas: {
        ...(base.canvas || {}),
        width: Math.round(targetW * dpr),
        height: Math.round(targetH * dpr),
      },
    }
  }

  if (props.fullWidth || props.immersive) {
    return {
      ...base,
      canvas: {
        ...(base.canvas || {}),
        width: maxW,
        height: maxH,
      },
    }
  }

  const canvasCfg = base.canvas || props.spec?.canvas
  const ratio =
    canvasCfg?.width && canvasCfg?.height
      ? Number(canvasCfg.height) / Number(canvasCfg.width)
      : 560 / 800
  let w = Math.min(maxW, 1200)
  let h = Math.round(w * ratio)
  if (h > maxH) {
    h = maxH
    w = Math.round(h / ratio)
  }
  w = Math.max(320, w)
  h = Math.max(224, h)
  return {
    ...base,
    canvas: {
      ...(base.canvas || {}),
      width: w,
      height: h,
    },
  }
}

function canvasClientToCanvas(e) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
}

function drawSelectionHighlight(points) {
  const canvas = canvasRef.value
  const sel = aiSelection.value
  if (!canvas || !sel || !points) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (sel.type === 'point' && points[sel.id]) {
    const p = points[sel.id]
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2)
    ctx.stroke()
  } else if (sel.type === 'edge' && points[sel.from] && points[sel.to]) {
    const a = points[sel.from]
    const b = points[sel.to]
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function redraw() {
  const spec = specWithCanvasSize(specForRender())
  if (!spec || !canvasRef.value) return
  const layout = renderDrawSpec(canvasRef.value, spec, { ...localValues }, { ...view })
  lastLayout.value = layout
  drawSelectionHighlight(layout?.points)
  writingBoardApi.repaint()
}

async function submitAiExtend() {
  aiExtendError.value = ''
  if (!props.spec) return
  if (!aiSelection.value) {
    aiExtendError.value = t('structure.aiExtendNeedSelect')
    return
  }
  const request = String(aiPrompt.value || '').trim()
  if (!request) {
    aiExtendError.value = t('structure.aiExtendNeedPrompt')
    return
  }
  aiExtendBusy.value = true
  try {
    const data = await api.draw.extend({
      spec: props.spec,
      problem: props.problem || '',
      selection: aiSelection.value,
      request,
    })
    const next = data?.spec
    if (!next) throw new Error('NO_SPEC')
    emit('update:spec', next)
    aiPrompt.value = ''
    redraw()
  } catch {
    aiExtendError.value = t('structure.aiExtendError')
  } finally {
    aiExtendBusy.value = false
  }
}

function formatParam(id) {
  const v = localValues[id]
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : v
}

function emitValues() {
  emit('update:paramValues', { ...localValues })
  redraw()
}

function onParamDock(v) {
  Object.assign(localValues, v)
  emitValues()
}

function applyRegionGeminiSpec(spec) {
  if (!spec) return
  emit('update:spec', spec)
  syncLocals()
  redraw()
}

function isCanvasChromeTarget(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.view-cube, .reset-view, .orbit-hint, button, a'))
}

let dragWinBound = false

function bindCanvasDragListeners() {
  if (dragWinBound) return
  dragWinBound = true
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function unbindCanvasDragListeners() {
  if (!dragWinBound) return
  dragWinBound = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function pointerModeForEvent(e) {
  const orbit3d = show3dTools.value
  const canSelect = selectMode.value && props.spec?.mode !== '3d'
  if (e.button === 2) return 'pan'
  if (canSelect && e.button === 0 && !e.ctrlKey) return 'select'
  if (orbit3d) {
    if (e.button === 0 && (e.shiftKey || e.ctrlKey)) return 'pan'
    if (e.button === 1 || e.button === 0) return 'orbit'
  }
  if (e.button === 1) return 'pan'
  return 'pan'
}

function onPointerDown(e) {
  if (!props.spec) return
  if (writingBoardOn.value) return
  if (isCanvasChromeTarget(e.target)) return
  if (e.button !== 0 && e.button !== 1 && e.button !== 2) return
  if (e.button === 1 || e.button === 2) e.preventDefault()
  isDragging.value = true
  dragMoved.value = false
  pointerId.value = e.pointerId
  const mode = pointerModeForEvent(e)
  lastPointer.value = { x: e.clientX, y: e.clientY, mode }
  bindCanvasDragListeners()
  wrapRef.value?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!isDragging.value || e.pointerId !== pointerId.value) return
  const dx = e.clientX - lastPointer.value.x
  const dy = e.clientY - lastPointer.value.y
  const mode = lastPointer.value.mode
  const moveThresh = mode === 'select' ? 12 : 2
  if (!dragMoved.value && Math.hypot(dx, dy) < moveThresh) return
  dragMoved.value = true
  lastPointer.value = { x: e.clientX, y: e.clientY, mode }

  if (mode === 'orbit') {
    view.yaw += dx * 0.008
    view.pitch += dy * 0.008
    const lim = Math.PI / 2 - 0.12
    view.pitch = Math.max(-lim, Math.min(lim, view.pitch))
  } else if (mode !== 'select') {
    view.panX += dx
    view.panY += dy
  }
  redraw()
}

function onPointerUp(e) {
  if (pointerId.value != null && e.pointerId !== pointerId.value) return
  const wasSelect = lastPointer.value.mode === 'select'
  const moved = dragMoved.value
  isDragging.value = false
  dragMoved.value = false
  pointerId.value = null
  unbindCanvasDragListeners()
  try {
    wrapRef.value?.releasePointerCapture?.(e.pointerId)
  } catch {
    /* ignore */
  }
  if (wasSelect && !moved && props.spec && lastLayout.value) {
    const { x, y } = canvasClientToCanvas(e)
    const hit = pickDrawAt(lastLayout.value, props.spec, x, y, {
      preferEdge: e.shiftKey,
    })
    if (hit) {
      aiSelection.value = hit
      syncPickFieldsFromSelection()
      redraw()
    }
  }
}

function onWheel(e) {
  if (props.boardMode) {
    e.preventDefault()
    // Hỗ trợ cả lăn chuột tự do hoặc đè Ctrl/Meta lăn chuột để Zoom in / Zoom out bảng vẽ
    const dy = e.deltaY
    if (!Number.isFinite(dy) || Math.abs(dy) < 0.5) return
    const step = Math.min(0.12, Math.max(0.04, Math.abs(dy) * 0.001))
    if (dy < 0) {
      writingBoardApi.zoomIn(step)
    } else {
      writingBoardApi.zoomOut(step)
    }
    return
  }
  if (!props.spec) return
  const dy = e.deltaY
  if (!Number.isFinite(dy) || Math.abs(dy) < 0.5) return
  const step = Math.min(0.14, Math.max(0.022, Math.abs(dy) * 0.0025))
  const factor = dy > 0 ? 1 - step : 1 + step
  const prev = view.zoom
  const next = normalizeView({ ...view, zoom: prev * factor }).zoom
  if (next === prev) return
  view.zoom = next
  redraw()
}

function onKeyDown(e) {
  if (e.key === 'r' || e.key === 'R') resetView()
  writingBoardApi.onKeyDown(e)
}

watch(
  () => props.spec,
  (spec) => {
    Object.assign(view, defaultViewForSpec(spec))
    syncLocals()
    redraw()
  },
  { deep: true },
)

watch(
  () => props.spec?.mode,
  (mode) => {
    Object.assign(view, defaultViewForSpec(props.spec))
    if (mode === '3d') selectMode.value = false
  },
)

watch(
  () => props.paramValues,
  () => {
    syncLocals()
    redraw()
  },
  { deep: true },
)

watch(boardZoomFactor, () => {
  if (!props.boardMode) return
  redraw()
})

let resizeObs = null

onMounted(() => {
  try {
    const w = Number(localStorage.getItem(SIDE_WIDTH_KEY))
    if (Number.isFinite(w) && w >= SIDE_MIN && w <= SIDE_MAX) sideWidth.value = w
    sideCollapsed.value = localStorage.getItem(SIDE_COLLAPSED_KEY) === '1'
  } catch {
    /* ignore */
  }
  syncLocals()
  Object.assign(view, defaultViewForSpec(props.spec))
  redraw()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('dragover', onStageDragOver)
  window.addEventListener('drop', onStageDrop)
  if ((props.fullWidth || props.immersive || props.boardMode) && wrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(() => redraw())
    resizeObs.observe(wrapRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('dragover', onStageDragOver)
  window.removeEventListener('drop', onStageDrop)
  unbindCanvasDragListeners()
  resizeObs?.disconnect()
  drawSession.setWritingBoardHost(false)
})

function captureForGemini(region) {
  if (region) {
    return {
      imageBase64: writingBoardApi.captureRegionPng(region),
      strokesSummary: writingBoardApi.strokesSummaryInRegion(region),
    }
  }
  return {
    imageBase64: writingBoardApi.captureBoardPng(),
    strokesSummary: writingBoardApi.strokesSummaryText(),
  }
}

defineExpose({
  redraw,
  resetView,
  view,
  captureForGemini,
  resetWritingSession: () => writingBoardApi.resetForNewSession?.(),
})
</script>

<style scoped>
.panel--immersive {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  max-height: 100dvh;
  background: linear-gradient(165deg, #f8fafc 0%, #f1f5f9 48%, #eef2ff 100%);
}

.panel-body--immersive {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  grid-template-columns: unset !important;
}

.panel--immersive .canvas-wrap {
  flex: 1;
  width: 100%;
  min-height: 0;
  max-height: none;
  padding: 8px 12px 16px;
}

.panel--full {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
}

.preview-float {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 120;
  width: min(300px, calc(100vw - 24px));
  max-height: min(72dvh, 560px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 14px 16px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.08),
    0 20px 48px rgba(15, 23, 42, 0.12);
  scrollbar-width: thin;
  scrollbar-color: rgba(249, 115, 22, 0.4) transparent;
}

.preview-float-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.preview-float-title {
  margin: 0;
  font-size: 14px;
  font-weight: 750;
  color: #0f172a;
}

.float-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: rgba(241, 245, 249, 0.9);
  color: #64748b;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.float-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.tool-block.compact {
  margin-bottom: 10px;
}

.controls.compact .control {
  margin-bottom: 8px;
}

.compact-rules {
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
}

.preview-float-fab {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 110;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.25s ease;
}

.preview-float-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(249, 115, 22, 0.15);
}

.float-panel-enter-active,
.float-panel-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.float-panel-enter-from,
.float-panel-leave-to {
  opacity: 0;
  transform: translateX(12px) scale(0.98);
}

@media (max-width: 520px) {
  .preview-float {
    top: auto;
    right: 12px;
    left: 12px;
    bottom: 12px;
    width: auto;
    max-height: 50dvh;
  }
  .preview-float-fab {
    top: auto;
    bottom: 16px;
    right: 16px;
  }
}

.panel-body.side-resizing {
  cursor: col-resize;
  user-select: none;
}

.panel-body.side-resizing .panel-side,
.panel-body.side-resizing .canvas-wrap {
  pointer-events: none;
}

.side-splitter {
  position: relative;
  width: 4px;
  margin: 0;
  cursor: col-resize;
  touch-action: none;
  background: transparent;
  transition: background 0.18s ease;
  z-index: 2;
  align-self: stretch;
}

.side-splitter:hover,
.panel-body.side-resizing .side-splitter {
  background: rgba(249, 115, 22, 0.12);
}

.side-splitter-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 48px;
  border-radius: 999px;
  background: #e2e8f0;
  transform: translate(-50%, -50%);
  transition: background 0.18s ease, height 0.18s ease;
}

.side-splitter:hover .side-splitter-grip,
.panel-body.side-resizing .side-splitter-grip {
  background: #f97316;
  height: 72px;
}

.side-rail {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14px;
  min-width: 0;
}

.side-rail-btn {
  width: 32px;
  height: 64px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0 12px 12px 0;
  background: rgba(255, 255, 255, 0.94);
  color: #64748b;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.06);
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
}

.side-rail-btn:hover {
  border-color: #fdba74;
  color: #c2410c;
  background: #fff7ed;
}

.panel--full .panel-body {
  display: grid;
  gap: 0;
  align-items: stretch;
  flex: 1;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
}

.panel--full .panel-side {
  max-height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.panel--full .canvas-wrap {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  padding: 4px 4px 4px 0;
  overflow: hidden;
  border-radius: 0 14px 14px 0;
  border-left: none;
  touch-action: none;
  cursor: grab;
}

.panel--full .canvas-wrap.dragging {
  cursor: grabbing;
}

.panel--full .canvas-wrap.orbit-drag {
  cursor: grabbing;
}

.panel--full .canvas {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  aspect-ratio: auto;
  pointer-events: none;
}

.panel-body {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
}

.panel-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 12px 16px 14px;
  border-radius: 18px 0 0 18px;
  border-right: none;
  background: linear-gradient(
    168deg,
    rgba(255, 255, 255, 0.97) 0%,
    rgba(248, 250, 252, 0.94) 52%,
    rgba(255, 247, 237, 0.28) 100%
  );
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 10px 32px rgba(15, 23, 42, 0.06);
  scrollbar-width: thin;
  scrollbar-color: rgba(249, 115, 22, 0.38) transparent;
}

.panel-side::-webkit-scrollbar {
  width: 6px;
}

.panel-side::-webkit-scrollbar-thumb {
  background: rgba(249, 115, 22, 0.38);
  border-radius: 999px;
}

.panel-side::-webkit-scrollbar-thumb:hover {
  background: rgba(249, 115, 22, 0.55);
}

.panel--full .problem {
  max-height: 9rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.panel-head {
  text-align: left;
  padding: 2px 4px 12px;
  margin-bottom: 2px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.75);
}

.controls-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
}

.controls-title::before {
  content: '';
  width: 3px;
  height: 13px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fdba74 0%, #f97316 100%);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.35;
}

.panel-notes {
  margin: 8px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
}

.canvas-wrap {
  position: relative;
  background: #f8fafc;
  border-radius: 14px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  touch-action: none;
}

.canvas-wrap.can-orbit .canvas {
  cursor: move;
  touch-action: none;
}

.canvas-wrap.dragging .canvas {
  cursor: move;
}

.canvas-wrap.dragging.orbit-drag .canvas {
  cursor: grabbing;
}

.canvas {
  width: 100%;
  max-width: 100%;
  height: auto;
  aspect-ratio: 800 / 560;
  display: block;
  border-radius: 10px;
}

.orbit-hint {
  position: absolute;
  left: 14px;
  bottom: 12px;
  margin: 0;
  padding: 4px 10px;
  font-size: 11px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  pointer-events: none;
}

.reset-view {
  position: absolute;
  top: 14px;
  right: 68px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.reset-view:hover {
  border-color: #fdba74;
  color: #c2410c;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-side .control {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  font-size: 13px;
  color: #334155;
  padding: 10px 11px;
  margin-bottom: 6px;
  border-radius: 11px;
  background: rgba(248, 250, 252, 0.88);
  border: 1px solid rgba(241, 245, 249, 0.95);
}

.panel-side .control:last-child {
  margin-bottom: 0;
}

.control span {
  font-weight: 600;
}

.control em {
  font-size: 12px;
  font-style: normal;
  font-weight: 650;
  color: #0f172a;
}

.control input[type='range'] {
  width: 100%;
  accent-color: #f97316;
}

.panel-side .tool-block {
  padding: 12px 13px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.controls-title.sub {
  margin-top: 14px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  flex: 1 1 calc(50% - 4px);
  min-width: calc(50% - 4px);
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 650;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.95);
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.preset-btn:hover {
  border-color: #fdba74;
  color: #c2410c;
  background: #fff7ed;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.1);
}

.plane-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.plane-swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

.plane-opt {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.plane-opt:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.plane-opt:has(input:checked) {
  border-color: rgba(249, 115, 22, 0.45);
  background: linear-gradient(180deg, #fffbeb 0%, #fff7ed 100%);
  color: #c2410c;
  box-shadow: 0 2px 10px rgba(249, 115, 22, 0.12);
}

.plane-opt input {
  accent-color: #f97316;
}

.rules-list {
  margin: 0;
  padding: 10px 12px 10px 28px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.55;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(241, 245, 249, 0.95);
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.add-inp {
  flex: 1;
  min-width: 56px;
  padding: 7px 10px;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.add-inp:focus {
  outline: none;
  border-color: #fdba74;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
}

.add-inp.narrow {
  max-width: 64px;
}

.add-inp.full {
  width: 100%;
  margin-bottom: 6px;
}

.mini-btn {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 650;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: rgba(248, 250, 252, 0.95);
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.mini-btn:hover {
  border-color: #f97316;
  border-style: solid;
  color: #c2410c;
  background: #fff7ed;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.08);
}

.ai-extend-block .ai-hint {
  margin: 8px 0 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.select-mode-toggle {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin: 0 0 4px;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.select-mode-toggle:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
}

.select-mode-toggle.is-on,
.select-mode-toggle:has(.select-mode-toggle__input:checked) {
  border-color: rgba(249, 115, 22, 0.42);
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.95) 0%, rgba(255, 247, 237, 0.98) 100%);
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.1);
}

.select-mode-toggle__input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}

.select-mode-toggle__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.select-mode-toggle__title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.select-mode-toggle__hint {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.35;
  color: #64748b;
}

.select-mode-toggle.is-on .select-mode-toggle__title,
.select-mode-toggle:has(.select-mode-toggle__input:checked) .select-mode-toggle__title {
  color: #9a3412;
}

.select-mode-toggle__track {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #e2e8f0;
  transition: background 0.22s ease;
}

.select-mode-toggle.is-on .select-mode-toggle__track,
.select-mode-toggle:has(.select-mode-toggle__input:checked) .select-mode-toggle__track {
  background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
}

.select-mode-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(15, 23, 42, 0.08);
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.select-mode-toggle.is-on .select-mode-toggle__thumb,
.select-mode-toggle:has(.select-mode-toggle__input:checked) .select-mode-toggle__thumb {
  transform: translateX(18px);
}

.ai-selection {
  margin: 8px 0;
  font-size: 13px;
  color: #475569;
}

.ai-selection .muted {
  color: #94a3b8;
  font-weight: 500;
}

.ai-prompt {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
  min-height: 72px;
}

.ai-error {
  margin: 0 0 8px;
  font-size: 12px;
  color: #dc2626;
}

.ai-pick-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0;
}

.ai-pick {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-align: left;
}

.ai-pick .add-inp {
  width: 100%;
}

.mini-btn.primary {
  border-style: solid;
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
}

.canvas-wrap.select-mode {
  cursor: crosshair;
}

.canvas-wrap.writing-active {
  cursor: crosshair;
}

.canvas-wrap.writing-hand {
  cursor: move;
}

.canvas-wrap.writing-active::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: rgba(255, 251, 235, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.14);
  border-radius: inherit;
}

.panel--board .canvas-wrap.board-dark {
  background: #2a2f36;
  border: none;
  border-radius: 0;
  padding: 0;
}

.canvas-wrap.board-dark {
  background: #1e2228;
  border-color: rgba(71, 85, 105, 0.35);
  border-radius: 12px;
  padding: 4px;
}

.panel--board .canvas-wrap.board-dark .canvas {
  border-radius: 8px;
}

.canvas-wrap.board-dark.writing-active::before {
  display: none;
}

.panel--board.panel--full {
  min-height: 0;
  max-height: 100%;
}

.panel--board.panel--full .panel-body {
  max-height: 100%;
}

.panel--board.panel--full .canvas-wrap {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  border-radius: 0;
}

.panel--board.panel--full .canvas-wrap .canvas {
  width: 100% !important;
  height: 100% !important;
  max-height: 100%;
  flex: 1 1 auto !important;
}

.canvas-stage {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.canvas-stage--board {
  width: 100%;
  height: 100%;
  max-height: 100%;
  flex: 1 1 auto;
  align-self: stretch;
  min-height: 0;
  overflow: hidden;
}

.board-zoom-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.canvas-wrap :deep(.writing-float-tools) {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 12;
  pointer-events: auto;
  width: min(280px, calc(100% - 24px));
  max-height: min(420px, calc(100% - 24px));
  overflow: auto;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  pointer-events: auto;
}

.problem {
  margin: 10px 0 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.panel-side .controls {
  padding-bottom: 12px;
}

.panel-side .ai-prompt {
  border-radius: 10px;
  border-color: #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
}

.panel-side .ai-prompt:focus {
  outline: none;
  border-color: #fdba74;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14);
}

@media (max-width: 760px) {
  .panel-body {
    grid-template-columns: 1fr;
  }

  .panel-side {
    order: 2;
    border-radius: 16px;
  }

  .canvas-wrap {
    order: 1;
  }
}

.beautify-float-pill {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(52, 211, 153, 0.55);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.45),
    0 0 16px rgba(52, 211, 153, 0.25);
  color: #f8fafc;
  font-size: 12px;
}

.pill-sparkle {
  color: #34d399;
  flex-shrink: 0;
}

.pill-title strong {
  color: #38bdf8;
}

.pill-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.pill-cta-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  transform: translateY(-1px);
}

.pill-cta-btn--geom {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
}

.pill-cta-btn--geom:hover {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.pill-undo-btn,
.pill-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-undo-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #f8fafc;
}

.pill-close-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}
</style>

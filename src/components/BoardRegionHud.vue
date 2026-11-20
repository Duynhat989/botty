<template>
  <div ref="hudLayerRef" class="board-hud-layer">
    <!-- KHUNG CHỌN FREE TRANSFORM PHONG CÁCH PHOTOSHOP (KÉO DI CHUYỂN & CO GIÃN 8 ĐIỂM NEO) -->
    <div
      v-if="selectionBoxStyle"
      class="pts-transform-frame"
      :style="selectionBoxStyle"
    >
      <!-- Vùng thân bên trong: Kéo để di chuyển cả vùng chọn và các nét/hình bên trong -->
      <div
        class="pts-body-drag"
        title="Kéo để di chuyển vùng chọn và các nét bên trong"
        @pointerdown.stop="onStartMoveSelection($event)"
      />

      <!-- 4 cạnh viền: Kéo để di chuyển -->
      <div class="pts-edge pts-edge-t" title="Kéo để di chuyển" @pointerdown.stop="onStartMoveSelection($event)" />
      <div class="pts-edge pts-edge-b" title="Kéo để di chuyển" @pointerdown.stop="onStartMoveSelection($event)" />
      <div class="pts-edge pts-edge-l" title="Kéo để di chuyển" @pointerdown.stop="onStartMoveSelection($event)" />
      <div class="pts-edge pts-edge-r" title="Kéo để di chuyển" @pointerdown.stop="onStartMoveSelection($event)" />

      <!-- 8 điểm neo co giãn (Handles) phong cách Photoshop -->
      <span class="pts-handle pts-tl" title="Co giãn góc trên-trái" @pointerdown.stop="onStartResizeSelection('tl', $event)" />
      <span class="pts-handle pts-tc" title="Co giãn cạnh trên" @pointerdown.stop="onStartResizeSelection('tc', $event)" />
      <span class="pts-handle pts-tr" title="Co giãn góc trên-phải" @pointerdown.stop="onStartResizeSelection('tr', $event)" />
      <span class="pts-handle pts-mr" title="Co giãn cạnh phải" @pointerdown.stop="onStartResizeSelection('mr', $event)" />
      <span class="pts-handle pts-br" title="Co giãn góc dưới-phải" @pointerdown.stop="onStartResizeSelection('br', $event)" />
      <span class="pts-handle pts-bc" title="Co giãn cạnh dưới" @pointerdown.stop="onStartResizeSelection('bc', $event)" />
      <span class="pts-handle pts-bl" title="Co giãn góc dưới-trái" @pointerdown.stop="onStartResizeSelection('bl', $event)" />
      <span class="pts-handle pts-ml" title="Co giãn cạnh trái" @pointerdown.stop="onStartResizeSelection('ml', $event)" />

      <!-- Kích thước Pixel của vùng chọn (W x H) giống PTS -->
      <div v-if="selectionPixelSize" class="pts-size-badge">
        {{ selectionPixelSize.w }} × {{ selectionPixelSize.h }} px
      </div>
    </div>

    <!-- 1. THANH CÔNG CỤ NGANG MÀU TRẮNG DƯỚI VÙNG CHỌN (Giống hệt video 00:15 & 00:32) -->
    <transition name="pop-bar">
      <div
        v-if="selectionBarStyle"
        class="ifly-selection-bar"
        :style="selectionBarStyle"
        role="toolbar"
        aria-label="Công cụ vùng chọn"
        @pointerdown.stop
      >
        <button
          type="button"
          class="sel-tool-btn"
          title="Vẽ đồ thị hàm số 2D ngay bên cạnh công thức (kèm thanh trượt A, B)"
          :disabled="loading"
          @click="runAction('plot_graph')"
        >
          <LineChart :size="17" />
          <span>Đồ thị f(x)</span>
        </button>

        <button
          type="button"
          class="sel-tool-btn"
          title="Chuyển thành Khối 3D tương tác tại chỗ (Chấm 3 điểm cắt thiết diện & xoay 360°)"
          :disabled="loading"
          @click="runAction('demo3d')"
        >
          <Box :size="17" />
          <span>Khối 3D</span>
        </button>

        <button
          type="button"
          class="sel-tool-btn"
          title="Chuẩn hóa hình phẳng 2D (Đặt điểm trung điểm M, N & nối đoạn thẳng)"
          :disabled="loading"
          @click="runAction('beautify')"
        >
          <Wand2 :size="17" />
          <span>Hình 2D</span>
        </button>

        <button
          type="button"
          class="sel-tool-btn"
          title="Nhận diện chữ viết / công thức toán"
          :disabled="loading"
          @click="runAction('standardize')"
        >
          <ScanText :size="17" />
          <span>Nhận chữ</span>
        </button>

        <button
          type="button"
          class="sel-tool-btn"
          title="Giải thích / Gợi ý AI cho vùng chọn"
          :disabled="loading"
          @click="runAction('solve')"
        >
          <Lightbulb :size="17" />
          <span>Giải AI</span>
        </button>

        <span class="sel-divider" />

        <button
          type="button"
          class="sel-tool-btn sel-tool-btn--icon"
          title="Xóa các nét trong vùng chọn"
          :disabled="loading"
          @click="runAction('delete_region')"
        >
          <Trash2 :size="16" />
        </button>

        <button
          type="button"
          class="sel-tool-btn sel-tool-btn--icon"
          title="Hủy chọn vùng"
          :disabled="loading"
          @click="closeAll"
        >
          <X :size="16" />
        </button>

        <!-- Nút Xanh Lá chính bên phải thanh trắng (Giống hệt nút xanh ở giây 00:15 & 00:32) -->
        <button
          type="button"
          class="sel-green-cta"
          title="Tự động nhận diện công thức hoặc hình học để dựng Đồ thị / Mô hình 3D tương tác"
          :disabled="loading"
          @click="runAction('smart_convert')"
        >
          <Layers :size="15" />
          <span>{{ smartConvertLabel }}</span>
        </button>

        <p v-if="errorText" class="region-err" role="alert">{{ errorText }}</p>
      </div>
    </transition>

    <!-- 2. VÒNG TRÒN ĐIỀU KHIỂN NỔI MÀU TRẮNG TRÊN BẢNG (Giống hệt giây 00:13, 00:31, 00:56) -->
    <div
      class="ifly-white-puck"
      :class="{ 'is-expanded': puckExpanded }"
      :style="{ left: `${puckPos.x}px`, top: `${puckPos.y}px` }"
      @pointerdown.stop="onPuckPointerDown"
    >
      <template v-if="puckExpanded">
        <!-- Các nút vệ tinh xếp vòng tròn quanh đĩa trắng (chỉ icon, bỏ text) -->
        <button
          v-for="(item, idx) in puckItems"
          :key="item.id"
          type="button"
          class="puck-ring-btn"
          :class="{ active: item.isActive }"
          :style="puckItemStyle(idx, puckItems.length)"
          :title="item.title"
          @pointerdown.stop
          @click.stop="onPuckItemClick(item.id)"
        >
          <component :is="item.icon" :size="17" :stroke-width="2.2" />
        </button>
      </template>

      <!-- Nút tâm đĩa trắng (Kéo để di chuyển, bấm để thu gọn/mở rộng) -->
      <button
        type="button"
        class="puck-center-btn"
        title="Bàn xoay công cụ (Kéo để di chuyển, chạm để đóng/mở)"
        @click.stop="togglePuck"
      >
        <PencilRuler :size="17" class="puck-center-icon" />
        <span class="puck-center-text">TOOL</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  Box,
  Eraser,
  FunctionSquare,
  LassoSelect,
  Lightbulb,
  LineChart,
  PenLine,
  ScanText,
  Sparkles,
  Trash2,
  Wand2,
  X,
  Layers,
  PencilRuler,
} from '@lucide/vue'
import { useI18n } from '@/i18n'
import { getSpecParams } from '@/modules/draw.min.js'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import { cleanFormulaFromText, recognizeStrokes } from '@/utils/strokeRecognizer'

const { t } = useI18n()
const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardRegionHud requires WRITING_BOARD_KEY')

const loading = ref(false)
const loadingAction = ref('')
const lastAction = ref('')
const lastOk = ref('')
const errorText = ref('')

// Đĩa điều khiển trắng nổi trên bảng (giống video 00:13, 00:31, 00:56)
const hudLayerRef = ref(null)
const puckExpanded = ref(true)
const puckPos = reactive({ x: 540, y: 410, nx: 0.72, ny: 0.76 })
let puckDrag = null

function getCanvasBounds() {
  const el = hudLayerRef.value || board.overlayRef?.value || board.overlayEl?.value || board.overlayEl
  const rect = el?.getBoundingClientRect?.()
  const w = Math.round(rect?.width || el?.clientWidth || window.innerWidth || 1200)
  const h = Math.round(rect?.height || el?.clientHeight || window.innerHeight || 800)
  return { w: Math.max(300, w), h: Math.max(200, h) }
}

function clampPuckToCanvas() {
  const { w, h } = getCanvasBounds()
  const pad = 28
  if (puckPos.nx !== undefined && puckPos.ny !== undefined) {
    puckPos.x = Math.max(pad, Math.min(w - pad, Math.round(puckPos.nx * w)))
    puckPos.y = Math.max(pad, Math.min(h - pad, Math.round(puckPos.ny * h)))
  } else {
    puckPos.x = Math.max(pad, Math.min(w - pad, puckPos.x))
    puckPos.y = Math.max(pad, Math.min(h - pad, puckPos.y))
  }
}

onMounted(() => {
  const { w, h } = getCanvasBounds()
  puckPos.x = Math.max(60, Math.min(w - 60, Math.round(w * 0.72)))
  puckPos.y = Math.max(60, Math.min(h - 60, Math.round(h * 0.76)))
  puckPos.nx = puckPos.x / w
  puckPos.ny = puckPos.y / h
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('resize', clampPuckToCanvas)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointermove', onTransformPointerMove)
  window.removeEventListener('pointerup', onTransformPointerUp)
  window.removeEventListener('resize', clampPuckToCanvas)
})

function onPuckPointerDown(e) {
  if (e.button !== 0) return
  puckDrag = {
    startX: e.clientX,
    startY: e.clientY,
    origX: puckPos.x,
    origY: puckPos.y,
    moved: false,
  }
}

function onWindowPointerMove(e) {
  if (!puckDrag) return
  const dx = e.clientX - puckDrag.startX
  const dy = e.clientY - puckDrag.startY
  if (Math.hypot(dx, dy) > 4) puckDrag.moved = true
  const { w, h } = getCanvasBounds()
  // Cho phép chạy trên TOÀN BỘ diện tích canvas: từ góc trên trái đến góc dưới phải
  const pad = 28
  const newX = Math.max(pad, Math.min(w - pad, puckDrag.origX + dx))
  const newY = Math.max(pad, Math.min(h - pad, puckDrag.origY + dy))
  puckPos.x = newX
  puckPos.y = newY
  puckPos.nx = newX / w
  puckPos.ny = newY / h
}

function onWindowPointerUp() {
  puckDrag = null
}

function togglePuck() {
  if (puckDrag?.moved) return
  puckExpanded.value = !puckExpanded.value
}

const puckItems = computed(() => [
  {
    id: 'pen',
    icon: PenLine,
    label: 'Bút viết',
    title: 'Chế độ bút viết tay tự do trên bảng',
    isActive: board.writingTool === 'pen',
  },
  {
    id: 'region',
    icon: LassoSelect,
    label: 'Chọn vùng',
    title: 'Khoanh vùng công thức hoặc hình vẽ trên bảng (Giống video 00:14 & 00:32)',
    isActive: board.writingTool === 'region',
  },
  {
    id: 'eraser',
    icon: Eraser,
    label: 'Tẩy nét',
    title: 'Tẩy xóa nét vẽ trên bảng',
    isActive: board.writingTool === 'eraser',
  },
  {
    id: 'sample_eq',
    icon: FunctionSquare,
    label: 'Mẫu f(x)',
    title: 'Viết mẫu y = x² - 3 & y = A sin x + B và khoanh vùng như video (00:01 - 00:22)',
    isActive: false,
  },
  {
    id: 'sample_cube',
    icon: Box,
    label: 'Lập phương',
    title: 'Dựng khối lập phương 3D trên bảng để chấm 3 điểm cắt thiết diện như video (00:26 - 00:50)',
    isActive: false,
  },
])

function puckItemStyle(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
  const r = 42
  const x = Math.cos(angle) * r
  const y = Math.sin(angle) * r
  return {
    transform: `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px))`,
  }
}

function onPuckItemClick(id) {
  if (id === 'pen') {
    board.setWritingTool('pen')
    board.clearRegionSelection?.()
  } else if (id === 'region') {
    board.setWritingTool('region')
  } else if (id === 'eraser') {
    board.setWritingTool('eraser')
  } else if (id === 'sample_eq') {
    board.insertVideoEquationSample?.()
  } else if (id === 'sample_cube') {
    board.addInteractiveDemo?.({
      model: 'cube',
      type: '3d',
      slicingActive: false,
      edgePoints: [],
      interactionMode: 'point_slice',
      showCrossSection2d: true,
    })
  }
}

// Vị trí khung chọn Transform phong cách Photoshop
const selectionBoxStyle = computed(() => {
  // Khi đang cầm bút vẽ (pen hoặc highlighter), ẩn khung transform và không chặn sự kiện vẽ
  if (board.writingTool === 'pen' || board.writingTool === 'highlighter') return null
  const rect = board.regionSelection
  if (!rect) return null
  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  return {
    left: `${nx0 * 100}%`,
    top: `${ny0 * 100}%`,
    width: `${Math.max(0.001, nx1 - nx0) * 100}%`,
    height: `${Math.max(0.001, ny1 - ny0) * 100}%`,
  }
})

const selectionPixelSize = computed(() => {
  const rect = board.regionSelection
  if (!rect) return null
  const { w, h } = getCanvasBounds()
  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  return {
    w: Math.round((nx1 - nx0) * w),
    h: Math.round((ny1 - ny0) * h),
  }
})

let transformDrag = null

function shapeIntersectsRect(shape, rect) {
  if (!shape) return false
  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  if (shape.vertices?.length) {
    for (const v of shape.vertices) {
      if (v.nx >= nx0 && v.nx <= nx1 && v.ny >= ny0 && v.ny <= ny1) return true
    }
  }
  if (shape.center) {
    if (shape.center.nx >= nx0 && shape.center.nx <= nx1 && shape.center.ny >= ny0 && shape.center.ny <= ny1) return true
  }
  return false
}

function onStartMoveSelection(e) {
  if (e.button !== 0) return
  const rect = board.regionSelection
  if (!rect) return

  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  const curRect = { nx0, ny0, nx1, ny1 }

  const strokeList = Array.isArray(board.strokes?.value) ? board.strokes.value : (Array.isArray(board.strokes) ? board.strokes : [])
  const shapeList = Array.isArray(board.geometricShapes?.value) ? board.geometricShapes.value : (Array.isArray(board.geometricShapes) ? board.geometricShapes : [])

  const selectedIds = new Set(board.selectedStrokeIds?.value || [])
  const targetStrokes = selectedIds.size > 0
    ? strokeList.filter((s) => selectedIds.has(s.id))
    : strokeList.filter((s) => board.strokeIntersectsRegion?.(s, curRect))
  const targetShapes = shapeList.filter((s) => shapeIntersectsRect(s, curRect))

  transformDrag = {
    type: 'move',
    startX: e.clientX,
    startY: e.clientY,
    origRect: { ...curRect },
    targetStrokes: targetStrokes.map((s) => ({
      stroke: s,
      origPoints: s.points.map((p) => ({ ...p })),
    })),
    targetShapes: targetShapes.map((s) => ({
      shape: s,
      origVertices: (s.vertices || []).map((v) => ({ ...v })),
      origCustomPoints: (s.customPoints || []).map((cp) => ({ ...cp })),
      origCenter: s.center ? { ...s.center } : null,
      origRadius: s.radius,
      origRadiusPx: s.radiusPx,
    })),
    moved: false,
  }
  window.addEventListener('pointermove', onTransformPointerMove)
  window.addEventListener('pointerup', onTransformPointerUp)
}

function onStartResizeSelection(handle, e) {
  if (e.button !== 0) return
  const rect = board.regionSelection
  if (!rect) return

  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  const curRect = { nx0, ny0, nx1, ny1, width: Math.max(1e-4, nx1 - nx0), height: Math.max(1e-4, ny1 - ny0) }

  const strokeList = Array.isArray(board.strokes?.value) ? board.strokes.value : (Array.isArray(board.strokes) ? board.strokes : [])
  const shapeList = Array.isArray(board.geometricShapes?.value) ? board.geometricShapes.value : (Array.isArray(board.geometricShapes) ? board.geometricShapes : [])

  const selectedIds = new Set(board.selectedStrokeIds?.value || [])
  const targetStrokes = selectedIds.size > 0
    ? strokeList.filter((s) => selectedIds.has(s.id))
    : strokeList.filter((s) => board.strokeIntersectsRegion?.(s, curRect))
  const targetShapes = shapeList.filter((s) => shapeIntersectsRect(s, curRect))

  let anchorNx = nx0
  let anchorNy = ny0
  if (handle === 'br') {
    anchorNx = nx0
    anchorNy = ny0
  } else if (handle === 'tl') {
    anchorNx = nx1
    anchorNy = ny1
  } else if (handle === 'tr') {
    anchorNx = nx0
    anchorNy = ny1
  } else if (handle === 'bl') {
    anchorNx = nx1
    anchorNy = ny0
  } else if (handle === 'tc') {
    anchorNx = (nx0 + nx1) / 2
    anchorNy = ny1
  } else if (handle === 'bc') {
    anchorNx = (nx0 + nx1) / 2
    anchorNy = ny0
  } else if (handle === 'ml') {
    anchorNx = nx1
    anchorNy = (ny0 + ny1) / 2
  } else if (handle === 'mr') {
    anchorNx = nx0
    anchorNy = (ny0 + ny1) / 2
  }

  transformDrag = {
    type: 'resize',
    handle,
    anchorNx,
    anchorNy,
    startX: e.clientX,
    startY: e.clientY,
    origRect: { ...curRect },
    targetStrokes: targetStrokes.map((s) => ({
      stroke: s,
      origPoints: s.points.map((p) => ({ ...p })),
    })),
    targetShapes: targetShapes.map((s) => ({
      shape: s,
      origVertices: (s.vertices || []).map((v) => ({ ...v })),
      origCustomPoints: (s.customPoints || []).map((cp) => ({ ...cp })),
      origCenter: s.center ? { ...s.center } : null,
      origRadius: s.radius,
      origRadiusPx: s.radiusPx,
    })),
    moved: false,
  }
  window.addEventListener('pointermove', onTransformPointerMove)
  window.addEventListener('pointerup', onTransformPointerUp)
}

function onTransformPointerMove(e) {
  if (!transformDrag) return
  const { w, h } = getCanvasBounds()
  const dnx = (e.clientX - transformDrag.startX) / w
  const dny = (e.clientY - transformDrag.startY) / h

  if (Math.hypot(dnx * w, dny * h) > 3) {
    transformDrag.moved = true
  }

  if (transformDrag.type === 'move') {
    const o = transformDrag.origRect
    const wSpan = o.nx1 - o.nx0
    const hSpan = o.ny1 - o.ny0
    const newNx0 = Math.max(0, Math.min(1 - wSpan, o.nx0 + dnx))
    const newNy0 = Math.max(0, Math.min(1 - hSpan, o.ny0 + dny))
    const finalDnx = newNx0 - o.nx0
    const finalDny = newNy0 - o.ny0

    board.regionSelection = {
      nx0: newNx0,
      ny0: newNy0,
      nx1: newNx0 + wSpan,
      ny1: newNy0 + hSpan,
    }

    for (const item of transformDrag.targetStrokes) {
      item.stroke.points = item.origPoints.map((pt) => ({
        ...pt,
        nx: Math.max(0.002, Math.min(0.998, pt.nx + finalDnx)),
        ny: Math.max(0.002, Math.min(0.998, pt.ny + finalDny)),
      }))
    }

    for (const item of transformDrag.targetShapes) {
      if (item.shape.vertices) {
        item.shape.vertices = item.origVertices.map((v) => ({
          ...v,
          nx: Math.max(0.002, Math.min(0.998, v.nx + finalDnx)),
          ny: Math.max(0.002, Math.min(0.998, v.ny + finalDny)),
        }))
      }
      if (item.shape.customPoints) {
        item.shape.customPoints = item.origCustomPoints.map((cp) => ({
          ...cp,
          nx: Math.max(0.002, Math.min(0.998, cp.nx + finalDnx)),
          ny: Math.max(0.002, Math.min(0.998, cp.ny + finalDny)),
        }))
      }
      if (item.shape.center && item.origCenter) {
        item.shape.center.nx = Math.max(0.002, Math.min(0.998, item.origCenter.nx + finalDnx))
        item.shape.center.ny = Math.max(0.002, Math.min(0.998, item.origCenter.ny + finalDny))
      }
    }

    board.repaint?.()
  } else if (transformDrag.type === 'resize') {
    const o = transformDrag.origRect
    const handle = transformDrag.handle
    let newNx0 = o.nx0
    let newNx1 = o.nx1
    let newNy0 = o.ny0
    let newNy1 = o.ny1

    const minSpan = 0.012

    if (handle.includes('r')) {
      newNx1 = Math.max(newNx0 + minSpan, Math.min(1, o.nx1 + dnx))
    }
    if (handle.includes('l')) {
      newNx0 = Math.min(newNx1 - minSpan, Math.max(0, o.nx0 + dnx))
    }
    if (handle.includes('b')) {
      newNy1 = Math.max(newNy0 + minSpan, Math.min(1, o.ny1 + dny))
    }
    if (handle.includes('t')) {
      newNy0 = Math.min(newNy1 - minSpan, Math.max(0, o.ny0 + dny))
    }

    const curWidth = Math.max(minSpan, newNx1 - newNx0)
    const curHeight = Math.max(minSpan, newNy1 - newNy0)

    const scaleX = curWidth / o.width
    const scaleY = curHeight / o.height

    board.regionSelection = {
      nx0: newNx0,
      ny0: newNy0,
      nx1: newNx1,
      ny1: newNy1,
    }

    const anchorX = transformDrag.anchorNx
    const anchorY = transformDrag.anchorNy

    for (const item of transformDrag.targetStrokes) {
      item.stroke.points = item.origPoints.map((pt) => ({
        ...pt,
        nx: Math.max(0.002, Math.min(0.998, anchorX + (pt.nx - anchorX) * scaleX)),
        ny: Math.max(0.002, Math.min(0.998, anchorY + (pt.ny - anchorY) * scaleY)),
      }))
    }

    for (const item of transformDrag.targetShapes) {
      if (item.shape.vertices) {
        item.shape.vertices = item.origVertices.map((v) => ({
          ...v,
          nx: Math.max(0.002, Math.min(0.998, anchorX + (v.nx - anchorX) * scaleX)),
          ny: Math.max(0.002, Math.min(0.998, anchorY + (v.ny - anchorY) * scaleY)),
        }))
      }
      if (item.shape.customPoints) {
        item.shape.customPoints = item.origCustomPoints.map((cp) => ({
          ...cp,
          nx: Math.max(0.002, Math.min(0.998, anchorX + (cp.nx - anchorX) * scaleX)),
          ny: Math.max(0.002, Math.min(0.998, anchorY + (cp.ny - anchorY) * scaleY)),
        }))
      }
      if (item.shape.center && item.origCenter) {
        item.shape.center.nx = Math.max(0.002, Math.min(0.998, anchorX + (item.origCenter.nx - anchorX) * scaleX))
        item.shape.center.ny = Math.max(0.002, Math.min(0.998, anchorY + (item.origCenter.ny - anchorY) * scaleY))
      }
      if (item.shape.type === 'circle') {
        const avgScale = (scaleX + scaleY) / 2
        if (item.origRadius) item.shape.radius = item.origRadius * avgScale
        if (item.origRadiusPx) item.shape.radiusPx = Math.round(item.origRadiusPx * avgScale)
      }
    }

    board.repaint?.()
  }
}

function onTransformPointerUp() {
  if (transformDrag) {
    if (transformDrag.moved) {
      board.recordAction?.(transformDrag.type === 'move' ? 'Di chuyển vùng chọn' : 'Co giãn vùng chọn')
    }
    transformDrag = null
  }
  window.removeEventListener('pointermove', onTransformPointerMove)
  window.removeEventListener('pointerup', onTransformPointerUp)
}

// Vị trí thanh công cụ trắng ngay dưới khung chọn (00:15 & 00:32)
const selectionBarStyle = computed(() => {
  if (board.writingTool === 'pen' || board.writingTool === 'highlighter') return null
  const rect = board.regionSelection
  if (!rect) return null
  const nx0 = Math.min(rect.nx0, rect.nx1)
  const nx1 = Math.max(rect.nx0, rect.nx1)
  const ny0 = Math.min(rect.ny0, rect.ny1)
  const ny1 = Math.max(rect.ny0, rect.ny1)
  const cx = Math.max(0.22, Math.min(0.78, (nx0 + nx1) / 2))
  // Đặt ngay bên dưới khung chọn; nếu sát đáy màn hình thì đặt lên trên khung chọn
  const placeAbove = ny1 > 0.84
  const topPct = placeAbove ? Math.max(4, ny0 * 100 - 8) : Math.min(92, ny1 * 100 + 2)
  return {
    left: `${cx * 100}%`,
    top: `${topPct}%`,
    transform: placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 6px)',
  }
})

const smartConvertLabel = computed(() => {
  const rect = board.regionSelection
  if (!rect) return 'Tạo mô hình'
  const summary = board.strokesSummaryInRegion?.(rect) || ''
  const lineCount = summary ? summary.split('\n').length : 0
  return lineCount >= 5 ? 'Vẽ đồ thị' : 'Dựng mô hình'
})

const promptByAction = {
  standardize: () => t('board.regionRecognizePrompt'),
  graph: () => t('board.radialGraphPrompt'),
  solve: () => t('board.radialSolvePrompt'),
  explain: () => t('board.radialExplainPrompt'),
}

watch(
  () => board.regionSelection,
  () => {
    errorText.value = ''
    loading.value = false
    loadingAction.value = ''
    lastAction.value = ''
    lastOk.value = ''
  },
)

function buildSideLines(data, actionId) {
  const lines = []
  if (data.standardText) lines.push(data.standardText)
  if (data.summary && !lines.includes(data.summary)) lines.push(data.summary)
  if (data.suggestions?.length) lines.push(...data.suggestions)
  if (!lines.length && data.latex?.length) lines.push(...data.latex)
  const title = actionId === 'solve' ? t('board.radialSolve') : t('board.radialExplain')
  return { title, lines }
}

function detect3dModelFromText(text) {
  if (!text) return null
  const norm = String(text).toLowerCase()
  if (
    norm.includes('vát') ||
    norm.includes('mái dốc') ||
    norm.includes('mái') ||
    norm.includes('cụt') ||
    norm.includes('hình thang') ||
    norm.includes('trapezoid') ||
    norm.includes('truncated')
  ) {
    return 'trapezoid_prism'
  }
  if (
    norm.includes('lăng trụ tam giác') ||
    norm.includes('prism') ||
    norm.includes("abc.a'b'c'") ||
    norm.includes('lăng trụ đứng') ||
    (norm.includes('lăng trụ') && !norm.includes('tứ giác') && !norm.includes('hộp'))
  ) {
    return 'triangular_prism'
  }
  if (
    norm.includes('chóp') ||
    norm.includes('s.abcd') ||
    norm.includes('s.abc') ||
    norm.includes('pyramid') ||
    norm.includes('tứ diện') ||
    norm.includes('tetrahedron')
  ) {
    return 'pyramid'
  }
  if (
    norm.includes('hình hộp') ||
    norm.includes('hộp chữ nhật') ||
    norm.includes('chữ nhật') ||
    norm.includes('hộp') ||
    norm.includes('box') ||
    norm.includes('rectangular')
  ) {
    return 'box'
  }
  if (norm.includes('lập phương') || norm.includes('cube')) {
    return 'cube'
  }
  if (norm.includes('hình trụ') || norm.includes('trụ') || norm.includes('cylinder')) {
    return 'cylinder'
  }
  if (norm.includes('hình nón') || norm.includes('nón') || norm.includes('cone')) {
    return 'cone'
  }
  return null
}

async function runAction(actionId) {
  const rect = board.regionSelection
  if (!rect || loading.value) return
  const rectSnap = { ...rect }
  errorText.value = ''

  if (actionId === 'delete_region') {
    board.deleteStrokesInRegion?.(rectSnap)
    return
  }

  if (actionId === 'plot_graph') {
    loading.value = true
    loadingAction.value = 'plot_graph'
    try {
      // 1. Kiểm tra xem trong vùng chọn có nhãn văn bản / công thức chuẩn nào không
      const minX = Math.min(rectSnap.nx0, rectSnap.nx1)
      const maxX = Math.max(rectSnap.nx0, rectSnap.nx1)
      const minY = Math.min(rectSnap.ny0, rectSnap.ny1)
      const maxY = Math.max(rectSnap.ny0, rectSnap.ny1)
      const labelInRegion = (board.standardLabels || []).find(
        (lb) => lb.nx >= minX && lb.nx <= maxX && lb.ny >= minY && lb.ny <= maxY,
      )

      let formula = ''
      let rawText = ''

      if (labelInRegion?.text) {
        rawText = labelInRegion.text
        formula = cleanFormulaFromText(rawText)
      }

      // 2. Nếu chưa có nhãn chuẩn, gọi Gemini OCR đọc công thức viết tay trong vùng crop
      if (!formula) {
        const snap = board.captureRegionPng?.(rectSnap) || ''
        const summary = board.strokesSummaryInRegion?.(rectSnap) || ''
        const data = await api.draw.boardGemini({
          prompt: 'Đọc công thức hoặc phương trình hàm số trong vùng crop (ví dụ: y = 2x + 1, y = x^2 - 4, y = sin(x)). Chỉ cần nhận diện đúng vế biểu thức hàm số.',
          imageBase64: snap,
          strokesSummary: summary,
          regionAction: 'standardize',
          regionRecognize: true,
        })
        rawText = data?.standardText || data?.latex?.[0] || ''
        formula = cleanFormulaFromText(rawText)
      }

      board.convertStrokesToInteractiveDemo?.(rectSnap, 'graph', {
        formula: formula || '',
        rawLabel: rawText || formula || '',
      })
      board.setWritingTool?.('pen')
      board.clearRegionSelection?.()
    } catch (err) {
      console.warn('[BoardRegionHud] Error recognizing formula for graph:', err)
      board.convertStrokesToInteractiveDemo?.(rectSnap, 'graph', {
        formula: '',
        rawLabel: '',
      })
      board.setWritingTool?.('pen')
      board.clearRegionSelection?.()
    } finally {
      loading.value = false
      loadingAction.value = ''
    }
    return
  }

  if (actionId === 'demo3d') {
    loading.value = true
    loadingAction.value = 'demo3d'
    try {
      // 1. Kiểm tra văn bản hoặc công thức viết tay trong vùng crop
      const minX = Math.min(rectSnap.nx0, rectSnap.nx1)
      const maxX = Math.max(rectSnap.nx0, rectSnap.nx1)
      const minY = Math.min(rectSnap.ny0, rectSnap.ny1)
      const maxY = Math.max(rectSnap.ny0, rectSnap.ny1)
      const labelInRegion = (board.standardLabels || []).find(
        (lb) => lb.nx >= minX && lb.nx <= maxX && lb.ny >= minY && lb.ny <= maxY,
      )

      let detectedModel = null
      let rawText = labelInRegion?.text || ''

      if (rawText) {
        detectedModel = detect3dModelFromText(rawText)
      }

      // 2. Nhận diện hình học từ nét vẽ bằng strokeRecognizer
      const targetStrokes = (board.strokes?.value || []).filter((s) =>
        board.strokeIntersectsRegion?.(s, rectSnap),
      )
      const rec = targetStrokes.length ? recognizeStrokes(targetStrokes) : null
      if (!detectedModel && rec) {
        if (rec.type === 'trapezoid_prism' || rec.type === 'truncated_prism') {
          detectedModel = 'trapezoid_prism'
        } else if (rec.type === 'prism_3d' || rec.type === 'triangular_prism') {
          detectedModel = 'triangular_prism'
        } else if (rec.type === 'pyramid_3d' || rec.type === 'tetrahedron_3d') {
          detectedModel = 'pyramid'
        } else if (rec.type === 'cylinder_3d') {
          detectedModel = 'cylinder'
        } else if (rec.type === 'cone_3d') {
          detectedModel = 'cone'
        } else if (rec.type === 'cube_3d') {
          detectedModel = rec.subType === 'rectangular_prism' ? 'box' : 'cube'
        }
      }

      // 3. Nếu chưa chắc chắn hoặc hình phức tạp, gọi Gemini AI phân tích ảnh crop
      if (!detectedModel) {
        try {
          const snap = board.captureRegionPng?.(rectSnap) || ''
          const summary = board.strokesSummaryInRegion?.(rectSnap) || ''
          const geminiData = await api.draw.boardGemini({
            prompt:
              'Phân tích vùng ảnh crop để nhận diện chính xác loại khối hình học 3D được vẽ hoặc viết. Các loại khối hợp lệ: "trapezoid_prism" (khối lăng trụ vát, mái dốc, lăng trụ cụt, lăng trụ đáy hình thang), "triangular_prism" (lăng trụ đứng tam giác ABC.A\'B\'C\'), "pyramid" (hình chóp S.ABCD hoặc tứ diện), "box" (hình hộp chữ nhật), "cube" (hình lập phương), "cylinder" (hình trụ), "cone" (hình nón). Hãy trả về tên mã model phù hợp nhất.',
            imageBase64: snap,
            strokesSummary: summary,
            regionAction: 'standardize',
            regionRecognize: true,
          })
          const recognizedText = [
            geminiData?.standardText,
            geminiData?.summary,
            geminiData?.drawPrompt,
            ...(geminiData?.recognized || []),
          ]
            .filter(Boolean)
            .join(' ')
          detectedModel = detect3dModelFromText(recognizedText)
        } catch (e) {
          console.warn('[BoardRegionHud] Gemini 3d recognition fallback:', e)
        }
      }

      // 4. Nếu vẫn chưa có model, phân tích hình dáng bao quát
      if (!detectedModel) {
        if (rec?.type === 'custom_graph' && rec.aspect && (rec.aspect > 1.15 || rec.aspect < 0.85)) {
          detectedModel = rec.aspect > 1.18 ? 'trapezoid_prism' : 'box'
        } else {
          detectedModel = 'trapezoid_prism' // Ưu tiên khối lăng trụ vát đa năng theo đề bài
        }
      }

      board.convertStrokesToInteractiveDemo?.(rectSnap, detectedModel)
      board.setWritingTool?.('pen')
      board.clearRegionSelection?.()
    } catch (err) {
      console.warn('[BoardRegionHud] Error in demo3d action:', err)
      board.convertStrokesToInteractiveDemo?.(rectSnap, null)
      board.clearRegionSelection?.()
    } finally {
      loading.value = false
      loadingAction.value = ''
    }
    return
  }

  if (actionId === 'smart_convert') {
    if (smartConvertLabel.value === 'Vẽ đồ thị') {
      return runAction('plot_graph')
    }
    return runAction('demo3d')
  }

  if (actionId === 'beautify') {
    const geom =
      board.beautifyStrokesToGeometry?.(rectSnap) ||
      board.beautifyStrokesInRegion?.(rectSnap)
    if (!geom) {
      errorText.value = 'Chưa có nét vẽ trong vùng chọn.'
    } else {
      board.clearRegionSelection?.()
    }
    return
  }

  loading.value = true
  loadingAction.value = actionId
  lastAction.value = actionId
  lastOk.value = ''

  try {
    const data = await api.draw.boardGemini({
      prompt: promptByAction[actionId]?.() || '',
      imageBase64: board.captureRegionPng(rect),
      strokesSummary: board.strokesSummaryInRegion(rect),
      regionAction: actionId,
      regionRecognize: actionId === 'standardize',
      wantSpec: actionId === 'graph',
    })

    if (actionId === 'standardize') {
      const text = data?.standardText || data?.latex?.[0]
      if (!text) {
        errorText.value = data?.summary || t('board.regionEmpty')
        return
      }
      board.applyStandardToRegion(text, rectSnap)
      lastOk.value = actionId
      return
    }

    if (actionId === 'graph') {
      if (!data?.spec) {
        errorText.value = data?.summary || t('board.regionGraphFail')
        return
      }
      board.addSideGraphPanel(rectSnap, data.spec, getSpecParams(data.spec, {}))
      lastOk.value = actionId
      board.clearRegionSelection()
      return
    }

    if (actionId === 'solve' || actionId === 'explain') {
      const payload = buildSideLines(data, actionId)
      if (!payload.lines.length) {
        errorText.value = t('board.regionEmpty')
        return
      }
      board.addSideTextPanel(rectSnap, actionId, payload)
      lastOk.value = actionId
      board.clearRegionSelection()
    }
  } catch (err) {
    errorText.value =
      err instanceof ApiError ? apiMessage(err, 'board.geminiErr') : t('board.geminiErr')
  } finally {
    loading.value = false
    loadingAction.value = ''
    if (lastOk.value && board.regionSelection) {
      board.clearRegionSelection()
    }
  }
}

function closeAll() {
  if (loading.value) return
  errorText.value = ''
  lastOk.value = ''
  board.clearRegionSelection()
}
</script>

<style scoped>
.board-hud-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 16;
  overflow: visible;
}

/* 1. THANH CÔNG CỤ NGANG MÀU TRẮNG DƯỚI VÙNG CHỌN (Giống video 00:15 & 00:32) */
.ifly-selection-bar {
  position: absolute;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 7px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  user-select: none;
}

.sel-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.sel-tool-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0284c7;
}

.sel-tool-btn--icon {
  padding: 6px 7px;
  color: #475569;
}

.sel-tool-btn--icon:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.sel-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 3px;
}

.sel-green-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 7px;
  background: #3b82f6;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
  transition: transform 0.12s ease, filter 0.12s ease;
}

.sel-green-cta:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.region-err {
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
  margin: 0;
  padding: 6px 12px;
  font-size: 11px;
  color: #fecaca;
  background: rgba(127, 29, 29, 0.94);
  border-radius: 8px;
  pointer-events: auto;
}

/* 2. BÀN XOAY TRÒN MÀU TRẮNG NỔI TRÊN BẢNG (Giống video 00:13, 00:31, 00:56) */
.ifly-white-puck {
  position: absolute;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  margin-top: -24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 8px 30px rgba(15, 23, 42, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  transition:
    width 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease;
}

.ifly-white-puck.is-expanded {
  width: 124px;
  height: 124px;
  margin-left: -62px;
  margin-top: -62px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  box-shadow:
    0 14px 40px rgba(15, 23, 42, 0.15),
    0 0 0 1px rgba(249, 115, 22, 0.15);
}

.puck-center-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid #fed7aa;
  background: #fff7ed;
  color: #2563eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  padding: 0;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.15);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.puck-center-btn:hover {
  border-color: #3b82f6;
  box-shadow: 0 3px 10px rgba(249, 115, 22, 0.25);
}

.puck-center-btn:active {
  cursor: grabbing;
}

.puck-center-icon {
  color: #2563eb;
  transition: transform 0.2s ease;
}

.puck-center-btn:hover .puck-center-icon {
  transform: rotate(15deg) scale(1.1);
}

.puck-center-text {
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.5px;
  color: #1d4ed8;
}

.puck-ring-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.puck-ring-btn svg {
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.puck-ring-btn:hover {
  background: #fff7ed;
  color: #2563eb;
  border-color: #fdba74;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.puck-ring-btn:hover svg {
  transform: scale(1.15);
}

.puck-ring-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow:
    0 4px 12px rgba(249, 115, 22, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.puck-ring-btn.active:hover {
  color: #ffffff;
  border-color: #1d4ed8;
}

.pop-bar-enter-active,
.pop-bar-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.pop-bar-enter-from,
.pop-bar-leave-to {
  opacity: 0;
}

/* KHUNG FREE TRANSFORM PHONG CÁCH PHOTOSHOP (PTS) */
.pts-transform-frame {
  position: absolute;
  pointer-events: auto;
  border: 1.5px solid #3b82f6;
  background: rgba(249, 115, 22, 0.05);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(249, 115, 22, 0.06);
  z-index: 15;
  user-select: none;
  touch-action: none;
}

.pts-body-drag {
  position: absolute;
  inset: 0;
  cursor: move;
  z-index: 1;
}

.pts-edge {
  position: absolute;
  z-index: 2;
  cursor: move;
}
.pts-edge-t { top: -6px; left: 0; right: 0; height: 12px; cursor: ns-resize; }
.pts-edge-b { bottom: -6px; left: 0; right: 0; height: 12px; cursor: ns-resize; }
.pts-edge-l { left: -6px; top: 0; bottom: 0; width: 12px; cursor: ew-resize; }
.pts-edge-r { right: -6px; top: 0; bottom: 0; width: 12px; cursor: ew-resize; }

.pts-handle {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #ffffff;
  border: 1.5px solid #2563eb;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  z-index: 4;
  pointer-events: auto;
  transition: transform 0.1s ease, background 0.1s ease;
}
.pts-handle:hover {
  background: #3b82f6;
  transform: scale(1.25);
}

.pts-tl { left: -5px; top: -5px; cursor: nwse-resize; }
.pts-tc { left: calc(50% - 5px); top: -5px; cursor: ns-resize; }
.pts-tr { right: -5px; top: -5px; cursor: nesw-resize; }
.pts-mr { right: -5px; top: calc(50% - 5px); cursor: ew-resize; }
.pts-br { right: -5px; bottom: -5px; cursor: nwse-resize; }
.pts-bc { left: calc(50% - 5px); bottom: -5px; cursor: ns-resize; }
.pts-bl { left: -5px; bottom: -5px; cursor: nesw-resize; }
.pts-ml { left: -5px; top: calc(50% - 5px); cursor: ew-resize; }

.pts-size-badge {
  position: absolute;
  top: -26px;
  left: 0;
  background: #ffffff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid #fed7aa;
  pointer-events: none;
  white-space: nowrap;
  letter-spacing: 0.2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>

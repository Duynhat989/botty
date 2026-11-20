<template>
  <div class="board-demos-layer">
    <div
      v-for="demo in demosList"
      :key="demo.id"
      class="inplace-board-object"
      :class="{
        'is-3d': demo.type === '3d',
        'is-graph': demo.type === 'graph',
        'is-pen-passthrough': isPenPassthrough(demo),
      }"
      :style="{
        left: `${Number.isFinite(demo.x) ? demo.x : 100}px`,
        top: `${Number.isFinite(demo.y) ? demo.y : 80}px`,
        width: `${Number.isFinite(demo.width) && demo.width >= 240 ? demo.width : 420}px`,
        height: `${Number.isFinite(demo.height) && demo.height >= 220 ? demo.height : 360}px`,
      }"
      @pointerdown.stop
    >
      <!-- KHUNG VIỀN TRẮNG 8 ĐIỂM NEO VUÔNG -->
      <div class="white-selection-frame">
        <!-- 4 Cạnh viền bắt dính kéo di chuyển cả khung -->
        <div class="frame-edge edge-t" title="Kéo để di chuyển khung" @pointerdown.stop="startMoveDemo(demo, $event)" />
        <div class="frame-edge edge-b" title="Kéo để di chuyển khung" @pointerdown.stop="startMoveDemo(demo, $event)" />
        <div class="frame-edge edge-l" title="Kéo để di chuyển khung" @pointerdown.stop="startMoveDemo(demo, $event)" />
        <div class="frame-edge edge-r" title="Kéo để di chuyển khung" @pointerdown.stop="startMoveDemo(demo, $event)" />

        <!-- 8 điểm neo co giãn khung -->
        <span class="sq-handle sq-tl" title="Co giãn góc trên-trái" @pointerdown.stop="startResizeDemo(demo, 'tl', $event)" />
        <span class="sq-handle sq-tc" title="Co giãn cạnh trên" @pointerdown.stop="startResizeDemo(demo, 'tc', $event)" />
        <span class="sq-handle sq-tr" title="Co giãn góc trên-phải" @pointerdown.stop="startResizeDemo(demo, 'tr', $event)" />
        <span class="sq-handle sq-mr" title="Co giãn cạnh phải" @pointerdown.stop="startResizeDemo(demo, 'mr', $event)" />
        <span class="sq-handle sq-br" title="Co giãn góc dưới-phải" @pointerdown.stop="startResizeDemo(demo, 'br', $event)" />
        <span class="sq-handle sq-bc" title="Co giãn cạnh dưới" @pointerdown.stop="startResizeDemo(demo, 'bc', $event)" />
        <span class="sq-handle sq-bl" title="Co giãn góc dưới-trái" @pointerdown.stop="startResizeDemo(demo, 'bl', $event)" />
        <span class="sq-handle sq-ml" title="Co giãn cạnh trái" @pointerdown.stop="startResizeDemo(demo, 'ml', $event)" />
      </div>

      <!-- =========================================================================
           TRƯỜNG HỢP 1: KHỐI 3D TRỰC TIẾP TRÊN BẢNG ĐEN (Video 00:30 - 00:50)
           ========================================================================= -->
      <template v-if="demo.type === '3d'">
        <!-- Canvas 3D trực tiếp trên nền bảng đen -->
        <canvas
          :ref="(el) => setCanvasRef(demo.id, el)"
          class="inplace-3d-canvas"
          :class="{
            'cursor-crosshair': demo.interactionMode === 'point_slice',
            'cursor-ns': demo.interactionMode === 'axis_slide',
            'cursor-grab': demo.interactionMode === 'rotate',
          }"
          @pointerdown="on3dPointerDown(demo, $event)"
          @pointermove="on3dPointerMove(demo, $event)"
          @pointerup="on3dPointerUp(demo, $event)"
          @pointerleave="on3dPointerLeave(demo)"
          @wheel.prevent="on3dWheel(demo, $event)"
        />

        <!-- Thanh tiêu đề & chỉ dẫn ngắn góc trên trong khung 3D: cho phép kéo di chuyển -->
        <div
          class="inplace-3d-hint is-draggable"
          title="Kéo thanh tiêu đề để di chuyển khối 3D"
          @pointerdown.stop="startMoveDemo(demo, $event)"
        >
          <GripVertical :size="13" class="hint-grip-icon" />
          <span class="model-badge">{{ getModelDisplayName(demo.model) }}</span>
          <template v-if="!demo.slicingActive">
            <span class="hint-dot-blue" />
            <span>
              Chấm <strong>{{ 3 - (demo.edgePoints?.length || 0) }}</strong> điểm nữa lên cạnh để tạo mặt phẳng cắt
              (hoặc kéo để xoay 3D)
            </span>
          </template>
          <template v-else>
            <span class="hint-dot-red" />
            <span>
              <strong>{{ demo.cutInfo?.polygonName }}</strong> • Kéo điểm xanh trên cạnh hoặc kéo
              <strong>mũi tên đỏ</strong> để trượt mặt cắt
            </span>
          </template>
        </div>

        <!-- HÌNH CHIẾU PHẲNG 2D CỦA THIẾT DIỆN NGAY BÊN TRÁI TRÊN NỀN BẢNG -->
        <transition name="slide-left-fade">
          <div
            v-if="demo.slicingActive && demo.showCrossSection2d"
            class="cross-section-2d-projection is-draggable"
            :style="{
              transform: demo.cross2dOffsetX || demo.cross2dOffsetY
                ? `translate(${demo.cross2dOffsetX || 0}px, calc(-50% + ${demo.cross2dOffsetY || 0}px))`
                : 'translateY(-50%)',
            }"
            title="Hình phẳng thực tế của thiết diện (Kéo để di chuyển độc lập)"
            @pointerdown.stop="startMoveCross2d(demo, $event)"
          >
            <canvas
              :ref="(el) => setCross2dRef(demo, el)"
              class="cross-2d-board-canvas"
            />
            <div class="cross-2d-caption">
              <GripVertical :size="12" class="caption-grip" />
              <span>{{ demo.cutInfo?.polygonName }}</span>
              <strong v-if="demo.cutInfo?.angleDeg">{{ demo.cutInfo.angleDeg }}</strong>
            </div>
          </div>
        </transition>

        <!-- THANH CÔNG CỤ NGANG MÀU TRẮNG NGAY DƯỚI KHỐI 3D (CHỈ HIỆN ICON, HOVER HIỆN TÊN TEXT) -->
        <div class="white-bottom-bar" @pointerdown.stop>
          <!-- Nút kéo di chuyển khối 3D -->
          <div
            class="wb-drag-grip"
            title="Kéo để di chuyển khối 3D"
            @pointerdown.stop="startMoveDemo(demo, $event)"
          >
            <GripVertical :size="15" />
          </div>

          <!-- Nút chọn / đổi nhanh loại khối 3D (Lăng trụ vát, lăng trụ tam giác, hình hộp, lập phương, chóp...) -->
          <div class="wb-dropdown-wrap">
            <button
              type="button"
              class="wb-btn wb-btn--model"
              title="Đổi loại khối 3D"
              @click="toggleModelDropdown(demo)"
            >
              <Box :size="15" />
              <span class="wb-model-label">{{ getModelShortName(demo.model) }}</span>
              <ChevronDown :size="12" />
            </button>
            <div v-if="activeModelMenuDemoId === demo.id" class="wb-model-popover" @pointerdown.stop>
              <button
                v-for="opt in modelOptions"
                :key="opt.id"
                type="button"
                class="wb-model-item"
                :class="{ active: demo.model === opt.id }"
                @click="selectDemoModel(demo, opt.id)"
              >
                <span class="m-icon">{{ opt.icon }}</span>
                <span class="m-text">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <span class="wb-sep" />

          <!-- Chế độ 1: Chấm điểm trên cạnh để cắt -->
          <button
            type="button"
            class="wb-btn"
            :class="{ active: demo.interactionMode === 'point_slice' }"
            @click="set3dMode(demo, 'point_slice')"
          >
            <MapPin :size="16" />
            <span v-if="demo.edgePoints?.length" class="wb-dot-badge">{{ demo.edgePoints.length }}</span>
            <span class="wb-tooltip">Chấm điểm ({{ demo.edgePoints?.length || 0 }}/3)</span>
          </button>

          <!-- Chế độ 2: Kéo trượt mặt cắt dọc theo trục pháp tuyến đỏ -->
          <button
            type="button"
            class="wb-btn"
            :class="{ active: demo.interactionMode === 'axis_slide' }"
            @click="enableAxisSlideMode(demo)"
          >
            <MoveVertical :size="16" />
            <span class="wb-tooltip">Trượt mặt cắt</span>
          </button>

          <!-- Thanh trượt nhanh vị trí mặt cắt d khi đang bật mặt cắt -->
          <div v-if="demo.slicingActive" class="wb-inline-slider" title="Trượt mặt phẳng cắt qua các cạnh">
            <input
              v-model.number="demo.sliceHeight"
              type="range"
              min="-1.15"
              max="1.15"
              step="0.02"
              class="wb-range"
              @input="onManualSlideHeight(demo)"
            />
          </div>

          <!-- Chế độ 3: Xoay 3D 360 độ -->
          <button
            type="button"
            class="wb-btn"
            :class="{ active: demo.interactionMode === 'rotate' }"
            @click="set3dMode(demo, 'rotate')"
          >
            <Rotate3d :size="16" />
            <span class="wb-tooltip">Xoay 3D</span>
          </button>

          <!-- Bật/tắt hình phẳng 2D bên trái -->
          <button
            type="button"
            class="wb-btn"
            :class="{ active: demo.slicingActive && demo.showCrossSection2d }"
            @click="toggle2dProjection(demo)"
          >
            <Layers :size="16" />
            <span class="wb-tooltip">Hình 2D</span>
          </button>

          <span class="wb-sep" />

          <!-- Các mẫu thiết diện chuẩn 1-click (Tam giác -> Tứ giác -> Ngũ giác -> Lục giác 120°) -->
          <button
            type="button"
            class="wb-chip"
            :class="{ active: demo.slicingActive && demo.slicePreset === 'triangle' }"
            @click="applySlicePreset(demo, 'triangle')"
          >
            <Triangle :size="15" />
            <span class="wb-tooltip">Tam giác</span>
          </button>

          <button
            type="button"
            class="wb-chip"
            :class="{ active: demo.slicingActive && demo.slicePreset === 'rectangle' }"
            @click="applySlicePreset(demo, 'rectangle')"
          >
            <Square :size="15" />
            <span class="wb-tooltip">Tứ giác</span>
          </button>

          <button
            type="button"
            class="wb-chip"
            :class="{ active: demo.slicingActive && demo.slicePreset === 'pentagon' }"
            @click="applySlicePreset(demo, 'pentagon')"
          >
            <Pentagon :size="15" />
            <span class="wb-tooltip">Ngũ giác</span>
          </button>

          <button
            type="button"
            class="wb-chip wb-chip--hex"
            :class="{ active: demo.slicingActive && demo.slicePreset === 'hexagon' }"
            @click="applySlicePreset(demo, 'hexagon')"
          >
            <Hexagon :size="15" />
            <span class="wb-tooltip">Lục giác 120°</span>
          </button>

          <button
            v-if="demo.slicingActive || (demo.edgePoints && demo.edgePoints.length)"
            type="button"
            class="wb-btn wb-btn--icon"
            @click="resetCubePoints(demo)"
          >
            <RotateCcw :size="15" />
            <span class="wb-tooltip">Đặt lại mặt cắt</span>
          </button>

          <button
            type="button"
            class="wb-btn wb-btn--icon"
            @click="removeDemo(demo.id)"
          >
            <Trash2 :size="15" />
            <span class="wb-tooltip">Xóa mô hình</span>
          </button>

        </div>
      </template>

      <!-- =========================================================================
           TRƯỜNG HỢP 2: ĐỒ THỊ HÀM SỐ 2D TRỰC TIẾP TRÊN BẢNG (Video 00:16 - 00:23)
           ========================================================================= -->
      <template v-else-if="demo.type === 'graph'">
        <canvas
          :ref="(el) => setCanvasRef(demo.id, el)"
          class="inplace-graph-canvas"
          @pointerdown="startMoveDemo(demo, $event)"
        />

        <!-- THANH TRƯỢT THAM SỐ A, B NẰM NGAY GÓC TRÊN PHẢI TRONG ĐỒ THỊ (Giống hệt video 00:18 - 00:22) -->
        <div class="graph-inline-sliders" @pointerdown.stop>
          <div class="gis-row">
            <span class="gis-label">A</span>
            <input
              v-model.number="demo.graphParams.A"
              type="range"
              min="-3"
              max="3"
              step="0.05"
              class="gis-range"
              @input="renderDemoGraph(demo)"
            />
            <span class="gis-val">{{ demo.graphParams.A.toFixed(1) }}</span>
          </div>
          <div class="gis-row">
            <span class="gis-label">B</span>
            <input
              v-model.number="demo.graphParams.B"
              type="range"
              min="-3"
              max="3"
              step="0.05"
              class="gis-range"
              @input="renderDemoGraph(demo)"
            />
            <span class="gis-val">{{ demo.graphParams.B.toFixed(1) }}</span>
          </div>
        </div>

        <!-- THANH CÔNG CỤ TRẮNG DƯỚI ĐỒ THỊ -->
        <div class="white-bottom-bar" @pointerdown.stop>
          <label class="wb-formula-lbl wb-formula-lbl--red">
            <span>y₁ =</span>
            <input
              v-model="demo.customFormulas.f1"
              type="text"
              class="wb-formula-inp"
              placeholder="Nhập hàm f(x)..."
              @input="renderDemoGraph(demo)"
            />
          </label>
          <label class="wb-formula-lbl wb-formula-lbl--blue">
            <span>y₂ =</span>
            <input
              v-model="demo.customFormulas.f2"
              type="text"
              class="wb-formula-inp"
              placeholder="Hàm thứ 2 (tùy chọn)..."
              @input="renderDemoGraph(demo)"
            />
          </label>

          <button
            type="button"
            class="wb-btn wb-btn--icon"
            title="Đặt lại A = 1.5, B = 0"
            @click="resetGraphParams(demo)"
          >
            <RotateCcw :size="14" />
          </button>

          <button
            type="button"
            class="wb-btn wb-btn--icon"
            title="Xóa khung đồ thị này"
            @click="removeDemo(demo.id)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Box,
  ChevronDown,
  GripVertical,
  Hexagon,
  Layers,
  MapPin,
  MoveVertical,
  Pentagon,
  Rotate3d,
  RotateCcw,
  Square,
  Trash2,
  Triangle,
  X,
} from '@lucide/vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardInteractiveDemo requires WRITING_BOARD_KEY')

const demosList = computed(() => {
  const d = board.interactiveDemos
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.value)) return d.value
  return []
})

const canvasMap = new Map()
const cross2dMap = new Map()
const hoverEdgeMap = new Map() // demo.id -> { edgeIndex, t, px, py, isMid }

let activePointerState = null // { type: 'rotate' | 'drag_point' | 'slide_axis' | 'move_card' | 'resize_card', demo, ... }

function isPenPassthrough() {
  // Cho phép tương tác trực tiếp với khối 3D và thanh trượt ngay cả khi đang cầm bút,
  // giống như giáo viên trong video dùng bút chấm thẳng lên cạnh hình lập phương!
  return false
}

function setCanvasRef(id, el) {
  if (el) {
    const isNew = canvasMap.get(id) !== el
    canvasMap.set(id, el)
    if (isNew) redrawAll()
  } else {
    canvasMap.delete(id)
  }
}

function setCross2dRef(demo, el) {
  const id = typeof demo === 'object' ? demo.id : demo
  if (el) {
    const isNew = cross2dMap.get(id) !== el
    cross2dMap.set(id, el)
    if (isNew) redrawAll()
  } else {
    cross2dMap.delete(id)
  }
}

function removeDemo(id) {
  board.removeInteractiveDemo(id)
}

function set3dMode(demo, mode) {
  demo.interactionMode = mode
  redrawAll()
}

function enableAxisSlideMode(demo) {
  demo.interactionMode = 'axis_slide'
  if (!demo.slicingActive) {
    applySlicePreset(demo, 'triangle')
  } else {
    redrawAll()
  }
}

function toggle2dProjection(demo) {
  if (!demo.slicingActive) {
    applySlicePreset(demo, 'hexagon')
    demo.showCrossSection2d = true
  } else {
    demo.showCrossSection2d = !demo.showCrossSection2d
  }
  redrawAll()
}

function resetCubePoints(demo) {
  demo.edgePoints = []
  demo.slicingActive = false
  demo.slicePreset = 'custom'
  demo.interactionMode = 'point_slice'
  demo.cutInfo = {
    polygonName: 'Chấm 3 điểm trên cạnh để cắt',
    edgesCount: 0,
    edgeFormula: '—',
    angleDeg: '—',
    areaFormula: '—',
  }
  redrawAll()
}

function resetGraphParams(demo) {
  demo.graphParams.A = 1.5
  demo.graphParams.B = 0
  renderDemoGraph(demo)
}

// ==================== DI CHUYỂN & THAY ĐỔI KÍCH THƯỚC KHUNG TRÊN BẢNG ====================
function startMoveDemo(demo, e) {
  if (e.button !== 0) return
  activePointerState = {
    type: 'move_card',
    demo,
    startX: e.clientX,
    startY: e.clientY,
    origX: Number.isFinite(demo.x) ? demo.x : 100,
    origY: Number.isFinite(demo.y) ? demo.y : 80,
  }
  window.addEventListener('pointermove', onGlobalPointerMove)
  window.addEventListener('pointerup', onGlobalPointerUp)
}

function startMoveCross2d(demo, e) {
  if (e.button !== 0) return
  activePointerState = {
    type: 'move_cross_2d',
    demo,
    startX: e.clientX,
    startY: e.clientY,
    origOffsetX: Number.isFinite(demo.cross2dOffsetX) ? demo.cross2dOffsetX : 0,
    origOffsetY: Number.isFinite(demo.cross2dOffsetY) ? demo.cross2dOffsetY : 0,
  }
  window.addEventListener('pointermove', onGlobalPointerMove)
  window.addEventListener('pointerup', onGlobalPointerUp)
}

function startResizeDemo(demo, corner, e) {
  if (e.button !== 0) return
  activePointerState = {
    type: 'resize_card',
    demo,
    corner,
    startX: e.clientX,
    startY: e.clientY,
    origX: Number.isFinite(demo.x) ? demo.x : 100,
    origY: Number.isFinite(demo.y) ? demo.y : 80,
    origW: Number.isFinite(demo.width) ? demo.width : 420,
    origH: Number.isFinite(demo.height) ? demo.height : 360,
  }
  window.addEventListener('pointermove', onGlobalPointerMove)
  window.addEventListener('pointerup', onGlobalPointerUp)
}

function onGlobalPointerMove(e) {
  if (!activePointerState) return
  const st = activePointerState
  const dx = e.clientX - st.startX
  const dy = e.clientY - st.startY

  if (st.type === 'move_card') {
    st.demo.x = Math.max(8, st.origX + dx)
    st.demo.y = Math.max(8, st.origY + dy)
  } else if (st.type === 'move_cross_2d') {
    st.demo.cross2dOffsetX = st.origOffsetX + dx
    st.demo.cross2dOffsetY = st.origOffsetY + dy
  } else if (st.type === 'resize_card') {
    const minW = 260
    const minH = 220
    const corner = st.corner || 'br'

    if (corner === 'br') {
      st.demo.width = Math.max(minW, st.origW + dx)
      st.demo.height = Math.max(minH, st.origH + dy)
    } else if (corner === 'mr') {
      st.demo.width = Math.max(minW, st.origW + dx)
    } else if (corner === 'bc') {
      st.demo.height = Math.max(minH, st.origH + dy)
    } else if (corner === 'tr') {
      const newH = Math.max(minH, st.origH - dy)
      st.demo.y = st.origY + (st.origH - newH)
      st.demo.height = newH
      st.demo.width = Math.max(minW, st.origW + dx)
    } else if (corner === 'tc') {
      const newH = Math.max(minH, st.origH - dy)
      st.demo.y = st.origY + (st.origH - newH)
      st.demo.height = newH
    } else if (corner === 'bl') {
      const newW = Math.max(minW, st.origW - dx)
      st.demo.x = st.origX + (st.origW - newW)
      st.demo.width = newW
      st.demo.height = Math.max(minH, st.origH + dy)
    } else if (corner === 'ml') {
      const newW = Math.max(minW, st.origW - dx)
      st.demo.x = st.origX + (st.origW - newW)
      st.demo.width = newW
    } else if (corner === 'tl') {
      const newW = Math.max(minW, st.origW - dx)
      const newH = Math.max(minH, st.origH - dy)
      st.demo.x = st.origX + (st.origW - newW)
      st.demo.y = st.origY + (st.origH - newH)
      st.demo.width = newW
      st.demo.height = newH
    }

    nextTick(() => {
      if (st.demo.type === '3d') renderDemo3d(st.demo)
      else renderDemoGraph(st.demo)
    })
  }
}

function onGlobalPointerUp() {
  activePointerState = null
  window.removeEventListener('pointermove', onGlobalPointerMove)
  window.removeEventListener('pointerup', onGlobalPointerUp)
}

// ==================== HÌNH HỌC 3D & TOÁN HỌC THIẾT DIỆN ====================
const activeModelMenuDemoId = ref(null)

const modelOptions = [
  { id: 'trapezoid_prism', label: 'Khối lăng trụ vát (mái dốc / đáy hình thang)', icon: '🏠' },
  { id: 'triangular_prism', label: "Lăng trụ tam giác ABC.A'B'C'", icon: '📐' },
  { id: 'box', label: "Hình hộp chữ nhật ABCD.A'B'C'D'", icon: '📦' },
  { id: 'cube', label: "Hình lập phương ABCD.A'B'C'D'", icon: '🧊' },
  { id: 'pyramid', label: 'Hình chóp tứ giác S.ABCD', icon: '🔺' },
  { id: 'cylinder', label: 'Hình trụ 3D', icon: '🥫' },
  { id: 'cone', label: 'Hình nón 3D', icon: '🍦' },
]

function getModelShortName(model) {
  switch (model) {
    case 'trapezoid_prism':
    case 'truncated_prism':
      return 'Lăng trụ vát'
    case 'triangular_prism':
    case 'prism':
      return 'Lăng trụ tam giác'
    case 'box':
    case 'rectangular_prism':
      return 'Hình hộp'
    case 'cube':
      return 'Lập phương'
    case 'pyramid':
      return 'Hình chóp'
    case 'cylinder':
      return 'Hình trụ'
    case 'cone':
      return 'Hình nón'
    default:
      return 'Khối 3D'
  }
}

function toggleModelDropdown(demo) {
  activeModelMenuDemoId.value = activeModelMenuDemoId.value === demo.id ? null : demo.id
}

function selectDemoModel(demo, newModel) {
  demo.model = newModel
  demo.edgePoints = []
  demo.slicingActive = false
  demo.cutInfo = null
  activeModelMenuDemoId.value = null
  nextTick(() => {
    renderDemo3d(demo)
  })
}

function getModelDisplayName(model) {
  switch (model) {
    case 'trapezoid_prism':
    case 'truncated_prism':
      return 'Khối lăng trụ vát (Đáy hình thang)'
    case 'triangular_prism':
    case 'prism':
      return "Hình lăng trụ đứng ABC.A'B'C'"
    case 'box':
    case 'rectangular_prism':
      return "Hình hộp chữ nhật ABCD.A'B'C'D'"
    case 'cube':
      return "Hình lập phương ABCD.A'B'C'D'"
    case 'pyramid':
      return 'Hình chóp tứ giác S.ABCD'
    case 'cylinder':
      return 'Hình trụ 3D'
    case 'cone':
      return 'Hình nón 3D'
    default:
      return 'Mô hình 3D tương tác'
  }
}

function getModelGeometry(model, demo = null) {
  // 1. Khối lăng trụ vát / đáy hình thang vuông (như hình người dùng vẽ trong bài tập)
  if (model === 'trapezoid_prism' || model === 'truncated_prism') {
    const asp = demo?.aspect || 1.2
    const sx = asp >= 1.0 ? Math.min(1.4, Math.max(0.9, asp * 0.85)) : 0.85
    const sy = 0.95
    const sz = 0.85
    // Đáy dưới phẳng, mặt bên trái cao hơn mặt bên phải (tạo mái vát dốc chuẩn theo nét vẽ)
    const yTopLeft = sy * 1.15
    const yTopRight = sy * 0.35
    const yBottom = -sy
    const vertices = [
      // Đáy dưới (ABCD)
      { id: 'A', x: -sx, y: yBottom, z: -sz },
      { id: 'B', x: sx, y: yBottom, z: -sz },
      { id: 'C', x: sx, y: yBottom, z: sz },
      { id: 'D', x: -sx, y: yBottom, z: sz },
      // Đáy trên cắt vát (A'B'C'D')
      { id: "A'", x: -sx, y: yTopLeft, z: -sz },
      { id: "B'", x: sx, y: yTopRight, z: -sz },
      { id: "C'", x: sx, y: yTopRight, z: sz },
      { id: "D'", x: -sx, y: yTopLeft, z: sz },
    ]
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Đáy dưới
      [4, 5], [5, 6], [6, 7], [7, 4], // Đáy trên (cạnh nghiêng vát)
      [0, 4], [1, 5], [2, 6], [3, 7], // 4 cạnh bên đứng
    ]
    const faces = [
      { verts: [0, 1, 2, 3], normal: [0, -1, 0] },
      { verts: [4, 5, 6, 7], normal: [0.35, 0.9, 0] }, // Mặt phẳng nghiêng vát
      { verts: [0, 1, 5, 4], normal: [0, 0, -1] },
      { verts: [2, 3, 7, 6], normal: [0, 0, 1] },
      { verts: [1, 2, 6, 5], normal: [1, 0, 0] },
      { verts: [3, 0, 4, 7], normal: [-1, 0, 0] },
    ]
    return { vertices, edges, faces, isTrapezoidPrism: true }
  }

  // 2. Hình lăng trụ đứng tam giác ABC.A'B'C'
  if (model === 'prism' || model === 'triangular_prism') {
    const sy = 1.05
    const vertices = [
      // Đáy dưới ABC
      { id: 'A', x: -1.0, y: -sy, z: -0.65 },
      { id: 'B', x: 1.0, y: -sy, z: -0.65 },
      { id: 'C', x: 0.15, y: -sy, z: 0.85 },
      // Đáy trên A'B'C'
      { id: "A'", x: -1.0, y: sy, z: -0.65 },
      { id: "B'", x: 1.0, y: sy, z: -0.65 },
      { id: "C'", x: 0.15, y: sy, z: 0.85 },
    ]
    const edges = [
      [0, 1], [1, 2], [2, 0], // Đáy dưới
      [3, 4], [4, 5], [5, 3], // Đáy trên
      [0, 3], [1, 4], [2, 5], // 3 cạnh bên đứng
    ]
    const faces = [
      { verts: [0, 1, 2], normal: [0, -1, 0] },
      { verts: [3, 4, 5], normal: [0, 1, 0] },
      { verts: [0, 1, 4, 3], normal: [0, 0, -1] },
      { verts: [1, 2, 5, 4], normal: [0.8, 0, 0.5] },
      { verts: [2, 0, 3, 5], normal: [-0.8, 0, 0.5] },
    ]
    return { vertices, edges, faces, isPrism: true }
  }

  if (model === 'pyramid') {
    const vertices = [
      { id: 'A', x: -1, y: -0.85, z: -1 },
      { id: 'B', x: 1, y: -0.85, z: -1 },
      { id: 'C', x: 1, y: -0.85, z: 1 },
      { id: 'D', x: -1, y: -0.85, z: 1 },
      { id: 'S', x: 0, y: 1.15, z: 0 },
    ]
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 0], [4, 1], [4, 2], [4, 3],
    ]
    const faces = [
      { verts: [0, 1, 2, 3], normal: [0, -1, 0] },
      { verts: [4, 0, 1], normal: [0, 0.5, -1] },
      { verts: [4, 1, 2], normal: [1, 0.5, 0] },
      { verts: [4, 2, 3], normal: [0, 0.5, 1] },
      { verts: [4, 3, 0], normal: [-1, 0.5, 0] },
    ]
    return { vertices, edges, faces }
  }

  if (model === 'box' || model === 'rectangular_prism') {
    // Hình hộp chữ nhật ABCD.A'B'C'D' với tỉ lệ dài - rộng - cao chuẩn xác theo nét vẽ
    const asp = demo?.aspect || 1.35
    const sx = asp >= 1.0 ? Math.min(1.8, Math.max(0.7, asp * 0.9)) : 0.82
    const sy = asp < 1.0 ? Math.min(1.8, Math.max(0.7, (1 / asp) * 0.9)) : 0.82
    const sz = 0.9
    const vertices = [
      { id: 'A', x: -sx, y: -sy, z: -sz },
      { id: 'B', x: sx, y: -sy, z: -sz },
      { id: 'C', x: sx, y: -sy, z: sz },
      { id: 'D', x: -sx, y: -sy, z: sz },
      { id: "A'", x: -sx, y: sy, z: -sz },
      { id: "B'", x: sx, y: sy, z: -sz },
      { id: "C'", x: sx, y: sy, z: sz },
      { id: "D'", x: -sx, y: sy, z: sz },
    ]
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // đáy dưới
      [4, 5], [5, 6], [6, 7], [7, 4], // đáy trên
      [0, 4], [1, 5], [2, 6], [3, 7], // 4 cạnh bên đứng
    ]
    const faces = [
      { verts: [0, 1, 2, 3], normal: [0, -1, 0] },
      { verts: [4, 5, 6, 7], normal: [0, 1, 0] },
      { verts: [0, 1, 5, 4], normal: [0, 0, -1] },
      { verts: [2, 3, 7, 6], normal: [0, 0, 1] },
      { verts: [1, 2, 6, 5], normal: [1, 0, 0] },
      { verts: [3, 0, 4, 7], normal: [-1, 0, 0] },
    ]
    return { vertices, edges, faces, isBox: true }
  }

  // Mặc định: Hình lập phương ABCD.A'B'C'D' chuẩn sách giáo khoa (1:1:1)
  const vertices = [
    { id: 'A', x: -1, y: -1, z: -1 },
    { id: 'B', x: 1, y: -1, z: -1 },
    { id: 'C', x: 1, y: -1, z: 1 },
    { id: 'D', x: -1, y: -1, z: 1 },
    { id: "A'", x: -1, y: 1, z: -1 },
    { id: "B'", x: 1, y: 1, z: -1 },
    { id: "C'", x: 1, y: 1, z: 1 },
    { id: "D'", x: -1, y: 1, z: 1 },
  ]
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // đáy dưới
    [4, 5], [5, 6], [6, 7], [7, 4], // đáy trên
    [0, 4], [1, 5], [2, 6], [3, 7], // 4 cạnh bên đứng
  ]
  const faces = [
    { verts: [0, 1, 2, 3], normal: [0, -1, 0] },
    { verts: [4, 5, 6, 7], normal: [0, 1, 0] },
    { verts: [0, 1, 5, 4], normal: [0, 0, -1] },
    { verts: [2, 3, 7, 6], normal: [0, 0, 1] },
    { verts: [1, 2, 6, 5], normal: [1, 0, 0] },
    { verts: [3, 0, 4, 7], normal: [-1, 0, 0] },
  ]
  return { vertices, edges, faces }
}

function rotatePoint3d(p, yaw, pitch) {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = p.x * cosY - p.z * sinY
  const z1 = p.x * sinY + p.z * cosY

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const y2 = p.y * cosP - z1 * sinP
  const z2 = p.y * sinP + z1 * cosP

  return { x: x1, y: y2, z: z2 }
}

function project3d(p, yaw, pitch, zoom, cx, cy, scale) {
  const r = rotatePoint3d(p, yaw, pitch)
  const fov = 4.8
  const persp = fov / (fov + r.z * 0.32)
  const s = scale * (zoom || 1) * persp
  return {
    x: cx + r.x * s,
    y: cy - r.y * s,
    z: r.z,
    rx: r.x,
    ry: r.y,
  }
}

/** Tính tọa độ 3D của 1 điểm nằm trên cạnh thứ edgeIndex với tỉ lệ t in [0, 1] */
function getEdgePoint3d(geom, edgeIndex, t) {
  const edge = geom.edges[edgeIndex]
  if (!edge) return { x: 0, y: 0, z: 0 }
  const v1 = geom.vertices[edge[0]]
  const v2 = geom.vertices[edge[1]]
  return {
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
    z: v1.z + (v2.z - v1.z) * t,
  }
}

/** Từ 3 điểm trên các cạnh P1, P2, P3 -> Tính vector pháp tuyến chuẩn hóa n và khoảng cách d */
function computePlaneFrom3EdgePoints(demo) {
  if (!demo.edgePoints || demo.edgePoints.length < 3) return false
  const geom = getModelGeometry(demo.model, demo)
  const p1 = getEdgePoint3d(geom, demo.edgePoints[0].edgeIndex, demo.edgePoints[0].t)
  const p2 = getEdgePoint3d(geom, demo.edgePoints[1].edgeIndex, demo.edgePoints[1].t)
  const p3 = getEdgePoint3d(geom, demo.edgePoints[2].edgeIndex, demo.edgePoints[2].t)

  const u = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z }
  const v = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z }
  let nx = u.y * v.z - u.z * v.y
  let ny = u.z * v.x - u.x * v.z
  let nz = u.x * v.y - u.y * v.x
  const len = Math.hypot(nx, ny, nz)
  if (len < 1e-4) return false

  nx /= len
  ny /= len
  nz /= len
  // Định hướng vector pháp tuyến hướng về phía dương để thống nhất chiều mũi tên đỏ
  if (nx + ny + nz < 0) {
    nx = -nx
    ny = -ny
    nz = -nz
  }

  const d = nx * p1.x + ny * p1.y + nz * p1.z
  demo.sliceNormal = { x: nx, y: ny, z: nz }
  demo.sliceHeight = d
  demo.slicingActive = true
  demo.slicePreset = 'custom'
  return true
}

/** Áp dụng nhanh các mặt cắt kinh điển trong SGK & Video (00:35 -> 00:46) */
function applySlicePreset(demo, preset) {
  demo.slicePreset = preset
  demo.slicingActive = true
  demo.showCrossSection2d = true

  if (preset === 'triangle') {
    // 3 điểm trên 3 cạnh xuất phát từ đỉnh A'(-1, 1, -1): cạnh [4,5], [4,7], [0,4]
    demo.edgePoints = [
      { edgeIndex: 4, t: 0.38, label: 'M' },
      { edgeIndex: 7, t: 0.62, label: 'N' },
      { edgeIndex: 8, t: 0.62, label: 'P' },
    ]
    computePlaneFrom3EdgePoints(demo)
  } else if (preset === 'rectangle') {
    // Mặt phẳng cắt 4 cạnh tạo hình thang / tứ giác
    demo.edgePoints = [
      { edgeIndex: 4, t: 0.65, label: 'M' },
      { edgeIndex: 6, t: 0.35, label: 'N' },
      { edgeIndex: 8, t: 0.35, label: 'P' },
    ]
    demo.sliceNormal = { x: 0.68, y: 0.55, z: 0.48 }
    demo.sliceHeight = 0.32
  } else if (preset === 'pentagon') {
    // Mặt phẳng cắt 5 mặt tạo ngũ giác (giống video 00:43)
    demo.edgePoints = [
      { edgeIndex: 4, t: 0.72, label: 'M' },
      { edgeIndex: 7, t: 0.28, label: 'N' },
      { edgeIndex: 8, t: 0.28, label: 'P' },
    ]
    const inv = 1 / Math.sqrt(3)
    demo.sliceNormal = { x: inv, y: inv, z: inv }
    demo.sliceHeight = 0.22
  } else if (preset === 'hexagon') {
    // Lục giác đều đi qua 6 trung điểm (d = 0, n = (1,1,1)/sqrt(3)) - Giống hệt video 00:45!
    demo.edgePoints = [
      { edgeIndex: 4, t: 0.5, label: 'M' },
      { edgeIndex: 7, t: 0.5, label: 'N' },
      { edgeIndex: 8, t: 0.5, label: 'P' },
    ]
    const inv = 1 / Math.sqrt(3)
    demo.sliceNormal = { x: inv, y: inv, z: inv }
    demo.sliceHeight = 0
  }

  renderDemo3d(demo)
}

function onManualSlideHeight(demo) {
  demo.slicePreset = 'custom'
  // Khi kéo thanh trượt mặt phẳng, ẩn 3 điểm cố định cũ để hiển thị các đỉnh giao tuyến mới
  demo.edgePoints = []
  renderDemo3d(demo)
}

/** Tìm tất cả các giao điểm của mặt phẳng n·X = d với các cạnh của khối 3D và sắp xếp thành đa giác lồi */
function computePlaneCrossSection(geom, normal, d) {
  const len = Math.hypot(normal.x, normal.y, normal.z) || 1
  const nx = normal.x / len
  const ny = normal.y / len
  const nz = normal.z / len

  const rawPts = []
  geom.edges.forEach(([i1, i2], edgeIdx) => {
    const v1 = geom.vertices[i1]
    const v2 = geom.vertices[i2]
    const d1 = nx * v1.x + ny * v1.y + nz * v1.z - d
    const d2 = nx * v2.x + ny * v2.y + nz * v2.z - d

    if (Math.abs(d1) < 1e-5 && Math.abs(d2) < 1e-5) return
    if (d1 * d2 <= 1e-7) {
      const denom = d1 - d2
      if (Math.abs(denom) < 1e-7) return
      const t = Math.max(0, Math.min(1, d1 / denom))
      const pt = {
        x: v1.x + (v2.x - v1.x) * t,
        y: v1.y + (v2.y - v1.y) * t,
        z: v1.z + (v2.z - v1.z) * t,
        edgeIndex: edgeIdx,
        t,
      }
      // Tránh trùng lặp giao điểm tại đỉnh
      const dup = rawPts.some(
        (p) => Math.hypot(p.x - pt.x, p.y - pt.y, p.z - pt.z) < 0.03,
      )
      if (!dup) rawPts.push(pt)
    }
  })

  if (rawPts.length < 3) return { points3d: [], local2d: [], anglesDeg: [], sideLengths: [] }

  // Trọng tâm 3D của thiết diện
  let cx = 0
  let cy = 0
  let cz = 0
  rawPts.forEach((p) => {
    cx += p.x
    cy += p.y
    cz += p.z
  })
  cx /= rawPts.length
  cy /= rawPts.length
  cz /= rawPts.length

  // Xây dựng hệ cơ sở trực chuẩn (u, v) trên mặt phẳng thiết diện để bảo toàn 100% góc và độ dài thật!
  let ref = { x: 0, y: 1, z: 0 }
  if (Math.abs(nx * ref.x + ny * ref.y + nz * ref.z) > 0.9) {
    ref = { x: 1, y: 0, z: 0 }
  }
  let ux = ny * ref.z - nz * ref.y
  let uy = nz * ref.x - nx * ref.z
  let uz = nx * ref.y - ny * ref.x
  const uLen = Math.hypot(ux, uy, uz) || 1
  ux /= uLen
  uy /= uLen
  uz /= uLen

  const vx = ny * uz - nz * uy
  const vy = nz * ux - nx * uz
  const vz = nx * uy - ny * ux

  const withAngles = rawPts.map((p) => {
    const dx = p.x - cx
    const dy = p.y - cy
    const dz = p.z - cz
    const lx = dx * ux + dy * uy + dz * uz
    const ly = dx * vx + dy * vy + dz * vz
    return {
      ...p,
      lx,
      ly,
      polar: Math.atan2(ly, lx),
    }
  })

  withAngles.sort((a, b) => a.polar - b.polar)

  // Tính số đo góc trong chính xác tại mỗi đỉnh (độ) và độ dài cạnh
  const m = withAngles.length
  const anglesDeg = []
  const sideLengths = []

  for (let i = 0; i < m; i += 1) {
    const prev = withAngles[(i - 1 + m) % m]
    const curr = withAngles[i]
    const next = withAngles[(i + 1) % m]

    const ax = prev.lx - curr.lx
    const ay = prev.ly - curr.ly
    const bx = next.lx - curr.lx
    const by = next.ly - curr.ly
    const la = Math.hypot(ax, ay) || 1
    const lb = Math.hypot(bx, by) || 1
    const cos = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))
    const deg = Math.round((Math.acos(cos) * 180) / Math.PI)
    anglesDeg.push(deg)
    sideLengths.push(lb / 2) // Quy về cạnh hình lập phương a = 1 (vì [-1, 1] có độ dài 2)
  }

  return {
    points3d: withAngles,
    centroid3d: { x: cx, y: cy, z: cz },
    normalUnit: { x: nx, y: ny, z: nz },
    anglesDeg,
    sideLengths,
  }
}

// ==================== TƯƠNG TÁC CHUỘT / BÚT TRÊN KHỐI 3D (Video 00:33 - 00:46) ====================
function findNearestProjectedEdge(demo, mx, my, w, h) {
  const geom = getModelGeometry(demo.model, demo)
  const cx = w * 0.5
  const cy = h * 0.5
  const scale = Math.min(w, h) * 0.29

  let best = null
  let bestDist = 22

  geom.edges.forEach(([i1, i2], edgeIndex) => {
    const p1 = project3d(geom.vertices[i1], demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)
    const p2 = project3d(geom.vertices[i2], demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-4) return
    let t = ((mx - p1.x) * dx + (my - p1.y) * dy) / len2
    t = Math.max(0.06, Math.min(0.94, t))
    const px = p1.x + t * dx
    const py = p1.y + t * dy
    const d = Math.hypot(mx - px, my - py)

    if (d < bestDist) {
      bestDist = d
      let snapT = t
      let isMid = false
      if (Math.abs(t - 0.5) < 0.085) {
        snapT = 0.5
        isMid = true
      }
      best = {
        edgeIndex,
        t: snapT,
        px: p1.x + snapT * dx,
        py: p1.y + snapT * dy,
        isMid,
      }
    }
  })

  return best
}

function on3dPointerDown(demo, e) {
  const canvas = canvasMap.get(demo.id)
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const w = canvas.clientWidth || demo.width
  const h = canvas.clientHeight || demo.height
  const cx = w * 0.5
  const cy = h * 0.5
  const scale = Math.min(w, h) * 0.29
  const geom = getModelGeometry(demo.model, demo)

  // 1. Kiểm tra xem người dùng có bấm vào tay nắm Mũi Tên Trục Đỏ không (00:44 - 00:46)
  if (demo.slicingActive) {
    const len = Math.hypot(demo.sliceNormal.x, demo.sliceNormal.y, demo.sliceNormal.z) || 1
    const nx = demo.sliceNormal.x / len
    const ny = demo.sliceNormal.y / len
    const nz = demo.sliceNormal.z / len
    const handle3d = {
      x: nx * demo.sliceHeight,
      y: ny * demo.sliceHeight,
      z: nz * demo.sliceHeight,
    }
    const hp = project3d(handle3d, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)
    const tip3d = { x: nx * 1.25, y: ny * 1.25, z: nz * 1.25 }
    const tp = project3d(tip3d, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)

    if (Math.hypot(mx - hp.x, my - hp.y) < 20 || Math.hypot(mx - tp.x, my - tp.y) < 20 || demo.interactionMode === 'axis_slide') {
      activePointerState = {
        type: 'slide_axis',
        demo,
        startX: e.clientX,
        startY: e.clientY,
        origHeight: demo.sliceHeight,
        axisScreenDx: tp.x - cx,
        axisScreenDy: tp.y - cy,
      }
      canvas.setPointerCapture?.(e.pointerId)
      return
    }
  }

  // 2. Kiểm tra xem người dùng có bấm vào 1 trong các điểm xanh đã đặt trên cạnh để kéo trượt không (00:38 - 00:41)
  if (demo.edgePoints && demo.edgePoints.length) {
    for (let i = 0; i < demo.edgePoints.length; i += 1) {
      const ep = demo.edgePoints[i]
      const pt3d = getEdgePoint3d(geom, ep.edgeIndex, ep.t)
      const proj = project3d(pt3d, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)
      if (Math.hypot(mx - proj.x, my - proj.y) < 18) {
        activePointerState = {
          type: 'drag_edge_point',
          demo,
          pointIndex: i,
        }
        canvas.setPointerCapture?.(e.pointerId)
        return
      }
    }
  }

  // 3. Nếu đang ở chế độ chấm điểm trên cạnh và click gần 1 cạnh của khối 3D (00:33 - 00:35)
  if (demo.interactionMode === 'point_slice') {
    const snap = findNearestProjectedEdge(demo, mx, my, w, h)
    if (snap) {
      if (!demo.edgePoints) demo.edgePoints = []
      const labels = ['M', 'N', 'P', 'Q', 'R', 'S']
      // Nếu đã đủ 3 điểm mà chấm tiếp trên cạnh mới -> bắt đầu bộ 3 điểm mới hoặc thay điểm thứ 3
      if (demo.edgePoints.length >= 3) {
        demo.edgePoints = []
        demo.slicingActive = false
      }
      // Không chấm trùng trên cùng 1 cạnh nếu chưa đủ 3 điểm
      const existingOnEdge = demo.edgePoints.findIndex((p) => p.edgeIndex === snap.edgeIndex)
      if (existingOnEdge >= 0) {
        demo.edgePoints[existingOnEdge].t = snap.t
      } else {
        demo.edgePoints.push({
          edgeIndex: snap.edgeIndex,
          t: snap.t,
          label: labels[demo.edgePoints.length] || 'P',
        })
      }

      if (demo.edgePoints.length === 3) {
        computePlaneFrom3EdgePoints(demo)
      }
      renderDemo3d(demo)
      return
    }
  }

  // 4. Nếu click vào khoảng trống quanh khối 3D -> Xoay 3D 360 độ mượt mà!
  activePointerState = {
    type: 'rotate_3d',
    demo,
    startX: e.clientX,
    startY: e.clientY,
    origYaw: demo.yaw,
    origPitch: demo.pitch,
  }
  canvas.setPointerCapture?.(e.pointerId)
}

function on3dPointerMove(demo, e) {
  const canvas = canvasMap.get(demo.id)
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const w = canvas.clientWidth || demo.width
  const h = canvas.clientHeight || demo.height

  if (activePointerState && activePointerState.demo.id === demo.id) {
    const st = activePointerState
    if (st.type === 'rotate_3d') {
      const dx = e.clientX - st.startX
      const dy = e.clientY - st.startY
      demo.yaw = st.origYaw + dx * 0.011
      demo.pitch = Math.max(-1.35, Math.min(1.35, st.origPitch + dy * 0.011))
      renderDemo3d(demo)
      return
    }

    if (st.type === 'drag_edge_point') {
      const snap = findNearestProjectedEdge(demo, mx, my, w, h)
      if (snap) {
        demo.edgePoints[st.pointIndex].edgeIndex = snap.edgeIndex
        demo.edgePoints[st.pointIndex].t = snap.t
        if (demo.edgePoints.length >= 3) {
          computePlaneFrom3EdgePoints(demo)
        }
        renderDemo3d(demo)
      }
      return
    }

    if (st.type === 'slide_axis') {
      const dx = e.clientX - st.startX
      const dy = e.clientY - st.startY
      const axLen = Math.hypot(st.axisScreenDx, st.axisScreenDy) || 1
      const projDelta = (dx * st.axisScreenDx + dy * st.axisScreenDy) / (axLen * 95)
      demo.sliceHeight = Math.max(-1.18, Math.min(1.18, st.origHeight + projDelta))
      demo.slicePreset = 'custom'
      demo.edgePoints = []
      renderDemo3d(demo)
      return
    }
  }

  // Hover preview điểm bắt dính trên cạnh (chỉ vẽ lại khi vị trí bắt dính thực sự thay đổi)
  if (demo.interactionMode === 'point_slice') {
    const snap = findNearestProjectedEdge(demo, mx, my, w, h)
    const prev = hoverEdgeMap.get(demo.id)
    const changed =
      Boolean(prev) !== Boolean(snap) ||
      (prev && snap && (prev.edgeIndex !== snap.edgeIndex || Math.abs(prev.t - snap.t) > 0.008))
    if (changed) {
      hoverEdgeMap.set(demo.id, snap)
      renderDemo3d(demo)
    }
  }
}

function on3dPointerUp(demo, e) {
  const canvas = canvasMap.get(demo.id)
  if (canvas) canvas.releasePointerCapture?.(e.pointerId)
  if (activePointerState && activePointerState.demo?.id === demo.id) {
    activePointerState = null
  }
}

function on3dPointerLeave(demo) {
  if (hoverEdgeMap.get(demo.id)) {
    hoverEdgeMap.delete(demo.id)
    renderDemo3d(demo)
  }
}

function on3dWheel(demo, e) {
  const delta = e.deltaY > 0 ? -0.07 : 0.07
  demo.zoom = Math.max(0.65, Math.min(1.55, (demo.zoom || 1) + delta))
  renderDemo3d(demo)
}

// ==================== VẼ KHỐI 3D TRỰC TIẾP LÊN BẢNG & HÌNH CHIẾU 2D BÊN TRÁI ====================
function renderDemo3d(demo) {
  const canvas = canvasMap.get(demo.id)
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const w = Number.isFinite(demo.width) && demo.width >= 240 ? Math.round(demo.width) : 420
  const h = Number.isFinite(demo.height) && demo.height >= 220 ? Math.round(demo.height) : 360
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const cx = w * 0.5
  const cy = h * 0.52
  const scale = Math.min(w, h) * 0.29
  const geom = getModelGeometry(demo.model, demo)

  // Chiếu toàn bộ các đỉnh 3D
  const projVerts = geom.vertices.map((v) =>
    project3d(v, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale),
  )

  // Xác định mặt nào hướng về phía người nhìn để phân biệt cạnh nhìn thấy (nét liền) và cạnh khuất (nét đứt)
  const edgeFrontCount = new Array(geom.edges.length).fill(0)
  geom.faces.forEach((face) => {
    const rn = rotatePoint3d(
      { x: face.normal[0], y: face.normal[1], z: face.normal[2] },
      demo.yaw,
      demo.pitch,
    )
    if (rn.z < 0.08) {
      const fv = face.verts
      for (let i = 0; i < fv.length; i += 1) {
        const u = fv[i]
        const v = fv[(i + 1) % fv.length]
        const eIdx = geom.edges.findIndex(
          ([a, b]) => (a === u && b === v) || (a === v && b === u),
        )
        if (eIdx >= 0) edgeFrontCount[eIdx] += 1
      }
    }
  })

  // 1. Vẽ các cạnh khuất phía sau trước (nét đứt trắng mờ như phấn trên bảng)
  geom.edges.forEach(([i1, i2], idx) => {
    if (edgeFrontCount[idx] > 0) return
    const p1 = projVerts[i1]
    const p2 = projVerts[i2]
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([6, 5])
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.52)'
    ctx.lineWidth = 1.8
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
    ctx.restore()
  })

  // 2. Tính & Vẽ MẶT PHẲNG THIẾT DIỆN MÀU XANH DƯƠNG TRONG SUỐT (Giống hệt video 00:35 - 00:46!)
  let sectionData = null
  if (demo.slicingActive) {
    sectionData = computePlaneCrossSection(geom, demo.sliceNormal, demo.sliceHeight)
    const pts3d = sectionData.points3d
    if (pts3d.length >= 3) {
      const poly2d = pts3d.map((p) =>
        project3d(p, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale),
      )

      // Tô mặt thiết diện màu xanh dương sáng trong suốt
      ctx.save()
      ctx.beginPath()
      poly2d.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, cy - scale, 0, cy + scale)
      grad.addColorStop(0, 'rgba(37, 99, 235, 0.58)')
      grad.addColorStop(1, 'rgba(29, 78, 216, 0.42)')
      ctx.fillStyle = grad
      ctx.fill()

      // Viền giao tuyến của thiết diện
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 2.6
      ctx.stroke()
      ctx.restore()

      // Vẽ các chấm tròn trắng/xanh tại các đỉnh giao tuyến của thiết diện
      poly2d.forEach((p) => {
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = '#2563eb'
        ctx.stroke()
        ctx.restore()
      })

      // 3. VẼ TRỤC PHÁP TUYẾN MÀU ĐỎ CÓ MŨI TÊN KÉO TRƯỢT (Giống hệt video 00:44 - 00:46!)
      const nu = sectionData.normalUnit
      const axisStart = project3d(
        { x: -nu.x * 1.15, y: -nu.y * 1.15, z: -nu.z * 1.15 },
        demo.yaw,
        demo.pitch,
        demo.zoom,
        cx,
        cy,
        scale,
      )
      const axisEnd = project3d(
        { x: nu.x * 1.25, y: nu.y * 1.25, z: nu.z * 1.25 },
        demo.yaw,
        demo.pitch,
        demo.zoom,
        cx,
        cy,
        scale,
      )
      const planeCenterProj = project3d(
        { x: nu.x * demo.sliceHeight, y: nu.y * demo.sliceHeight, z: nu.z * demo.sliceHeight },
        demo.yaw,
        demo.pitch,
        demo.zoom,
        cx,
        cy,
        scale,
      )

      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2.4
      ctx.moveTo(axisStart.x, axisStart.y)
      ctx.lineTo(axisEnd.x, axisEnd.y)
      ctx.stroke()

      // Đầu mũi tên đỏ
      const ang = Math.atan2(axisEnd.y - axisStart.y, axisEnd.x - axisStart.x)
      ctx.beginPath()
      ctx.fillStyle = '#ef4444'
      ctx.moveTo(axisEnd.x, axisEnd.y)
      ctx.lineTo(axisEnd.x - 10 * Math.cos(ang - 0.4), axisEnd.y - 10 * Math.sin(ang - 0.4))
      ctx.lineTo(axisEnd.x - 10 * Math.cos(ang + 0.4), axisEnd.y - 10 * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()

      // Nút tròn đỏ trên mặt phẳng cắt để kéo trượt dọc trục
      ctx.beginPath()
      ctx.arc(planeCenterProj.x, planeCenterProj.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.restore()

      // Cập nhật thông tin tên đa giác thiết diện (chỉ gán khi giá trị thay đổi để tránh vòng lặp reactive!)
      const nEdges = pts3d.length
      const names = {
        3: 'Tam giác (3 cạnh)',
        4: 'Tứ giác (4 cạnh)',
        5: 'Ngũ giác (5 cạnh)',
        6: 'Lục giác đều (6 cạnh)',
      }
      const uniqueAngles = [...new Set(sectionData.anglesDeg)]
      const newPolyName = names[nEdges] || `Đa giác ${nEdges} cạnh`
      const newAngleDeg =
        uniqueAngles.length === 1 ? `${uniqueAngles[0]}°` : `${sectionData.anglesDeg[0]}°`
      if (demo.cutInfo) {
        if (demo.cutInfo.polygonName !== newPolyName) demo.cutInfo.polygonName = newPolyName
        if (demo.cutInfo.edgesCount !== nEdges) demo.cutInfo.edgesCount = nEdges
        if (demo.cutInfo.angleDeg !== newAngleDeg) demo.cutInfo.angleDeg = newAngleDeg
      }
    }
  } else if (demo.edgePoints && demo.edgePoints.length === 2) {
    // Khi mới chấm 2 điểm trên cạnh: vẽ đoạn nối tạm màu xanh dương giữa 2 điểm đó
    const p1 = project3d(
      getEdgePoint3d(geom, demo.edgePoints[0].edgeIndex, demo.edgePoints[0].t),
      demo.yaw,
      demo.pitch,
      demo.zoom,
      cx,
      cy,
      scale,
    )
    const p2 = project3d(
      getEdgePoint3d(geom, demo.edgePoints[1].edgeIndex, demo.edgePoints[1].t),
      demo.yaw,
      demo.pitch,
      demo.zoom,
      cx,
      cy,
      scale,
    )
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.2
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
    ctx.restore()
  }

  // 4. Vẽ các cạnh nhìn thấy phía trước (nét liền trắng sáng rõ nét như phấn bảng)
  geom.edges.forEach(([i1, i2], idx) => {
    if (edgeFrontCount[idx] === 0) return
    const p1 = projVerts[i1]
    const p2 = projVerts[i2]
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = '#f8fafc'
    ctx.lineWidth = 2.3
    ctx.lineCap = 'round'
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
    ctx.restore()
  })

  // 5. Vẽ các điểm xanh do giáo viên chấm lên cạnh (Giống hệt giây 00:33 - 00:35)
  if (demo.edgePoints && demo.edgePoints.length) {
    demo.edgePoints.forEach((ep) => {
      const pt3d = getEdgePoint3d(geom, ep.edgeIndex, ep.t)
      const proj = project3d(pt3d, demo.yaw, demo.pitch, demo.zoom, cx, cy, scale)
      ctx.save()
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      ctx.lineWidth = 2.2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.restore()
    })
  }

  // 6. Vẽ điểm preview bắt dính khi di bút/chuột gần cạnh
  const hoverSnap = hoverEdgeMap.get(demo.id)
  if (hoverSnap && demo.interactionMode === 'point_slice') {
    ctx.save()
    ctx.beginPath()
    ctx.arc(hoverSnap.px, hoverSnap.py, 7.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.38)'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#60a5fa'
    ctx.stroke()
    if (hoverSnap.isMid) {
      ctx.font = '700 11px system-ui, sans-serif'
      ctx.fillStyle = '#93c5fd'
      ctx.fillText('Trung điểm', hoverSnap.px + 10, hoverSnap.py - 8)
    }
    ctx.restore()
  }

  ctx.restore()

  // 7. VẼ HÌNH PHẲNG 2D CỦA THIẾT DIỆN SANG BÊN TRÁI TRÊN NỀN BẢNG (Giống hệt video 00:40 - 00:46!)
  if (demo.slicingActive && demo.showCrossSection2d && sectionData) {
    renderCrossSection2dBoard(demo, sectionData)
  }
}

/**
 * Vẽ đa giác phẳng 2D thật của thiết diện bên trái khối lập phương kèm số đo góc (120°, 60°...)
 * giống hệt giây 00:40 - 00:46 trong video!
 */
function renderCrossSection2dBoard(demo, sectionData) {
  const c2 = cross2dMap.get(demo.id)
  if (!c2) return
  const dpr = window.devicePixelRatio || 1
  const size = 210
  if (c2.width !== Math.round(size * dpr) || c2.height !== Math.round(size * dpr)) {
    c2.width = Math.round(size * dpr)
    c2.height = Math.round(size * dpr)
  }
  const ctx = c2.getContext('2d')
  if (!ctx) return
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, size, size)

  const pts = sectionData.points3d
  if (!pts || pts.length < 3) {
    ctx.restore()
    return
  }

  // Tìm bán kính lớn nhất trong hệ tọa độ phẳng trực chuẩn (lx, ly) để căn tỷ lệ đẹp
  let maxR = 0.01
  pts.forEach((p) => {
    const r = Math.hypot(p.lx, p.ly)
    if (r > maxR) maxR = r
  })
  const scale2d = Math.min(66, 62 / Math.max(0.65, maxR))
  const cx = size * 0.5
  const cy = size * 0.5

  const screenPts = pts.map((p) => ({
    x: cx + p.lx * scale2d,
    y: cy - p.ly * scale2d,
  }))

  // Tô màu xanh dương giống hệt mặt cắt bên trong khối 3D
  ctx.beginPath()
  screenPts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgba(37, 99, 235, 0.52)'
  ctx.fill()
  ctx.strokeStyle = '#93c5fd'
  ctx.lineWidth = 2.2
  ctx.stroke()

  // Vẽ cung góc và ghi số đo độ (ví dụ 120°, 60°, 90°) tại từng đỉnh (Giống hệt video 00:40 - 00:46!)
  const m = screenPts.length
  for (let i = 0; i < m; i += 1) {
    const curr = screenPts[i]
    const prev = screenPts[(i - 1 + m) % m]
    const next = screenPts[(i + 1) % m]

    // Chấm đỉnh trắng viền xanh
    ctx.beginPath()
    ctx.arc(curr.x, curr.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1.8
    ctx.stroke()

    // Hướng đẩy chữ số đo góc ra phía ngoài đỉnh
    const vx = curr.x - cx
    const vy = curr.y - cy
    const vLen = Math.hypot(vx, vy) || 1
    const tx = curr.x + (vx / vLen) * 20
    const ty = curr.y + (vy / vLen) * 20

    const deg = sectionData.anglesDeg[i]
    ctx.font = '700 11px system-ui, sans-serif'
    ctx.fillStyle = '#60a5fa'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${deg}°`, tx, ty)

    // Ghi độ dài cạnh ở điểm giữa cạnh
    const mxEdge = (curr.x + next.x) / 2
    const myEdge = (curr.y + next.y) / 2
    const ex = mxEdge - cx
    const ey = myEdge - cy
    const eLen = Math.hypot(ex, ey) || 1
    const sideVal = sectionData.sideLengths[i]
    if (sideVal) {
      ctx.font = '600 9.5px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
      ctx.fillText(
        sideVal.toFixed(2),
        mxEdge + (ex / eLen) * 12,
        myEdge + (ey / eLen) * 12,
      )
    }
  }

  ctx.restore()
}

// ==================== VẼ ĐỒ THỊ HÀM SỐ 2D TRÊN BẢNG (Video 00:16 - 00:23) ====================
function evalMathFormula(expr, x, A = 1, B = 0) {
  try {
    let clean = String(expr || '').trim()
    if (!clean) return NaN
    // Chuyển lũy thừa sang Math.pow để tránh lỗi SyntaxError do unary minus
    clean = clean
      .replace(/([a-zA-Z0-9_().]+)\s*\^\s*([0-9.]+)/g, 'Math.pow($1, $2)')
      .replace(/\^/g, '**')
      .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
      .replace(/\bA\s*sin/g, 'A*sin')
      .replace(/\bB\s*cos/g, 'B*cos')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E')
    const fn = new Function('x', 'A', 'B', `return (${clean});`)
    const val = fn(x, A, B)
    return Number.isFinite(val) ? val : NaN
  } catch {
    return NaN
  }
}

function renderDemoGraph(demo) {
  const canvas = canvasMap.get(demo.id)
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const w = Number.isFinite(demo.width) && demo.width >= 240 ? Math.round(demo.width) : 420
  const h = Number.isFinite(demo.height) && demo.height >= 220 ? Math.round(demo.height) : 360
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.save()
  ctx.scale(dpr, dpr)

  // Nền bảng đen có lưới tọa độ chuẩn giống hệt video (00:16 - 00:22)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
  ctx.fillRect(0, 0, w, h)

  const ox = w * 0.5
  const oy = h * 0.5
  const unit = Math.min(w, h) / 10.5 // Hiển thị từ -5 đến +5

  // Vẽ lưới tọa độ nhỏ và lớn
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i += 1) {
    const gx = ox + i * unit
    const gy = oy - i * unit
    ctx.strokeStyle = i === 0 ? 'rgba(248, 250, 252, 0.75)' : 'rgba(148, 163, 184, 0.16)'
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, h)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(w, gy)
    ctx.stroke()

    if (i !== 0 && i % 2 === 0 && gx > 14 && gx < w - 14) {
      ctx.font = '500 10px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(203, 213, 225, 0.8)'
      ctx.textAlign = 'center'
      ctx.fillText(String(i), gx, oy + 13)
    }
    if (i !== 0 && i % 2 === 0 && gy > 14 && gy < h - 14) {
      ctx.font = '500 10px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(203, 213, 225, 0.8)'
      ctx.textAlign = 'right'
      ctx.fillText(String(i), ox - 5, gy + 3)
    }
  }

  const A = demo.graphParams?.A ?? 1.5
  const B = demo.graphParams?.B ?? 0
  const f1Expr = String(demo.customFormulas?.f1 || '').trim()
  const f2Expr = String(demo.customFormulas?.f2 || '').trim()

  // Nếu cả 2 công thức đều rỗng, vẽ dòng chữ hướng dẫn thay vì vẽ hình mặc định
  if (!f1Expr && !f2Expr) {
    ctx.save()
    ctx.font = '500 12px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)'
    ctx.textAlign = 'center'
    ctx.fillText('Chưa có công thức • Nhập hàm số ở ô bên dưới hoặc khoanh vùng công thức trên bảng', ox, oy + 42)
    ctx.restore()
  }

  // 1. Vẽ đường cong thứ nhất (f1) theo đúng công thức nhận diện được
  if (f1Expr) {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2.4
    let started1 = false
    for (let px = 0; px <= w; px += 2) {
      const x = (px - ox) / unit
      const y = evalMathFormula(f1Expr, x, A, B)
      if (Number.isFinite(y)) {
        const py = oy - y * unit
        if (py >= -60 && py <= h + 60) {
          if (!started1) {
            ctx.moveTo(px, py)
            started1 = true
          } else {
            ctx.lineTo(px, py)
          }
        } else {
          started1 = false
        }
      } else {
        started1 = false
      }
    }
    ctx.stroke()
    ctx.restore()
  }

  // 2. Vẽ đường cong thứ hai (f2) nếu có
  if (f2Expr) {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.4
    let started2 = false
    let prevDiff = null
    const intersections = []

    for (let px = 0; px <= w; px += 2) {
      const x = (px - ox) / unit
      const y2 = evalMathFormula(f2Expr, x, A, B)
      const y1 = f1Expr ? evalMathFormula(f1Expr, x, A, B) : NaN
      if (Number.isFinite(y2)) {
        const py = oy - y2 * unit
        if (py >= -60 && py <= h + 60) {
          if (!started2) {
            ctx.moveTo(px, py)
            started2 = true
          } else {
            ctx.lineTo(px, py)
          }
        } else {
          started2 = false
        }
      } else {
        started2 = false
      }

      // Tìm giao điểm giữa 2 đồ thị nếu cả 2 cùng vẽ
      if (Number.isFinite(y1) && Number.isFinite(y2)) {
        const diff = y1 - y2
        if (prevDiff !== null && prevDiff * diff <= 0 && Math.abs(diff - prevDiff) < 2) {
          intersections.push({
            px,
            py: oy - ((y1 + y2) / 2) * unit,
          })
        }
        prevDiff = diff
      }
    }
    ctx.stroke()
    ctx.restore()

    // 3. Chấm các giao điểm màu vàng sáng
    intersections.forEach((pt) => {
      if (pt.py >= 6 && pt.py <= h - 6) {
        ctx.beginPath()
        ctx.arc(pt.px, pt.py, 4.2, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      }
    })
  }

  ctx.restore()
}

let rafId = null

function redrawAll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    demosList.value.forEach((demo) => {
      if (demo.type === '3d') renderDemo3d(demo)
      else renderDemoGraph(demo)
    })
  })
}

watch(
  () => demosList.value.length,
  () => {
    nextTick(redrawAll)
  },
)

onMounted(() => {
  redrawAll()
  window.addEventListener('resize', redrawAll)
})

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', redrawAll)
  window.removeEventListener('pointermove', onGlobalPointerMove)
  window.removeEventListener('pointerup', onGlobalPointerUp)
})
</script>

<style scoped>
.board-demos-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
  overflow: visible;
}

.inplace-board-object {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  min-width: 320px;
  min-height: 280px;
  box-sizing: border-box;
}

/* KHUNG CHỌN TRẮNG 8 ĐIỂM NEO VUÔNG */
.white-selection-frame {
  position: absolute;
  inset: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.88);
  pointer-events: none;
  z-index: 3;
}

.frame-edge {
  position: absolute;
  pointer-events: auto;
  cursor: grab;
  z-index: 4;
}
.frame-edge:active {
  cursor: grabbing;
}
.edge-t { top: -6px; left: 0; right: 0; height: 12px; cursor: move; }
.edge-b { bottom: -6px; left: 0; right: 0; height: 12px; cursor: move; }
.edge-l { left: -6px; top: 0; bottom: 0; width: 12px; cursor: move; }
.edge-r { right: -6px; top: 0; bottom: 0; width: 12px; cursor: move; }

.sq-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border: 1px solid #0f172a;
  pointer-events: auto;
  z-index: 5;
}

.sq-tl { left: -4px; top: -4px; cursor: nwse-resize; }
.sq-tc { left: calc(50% - 4px); top: -4px; cursor: ns-resize; }
.sq-tr { right: -4px; top: -4px; cursor: nesw-resize; }
.sq-mr { right: -4px; top: calc(50% - 4px); cursor: ew-resize; }
.sq-br { right: -4px; bottom: -4px; cursor: nwse-resize; }
.sq-bc { left: calc(50% - 4px); bottom: -4px; cursor: ns-resize; }
.sq-bl { left: -4px; bottom: -4px; cursor: nesw-resize; }
.sq-ml { left: -4px; top: calc(50% - 4px); cursor: ew-resize; }

/* CANVAS 3D TRỰC TIẾP TRÊN NỀN BẢNG ĐEN */
.inplace-3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: transparent;
}

.cursor-crosshair { cursor: crosshair; }
.cursor-ns { cursor: ns-resize; }
.cursor-grab { cursor: grab; }
.cursor-grab:active { cursor: grabbing; }

.inplace-3d-hint {
  position: absolute;
  top: 6px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.85);
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 4;
}

.inplace-3d-hint.is-draggable {
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.inplace-3d-hint.is-draggable:hover {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(96, 165, 250, 0.45);
}
.inplace-3d-hint.is-draggable:active {
  cursor: grabbing;
}
.hint-grip-icon {
  opacity: 0.7;
  flex-shrink: 0;
  color: #94a3b8;
}

.model-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  background: rgba(14, 165, 233, 0.22);
  border: 1px solid rgba(56, 189, 248, 0.55);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  flex-shrink: 0;
  letter-spacing: 0.2px;
}

.hint-dot-blue {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 6px #60a5fa;
  flex-shrink: 0;
}

.hint-dot-red {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px #f87171;
  flex-shrink: 0;
}

/* HÌNH CHIẾU PHẲNG 2D BÊN TRÁI KHỐI 3D TRÊN NỀN BẢNG */
.cross-section-2d-projection {
  position: absolute;
  right: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%);
  width: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 6;
}

.cross-section-2d-projection.is-draggable {
  pointer-events: auto;
  cursor: grab;
  user-select: none;
}
.cross-section-2d-projection.is-draggable:active {
  cursor: grabbing;
}

.cross-2d-board-canvas {
  width: 210px;
  height: 210px;
  display: block;
}

.cross-2d-caption {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(96, 165, 250, 0.45);
  font-size: 11px;
  color: #e2e8f0;
  cursor: grab;
}
.caption-grip {
  color: #60a5fa;
  opacity: 0.8;
  flex-shrink: 0;
}

.cross-2d-caption strong {
  color: #60a5fa;
}

/* THANH CÔNG CỤ NGANG MÀU TRẮNG NGAY BÊN DƯỚI KHUNG CHỌN (Video 00:32 - 00:46) */
.white-bottom-bar {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.48),
    0 0 0 1px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  z-index: 10;
  max-width: calc(100vw - 32px);
}

.wb-drag-grip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 5px;
  cursor: grab;
  color: #64748b;
  border-radius: 4px;
  transition: color 0.15s ease, background 0.15s ease;
}
.wb-drag-grip:hover {
  color: #0f172a;
  background: #f1f5f9;
}
.wb-drag-grip:active {
  cursor: grabbing;
}

.wb-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #334155;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.wb-dropdown-wrap {
  position: relative;
  display: inline-flex;
}

.wb-btn--model {
  width: auto;
  height: 32px;
  padding: 0 9px;
  gap: 5px;
  background: #f1f5f9;
  border-radius: 7px;
  color: #0f172a;
  font-weight: 700;
  font-size: 11.5px;
}
.wb-btn--model:hover {
  background: #e2e8f0;
  color: #0284c7;
}

.wb-model-label {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-model-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  z-index: 50;
  min-width: 250px;
}

.wb-model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  transition: all 0.14s ease;
}
.wb-model-item:hover {
  background: rgba(56, 189, 248, 0.2);
  color: #ffffff;
}
.wb-model-item.active {
  background: #0284c7;
  color: #ffffff;
  font-weight: 700;
}
.wb-model-item .m-icon {
  font-size: 14px;
}

.wb-btn:hover {
  background: #fff7ed;
  color: #2563eb;
}

.wb-btn.active {
  background: #ffedd5;
  color: #2563eb;
}

.wb-btn--icon {
  color: #64748b;
}

.wb-btn--icon:hover {
  background: #fee2e2;
  color: #dc2626;
}

.wb-sep {
  width: 1px;
  height: 18px;
  background: #e2e8f0;
  margin: 0 3px;
}

.wb-inline-slider {
  display: inline-flex;
  align-items: center;
  padding: 0 4px;
}

.wb-range {
  width: 68px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.wb-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.14s ease;
}

.wb-chip:hover {
  background: #fff7ed;
  border-color: #fdba74;
  color: #2563eb;
}

.wb-chip.active {
  background: #3b82f6;
  border-color: #2563eb;
  color: #ffffff;
}

.wb-green-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 32px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: #3b82f6;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
  transition: filter 0.14s ease;
}

.wb-green-btn:hover {
  filter: brightness(1.08);
}

.wb-dot-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 13px;
  height: 13px;
  padding: 0 3px;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

/* Tooltip hiển thị tên text nổi bật khi hover chuột vào từng icon */
.wb-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: #0f172a;
  color: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.14);
  z-index: 1000;
}

.wb-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #0f172a;
}

.wb-btn:hover .wb-tooltip,
.wb-chip:hover .wb-tooltip,
.wb-green-btn:hover .wb-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

/* THẺ GIÁO TRÌNH SGK MÀU TRẮNG BÊN TRÁI (Giống hệt video 00:59 - 01:08) */
.white-textbook-card {
  position: absolute;
  right: calc(100% + 22px);
  top: -10px;
  width: 310px;
  max-height: 410px;
  background: #ffffff;
  color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 25;
}

.wtc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.wtc-blue-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: #0284c7;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
}

.wtc-close {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 3px;
  border-radius: 6px;
}

.wtc-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.wtc-scroll-body {
  padding: 10px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wtc-intro {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: #475569;
}

.wtc-case-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.wtc-case-card:hover {
  border-color: #38bdf8;
  background: #f0f9ff;
}

.wtc-case-card.active {
  border-color: #0284c7;
  background: #e0f2fe;
}

.wtc-case-text h4 {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.wtc-case-text p {
  margin: 0;
  font-size: 11px;
  line-height: 1.42;
  color: #334155;
}

.wtc-diagram {
  width: 120px;
  height: 84px;
  align-self: center;
}

/* ĐỒ THỊ HÀM SỐ 2D & THANH TRƯỢT A, B TRONG GÓC TRÊN PHẢI (Video 00:16 - 00:23) */
.inplace-graph-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: move;
}

.graph-inline-sliders {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.3);
  z-index: 5;
}

.gis-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gis-label {
  font-size: 11px;
  font-weight: 700;
  color: #f8fafc;
  width: 14px;
}

.gis-range {
  width: 78px;
  accent-color: #38bdf8;
  cursor: pointer;
}

.gis-val {
  font-size: 10.5px;
  font-family: monospace;
  color: #93c5fd;
  width: 28px;
  text-align: right;
}

.wb-formula-lbl {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.wb-formula-lbl--red {
  color: #dc2626;
  background: #fef2f2;
}

.wb-formula-lbl--blue {
  color: #2563eb;
  background: #eff6ff;
}

.wb-formula-inp {
  width: 86px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 3px 6px;
  font-size: 11.5px;
  font-family: monospace;
  color: #0f172a;
  background: #ffffff;
}

.slide-left-fade-enter-active,
.slide-left-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-left-fade-enter-from,
.slide-left-fade-leave-to {
  opacity: 0;
  transform: translate(12px, -50%);
}
</style>

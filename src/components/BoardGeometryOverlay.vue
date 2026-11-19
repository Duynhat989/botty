<template>
  <div
    class="geometry-overlay"
    :class="{
      'has-active-tool': activeToolActive && !isPenOrEraser,
      'is-pen-active': isPenOrEraser,
    }"
  >
    <!-- SVG layer for rendering geometric shapes, edges, and points -->
    <svg
      ref="svgRef"
      class="geometry-svg"
      @pointermove="onSvgPointerMove"
      @pointerdown="onSvgPointerDown"
      @pointerup="onSvgPointerUp"
    >
      <defs>
        <!-- Glow filters for vertices and snapping -->
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- RENDER EACH GEOMETRIC SHAPE -->
      <g
        v-for="shape in shapesList"
        :key="shape.id"
        class="geom-shape-group"
        :class="{ 'is-selected': shape.id === selectedShapeId }"
        @pointerdown.stop="selectShape(shape.id)"
      >
        <!-- Circle if type is circle -->
        <circle
          v-if="shape.type === 'circle'"
          :cx="toPxX(shape.center.nx)"
          :cy="toPxY(shape.center.ny)"
          :r="shape.radius * canvasWidth"
          class="geom-edge geom-circle"
          :stroke="shape.color || '#f8fafc'"
        />

        <!-- Translucent fill polygon for 2D shapes -->
        <polygon
          v-if="shape.vertices && shape.vertices.length >= 3 && !shape.is3d"
          :points="polygonPointsAttr(shape.vertices)"
          class="geom-fill-polygon"
        />

        <!-- EDGES / SEGMENTS -->
        <g
          v-for="seg in allSegments(shape)"
          :key="seg.id"
          class="geom-edge-group"
          :class="{ 'is-selected-seg': seg.id === selectedSegmentId }"
          @pointerdown.stop="selectSegment(shape, seg)"
        >
          <!-- Hit area for easy clicking by teachers -->
          <line
            :x1="toPxX(getPoint(shape, seg.from)?.nx)"
            :y1="toPxY(getPoint(shape, seg.from)?.ny)"
            :x2="toPxX(getPoint(shape, seg.to)?.nx)"
            :y2="toPxY(getPoint(shape, seg.to)?.ny)"
            class="geom-edge-hitarea"
          />
          <line
            :x1="toPxX(getPoint(shape, seg.from)?.nx)"
            :y1="toPxY(getPoint(shape, seg.from)?.ny)"
            :x2="toPxX(getPoint(shape, seg.to)?.nx)"
            :y2="toPxY(getPoint(shape, seg.to)?.ny)"
            class="geom-edge"
            :class="{
              'geom-edge--dashed': seg.dashed,
              'geom-edge--custom': seg.isCustom,
              'geom-edge--active': seg.id === selectedSegmentId,
            }"
            :stroke="seg.color || (seg.dashed ? 'rgba(148, 163, 184, 0.75)' : shape.color || '#f8fafc')"
          />
          <!-- EQUAL TICKS MARKS (=) -->
          <path
            v-if="seg.equalTicks"
            :d="equalTicksPath(shape, seg)"
            class="geom-equal-ticks"
          />
          <!-- PARALLEL MARKS (//) -->
          <path
            v-if="seg.parallelMark"
            :d="parallelMarkPath(shape, seg)"
            class="geom-parallel-mark"
          />
        </g>

        <!-- RIGHT ANGLE MARKS -->
        <path
          v-for="ra in shape.rightAngles || []"
          :key="ra.id"
          :d="rightAnglePath(shape, ra)"
          class="geom-right-angle"
        />

        <!-- VERTICES (A, B, C, D...) -->
        <g
          v-for="v in shape.vertices"
          :key="v.id"
          class="geom-vertex"
          :class="{
            'is-connect-source': connectSourcePoint?.id === v.id,
          }"
          @pointerdown.stop="onVertexPointerDown(shape, v, $event)"
        >
          <circle
            :cx="toPxX(v.nx)"
            :cy="toPxY(v.ny)"
            r="6"
            class="vertex-dot"
          />
          <text
            :x="toPxX(v.nx) + labelOffset(shape, v).dx"
            :y="toPxY(v.ny) + labelOffset(shape, v).dy"
            class="vertex-label"
          >
            {{ v.label || v.id }}
          </text>
        </g>

        <!-- CUSTOM PLACED POINTS (M, N, P, Q, H...) -->
        <g
          v-for="cp in shape.customPoints || []"
          :key="cp.id"
          class="geom-custom-point"
          :class="{
            'is-connect-source': connectSourcePoint?.id === cp.id,
          }"
          @pointerdown.stop="onCustomPointPointerDown(shape, cp, $event)"
        >
          <circle
            :cx="toPxX(cp.nx)"
            :cy="toPxY(cp.ny)"
            r="6.5"
            class="custom-point-dot"
          />
          <text
            :x="toPxX(cp.nx) + 8"
            :y="toPxY(cp.ny) - 6"
            class="custom-point-label"
          >
            {{ cp.label || cp.id }}
          </text>
        </g>
      </g>

      <!-- SNAP PREVIEW INDICATOR (When placing points) -->
      <g v-if="hoverSnap && currentShape" class="snap-preview" pointer-events="none">
        <circle
          :cx="hoverSnap.x"
          :cy="hoverSnap.y"
          r="8"
          class="snap-circle-pulse"
        />
        <circle
          :cx="hoverSnap.x"
          :cy="hoverSnap.y"
          r="4.5"
          class="snap-circle-core"
        />
        <!-- Tooltip badge -->
        <g :transform="`translate(${hoverSnap.x + 12}, ${hoverSnap.y - 12})`">
          <rect
            x="0"
            y="-14"
            :width="snapLabelWidth(hoverSnap.label)"
            height="20"
            rx="5"
            class="snap-badge-bg"
          />
          <text x="7" y="0" class="snap-badge-text">
            {{ hoverSnap.label }}
          </text>
        </g>
      </g>

      <!-- CONNECTING LINE PREVIEW (When connect mode is active) -->
      <line
        v-if="connectSourcePoint && connectCurrentMouse"
        :x1="toPxX(connectSourcePoint.nx)"
        :y1="toPxY(connectSourcePoint.ny)"
        :x2="connectCurrentMouse.x"
        :y2="connectCurrentMouse.y"
        class="geom-edge geom-edge--preview"
        :class="{ 'geom-edge--dashed': connectLineDashed }"
      />

      <!-- DRAG CONSTRAINT GUIDE (Đường dẫn sáng khi kéo điểm trượt trên cạnh) -->
      <g v-if="activeDrag?.constraint" class="drag-constraint-guide" pointer-events="none">
        <line
          :x1="toPxX(activeDrag.constraint.from.nx)"
          :y1="toPxY(activeDrag.constraint.from.ny)"
          :x2="toPxX(activeDrag.constraint.to.nx)"
          :y2="toPxY(activeDrag.constraint.to.ny)"
          class="geom-edge-constraint-glow"
        />
        <!-- Tooltip khi điểm trượt / bắt dính trên cạnh -->
        <g
          v-if="activeDrag.snapLabel"
          :transform="`translate(${toPxX(activeDrag.point.nx) + 12}, ${toPxY(activeDrag.point.ny) - 14})`"
        >
          <rect
            x="0"
            y="-14"
            :width="snapLabelWidth(activeDrag.snapLabel)"
            height="20"
            rx="5"
            class="snap-badge-bg snap-badge-bg--active"
          />
          <text x="7" y="0" class="snap-badge-text">
            {{ activeDrag.snapLabel }}
          </text>
        </g>
      </g>
    </svg>

    <!-- FLOATING INTERACTION TOOLBAR ABOVE SELECTED SHAPE -->
    <transition name="fade-slide">
      <div
        v-if="currentShape && shapeToolbarPos"
        class="shape-floating-bar"
        :style="shapeToolbarPos"
        @pointerdown.stop
      >
        <div class="shape-title-chip">
          <span class="shape-name">{{ currentShape.name }}</span>
        </div>

        <div class="shape-tools">
          <!-- Button: Đặt điểm lên hình -->
          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentShape.activeTool === 'add_point' }"
            title="Đặt thêm điểm lên cạnh hoặc trong hình (Tự động bắt dính trung điểm, tỉ lệ)"
            @click="setShapeTool(currentShape, 'add_point')"
          >
            <MapPin :size="15" />
            <span>+ Đặt điểm</span>
          </button>

          <!-- Button: Nối đoạn thẳng -->
          <button
            type="button"
            class="tool-btn"
            :class="{ active: currentShape.activeTool === 'connect_line' }"
            title="Nối đoạn thẳng giữa 2 điểm (Click điểm 1 rồi click điểm 2)"
            @click="setShapeTool(currentShape, 'connect_line')"
          >
            <Ruler :size="15" />
            <span>Nối đoạn</span>
          </button>

          <!-- Toggle nét đứt (Dashed line) khi đang ở mode nối đoạn -->
          <button
            v-if="currentShape.activeTool === 'connect_line'"
            type="button"
            class="tool-btn tool-btn--toggle"
            :class="{ active: connectLineDashed }"
            title="Chuyển giữa Nét đứt (khuất/phụ) và Nét liền"
            @click="connectLineDashed = !connectLineDashed"
          >
            <span>{{ connectLineDashed ? 'Nét đứt' : 'Nét liền' }}</span>
          </button>

          <!-- Button: Vẽ tay lên hình (Pen tool) -->
          <button
            type="button"
            class="tool-btn"
            :class="{ active: board.writingTool === 'pen' }"
            title="Dùng bút vẽ tay tự do tiếp lên hình"
            @click="activatePenOnShape()"
          >
            <PenLine :size="15" />
            <span>Vẽ tay</span>
          </button>

          <!-- Button: Demo 3D tương tác (nếu là hình 3D hoặc muốn chuyển) -->
          <button
            v-if="currentShape.is3d || currentShape.type === 'cube_3d' || currentShape.type === 'pyramid_3d'"
            type="button"
            class="tool-btn tool-btn--3d"
            title="Chuyển thành mô hình 3D tương tác xoay 360° và mặt cắt"
            @click="convertToDemo3d(currentShape)"
          >
            <Box :size="15" />
            <span>Mô hình 3D</span>
          </button>

          <!-- Segment specific actions when a segment is selected -->
          <template v-if="selectedSegment">
            <span class="toolbar-sep" />
            <button
              type="button"
              class="tool-btn"
              :class="{ active: selectedSegment.dashed }"
              title="Đổi nét đứt (cạnh khuất/đường phụ) hoặc nét liền"
              @click="toggleSegmentDashed"
            >
              <span>{{ selectedSegment.dashed ? 'Nét đứt' : 'Nét liền' }}</span>
            </button>
            <button
              type="button"
              class="tool-btn"
              :class="{ active: (selectedSegment.equalTicks || 0) > 0 }"
              title="Quy ước hai đoạn bằng nhau: Đánh dấu vạch bằng nhau (=)"
              @click="cycleEqualTicks"
            >
              <span>{{ selectedSegment.equalTicks ? `${selectedSegment.equalTicks} vạch =` : '+ Vạch =' }}</span>
            </button>
            <button
              type="button"
              class="tool-btn"
              :class="{ active: (selectedSegment.parallelMark || 0) > 0 }"
              title="Quy ước hai đường song song: Đánh dấu mũi tên song song (//)"
              @click="cycleParallelMark"
            >
              <span>{{ selectedSegment.parallelMark ? `${selectedSegment.parallelMark} mũi tên ∥` : '+ Ký hiệu ∥' }}</span>
            </button>
          </template>

          <span class="toolbar-sep" />

          <!-- Button: Xóa hình -->
          <button
            type="button"
            class="tool-btn tool-btn--del"
            title="Xóa đối tượng hình học này"
            @click="removeShape(currentShape.id)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import {
  Box,
  MapPin,
  PenLine,
  Ruler,
  Trash2,
} from '@lucide/vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardGeometryOverlay requires WRITING_BOARD_KEY')

const svgRef = ref(null)
const selectedShapeId = ref(null)
const selectedSegmentId = ref(null)
const connectSourcePoint = ref(null)
const connectCurrentMouse = ref(null)
const connectLineDashed = ref(false)
const hoverSnap = ref(null)
const activeDrag = ref(null)

const shapesList = computed(() => {
  const s = board.geometricShapes
  if (Array.isArray(s)) return s
  if (Array.isArray(s?.value)) return s.value
  return []
})

const currentShape = computed(() => {
  return shapesList.value.find((s) => s.id === selectedShapeId.value) || shapesList.value[0] || null
})

const selectedSegment = computed(() => {
  if (!currentShape.value || !selectedSegmentId.value) return null
  return (currentShape.value.segments || []).find((s) => s.id === selectedSegmentId.value) || null
})

function selectSegment(shape, seg) {
  selectShape(shape.id)
  selectedSegmentId.value = seg.id
}

function cycleEqualTicks() {
  if (!selectedSegment.value) return
  const cur = Number(selectedSegment.value.equalTicks) || 0
  selectedSegment.value.equalTicks = (cur + 1) % 3
  board.repaint?.()
}

function cycleParallelMark() {
  if (!selectedSegment.value) return
  const cur = Number(selectedSegment.value.parallelMark) || 0
  selectedSegment.value.parallelMark = (cur + 1) % 3
  board.repaint?.()
}

function toggleSegmentDashed() {
  if (!selectedSegment.value) return
  selectedSegment.value.dashed = !selectedSegment.value.dashed
  board.repaint?.()
}

const activeToolActive = computed(() => {
  return currentShape.value?.activeTool === 'add_point' || currentShape.value?.activeTool === 'connect_line'
})

const isPenOrEraser = computed(() => {
  return board.writingTool === 'pen' || board.writingTool === 'eraser'
})

watch(
  () => board.writingTool,
  (tool) => {
    if (tool === 'pen' || tool === 'eraser') {
      if (currentShape.value) {
        currentShape.value.activeTool = 'select'
      }
      connectSourcePoint.value = null
      connectCurrentMouse.value = null
      hoverSnap.value = null
    }
  },
)

const canvasWidth = computed(() => {
  return svgRef.value?.clientWidth || board.overlayRef?.value?.clientWidth || board.overlayEl?.value?.clientWidth || 800
})
const canvasHeight = computed(() => {
  return svgRef.value?.clientHeight || board.overlayRef?.value?.clientHeight || board.overlayEl?.value?.clientHeight || 560
})

function toPxX(nx) {
  return (Number(nx) || 0) * canvasWidth.value
}
function toPxY(ny) {
  return (Number(ny) || 0) * canvasHeight.value
}

function selectShape(id) {
  if (isPenOrEraser.value) return
  selectedShapeId.value = id
}

function removeShape(id) {
  if (board.removeGeometricShape) {
    board.removeGeometricShape(id)
  } else if (Array.isArray(board.geometricShapes)) {
    board.geometricShapes = board.geometricShapes.filter((s) => s.id !== id)
  }
  selectedShapeId.value = null
  board.repaint?.()
}

function setShapeTool(shape, tool) {
  if (shape.activeTool === tool) {
    shape.activeTool = 'select'
  } else {
    shape.activeTool = tool
    if (board.writingTool === 'pen') {
      board.setWritingTool('hand')
    }
  }
  connectSourcePoint.value = null
  connectCurrentMouse.value = null
  hoverSnap.value = null
}

function activatePenOnShape() {
  if (currentShape.value) currentShape.value.activeTool = 'select'
  board.setWritingTool('pen')
}

function convertToDemo3d(shape) {
  let model = 'cube'
  if (shape.type === 'trapezoid_prism') model = 'trapezoid_prism'
  else if (shape.type === 'prism_3d') model = 'triangular_prism'
  else if (shape.type === 'pyramid_3d') model = 'pyramid'
  else if (shape.type === 'cylinder_3d') model = 'cylinder'
  else if (shape.type === 'cone_3d') model = 'cone'
  else if (shape.subType === 'rectangular_prism' || shape.name?.includes('hộp') || shape.name?.includes('chữ nhật')) model = 'box'
  board.convertStrokesToInteractiveDemo(shape.bbox, model)
  removeShape(shape.id)
}

function allSegments(shape) {
  const base = shape.segments || []
  return base.map((s, i) => ({
    ...s,
    id: s.id || `seg_${s.from}_${s.to}_${i}`,
  }))
}

function getPoint(shape, id) {
  if (!id) return null
  const fromVerts = (shape.vertices || []).find((v) => v.id === id)
  if (fromVerts) return fromVerts
  return (shape.customPoints || []).find((cp) => cp.id === id) || null
}

function polygonPointsAttr(vertices) {
  return vertices
    .map((v) => `${toPxX(v.nx)},${toPxY(v.ny)}`)
    .join(' ')
}

function labelOffset(shape, vertex) {
  // Tuân thủ quy ước: Đặt nhãn gần điểm nhưng không đè lên điểm hoặc cạnh
  const b = shape.bbox || { cx: 0.5, cy: 0.5 }
  const cx = b.cx || 0.5
  const cy = b.cy || 0.5
  const dx = vertex.nx - cx
  const dy = vertex.ny - cy
  const len = Math.hypot(dx, dy) || 1
  const dist = 16
  return {
    dx: Math.round((dx / len) * dist) - 4,
    dy: Math.round((dy / len) * dist) + 5,
  }
}

function equalTicksPath(shape, seg) {
  const count = Number(seg.equalTicks) || 0
  if (count <= 0) return ''
  const p1 = getPoint(shape, seg.from)
  const p2 = getPoint(shape, seg.to)
  if (!p1 || !p2) return ''
  const x1 = toPxX(p1.nx)
  const y1 = toPxY(p1.ny)
  const x2 = toPxX(p2.nx)
  const y2 = toPxY(p2.ny)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 12) return ''
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const tickH = 6
  const spacing = 3.5

  if (count === 1) {
    return `M ${mx - nx * tickH} ${my - ny * tickH} L ${mx + nx * tickH} ${my + ny * tickH}`
  }
  if (count === 2) {
    const o1x = mx - ux * spacing
    const o1y = my - uy * spacing
    const o2x = mx + ux * spacing
    const o2y = my + uy * spacing
    return `M ${o1x - nx * tickH} ${o1y - ny * tickH} L ${o1x + nx * tickH} ${o1y + ny * tickH} M ${o2x - nx * tickH} ${o2y - ny * tickH} L ${o2x + nx * tickH} ${o2y + ny * tickH}`
  }
  if (count === 3) {
    const o1x = mx - ux * (spacing * 1.6)
    const o1y = my - uy * (spacing * 1.6)
    const o2x = mx + ux * (spacing * 1.6)
    const o2y = my + uy * (spacing * 1.6)
    return `M ${o1x - nx * tickH} ${o1y - ny * tickH} L ${o1x + nx * tickH} ${o1y + ny * tickH} M ${mx - nx * tickH} ${my - ny * tickH} L ${mx + nx * tickH} ${my + ny * tickH} M ${o2x - nx * tickH} ${o2y - ny * tickH} L ${o2x + nx * tickH} ${o2y + ny * tickH}`
  }
  return ''
}

function parallelMarkPath(shape, seg) {
  const count = Number(seg.parallelMark) || 0
  if (count <= 0) return ''
  const p1 = getPoint(shape, seg.from)
  const p2 = getPoint(shape, seg.to)
  if (!p1 || !p2) return ''
  const x1 = toPxX(p1.nx)
  const y1 = toPxY(p1.ny)
  const x2 = toPxX(p2.nx)
  const y2 = toPxY(p2.ny)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 14) return ''
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const arrowL = 6.5
  const arrowW = 4.5
  const spacing = 4.5

  function makeArrow(cx, cy) {
    const tipX = cx + ux * (arrowL * 0.4)
    const tipY = cy + uy * (arrowL * 0.4)
    const base1X = tipX - ux * arrowL + nx * arrowW
    const base1Y = tipY - uy * arrowL + ny * arrowW
    const base2X = tipX - ux * arrowL - nx * arrowW
    const base2Y = tipY - uy * arrowL - ny * arrowW
    return `M ${base1X} ${base1Y} L ${tipX} ${tipY} L ${base2X} ${base2Y}`
  }

  if (count === 1) {
    return makeArrow(mx, my)
  }
  if (count >= 2) {
    return `${makeArrow(mx - ux * spacing, my - uy * spacing)} ${makeArrow(mx + ux * spacing, my + uy * spacing)}`
  }
  return ''
}

function rightAnglePath(shape, ra) {
  const v = getPoint(shape, ra.vertex)
  const l1 = getPoint(shape, ra.leg1)
  const l2 = getPoint(shape, ra.leg2)
  if (!v || !l1 || !l2) return ''
  const vx = toPxX(v.nx)
  const vy = toPxY(v.ny)
  const l1x = toPxX(l1.nx) - vx
  const l1y = toPxY(l1.ny) - vy
  const l2x = toPxX(l2.nx) - vx
  const l2y = toPxY(l2.ny) - vy
  const len1 = Math.hypot(l1x, l1y) || 1
  const len2 = Math.hypot(l2x, l2y) || 1
  const S = 12
  const u1x = (l1x / len1) * S
  const u1y = (l1y / len1) * S
  const u2x = (l2x / len2) * S
  const u2y = (l2y / len2) * S
  return `M ${vx + u1x} ${vy + u1y} L ${vx + u1x + u2x} ${vy + u1y + u2y} L ${vx + u2x} ${vy + u2y}`
}

function snapLabelWidth(label) {
  return Math.max(70, (String(label || '').length * 8) + 16)
}

// Bounding box floating toolbar position
const shapeToolbarPos = computed(() => {
  if (!currentShape.value) return null
  const b = currentShape.value.bbox
  if (!b) return { left: '50%', top: '20px' }
  const x = toPxX(b.cx || (b.minX + b.maxX) / 2)
  const y = toPxY(b.minY) - 48
  return {
    left: `${Math.max(120, Math.min(canvasWidth.value - 120, x))}px`,
    top: `${Math.max(12, y)}px`,
    transform: 'translateX(-50%)',
  }
})

function distToSegmentNorm(p, a, b) {
  const dx = b.nx - a.nx
  const dy = b.ny - a.ny
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return Math.hypot(p.nx - a.nx, p.ny - a.ny)
  let t = ((p.nx - a.nx) * dx + (p.ny - a.ny) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.nx - (a.nx + t * dx), p.ny - (a.ny + t * dy))
}

function getEdgeConstraintForPoint(shape, point) {
  if (!shape || !point) return null

  // 1. Nếu điểm đã có thuộc tính edge rõ ràng (được tạo qua + Đặt điểm)
  if (Array.isArray(point.edge) && point.edge.length === 2) {
    const pA = getPoint(shape, point.edge[0])
    const pB = getPoint(shape, point.edge[1])
    if (pA && pB && pA.id !== point.id && pB.id !== point.id) {
      return { from: pA, to: pB }
    }
  }

  // 2. Điểm là đỉnh nằm giữa 2 đoạn thẳng gần như thẳng hàng (ví dụ: D - C - B với góc ∠DCB ≈ 180°)
  // C là điểm trên cạnh DB
  const segs = allSegments(shape).filter(
    (s) => s.from === point.id || s.to === point.id,
  )
  const neighborIds = segs.map((s) => (s.from === point.id ? s.to : s.from))
  const uniqueNeighbors = [...new Set(neighborIds)].map((id) => getPoint(shape, id)).filter(Boolean)

  if (uniqueNeighbors.length >= 2) {
    for (let i = 0; i < uniqueNeighbors.length; i += 1) {
      for (let j = i + 1; j < uniqueNeighbors.length; j += 1) {
        const nA = uniqueNeighbors[i]
        const nB = uniqueNeighbors[j]
        const dxA = nA.nx - point.nx
        const dyA = nA.ny - point.ny
        const dxB = nB.nx - point.nx
        const dyB = nB.ny - point.ny
        const lenA = Math.hypot(dxA, dyA)
        const lenB = Math.hypot(dxB, dyB)
        if (lenA > 1e-4 && lenB > 1e-4) {
          const dot = (dxA * dxB + dyA * dyB) / (lenA * lenB)
          // dot ≈ -1 nghĩa là góc gần 180 độ (hai nhánh đối diện trên 1 đường thẳng)
          if (dot < -0.92) {
            return { from: nA, to: nB }
          }
        }
      }
    }
  }

  // 3. Nếu điểm nằm trên một đoạn thẳng nào đó trong hình (khoảng cách cực gần < 0.016)
  for (const seg of allSegments(shape)) {
    if (seg.from === point.id || seg.to === point.id) continue
    const pA = getPoint(shape, seg.from)
    const pB = getPoint(shape, seg.to)
    if (!pA || !pB) continue
    const d = distToSegmentNorm(point, pA, pB)
    if (d < 0.016) {
      return { from: pA, to: pB }
    }
  }

  return null
}

function updateDependentPoints(shape, movedPoint) {
  if (!shape || !movedPoint) return
  const allPts = [...(shape.vertices || []), ...(shape.customPoints || [])]
  allPts.forEach((p) => {
    if (p.id === movedPoint.id) return
    const constraint = getEdgeConstraintForPoint(shape, p)
    if (constraint && (constraint.from.id === movedPoint.id || constraint.to.id === movedPoint.id)) {
      const t = typeof p.along === 'number' ? p.along : 0.5
      p.nx = constraint.from.nx + t * (constraint.to.nx - constraint.from.nx)
      p.ny = constraint.from.ny + t * (constraint.to.ny - constraint.from.ny)
    }
  })
}

// ==================== POINTER & SNAP INTERACTION ====================
function onSvgPointerMove(e) {
  if (!svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const nx = mx / canvasWidth.value
  const ny = my / canvasHeight.value

  // Nếu đang kéo đỉnh hoặc điểm
  if (activeDrag.value) {
    const { shape, point, constraint } = activeDrag.value

    if (constraint && constraint.from && constraint.to) {
      const pA = constraint.from
      const pB = constraint.to
      const dx = pB.nx - pA.nx
      const dy = pB.ny - pA.ny
      const len2 = dx * dx + dy * dy

      if (len2 > 1e-8) {
        // Chiếu trực giao tọa độ con trỏ (nx, ny) lên đoạn thẳng AB
        let t = ((nx - pA.nx) * dx + (ny - pA.ny) * dy) / len2
        // Giới hạn trong đoạn [0.03, 0.97] để điểm chỉ di chuyển trên cạnh đó, không thể văng ra ngoài!
        t = Math.max(0.03, Math.min(0.97, t))

        let snapLabel = `Cạnh ${pA.id || ''}${pB.id || ''}`

        // 1. Kiểm tra hít vào chân đường cao vuông góc nếu có đỉnh đối diện
        const otherNeighbors = allSegments(shape)
          .filter((s) => s.from === point.id || s.to === point.id)
          .map((s) => (s.from === point.id ? s.to : s.from))
          .filter((nid) => nid !== pA.id && nid !== pB.id)

        let perpSnapped = false
        for (const oId of otherNeighbors) {
          const pOther = getPoint(shape, oId)
          if (pOther) {
            const footT = ((pOther.nx - pA.nx) * dx + (pOther.ny - pA.ny) * dy) / len2
            if (footT >= 0.05 && footT <= 0.95 && Math.abs(t - footT) < 0.04) {
              t = footT
              snapLabel = `Đường cao ⊥ (${pOther.id}${point.id || ''})`
              perpSnapped = true
              break
            }
          }
        }

        // 2. Nam châm bắt dính trung điểm (t = 0.5) hoặc tỉ lệ 1/3, 2/3
        if (!perpSnapped) {
          if (Math.abs(t - 0.5) < 0.04) {
            t = 0.5
            snapLabel = `Trung điểm ${point.id || ''} (1/2)`
          } else if (Math.abs(t - 1 / 3) < 0.03) {
            t = 1 / 3
            snapLabel = `Tỉ lệ 1/3`
          } else if (Math.abs(t - 2 / 3) < 0.03) {
            t = 2 / 3
            snapLabel = `Tỉ lệ 2/3`
          }
        }

        activeDrag.value.snapLabel = snapLabel
        point.nx = pA.nx + t * dx
        point.ny = pA.ny + t * dy
        point.along = t
        if (point.isMidpoint !== undefined) {
          point.isMidpoint = t === 0.5
        }
      }
    } else {
      // Điểm tự do: di chuyển tự do trong khung
      point.nx = Math.max(0.02, Math.min(0.98, nx))
      point.ny = Math.max(0.02, Math.min(0.98, ny))
      // Nếu di chuyển đỉnh đầu mút, tự động cập nhật các điểm con trượt trên cạnh nối với đỉnh này
      updateDependentPoints(shape, point)
    }

    board.repaint?.()
    return
  }

  // Nếu đang ở mode nối đoạn thẳng
  if (currentShape.value?.activeTool === 'connect_line' && connectSourcePoint.value) {
    connectCurrentMouse.value = { x: mx, y: my }
  }

  // Nếu đang ở mode đặt điểm: tìm cạnh gần nhất để bắt dính (Snap)
  if (currentShape.value?.activeTool === 'add_point') {
    checkSnapNearEdges(currentShape.value, mx, my, nx, ny)
  }
}

function checkSnapNearEdges(shape, mx, my, nx, ny) {
  const segments = allSegments(shape)
  let best = null
  let bestDist = 24 // snap threshold trong 24px

  segments.forEach((seg) => {
    const p1 = getPoint(shape, seg.from)
    const p2 = getPoint(shape, seg.to)
    if (!p1 || !p2) return
    const x1 = toPxX(p1.nx)
    const y1 = toPxY(p1.ny)
    const x2 = toPxX(p2.nx)
    const y2 = toPxY(p2.ny)
    const dx = x2 - x1
    const dy = y2 - y1
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-6) return

    let t = ((mx - x1) * dx + (my - y1) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const projX = x1 + t * dx
    const projY = y1 + t * dy
    const d = Math.hypot(mx - projX, my - projY)

    if (d < bestDist) {
      bestDist = d
      // Tự động hít vào TRUNG ĐIỂM nếu t gần 0.5
      let isMid = false
      let snapT = t
      let label = `Điểm trên ${seg.from}${seg.to}`
      if (Math.abs(t - 0.5) < 0.08) {
        snapT = 0.5
        isMid = true
        label = `Trung điểm ${nextPointLetter(shape)} của ${seg.from}${seg.to}`
      } else if (Math.abs(t - 0.333) < 0.05) {
        snapT = 1 / 3
        label = `Tỉ lệ 1/3 trên ${seg.from}${seg.to}`
      } else if (Math.abs(t - 0.667) < 0.05) {
        snapT = 2 / 3
        label = `Tỉ lệ 2/3 trên ${seg.from}${seg.to}`
      }

      best = {
        seg,
        t: snapT,
        isMid,
        label,
        x: x1 + snapT * dx,
        y: y1 + snapT * dy,
        nx: p1.nx + snapT * (p2.nx - p1.nx),
        ny: p1.ny + snapT * (p2.ny - p1.ny),
      }
    }
  })

  hoverSnap.value = best
}

function nextPointLetter(shape) {
  const used = new Set([
    ...(shape.vertices || []).map((v) => v.id),
    ...(shape.customPoints || []).map((cp) => cp.id),
  ])
  const candidates = ['M', 'N', 'P', 'Q', 'H', 'K', 'E', 'F', 'I', 'J', 'G', 'D', 'R', 'S']
  return candidates.find((c) => !used.has(c)) || 'P'
}

function onSvgPointerDown(e) {
  if (!currentShape.value) return

  // ĐẶT ĐIỂM
  if (currentShape.value.activeTool === 'add_point') {
    const shape = currentShape.value
    const id = nextPointLetter(shape)
    let newPt

    if (hoverSnap.value) {
      // Đặt trên cạnh với tỉ lệ/trung điểm
      newPt = {
        id,
        label: id,
        nx: hoverSnap.value.nx,
        ny: hoverSnap.value.ny,
        edge: [hoverSnap.value.seg.from, hoverSnap.value.seg.to],
        along: hoverSnap.value.t,
        isMidpoint: hoverSnap.value.isMid,
      }
      if (hoverSnap.value.isMid) {
        // Tách cạnh và đánh dấu 2 nửa bằng nhau theo quy ước trung điểm toán học
        const origSeg = hoverSnap.value.seg
        const u = origSeg.from
        const v = origSeg.to
        if (Array.isArray(shape.segments)) {
          shape.segments = shape.segments.filter((s) => s.id !== origSeg.id)
          shape.segments.push(
            { id: `s_${u}${id}`, from: u, to: id, dashed: origSeg.dashed, equalTicks: 1 },
            { id: `s_${id}${v}`, from: id, to: v, dashed: origSeg.dashed, equalTicks: 1 },
          )
        }
      }
    } else {
      // Đặt tự do trong hình
      const rect = svgRef.value.getBoundingClientRect()
      newPt = {
        id,
        label: id,
        nx: (e.clientX - rect.left) / canvasWidth.value,
        ny: (e.clientY - rect.top) / canvasHeight.value,
        free: true,
      }
    }

    if (!shape.customPoints) shape.customPoints = []
    shape.customPoints.push(newPt)
    hoverSnap.value = null
    board.recordAction?.(`Đặt điểm ${id}`)
    board.repaint?.()
    return
  }

  // NỐI ĐOẠN THẲNG
  if (currentShape.value.activeTool === 'connect_line') {
    // Nếu click ra ngoài điểm: hủy chọn điểm đầu
    if (!e.target.closest('.geom-vertex') && !e.target.closest('.geom-custom-point')) {
      connectSourcePoint.value = null
      connectCurrentMouse.value = null
    }
  }
}

function onSvgPointerUp() {
  if (activeDrag.value) {
    board.recordAction?.(`Di chuyển điểm ${activeDrag.value.point?.label || ''}`)
  }
  activeDrag.value = null
}

function onVertexPointerDown(shape, vertex, e) {
  selectShape(shape.id)

  // Nếu đang ở mode nối đoạn thẳng
  if (shape.activeTool === 'connect_line') {
    handleConnectPointClick(shape, vertex)
    return
  }

  // Bắt đầu kéo đỉnh (kiểm tra xem đỉnh có bị ràng buộc trên một cạnh không)
  const constraint = getEdgeConstraintForPoint(shape, vertex)
  if (constraint && typeof vertex.along !== 'number') {
    const dx = constraint.to.nx - constraint.from.nx
    const dy = constraint.to.ny - constraint.from.ny
    const len2 = dx * dx + dy * dy
    if (len2 > 1e-8) {
      vertex.along = Math.max(0.03, Math.min(0.97, ((vertex.nx - constraint.from.nx) * dx + (vertex.ny - constraint.from.ny) * dy) / len2))
    }
  }
  activeDrag.value = { shape, point: vertex, constraint, snapLabel: '' }
  e.target.setPointerCapture?.(e.pointerId)
}

function onCustomPointPointerDown(shape, customPoint, e) {
  selectShape(shape.id)

  // Nếu đang ở mode nối đoạn thẳng
  if (shape.activeTool === 'connect_line') {
    handleConnectPointClick(shape, customPoint)
    return
  }

  // Bắt đầu kéo điểm (kiểm tra xem điểm có bị ràng buộc trên một cạnh không)
  const constraint = getEdgeConstraintForPoint(shape, customPoint)
  if (constraint && typeof customPoint.along !== 'number') {
    const dx = constraint.to.nx - constraint.from.nx
    const dy = constraint.to.ny - constraint.from.ny
    const len2 = dx * dx + dy * dy
    if (len2 > 1e-8) {
      customPoint.along = Math.max(0.03, Math.min(0.97, ((customPoint.nx - constraint.from.nx) * dx + (customPoint.ny - constraint.from.ny) * dy) / len2))
    }
  }
  activeDrag.value = { shape, point: customPoint, constraint, snapLabel: '' }
  e.target.setPointerCapture?.(e.pointerId)
}

function handleConnectPointClick(shape, point) {
  if (!connectSourcePoint.value) {
    // Điểm đầu
    connectSourcePoint.value = point
  } else {
    // Điểm thứ hai: Tạo đoạn thẳng!
    const fromId = connectSourcePoint.value.id
    const toId = point.id
    if (fromId !== toId) {
      if (!shape.segments) shape.segments = []
      // Kiểm tra trùng
      const exists = shape.segments.some(
        (s) => (s.from === fromId && s.to === toId) || (s.from === toId && s.to === fromId),
      )
      if (!exists) {
        shape.segments.push({
          id: `seg_${fromId}_${toId}`,
          from: fromId,
          to: toId,
          dashed: connectLineDashed.value,
          isCustom: true,
          color: connectLineDashed.value ? '#fbbf24' : '#f8fafc',
        })
        board.recordAction?.(`Nối đoạn ${fromId}${toId}`)
      }
    }
    connectSourcePoint.value = null
    connectCurrentMouse.value = null
    board.repaint?.()
  }
}
</script>

<style scoped>
.geometry-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 6;
  pointer-events: none;
  overflow: visible;
}

/* Svg mặc định hoàn toàn xuyên thấu để các thao tác vẽ (bút/tẩy) đi thẳng xuống canvas */
.geometry-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
}

/* Khi đang dùng bút hoặc tẩy vẽ, bắt buộc mọi phần tử SVG không bắt sự kiện pointer */
.geometry-overlay.is-pen-active .geometry-svg,
.geometry-overlay.is-pen-active .geometry-svg * {
  pointer-events: none !important;
}

/* Khi đang ở mode đặt điểm hoặc nối đoạn (và không phải pen/eraser), SVG mới nhận pointermove/down */
.geometry-overlay.has-active-tool:not(.is-pen-active) .geometry-svg {
  pointer-events: auto;
  cursor: crosshair;
}

/* Khi không phải pen mode, cho phép kéo đỉnh và điểm tự đặt */
.geometry-overlay:not(.is-pen-active) .geom-vertex,
.geometry-overlay:not(.is-pen-active) .geom-custom-point {
  pointer-events: auto;
}

/* Khi không phải pen mode, cho phép click vào đối tượng hình học để chọn nó */
.geometry-overlay:not(.is-pen-active) .geom-shape-group {
  pointer-events: visiblePainted;
  cursor: pointer;
}

.geom-shape-group {
  cursor: pointer;
}

.geom-fill-polygon {
  fill: rgba(56, 189, 248, 0.04);
  transition: fill 0.2s ease;
}

.geom-shape-group:hover .geom-fill-polygon,
.geom-shape-group.is-selected .geom-fill-polygon {
  fill: rgba(56, 189, 248, 0.08);
}

.geom-edge-group {
  cursor: pointer;
  pointer-events: auto;
}

.geom-edge-hitarea {
  stroke: transparent;
  stroke-width: 16px;
  stroke-linecap: round;
  fill: none;
  cursor: pointer;
}

.geom-edge {
  stroke-width: 2.6px;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-width 0.15s ease, stroke 0.15s ease;
}

.geom-edge--active {
  stroke: #38bdf8 !important;
  stroke-width: 3.4px !important;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6));
}

.geom-equal-ticks {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 2.4px;
  stroke-linecap: round;
  pointer-events: none;
}

.geom-parallel-mark {
  fill: none;
  stroke: #fbbf24;
  stroke-width: 2.2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.geom-edge--dashed {
  stroke-dasharray: 6 5;
  stroke-width: 2px;
}

.geom-edge--custom {
  stroke-width: 2.4px;
}

.geom-edge--preview {
  stroke: #38bdf8;
  stroke-width: 2.2px;
  pointer-events: none;
}

.geom-circle {
  fill: rgba(56, 189, 248, 0.04);
}

.geom-right-angle {
  fill: none;
  stroke: #fbbf24;
  stroke-width: 1.8px;
}

/* ĐỈNH CHÍNH (A, B, C...) */
.geom-vertex {
  cursor: move;
}

.vertex-dot {
  fill: #38bdf8;
  stroke: #ffffff;
  stroke-width: 2px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
  transition: r 0.15s ease, fill 0.15s ease;
}

.geom-vertex:hover .vertex-dot,
.geom-vertex.is-connect-source .vertex-dot {
  r: 8px;
  fill: #fbbf24;
  filter: url(#glow-gold);
}

.vertex-label {
  fill: #f8fafc;
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
  pointer-events: none;
  user-select: none;
}

/* ĐIỂM TỰ ĐẶT (M, N, P...) */
.geom-custom-point {
  cursor: move;
}

.custom-point-dot {
  fill: #fbbf24;
  stroke: #ffffff;
  stroke-width: 2px;
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
  transition: r 0.15s ease;
}

.geom-custom-point:hover .custom-point-dot,
.geom-custom-point.is-connect-source .custom-point-dot {
  r: 9px;
  filter: url(#glow-gold);
}

.custom-point-label {
  fill: #fef08a;
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 800;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  user-select: none;
}

/* BẮT DÍNH (SNAP INDICATOR) */
.snap-circle-pulse {
  fill: rgba(251, 191, 36, 0.25);
  stroke: #fbbf24;
  stroke-width: 1.5px;
  animation: snapPulse 1.2s infinite ease-in-out;
}

.snap-circle-core {
  fill: #fbbf24;
  stroke: #ffffff;
  stroke-width: 1.5px;
}

.snap-badge-bg {
  fill: rgba(15, 23, 42, 0.92);
  stroke: rgba(251, 191, 36, 0.6);
  stroke-width: 1px;
}

.snap-badge-bg--active {
  fill: rgba(14, 165, 233, 0.95);
  stroke: #38bdf8;
  filter: drop-shadow(0 2px 8px rgba(14, 165, 233, 0.45));
}

.geom-edge-constraint-glow {
  stroke: #38bdf8;
  stroke-width: 3.5px;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.85));
  stroke-dasharray: 6 4;
  animation: edgeDashGlow 1.2s linear infinite;
}

@keyframes edgeDashGlow {
  to {
    stroke-dashoffset: -20;
  }
}

.snap-badge-text {
  fill: #fef08a;
  font-size: 11px;
  font-weight: 700;
  font-family: system-ui, sans-serif;
  dominant-baseline: central;
}

@keyframes snapPulse {
  0% { r: 6px; opacity: 0.9; }
  50% { r: 12px; opacity: 0.4; }
  100% { r: 6px; opacity: 0.9; }
}

/* FLOATING INTERACTION TOOLBAR */
.shape-floating-bar {
  position: absolute;
  z-index: 18;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(56, 189, 248, 0.45);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.55),
    0 0 16px rgba(14, 165, 233, 0.25);
  user-select: none;
  white-space: nowrap;
}

.shape-title-chip {
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.shape-name {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
}

.shape-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(71, 85, 105, 0.5);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
}

.tool-btn.active {
  background: rgba(14, 165, 233, 0.3);
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.tool-btn--toggle {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.tool-btn--3d {
  background: rgba(168, 85, 247, 0.25);
  border-color: rgba(168, 85, 247, 0.5);
  color: #c084fc;
}

.tool-btn--3d:hover {
  background: rgba(168, 85, 247, 0.38);
  color: #f3e8ff;
}

.tool-btn--del {
  padding: 5px 6px;
  color: #94a3b8;
}

.tool-btn--del:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #ef4444;
}

.toolbar-sep {
  width: 1px;
  height: 18px;
  background: rgba(71, 85, 105, 0.5);
  margin: 0 2px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.18s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -6px);
}
</style>


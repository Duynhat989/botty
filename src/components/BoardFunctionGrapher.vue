<template>
  <div
    v-if="board?.showFunctionGrapher"
    class="function-grapher-window"
    :style="{
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${collapsed ? 280 : 440}px`,
    }"
    @pointerdown.stop
  >
    <!-- Tiêu đề & Kéo di chuyển cửa sổ -->
    <header class="fg-header" @pointerdown="onHeaderPointerDown">
      <div class="fg-title-wrap">
        <LineChart :size="16" class="fg-title-icon" />
        <span class="fg-title">Đồ thị hàm số tương tác</span>
      </div>
      <div class="fg-head-actions">
        <button
          type="button"
          class="fg-hbtn"
          :title="collapsed ? 'Mở rộng' : 'Thu gọn'"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? '▼' : '▲' }}
        </button>
        <button
          type="button"
          class="fg-hbtn fg-hbtn--close"
          title="Đóng đồ thị"
          @click="board.toggleFunctionGrapher(false)"
        >
          ✕
        </button>
      </div>
    </header>

    <div v-show="!collapsed" class="fg-body">
      <!-- 1. Nhập công thức tùy ý hoặc chọn hàm số mẫu -->
      <div class="fg-custom-input-row">
        <span class="fg-inp-prefix">y =</span>
        <input
          v-model="customFormulaInput"
          type="text"
          class="fg-custom-inp"
          placeholder="Nhập công thức (VD: 2x - 3, x^2 - 4, sin(x))..."
          @input="onCustomFormulaInput"
        />
        <button
          v-if="customFormulaInput"
          type="button"
          class="fg-clear-inp"
          title="Xóa công thức"
          @click="clearCustomFormula"
        >
          ✕
        </button>
      </div>

      <div class="fg-preset-pills">
        <button
          v-for="p in presets"
          :key="p.id"
          type="button"
          class="fg-pill"
          :class="{ active: selectedPresetId === p.id && !customFormulaInput }"
          @click="selectPreset(p)"
        >
          {{ p.formula }}
        </button>
      </div>

      <!-- 2. Thanh trượt tham số A, B (Kéo trượt thay đổi đồ thị thời gian thực) -->
      <div class="fg-sliders">
        <div v-if="hasParamA" class="fg-slider-row">
          <label class="slider-lbl">
            <strong>A =</strong> <span>{{ paramA.toFixed(2) }}</span>
          </label>
          <input
            v-model.number="paramA"
            type="range"
            min="-5"
            max="5"
            step="0.1"
            class="fg-range"
            @input="drawGraph"
          />
        </div>
        <div v-if="hasParamB" class="fg-slider-row">
          <label class="slider-lbl">
            <strong>B =</strong> <span>{{ paramB.toFixed(2) }}</span>
          </label>
          <input
            v-model.number="paramB"
            type="range"
            min="-6"
            max="6"
            step="0.1"
            class="fg-range"
            @input="drawGraph"
          />
        </div>
      </div>

      <!-- 3. Canvas hiển thị hệ trục tọa độ & đường cong đồ thị -->
      <div class="fg-canvas-wrap">
        <canvas
          ref="graphCanvasRef"
          class="fg-canvas"
          width="408"
          height="240"
          @pointermove="onCanvasPointerMove"
          @pointerleave="hoverPoint = null"
        />

        <!-- Badge tọa độ khi rê chuột lên đồ thị -->
        <div v-if="hoverPoint" class="fg-coord-badge">
          x = {{ hoverPoint.x.toFixed(2) }} | y = {{ hoverPoint.y.toFixed(2) }}
        </div>
      </div>

      <!-- 4. Tóm tắt đặc trưng hàm số & Nút chèn vào bảng -->
      <footer class="fg-footer">
        <div class="fg-info">
          <span class="info-tag">{{ currentFormulaText }}</span>
          <span v-if="extremaText" class="info-sub">{{ extremaText }}</span>
        </div>
        <button
          type="button"
          class="fg-insert-btn"
          title="Chép nét vẽ đồ thị và trục tọa độ vào bảng viết"
          @click="insertIntoBoard"
        >
          <Share2 :size="14" />
          <span>Chèn vào bảng viết</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, inject, nextTick } from 'vue'
import { LineChart, Share2 } from '@lucide/vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const board = inject(WRITING_BOARD_KEY)

const collapsed = ref(false)
const pos = reactive({ x: 120, y: 120 })

const presets = [
  { id: 'parabola_sgk', formula: 'y = x² - 3', fn: (x, a, b) => x * x - 3, hasA: false, hasB: false, defaultA: 1, defaultB: -3 },
  { id: 'sin_wave', formula: 'y = A·sin(x) + B', fn: (x, a, b) => a * Math.sin(x) + b, hasA: true, hasB: true, defaultA: 2, defaultB: 0 },
  { id: 'quadratic', formula: 'y = A·x² + B', fn: (x, a, b) => a * x * x + b, hasA: true, hasB: true, defaultA: 1, defaultB: -2 },
  { id: 'linear', formula: 'y = A·x + B', fn: (x, a, b) => a * x + b, hasA: true, hasB: true, defaultA: 1.5, defaultB: -1 },
  { id: 'cubic', formula: 'y = x³ - 3x', fn: (x) => x * x * x - 3 * x, hasA: false, hasB: false, defaultA: 1, defaultB: 0 },
]

const selectedPresetId = ref('parabola_sgk')
const customFormulaInput = ref('')
const paramA = ref(1)
const paramB = ref(-3)
const graphCanvasRef = ref(null)
const hoverPoint = ref(null)

function onCustomFormulaInput() {
  selectedPresetId.value = ''
  nextTick(drawGraph)
}

function clearCustomFormula() {
  customFormulaInput.value = ''
  selectedPresetId.value = 'parabola_sgk'
  nextTick(drawGraph)
}

function evalMathFormula(expr, x, A = 1, B = 0) {
  try {
    let clean = String(expr || '').trim()
    if (!clean) return NaN
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

const currentPreset = computed(() => presets.find(p => p.id === selectedPresetId.value) || presets[0])
const hasParamA = computed(() => !customFormulaInput.value.trim() && currentPreset.value.hasA)
const hasParamB = computed(() => !customFormulaInput.value.trim() && currentPreset.value.hasB)

const currentFormulaText = computed(() => {
  if (customFormulaInput.value.trim()) return `y = ${customFormulaInput.value.trim()}`
  if (selectedPresetId.value === 'parabola_sgk') return 'y = x² - 3'
  if (selectedPresetId.value === 'sin_wave') {
    return `y = ${paramA.value.toFixed(1)}·sin(x) ${paramB.value >= 0 ? '+' : ''} ${paramB.value.toFixed(1)}`
  }
  if (selectedPresetId.value === 'quadratic') {
    return `y = ${paramA.value.toFixed(1)}·x² ${paramB.value >= 0 ? '+' : ''} ${paramB.value.toFixed(1)}`
  }
  if (selectedPresetId.value === 'linear') {
    return `y = ${paramA.value.toFixed(1)}·x ${paramB.value >= 0 ? '+' : ''} ${paramB.value.toFixed(1)}`
  }
  return 'y = x³ - 3x'
})

const extremaText = computed(() => {
  if (customFormulaInput.value.trim()) return ''
  if (selectedPresetId.value === 'parabola_sgk') return 'Đỉnh S(0, -3), x_giao = ±1.73'
  if (selectedPresetId.value === 'quadratic' && paramA.value !== 0) {
    return paramA.value > 0 ? `Cực tiểu tại (0, ${paramB.value.toFixed(1)})` : `Cực đại tại (0, ${paramB.value.toFixed(1)})`
  }
  if (selectedPresetId.value === 'sin_wave') {
    return `Biên độ: ${Math.abs(paramA.value).toFixed(1)}, Chu kỳ: 2π`
  }
  return ''
})

function selectPreset(p) {
  customFormulaInput.value = ''
  selectedPresetId.value = p.id
  paramA.value = p.defaultA
  paramB.value = p.defaultB
  nextTick(drawGraph)
}

function onHeaderPointerDown(e) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = pos.x
  const initY = pos.y

  function onMove(me) {
    pos.x = initX + (me.clientX - startX)
    pos.y = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// -------------------------------------------------------------
// VẼ ĐỒ THỊ TỌA ĐỘ VÀ ĐƯỜNG CONG HÀM SỐ TRÊN CANVAS
// -------------------------------------------------------------
function drawGraph() {
  const canvas = graphCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  // Hệ tọa độ: x từ -6 đến 6, y từ -4 đến 4
  const xMin = -6
  const xMax = 6
  const yMin = -4
  const yMax = 4

  const toPxX = (x) => ((x - xMin) / (xMax - xMin)) * w
  const toPxY = (y) => h - ((y - yMin) / (yMax - yMin)) * h
  const originX = toPxX(0)
  const originY = toPxY(0)

  // 1. Lưới tọa độ
  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const px = toPxX(x)
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, h)
    ctx.stroke()
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const py = toPxY(y)
    ctx.beginPath()
    ctx.moveTo(0, py)
    ctx.lineTo(w, py)
    ctx.stroke()
  }

  // 2. Trục Ox, Oy
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)'
  ctx.lineWidth = 1.5

  // Trục Ox
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(w, originY)
  ctx.stroke()

  // Trục Oy
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, h)
  ctx.stroke()

  // Mũi tên trục Ox, Oy & Nhãn O, x, y
  ctx.fillStyle = '#94a3b8'
  ctx.font = '10px system-ui, sans-serif'
  ctx.fillText('x', w - 10, originY - 6)
  ctx.fillText('y', originX + 6, 12)
  ctx.fillText('O', originX - 12, originY + 12)

  // Các số mốc trên trục
  for (let x = -4; x <= 4; x += 2) {
    if (x === 0) continue
    ctx.fillText(`${x}`, toPxX(x) - 4, originY + 12)
  }
  for (let y = -2; y <= 2; y += 2) {
    if (y === 0) continue
    ctx.fillText(`${y}`, originX + 6, toPxY(y) + 3)
  }

  // 3. Đường cong hàm số (Plotting f(x))
  const isCustom = Boolean(customFormulaInput.value.trim())
  const fn = isCustom
    ? (x, a, b) => evalMathFormula(customFormulaInput.value, x, a, b)
    : currentPreset.value.fn
  const a = paramA.value
  const b = paramB.value

  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()

  const steps = 140
  let isFirst = true

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = xMin + t * (xMax - xMin)
    const y = fn(x, a, b)
    if (Number.isFinite(y)) {
      const px = toPxX(x)
      const py = toPxY(y)
      if (py >= -10 && py <= h + 10) {
        if (isFirst) {
          ctx.moveTo(px, py)
          isFirst = false
        } else {
          ctx.lineTo(px, py)
        }
      } else {
        isFirst = true
      }
    }
  }
  ctx.stroke()

  // 4. Đánh dấu các điểm đặc biệt (Đỉnh, Giao điểm trục)
  if (!isCustom && selectedPresetId.value === 'parabola_sgk') {
    // Đỉnh (0, -3)
    const sx = toPxX(0)
    const sy = toPxY(-3)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText('S(0, -3)', sx + 8, sy + 3)

    // Nghiệm x = ±√3 ≈ ±1.73
    const r1 = toPxX(-Math.sqrt(3))
    const r2 = toPxX(Math.sqrt(3))
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.arc(r1, originY, 4, 0, Math.PI * 2)
    ctx.arc(r2, originY, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function onCanvasPointerMove(e) {
  const canvas = graphCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const px = e.clientX - rect.left
  const xMin = -6
  const xMax = 6
  const x = xMin + (px / rect.width) * (xMax - xMin)
  const fn = currentPreset.value.fn
  const y = fn(x, paramA.value, paramB.value)
  if (Number.isFinite(y)) {
    hoverPoint.value = { x, y }
  }
}

// -------------------------------------------------------------
// CHÈN NÉT VẼ ĐỒ THỊ VÀO BẢNG ĐỂ GIÁO VIÊN VIẾT CHÚ THÍCH TIẾP
// -------------------------------------------------------------
function insertIntoBoard() {
  if (!board) return
  const xMin = -6
  const xMax = 6
  const yMin = -4
  const yMax = 4
  const fn = currentPreset.value.fn
  const a = paramA.value
  const b = paramB.value

  // Đặt đồ thị ở góc phần tư phía bên phải bảng (như video 00:20)
  const cx = 0.65
  const cy = 0.5
  const spanW = 0.32
  const spanH = 0.3

  const toBoardNx = (x) => cx - spanW / 2 + ((x - xMin) / (xMax - xMin)) * spanW
  const toBoardNy = (y) => cy + spanH / 2 - ((y - yMin) / (yMax - yMin)) * spanH

  // Trục Ox, Oy
  const oxLine = [
    { nx: cx - spanW / 2, ny: toBoardNy(0) },
    { nx: cx + spanW / 2, ny: toBoardNy(0) },
  ]
  const oyLine = [
    { nx: toBoardNx(0), ny: cy + spanH / 2 },
    { nx: toBoardNx(0), ny: cy - spanH / 2 },
  ]

  // Đường cong f(x)
  const curve = []
  const steps = 70
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = xMin + t * (xMax - xMin)
    const y = fn(x, a, b)
    if (Number.isFinite(y) && y >= yMin - 0.5 && y <= yMax + 0.5) {
      curve.push({ nx: toBoardNx(x), ny: toBoardNy(y) })
    }
  }

  board.insertFunctionGraphStrokes?.({
    points: curve,
    axes: [oxLine, oyLine],
    label: currentFormulaText.value,
    centerNx: cx,
    centerNy: cy,
  })
}

watch(() => board?.showFunctionGrapher, (isOpen) => {
  if (isOpen) {
    nextTick(drawGraph)
  }
})

onMounted(() => {
  nextTick(drawGraph)
})
</script>

<style scoped>
.function-grapher-window {
  position: absolute;
  z-index: 50;
  pointer-events: auto;
  user-select: none;
  border-radius: 14px;
  background: linear-gradient(175deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 1.5px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 20px rgba(56, 189, 248, 0.15);
  backdrop-filter: blur(14px);
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.fg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.7);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  cursor: grab;
}
.fg-header:active {
  cursor: grabbing;
}
.fg-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fg-title-icon {
  color: #38bdf8;
}
.fg-title {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
}
.fg-head-actions {
  display: flex;
  gap: 6px;
}
.fg-hbtn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}
.fg-hbtn:hover {
  background: #475569;
  color: #ffffff;
}
.fg-hbtn--close:hover {
  background: #dc2626;
  color: #ffffff;
}

.fg-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fg-custom-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 8px;
  padding: 6px 10px;
}
.fg-inp-prefix {
  font-size: 13.5px;
  font-weight: 800;
  color: #38bdf8;
  font-family: monospace;
}
.fg-custom-inp {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 12.5px;
  font-family: monospace;
}
.fg-clear-inp {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}
.fg-clear-inp:hover {
  color: #f87171;
}

.fg-preset-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.fg-pill {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}
.fg-pill:hover {
  border-color: #38bdf8;
  color: #ffffff;
}
.fg-pill.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.fg-sliders {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
}
.fg-slider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.slider-lbl {
  font-size: 11.5px;
  color: #cbd5e1;
  min-width: 65px;
}
.slider-lbl strong {
  color: #38bdf8;
}
.fg-range {
  flex: 1;
  accent-color: #38bdf8;
  cursor: pointer;
}

.fg-canvas-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: #090d16;
}
.fg-canvas {
  display: block;
  width: 100%;
  height: 240px;
}
.fg-coord-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 6px;
  font-size: 10.5px;
  color: #38bdf8;
  font-family: monospace;
}

.fg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.fg-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-tag {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  font-family: monospace;
}
.info-sub {
  font-size: 10px;
  color: #94a3b8;
}

.fg-insert-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: #0284c7;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.14s ease;
}
.fg-insert-btn:hover {
  background: #0369a1;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}
</style>


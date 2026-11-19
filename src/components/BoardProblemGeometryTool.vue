<template>
  <div class="board-problem-geometry-layer" @pointerdown.stop>
    <!-- =========================================================================
         1. KHUNG NHẬP ĐỀ BÀI TOÁN (FLOATING COMPOSER WIDGET)
         ========================================================================= -->
    <div
      v-if="board?.showProblemGeometryTool"
      class="pg-composer-window"
      :style="{
        left: `${composerPos.x}px`,
        top: `${composerPos.y}px`,
        width: `${composerCollapsed ? 300 : 480}px`,
      }"
      @pointerdown.stop
    >
      <!-- Header thanh kéo di chuyển -->
      <header class="pg-header" @pointerdown="onComposerHeaderDown">
        <div class="pg-title-wrap">
          <DraftingCompass :size="17" class="pg-title-icon" />
          <span class="pg-title">Vẽ hình từ đề bài toán (AI)</span>
        </div>
        <div class="pg-head-actions">
          <button
            type="button"
            class="pg-hbtn"
            :title="composerCollapsed ? 'Mở rộng' : 'Thu gọn'"
            @click="composerCollapsed = !composerCollapsed"
          >
            {{ composerCollapsed ? '▼' : '▲' }}
          </button>
          <button
            type="button"
            class="pg-hbtn pg-hbtn--close"
            title="Đóng công cụ"
            @click="board.toggleProblemGeometryTool(false)"
          >
            ✕
          </button>
        </div>
      </header>

      <div v-show="!composerCollapsed" class="pg-body">
        <!-- Chế độ vẽ: Tự động / 2D / 3D -->
        <div class="pg-mode-row">
          <span class="mode-lbl">Không gian:</span>
          <div class="mode-pills">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: selectedMode === 'auto' }"
              @click="selectedMode = 'auto'"
            >
              Tự động (Auto)
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: selectedMode === '2d' }"
              @click="selectedMode = '2d'"
            >
              Hình phẳng (2D)
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: selectedMode === '3d' }"
              @click="selectedMode = '3d'"
            >
              Không gian (3D)
            </button>
          </div>
        </div>

        <!-- Ô nhập đề bài toán -->
        <div class="pg-input-wrap">
          <textarea
            v-model="problemInput"
            class="pg-textarea"
            rows="3"
            placeholder="Nhập hoặc dán đề bài toán hình học (Ví dụ: Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA vuông góc với mặt phẳng đáy (ABCD)...)"
            :disabled="analyzing"
            @keydown.meta.enter.prevent="submitProblem"
            @keydown.ctrl.enter.prevent="submitProblem"
          />
        </div>

        <!-- Các đề bài mẫu phổ biến (1-click điền nhanh) -->
        <div class="pg-preset-samples">
          <span class="sample-title">Mẫu nhanh:</span>
          <button
            v-for="s in sampleProblems"
            :key="s.id"
            type="button"
            class="sample-chip"
            :title="s.text"
            @click="fillSample(s)"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- Thông báo lỗi nếu có -->
        <p v-if="errorText" class="pg-error" role="alert">⚠️ {{ errorText }}</p>

        <!-- Nút hành động chính: Phân tích & Vẽ hình -->
        <footer class="pg-footer">
          <small class="pg-shortcut-hint">Nhấn Ctrl+Enter để vẽ</small>
          <button
            type="button"
            class="pg-submit-btn"
            :disabled="analyzing || !problemInput.trim()"
            @click="submitProblem"
          >
            <template v-if="analyzing">
              <span class="pg-spinner" />
              <span>AI đang phân tích & dựng hình...</span>
            </template>
            <template v-else>
              <Sparkles :size="16" />
              <span>Vẽ lên canvas</span>
            </template>
          </button>
        </footer>
      </div>
    </div>

    <!-- =========================================================================
         2. CÁC KHUNG HÌNH VẼ ĐÃ TẠO TRÊN CANVAS (GEOMETRY FRAMES)
         Giống hệt khung biểu đồ: di chuyển, co giãn, xoay 3D, thanh trượt
         ========================================================================= -->
    <div
      v-for="frame in board?.problemGeometryFrames || []"
      :key="frame.id"
      class="pg-frame-container"
      :style="{
        left: `${frame.x}px`,
        top: `${frame.y}px`,
        width: `${frame.width}px`,
        height: `${frame.height}px`,
      }"
      @pointerdown.stop
    >
      <!-- Khung viền trắng 8 điểm neo vuông (giống hệt khung 3D & biểu đồ) -->
      <div class="white-selection-frame" @pointerdown="startMoveFrame(frame, $event)">
        <span class="sq-handle sq-tl" @pointerdown.stop="startResizeFrame(frame, 'tl', $event)" />
        <span class="sq-handle sq-tc" @pointerdown.stop="startMoveFrame(frame, $event)" />
        <span class="sq-handle sq-tr" @pointerdown.stop="startResizeFrame(frame, 'tr', $event)" />
        <span class="sq-handle sq-mr" @pointerdown.stop="startResizeFrame(frame, 'br', $event)" />
        <span class="sq-handle sq-br" @pointerdown.stop="startResizeFrame(frame, 'br', $event)" />
        <span class="sq-handle sq-bc" @pointerdown.stop="startResizeFrame(frame, 'br', $event)" />
        <span class="sq-handle sq-bl" @pointerdown.stop="startResizeFrame(frame, 'bl', $event)" />
        <span class="sq-handle sq-ml" @pointerdown.stop="startMoveFrame(frame, $event)" />
      </div>

      <!-- Badge tiêu đề bài toán ở góc trên -->
      <div class="pg-frame-header" @pointerdown="startMoveFrame(frame, $event)">
        <span class="pg-frame-badge">
          {{ frame.meta?.title || frame.spec?.title || 'Hình bài toán AI' }}
        </span>
        <span class="pg-frame-dim">
          {{ Math.round(frame.width) }} × {{ Math.round(frame.height) }}
        </span>
      </div>

      <!-- Canvas vẽ hình học (DynaGeo Render Engine) -->
      <canvas
        :ref="(el) => setFrameCanvasRef(frame.id, el)"
        class="pg-frame-canvas"
        :class="{ 'cursor-grab': is3dSpec(frame.spec) }"
        @pointerdown="onCanvasPointerDown(frame, $event)"
        @wheel.prevent="onCanvasWheel(frame, $event)"
      />

      <!-- Thanh trượt tham số động góc trên bên phải nếu spec có tham số -->
      <div v-if="frame.spec?.params?.length" class="pg-frame-sliders" @pointerdown.stop>
        <div v-for="p in frame.spec.params" :key="p.id" class="pg-slider-row">
          <span class="pg-slider-label">{{ p.label || p.id }}</span>
          <input
            type="range"
            :value="frame.paramValues[p.id] ?? p.value ?? 0"
            :min="p.min ?? -10"
            :max="p.max ?? 10"
            :step="p.step ?? 0.1"
            class="pg-slider-range"
            @input="onSliderInput(frame, p.id, $event)"
          />
          <span class="pg-slider-val">
            {{ Number(frame.paramValues[p.id] ?? p.value ?? 0).toFixed(1) }}
          </span>
        </div>
      </div>

      <!-- Thanh công cụ trắng dưới khung hình vẽ (giống video 00:32 & 00:45) -->
      <div class="pg-frame-toolbar" @pointerdown.stop>
        <button
          type="button"
          class="pg-tb-btn"
          title="Đặt lại góc nhìn ban đầu"
          @click="resetFrameView(frame)"
        >
          <RotateCcw :size="15" />
          <span>Đặt lại</span>
        </button>

        <button
          type="button"
          class="pg-tb-btn"
          title="Nhập lại đề bài để vẽ lại hình này"
          @click="editProblem(frame)"
        >
          <Edit3 :size="15" />
          <span>Sửa đề</span>
        </button>

        <span class="pg-tb-sep" />

        <button
          type="button"
          class="pg-tb-btn pg-tb-btn--del"
          title="Xóa khung hình khỏi canvas"
          @click="board.removeProblemGeometryFrame(frame.id)"
        >
          <Trash2 :size="15" />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, nextTick, watch } from 'vue'
import {
  DraftingCompass,
  Sparkles,
  RotateCcw,
  Edit3,
  Trash2,
} from '@lucide/vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import { getSpecParams, renderDrawSpec } from '@/modules/draw.min.js'

const board = inject(WRITING_BOARD_KEY)

// Trạng thái khung nhập đề bài (Composer)
const composerCollapsed = ref(false)
const composerPos = reactive({ x: 140, y: 80 })
const problemInput = ref('')
const selectedMode = ref('auto')
const analyzing = ref(false)
const errorText = ref('')

// Map lưu tham chiếu canvas của từng khung hình
const canvasMap = reactive({})

// Danh sách đề bài mẫu phổ biến
const sampleProblems = [
  {
    id: 'pyramid_sa_perp',
    label: '🏛️ Chóp S.ABCD (SA ⊥ đáy)',
    text: 'Cho hình chóp S.ABCD có đáy ABCD là hình bình hành. Cạnh bên SA vuông góc với mặt phẳng đáy (ABCD). Gọi M là trung điểm của SC.',
    mode: '3d',
  },
  {
    id: 'prism_tri',
    label: '💎 Lăng trụ đứng ABC.A\'B\'C\'',
    text: 'Cho lăng trụ đứng tam giác ABC.A\'B\'C\' có đáy ABC là tam giác đều. Gọi M là trung điểm của BC.',
    mode: '3d',
  },
  {
    id: 'right_triangle_ah',
    label: '📐 Tam giác vuông (AH ⊥ BC)',
    text: 'Cho tam giác ABC vuông tại A có đường cao AH. Gọi M là trung điểm của cạnh huyền BC.',
    mode: '2d',
  },
  {
    id: 'tetrahedron',
    label: '⛰️ Tứ diện đều ABCD',
    text: 'Cho tứ diện đều ABCD cạnh a. Gọi G là trọng tâm của tam giác BCD, H là hình chiếu của A lên (BCD).',
    mode: '3d',
  },
  {
    id: 'trapezoid',
    label: '⏢ Hình thang cân ABCD',
    text: 'Cho hình thang cân ABCD có hai đáy AB và CD (AB song song CD). Hai đường chéo AC và BD cắt nhau tại O.',
    mode: '2d',
  },
]

function fillSample(s) {
  problemInput.value = s.text
  if (s.mode) selectedMode.value = s.mode
}

function setFrameCanvasRef(id, el) {
  if (el) {
    canvasMap[id] = el
    nextTick(() => {
      const frame = board?.problemGeometryFrames?.find(f => f.id === id)
      if (frame) renderFrame(frame)
    })
  } else {
    delete canvasMap[id]
  }
}

function is3dSpec(spec) {
  if (!spec) return false
  if (spec.meta?.dimension === '3d' || spec.dimension === '3d') return true
  // Kiểm tra xem các điểm có tọa độ z không
  return Boolean(spec.objects?.some(o => o.z !== undefined || o.type?.startsWith('3d_') || o.type === 'polyhedron'))
}

function buildParamValues(spec) {
  const base = getSpecParams(spec)
  const out = {}
  for (const p of spec?.params || []) {
    if (!p?.id) continue
    out[p.id] = base[p.id] ?? Number(p.value) ?? 0
  }
  return out
}

// -------------------------------------------------------------
// GỬI PHÂN TÍCH ĐỀ BÀI VÀ TẠO KHUNG HÌNH VẼ TRÊN CANVAS
// -------------------------------------------------------------
async function submitProblem() {
  const text = problemInput.value.trim()
  if (!text || analyzing.value) return
  analyzing.value = true
  errorText.value = ''

  try {
    const data = await api.draw.analyze({
      problem: text,
      mode: selectedMode.value,
    })

    const spec = data.spec
    if (!spec) {
      errorText.value = 'AI không thể tạo hình vẽ từ đề bài này. Vui lòng kiểm tra lại câu chữ mô tả hình học.'
      return
    }

    const paramValues = buildParamValues(spec)
    const newFrame = board.addProblemGeometryFrame({
      problem: text,
      spec,
      meta: data.meta,
      paramValues,
      width: 480,
      height: 380,
    })

    // Tự động thu gọn composer để người dùng tập trung vào khung hình vẽ
    composerCollapsed.value = true

    nextTick(() => {
      renderFrame(newFrame)
    })
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err) : (err.message || 'Lỗi khi phân tích đề bài toán.')
  } finally {
    analyzing.value = false
  }
}

function editProblem(frame) {
  problemInput.value = frame.problem
  board.showProblemGeometryTool = true
  composerCollapsed.value = false
}

// -------------------------------------------------------------
// RENDER KHUNG HÌNH VẼ VỚI DYNAGEO RENDER ENGINE
// -------------------------------------------------------------
function renderFrame(frame) {
  if (!frame) return
  const canvas = canvasMap[frame.id]
  if (!canvas || !frame.spec) return

  const w = Math.max(260, Math.round(frame.width))
  const h = Math.max(200, Math.round(frame.height - 48))

  const renderSpec = {
    ...frame.spec,
    canvas: {
      ...(frame.spec.canvas || {}),
      width: w,
      height: h,
      background: '#1a1f26',
    },
  }

  const vals = { ...getSpecParams(frame.spec, frame.paramValues), ...frame.paramValues }
  try {
    renderDrawSpec(canvas, renderSpec, vals, frame.view)
  } catch (err) {
    console.warn('[BoardProblemGeometryTool] renderDrawSpec error:', err)
  }
}

function onSliderInput(frame, paramId, e) {
  if (!frame.paramValues) frame.paramValues = {}
  frame.paramValues[paramId] = Number(e.target.value)
  renderFrame(frame)
}

function resetFrameView(frame) {
  frame.view = {
    yaw: 35,
    pitch: -20,
    roll: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
  }
  renderFrame(frame)
}

// -------------------------------------------------------------
// XOAY 3D / PAN 2D TRÊN CANVAS CỦA KHUNG
// -------------------------------------------------------------
function onCanvasPointerDown(frame, e) {
  if (e.button !== 0) return
  const is3D = is3dSpec(frame.spec)
  const startX = e.clientX
  const startY = e.clientY

  if (is3D) {
    const initYaw = frame.view.yaw ?? 35
    const initPitch = frame.view.pitch ?? -20

    function onMove(me) {
      frame.view.yaw = initYaw + (me.clientX - startX) * 0.55
      frame.view.pitch = Math.max(-85, Math.min(85, initPitch + (me.clientY - startY) * 0.55))
      renderFrame(frame)
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  } else {
    const initPanX = frame.view.panX ?? 0
    const initPanY = frame.view.panY ?? 0

    function onMove(me) {
      frame.view.panX = initPanX + (me.clientX - startX)
      frame.view.panY = initPanY + (me.clientY - startY)
      renderFrame(frame)
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
}

function onCanvasWheel(frame, e) {
  const delta = e.deltaY > 0 ? 0.92 : 1.08
  frame.view.zoom = Math.max(0.25, Math.min(4.5, (frame.view.zoom || 1) * delta))
  renderFrame(frame)
}

// -------------------------------------------------------------
// KÉO DI CHUYỂN & CO GIÃN KHUNG HÌNH (DRAG & RESIZE)
// -------------------------------------------------------------
function onComposerHeaderDown(e) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = composerPos.x
  const initY = composerPos.y

  function onMove(me) {
    composerPos.x = initX + (me.clientX - startX)
    composerPos.y = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function startMoveFrame(frame, e) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = frame.x
  const initY = frame.y

  function onMove(me) {
    frame.x = initX + (me.clientX - startX)
    frame.y = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function startResizeFrame(frame, handle, e) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const initW = frame.width
  const initH = frame.height
  const initX = frame.x
  const initY = frame.y

  function onMove(me) {
    const dx = me.clientX - startX
    const dy = me.clientY - startY

    if (handle === 'br') {
      frame.width = Math.max(280, initW + dx)
      frame.height = Math.max(220, initH + dy)
    } else if (handle === 'bl') {
      frame.width = Math.max(280, initW - dx)
      frame.x = initX + dx
      frame.height = Math.max(220, initH + dy)
    } else if (handle === 'tr') {
      frame.width = Math.max(280, initW + dx)
      frame.height = Math.max(220, initH - dy)
      frame.y = initY + dy
    } else if (handle === 'tl') {
      frame.width = Math.max(280, initW - dx)
      frame.x = initX + dx
      frame.height = Math.max(220, initH - dy)
      frame.y = initY + dy
    }
    renderFrame(frame)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

watch(
  () => board?.problemGeometryFrames,
  (frames) => {
    nextTick(() => {
      for (const f of frames || []) renderFrame(f)
    })
  },
  { deep: true },
)

onMounted(() => {
  nextTick(() => {
    for (const f of board?.problemGeometryFrames || []) renderFrame(f)
  })
})
</script>

<style scoped>
.board-problem-geometry-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 48;
  overflow: visible;
}

/* =========================================================================
   1. KHUNG NHẬP ĐỀ BÀI (COMPOSER WINDOW)
   ========================================================================= */
.pg-composer-window {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  border-radius: 14px;
  background: linear-gradient(175deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), 0 0 24px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(16px);
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.pg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.7);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  cursor: grab;
}
.pg-header:active {
  cursor: grabbing;
}
.pg-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pg-title-icon {
  color: #38bdf8;
}
.pg-title {
  font-size: 13.5px;
  font-weight: 750;
  color: #f1f5f9;
}
.pg-head-actions {
  display: flex;
  gap: 6px;
}
.pg-hbtn {
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
.pg-hbtn:hover {
  background: #475569;
  color: #ffffff;
}
.pg-hbtn--close:hover {
  background: #dc2626;
  color: #ffffff;
}

.pg-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pg-mode-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mode-lbl {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
}
.mode-pills {
  display: flex;
  gap: 6px;
}
.mode-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}
.mode-btn:hover {
  border-color: #38bdf8;
  color: #ffffff;
}
.mode-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.pg-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1.5px solid rgba(148, 163, 184, 0.25);
  color: #f8fafc;
  font-size: 12.5px;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
.pg-textarea:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.pg-preset-samples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.sample-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}
.sample-chip {
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.6);
  color: #cbd5e1;
  font-size: 10.5px;
  cursor: pointer;
  transition: all 0.12s ease;
}
.sample-chip:hover {
  background: #334155;
  color: #ffffff;
  border-color: #38bdf8;
}

.pg-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid #dc2626;
  color: #fca5a5;
  font-size: 11.5px;
}

.pg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.pg-shortcut-hint {
  font-size: 10.5px;
  color: #64748b;
}
.pg-submit-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
  transition: all 0.15s ease;
}
.pg-submit-btn:hover:not(:disabled) {
  opacity: 0.95;
  box-shadow: 0 4px 20px rgba(2, 132, 199, 0.55);
}
.pg-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pg-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================================================================
   2. KHUNG HÌNH VẼ TRÊN CANVAS (GEOMETRY FRAMES)
   ========================================================================= */
.pg-frame-container {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  background: #1a1f26;
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  overflow: visible;
  font-family: system-ui, sans-serif;
}

/* Khung viền trắng 8 điểm neo */
.white-selection-frame {
  position: absolute;
  inset: -2px;
  border: 1.5px solid #ffffff;
  pointer-events: auto;
  cursor: move;
  z-index: 10;
}
.sq-handle {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #ffffff;
  border: 1px solid #0f172a;
  box-sizing: border-box;
}
.sq-tl { top: -5px; left: -5px; cursor: nwse-resize; }
.sq-tc { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.sq-tr { top: -5px; right: -5px; cursor: nesw-resize; }
.sq-mr { top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize; }
.sq-br { bottom: -5px; right: -5px; cursor: nwse-resize; }
.sq-bc { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.sq-bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
.sq-ml { top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize; }

.pg-frame-header {
  position: absolute;
  top: 6px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 8;
  pointer-events: auto;
  cursor: move;
}
.pg-frame-badge {
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  font-size: 11px;
  font-weight: 700;
}
.pg-frame-dim {
  font-size: 9.5px;
  color: #64748b;
  font-family: monospace;
}

.pg-frame-canvas {
  display: block;
  width: 100%;
  height: calc(100% - 44px);
  border-radius: 6px 6px 0 0;
  touch-action: none;
}
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}

/* Thanh trượt tham số góc trên bên phải khung */
.pg-frame-sliders {
  position: absolute;
  top: 32px;
  right: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 9;
}
.pg-slider-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-slider-label {
  font-size: 10px;
  color: #cbd5e1;
  font-weight: 700;
  min-width: 20px;
}
.pg-slider-range {
  width: 80px;
  height: 4px;
  accent-color: #38bdf8;
  cursor: pointer;
}
.pg-slider-val {
  font-size: 9.5px;
  color: #38bdf8;
  font-family: monospace;
}

/* Thanh công cụ trắng dưới khung hình */
.pg-frame-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #ffffff;
  border-radius: 0 0 6px 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  gap: 8px;
  z-index: 12;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
}
.pg-tb-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.12s ease;
}
.pg-tb-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.pg-tb-btn--del {
  color: #dc2626;
  border-color: #fecaca;
  background: #fff1f2;
}
.pg-tb-btn--del:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.pg-tb-sep {
  width: 1px;
  height: 18px;
  background: #cbd5e1;
}
</style>


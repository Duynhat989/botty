<template>
  <div class="board-teaching-tools-layer" @pointerdown.stop>
    <!-- ==================== 1. THƯỚC THẲNG ĐIỆN TỬ (INTERACTIVE RULER) ==================== -->
    <div
      v-if="board.showRuler"
      class="ruler-container"
      :style="{
        left: `${board.rulerState.x}px`,
        top: `${board.rulerState.y}px`,
        transform: `translate(-50%, -50%) rotate(${board.rulerState.angle}deg)`,
      }"
      @pointerdown="onRulerBodyDown"
    >
      <div class="ruler-body" :style="{ width: `${board.rulerState.length}px` }">
        <!-- Vùng kéo kẻ trực tiếp trên mép thước kẻ -->
        <div
          class="ruler-top-draw-track"
          title="Kéo dọc mép thước để kẻ một đoạn thẳng thẳng tắp đo độ dài chuẩn"
          @pointerdown.stop="onRulerEdgeTrackDown"
        >
          <span class="track-hint">✏️ Kéo dọc mép thước để kẻ thẳng</span>
        </div>

        <!-- Vạch chia đơn vị dọc mép trên -->
        <div class="ruler-scale">
          <div
            v-for="idx in totalTicks"
            :key="idx"
            class="scale-tick"
            :class="{
              'tick-major': (idx - 1) % 10 === 0,
              'tick-half': (idx - 1) % 5 === 0 && (idx - 1) % 10 !== 0,
              'tick-minor': (idx - 1) % 5 !== 0,
            }"
          >
            <span v-if="(idx - 1) % 10 === 0 && (idx - 1) / 10 <= maxUnits" class="tick-num">
              {{ (idx - 1) / 10 }}
            </span>
          </div>
        </div>

        <!-- Vùng trung tâm: Khối xoay độ & góc nghiêng -->
        <div class="ruler-center-hub" @pointerdown.stop="onDialPointerDown">
          <div class="hub-dial" :title="`Góc nghiêng: ${Math.round(board.rulerState.angle)}°. Kéo xoay để đổi góc`">
            <span class="hub-angle">{{ Math.round(board.rulerState.angle) }}°</span>
            <div
              class="hub-pointer"
              :style="{ transform: `rotate(${board.rulerState.angle}deg)` }"
            />
          </div>
        </div>

        <!-- Nút thao tác nhanh trên thước -->
        <div class="ruler-quick-actions" @pointerdown.stop>
          <button
            type="button"
            class="rq-btn primary"
            title="Kẻ một đoạn thẳng chuẩn xác theo mép thước lên bảng"
            @click="board.drawRulerLine()"
          >
            ✏️ Kẻ đường thẳng
          </button>
          <button
            type="button"
            class="rq-btn"
            title="Xoay ngang (0°)"
            @click="setRulerAngle(0)"
          >
            0°
          </button>
          <button
            type="button"
            class="rq-btn"
            title="Xoay chéo (45°)"
            @click="setRulerAngle(45)"
          >
            45°
          </button>
          <button
            type="button"
            class="rq-btn"
            title="Xoay dọc (90°)"
            @click="setRulerAngle(90)"
          >
            90°
          </button>
          <button
            type="button"
            class="rq-btn rq-btn--close"
            title="Đóng thước kẻ"
            @click="board.toggleRuler(false)"
          >
            ✕
          </button>
        </div>

        <!-- ==================== CÀI ĐẶT BÊN PHẢI CỦA THƯỚC: NGANG / DỌC & ĐƠN VỊ ==================== -->
        <div class="ruler-right-dock" @pointerdown.stop>
          <div class="rrd-align-group">
            <button
              type="button"
              class="rrd-btn"
              :class="{ active: board.rulerState.alignMode === 'horizontal' }"
              title="Khóa thước nằm ngang (0°). Khi di chuyển thước sẽ giữ thẳng ngang"
              @click="setAlign('horizontal')"
            >
              <span class="rrd-icon">↔️</span>
              <span class="rrd-text">Ngang</span>
            </button>
            <button
              type="button"
              class="rrd-btn"
              :class="{ active: board.rulerState.alignMode === 'vertical' }"
              title="Khóa thước thẳng đứng (90°). Khi di chuyển thước sẽ giữ thẳng dọc"
              @click="setAlign('vertical')"
            >
              <span class="rrd-icon">↕️</span>
              <span class="rrd-text">Dọc</span>
            </button>
            <button
              type="button"
              class="rrd-btn"
              :class="{ active: board.rulerState.alignMode === 'free' }"
              title="Xoay tự do góc bất kỳ"
              @click="setAlign('free')"
            >
              <span class="rrd-icon">🔄</span>
              <span class="rrd-text">Tự do</span>
            </button>
          </div>

          <div class="rrd-unit-group">
            <span class="rrd-unit-title">Đơn vị:</span>
            <div class="rrd-unit-pills">
              <button
                v-for="u in ['cm', 'mm', 'dm', 'm', 'đv']"
                :key="u"
                type="button"
                class="rrd-unit-pill"
                :class="{ active: board.boardUnit === u }"
                @click="board.setBoardUnit(u)"
              >
                {{ u }}
              </button>
            </div>
          </div>

          <div class="rrd-length-badge" :title="`Chiều dài thước: ${board.formatBoardLength(board.rulerState.length)}`">
            <span>Dài: <strong>{{ board.formatBoardLength(board.rulerState.length) }}</strong></span>
            <div class="rrd-sz-btns">
              <button
                type="button"
                class="rrd-sz-btn"
                title="Thu ngắn thước"
                @click="adjustRulerLength(-37.8)"
              >
                -
              </button>
              <button
                type="button"
                class="rrd-sz-btn"
                title="Kéo dài thước"
                @click="adjustRulerLength(37.8)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== BADGE ĐO ĐỘ DÀI THỜI GIAN THỰC (KHI VẼ DỌC THEO THƯỚC) ==================== -->
    <div
      v-if="board.rulerDrawingLive?.active"
      class="ruler-live-measure-badge"
      :style="{
        left: `${board.rulerDrawingLive.px}px`,
        top: `${board.rulerDrawingLive.py - 34}px`,
      }"
    >
      📏 Độ dài: <strong>{{ board.rulerDrawingLive.text }}</strong>
    </div>

    <!-- ==================== 2. COMPA ĐIỆN TỬ (INTERACTIVE DRAFTING COMPASS) ==================== -->
    <div
      v-if="board.showCompass"
      class="compass-container"
      :style="{
        left: `${board.compassState.centerX}px`,
        top: `${board.compassState.centerY}px`,
      }"
      @pointerdown.stop
    >
      <!-- Khung vẽ SVG hai chân kim loại và núm xoay compa -->
      <svg
        class="compass-svg"
        :style="{
          transform: `rotate(${board.compassState.angle}deg)`,
        }"
        :width="Math.max(200, board.compassState.radius + 80)"
        height="180"
        viewBox="-40 -160 380 180"
      >
        <defs>
          <linearGradient id="metalLeg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="50%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="brassJoint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>

        <!-- Thanh cung nối điều chỉnh giữa 2 chân -->
        <path
          :d="`M 10,-45 Q ${board.compassState.radius / 2},-25 ${board.compassState.radius - 10},-45`"
          fill="none"
          stroke="rgba(148, 163, 184, 0.45)"
          stroke-width="2.5"
        />
        <!-- Ốc vặn điều chỉnh ở giữa thanh cung -->
        <circle
          :cx="board.compassState.radius / 2"
          cy="-32"
          r="6"
          fill="url(#brassJoint)"
          stroke="#78350f"
          stroke-width="1"
        />

        <!-- Chân kim (Needle leg: từ đỉnh xuống tâm O (0, 0)) -->
        <path
          :d="`M ${board.compassState.radius / 2},-125 L -2,-4 L 0,0 L 2,-4 Z`"
          fill="url(#metalLeg)"
          stroke="#475569"
          stroke-width="1.2"
        />
        <!-- Mũi kim thép nhọn -->
        <line x1="0" y1="-8" x2="0" y2="0" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />

        <!-- Chân chì (Pencil leg: từ đỉnh xuống chân chì (R, 0)) -->
        <path
          :d="`M ${board.compassState.radius / 2},-125 L ${board.compassState.radius - 4},-12 L ${board.compassState.radius},0 L ${board.compassState.radius + 4},-12 Z`"
          fill="url(#metalLeg)"
          stroke="#475569"
          stroke-width="1.2"
        />
        <!-- Đầu ngòi bút chì compa mang màu vẽ active của bảng -->
        <polygon
          :points="`${board.compassState.radius - 3},-12 ${board.compassState.radius + 3},-12 ${board.compassState.radius},0`"
          :fill="board.penColor || '#38bdf8'"
        />

        <!-- Khớp bản lề compa ở đỉnh -->
        <circle
          :cx="board.compassState.radius / 2"
          cy="-125"
          r="10"
          fill="url(#brassJoint)"
          stroke="#78350f"
          stroke-width="1.5"
        />
        <circle :cx="board.compassState.radius / 2" cy="-125" r="4" fill="#0f172a" />

        <!-- Núm xoay đỉnh compa (Top Knob Handle) -->
        <rect
          :x="board.compassState.radius / 2 - 4"
          y="-152"
          width="8"
          height="22"
          rx="3"
          fill="#334155"
          stroke="#94a3b8"
          stroke-width="1"
          class="compass-top-knob"
          @pointerdown.stop="onCompassHingeDown"
        />
      </svg>

      <!-- ==================== TÂM O (NEEDLE ORIGIN) ==================== -->
      <div
        class="compass-center-needle"
        title="Tâm O: Kéo để đặt tâm compa vào bất kỳ điểm nào trên bảng"
        @pointerdown.stop="onCompassCenterDown"
      >
        <span class="needle-reticle-h" />
        <span class="needle-reticle-v" />
        <span class="needle-reticle-dot" />
        <div class="needle-label">Tâm O</div>
      </div>

      <!-- ==================== CHÂN CHÌ: KÉO CHỈNH BÁN KÍNH & VÒNG QUÉT XOAY ==================== -->
      <div
        class="compass-pencil-head"
        :style="{
          transform: `rotate(${board.compassState.angle}deg) translate(${board.compassState.radius}px, 0px)`,
        }"
      >
        <!-- Vòng quét xoay compa (kéo để vẽ cung hoặc đường tròn trực tiếp) -->
        <div
          class="compass-sweep-ring"
          title="Kéo xoay quanh tâm O để vẽ cung hoặc đường tròn trên bảng"
          @pointerdown.stop="onCompassSweepDown"
        >
          <span class="sweep-icon">🔄</span>
        </div>

        <!-- Núm kéo chỉnh bán kính R -->
        <div
          class="compass-radius-knob"
          title="Kéo ngang để tăng giảm bán kính R"
          @pointerdown.stop="onCompassRadiusDown"
        >
          <span class="radius-arrows">↔</span>
        </div>

        <!-- Badge hiển thị bán kính live -->
        <div class="compass-radius-badge">
          R: <strong>{{ board.formatBoardLength(board.compassState.radius) }}</strong>
          <span v-if="isCompassDrawing" class="compass-sweep-deg">
            ({{ Math.round(Math.abs(compassSweepAngle)) }}°)
          </span>
        </div>
      </div>

      <!-- ==================== THANH CÔNG CỤ ĐIỀU KHIỂN COMPA ==================== -->
      <div class="compass-hud-panel" @pointerdown.stop>
        <header class="chp-header">
          <span class="chp-title">🧭 Compa điện tử</span>
          <span class="chp-unit-tag">{{ board.boardUnit }}</span>
          <button
            type="button"
            class="chp-btn-close"
            title="Đóng compa"
            @click="board.toggleCompass(false)"
          >
            ✕
          </button>
        </header>

        <!-- Các nút chọn nhanh bán kính R chuẩn -->
        <div class="chp-row">
          <span class="chp-label">Bán kính R:</span>
          <div class="chp-presets">
            <button
              v-for="preset in radiusPresets"
              :key="preset.val"
              type="button"
              class="chp-preset-btn"
              :class="{ active: Math.abs(board.pxToUnit(board.compassState.radius) - preset.val) < 0.2 }"
              @click="setCompassRadiusPreset(preset.val)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="chp-steppers">
            <button
              type="button"
              class="chp-step-btn"
              title="Giảm bán kính 0.5 đơn vị"
              @click="adjustCompassRadius(-0.5)"
            >
              -
            </button>
            <button
              type="button"
              class="chp-step-btn"
              title="Tăng bán kính 0.5 đơn vị"
              @click="adjustCompassRadius(0.5)"
            >
              +
            </button>
          </div>
        </div>

        <!-- Các nút vẽ nhanh đường tròn & cung tròn -->
        <div class="chp-actions-row">
          <button
            type="button"
            class="chp-action-btn primary"
            title="Vẽ một đường tròn hoàn chỉnh 360°"
            @click="quickDrawCircle(360)"
          >
            ⭕ Vẽ tròn 360°
          </button>
          <button
            type="button"
            class="chp-action-btn"
            title="Vẽ nửa đường tròn 180°"
            @click="quickDrawCircle(180)"
          >
            🌙 Nửa tròn 180°
          </button>
          <button
            type="button"
            class="chp-action-btn"
            title="Vẽ cung góc vuông 90°"
            @click="quickDrawCircle(90)"
          >
            📐 Cung 90°
          </button>
          <button
            type="button"
            class="chp-action-btn"
            :class="{ active: board.compassState.mode === 'pickCenter' }"
            title="Nhấp vào bất kỳ điểm nào trên bảng để đặt tâm O"
            @click="board.compassState.mode = board.compassState.mode === 'pickCenter' ? 'free' : 'pickCenter'"
          >
            🎯 {{ board.compassState.mode === 'pickCenter' ? 'Click bảng...' : 'Chọn tâm O' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 3. THƯỚC ĐO ĐỘ (INTERACTIVE PROTRACTOR 180°) ==================== -->
    <div
      v-if="board.showProtractor"
      class="protractor-container"
      :style="{
        left: `${board.protractorState.x}px`,
        top: `${board.protractorState.y}px`,
        transform: `translate(-50%, -100%) rotate(${board.protractorState.angle}deg)`,
      }"
      @pointerdown="onProtractorBodyDown"
    >
      <div
        class="protractor-body"
        :style="{
          width: `${board.protractorState.radius * 2}px`,
          height: `${board.protractorState.radius}px`,
        }"
      >
        <!-- Vòng cung độ hình bán nguyệt (0° đến 180°) -->
        <svg
          class="protractor-svg"
          :viewBox="`0 0 ${board.protractorState.radius * 2} ${board.protractorState.radius}`"
        >
          <!-- Cung viền ngoài -->
          <path
            :d="`M 10,${board.protractorState.radius} A ${board.protractorState.radius - 10} ${board.protractorState.radius - 10} 0 0 1 ${board.protractorState.radius * 2 - 10},${board.protractorState.radius}`"
            fill="none"
            stroke="rgba(148, 163, 184, 0.45)"
            stroke-width="1.5"
          />
          <!-- Đáy thước -->
          <line
            x1="10"
            :y1="board.protractorState.radius - 1"
            :x2="board.protractorState.radius * 2 - 10"
            :y2="board.protractorState.radius - 1"
            stroke="rgba(148, 163, 184, 0.6)"
            stroke-width="1.8"
          />

          <!-- Các vạch độ từ 0 đến 180 -->
          <g v-for="deg in 181" :key="`deg-${deg - 1}`">
            <line
              v-if="(deg - 1) % 5 === 0"
              :x1="calcTick(deg - 1, 0).x"
              :y1="calcTick(deg - 1, 0).y"
              :x2="calcTick(deg - 1, (deg - 1) % 10 === 0 ? 14 : 8).x"
              :y2="calcTick(deg - 1, (deg - 1) % 10 === 0 ? 14 : 8).y"
              :stroke="(deg - 1) % 10 === 0 ? '#38bdf8' : 'rgba(255,255,255,0.45)'"
              :stroke-width="(deg - 1) % 10 === 0 ? 1.5 : 0.9"
            />
            <!-- Số đo góc mỗi 30 độ -->
            <text
              v-if="(deg - 1) % 30 === 0"
              :x="calcTick(deg - 1, 24).x"
              :y="calcTick(deg - 1, 24).y"
              fill="#e2e8f0"
              font-size="9"
              font-family="system-ui, sans-serif"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ deg - 1 }}°
            </text>
          </g>

          <!-- Kim đo góc có thể kéo xoay -->
          <line
            :x1="board.protractorState.radius"
            :y1="board.protractorState.radius"
            :x2="calcTick(board.protractorState.needleAngle, 6).x"
            :y2="calcTick(board.protractorState.needleAngle, 6).y"
            stroke="#f59e0b"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <!-- Cung đánh dấu góc đang đo -->
          <path
            :d="calcAngleArc(board.protractorState.needleAngle)"
            fill="rgba(245, 158, 11, 0.2)"
            stroke="#f59e0b"
            stroke-width="1.5"
          />
        </svg>

        <!-- Tâm thước hình chữ thập (+) đặt vào đỉnh góc cần đo -->
        <div class="protractor-center-origin" title="Tâm O: Đặt vào đỉnh góc cần đo">
          <span class="origin-cross-h" />
          <span class="origin-cross-v" />
          <span class="origin-dot" />
        </div>

        <!-- Núm kéo kim đo góc -->
        <div
          class="needle-knob"
          :style="{
            left: `${calcTick(board.protractorState.needleAngle, 2).x}px`,
            top: `${calcTick(board.protractorState.needleAngle, 2).y}px`,
          }"
          title="Kéo để đo số đo góc"
          @pointerdown.stop="onNeedlePointerDown"
        >
          <span class="needle-badge">{{ Math.round(board.protractorState.needleAngle) }}°</span>
        </div>

        <!-- Menu thao tác nhanh thước đo độ -->
        <div class="protractor-actions" @pointerdown.stop>
          <button type="button" class="pt-btn" @click="board.protractorState.needleAngle = 30">30°</button>
          <button type="button" class="pt-btn" @click="board.protractorState.needleAngle = 45">45°</button>
          <button type="button" class="pt-btn" @click="board.protractorState.needleAngle = 60">60°</button>
          <button type="button" class="pt-btn" @click="board.protractorState.needleAngle = 90">90°</button>
          <button type="button" class="pt-btn" @click="board.protractorState.needleAngle = 120">120°</button>
          <button
            type="button"
            class="pt-btn pt-btn--close"
            title="Đóng thước đo độ"
            @click="board.toggleProtractor(false)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed, ref } from 'vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const board = inject(WRITING_BOARD_KEY)

// Chiều dài vạch của thước kẻ
const totalTicks = computed(() => {
  const len = board?.rulerState?.length || 378
  // Chia khoảng 14px một vạch nhỏ
  return Math.max(10, Math.floor(len / 14))
})
const maxUnits = computed(() => Math.floor(totalTicks.value / 10))

// -------------------------------------------------------------
// THƯỚC THẲNG: KÉO, CĂN CHỈNH NGANG / DỌC & KẺ DỌC MÉP
// -------------------------------------------------------------
function setAlign(mode) {
  if (!board) return
  board.setRulerAlignMode?.(mode)
}

function setRulerAngle(deg) {
  if (!board?.rulerState) return
  board.rulerState.angle = deg
  if (deg === 0) board.rulerState.alignMode = 'horizontal'
  else if (deg === 90) board.rulerState.alignMode = 'vertical'
  else board.rulerState.alignMode = 'free'
}

function adjustRulerLength(deltaPx) {
  if (!board?.rulerState) return
  board.rulerState.length = Math.max(180, Math.min(900, board.rulerState.length + deltaPx))
}

function onRulerBodyDown(e) {
  if (e.button !== 0 || !board?.rulerState) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = board.rulerState.x
  const initY = board.rulerState.y

  function onMove(me) {
    board.rulerState.x = initX + (me.clientX - startX)
    board.rulerState.y = initY + (me.clientY - startY)
    if (board.rulerState.alignMode === 'horizontal') {
      board.rulerState.angle = 0
    } else if (board.rulerState.alignMode === 'vertical') {
      board.rulerState.angle = 90
    }
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onDialPointerDown(e) {
  if (e.button !== 0 || !board?.rulerState) return
  const center = { x: board.rulerState.x, y: board.rulerState.y }

  function onMove(me) {
    const dx = me.clientX - center.x
    const dy = me.clientY - center.y
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (deg < 0) deg += 360
    // Snap to 15 degrees if close
    const nearest15 = Math.round(deg / 15) * 15
    if (Math.abs(deg - nearest15) < 3.5) deg = nearest15

    board.rulerState.angle = deg
    board.rulerState.alignMode = deg === 0 ? 'horizontal' : deg === 90 ? 'vertical' : 'free'
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onRulerEdgeTrackDown(e) {
  if (e.button !== 0 || !board?.rulerState) return
  const { x, y, angle, length } = board.rulerState
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const topEdgeCx = x + 34 * sin
  const topEdgeCy = y - 34 * cos
  const half = length / 2

  const startX = e.clientX
  const startY = e.clientY
  const sDx = startX - topEdgeCx
  const sDy = startY - topEdgeCy
  const startTau = Math.max(-half, Math.min(half, sDx * cos + sDy * sin))
  let curTau = startTau

  const p1x = topEdgeCx + startTau * cos
  const p1y = topEdgeCy + startTau * sin

  board.rulerDrawingLive.active = true
  board.rulerDrawingLive.px = p1x
  board.rulerDrawingLive.py = p1y
  board.rulerDrawingLive.lengthPx = 0
  board.rulerDrawingLive.text = board.formatBoardLength(0)

  function onMove(me) {
    const dx = me.clientX - topEdgeCx
    const dy = me.clientY - topEdgeCy
    curTau = Math.max(-half, Math.min(half, dx * cos + dy * sin))
    const curX = topEdgeCx + curTau * cos
    const curY = topEdgeCy + curTau * sin
    const lenPx = Math.abs(curTau - startTau)
    board.rulerDrawingLive.px = curX
    board.rulerDrawingLive.py = curY
    board.rulerDrawingLive.lengthPx = lenPx
    board.rulerDrawingLive.text = board.formatBoardLength(lenPx)
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    const lenPx = Math.abs(curTau - startTau)
    if (lenPx > 6) {
      const p2x = topEdgeCx + curTau * cos
      const p2y = topEdgeCy + curTau * sin
      const ann = board.overlayRef?.value
      const w = ann?.width || window.innerWidth
      const h = ann?.height || window.innerHeight
      board.strokes.value.push({
        id: board.nextWritingStrokeId ? board.nextWritingStrokeId() : `stroke_${Date.now()}`,
        color: board.penColor?.value || '#ffffff',
        width: board.penWidth?.value || 3,
        points: [
          { nx: Math.max(0, Math.min(1, p1x / w)), ny: Math.max(0, Math.min(1, p1y / h)) },
          { nx: Math.max(0, Math.min(1, p2x / w)), ny: Math.max(0, Math.min(1, p2y / h)) },
        ],
      })
      board.recordAction?.(`Vẽ đoạn thẳng ${board.formatBoardLength(lenPx)} theo thước kẻ`)
      board.repaint?.()
    }
    board.rulerDrawingLive.active = false
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// -------------------------------------------------------------
// COMPA (INTERACTIVE COMPASS)
// -------------------------------------------------------------
const compassSweepAngle = ref(0)
const isCompassDrawing = ref(false)

const radiusPresets = computed(() => {
  const u = board?.boardUnit || 'cm'
  if (u === 'mm') {
    return [
      { val: 20, label: '20 mm' },
      { val: 35, label: '35 mm' },
      { val: 50, label: '50 mm' },
      { val: 80, label: '80 mm' },
    ]
  }
  if (u === 'm') {
    return [
      { val: 0.05, label: '0.05 m' },
      { val: 0.1, label: '0.1 m' },
      { val: 0.15, label: '0.15 m' },
    ]
  }
  return [
    { val: 2, label: `2 ${u}` },
    { val: 3.5, label: `3.5 ${u}` },
    { val: 5, label: `5 ${u}` },
    { val: 8, label: `8 ${u}` },
  ]
})

function setCompassRadiusPreset(valInUnit) {
  if (!board?.compassState || !board.unitToPx) return
  board.compassState.radius = Math.max(25, Math.min(480, board.unitToPx(valInUnit)))
}

function adjustCompassRadius(deltaUnit) {
  if (!board?.compassState || !board.pxToUnit || !board.unitToPx) return
  const curUnit = board.pxToUnit(board.compassState.radius)
  const nextUnit = Math.max(0.5, curUnit + deltaUnit)
  board.compassState.radius = Math.max(25, Math.min(480, board.unitToPx(nextUnit)))
}

function onCompassCenterDown(e) {
  if (e.button !== 0 || !board?.compassState) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = board.compassState.centerX
  const initY = board.compassState.centerY

  function onMove(me) {
    board.compassState.centerX = initX + (me.clientX - startX)
    board.compassState.centerY = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onCompassHingeDown(e) {
  onCompassCenterDown(e)
}

function onCompassRadiusDown(e) {
  if (e.button !== 0 || !board?.compassState) return
  const cx = board.compassState.centerX
  const cy = board.compassState.centerY

  function onMove(me) {
    const dx = me.clientX - cx
    const dy = me.clientY - cy
    const dist = Math.hypot(dx, dy)
    board.compassState.radius = Math.max(28, Math.min(480, dist))
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI
    if (angle < 0) angle += 360
    board.compassState.angle = angle
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onCompassSweepDown(e) {
  if (e.button !== 0 || !board?.compassState) return
  const cx = board.compassState.centerX
  const cy = board.compassState.centerY
  const r = board.compassState.radius
  const initAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
  const startDeg = initAngle < 0 ? initAngle + 360 : initAngle
  board.compassState.angle = startDeg
  compassSweepAngle.value = 0
  isCompassDrawing.value = true

  let lastDeg = startDeg
  let accumulatedSweep = 0

  function onMove(me) {
    const curAngleRaw = (Math.atan2(me.clientY - cy, me.clientX - cx) * 180) / Math.PI
    const curDeg = curAngleRaw < 0 ? curAngleRaw + 360 : curAngleRaw
    let diff = curDeg - lastDeg
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    accumulatedSweep += diff
    lastDeg = curDeg
    board.compassState.angle = curDeg
    compassSweepAngle.value = accumulatedSweep
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    isCompassDrawing.value = false
    if (Math.abs(compassSweepAngle.value) >= 8) {
      const sweep = Math.abs(compassSweepAngle.value) >= 350 ? 360 : compassSweepAngle.value
      board.insertCircleStroke?.({
        cx,
        cy,
        radius: r,
        startAngle: startDeg,
        sweepAngle: sweep,
      })
    }
    compassSweepAngle.value = 0
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function quickDrawCircle(sweepDeg = 360) {
  if (!board?.compassState) return
  board.insertCircleStroke?.({
    cx: board.compassState.centerX,
    cy: board.compassState.centerY,
    radius: board.compassState.radius,
    startAngle: board.compassState.angle || 0,
    sweepAngle: sweepDeg,
  })
}

// -------------------------------------------------------------
// THƯỚC ĐO ĐỘ (PROTRACTOR)
// -------------------------------------------------------------
function onProtractorBodyDown(e) {
  if (e.button !== 0 || !board?.protractorState) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = board.protractorState.x
  const initY = board.protractorState.y

  function onMove(me) {
    board.protractorState.x = initX + (me.clientX - startX)
    board.protractorState.y = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onNeedlePointerDown(e) {
  if (e.button !== 0 || !board?.protractorState) return
  const originX = board.protractorState.x
  const originY = board.protractorState.y

  function onMove(me) {
    const dx = me.clientX - originX
    const dy = originY - me.clientY
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (deg < 0) deg = 0
    if (deg > 180) deg = 180
    const nearest5 = Math.round(deg / 5) * 5
    if (Math.abs(deg - nearest5) < 2) deg = nearest5
    board.protractorState.needleAngle = deg
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function calcTick(deg, inset = 0) {
  const r = (board?.protractorState?.radius || 145) - 10 - inset
  const rad = (deg * Math.PI) / 180
  const cx = board?.protractorState?.radius || 145
  const cy = board?.protractorState?.radius || 145
  return {
    x: cx + r * Math.cos(Math.PI - rad),
    y: cy - r * Math.sin(Math.PI - rad),
  }
}

function calcAngleArc(deg) {
  const r = 40
  const cx = board?.protractorState?.radius || 145
  const cy = board?.protractorState?.radius || 145
  const rad = (deg * Math.PI) / 180
  const x1 = cx - r
  const y1 = cy
  const x2 = cx - r * Math.cos(rad)
  const y2 = cy - r * Math.sin(rad)
  return `M ${cx},${cy} L ${x1},${y1} A ${r} ${r} 0 0 1 ${x2},${y2} Z`
}
</script>

<style scoped>
.board-teaching-tools-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 45;
  overflow: visible;
}

/* ==================== 1. THƯỚC THẲNG ==================== */
.ruler-container {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  cursor: grab;
  touch-action: none;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.45));
}
.ruler-container:active {
  cursor: grabbing;
}

.ruler-body {
  height: 68px;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1.5px solid rgba(148, 163, 184, 0.45);
  border-radius: 8px;
  position: relative;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

/* Mép trên kéo kẻ thẳng trực tiếp */
.ruler-top-draw-track {
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 18px;
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: transparent;
  transition: background 0.15s ease;
  z-index: 5;
}
.ruler-top-draw-track:hover {
  background: rgba(56, 189, 248, 0.25);
  border: 1px dashed #38bdf8;
}
.track-hint {
  font-size: 9px;
  font-weight: 700;
  color: #38bdf8;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.15s ease;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.85);
  padding: 1px 6px;
  border-radius: 4px;
}
.ruler-top-draw-track:hover .track-hint {
  opacity: 1;
  transform: translateY(-14px);
}

/* Vạch chia cm & mm ở mép trên */
.ruler-scale {
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.scale-tick {
  width: 1px;
  background: rgba(226, 232, 240, 0.35);
  position: relative;
}
.tick-minor {
  height: 5px;
}
.tick-half {
  height: 9px;
  background: rgba(226, 232, 240, 0.65);
}
.tick-major {
  height: 14px;
  background: #38bdf8;
  width: 1.5px;
}
.tick-num {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  font-family: system-ui, sans-serif;
}

/* Khối xoay độ trung tâm */
.ruler-center-hub {
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}
.hub-dial {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #0f172a;
  border: 1.5px solid #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}
.hub-angle {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  font-family: monospace;
}

/* Thanh nút thao tác trên thước */
.ruler-quick-actions {
  position: absolute;
  bottom: 6px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rq-btn {
  height: 22px;
  padding: 0 7px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.85);
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rq-btn:hover {
  background: #334155;
  color: #ffffff;
  border-color: #38bdf8;
}
.rq-btn.primary {
  background: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
  font-weight: 700;
}
.rq-btn.primary:hover {
  background: #0369a1;
}
.rq-btn--close {
  margin-left: auto;
  color: #f87171;
}
.rq-btn--close:hover {
  background: #991b1b;
  color: #ffffff;
}

/* Bảng cài đặt bên phải của thước */
.ruler-right-dock {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 10px;
  background: rgba(15, 23, 42, 0.94);
  border: 1.5px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}
.rrd-align-group {
  display: flex;
  gap: 4px;
}
.rrd-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rrd-btn:hover {
  background: #334155;
  color: #ffffff;
}
.rrd-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}
.rrd-unit-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #94a3b8;
}
.rrd-unit-pills {
  display: flex;
  gap: 3px;
}
.rrd-unit-pill {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.14s ease;
}
.rrd-unit-pill:hover {
  color: #ffffff;
  background: #334155;
}
.rrd-unit-pill.active {
  background: #10b981;
  border-color: #34d399;
  color: #ffffff;
}
.rrd-length-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: #cbd5e1;
  padding-top: 2px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}
.rrd-sz-btns {
  display: flex;
  gap: 3px;
}
.rrd-sz-btn {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.rrd-sz-btn:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

/* Badge đo thời gian thực */
.ruler-live-measure-badge {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(15, 23, 42, 0.95);
  border: 1.5px solid #38bdf8;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  color: #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.35);
  pointer-events: none;
  white-space: nowrap;
  z-index: 55;
}

/* ==================== 2. COMPA ĐIỆN TỬ ==================== */
.compass-container {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  z-index: 46;
}

.compass-svg {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  pointer-events: none;
  overflow: visible;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
}
.compass-top-knob {
  cursor: grab;
  pointer-events: auto;
}
.compass-top-knob:active {
  cursor: grabbing;
}

/* Chân kim (Tâm O) */
.compass-center-needle {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}
.compass-center-needle:active {
  cursor: grabbing;
}
.needle-reticle-h {
  position: absolute;
  left: 2px;
  right: 2px;
  height: 1.5px;
  background: #f59e0b;
}
.needle-reticle-v {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 1.5px;
  background: #f59e0b;
}
.needle-reticle-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffffff;
}
.needle-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 800;
  color: #f59e0b;
  background: rgba(15, 23, 42, 0.85);
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Chân chì & núm kéo */
.compass-pencil-head {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  pointer-events: auto;
}
.compass-sweep-ring {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px dashed #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  transition: all 0.14s ease;
}
.compass-sweep-ring:hover {
  background: rgba(245, 158, 11, 0.3);
  border-color: #fbbf24;
  transform: translate(-50%, -50%) scale(1.1);
}
.sweep-icon {
  font-size: 12px;
  color: #f59e0b;
}

.compass-radius-knob {
  position: absolute;
  left: 0;
  top: 22px;
  transform: translate(-50%, 0);
  width: 22px;
  height: 18px;
  border-radius: 4px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
}
.radius-arrows {
  font-size: 10px;
  font-weight: 800;
  color: #e2e8f0;
}

.compass-radius-badge {
  position: absolute;
  left: 0;
  top: 44px;
  transform: translate(-50%, 0);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 9px;
  color: #cbd5e1;
  white-space: nowrap;
  pointer-events: none;
}
.compass-sweep-deg {
  color: #f59e0b;
  font-weight: 700;
  margin-left: 2px;
}

/* Thanh công cụ điều khiển compa */
.compass-hud-panel {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 25px);
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.95);
  border: 1.5px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  min-width: 280px;
}
.chp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  padding-bottom: 4px;
}
.chp-title {
  font-size: 11px;
  font-weight: 700;
  color: #f8fafc;
}
.chp-unit-tag {
  font-size: 9px;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 6px;
}
.chp-btn-close {
  background: transparent;
  border: none;
  color: #f87171;
  font-size: 11px;
  cursor: pointer;
  padding: 2px;
}
.chp-btn-close:hover {
  color: #ef4444;
}

.chp-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chp-label {
  font-size: 10px;
  color: #94a3b8;
}
.chp-presets {
  display: flex;
  gap: 3px;
}
.chp-preset-btn {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}
.chp-preset-btn:hover {
  background: #334155;
  color: #ffffff;
}
.chp-preset-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
}
.chp-steppers {
  display: flex;
  gap: 2px;
  margin-left: auto;
}
.chp-step-btn {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.chp-step-btn:hover {
  background: #0284c7;
  color: #ffffff;
}

.chp-actions-row {
  display: flex;
  gap: 4px;
}
.chp-action-btn {
  flex: 1;
  padding: 4px 6px;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 9.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}
.chp-action-btn:hover {
  background: #334155;
  color: #ffffff;
  border-color: #38bdf8;
}
.chp-action-btn.primary {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  font-weight: 700;
}
.chp-action-btn.primary:hover {
  background: #0369a1;
}
.chp-action-btn.active {
  background: #f59e0b;
  border-color: #fbbf24;
  color: #0f172a;
  font-weight: 800;
}

/* ==================== 3. THƯỚC ĐO ĐỘ ==================== */
.protractor-container {
  position: absolute;
  pointer-events: auto;
  user-select: none;
  cursor: grab;
  touch-action: none;
  filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.5));
}
.protractor-container:active {
  cursor: grabbing;
}
.protractor-body {
  position: relative;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 145px 145px 0 0;
  border: 1.5px solid rgba(148, 163, 184, 0.4);
  border-bottom: none;
  backdrop-filter: blur(12px);
  overflow: visible;
}
.protractor-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.protractor-center-origin {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translate(-50%, 50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #38bdf8;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}
.origin-cross-h {
  position: absolute;
  left: 2px;
  right: 2px;
  height: 1px;
  background: #38bdf8;
}
.origin-cross-v {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 1px;
  background: #38bdf8;
}
.origin-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ffffff;
}

.needle-knob {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.needle-badge {
  font-size: 8px;
  font-weight: 800;
  color: #0f172a;
}

.protractor-actions {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 6px;
  padding: 3px 6px;
  backdrop-filter: blur(8px);
}
.pt-btn {
  height: 20px;
  padding: 0 6px;
  border-radius: 3px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.75);
  color: #cbd5e1;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
}
.pt-btn:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}
.pt-btn--close {
  color: #f87171;
}
.pt-btn--close:hover {
  background: #991b1b;
  color: #ffffff;
}
</style>

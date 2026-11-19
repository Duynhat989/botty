<template>
  <div class="board-dock" role="toolbar" :aria-label="t('board.dockAria')" @pointerdown.stop>
    <button
      type="button"
      class="dock-btn"
      :class="{ on: tool === 'hand' }"
      :aria-label="t('structure.writingToolHand')"
      @click="board.setWritingTool('hand')"
    >
      <WritingMoveToolIcon :size="16" />
      <span class="dock-tooltip">Di chuyển bảng (Kéo giữ)</span>
    </button>
    <!-- Nút Bút vẽ nét (Click để chọn hoặc mở Popup tuỳ chọn chi tiết HUD kiểu Sketchbook) -->
    <div class="dock-pen-group">
      <button
        type="button"
        class="dock-btn"
        :class="{ on: tool === 'pen', 'has-flyout': penFlyoutOpen }"
        aria-label="Bút viết thông thường"
        @click="handlePenBtnClick"
      >
        <PenLine :size="16" :stroke-width="2.2" />
        <span v-if="!penFlyoutOpen" class="dock-tooltip">Bút vẽ (Nhấp để mở bảng tuỳ chọn nét & màu)</span>
      </button>

      <!-- FLYOUT HUD CÔNG CỤ BÚT KIỂU AUTODESK SKETCHBOOK -->
      <transition name="pen-hud-pop">
        <div v-if="penFlyoutOpen" class="pen-flyout-hud" @pointerdown.stop>
          <div class="pen-hud-header">
            <span class="pen-hud-title">TÙY CHỈNH BÚT VẼ</span>
            <button type="button" class="pen-hud-close" @click="penFlyoutOpen = false">
              <X :size="13" />
            </button>
          </div>

          <!-- KHUNG PREVIEW ĐẦU BÚT TRỰC QUAN (Xem trước độ dày, màu & độ mờ nét) -->
          <div class="pen-hud-preview-box">
            <div
              class="pen-hud-nib-preview"
              :style="{
                width: Math.max(4, Math.min(64, board.penWidth * 3.5)) + 'px',
                height: Math.max(4, Math.min(64, board.penWidth * 3.5)) + 'px',
                backgroundColor: board.penColor || '#ffffff',
                opacity: board.penOpacity ?? 1,
              }"
            />
            <span class="pen-hud-size-val">{{ board.penWidth }} px</span>
          </div>

          <!-- SLIDER CHỈNH CỠ NÉT (SIZE) -->
          <div class="pen-hud-slider-row">
            <span class="pen-hud-label">Cỡ nét:</span>
            <input
              v-model.number="board.penWidth"
              type="range"
              min="1"
              max="24"
              step="1"
              class="pen-hud-slider"
            />
          </div>

          <!-- SLIDER CHỈNH ĐỘ ĐẬM NHẠT (OPACITY) -->
          <div class="pen-hud-slider-row">
            <span class="pen-hud-label">Độ mờ:</span>
            <input
              :value="Math.round((board.penOpacity ?? 1) * 100)"
              type="range"
              min="10"
              max="100"
              step="5"
              class="pen-hud-slider pen-hud-slider--opacity"
              @input="board.setPenOpacity($event.target.value / 100)"
            />
            <span class="pen-hud-subval">{{ Math.round((board.penOpacity ?? 1) * 100) }}%</span>
          </div>

          <!-- CHỌN KIỂU DẠNG NÉT VẼ (Nét liền, nét đứt, nét chấm, mũi tên) -->
          <div class="pen-hud-section">
            <span class="pen-hud-label">Dạng nét:</span>
            <div class="pen-hud-styles">
              <button
                type="button"
                class="pen-hud-style-btn"
                :class="{ active: (board.penStyle || 'solid') === 'solid' }"
                title="Nét liền (Solid)"
                @click="board.setPenStyle('solid')"
              >
                <svg width="24" height="12" viewBox="0 0 24 12">
                  <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                </svg>
              </button>
              <button
                type="button"
                class="pen-hud-style-btn"
                :class="{ active: board.penStyle === 'dashed' }"
                title="Nét đứt (Dashed)"
                @click="board.setPenStyle('dashed')"
              >
                <svg width="24" height="12" viewBox="0 0 24 12">
                  <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3.5" stroke-linecap="round" />
                </svg>
              </button>
              <button
                type="button"
                class="pen-hud-style-btn"
                :class="{ active: board.penStyle === 'dotted' }"
                title="Nét chấm (Dotted)"
                @click="board.setPenStyle('dotted')"
              >
                <svg width="24" height="12" viewBox="0 0 24 12">
                  <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" stroke-width="3" stroke-dasharray="1.5 4" stroke-linecap="round" />
                </svg>
              </button>
              <button
                type="button"
                class="pen-hud-style-btn"
                :class="{ active: board.penStyle === 'arrow' }"
                title="Nét mũi tên chỉ hướng (Arrow)"
                @click="board.setPenStyle('arrow')"
              >
                <svg width="24" height="12" viewBox="0 0 24 12">
                  <line x1="2" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                  <polygon points="15,2 22,6 15,10" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <!-- BẢNG MÀU NHANH TRỰC TIẾP TRÊN HUD -->
          <div class="pen-hud-section">
            <span class="pen-hud-label">Màu sắc:</span>
            <div class="pen-hud-palette">
              <button
                v-for="c in (board.penPalette || ['#ffffff', '#f87171', '#fbbf24', '#34d399', '#38bdf8', '#818cf8', '#e879f9'])"
                :key="c"
                type="button"
                class="pen-hud-color-swatch"
                :class="{ active: board.penColor === c }"
                :style="{ backgroundColor: c }"
                :title="c"
                @click="board.setPenColor(c)"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
    <button
      type="button"
      class="dock-btn"
      :class="{ on: tool === 'highlighter' }"
      aria-label="Bút dạ quang"
      @click="board.setWritingTool('highlighter')"
    >
      <Highlighter :size="16" :stroke-width="2.2" />
      <span class="dock-tooltip">Bút dạ quang (Làm nổi bật)</span>
    </button>
    <button
      type="button"
      class="dock-btn"
      :class="{ on: tool === 'eraser' }"
      :aria-label="t('board.toolEraser')"
      @click="board.setWritingTool('eraser')"
    >
      <Eraser :size="16" :stroke-width="2" />
      <span class="dock-tooltip">Tẩy nét vẽ</span>
    </button>
    <button
      type="button"
      class="dock-btn"
      :class="{ on: tool === 'region' }"
      :aria-label="t('board.toolRegion')"
      @click="board.setWritingTool('region')"
    >
      <Scan :size="16" :stroke-width="2" />
      <span class="dock-tooltip">Chọn vùng (Biến 3D / Đồ thị)</span>
    </button>
    <button
      type="button"
      class="dock-btn dock-btn--wand"
      :class="{ on: board.smartShapeMode }"
      aria-label="Smart Shape"
      @click="board.toggleSmartShape()"
    >
      <Shapes :size="16" :stroke-width="2" />
      <span class="dock-tooltip">{{ board.smartShapeMode ? 'Nắn nét: Đang bật' : 'Nắn chuẩn hình học (Smart Shape)' }}</span>
    </button>
    <!-- Nút Vẽ hình từ đề bài toán (Chuyển tính năng từ trang chủ vào bảng) -->
    <button
      type="button"
      class="dock-btn dock-btn--composer"
      :class="{ on: board.showProblemGeometryTool }"
      aria-label="Dựng hình từ đề bài"
      @click="board.toggleProblemGeometryTool()"
    >
      <PencilRuler :size="16" :stroke-width="2" />
      <span class="dock-tooltip">Vẽ hình từ đề bài toán</span>
    </button>
    <!-- Dropdown Thư viện các hình học phổ biến (Nhấp hoặc Kéo thả vào bảng) -->
    <div class="dock-dropdown-wrap">
      <button
        type="button"
        class="dock-btn dock-btn--demo"
        :class="{ on: demoMenuOpen }"
        aria-label="Thư viện hình học phổ biến"
        @click="demoMenuOpen = !demoMenuOpen"
      >
        <Box :size="16" :stroke-width="2" />
        <span v-if="!demoMenuOpen" class="dock-tooltip">Thư viện hình học SGK & 3D</span>
      </button>

      <!-- Teleport popup thư viện sang body để không bị ảnh hưởng bởi transform & backdrop-filter của dock -->
      <Teleport to="body">
        <transition name="catalog-pop-left">
          <div v-if="demoMenuOpen" class="shapes-catalog-panel" @pointerdown.stop>
            <!-- Header thư viện hình học -->
            <div class="catalog-header">
              <div class="catalog-title-row">
                <span class="catalog-badge">Thư viện SGK</span>
                <span class="catalog-title">Hình học phổ biến</span>
                <span class="catalog-count">{{ filteredShapes.length }}</span>
                <button
                  type="button"
                  class="catalog-close-btn"
                  title="Đóng (Esc)"
                  @click="demoMenuOpen = false"
                >
                  <X :size="15" />
                </button>
              </div>
              <div class="catalog-hint">
                <span class="hint-bullet">💡</span>
                <span>Nhấp để chèn hoặc <strong>kéo thả vào bảng</strong></span>
              </div>

              <!-- Ô tìm kiếm nhanh hình học -->
              <div class="catalog-search-box">
                <Search :size="14" class="search-icon" />
                <input
                  v-model="shapeSearchQuery"
                  type="text"
                  class="catalog-search-input"
                  placeholder="Tìm: tam giác, chóp, lập phương..."
                  @keydown.stop
                />
                <button
                  v-if="shapeSearchQuery"
                  type="button"
                  class="clear-search-btn"
                  @click="shapeSearchQuery = ''"
                >
                  ×
                </button>
              </div>

              <!-- Tabs danh mục hình học -->
              <div class="catalog-tabs">
                <button
                  type="button"
                  class="catalog-tab-btn"
                  :class="{ active: activeShapeTab === 'all' }"
                  @click="activeShapeTab = 'all'"
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  class="catalog-tab-btn"
                  :class="{ active: activeShapeTab === '2d' }"
                  @click="activeShapeTab = '2d'"
                >
                  Hình 2D
                </button>
                <button
                  type="button"
                  class="catalog-tab-btn"
                  :class="{ active: activeShapeTab === 'sgk3d' }"
                  @click="activeShapeTab = 'sgk3d'"
                >
                  Không gian SGK
                </button>
                <button
                  type="button"
                  class="catalog-tab-btn"
                  :class="{ active: activeShapeTab === 'demo3d' }"
                  @click="activeShapeTab = 'demo3d'"
                >
                  Khối 3D & Đồ thị
                </button>
              </div>
            </div>

            <!-- Danh sách các thẻ hình học (Dạng lưới grid: hình demo phía trên, text nhỏ phía dưới) -->
            <div class="catalog-list">
              <div
                v-for="shape in filteredShapes"
                :key="shape.key || shape.model"
                class="shape-catalog-card"
                draggable="true"
                @dragstart="onShapeDragStart($event, shape)"
                @dragend="onShapeDragEnd"
                @click="onShapeClick(shape)"
                :title="'Nhấp để chèn hoặc Kéo thả vào bảng vẽ'"
              >
                <div class="shape-card-preview">
                  <span class="shape-card-icon">{{ shape.icon }}</span>
                  <div class="shape-drag-badge" title="Kéo thả vào bảng">
                    <GripVertical :size="10" />
                    <span>Kéo</span>
                  </div>
                </div>
                <div class="shape-card-info">
                  <div class="shape-card-title">{{ shape.name }}</div>
                  <div class="shape-card-desc">{{ shape.desc }}</div>
                </div>
              </div>

              <div v-if="filteredShapes.length === 0" class="catalog-empty">
                Không tìm thấy hình phù hợp với "{{ shapeSearchQuery }}"
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
    <!-- Dropdown Thước kẻ, Thước đo độ & Đồ thị hàm số -->
    <div class="dock-dropdown-wrap">
      <button
        type="button"
        class="dock-btn dock-btn--ruler"
        :class="{ on: rulerMenuOpen || board.showRuler || board.showProtractor || board.showFunctionGrapher }"
        aria-label="Dụng cụ đo đạc & Giảng dạy"
        @click="rulerMenuOpen = !rulerMenuOpen"
      >
        <Ruler :size="16" :stroke-width="2" />
        <span v-if="!rulerMenuOpen" class="dock-tooltip">Thước kẻ, Compa, Đo độ & Đồ thị</span>
      </button>

      <transition name="menu-pop">
        <div v-if="rulerMenuOpen" class="demo-quick-menu" @pointerdown.stop>
          <header class="menu-head-label">DỤNG CỤ ĐO ĐẠC & GIẢNG DẠY</header>
          <button
            type="button"
            class="menu-action-row"
            :class="{ active: board.showRuler }"
            @click="toggleRulerTool"
          >
            <span class="row-icon">📏</span>
            <div class="row-text">
              <strong>{{ board.showRuler ? 'Ẩn thước thẳng' : 'Thước thẳng chia vạch' }}</strong>
              <small>Căn chỉnh Ngang/Dọc, vạch {{ board.boardUnit }}, kéo kẻ thẳng tắp</small>
            </div>
          </button>
          <button
            type="button"
            class="menu-action-row"
            :class="{ active: board.showCompass }"
            @click="toggleCompassTool"
          >
            <span class="row-icon">🧭</span>
            <div class="row-text">
              <strong>{{ board.showCompass ? 'Ẩn Compa điện tử' : 'Compa vẽ đường tròn & cung tròn' }}</strong>
              <small>Tâm O, kéo chỉnh bán kính R, xoay quét tự do 360°</small>
            </div>
          </button>
          <button
            type="button"
            class="menu-action-row"
            :class="{ active: board.showProtractor }"
            @click="toggleProtractorTool"
          >
            <span class="row-icon">📐</span>
            <div class="row-text">
              <strong>{{ board.showProtractor ? 'Ẩn thước đo độ' : 'Thước đo độ 180°' }}</strong>
              <small>Tâm O đặt vào đỉnh góc, kim xoay đo góc</small>
            </div>
          </button>
          <button
            type="button"
            class="menu-action-row"
            :class="{ active: board.showFunctionGrapher }"
            @click="toggleGraphTool"
          >
            <span class="row-icon">📈</span>
            <div class="row-text">
              <strong>Đồ thị hàm số tương tác 2D</strong>
              <small>Vẽ đồ thị hàm số từ vùng chọn hoặc công thức y = f(x)</small>
            </div>
          </button>

          <!-- Bộ cài đặt đơn vị bảng -->
          <div class="menu-unit-dock">
            <span class="mud-label">Cài đặt đơn vị bảng:</span>
            <div class="mud-pills">
              <button
                v-for="u in ['cm', 'mm', 'dm', 'm', 'đv']"
                :key="u"
                type="button"
                class="mud-pill"
                :class="{ active: board.boardUnit === u }"
                @click="board.setBoardUnit?.(u)"
              >
                {{ u }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>


    <span class="dock-sep" aria-hidden="true" />
    <button
      type="button"
      class="dock-btn"
      :class="{ disabled: !board.canUndo }"
      :disabled="!board.canUndo"
      aria-label="Hoàn tác"
      @click="board.undo()"
    >
      <Undo2 :size="16" :stroke-width="2.2" />
      <span class="dock-tooltip">Hoàn tác (Ctrl+Z)</span>
    </button>
    <button
      type="button"
      class="dock-btn"
      :class="{ disabled: !board.canRedo }"
      :disabled="!board.canRedo"
      aria-label="Làm lại"
      @click="board.redo()"
    >
      <Redo2 :size="16" :stroke-width="2.2" />
      <span class="dock-tooltip">Làm lại (Ctrl+Y)</span>
    </button>
    <span class="dock-sep" aria-hidden="true" />
    <button
      type="button"
      class="dock-btn"
      :class="{ on: board.showGrid }"
      aria-label="Lưới tọa độ"
      @click="board.toggleGrid()"
    >
      <Grid3x3 :size="16" :stroke-width="2" />
      <span class="dock-tooltip">{{ board.showGrid ? 'Ẩn lưới tọa độ' : 'Hiện lưới tọa độ' }}</span>
    </button>
    <button
      type="button"
      class="dock-btn dock-btn--ai"
      :class="{ on: geminiOpen }"
      aria-label="Trợ lý giải toán Gemini"
      @click="emit('toggle-gemini')"
    >
      <BotMessageSquare :size="16" :stroke-width="2" />
      <span class="dock-tooltip">{{ geminiOpen ? 'Đóng Trợ lý toán' : 'Mở Trợ lý toán' }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import {
  Box,
  Eraser,
  Grid3x3,
  PenLine,
  Redo2,
  Scan,
  Sparkles,
  Undo2,
  Wand2,
  Highlighter,
  Flame,
  Ruler,
  DraftingCompass,
  Search,
  GripVertical,
  X,
  BotMessageSquare,
  Shapes,
  PencilRuler,
} from '@lucide/vue'
import { useI18n } from '@/i18n'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import {
  createGeometryShapeFromResult,
  createSgkPresetGeometryShape,
} from '@/utils/strokeRecognizer'
import WritingMoveToolIcon from '@/components/icons/WritingMoveToolIcon.vue'

defineProps({
  geminiOpen: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-gemini'])

const { t } = useI18n()
const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardDockToolbar requires WRITING_BOARD_KEY')

const tool = computed(() => board.writingTool)
const demoMenuOpen = ref(false)
const rulerMenuOpen = ref(false)
const penFlyoutOpen = ref(false)

function handlePenBtnClick() {
  if (board.writingTool !== 'pen') {
    board.setWritingTool('pen')
    penFlyoutOpen.value = true
  } else {
    // Đã chọn bút rồi thì toggle popup flyout
    penFlyoutOpen.value = !penFlyoutOpen.value
  }
}

const shapeSearchQuery = ref('')
const activeShapeTab = ref('all')

const POPULAR_SHAPES = [
  // 1. Hình phẳng 2D
  {
    category: '2d',
    kind: '2d',
    key: 'right_triangle_ah',
    icon: '📐',
    name: 'Tam giác vuông ABC (AH ⟂ BC)',
    desc: 'Vuông tại A, đường cao AH, hệ thức lượng',
    tags: ['tam giac', 'vuong', 'duong cao', 'ah', 'he thuc luong'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'equilateral_triangle',
    icon: '🔺',
    name: 'Tam giác đều ABC',
    desc: '3 cạnh bằng nhau, góc 60°, đường cao h = a√3/2',
    tags: ['tam giac', 'deu', '60 do', 'canh bang nhau'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'triangle_abc',
    icon: '🔺',
    name: 'Tam giác nhọn ABC',
    desc: 'Dựng trung điểm, trực tâm, trọng tâm, phân giác',
    tags: ['tam giac', 'nhon', 'trung diem', 'trong tam', 'truc tam'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'rectangle_abcd',
    icon: '▭',
    name: 'Hình chữ nhật ABCD',
    desc: '4 góc vuông, 2 đường chéo bằng nhau cắt tại tâm',
    tags: ['hinh chu nhat', 'tu giac', 'goc vuong', 'duong cheo'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'square_abcd',
    icon: '⏹️',
    name: 'Hình vuông ABCD',
    desc: '4 cạnh bằng nhau, 4 góc vuông, 2 đường chéo vuông góc',
    tags: ['hinh vuong', 'canh bang nhau', 'goc vuong'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'parallelogram_abcd',
    icon: '▱',
    name: 'Hình bình hành ABCD',
    desc: 'Hai cặp cạnh đối song song & bằng nhau (//)',
    tags: ['hinh binh hanh', 'song song', 'tam o'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'rhombus_abcd',
    icon: '❖',
    name: 'Hình thoi ABCD (Tâm O)',
    desc: 'Bốn cạnh bằng nhau, hai đường chéo vuông góc',
    tags: ['hinh thoi', 'duong cheo vuong goc', 'tam o'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'trapezoid_abcd',
    icon: '⏢',
    name: 'Hình thang cân ABCD',
    desc: 'Hai đáy AB // CD, 2 góc kề một đáy bằng nhau',
    tags: ['hinh thang can', 'day song song', 'duong cao'],
  },
  {
    category: '2d',
    kind: '2d',
    key: 'circle',
    icon: '⭕',
    name: 'Đường tròn (O) & ΔABC nội tiếp',
    desc: 'Tâm O, góc nội tiếp, tiếp tuyến, bán kính R',
    tags: ['duong tron', 'noi tiep', 'ngoai tiep', 'tam o', 'ban kinh'],
  },

  // 2. Hình học không gian SGK
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'pyramid_sa_perp',
    icon: '🏛️',
    name: 'Chóp S.ABCD (SA ⊥ đáy)',
    desc: 'Dạng SGK 11 kinh điển (nét đứt SA, AB, AD)',
    tags: ['chop', 'sa vuong goc day', 'hinh hoc khong gian'],
  },
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'tetrahedron_sabc',
    icon: '⛰️',
    name: 'Tứ diện / Chóp tam giác S.ABC',
    desc: 'Cạnh đáy khuất nét đứt AC, trọng tâm tam giác',
    tags: ['tu dien', 'chop tam giac', 'sabc'],
  },
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'pyramid_sabcd',
    icon: '⛺',
    name: 'Chóp tứ giác đều S.ABCD',
    desc: 'Đáy hình vuông, đường cao SO ⊥ đáy tại tâm O',
    tags: ['chop tu giac deu', 'duong cao so', 'tam o'],
  },
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'prism_abc',
    icon: '💎',
    name: 'Lăng trụ đứng ABC.A\'B\'C\'',
    desc: 'Hai đáy tam giác song song, cạnh khuất nét đứt',
    tags: ['lang tru', 'lang tru dung', 'tam giac'],
  },
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'trapezoid_prism',
    icon: '🏠',
    name: 'Lăng trụ vát (Mái dốc SGK)',
    desc: 'Hình khối mái lều, 2 mặt nghiêng thực tế',
    tags: ['lang tru vat', 'mai doc', 'hinh lang tru'],
  },
  {
    category: 'sgk3d',
    kind: '2d',
    key: 'box_abcd',
    icon: '🧊',
    name: 'Hình hộp / Lập phương 3D (ABCD.A\'B\'C\'D\')',
    desc: '8 đỉnh, 12 cạnh, các cạnh khuất vẽ bằng nét đứt',
    tags: ['hinh hop', 'lap phuong', '8 dinh', 'net dut'],
  },

  // 3. Khối 3D Tương tác Xoay 360° & Cắt Thiết Diện
  {
    category: 'demo3d',
    kind: '3d',
    model: 'cube',
    icon: '🧊',
    name: 'Khối Lập phương 3D (Xoay 360°)',
    desc: 'Cắt thiết diện đa giác, trượt mặt phẳng, xoay 360°',
    tags: ['khoi 3d', 'lap phuong', 'xoay 360', 'thiet dien', 'cat'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'box',
    icon: '📦',
    name: 'Khối Hộp chữ nhật 3D (Xoay 360°)',
    desc: 'Xoay 360°, trượt mặt cắt, tính thể tích V = a×b×c',
    tags: ['khoi hop chu nhat', 'the tich', 'xoay 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'triangular_prism',
    icon: '💎',
    name: 'Khối Lăng trụ đứng tam giác 3D',
    desc: 'Xoay 360°, quan sát thiết diện đa giác',
    tags: ['khoi lang tru', 'tam giac 3d', 'xoay 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'trapezoid_prism',
    icon: '🛖',
    name: 'Khối Lăng trụ vát 3D (Mái dốc)',
    desc: 'Mô hình bài toán thực tế mái dốc, xoay 360°',
    tags: ['lang tru vat', 'mai doc 3d', 'khoi 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'pyramid',
    icon: '🏛️',
    name: 'Khối Hình chóp tứ giác 3D',
    desc: 'Xoay 360°, mặt cắt thiết diện qua các cạnh',
    tags: ['khoi chop', 'pyramid 3d', 'xoay 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'cylinder',
    icon: '🛢️',
    name: 'Khối Hình trụ tròn 3D',
    desc: 'Hai đáy tròn, trục đối xứng, xoay 360°',
    tags: ['hinh tru', 'tru tron', 'khoi 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'cone',
    icon: '🍦',
    name: 'Khối Hình nón tròn 3D',
    desc: 'Đỉnh chóp, đáy hình tròn, đường sinh l, xoay 360°',
    tags: ['hinh non', 'non tron', 'khoi 3d'],
  },
  {
    category: 'demo3d',
    kind: '3d',
    model: 'graph',
    icon: '📈',
    name: 'Đồ thị hàm số & Bảng biến thiên',
    desc: 'Khảo sát hàm số, tương giao, cực trị & đồ thị tương tác',
    tags: ['do thi', 'ham so', 'bang bien thien', 'cuc tri'],
  },
]

const filteredShapes = computed(() => {
  const q = shapeSearchQuery.value.trim().toLowerCase()
  return POPULAR_SHAPES.filter((item) => {
    if (activeShapeTab.value !== 'all' && item.category !== activeShapeTab.value) {
      return false
    }
    if (!q) return true
    const text = (item.name + ' ' + item.desc + ' ' + item.tags.join(' ')).toLowerCase()
    return text.includes(q)
  })
})

function onShapeDragStart(e, shape) {
  window.__draggedShape = shape
  if (e.dataTransfer) {
    const data = JSON.stringify(shape)
    e.dataTransfer.setData('application/json', data)
    e.dataTransfer.setData('text/plain', data)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

function onShapeDragEnd() {
  setTimeout(() => {
    window.__draggedShape = null
  }, 400)
}

function onShapeClick(shape) {
  board.insertPresetShapeAt?.(shape)
  demoMenuOpen.value = false
}

function toggleRulerTool() {
  board.toggleRuler?.()
  rulerMenuOpen.value = false
}

function toggleCompassTool() {
  board.toggleCompass?.()
  rulerMenuOpen.value = false
}

function toggleProtractorTool() {
  board.toggleProtractor?.()
  rulerMenuOpen.value = false
}

function toggleGraphTool() {
  board.toggleFunctionGrapher?.()
  rulerMenuOpen.value = false
}

function insertDemo(model) {
  board.addInteractiveDemo({ model, type: model === 'graph' ? 'graph' : '3d' })
  demoMenuOpen.value = false
}

function insertVideoSampleEq() {
  board.insertVideoEquationSample?.()
  demoMenuOpen.value = false
}

function insertGeom(key) {
  let shape
  if (key === 'rectangle') {
    const dummyResult = {
      type: 'rectangle',
      bbox: { minX: 0.25, maxX: 0.68, minY: 0.22, maxY: 0.62, cx: 0.46, cy: 0.42 },
    }
    shape = createGeometryShapeFromResult(dummyResult, board.penColor || '#f8fafc')
  } else if (key === 'circle') {
    shape = createSgkPresetGeometryShape('inscribed_circle_abc', null, board.penColor || '#f8fafc')
  } else {
    shape = createSgkPresetGeometryShape(key, null, board.penColor || '#f8fafc')
  }
  if (shape && board.geometricShapes) {
    board.geometricShapes.push(shape)
  }
  demoMenuOpen.value = false
  board.repaint?.()
}

function onDocClick(e) {
  if (!e.target.closest('.dock-dropdown-wrap') && !e.target.closest('.shapes-catalog-panel')) {
    demoMenuOpen.value = false
    rulerMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('pointerdown', onDocClick)
})
onUnmounted(() => {
  window.removeEventListener('pointerdown', onDocClick)
})
</script>

<style scoped>
.board-dock {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 14;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 9px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.dock-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.dock-btn:hover {
  background: #fff7ed;
  color: #ea580c;
  transform: translateY(-1px);
}

.dock-btn:active {
  transform: translateY(0);
}

.dock-btn.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--ai.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--wand.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--laser.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--ruler.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--teaching.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-btn--composer.on {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.dock-dropdown-wrap {
  position: relative;
}

.demo-quick-menu {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 310px;
  max-height: 460px;
  overflow-y: auto;
  background: rgba(20, 26, 38, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 165, 233, 0.2);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 20;
  backdrop-filter: blur(12px);
}

.shapes-catalog-panel {
  position: fixed;
  left: 20px;
  bottom: 64px;
  width: 440px;
  max-width: calc(100vw - 40px);
  max-height: min(580px, calc(100vh - 110px));
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(249, 115, 22, 0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  z-index: 99999;
}

.catalog-close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.catalog-close-btn:hover {
  background: #ffedd5;
  color: #ea580c;
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid #fed7aa;
}

.catalog-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.catalog-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #ea580c;
  background: #ffedd5;
  padding: 2px 6px;
  border-radius: 4px;
}

.catalog-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
}

.catalog-count {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 10px;
}

.catalog-hint {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.catalog-hint strong {
  color: #ea580c;
}

.catalog-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.catalog-search-box .search-icon {
  position: absolute;
  left: 9px;
  color: #94a3b8;
  pointer-events: none;
}

.catalog-search-input {
  width: 100%;
  height: 30px;
  padding: 0 26px 0 28px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-size: 12px;
  outline: none;
  transition: border-color 0.16s ease;
}

.catalog-search-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
}

.clear-search-btn:hover {
  color: #ea580c;
}

.catalog-tabs {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.catalog-tab-btn {
  flex: 1;
  padding: 4px 6px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.catalog-tab-btn:hover {
  color: #1e293b;
}

.catalog-tab-btn.active {
  background: #f97316;
  color: #ffffff;
  font-weight: 700;
}

.catalog-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.shape-catalog-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 10px 8px 8px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s ease;
  position: relative;
  min-height: 110px;
  text-align: center;
}

.shape-catalog-card:hover {
  background: #fff7ed;
  border-color: #f97316;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.15);
}

.shape-catalog-card:active {
  transform: translateY(0);
}

.shape-card-preview {
  position: relative;
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff7ed;
  border-radius: 6px;
  border: 1px solid #ffedd5;
}

.shape-card-icon {
  font-size: 26px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.18s ease;
}

.shape-catalog-card:hover .shape-card-icon {
  transform: scale(1.12);
}

.shape-drag-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #ffedd5;
  color: #ea580c;
  font-size: 9px;
  font-weight: 600;
  cursor: grab;
  transition: all 0.15s ease;
}

.shape-catalog-card:hover .shape-drag-badge {
  background: #f97316;
  color: #ffffff;
}

.shape-card-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.shape-card-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.25;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.shape-card-desc {
  font-size: 10px;
  color: #64748b;
  line-height: 1.2;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shape-drag-badge:active {
  cursor: grabbing;
}

.catalog-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.menu-head-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #38bdf8;
  padding: 4px 8px 6px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.35);
}

.menu-head-label--sub {
  margin-top: 6px;
  color: #c084fc;
}

.menu-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-action-row:hover {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.row-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.row-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.row-text strong {
  font-size: 12px;
  color: #f8fafc;
}

.row-text small {
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.25;
}

.menu-unit-dock {
  margin-top: 6px;
  padding: 6px 8px 4px;
  border-top: 1px solid rgba(71, 85, 105, 0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mud-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
}
.mud-pills {
  display: flex;
  gap: 3px;
}
.mud-pill {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.14s ease;
}
.mud-pill:hover {
  background: #334155;
  color: #ffffff;
}
.mud-pill.active {
  background: #10b981;
  border-color: #34d399;
  color: #ffffff;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: all 0.18s ease;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

.catalog-pop-left-enter-active,
.catalog-pop-left-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.catalog-pop-left-enter-from,
.catalog-pop-left-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.dock-pen-group {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* FLYOUT HUD CHO CÔNG CỤ BÚT VẼ (PHONG CÁCH SKETCHBOOK) */
.pen-flyout-hud {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(249, 115, 22, 0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10000;
  user-select: none;
}

.pen-flyout-hud::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: #ffffff transparent transparent transparent;
}

.pen-hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ffedd5;
  padding-bottom: 6px;
}

.pen-hud-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ea580c;
}

.pen-hud-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pen-hud-close:hover {
  background: #ffedd5;
  color: #ea580c;
}

/* KHUNG XEM TRƯỚC NIB BÚT */
.pen-hud-preview-box {
  width: 100%;
  height: 74px;
  background: #fff7ed;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.pen-hud-nib-preview {
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  transition: width 0.12s ease, height 0.12s ease, background-color 0.12s ease, opacity 0.12s ease;
}

.pen-hud-size-val {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #9a3412;
}

/* SLIDERS */
.pen-hud-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pen-hud-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  width: 50px;
  flex-shrink: 0;
}

.pen-hud-slider {
  flex: 1;
  height: 4px;
  accent-color: #f97316;
  cursor: pointer;
}

.pen-hud-slider--opacity {
  accent-color: #ea580c;
}

.pen-hud-subval {
  font-size: 10.5px;
  color: #ea580c;
  font-weight: 600;
  width: 32px;
  text-align: right;
}

/* SECTION DẠNG NÉT & MÀU SẮC */
.pen-hud-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pen-hud-styles {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  background: #f8fafc;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.pen-hud-style-btn {
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.14s ease;
  padding: 0;
}

.pen-hud-style-btn:hover {
  background: #ffedd5;
  color: #ea580c;
}

.pen-hud-style-btn.active {
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(249, 115, 22, 0.35);
}

.pen-hud-palette {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  flex-wrap: wrap;
}

.pen-hud-color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  cursor: pointer;
  transition: transform 0.14s ease, border-color 0.14s ease;
  padding: 0;
}

.pen-hud-color-swatch:hover {
  transform: scale(1.18);
  border-color: #f97316;
}

.pen-hud-color-swatch.active {
  transform: scale(1.22);
  border-color: #ea580c;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.4);
}

/* ANIMATION */
.pen-hud-pop-enter-active,
.pen-hud-pop-leave-active {
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.pen-hud-pop-enter-from,
.pen-hud-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

.dock-sep {
  width: 1px;
  height: 20px;
  margin: 0 1px;
  background: rgba(148, 163, 184, 0.22);
}

/* Tooltip hiển thị tên công cụ nổi bật ngay trên nút khi rê chuột vào */
.dock-tooltip {
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
  transition: opacity 0.14s ease, transform 0.14s ease, visibility 0.14s;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 1000;
}

.dock-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #0f172a;
}

.dock-btn:hover .dock-tooltip,
.dock-pen-size:hover .dock-tooltip,
.dock-pen-opacity:hover .dock-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
</style>

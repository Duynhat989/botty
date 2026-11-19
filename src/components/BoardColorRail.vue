<template>
  <div class="color-rail-wrap" @pointerdown.stop>
    <!-- THANH CÔNG CỤ NẰM NGANG PHÍA DƯỚI: HOÀN TÁC, LÀM LẠI, LỊCH SỬ & THU PHÓNG -->
    <div class="color-rail" role="toolbar" :aria-label="t('board.colorRailAria')">
      <!-- Nút Hoàn tác (Undo) -->
      <button
        type="button"
        class="rail-tool-btn"
        :class="{ disabled: !board.canUndo }"
        :disabled="!board.canUndo"
        title="Hoàn tác (Ctrl+Z)"
        aria-label="Hoàn tác"
        @click="board.undo()"
      >
        <Undo2 :size="17" :stroke-width="2.2" />
      </button>

      <!-- Nút Làm lại (Redo) -->
      <button
        type="button"
        class="rail-tool-btn"
        :class="{ disabled: !board.canRedo }"
        :disabled="!board.canRedo"
        title="Làm lại (Ctrl+Y)"
        aria-label="Làm lại"
        @click="board.redo()"
      >
        <Redo2 :size="17" :stroke-width="2.2" />
      </button>

      <!-- Icon xem Lịch sử thao tác (mặc định ẩn bảng, bấm để mở/đóng) -->
      <button
        type="button"
        class="rail-tool-btn rail-tool-btn--history"
        :class="{ active: showHistory }"
        title="Xem lịch sử thao tác (Nhấp để mở/đóng)"
        aria-label="Lịch sử thao tác"
        @click="showHistory = !showHistory"
      >
        <History :size="17" :stroke-width="2.2" />
        <span
          v-if="board.historyStack?.length > 1"
          class="history-step-badge"
          title="Bước hiện tại"
        >
          {{ board.historyIndex + 1 }}
        </span>
      </button>

      <span class="rail-sep" aria-hidden="true" />

      <!-- BẢNG MÀU CỦA BÚT VIẾT (CHỈ HIỆN KHI ĐANG CHỌN CÔNG CỤ BÚT PEN / HIGHLIGHTER) -->
      <template v-if="board.writingTool === 'pen' || board.writingTool === 'highlighter'">
        <div class="swatch-section" :class="{ 'is-expanded': isColorExpanded }">
          <!-- Nút màu hiện tại (nhấp để mở rộng / thu gọn) -->
          <button
            type="button"
            class="swatch swatch--active-trigger"
            :class="{ on: !isColorExpanded }"
            :style="{ '--swatch': board.penColor }"
            :title="isColorExpanded ? 'Thu gọn bảng màu' : `Màu bút: ${board.penColor} • Nhấp để chọn màu khác`"
            @click="isColorExpanded = !isColorExpanded"
          >
            <Palette v-if="!isColorExpanded" :size="13" class="swatch-palette-icon" />
            <ChevronUp v-else :size="13" class="swatch-palette-icon" />
          </button>

          <!-- Danh sách các màu khi mở rộng -->
          <Transition name="palette-slide">
            <div v-if="isColorExpanded" class="palette-expanded-list">
              <button
                v-for="c in board.penPalette"
                :key="c"
                type="button"
                class="swatch"
                :class="{ on: board.penColor === c }"
                :style="{ '--swatch': c }"
                :title="c"
                @click="onSelectColor(c)"
              />
            </div>
          </Transition>
        </div>

        <span class="rail-sep" aria-hidden="true" />
      </template>

      <!-- BỘ ĐIỀU KHIỂN THU PHÓNG GIAO DIỆN (ZOOM IN / OUT / 100%) -->
      <button
        type="button"
        class="rail-tool-btn"
        title="Phóng to giao diện (Ctrl +)"
        aria-label="Phóng to"
        @click="board.zoomIn()"
      >
        <ZoomIn :size="17" :stroke-width="2.2" />
      </button>

      <button
        type="button"
        class="rail-tool-btn rail-zoom-btn"
        :title="`Tỉ lệ ${Math.round((board.boardZoom || 1) * 100)}% (Nhấp để đặt lại 100%)`"
        aria-label="Đặt lại 100%"
        @click="board.resetZoom()"
      >
        {{ Math.round((board.boardZoom || 1) * 100) }}%
      </button>

      <button
        type="button"
        class="rail-tool-btn"
        title="Thu nhỏ giao diện (Ctrl -)"
        aria-label="Thu nhỏ"
        @click="board.zoomOut()"
      >
        <ZoomOut :size="17" :stroke-width="2.2" />
      </button>
    </div>

    <!-- BẢNG LỊCH SỬ THAO TÁC (FLYOUT PANEL PHÍA TRÊN THANH CÔNG CỤ DƯỚI) -->
    <Transition name="history-slide">
      <div v-if="showHistory" class="history-panel" role="region" aria-label="Lịch sử thao tác">
        <header class="history-header">
          <div class="history-title-box">
            <History :size="16" class="history-icon" />
            <span class="history-title">Lịch sử thao tác</span>
            <span class="history-count">
              {{ (board.historyIndex ?? 0) + 1 }}/{{ board.historyStack?.length || 1 }}
            </span>
          </div>
          <button
            type="button"
            class="history-close-btn"
            title="Đóng bảng lịch sử"
            @click="showHistory = false"
          >
            <X :size="15" />
          </button>
        </header>

        <!-- THANH ĐIỀU HƯỚNG NHANH UNDO / REDO TRONG BẢNG -->
        <div class="history-actions-bar">
          <button
            type="button"
            class="history-action-btn"
            :disabled="!board.canUndo"
            @click="board.undo()"
          >
            <Undo2 :size="14" />
            <span>Hoàn tác</span>
          </button>
          <button
            type="button"
            class="history-action-btn"
            :disabled="!board.canRedo"
            @click="board.redo()"
          >
            <span>Làm lại</span>
            <Redo2 :size="14" />
          </button>
        </div>

        <!-- DANH SÁCH CÁC BƯỚC THAO TÁC (CUỘN ĐƯỢC) -->
        <div class="history-list">
          <div
            v-for="(item, idx) in historyItems"
            :key="item.id || idx"
            class="history-item"
            :class="{
              'is-current': idx === board.historyIndex,
              'is-undone': idx > board.historyIndex,
            }"
            @click="board.jumpToHistory(idx)"
          >
            <div class="history-item-left">
              <span class="history-num">{{ idx + 1 }}</span>
              <span class="history-dot" />
              <div class="history-info">
                <span class="history-action-name">{{ item.title || 'Thao tác vẽ' }}</span>
                <span class="history-time">{{ item.time || '' }}</span>
              </div>
            </div>
            <span v-if="idx === board.historyIndex" class="current-badge">Hiện tại</span>
          </div>
        </div>

        <footer class="history-footer">
          <small>Phím tắt: <strong>Ctrl+Z</strong> (hoàn tác) • <strong>Ctrl+Y</strong> (làm lại)</small>
        </footer>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import {
  ChevronUp,
  History,
  Palette,
  Redo2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue'
import { useI18n } from '@/i18n'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

const { t } = useI18n()
const board = inject(WRITING_BOARD_KEY)
if (!board) throw new Error('BoardColorRail requires WRITING_BOARD_KEY')

// Mặc định ẩn phần xem lịch sử thao tác theo yêu cầu người dùng
const showHistory = ref(false)

// Mặc định thu gọn phần màu theo yêu cầu người dùng (chỉ hiện nút màu đang chọn)
const isColorExpanded = ref(false)

function onSelectColor(c) {
  board.setPenColor(c)
  isColorExpanded.value = false
}

const historyItems = computed(() => {
  return board.historyStack || []
})
</script>

<style scoped>
.color-rail-wrap {
  position: absolute;
  bottom: 12px;
  right: 16px;
  z-index: 15;
  display: flex;
  align-items: center;
}

.color-rail {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.rail-tool-btn {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.16s ease;
}

.rail-tool-btn:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #fdba74;
  color: #ea580c;
  transform: translateY(-1px);
}

.rail-tool-btn.active {
  background: #f97316;
  border-color: #ea580c;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.35);
}

.rail-tool-btn.disabled,
.rail-tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none !important;
}

.rail-tool-btn--history {
  color: #ea580c;
}

.history-step-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f97316;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.rail-sep {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 2px;
}

.swatch {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  background: var(--swatch);
  cursor: pointer;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.14s ease, outline 0.14s ease;
}

.swatch:hover {
  transform: scale(1.08);
}

.swatch.on {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

.swatch-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch--active-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swatch-palette-icon {
  color: #0f172a;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.9));
  pointer-events: none;
}

.palette-expanded-list {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 20;
}

.palette-slide-enter-active,
.palette-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.palette-slide-enter-from,
.palette-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px) scale(0.9);
}

.rail-zoom-btn {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #64748b;
  padding: 0 2px;
  min-width: 36px;
}

.rail-zoom-btn:hover {
  color: #ea580c;
}

/* ==========================================================================
   BẢNG LỊCH SỬ THAO TÁC (FLYOUT PANEL PHÍA TRÊN)
   ========================================================================== */
.history-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  width: 300px;
  max-height: min(480px, calc(100vh - 120px));
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(249, 115, 22, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  z-index: 30;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #fed7aa;
  background: #fff7ed;
}

.history-title-box {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #1e293b;
}

.history-icon {
  color: #ea580c;
}

.history-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.history-count {
  font-size: 11px;
  font-weight: 600;
  color: #ea580c;
  background: #ffedd5;
  padding: 2px 6px;
  border-radius: 6px;
}

.history-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.history-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.history-actions-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #fed7aa;
}

.history-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 7px;
  border: 1px solid #fed7aa;
  background: #ffffff;
  color: #ea580c;
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-action-btn:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #f97316;
  color: #c2410c;
}

.history-action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
}

.history-list::-webkit-scrollbar {
  width: 5px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.14s ease;
}

.history-item:hover {
  background: #fff7ed;
  border-color: #fed7aa;
}

.history-item.is-current {
  background: #ffedd5;
  border-color: #f97316;
}

.history-item.is-undone {
  opacity: 0.45;
}

.history-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.history-num {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  width: 18px;
  text-align: right;
  flex-shrink: 0;
}

.history-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ea580c;
  flex-shrink: 0;
}

.history-item.is-current .history-dot {
  background: #f97316;
  box-shadow: 0 0 6px #fb923c;
}

.history-item.is-undone .history-dot {
  background: #cbd5e1;
}

.history-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.history-action-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.history-time {
  font-size: 10px;
  color: #64748b;
}

.current-badge {
  font-size: 10px;
  font-weight: 700;
  color: #ea580c;
  background: #ffedd5;
  padding: 2px 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.history-footer {
  padding: 8px 12px;
  border-top: 1px solid #fed7aa;
  background: #f8fafc;
  text-align: center;
  color: #64748b;
  font-size: 11px;
}

.history-footer strong {
  color: #ea580c;
}

/* Hiệu ứng trượt xuất hiện của bảng lịch sử */
.history-slide-enter-active,
.history-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.history-slide-enter-from,
.history-slide-leave-to {
  opacity: 0;
  transform: translate(12px, -50%);
}
</style>

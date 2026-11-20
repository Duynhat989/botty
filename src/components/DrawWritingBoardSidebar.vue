<template>
  <div class="tool-block writing-block" @pointerdown.stop>
    <div class="writing-tool-row" role="toolbar" :aria-label="t('structure.writingBoardTitle')">
      <button
        type="button"
        class="writing-tool-btn"
        :class="{ on: currentTool === 'hand' }"
        :title="t('structure.writingToolHand')"
        :aria-label="t('structure.writingToolHand')"
        :aria-pressed="currentTool === 'hand'"
        @click.stop="board.setWritingTool('hand')"
      >
        <WritingMoveToolIcon :size="18" />
      </button>
      <button
        type="button"
        class="writing-tool-btn"
        :class="{ on: currentTool === 'pen' }"
        :title="t('structure.writingToolPen')"
        :aria-label="t('structure.writingToolPen')"
        :aria-pressed="currentTool === 'pen'"
        @click.stop="board.setWritingTool('pen')"
      >
        <PenLine :size="18" :stroke-width="2.1" aria-hidden="true" />
      </button>
    </div>
    <label v-if="currentTool === 'pen'" class="writing-pen">
      <span>{{ t('structure.writingPenSize') }}</span>
      <input v-model.number="board.penWidth" type="range" min="1" max="16" step="1" />
      <em>{{ board.penWidth }}px</em>
    </label>
    <label v-if="currentTool === 'pen'" class="writing-pen">
      <span>Độ đậm nhạt</span>
      <input v-model.number="board.penOpacity" type="range" min="0.1" max="1" step="0.05" />
      <em>{{ Math.round((board.penOpacity ?? 1) * 100) }}%</em>
    </label>
    <p class="writing-hint">{{ board.toolHint }}</p>
    <ul v-if="board.strokes.length" class="writing-elements">
      <li
        v-for="(s, idx) in board.strokes"
        :key="s.id"
        class="writing-element"
        :class="{ on: board.selectedStrokeId === s.id }"
      >
        <button type="button" class="writing-element-btn" @click="board.selectStroke(s.id)">
          <span
            class="writing-element-swatch"
            :style="{ background: s.color || board.penColor }"
            aria-hidden="true"
          />
          <span>{{ t('structure.writingElement', { n: idx + 1 }) }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="writing-empty">{{ t('structure.writingElementsEmpty') }}</p>
    <div v-if="board.strokes.length" class="writing-actions">
      <button
        v-if="board.selectedStrokeId"
        type="button"
        class="mini-btn"
        @click="board.deleteSelected()"
      >
        {{ t('structure.writingDeleteElement') }}
      </button>
      <button type="button" class="mini-btn" @click="board.clearAll()">
        {{ t('structure.writingBoardClear') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { PenLine } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import WritingMoveToolIcon from '@/components/icons/WritingMoveToolIcon.vue'

const { t } = useI18n()
const board = inject(WRITING_BOARD_KEY)
if (!board) {
  throw new Error('DrawWritingBoardSidebar requires WRITING_BOARD_KEY provider')
}

const currentTool = computed(() => board.writingTool)
</script>

<style scoped>
.writing-tool-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.writing-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.writing-tool-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.writing-tool-btn.on {
  border-color: rgba(249, 115, 22, 0.5);
  background: linear-gradient(180deg, #fffbeb, #fff7ed);
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.12);
}

.writing-pen {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.writing-pen em {
  font-style: normal;
  font-size: 12px;
  color: #0f172a;
}

.writing-pen input[type='range'] {
  width: 100%;
  accent-color: #3b82f6;
}

.writing-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: #64748b;
}

.writing-elements {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow: auto;
}

.writing-element-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.writing-element.on .writing-element-btn {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.writing-element-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.writing-empty {
  margin: 8px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.writing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.mini-btn {
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
</style>

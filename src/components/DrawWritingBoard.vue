<template>
  <canvas
    ref="canvasEl"
    class="draw-writing-board"
    :class="{
      'draw-writing-board--on': board.active,
      'draw-writing-board--hand': board.active && board.writingTool === 'hand',
      'draw-writing-board--eraser': board.active && board.writingTool === 'eraser',
      'draw-writing-board--region': board.active && board.writingTool === 'region',
      'is-drag-over': isDragOver,
    }"
    aria-hidden="true"
    @pointerdown.stop="board.onPointerDown"
    @pointermove="board.onPointerMove"
    @pointerup="board.onPointerUp"
    @pointercancel="board.onPointerUp"
    @wheel.stop="$emit('wheel', $event)"
    @dragover.prevent="onDragOver"
    @dragenter.prevent="onDragEnter"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  />
</template>

<script setup>
import { inject, onMounted, ref, watch } from 'vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'

defineEmits(['wheel'])

const board = inject(WRITING_BOARD_KEY)
if (!board) {
  throw new Error('DrawWritingBoard requires WRITING_BOARD_KEY provider')
}

const canvasEl = ref(null)
const isDragOver = ref(false)

function onDragOver(e) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
  isDragOver.value = true
}

function onDragEnter() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e) {
  isDragOver.value = false
  let data = window.__draggedShape
  if (!data) {
    try {
      const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain')
      if (raw) data = JSON.parse(raw)
    } catch (err) {
      console.warn('[DrawWritingBoard] onDrop error:', err)
    }
  }
  if (!data) return
  window.__draggedShape = null
  board.insertPresetShapeAt?.({
    ...data,
    clientX: e.clientX,
    clientY: e.clientY,
  })
}

onMounted(() => {
  board.setOverlayEl(canvasEl.value)
})

watch(canvasEl, (el) => {
  board.setOverlayEl(el)
})

defineExpose({
  repaint: board.repaint,
})
</script>

<style scoped>
.draw-writing-board {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 4;
  pointer-events: none;
  touch-action: none;
}

.draw-writing-board--on {
  pointer-events: auto;
  cursor: crosshair;
}

.draw-writing-board--on.draw-writing-board--hand {
  cursor: move;
}

.draw-writing-board--on.draw-writing-board--hand:active {
  cursor: move;
}

.draw-writing-board--on.draw-writing-board--eraser {
  cursor: cell;
}

.draw-writing-board--on.draw-writing-board--region {
  cursor: crosshair;
}

.draw-writing-board.is-drag-over {
  pointer-events: auto;
  outline: 2px dashed rgba(56, 189, 248, 0.65);
  outline-offset: -4px;
  background: rgba(56, 189, 248, 0.03);
}
</style>

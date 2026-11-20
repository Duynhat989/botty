<template>
  <div
    class="view-cube"
    :aria-label="t('structure.viewCube')"
    role="navigation"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="view-cube-scene">
      <div class="view-cube-core" :style="coreStyle">
        <button
          v-for="f in faceList"
          :key="f.preset"
          type="button"
          class="view-cube-face"
          :class="f.className"
          :title="f.title"
          @click="onFaceClick(f.preset)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps({
  view: { type: Object, required: true },
})

const emit = defineEmits(['pick', 'orbit'])

const { t, locale } = useI18n()

const dragging = ref(false)
const pointerId = ref(null)
const last = ref({ x: 0, y: 0 })

const faceList = computed(() => {
  void locale.value
  return [
    { preset: 'front', label: t('structure.viewFront'), className: 'face-front', title: t('structure.viewFront') },
    { preset: 'back', label: t('structure.viewBack'), className: 'face-back', title: t('structure.viewBack') },
    { preset: 'right', label: t('structure.viewRight'), className: 'face-right', title: t('structure.viewRight') },
    { preset: 'left', label: t('structure.viewLeft'), className: 'face-left', title: t('structure.viewLeft') },
    { preset: 'top', label: t('structure.viewTop'), className: 'face-top', title: t('structure.viewTop') },
    { preset: 'bottom', label: t('structure.viewBottom'), className: 'face-bottom', title: t('structure.viewBottom') },
  ]
})

const coreStyle = computed(() => {
  const yawDeg = (Number(props.view.yaw || 0) * 180) / Math.PI
  const pitchDeg = (Number(props.view.pitch || 0) * 180) / Math.PI
  return {
    transform: `rotateX(${pitchDeg}deg) rotateY(${-yawDeg}deg)`,
  }
})

function onFaceClick(preset) {
  if (dragging.value) return
  emit('pick', preset)
}

function onPointerDown(e) {
  if (e.button !== 0) return
  e.stopPropagation()
  dragging.value = false
  pointerId.value = e.pointerId
  last.value = { x: e.clientX, y: e.clientY }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (e.pointerId !== pointerId.value) return
  const dx = e.clientX - last.value.x
  const dy = e.clientY - last.value.y
  if (!dragging.value && Math.hypot(dx, dy) > 4) dragging.value = true
  if (!dragging.value) return
  last.value = { x: e.clientX, y: e.clientY }
  emit('orbit', { dyaw: dx * 0.012, dpitch: dy * 0.012 })
}

function onPointerUp(e) {
  if (e.pointerId !== pointerId.value) return
  e.currentTarget.releasePointerCapture(e.pointerId)
  pointerId.value = null
  const wasDrag = dragging.value
  dragging.value = false
  if (wasDrag) e.preventDefault()
}
</script>

<style scoped>
.view-cube {
  position: absolute;
  top: 10px;
  right: 96px;
  z-index: 5;
  width: 80px;
  height: 80px;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.view-cube:active {
  cursor: grabbing;
}

.view-cube-scene {
  width: 100%;
  height: 100%;
  perspective: 168px;
  perspective-origin: 50% 50%;
}

.view-cube-core {
  --half: 28px;
  width: calc(var(--half) * 2);
  height: calc(var(--half) * 2);
  margin: 8px auto 0;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.14s ease-out;
}

.view-cube-face {
  position: absolute;
  inset: 0;
  width: calc(var(--half) * 2);
  height: calc(var(--half) * 2);
  margin: 0;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #334155;
  cursor: pointer;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.view-cube-face:hover {
  filter: brightness(1.04);
  border-color: #fdba74;
  color: #c2410c;
}

.face-front {
  transform: rotateY(0deg) translateZ(var(--half));
  background: rgba(248, 250, 252, 0.96);
}

.face-back {
  transform: rotateY(180deg) translateZ(var(--half));
  background: rgba(241, 245, 249, 0.96);
}

.face-right {
  transform: rotateY(90deg) translateZ(var(--half));
  background: rgba(96, 165, 250, 0.14);
  color: #1e40af;
}

.face-left {
  transform: rotateY(-90deg) translateZ(var(--half));
  background: rgba(244, 114, 182, 0.14);
  color: #be185d;
}

.face-top {
  transform: rotateX(90deg) translateZ(var(--half));
  background: rgba(56, 189, 248, 0.16);
  color: #0369a1;
}

.face-bottom {
  transform: rotateX(-90deg) translateZ(var(--half));
  background: rgba(56, 189, 248, 0.08);
  color: #475569;
}

@media (max-width: 640px) {
  .view-cube {
    right: 10px;
    top: auto;
    bottom: 52px;
    transform: scale(0.92);
    transform-origin: bottom right;
  }
}
</style>

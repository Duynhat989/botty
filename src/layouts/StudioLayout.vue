<template>
  <div
    class="shell"
    :class="{
      'shell--immersive': isImmersivePreview,
      'shell--board': isBoardWorkspace || isExpanded,
      'shell--expanded': isExpanded,
    }"
  >
    <AppHeader v-if="showChrome && !isExpanded" />
    <main
      class="stage"
      :class="{
        'stage--immersive': isImmersivePreview,
        'stage--board': isBoardWorkspace || isExpanded,
        'stage--expanded': isExpanded,
      }"
    >
      <RouterView />
    </main>
    <AppFooter v-if="showChrome && !isBoardWorkspace && !isExpanded" />

    <!-- Nút Mở rộng / Thu gọn toàn màn hình ở góc canvas bên phải -->
    <button
      v-if="canToggleZen"
      type="button"
      class="zen-screen-toggle-btn"
      :class="{ 'is-expanded': isExpanded, 'is-header-visible': showChrome && !isExpanded }"
      :title="isExpanded ? 'Thu gọn về như cũ (Hiện lại tiêu đề & chân trang) • Phím Esc' : 'Mở rộng toàn màn hình (Ẩn tiêu đề & chân trang)'"
      :aria-label="isExpanded ? 'Thu gọn' : 'Mở rộng'"
      @click="toggleZen"
    >
      <Minimize2 v-if="isExpanded" :size="12" :stroke-width="2.2" />
      <Maximize2 v-else :size="12" :stroke-width="2.2" />
      <span class="zen-tooltip">{{ isExpanded ? 'Thu gọn' : 'Mở rộng' }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Maximize2, Minimize2 } from '@lucide/vue'
import { useDrawSessionStore } from '@/stores/drawSession'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const drawSession = useDrawSessionStore()

const isImmersivePreview = computed(() => route.name === 'structure-preview')
const isBoardWorkspace = computed(() => route.name === 'board')
const isExpanded = computed(() => drawSession.isExpanded)
const showChrome = computed(() => route.name !== 'login' && !isImmersivePreview.value)
const canToggleZen = computed(() => route.name !== 'login')

function toggleZen() {
  drawSession.toggleExpanded()
}

function onKeyDown(e) {
  if (e.key === 'Escape' && drawSession.isExpanded) {
    drawSession.toggleExpanded(false)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.zen-screen-toggle-btn {
  position: fixed;
  z-index: 99999;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
}

/* Khi Header đang hiển thị: đưa xuống phần canvas bên phải */
.zen-screen-toggle-btn.is-header-visible {
  top: 66px;
  right: 14px;
  background: rgba(30, 41, 59, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}

.zen-screen-toggle-btn.is-header-visible:hover {
  background: rgba(30, 41, 59, 0.95);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 3px 12px rgba(56, 189, 248, 0.3);
  transform: scale(1.08);
}

/* Khi đã Mở rộng toàn màn hình: nút nhỏ gọn góc trên bên phải canvas */
.zen-screen-toggle-btn.is-expanded {
  top: 10px;
  right: 10px;
  background: rgba(30, 41, 59, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}

.zen-screen-toggle-btn.is-expanded:hover {
  background: rgba(30, 41, 59, 0.95);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 3px 12px rgba(56, 189, 248, 0.3);
  transform: scale(1.08);
}

.zen-screen-toggle-btn:active {
  transform: translateY(1px) scale(0.96);
}

.zen-tooltip {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  padding: 3px 7px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  color: #f8fafc;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-3px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.zen-screen-toggle-btn:hover .zen-tooltip {
  opacity: 1;
  transform: translateY(0);
}
</style>

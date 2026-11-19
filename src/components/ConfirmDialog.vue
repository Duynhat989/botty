<template>
  <Teleport to="body">
    <div
      v-if="state.open"
      class="confirm-root"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="state.title ? 'confirm-dialog-title' : undefined"
      :aria-describedby="'confirm-dialog-message'"
    >
      <button
        class="confirm-backdrop"
        type="button"
        :aria-label="state.alertOnly ? confirmText : cancelText"
        @click="state.alertOnly ? accept() : dismiss()"
      />
      <div class="confirm-panel" @keydown.escape.prevent="dismiss">
        <div class="confirm-title-row">
          <div class="confirm-mark" aria-hidden="true">!</div>
          <h2 v-if="state.title" id="confirm-dialog-title" class="confirm-title">{{ state.title }}</h2>
        </div>
        <p id="confirm-dialog-message" class="confirm-message">{{ state.message }}</p>
        <div class="confirm-actions" :class="{ 'confirm-actions--alert': state.alertOnly }">
          <button v-if="!state.alertOnly" type="button" class="confirm-btn ghost" @click="dismiss">{{ cancelText }}</button>
          <button
            type="button"
            class="confirm-btn solid"
            autofocus
            @click="accept"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const { state, accept, dismiss } = useConfirm()

const cancelText = computed(() => state.cancelLabel || t('common.cancel'))
const confirmText = computed(() => {
  if (state.confirmLabel) return state.confirmLabel
  return state.danger ? t('common.delete') : t('common.confirm')
})
</script>

<style scoped>
.confirm-root {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: grid;
  place-items: center;
  padding: 20px;
}

.confirm-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  margin: 0;
  background: rgba(28, 20, 12, 0.42);
  backdrop-filter: blur(6px);
  cursor: pointer;
}

.confirm-panel {
  position: relative;
  z-index: 1;
  width: min(400px, 100%);
  padding: 24px 22px 20px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 16%, #e2e8f0);
  background:
    radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 55%),
    #ffffff;
  box-shadow:
    0 24px 56px -18px rgba(28, 20, 12, 0.28),
    0 2px 8px rgba(15, 23, 42, 0.04);
  animation: confirm-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes confirm-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.confirm-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.confirm-mark {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--accent) 16%, #fff);
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.confirm-title {
  margin: 0;
  font-size: 16px;
  font-weight: 550;
  letter-spacing: -0.02em;
  color: var(--ink, #0f172a);
}

.confirm-message {
  margin: 0;
  font-size: 13px;
  font-weight: 450;
  line-height: 1.55;
  color: var(--muted, #64748b);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.confirm-actions--alert {
  justify-content: center;
}

.confirm-actions--alert .confirm-btn.solid {
  min-width: 120px;
}

.confirm-btn {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 450;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.confirm-btn.ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}

.confirm-btn.ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.confirm-btn.solid {
  border: 1px solid transparent;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.confirm-btn.solid:hover {
  background: var(--accent-hover);
}
</style>

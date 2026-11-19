<template>
  <div class="composer" :class="{ disabled, loading }">
    <div class="composer-top">
      <div class="composer-field" :class="{ 'is-scrollable': fieldScrollable }">
        <textarea
          ref="textRef"
          :value="modelValue"
          class="composer-input"
          rows="1"
          :placeholder="t('home.composerPlaceholder')"
          :disabled="disabled"
          spellcheck="false"
          @input="onInput"
          @keydown.meta.enter.prevent="emitSubmit"
          @keydown.ctrl.enter.prevent="emitSubmit"
        />
      </div>
      <div class="composer-actions">
        <button
          type="button"
          class="ico-btn"
          :class="{ on: mathOpen }"
          :title="t('home.mathToggle')"
          :aria-expanded="mathOpen"
          :disabled="disabled"
          @click="toggleMath"
        >
          <Sigma :size="20" :stroke-width="2" />
        </button>
        <button
          type="button"
          class="ico-btn ico-submit"
          :title="t('home.submitTitle')"
          :disabled="disabled || !modelValue.trim()"
          @click="emitSubmit"
        >
          <LoaderCircle v-if="loading" class="spin" :size="20" :stroke-width="2.5" />
          <ArrowRight v-else :size="20" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <Transition name="math-slide">
      <div v-if="mathOpen" class="math-panel">
        <p class="math-hint">{{ t('home.mathHint') }}</p>
        <div class="math-row">
          <math-field
            ref="mathRef"
            class="math-field"
            :placeholder="t('home.mathPlaceholder')"
          />
          <button type="button" class="pill-action" :disabled="disabled" @click="insertMath">
            {{ t('home.mathInsert') }}
          </button>
        </div>
        <div v-if="previewHtml" class="math-preview" v-html="previewHtml" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ArrowRight, LoaderCircle, Sigma } from '@lucide/vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import 'mathlive'
import { useI18n } from '@/i18n'

const MIN_INPUT_PX = 76
const MAX_INPUT_PX = 220

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const { t } = useI18n()

const textRef = ref(null)
const mathRef = ref(null)
const mathOpen = ref(false)
const fieldScrollable = ref(false)

const previewHtml = computed(() => renderLatexPreview(props.modelValue))

function renderLatexPreview(text) {
  const src = String(text || '')
  const re = /\$([^$\n]+)\$|\\\(([^)]+)\\\)/g
  let m
  let last = 0
  const parts = []
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(escapeHtml(src.slice(last, m.index)))
    const latex = (m[1] || m[2] || '').trim()
    if (latex) {
      try {
        parts.push(katex.renderToString(latex, { throwOnError: false, displayMode: false }))
      } catch {
        parts.push(escapeHtml(m[0]))
      }
    }
    last = m.index + m[0].length
  }
  if (last < src.length) parts.push(escapeHtml(src.slice(last)))
  return parts.join('').replace(/\n/g, '<br/>')
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function syncTextareaHeight() {
  const ta = textRef.value
  if (!ta) return
  ta.style.height = '0px'
  const natural = Math.max(ta.scrollHeight, MIN_INPUT_PX)
  const capped = Math.min(natural, MAX_INPUT_PX)
  ta.style.height = `${capped}px`
  fieldScrollable.value = natural > MAX_INPUT_PX
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  nextTick(syncTextareaHeight)
}

function toggleMath() {
  mathOpen.value = !mathOpen.value
  if (mathOpen.value) {
    nextTick(() => mathRef.value?.focus?.())
  }
}

function insertMath() {
  const el = mathRef.value
  const latex = String(el?.value || '').trim()
  if (!latex) return
  const snippet = ` $${latex}$ `
  const ta = textRef.value
  if (!ta) {
    emit('update:modelValue', `${props.modelValue}${snippet}`)
    nextTick(syncTextareaHeight)
    return
  }
  const start = ta.selectionStart ?? props.modelValue.length
  const end = ta.selectionEnd ?? start
  const next = props.modelValue.slice(0, start) + snippet + props.modelValue.slice(end)
  emit('update:modelValue', next)
  el.value = ''
  nextTick(() => {
    const pos = start + snippet.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
    syncTextareaHeight()
  })
}

function emitSubmit() {
  if (props.disabled || !props.modelValue.trim()) return
  emit('submit')
}

watch(
  () => props.modelValue,
  () => nextTick(syncTextareaHeight),
)

onMounted(() => {
  syncTextareaHeight()
  if (mathRef.value) {
    mathRef.value.mathVirtualKeyboardPolicy = 'manual'
  }
})
</script>

<style scoped>
.composer {
  position: relative;
  width: 100%;
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 14px 36px rgba(15, 23, 42, 0.07);
  overflow: hidden;
  isolation: isolate;
  animation: composer-rise 0.72s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
  transition:
    border-color 0.35s ease,
    box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.composer:focus-within:not(.loading) {
  border-color: rgba(249, 115, 22, 0.4);
  transform: translateY(-3px);
  box-shadow:
    0 0 0 4px rgba(249, 115, 22, 0.08),
    0 8px 24px rgba(249, 115, 22, 0.1),
    0 20px 48px rgba(15, 23, 42, 0.09);
}

@keyframes composer-rise {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.composer.disabled {
  opacity: 0.9;
}

.composer.loading {
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 16px 42px rgba(249, 115, 22, 0.14);
}

.composer.loading::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 25px;
  background: conic-gradient(from 120deg, #f97316, #fde68a, #fff7ed, #fb923c, #f97316);
  animation: composer-orbit 2.4s linear infinite;
  z-index: 0;
}

.composer.loading::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff 0%, #fffaf5 100%);
  z-index: 0;
}

@keyframes composer-orbit {
  to {
    transform: rotate(360deg);
  }
}

.composer.loading .ico-submit:not(:disabled) {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  color: #ea580c;
}

.composer-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 14px 18px;
}

.composer-field {
  flex: 1;
  min-width: 0;
  position: relative;
}

.composer-field.is-scrollable::after {
  content: '';
  position: absolute;
  left: 0;
  right: 4px;
  bottom: 0;
  height: 22px;
  pointer-events: none;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0));
}

.composer-input {
  display: block;
  width: 100%;
  min-height: 76px;
  max-height: 220px;
  resize: none;
  overflow-x: hidden;
  overflow-y: auto;
  border: none;
  padding: 6px 4px 6px 0;
  font: inherit;
  font-size: 15px;
  line-height: 1.58;
  color: #0f172a;
  background: transparent;
  scrollbar-width: thin;
  scrollbar-color: rgba(249, 115, 22, 0.45) transparent;
  transition: color 0.2s ease;
}

.composer-input::-webkit-scrollbar {
  width: 5px;
}

.composer-input::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

.composer-input::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  transition: background 0.2s ease;
}

.composer-input:hover::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
}

.composer-input:focus::-webkit-scrollbar-thumb {
  background: rgba(249, 115, 22, 0.5);
}

.composer-input:focus {
  outline: none;
}

.composer-input::placeholder {
  color: #94a3b8;
  transition: color 0.25s ease;
}

.composer:focus-within .composer-input::placeholder {
  color: #cbd5e1;
}

.composer-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.ico-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.22s ease,
    color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.ico-btn:hover:not(:disabled) {
  background: #fff;
  color: #0f172a;
  border-color: #e2e8f0;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.ico-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
}

.ico-btn.on {
  background: #eef2ff;
  color: #4338ca;
  border-color: rgba(99, 102, 241, 0.2);
}

.ico-submit:not(:disabled) {
  background: linear-gradient(145deg, #fff7ed, #ffedd5);
  color: #ea580c;
  border-color: rgba(249, 115, 22, 0.15);
}

.ico-submit:not(:disabled):hover {
  background: linear-gradient(145deg, #ffedd5, #fed7aa);
  color: #c2410c;
  box-shadow: 0 6px 18px rgba(249, 115, 22, 0.2);
}

.ico-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
}

.math-slide-enter-active,
.math-slide-leave-active {
  overflow: hidden;
  transition:
    opacity 0.32s ease,
    max-height 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.math-slide-enter-from,
.math-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.math-slide-enter-to,
.math-slide-leave-from {
  opacity: 1;
  max-height: 320px;
  transform: translateY(0);
}

.math-panel {
  position: relative;
  z-index: 1;
  padding: 0 18px 16px;
  border-top: 1px solid rgba(241, 245, 249, 0.9);
}

.math-hint {
  margin: 14px 0 10px;
  font-size: 12px;
  color: #64748b;
}

.math-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.math-field {
  flex: 1;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 18px;
  background: #fafafa;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.math-field:focus-within {
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}

.pill-action {
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 650;
  background: #eef2ff;
  color: #4338ca;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.pill-action:hover:not(:disabled) {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.math-preview {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 14px;
  line-height: 1.5;
  color: #334155;
  overflow-x: auto;
  animation: preview-in 0.35s ease both;
}

@keyframes preview-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .composer-top {
    padding: 12px;
  }
  .composer-actions {
    flex-direction: row;
  }
}
</style>

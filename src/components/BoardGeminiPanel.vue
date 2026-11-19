<template>
  <aside class="gemini-panel" aria-label="Gemini">
    <header class="gemini-head">
      <span class="gemini-badge">Gemini</span>
      <h2 class="gemini-title">{{ t('board.geminiTitle') }}</h2>
      <p class="gemini-lede">{{ t('board.geminiLede') }}</p>
    </header>

    <textarea
      v-model="prompt"
      class="gemini-prompt"
      rows="4"
      :placeholder="t('board.geminiPlaceholder')"
      :disabled="loading"
    />

    <div class="gemini-actions">
      <button type="button" class="gemini-btn" :disabled="loading" @click="run(false)">
        {{ loading ? t('board.geminiBusy') : t('board.geminiReadBoard') }}
      </button>
      <button type="button" class="gemini-btn primary" :disabled="loading" @click="run(true)">
        {{ t('board.geminiDraw') }}
      </button>
    </div>

    <p v-if="errorText" class="gemini-error" role="alert">{{ errorText }}</p>

    <div v-if="result" class="gemini-result">
      <p v-if="result.standardText" class="gemini-block">
        <strong>{{ t('board.regionStandard') }}</strong>
        {{ result.standardText }}
      </p>
      <p v-if="result.summary" class="gemini-block">
        <strong>{{ t('board.geminiSummary') }}</strong>
        {{ result.summary }}
      </p>
      <div v-if="result.latex?.length" class="gemini-block">
        <strong>{{ t('board.geminiLatex') }}</strong>
        <ul>
          <li v-for="(lx, i) in result.latex" :key="`lx-${i}`">{{ lx }}</li>
        </ul>
      </div>
      <div v-if="result.suggestions?.length" class="gemini-block">
        <strong>{{ t('board.geminiHints') }}</strong>
        <ul>
          <li v-for="(h, i) in result.suggestions" :key="`h-${i}`">{{ h }}</li>
        </ul>
      </div>
      <p v-if="result.model" class="gemini-meta">{{ result.model }}</p>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'

const props = defineProps({
  capture: { type: Function, required: true },
})

const emit = defineEmits(['apply-spec'])

const { t } = useI18n()
const prompt = ref('')
const loading = ref(false)
const errorText = ref('')
const result = ref(null)

async function run(wantSpec) {
  if (loading.value) return
  loading.value = true
  errorText.value = ''
  try {
    const snap = (await props.capture()) || {}
    const data = await api.draw.boardGemini({
      prompt: prompt.value.trim(),
      imageBase64: snap.imageBase64 || '',
      strokesSummary: snap.strokesSummary || '',
      wantSpec,
    })
    result.value = data
    if (data?.spec) emit('apply-spec', data.spec)
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err, 'board.geminiErr') : t('board.geminiErr')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gemini-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(340px, 100%);
  max-height: 100%;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(165deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  overflow: auto;
}

.gemini-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gemini-badge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.gemini-title {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
  color: #0f172a;
}

.gemini-lede {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.gemini-prompt {
  width: 100%;
  min-height: 88px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 13px;
  line-height: 1.45;
  resize: vertical;
}

.gemini-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gemini-btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.gemini-btn.primary {
  border-color: #c4b5fd;
  background: linear-gradient(180deg, #f5f3ff, #ede9fe);
  color: #5b21b6;
}

.gemini-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.gemini-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.gemini-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.gemini-block {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #334155;
}

.gemini-block ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.gemini-meta {
  margin: 0;
  font-size: 10px;
  color: #94a3b8;
}
</style>

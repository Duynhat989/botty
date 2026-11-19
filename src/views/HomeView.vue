<template>
  <div class="home">
    <div class="glow glow-a" aria-hidden="true" />
    <div class="glow glow-b" aria-hidden="true" />

    <section class="workspace">
      <header class="page-head">
        <div class="brand">
          <img src="/logo.png" alt="" width="120" height="120" class="logo" />
          <h1 class="title">Dyna<span class="accent">Geo</span></h1>
          <p class="lede">{{ t('home.sub') }}</p>
        </div>
      </header>

      <ProblemComposer
        v-model="problemText"
        :loading="analyzing"
        :disabled="analyzing"
        @submit="analyze"
      />

      <p v-if="errorText" class="form-error" role="alert">{{ errorText }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDrawSessionStore } from '@/stores/drawSession'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import { getSpecParams } from '@/modules/draw.min.js'
import ProblemComposer from '@/components/ProblemComposer.vue'

const { t } = useI18n()
const router = useRouter()
const session = useDrawSessionStore()

const problemText = ref('')
const analyzing = ref(false)
const errorText = ref('')
function buildParamValues(spec) {
  const base = getSpecParams(spec)
  const out = {}
  for (const p of spec?.params || []) {
    if (!p?.id) continue
    out[p.id] = base[p.id] ?? Number(p.value) ?? 0
  }
  return out
}

async function analyze() {
  const text = problemText.value.trim()
  if (!text || analyzing.value) return
  analyzing.value = true
  errorText.value = ''
  try {
    const data = await api.draw.analyze({ problem: text, mode: 'auto' })
    const spec = data.spec
    const title = data.meta?.title || spec?.title || ''
    const notes = data.meta?.notes || spec?.notes || ''
    const paramValues = buildParamValues(spec)
    session.setFromAnalyze({
      problem: text,
      spec,
      title,
      notes,
      paramValues,
      meta: data.meta,
    })
    if (data.project?.uuid) {
      session.setProjectUuid(data.project.uuid)
    } else {
      session.setProjectUuid('')
    }
    session.writingBoard = false
    await router.push({ name: 'draw' })
  } catch (err) {
    errorText.value = err instanceof ApiError ? apiMessage(err) : t('home.problemError')
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.home {
  position: relative;
  min-height: calc(100vh - 120px);
  padding: 32px 20px 56px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}

.glow-a {
  width: 480px;
  height: 480px;
  top: -180px;
  right: -80px;
  background: rgba(249, 115, 22, 0.12);
}

.glow-b {
  width: 420px;
  height: 420px;
  bottom: -100px;
  left: -100px;
  background: rgba(139, 92, 246, 0.1);
}

.workspace {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.page-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  animation: brand-in 0.55s ease-out both;
}

.logo {
  width: clamp(96px, 18vw, 120px);
  height: clamp(96px, 18vw, 120px);
  border-radius: 0;
  object-fit: contain;
  background: transparent;
  box-shadow: none;
  display: block;
}

.title {
  margin: 0;
  font-size: clamp(2.25rem, 6vw, 3.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.95),
    0 8px 28px rgba(15, 23, 42, 0.12);
}

.title .accent {
  color: var(--accent, #f97316);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 24px rgba(249, 115, 22, 0.35);
}

.lede {
  margin: 0;
  font-size: clamp(15px, 2.2vw, 17px);
  font-weight: 600;
  color: #1e293b;
  max-width: 36rem;
  line-height: 1.55;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.92),
    0 4px 16px rgba(255, 255, 255, 0.65);
}

.workspace :deep(.composer) {
  margin-top: 4px;
  width: 100%;
}

@keyframes brand-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-error {
  margin: -6px 0 0;
  font-size: 13px;
  color: #dc2626;
  text-align: center;
}
</style>

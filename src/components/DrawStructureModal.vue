<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="t('structure.modalAria')"
      @click.self="emit('close')"
    >
      <article class="modal-card" @click.stop>
        <header class="modal-head">
          <h2 class="modal-title">{{ t('structure.shareModalTitle') }}</h2>
          <button type="button" class="icon-btn" :aria-label="t('structure.close')" @click="emit('close')">
            <X :size="20" />
          </button>
        </header>

        <p class="modal-lead">{{ t('structure.shareModalLead') }}</p>

        <div class="perm-block">
          <section class="perm-section">
            <h3 class="perm-section__title">{{ t('structure.previewLinkPerm') }}</h3>
            <div class="perm-choices">
              <label class="perm-choice" :class="{ 'is-checked': previewAccess === 'public' }">
                <input v-model="previewAccess" type="radio" name="previewAccess" value="public" />
                <span class="perm-choice__bullet" aria-hidden="true"></span>
                <span class="perm-choice__label">{{ t('structure.accessEveryone') }}</span>
              </label>
              <label class="perm-choice" :class="{ 'is-checked': previewAccess === 'owner' }">
                <input v-model="previewAccess" type="radio" name="previewAccess" value="owner" />
                <span class="perm-choice__bullet" aria-hidden="true"></span>
                <span class="perm-choice__label">{{ t('structure.accessPersonal') }}</span>
              </label>
            </div>
          </section>

          <section class="perm-section">
            <h3 class="perm-section__title">{{ t('structure.editLinkPerm') }}</h3>
            <div class="perm-choices">
              <label class="perm-choice" :class="{ 'is-checked': editAccess === 'owner' }">
                <input v-model="editAccess" type="radio" name="editAccess" value="owner" />
                <span class="perm-choice__bullet" aria-hidden="true"></span>
                <span class="perm-choice__label">{{ t('structure.accessPersonal') }}</span>
              </label>
              <label class="perm-choice" :class="{ 'is-checked': editAccess === 'public' }">
                <input v-model="editAccess" type="radio" name="editAccess" value="public" />
                <span class="perm-choice__bullet" aria-hidden="true"></span>
                <span class="perm-choice__label">{{ t('structure.accessEveryone') }}</span>
              </label>
            </div>
          </section>

          <p class="perm-hint">{{ t('structure.accessPersonalHint') }}</p>
        </div>

        <div v-if="links.previewUrl" class="links">
          <div class="link-row">
            <span class="link-label">{{ t('structure.previewLink') }}</span>
            <input class="link-input" :value="links.previewUrl" readonly />
            <button type="button" class="btn ghost" @click="copy(links.previewUrl)">{{ t('structure.copy') }}</button>
          </div>
          <div class="link-row">
            <span class="link-label">{{ t('structure.editLink') }}</span>
            <input class="link-input" :value="links.editUrl" readonly />
            <button type="button" class="btn ghost" @click="copy(links.editUrl)">{{ t('structure.copy') }}</button>
          </div>
          <p v-if="copyHint" class="copy-hint">{{ copyHint }}</p>
        </div>
        <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>

        <footer class="modal-foot">
          <button type="button" class="btn ghost" :disabled="saving" @click="emit('close')">
            {{ t('structure.close') }}
          </button>
          <button type="button" class="btn primary" :disabled="saving || !spec" @click="saveLinks">
            <LoaderCircle v-if="saving" class="spin" :size="18" />
            <span>{{ links.previewUrl ? t('structure.updateLinks') : t('structure.saveLinks') }}</span>
          </button>
        </footer>
      </article>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { LoaderCircle, X } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { ApiError } from '@/api/client'
import { useDrawSessionStore } from '@/stores/drawSession'

const props = defineProps({
  open: { type: Boolean, default: false },
  spec: { type: Object, default: null },
  paramValues: { type: Object, default: () => ({}) },
  title: { type: String, default: '' },
  notes: { type: String, default: '' },
  problem: { type: String, default: '' },
  mode: { type: String, default: '2d' },
  editUuid: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useI18n()
const session = useDrawSessionStore()

const saving = ref(false)
const saveError = ref('')
const copyHint = ref('')
const previewAccess = ref('public')
const editAccess = ref('owner')
const links = reactive({ previewUrl: '', editUrl: '', previewUuid: '', editUuid: '' })

watch(
  () => props.open,
  (v) => {
    if (!v) return
    saveError.value = ''
    copyHint.value = ''
    if (!props.editUuid) {
      links.previewUrl = ''
      links.editUrl = ''
      previewAccess.value = 'public'
      editAccess.value = 'owner'
    }
  },
)

async function saveLinks() {
  if (!props.spec || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    const body = {
      problem: props.problem,
      mode: props.mode,
      spec: props.spec,
      meta: { title: props.title, notes: props.notes },
      paramValues: { ...(props.paramValues || {}) },
      title: props.title,
      previewAccess: previewAccess.value,
      editAccess: editAccess.value,
    }
    const data = props.editUuid
      ? await api.structures.update(props.editUuid, body)
      : await api.structures.create(body)
    links.previewUrl = data.previewUrl
    links.editUrl = data.editUrl
    links.previewUuid = data.previewUuid
    links.editUuid = data.editUuid
    if (data.previewAccess) previewAccess.value = data.previewAccess
    if (data.editAccess) editAccess.value = data.editAccess
    session.setEditUuid(data.editUuid || '')
    const projectUuid = session.projectUuid
    if (projectUuid) {
      try {
        await api.projects.update(projectUuid, {
          draft: {
            problem: props.problem,
            spec: props.spec,
            title: props.title,
            notes: props.notes,
            paramValues: { ...(props.paramValues || {}) },
            meta: { title: props.title, notes: props.notes },
            editUuid: data.editUuid || '',
            previewUrl: data.previewUrl || '',
            editUrl: data.editUrl || '',
          },
        })
      } catch {
        /* giữ link dù không sync project */
      }
    }
    emit('saved', data)
  } catch (err) {
    saveError.value = err instanceof ApiError ? apiMessage(err) : t('structure.saveError')
  } finally {
    saving.value = false
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyHint.value = t('structure.copied')
    setTimeout(() => {
      copyHint.value = ''
    }, 2000)
  } catch {
    copyHint.value = text
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  width: min(460px, 100%);
  background: linear-gradient(168deg, #ffffff 0%, #f8fafc 55%, #fffbf5 100%);
  border-radius: 22px;
  padding: 22px 22px 20px;
  box-shadow:
    0 24px 80px rgba(15, 23, 42, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.modal-title {
  margin: 0;
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.3;
}

.modal-lead {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.55;
  color: #64748b;
}

.icon-btn {
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 11px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #64748b;
  flex-shrink: 0;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.icon-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.perm-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.perm-section {
  padding: 12px 13px 13px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.perm-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.perm-section__title::before {
  content: '';
  width: 3px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fdba74, #f97316);
  flex-shrink: 0;
}

.perm-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perm-choice {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 12px;
  row-gap: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.9);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.perm-choice:hover {
  border-color: #cbd5e1;
  background: #fff;
}

.perm-choice.is-checked {
  border-color: rgba(249, 115, 22, 0.42);
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.95), rgba(255, 247, 237, 0.98));
  box-shadow: 0 2px 10px rgba(249, 115, 22, 0.1);
}

.perm-choice input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}

.perm-choice__bullet {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #fff;
  position: relative;
  flex-shrink: 0;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.perm-choice.is-checked .perm-choice__bullet {
  border-color: #f97316;
  background: #fff7ed;
}

.perm-choice.is-checked .perm-choice__bullet::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(180deg, #fb923c, #f97316);
  transform: translate(-50%, -50%);
}

.perm-choice__label {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
  color: #334155;
  text-align: left;
  justify-self: start;
}

.perm-choice.is-checked .perm-choice__label {
  color: #9a3412;
}

.perm-hint {
  margin: 2px 0 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid #f1f5f9;
}

.links {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.85);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
}

.link-label {
  grid-column: 1 / -1;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.link-input {
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  background: #f8fafc;
  min-width: 0;
}

@media (max-width: 520px) {
  .link-row {
    grid-template-columns: 1fr;
  }
}

.access-summary {
  margin: 0 0 4px;
  font-size: 12px;
  color: #64748b;
}

.modal-foot {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.85);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 650;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.btn.primary {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.28);
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(234, 88, 12, 0.32);
}

.btn.ghost {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.btn.ghost:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-error {
  margin: 10px 0 0;
  color: #dc2626;
  font-size: 13px;
}

.copy-hint {
  margin: 0;
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

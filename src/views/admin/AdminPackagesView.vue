<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.packagesTitle') }}</h1>
        <p>{{ t('admin.packagesLede') }}</p>
      </div>
      <button type="button" class="primary" @click="startCreate">{{ t('admin.addPackage') }}</button>
    </header>

    <form class="form pricing-settings" @submit.prevent="savePricing">
      <header class="form-head">
        <strong>{{ t('admin.pricingPageTitle') }}</strong>
        <p>{{ t('admin.pricingPageLede') }}</p>
      </header>
      <div class="form-grid">
        <label>{{ t('admin.pricingKicker') }}
          <input v-model="pricingPage.kicker" maxlength="80" />
        </label>
        <label>{{ t('admin.pricingTitle') }}
          <input v-model="pricingPage.title" maxlength="160" />
        </label>
        <label class="full">{{ t('admin.pricingLede') }}
          <textarea v-model="pricingPage.lede" rows="2" maxlength="500" />
        </label>
        <label>{{ t('admin.freeTitle') }}
          <input v-model="pricingFree.title" maxlength="120" />
        </label>
        <label>{{ t('admin.freeMaxBots') }}
          <input v-model.number="pricingFree.maxBots" type="number" min="1" max="100" />
        </label>
        <label class="full">{{ t('admin.freeBullets') }}
          <textarea v-model="pricingFreeBullets" rows="4" :placeholder="t('admin.bulletsPh')" />
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary" :disabled="pricingSaving">{{ t('admin.save') }}</button>
        <span v-if="pricingNotice" class="hint ok">{{ pricingNotice }}</span>
      </div>
    </form>

    <div class="toolbar">
      <input v-model="q" type="search" :placeholder="t('admin.searchPackage')" @keydown.enter="reload(1)" />
      <select v-model="active">
        <option value="">{{ t('admin.filterAllActive') }}</option>
        <option value="true">{{ t('admin.activeYes') }}</option>
        <option value="false">{{ t('admin.activeNo') }}</option>
      </select>
      <button type="button" class="primary" :disabled="loading" @click="reload(1)">{{ t('admin.apply') }}</button>
    </div>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('admin.colCode') }}</th>
            <th>{{ t('admin.pkgName') }}</th>
            <th>{{ t('admin.colCredits') }}</th>
            <th>{{ t('admin.pkgPrice') }}</th>
            <th>{{ t('admin.pkgMonthlyConversations') }}</th>
            <th>{{ t('admin.pkgMaxBots') }}</th>
            <th>{{ t('admin.pkgSort') }}</th>
            <th>{{ t('admin.colStatus') }}</th>
            <th>{{ t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.code }}</strong>
              <span v-if="item.highlight">highlight</span>
            </td>
            <td>
              <strong>{{ item.name }}</strong>
              <span>{{ item.description }}</span>
            </td>
            <td>{{ item.credits }}</td>
            <td>{{ formatVnd(item.priceVnd) }}</td>
            <td>{{ item.monthlyConversations ?? '—' }}</td>
            <td>{{ item.maxBots ?? '∞' }}</td>
            <td>{{ item.sortOrder }}</td>
            <td>{{ item.active ? t('admin.activeYes') : t('admin.activeNo') }}</td>
            <td>
              <button type="button" class="ghost" @click="startEdit(item)">{{ t('admin.edit') }}</button>
              <button type="button" class="ghost" @click="toggleActive(item)">
                {{ item.active ? t('admin.deactivate') : t('admin.activate') }}
              </button>
              <button type="button" class="ghost danger" @click="removePackage(item)">
                {{ t('common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length" class="hint">{{ t('admin.emptyPackages') }}</p>
    </div>

    <AdminPager :meta="meta" :loading="loading" @change="reload" />

    <Teleport to="body">
      <div
        v-if="editing"
        class="admin-modal-root"
        role="dialog"
        aria-modal="true"
        :aria-label="editing.id ? t('admin.editPackage') : t('admin.addPackage')"
      >
        <button class="admin-modal-backdrop" type="button" :aria-label="t('common.close')" @click="closeEdit" />
        <form class="admin-modal-panel wide pkg-modal" @submit.prevent="save">
          <header class="admin-modal-head">
            <div>
              <strong>{{ editing.id ? t('admin.editPackage') : t('admin.addPackage') }}</strong>
              <span v-if="editing.id">{{ form.code }}</span>
            </div>
            <button type="button" class="admin-modal-close" :aria-label="t('common.close')" @click="closeEdit">
              ×
            </button>
          </header>

          <p v-if="modalError" class="alert modal-alert">{{ modalError }}</p>

          <div class="pkg-modal-grid">
            <label>
              <span>{{ t('admin.pkgCode') }}</span>
              <input
                v-model="form.code"
                required
                maxlength="64"
                autocomplete="off"
                :readonly="Boolean(editing.id)"
                @input="form.code = form.code.toUpperCase()"
              />
            </label>
            <label>
              <span>{{ t('admin.pkgName') }}</span>
              <input v-model="form.name" required maxlength="120" />
            </label>
            <label class="full">
              <span>{{ t('admin.pkgDesc') }}</span>
              <textarea v-model="form.description" rows="3" required maxlength="500" />
            </label>
            <label>
              <span>{{ t('admin.pkgCredits') }}</span>
              <input v-model.number="form.credits" type="number" :min="form.kind === 'bot_hosting' ? 0 : 1" required />
            </label>
            <label>
              <span>{{ t('admin.pkgPrice') }}</span>
              <input v-model.number="form.priceVnd" type="number" min="0" required />
            </label>
            <label>
              <span>{{ t('admin.pkgSort') }}</span>
              <input v-model.number="form.sortOrder" type="number" />
            </label>
            <label>
              <span>{{ t('admin.pkgKind') }}</span>
              <select v-model="form.kind">
                <option value="bot_hosting">Botty AI (bán)</option>
                <option value="credits">Credits (legacy)</option>
                <option value="display_free">Chỉ hiển thị</option>
              </select>
            </label>
            <label v-if="form.kind === 'bot_hosting'">
              <span>{{ t('admin.pkgMonthlyConversations') }}</span>
              <input v-model.number="form.monthlyConversations" type="number" min="0" step="100" />
            </label>
            <label>
              <span>{{ t('admin.pkgMaxBots') }}</span>
              <input
                v-model.number="form.maxBots"
                type="number"
                min="0"
                step="1"
                placeholder="0 = không giới hạn"
              />
            </label>
            <label>
              <span>{{ t('admin.pkgBadge') }}</span>
              <input v-model="form.badgeLabel" maxlength="40" placeholder="Phổ biến" />
            </label>
            <label class="full">
              <span>{{ t('admin.pkgBullets') }}</span>
              <textarea v-model="form.bulletsText" rows="4" :placeholder="t('admin.bulletsPh')" />
            </label>
          </div>

          <label class="admin-modal-check">
            <input v-model="form.highlight" type="checkbox" />
            <span>{{ t('admin.pkgHighlight') }}</span>
          </label>
          <label class="admin-modal-check">
            <input v-model="form.active" type="checkbox" />
            <span>{{ t('admin.pkgActive') }}</span>
          </label>

          <div class="admin-modal-actions">
            <button type="button" class="ghost" :disabled="saving" @click="closeEdit">{{ t('common.cancel') }}</button>
            <button type="submit" class="primary" :disabled="saving">
              {{ saving ? t('admin.loading') : t('admin.save') }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { api } from '@/api'
import { ApiError } from '@/api/client'
import { apiMessage } from '@/api/messages'
import { useI18n } from '@/i18n'
import { formatVnd } from '@/utils/format'
import AdminPager from '@/components/AdminPager.vue'
import './admin-shared.css'

const { t } = useI18n()
const items = ref([])
const meta = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const modalError = ref('')
const q = ref('')
const active = ref('')
const editing = ref(null)
const form = reactive({
  code: '',
  name: '',
  description: '',
  credits: 0,
  priceVnd: 99000,
  sortOrder: 0,
  highlight: false,
  active: true,
  kind: 'bot_hosting',
  monthlyConversations: 3000,
  maxBots: 0,
  badgeLabel: '',
  bulletsText: '',
})

const pricingPage = reactive({ kicker: '', title: '', lede: '' })
const pricingFree = reactive({
  title: '',
  maxBots: 1,
  bullets: [],
})
const pricingFreeBullets = computed({
  get: () => (Array.isArray(pricingFree.bullets) ? pricingFree.bullets.join('\n') : ''),
  set: (v) => {
    pricingFree.bullets = String(v || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  },
})
const pricingSaving = ref(false)
const pricingNotice = ref('')

function fillForm(item) {
  form.code = String(item?.code || '').trim().toUpperCase()
  form.name = item?.name || ''
  form.description = item?.description || ''
  form.credits = item?.credits ?? 0
  form.priceVnd = item?.priceVnd ?? 99000
  form.sortOrder = item?.sortOrder ?? 0
  form.highlight = Boolean(item?.highlight)
  form.active = item?.active !== false
  form.kind = item?.kind || 'bot_hosting'
  form.monthlyConversations = item?.monthlyConversations ?? 3000
  form.maxBots = item?.maxBots ?? 0
  form.badgeLabel = item?.badgeLabel || ''
  form.bulletsText = Array.isArray(item?.bullets) ? item.bullets.join('\n') : ''
}

function closeEdit() {
  editing.value = null
  modalError.value = ''
  saving.value = false
}

function startCreate() {
  modalError.value = ''
  editing.value = { id: null }
  fillForm(null)
}

function startEdit(item) {
  modalError.value = ''
  editing.value = { id: item.id }
  fillForm(item)
}

async function reload(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const data = await api.admin.packages({
      page,
      limit: 20,
      q: q.value || undefined,
      active: active.value || undefined,
    })
    items.value = data.items || []
    meta.value = data.meta || null
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  modalError.value = ''
  try {
    const body = {
      code: String(form.code).trim().toUpperCase(),
      name: form.name,
      description: form.description,
      credits: form.credits,
      priceVnd: form.priceVnd,
      sortOrder: form.sortOrder,
      highlight: form.highlight,
      active: form.active,
      kind: form.kind,
      monthlyConversations: form.monthlyConversations,
      maxBots: form.maxBots <= 0 ? null : form.maxBots,
      badgeLabel: form.badgeLabel || null,
      bullets: String(form.bulletsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    if (editing.value?.id) {
      const updated = await api.admin.updatePackage(editing.value.id, body)
      items.value = items.value.map((row) => (row.id === updated.id ? updated : row))
    } else {
      await api.admin.createPackage(body)
      await reload(1)
    }
    closeEdit()
  } catch (err) {
    const raw = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
    modalError.value = String(raw || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400)
  } finally {
    saving.value = false
  }
}

async function toggleActive(item) {
  error.value = ''
  try {
    const updated = await api.admin.updatePackage(item.id, { active: !item.active })
    items.value = items.value.map((row) => (row.id === item.id ? updated : row))
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  }
}

async function removePackage(item) {
  const label = item.name || item.code || `#${item.id}`
  if (!window.confirm(t('admin.confirmDeletePackage', { name: label }))) return
  error.value = ''
  if (editing.value?.id === item.id) closeEdit()
  try {
    await api.admin.deletePackage(item.id)
    items.value = items.value.filter((row) => row.id !== item.id)
    if (meta.value) {
      meta.value = { ...meta.value, total: Math.max(0, (meta.value.total || 1) - 1) }
    }
    await reload(meta.value?.page || 1)
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  }
}

async function loadPricing() {
  try {
    const data = await api.admin.getPricingSettings()
    if (data?.page) {
      pricingPage.kicker = data.page.kicker || ''
      pricingPage.title = data.page.title || ''
      pricingPage.lede = data.page.lede || ''
    }
    if (data?.free) {
      pricingFree.title = data.free.title || ''
      pricingFree.maxBots = data.free.maxBots ?? 1
      pricingFree.bullets = data.free.bullets || []
    }
  } catch {
    /* optional */
  }
}

async function savePricing() {
  pricingSaving.value = true
  pricingNotice.value = ''
  try {
    await api.admin.updatePricingSettings({
      page: { ...pricingPage },
      free: {
        ...pricingFree,
        bullets: pricingFree.bullets,
      },
    })
    pricingNotice.value = t('admin.userSavedOk')
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    pricingSaving.value = false
  }
}

onMounted(() => {
  reload(1)
  loadPricing()
})
</script>

<style scoped>
.pricing-settings {
  margin-bottom: 8px;
  border: 1px solid #c4b5fd;
  background: #faf5ff;
}

.admin-page table .ghost.danger {
  color: #b91c1c;
}

.pkg-modal {
  max-height: min(90vh, 720px);
  overflow: auto;
}

.pkg-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.pkg-modal-grid .full {
  grid-column: 1 / -1;
}

.modal-alert {
  margin: 0 0 8px;
  white-space: normal;
  word-break: break-word;
  max-height: 4.5rem;
  overflow: auto;
}

@media (max-width: 640px) {
  .pkg-modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>

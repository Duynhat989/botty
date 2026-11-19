<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.packagesTitle') }}</h1>
        <p>{{ t('admin.packagesLede') }}</p>
      </div>
      <button type="button" class="primary" @click="startCreate">{{ t('admin.addPackage') }}</button>
    </header>

    <div class="toolbar">
      <input v-model="q" type="search" :placeholder="t('admin.searchPackage')" @keydown.enter="reload(1)" />
      <select v-model="active">
        <option value="">{{ t('admin.filterAllActive') }}</option>
        <option value="true">{{ t('admin.activeYes') }}</option>
        <option value="false">{{ t('admin.activeNo') }}</option>
      </select>
      <button type="button" class="primary" :disabled="loading" @click="reload(1)">{{ t('admin.apply') }}</button>
    </div>

    <form v-if="editing" class="form" @submit.prevent="save">
      <header class="form-head">
        <strong>{{ editing.id ? t('admin.editPackage') : t('admin.addPackage') }}</strong>
        <p>{{ editing.id ? form.code : t('admin.packagesLede') }}</p>
      </header>
      <div class="form-grid">
        <label>{{ t('admin.pkgCode') }}
          <input v-model="form.code" required maxlength="64" />
        </label>
        <label>{{ t('admin.pkgName') }}
          <input v-model="form.name" required maxlength="120" />
        </label>
        <label class="full">{{ t('admin.pkgDesc') }}
          <textarea v-model="form.description" rows="3" required maxlength="500" />
        </label>
        <label>{{ t('admin.pkgCredits') }}
          <input v-model.number="form.credits" type="number" min="1" required />
        </label>
        <label>{{ t('admin.pkgPrice') }}
          <input v-model.number="form.priceVnd" type="number" min="0" required />
        </label>
        <label>{{ t('admin.pkgSort') }}
          <input v-model.number="form.sortOrder" type="number" />
        </label>
        <div class="checks">
          <label><input v-model="form.highlight" type="checkbox" /> {{ t('admin.pkgHighlight') }}</label>
          <label><input v-model="form.active" type="checkbox" /> {{ t('admin.pkgActive') }}</label>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="primary" :disabled="saving">{{ t('admin.save') }}</button>
        <button type="button" class="ghost" @click="editing = null">{{ t('common.close') }}</button>
      </div>
    </form>

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
            <td>{{ item.sortOrder }}</td>
            <td>{{ item.active ? t('admin.activeYes') : t('admin.activeNo') }}</td>
            <td>
              <button type="button" class="ghost" @click="startEdit(item)">{{ t('admin.edit') }}</button>
              <button type="button" class="ghost" @click="toggleActive(item)">
                {{ item.active ? t('admin.deactivate') : t('admin.activate') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length" class="hint">{{ t('admin.emptyPackages') }}</p>
    </div>

    <AdminPager :meta="meta" :loading="loading" @change="reload" />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
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
const q = ref('')
const active = ref('')
const editing = ref(null)
const form = reactive({
  code: '',
  name: '',
  description: '',
  credits: 100,
  priceVnd: 99000,
  sortOrder: 0,
  highlight: false,
  active: true,
})

function fillForm(item) {
  form.code = item?.code || ''
  form.name = item?.name || ''
  form.description = item?.description || ''
  form.credits = item?.credits ?? 100
  form.priceVnd = item?.priceVnd ?? 99000
  form.sortOrder = item?.sortOrder ?? 0
  form.highlight = Boolean(item?.highlight)
  form.active = item?.active !== false
}

function startCreate() {
  editing.value = { id: null }
  fillForm(null)
}

function startEdit(item) {
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
  error.value = ''
  try {
    const body = { ...form }
    if (editing.value?.id) {
      const updated = await api.admin.updatePackage(editing.value.id, body)
      items.value = items.value.map((row) => (row.id === updated.id ? updated : row))
    } else {
      await api.admin.createPackage(body)
      await reload(1)
    }
    editing.value = null
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
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

onMounted(() => reload(1))
</script>

<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.botsTitle') }}</h1>
        <p>{{ t('admin.botsLede') }}</p>
      </div>
    </header>

    <div class="toolbar">
      <input v-model="q" type="search" :placeholder="t('admin.searchBot')" @keydown.enter="reload(1)" />
      <button type="button" class="primary" :disabled="loading" @click="reload(1)">{{ t('admin.apply') }}</button>
    </div>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Bot</th>
            <th>Chủ sở hữu</th>
            <th>AI</th>
            <th>FB</th>
            <th>{{ t('admin.colCreated') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.publicId">
            <td>{{ item.id }}</td>
            <td>
              <strong>{{ item.name }}</strong>
              <span>{{ item.publicId }}</span>
            </td>
            <td>
              <strong>{{ item.ownerName || '—' }}</strong>
              <span>{{ item.ownerEmail || '—' }}</span>
            </td>
            <td>{{ item.aiProvider }}</td>
            <td>{{ item.hasFacebookToken ? '✓' : '—' }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length" class="hint">{{ t('admin.emptyBots') }}</p>
    </div>

    <AdminPager :meta="meta" :loading="loading" @page="reload" />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'
import { useI18n } from '@/i18n'
import AdminPager from '@/components/AdminPager.vue'
import './admin-shared.css'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const q = ref('')
const items = ref([])
const meta = ref(null)

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString('vi-VN')
}

async function reload(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const data = await api.admin.bots({ page, limit: 20, q: q.value || undefined })
    items.value = data.items || []
    meta.value = data.meta || null
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

onMounted(() => reload(1))
</script>
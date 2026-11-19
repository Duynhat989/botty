<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.ordersTitle') }}</h1>
        <p>{{ t('admin.ordersLede') }}</p>
      </div>
    </header>

    <div class="toolbar">
      <input v-model="q" type="search" :placeholder="t('admin.searchOrder')" @keydown.enter="reload(1)" />
      <select v-model="status">
        <option value="">{{ t('admin.filterAllStatus') }}</option>
        <option value="pending">pending</option>
        <option value="paid">paid</option>
        <option value="cancelled">cancelled</option>
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
            <th>{{ t('admin.colUser') }}</th>
            <th>{{ t('admin.colPackage') }}</th>
            <th>{{ t('admin.colAmount') }}</th>
            <th>{{ t('admin.colCredits') }}</th>
            <th>{{ t('admin.colStatus') }}</th>
            <th>{{ t('admin.colCreated') }}</th>
            <th>{{ t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.code }}</strong>
              <span>{{ item.billingPeriod }}</span>
            </td>
            <td>
              <strong>{{ item.userName || '—' }}</strong>
              <span>{{ item.userEmail }}</span>
            </td>
            <td>
              <strong>{{ item.packageName || '—' }}</strong>
              <span>{{ item.packageCode }}</span>
            </td>
            <td>{{ formatVnd(item.amountVnd) }}</td>
            <td>{{ item.credits }}</td>
            <td>
              <select :value="item.status" @change="patch(item, $event.target.value)">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="cancelled">cancelled</option>
              </select>
            </td>
            <td>{{ formatWhen(item.createdAt) }}</td>
            <td>
              <button
                v-if="item.status === 'pending'"
                type="button"
                class="primary"
                @click="patch(item, 'paid')"
              >
                {{ t('admin.markPaid') }}
              </button>
              <button
                v-else-if="item.status === 'paid'"
                type="button"
                class="ghost"
                @click="patch(item, 'cancelled')"
              >
                {{ t('admin.markCancel') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length" class="hint">{{ t('admin.emptyOrders') }}</p>
    </div>

    <AdminPager :meta="meta" :loading="loading" @change="reload" />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/api'
import { ApiError } from '@/api/client'
import { apiMessage } from '@/api/messages'
import { useI18n } from '@/i18n'
import { formatVnd, formatWhen } from '@/utils/format'
import AdminPager from '@/components/AdminPager.vue'
import './admin-shared.css'

const { t } = useI18n()
const items = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')
const q = ref('')
const status = ref('')

async function reload(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const data = await api.admin.orders({
      page,
      limit: 20,
      q: q.value || undefined,
      status: status.value || undefined,
    })
    items.value = data.items || []
    meta.value = data.meta || null
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

async function patch(item, nextStatus) {
  error.value = ''
  try {
    const updated = await api.admin.updateOrder(item.id, { status: nextStatus })
    items.value = items.value.map((row) => (row.id === item.id ? updated : row))
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
    await reload(meta.value?.page || 1)
  }
}

onMounted(() => reload(1))
</script>

<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.overviewTitle') }}</h1>
        <p>{{ t('admin.overviewLede') }}</p>
      </div>
    </header>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <div v-if="stats" class="stat-grid">
      <article class="stat-card">
        <p class="label">Người dùng</p>
        <p class="value">{{ stats.users.total }}</p>
        <p class="sub">Hoạt động: {{ stats.users.active }} · +{{ stats.users.newWeek }} / 7 ngày</p>
      </article>
      <article class="stat-card">
        <p class="label">Bot</p>
        <p class="value">{{ stats.bots.total }}</p>
        <p class="sub">+{{ stats.bots.newWeek }} bot mới / 7 ngày</p>
      </article>
      <article class="stat-card">
        <p class="label">Tin nhắn (DB)</p>
        <p class="value">{{ formatNum(stats.messages.total) }}</p>
      </article>
      <article class="stat-card">
        <p class="label">Lượt truy cập</p>
        <p class="value">{{ formatNum(stats.visits.total) }}</p>
        <p class="sub">Hôm nay: {{ formatNum(stats.visits.today) }} · 7 ngày: {{ formatNum(stats.visits.week) }}</p>
      </article>
    </div>

    <div v-if="stats?.visits?.byDay?.length" class="b-card chart-card">
      <h2 class="chart-title">Truy cập 7 ngày gần nhất</h2>
      <table class="mini-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Lượt</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in stats.visits.byDay" :key="row.day">
            <td>{{ row.day }}</td>
            <td>{{ formatNum(row.hits) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'
import { useI18n } from '@/i18n'
import './admin-shared.css'

const { t } = useI18n()
const loading = ref(true)
const error = ref('')
const stats = ref(null)

function formatNum(n) {
  return new Intl.NumberFormat('vi-VN').format(Number(n) || 0)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await api.admin.overview()
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.stat-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.stat-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
}
.stat-card .label {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.stat-card .value {
  margin: 8px 0 4px;
  font-size: 28px;
  letter-spacing: -0.04em;
}
.stat-card .sub {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
.chart-card {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
}
.chart-title {
  margin: 0 0 12px;
  font-size: 15px;
}
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.mini-table th,
.mini-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
}
</style>
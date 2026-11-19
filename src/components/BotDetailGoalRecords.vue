<template>
  <div class="b-card b-card-pad-lg panel page-panel goal-records-panel">
    <div class="goal-records-head">
      <div>
        <h2 class="b-title-sm panel-title">Mục tiêu</h2>
        <p class="b-caption panel-intro">
          Bản ghi khi khách đạt mục tiêu trong chat (hiện chủ yếu là chốt đơn).
        </p>
      </div>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>

    <p v-if="loading" class="b-caption">Đang tải…</p>

    <template v-else>
      <p v-if="!records.length" class="b-caption goal-records-empty">
        Chưa có bản ghi. Bật mục tiêu (vd. chốt đơn) trong
        <RouterLink :to="goalsSetupLink">Nội dung → Mục tiêu</RouterLink>
        và để khách xác nhận trong chat.
      </p>
      <div v-else class="table-wrap">
        <table class="goal-records-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Kênh</th>
              <th>Tóm tắt</th>
              <th>Webhook</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in records" :key="o.id">
              <td class="mono">{{ formatTime(o.createdAt) }}</td>
              <td>{{ o.channel }}</td>
              <td>{{ o.summary || '—' }}</td>
              <td>
                <span class="wh-badge" :class="o.webhookStatus">{{ webhookLabel(o.webhookStatus) }}</span>
              </td>
              <td>
                <button
                  v-if="o.webhookStatus === 'failed'"
                  type="button"
                  class="link-btn"
                  @click="retryWebhook(o.id)"
                >
                  Gửi lại
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/api'

const props = defineProps({
  bot: { type: Object, required: true },
})

const loading = ref(true)
const records = ref([])

const goalsSetupLink = computed(() => ({
  name: 'bot-detail',
  params: { id: props.bot.id, tab: 'setup' },
  hash: '#goals',
}))

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false })
  } catch {
    return String(iso)
  }
}

function webhookLabel(status) {
  const map = {
    sent: 'Đã gửi',
    failed: 'Lỗi',
    pending: 'Chờ',
    skipped: 'Tắt',
  }
  return map[status] || status
}

async function load() {
  loading.value = true
  try {
    const data = await api.bots.dashboard(props.bot.id)
    records.value = data?.recentOrders || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function retryWebhook(orderId) {
  try {
    await api.bots.retryOrderWebhook(props.bot.id, orderId)
    await load()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)
defineExpose({ load })
</script>

<style scoped>
.goal-records-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.goal-records-empty {
  margin-top: 8px;
}

.table-wrap {
  overflow-x: auto;
}

.goal-records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.goal-records-table th,
.goal-records-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--b-border);
}

.mono {
  font-size: 12px;
  white-space: nowrap;
}

.wh-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--b-surface-2);
}

.wh-badge.sent {
  background: var(--b-accent-soft);
  color: var(--b-accent-hover);
}

.wh-badge.failed {
  background: var(--b-danger-soft);
  color: var(--b-danger);
}

.link-btn {
  border: none;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--b-accent);
  cursor: pointer;
}
</style>
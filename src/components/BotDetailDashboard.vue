<template>
  <div class="b-card b-card-pad-lg panel page-panel dash-panel">
    <div class="dash-head">
      <div>
        <h2 class="b-title-sm panel-title">Dashboard</h2>
        <p class="b-caption panel-intro">Tổng quan tin nhắn và mục tiêu đạt. Chi tiết bản ghi: tab <strong>Mục tiêu</strong>.</p>
      </div>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>

    <p v-if="loading" class="b-caption">Đang tải…</p>

    <template v-else-if="stats">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-val">{{ stats.messagesTotal }}</span>
          <span class="stat-label">Tổng tin nhắn</span>
          <span class="stat-sub">7 ngày: {{ stats.messages7d }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ stats.peersTotal }}</span>
          <span class="stat-label">Khách (luồng)</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ stats.ordersTotal }}</span>
          <span class="stat-label">Mục tiêu đạt</span>
          <span class="stat-sub">7 ngày: {{ stats.orders7d }}</span>
        </div>
        <div class="stat-card" :class="{ warn: stats.webhookFailed > 0 }">
          <span class="stat-val">{{ stats.webhookFailed }}</span>
          <span class="stat-label">Webhook lỗi</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/api'

const props = defineProps({
  bot: { type: Object, required: true },
})

const loading = ref(true)
const stats = ref(null)

async function load() {
  loading.value = true
  try {
    const data = await api.bots.dashboard(props.bot.id)
    stats.value = data?.stats || null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dash-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
}

.stat-card.warn {
  border-color: #fecaca;
  background: var(--b-danger-soft);
}

.stat-val {
  display: block;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--b-ink);
}

.stat-label {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-muted);
}

.stat-sub {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--b-muted);
}

</style>
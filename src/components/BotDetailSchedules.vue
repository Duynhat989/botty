<template>
  <div class="schedule-panel">
    <div class="schedule-head">
      <p class="b-micro">
        <strong>{{ pendingCount }}</strong> lịch đang chờ
        <span v-if="loading"> · đang tải…</span>
      </p>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>
    <p v-if="err" class="b-msg-err">{{ err }}</p>
    <ul v-if="items.length" class="schedule-list">
      <li v-for="s in items" :key="s.id" class="schedule-row b-card b-card-pad">
        <span class="type-pill" :class="'type-pill--' + s.scheduleType">{{ typeLabel(s) }}</span>
        <p class="sched-meta b-micro">
          <span class="mono">PSID {{ shortPeer(s.peerId) }}</span>
          <span v-if="s.runAt"> · {{ formatRunAt(s.runAt) }}</span>
          <span v-if="s.productName"> · {{ s.productName }}</span>
        </p>
        <p class="sched-msg">{{ s.messageText }}</p>
        <div class="sched-actions">
          <span class="b-micro status" :class="'status--' + s.status">{{ statusLabel(s.status) }}</span>
          <button
            v-if="s.status === 'pending'"
            type="button"
            class="text-danger"
            @click="cancel(s)"
          >
            Hủy lịch
          </button>
        </div>
      </li>
    </ul>
    <p v-else-if="!loading" class="b-caption">
      Chưa có lịch. Tạo khi khách hẹn ngày hoặc chờ SP hết hàng có tồn lại.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/api'

const props = defineProps({
  botId: { type: String, required: true },
})

const items = ref([])
const loading = ref(false)
const err = ref('')

const pendingCount = computed(() => items.value.filter((s) => s.status === 'pending').length)

function shortPeer(id) {
  const s = String(id || '')
  if (s.length <= 12) return s
  return `${s.slice(0, 6)}…${s.slice(-4)}`
}

function formatRunAt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function typeLabel(s) {
  return s.scheduleType === 'stock_wait' ? 'Chờ có hàng' : 'Theo ngày'
}

function statusLabel(st) {
  const m = { pending: 'Đang chờ', sent: 'Đã gửi', cancelled: 'Đã hủy', failed: 'Lỗi' }
  return m[st] || st
}

async function load() {
  if (!props.botId) return
  loading.value = true
  err.value = ''
  try {
    const data = await api.bots.listSchedules(props.botId, { status: 'all', limit: 80 })
    items.value = Array.isArray(data?.schedules) ? data.schedules : []
  } catch (e) {
    err.value = 'Không tải được danh sách lịch.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cancel(s) {
  try {
    await api.bots.cancelSchedule(props.botId, s.id)
    await load()
  } catch (e) {
    err.value = 'Không hủy được lịch.'
    console.error(e)
  }
}

onMounted(load)
defineExpose({ load })
</script>

<style scoped>
.schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.schedule-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.schedule-row .type-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  margin-bottom: 6px;
}

.type-pill--date {
  background: #e8f0fe;
  color: #1a4fd6;
}

.type-pill--stock_wait {
  background: #fef3e2;
  color: #a65b00;
}

.sched-msg {
  margin: 6px 0;
  font-size: 0.88rem;
  line-height: 1.4;
}

.sched-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status--pending {
  color: var(--b-text-muted, #666);
}

.status--sent {
  color: #0a7a3d;
}
</style>
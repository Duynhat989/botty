<template>
  <div class="schedule-panel">
    <div class="schedule-toolbar">
      <p class="schedule-summary b-micro">
        <strong>{{ pendingCount }}</strong> đang chờ
        <span v-if="items.length"> · {{ items.length }} tổng</span>
        <span v-if="loading"> · đang tải…</span>
      </p>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm schedule-refresh" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>

    <p v-if="err" class="b-msg-err">{{ err }}</p>

    <ul v-if="items.length" class="schedule-list" role="list">
      <li v-for="s in items" :key="s.id" class="schedule-row">
        <button type="button" class="schedule-row-main" @click="openDetail(s)">
          <span class="type-pill" :class="'type-pill--' + s.scheduleType">{{ typeLabel(s) }}</span>
          <span class="row-title">{{ rowTitle(s) }}</span>
          <span class="b-micro row-when">{{ rowWhen(s) }}</span>
          <span class="status-dot" :class="'status-dot--' + s.status" :title="statusLabel(s.status)" />
        </button>
        <button type="button" class="b-btn b-btn--ghost b-btn--sm row-detail-btn" @click="openDetail(s)">
          Chi tiết
        </button>
      </li>
    </ul>

    <p v-else-if="!loading" class="b-caption schedule-empty">
      Chưa có lịch. Tạo khi khách hẹn ngày hoặc chờ SP hết hàng có tồn lại.
    </p>

    <div v-if="detail" class="sched-modal-root" role="dialog" aria-modal="true" aria-labelledby="sched-detail-title">
      <button type="button" class="sched-modal-backdrop" aria-label="Đóng" @click="closeDetail" />
      <div class="sched-modal-panel">
        <header class="sched-modal-head">
          <div>
            <p id="sched-detail-title" class="sched-modal-title">Chi tiết lịch</p>
            <p class="b-micro sched-modal-sub">
              <span class="type-pill" :class="'type-pill--' + detail.scheduleType">{{ typeLabel(detail) }}</span>
              <span class="status-chip" :class="'status-chip--' + detail.status">{{ statusLabel(detail.status) }}</span>
            </p>
          </div>
          <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="closeDetail">Đóng</button>
        </header>
        <div class="sched-modal-body">
          <dl class="detail-dl">
            <div class="detail-row">
              <dt>Khách (PSID)</dt>
              <dd class="mono">{{ detail.peerId }}</dd>
            </div>
            <div class="detail-row">
              <dt>Kênh</dt>
              <dd>{{ detail.channel === 'test' ? 'Thử bot' : 'Messenger' }}</dd>
            </div>
            <div v-if="detail.runAt" class="detail-row">
              <dt>Thời điểm nhắn</dt>
              <dd>{{ formatRunAt(detail.runAt) }}</dd>
            </div>
            <div v-if="detail.productName" class="detail-row">
              <dt>Sản phẩm</dt>
              <dd>
                {{ detail.productName }}
                <span v-if="detail.variantLabel" class="b-micro"> · {{ detail.variantLabel }}</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Tin sẽ gửi</dt>
              <dd class="detail-msg">{{ detail.messageText || '—' }}</dd>
            </div>
            <div v-if="detail.sentAt" class="detail-row">
              <dt>Đã gửi lúc</dt>
              <dd>{{ formatRunAt(detail.sentAt) }}</dd>
            </div>
            <div v-if="detail.lastError" class="detail-row">
              <dt>Lỗi</dt>
              <dd class="detail-err">{{ detail.lastError }}</dd>
            </div>
            <div class="detail-row">
              <dt>Tạo lúc</dt>
              <dd>{{ formatRunAt(detail.createdAt) }}</dd>
            </div>
          </dl>
        </div>
        <footer v-if="detail.status === 'pending'" class="sched-modal-foot">
          <button
            type="button"
            class="b-btn b-btn--danger b-btn--sm"
            :disabled="cancelling"
            @click="cancel(detail)"
          >
            {{ cancelling ? 'Đang hủy…' : 'Hủy lịch' }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps({
  botId: { type: String, required: true },
})

const items = ref([])
const loading = ref(false)
const err = ref('')
const detail = ref(null)
const cancelling = ref(false)

const pendingCount = computed(() => items.value.filter((s) => s.status === 'pending').length)

function shortPeer(id) {
  const s = String(id || '')
  if (s.length <= 14) return s
  return `${s.slice(0, 8)}…`
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
  return s.scheduleType === 'stock_wait' ? 'Chờ hàng' : 'Hẹn ngày'
}

function statusLabel(st) {
  const m = { pending: 'Đang chờ', sent: 'Đã gửi', cancelled: 'Đã hủy', failed: 'Lỗi' }
  return m[st] || st
}

function rowTitle(s) {
  if (s.scheduleType === 'stock_wait' && s.productName) return s.productName
  if (s.productName) return s.productName
  return `Khách ${shortPeer(s.peerId)}`
}

function rowWhen(s) {
  if (s.scheduleType === 'stock_wait') return 'Khi có hàng lại'
  if (s.runAt) return formatRunAt(s.runAt)
  return '—'
}

function openDetail(s) {
  detail.value = s
}

function closeDetail() {
  detail.value = null
}

function onKey(e) {
  if (e.key === 'Escape' && detail.value) closeDetail()
}

watch(detail, (v) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = v ? 'hidden' : ''
})

onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

async function load() {
  if (!props.botId) return
  loading.value = true
  err.value = ''
  try {
    const data = await api.bots.listSchedules(props.botId, { status: 'all', limit: 80 })
    items.value = Array.isArray(data?.schedules) ? data.schedules : []
    if (detail.value) {
      const fresh = items.value.find((x) => x.id === detail.value.id)
      detail.value = fresh || null
    }
  } catch (e) {
    err.value = 'Không tải được danh sách lịch.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cancel(s) {
  cancelling.value = true
  err.value = ''
  try {
    await api.bots.cancelSchedule(props.botId, s.id)
    closeDetail()
    await load()
  } catch (e) {
    err.value = 'Không hủy được lịch.'
    console.error(e)
  } finally {
    cancelling.value = false
  }
}

defineExpose({ load })
</script>

<style scoped>
.schedule-panel {
  position: relative;
}

.schedule-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--b-surface-2, #f8f9fb);
  border: 1px solid var(--b-border, #e8eaed);
}

.schedule-summary {
  margin: 0;
}

.schedule-refresh {
  flex-shrink: 0;
}

.schedule-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schedule-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.schedule-row-main {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px 10px;
  padding: 8px 10px;
  border: 1px solid var(--b-border, #e8eaed);
  border-radius: 10px;
  background: var(--color-surface, #fff);
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.schedule-row-main:hover {
  border-color: var(--b-accent, #1e40af);
  background: var(--b-accent-soft, #eff6ff);
}

.type-pill {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.type-pill--date {
  background: #e8f0fe;
  color: #1a4fd6;
}

.type-pill--stock_wait {
  background: #fef3e2;
  color: #a65b00;
}

.row-title {
  font-size: 0.88rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-when {
  color: var(--b-text-muted, #667085);
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--pending {
  background: #f59e0b;
}

.status-dot--sent {
  background: #0a7a3d;
}

.status-dot--cancelled {
  background: #9ca3af;
}

.status-dot--failed {
  background: #dc2626;
}

.row-detail-btn {
  flex-shrink: 0;
  align-self: center;
  min-width: 4.5rem;
}

.schedule-empty {
  margin-top: 8px;
}

.mono {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.85em;
  word-break: break-all;
}

.sched-modal-root {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.sched-modal-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.45);
  cursor: pointer;
}

.sched-modal-panel {
  position: relative;
  width: min(100%, 420px);
  max-height: min(88vh, 560px);
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--b-border, #e8eaed);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
}

.sched-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--b-border, #e8eaed);
}

.sched-modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.sched-modal-sub {
  margin: 6px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.status-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--b-surface-2, #f3f4f6);
}

.status-chip--pending {
  color: #b45309;
}

.status-chip--sent {
  color: #0a7a3d;
}

.status-chip--failed {
  color: #dc2626;
}

.sched-modal-body {
  padding: 12px 16px;
  overflow-y: auto;
}

.detail-dl {
  margin: 0;
}

.detail-row {
  display: grid;
  gap: 2px;
  margin-bottom: 12px;
}

.detail-row dt {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--b-text-muted, #667085);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detail-row dd {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
}

.detail-msg {
  white-space: pre-wrap;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--b-surface-2, #f8f9fb);
  border: 1px solid var(--b-border, #e8eaed);
}

.detail-err {
  color: var(--b-danger, #dc2626);
}

.sched-modal-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--b-border, #e8eaed);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 520px) {
  .schedule-row {
    flex-wrap: wrap;
  }

  .schedule-row-main {
    width: 100%;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
  }

  .row-when {
    grid-column: 2 / -1;
  }

  .row-detail-btn {
    width: 100%;
  }
}
</style>
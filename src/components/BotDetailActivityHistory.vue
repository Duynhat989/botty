<template>
  <div class="b-card b-card-pad-lg panel page-panel history-panel">
    <div class="hist-head">
      <div>
        <h2 class="b-title-sm panel-title">Lịch sử phản hồi</h2>
        <p class="b-caption panel-intro">
          Nhóm theo phiên chat — Messenger theo từng khách (PSID), thử theo từng phiên.
        </p>
      </div>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>

    <p v-if="loading" class="b-caption">Đang tải…</p>

    <template v-else>
      <div class="filter-row">
        <button
          type="button"
          class="filter-btn"
          :class="{ on: channelFilter === '' }"
          @click="setChannel('')"
        >
          Tất cả
        </button>
        <button
          type="button"
          class="filter-btn"
          :class="{ on: channelFilter === 'facebook' }"
          @click="setChannel('facebook')"
        >
          Messenger
        </button>
        <button
          type="button"
          class="filter-btn"
          :class="{ on: channelFilter === 'test' }"
          @click="setChannel('test')"
        >
          Thử
        </button>
      </div>

      <p v-if="!sessions.length" class="b-caption">Chưa có tin nhắn.</p>

      <p v-if="sessions.length && pagination.total" class="hist-summary b-caption">
        {{ pagination.total }} phiên
        <template v-if="pagination.totalPages > 1">
          · trang {{ pagination.page }}/{{ pagination.totalPages }}
        </template>
      </p>

      <ul v-if="sessions.length" class="session-list">
        <li
          v-for="s in sessions"
          :key="s.channel + ':' + s.peerId"
          class="session-card"
          :class="{ open: isOpen(s) }"
        >
          <button type="button" class="session-head" @click="toggle(s)">
            <span class="session-badges">
              <span class="ch-badge" :class="s.channel">{{ channelLabel(s.channel) }}</span>
              <span v-if="s.truncated" class="trunc-badge">…</span>
            </span>
            <span class="session-titles">
              <span class="session-title">{{ s.title }}</span>
              <span class="session-sub">{{ s.subtitle }}</span>
            </span>
            <span class="session-meta">
              <span>{{ s.messageCount }} tin</span>
              <span class="session-time">{{ formatTime(s.lastActivityAt) }}</span>
            </span>
            <span class="session-chevron" aria-hidden="true">{{ isOpen(s) ? '▾' : '▸' }}</span>
          </button>

          <div v-show="isOpen(s)" class="session-thread">
            <div v-if="isOpen(s)" class="outbound-box">
              <p class="b-micro outbound-lede">
                Gửi tin chủ động tới phiên này
                <span v-if="s.channel === 'facebook'"> (Messenger, trong 24h kể từ lần khách nhắn)</span>.
              </p>
              <textarea
                v-model="outboundDraft[keyFor(s)]"
                class="b-textarea outbound-input"
                rows="2"
                maxlength="2000"
                placeholder="Nội dung tin shop gửi…"
              />
              <div class="outbound-actions">
                <button
                  type="button"
                  class="b-btn b-btn--primary b-btn--sm"
                  :disabled="outboundBusyKey === keyFor(s)"
                  @click="sendOutbound(s, false)"
                >
                  {{ outboundBusyKey === keyFor(s) ? 'Đang gửi…' : 'Gửi' }}
                </button>
                <button
                  v-if="props.bot.orderClosingPlanAllowed && props.bot.orderClosingEnabled"
                  type="button"
                  class="b-btn b-btn--ghost b-btn--sm"
                  :disabled="outboundBusyKey === keyFor(s)"
                  @click="sendOutbound(s, true)"
                >
                  Gửi mẫu nhắc chốt đơn
                </button>
                <button
                  type="button"
                  class="b-btn b-btn--ghost b-btn--sm"
                  :disabled="handoffBusyKey === keyFor(s)"
                  @click="clearHandoff(s)"
                >
                  {{ handoffBusyKey === keyFor(s) ? '…' : 'Bật lại bot' }}
                </button>
              </div>
              <p v-if="outboundErr[keyFor(s)]" class="b-msg-err outbound-err">{{ outboundErr[keyFor(s)] }}</p>
              <p v-else-if="outboundOk[keyFor(s)]" class="b-micro outbound-ok">{{ outboundOk[keyFor(s)] }}</p>
            </div>
            <div
              v-for="(m, i) in s.messages"
              :key="i"
              class="thread-bubble"
              :class="m.role"
            >
              <span class="thread-role">{{ m.role === 'bot' ? 'Bot' : 'Khách' }}</span>
              <span class="thread-time">{{ formatTime(m.createdAt) }}</span>
              <p v-if="m.text" class="thread-text">{{ m.text }}</p>
              <div v-if="m.imageUrls?.length" class="thread-images">
                <img
                  v-for="(url, j) in m.imageUrls"
                  :key="'img-' + j"
                  :src="url"
                  alt="Ảnh khách gửi"
                  class="thread-img"
                  loading="lazy"
                />
              </div>
              <img
                v-if="m.qrImageUrl"
                :src="m.qrImageUrl"
                alt="QR thanh toán"
                class="thread-qr"
                loading="lazy"
              />
            </div>
          </div>
        </li>
      </ul>

      <nav
        v-if="pagination.totalPages > 1"
        class="hist-pager"
        aria-label="Phân trang phiên chat"
      >
        <button
          type="button"
          class="b-btn b-btn--ghost b-btn--sm"
          :disabled="loading || pagination.page <= 1"
          @click="goPage(pagination.page - 1)"
        >
          Trước
        </button>
        <span class="pager-meta">
          Trang {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          type="button"
          class="b-btn b-btn--ghost b-btn--sm"
          :disabled="loading || pagination.page >= pagination.totalPages"
          @click="goPage(pagination.page + 1)"
        >
          Sau
        </button>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/api'

const props = defineProps({
  bot: { type: Object, required: true },
})

const PAGE_SIZE = 15

const loading = ref(true)
const sessions = ref([])
const channelFilter = ref('')
const openKeys = ref(new Set())
const outboundDraft = ref({})
const outboundBusyKey = ref('')
const outboundErr = ref({})
const outboundOk = ref({})
const handoffBusyKey = ref('')
const page = ref(1)
const pagination = ref({
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
})

function sessionKey(s) {
  return `${s.channel}:${s.peerId}`
}

function keyFor(s) {
  return sessionKey(s)
}

function isOpen(s) {
  return openKeys.value.has(sessionKey(s))
}

function toggle(s) {
  const key = sessionKey(s)
  const next = new Set(openKeys.value)
  if (next.has(key)) next.delete(key)
  else {
    next.add(key)
    if (!outboundDraft.value[key]) {
      outboundDraft.value = {
        ...outboundDraft.value,
        [key]: props.bot.orderClosingReminderText?.trim() || '',
      }
    }
  }
  openKeys.value = next
}

async function clearHandoff(s) {
  const key = keyFor(s)
  handoffBusyKey.value = key
  try {
    await api.bots.clearHandoff(props.bot.id, { channel: s.channel, peerId: s.peerId })
    outboundOk.value = { ...outboundOk.value, [key]: 'Đã bật lại bot cho phiên này.' }
  } catch (e) {
    outboundErr.value = { ...outboundErr.value, [key]: e?.message || 'Không bật lại được' }
  } finally {
    handoffBusyKey.value = ''
  }
}

async function sendOutbound(s, useReminderTemplate) {
  const key = keyFor(s)
  outboundErr.value = { ...outboundErr.value, [key]: '' }
  outboundOk.value = { ...outboundOk.value, [key]: '' }
  outboundBusyKey.value = key
  try {
    const body = {
      channel: s.channel,
      peerId: s.peerId,
      useReminderTemplate,
    }
    if (!useReminderTemplate) {
      const text = String(outboundDraft.value[key] || '').trim()
      if (!text) {
        outboundErr.value = { ...outboundErr.value, [key]: 'Nhập nội dung tin nhắn.' }
        return
      }
      body.text = text
    }
    await api.bots.sendOutboundMessage(props.bot.id, body)
    outboundOk.value = { ...outboundOk.value, [key]: 'Đã gửi — làm mới để xem trong luồng.' }
    await load()
    openKeys.value = new Set([...openKeys.value, key])
  } catch (e) {
    outboundErr.value = { ...outboundErr.value, [key]: e?.message || 'Gửi thất bại' }
  } finally {
    outboundBusyKey.value = ''
  }
}

function channelLabel(ch) {
  if (ch === 'facebook') return 'Messenger'
  if (ch === 'test') return 'Thử'
  return ch
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false })
  } catch {
    return String(iso)
  }
}

async function load() {
  loading.value = true
  try {
    const data = await api.bots.activity(props.bot.id, channelFilter.value || null, {
      page: page.value,
      limit: PAGE_SIZE,
    })
    sessions.value = data?.sessions || []
    const p = data?.pagination
    if (p) {
      pagination.value = {
        page: p.page ?? page.value,
        pageSize: p.pageSize ?? PAGE_SIZE,
        total: p.total ?? 0,
        totalPages: p.totalPages ?? 1,
      }
      page.value = pagination.value.page
    } else {
      pagination.value = {
        page: 1,
        pageSize: PAGE_SIZE,
        total: sessions.value.length,
        totalPages: 1,
      }
    }
    openKeys.value = new Set()
  } catch (e) {
    console.error(e)
    sessions.value = []
  } finally {
    loading.value = false
  }
}

function setChannel(ch) {
  channelFilter.value = ch
  page.value = 1
  openKeys.value = new Set()
  load()
}

function goPage(next) {
  const n = Math.max(1, Math.min(next, pagination.value.totalPages || 1))
  if (n === page.value) return
  page.value = n
  openKeys.value = new Set()
  load()
}

onMounted(load)
</script>

<style scoped>
.hist-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-intro {
  margin: 4px 0 0;
}

.hist-summary {
  margin: 0 0 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.hist-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 14px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--b-border);
}

.pager-meta {
  font-size: 13px;
  color: var(--b-muted);
}

.filter-btn {
  border: 1px solid var(--b-border);
  background: #fff;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  cursor: pointer;
}

.filter-btn.on {
  border-color: var(--b-accent);
  background: var(--b-accent-soft);
  font-weight: 600;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.session-card {
  border: 1px solid var(--b-border);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.session-card.open {
  border-color: color-mix(in srgb, var(--b-accent) 35%, var(--b-border));
}

.session-head {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px 12px;
  align-items: center;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.session-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.ch-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--b-border);
  background: #f8faf9;
}

.ch-badge.facebook {
  border-color: #c5d4f5;
  background: #eef3ff;
  color: #1e3a8a;
}

.ch-badge.test {
  border-color: #c6e9d4;
  background: var(--b-accent-soft);
  color: #0d5c36;
}

.trunc-badge {
  font-size: 10px;
  color: var(--b-muted);
}

.session-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.session-sub {
  font-size: 11px;
  color: var(--b-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  color: var(--b-muted);
  white-space: nowrap;
}

.session-chevron {
  font-size: 12px;
  color: var(--b-muted);
}

.session-thread {
  border-top: 1px solid var(--b-border);
  padding: 10px 12px 12px;
  display: grid;
  gap: 8px;
  max-height: min(420px, 55vh);
  overflow-y: auto;
  background: #fafbfa;
}

.outbound-box {
  padding: 10px 10px 12px;
  border: 1px dashed var(--b-border);
  border-radius: 10px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.outbound-lede {
  margin: 0;
  line-height: 1.45;
  color: var(--b-muted);
}

.outbound-input {
  font-size: 13px;
  min-height: 52px;
}

.outbound-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.outbound-err {
  margin: 0;
  font-size: 12px;
}

.outbound-ok {
  margin: 0;
  color: #166534;
}

.thread-bubble {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--b-border);
  background: #fff;
}

.thread-bubble.user {
  border-color: #c6e9d4;
  background: var(--b-accent-soft);
}

.thread-role {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--b-accent);
  margin-right: 8px;
}

.thread-time {
  font-size: 10px;
  color: var(--b-muted);
}

.thread-text {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.thread-images {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.thread-img {
  max-width: 140px;
  max-height: 140px;
  border-radius: 8px;
  object-fit: cover;
}

.thread-qr {
  margin-top: 8px;
  max-width: 160px;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .session-head {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  .session-badges {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
  }

  .session-meta {
    grid-column: 2;
    grid-row: 2;
  }

  .session-chevron {
    display: none;
  }
}
</style>
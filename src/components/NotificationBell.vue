<template>
  <div ref="rootRef" class="bell-wrap">
    <button
      type="button"
      class="bell-btn"
      :class="{ open: open, 'has-unread': unreadCount > 0 }"
      :aria-label="t('notifications.ariaBell')"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <Bell :size="18" :stroke-width="2.15" aria-hidden="true" />
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <Transition name="bell-drop">
      <div v-if="open" class="bell-panel" role="dialog" :aria-label="t('notifications.panelTitle')">
        <div class="panel-head">
          <strong>{{ t('notifications.panelTitle') }}</strong>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="mark-all"
            :disabled="busy"
            @click="markAllRead"
          >
            {{ t('notifications.markAllRead') }}
          </button>
        </div>

        <div v-if="loading" class="panel-state">{{ t('notifications.loading') }}</div>
        <div v-else-if="!items.length" class="panel-state empty">
          <p>{{ t('notifications.emptyTitle') }}</p>
          <span>{{ t('notifications.emptyBody') }}</span>
        </div>
        <ul v-else class="bell-list">
          <li
            v-for="item in items"
            :key="item.id"
            class="bell-item"
            :class="{ unread: !item.readAt }"
            @click="onItemClick(item)"
          >
            <time>{{ formatWhen(item.createdAt) }}</time>
            <strong>{{ item.title }}</strong>
            <p>{{ previewBody(item.body) }}</p>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { Bell } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { formatWhen } from '@/utils/format'
import { useI18n } from '@/i18n'

const auth = useAuthStore()
const { t } = useI18n()

const open = ref(false)
const loading = ref(false)
const busy = ref(false)
const items = ref([])
const unreadCount = ref(0)
const rootRef = ref(null)

let pollTimer = null

function previewBody(text) {
  const s = String(text || '').trim()
  if (s.length <= 140) return s
  return `${s.slice(0, 137)}…`
}

async function fetchList() {
  if (!auth.isLoggedIn) return
  loading.value = true
  try {
    const data = await api.notifications.list({ limit: 20 })
    items.value = Array.isArray(data?.items) ? data.items : []
    unreadCount.value = Number(data?.unreadCount) || 0
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

async function refreshUnreadOnly() {
  if (!auth.isLoggedIn) return
  try {
    const data = await api.notifications.list({ limit: 1 })
    unreadCount.value = Number(data?.unreadCount) || 0
  } catch {
    /* ignore */
  }
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) fetchList()
}

async function onItemClick(item) {
  if (!item?.id || item.readAt) return
  busy.value = true
  try {
    const updated = await api.notifications.markRead(item.id)
    items.value = items.value.map((row) => (row.id === item.id ? { ...row, ...updated } : row))
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    /* ignore */
  } finally {
    busy.value = false
  }
}

async function markAllRead() {
  busy.value = true
  try {
    await api.notifications.markAllRead()
    const now = new Date().toISOString()
    items.value = items.value.map((row) => ({ ...row, readAt: row.readAt || now }))
    unreadCount.value = 0
  } catch {
    /* ignore */
  } finally {
    busy.value = false
  }
}

function onDocClick(e) {
  if (!open.value) return
  const el = rootRef.value
  if (el && !el.contains(e.target)) open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') open.value = false
}

watch(
  () => auth.isLoggedIn,
  (ok) => {
    if (ok) {
      refreshUnreadOnly()
      pollTimer = setInterval(refreshUnreadOnly, 90_000)
    } else {
      items.value = []
      unreadCount.value = 0
      open.value = false
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.bell-wrap {
  position: relative;
}

.bell-btn {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.bell-btn:hover,
.bell-btn.open {
  background: #fffaf8;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}

.bell-btn.has-unread {
  color: var(--accent-hover, #c2410c);
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.bell-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(360px, calc(100vw - 24px));
  max-height: min(420px, 70vh);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-radius: 14px;
  border: 1px solid rgb(254 215 199 / 75%);
  background: rgb(255 255 255 / 98%);
  box-shadow: 0 18px 40px -20px rgba(15, 23, 42, 0.28);
  z-index: 120;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.mark-all {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-hover, #c2410c);
  cursor: pointer;
}

.mark-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-state {
  padding: 20px 16px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.panel-state.empty p {
  margin: 0 0 4px;
  font-weight: 600;
  color: #334155;
}

.bell-list {
  margin: 0;
  padding: 6px 0;
  list-style: none;
  overflow: auto;
}

.bell-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  transition: background 0.15s ease;
}

.bell-item:last-child {
  border-bottom: none;
}

.bell-item:hover {
  background: #fff7ed;
}

.bell-item.unread {
  background: rgb(255 247 237 / 65%);
}

.bell-item time {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.bell-item strong {
  display: block;
  font-size: 13px;
  line-height: 1.35;
  color: #0f172a;
}

.bell-item p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
  white-space: pre-wrap;
}

.bell-drop-enter-active,
.bell-drop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.bell-drop-enter-from,
.bell-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
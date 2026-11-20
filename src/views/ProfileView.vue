<template>
  <section class="profile-page">
    <div class="profile-atmosphere" aria-hidden="true">
      <div class="glow glow-a"></div>
      <div class="glow glow-b"></div>
      <div class="grid-fade"></div>
    </div>

    <div class="container profile-shell">
      <header class="profile-hero">
        <div class="hero-identity">
          <div class="avatar-block">
            <img
              v-if="auth.user?.avatar"
              :src="auth.user.avatar"
              alt=""
              class="avatar"
            />
            <div v-else class="avatar fallback">{{ initial }}</div>
          </div>
          <div class="identity-copy">
            <p class="eyebrow">{{ t('profile.eyebrow') }}</p>
            <h1>{{ auth.user?.name || t('profile.userFallback') }}</h1>
            <p class="email">{{ auth.user?.email }}</p>
            <div class="provider-row" v-if="auth.user?.providers?.google || auth.user?.providers?.facebook">
              <span v-if="auth.user?.providers?.google" class="provider">Google</span>
              <span v-if="auth.user?.providers?.facebook" class="provider">Facebook</span>
            </div>
          </div>
        </div>
      </header>

      <nav class="profile-tabs" :aria-label="t('profile.tabsAria')">
        <button
          v-for="tab in tabItems"
          :key="tab.id"
          type="button"
          class="tab"
          :class="{ on: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="16" :stroke-width="2.25" aria-hidden="true" />
          <span>{{ tab.name }}</span>
          <em v-if="tab.id === 'orders' && orders.length" class="count">{{ orders.length }}</em>
          <em v-else-if="tab.id === 'alerts' && unreadCount" class="count warn">{{ unreadCount }}</em>
        </button>
      </nav>

      <main class="profile-main">
        <!-- Overview -->
        <div v-if="activeTab === 'overview'" class="overview" key="overview">
          <article class="credit-panel">
            <div class="credit-panel-top">
              <span class="kicker">{{ t('profile.creditsKicker') }}</span>
              <h2>{{ t('profile.creditsTitle') }}</h2>
            </div>
            <p class="credit-figure">
              <span class="num">{{ auth.credits }}</span>
              <span class="unit">{{ t('profile.creditsUnit') }}</span>
            </p>
            <p class="credit-note">
              {{ t('profile.creditsNoteBefore') }} <strong>{{ t('profile.creditsNoteStrong') }}</strong>{{ t('profile.creditsNoteAfter') }}
            </p>
            <div class="credit-ctas">
              <RouterLink to="/pricing" class="btn-solid">{{ t('profile.topup') }}</RouterLink>
              <RouterLink to="/" class="btn-line">{{ t('nav.home') }}</RouterLink>
            </div>
          </article>

          <article class="alert-summary-panel">
            <div class="panel-bar bare">
              <h2>{{ t('profile.alertsTitle') }}</h2>
              <button type="button" class="link-go" @click="activeTab = 'alerts'">{{ t('common.detail') }}</button>
            </div>
            <div class="alert-stats">
              <div class="alert-stat">
                <strong>{{ alertSummary.warnEmailCount }}</strong>
                <span>{{ t('profile.alertsStatsWarn') }}</span>
              </div>
              <div class="alert-stat">
                <strong>{{ alertSummary.violationCount }}</strong>
                <span>{{ t('profile.alertsStatsViolation') }}</span>
              </div>
              <div class="alert-stat">
                <strong>{{ alertSummary.unreadCount }}</strong>
                <span>{{ t('profile.alertsStatsUnread') }}</span>
              </div>
            </div>
          </article>

          <article class="guide-panel">
            <h2>{{ t('profile.guideTitle') }}</h2>
            <p class="guide-lead">{{ t('profile.guideLead') }}</p>
            <ol class="steps">
              <li>
                <span class="idx">01</span>
                <div>
                  <strong>{{ t('profile.guide1Title') }}</strong>
                  <p>{{ t('profile.guide1Body') }}</p>
                </div>
              </li>
              <li>
                <span class="idx">02</span>
                <div>
                  <strong>{{ t('profile.guide2Title') }}</strong>
                  <p>{{ t('profile.guide2Body') }}</p>
                </div>
              </li>
              <li>
                <span class="idx">03</span>
                <div>
                  <strong>{{ t('profile.guide3Title') }}</strong>
                  <p>{{ t('profile.guide3Body') }}</p>
                </div>
              </li>
            </ol>
          </article>
        </div>

        <!-- Orders -->
        <div v-else-if="activeTab === 'orders'" class="sheet-panel" key="orders">
          <div class="panel-bar">
            <h2>{{ t('profile.ordersTitle') }}</h2>
            <span class="meta">{{ t('profile.ordersCount', { n: orders.length }) }}</span>
          </div>

          <div v-if="!ready" class="state-box bare">
            <div class="spinner" aria-hidden="true"></div>
            <p>{{ t('profile.ordersLoading') }}</p>
          </div>

          <div v-else-if="!orders.length" class="state-box bare empty">
            <h3>{{ t('profile.ordersEmptyTitle') }}</h3>
            <p>{{ t('profile.ordersEmptyBody') }}</p>
            <RouterLink to="/pricing" class="btn-solid">{{ t('profile.ordersEmptyCta') }}</RouterLink>
          </div>

          <div v-else class="sheet-body">
            <div class="sheet-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{{ t('profile.thCode') }}</th>
                    <th>{{ t('profile.thPkg') }}</th>
                    <th>{{ t('profile.thCredits') }}</th>
                    <th>{{ t('profile.thTotal') }}</th>
                    <th>{{ t('profile.thStatus') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in pagedOrders" :key="order.id">
                    <td class="mono">{{ order.code }}</td>
                    <td class="strong">{{ order.packageName }}</td>
                    <td>
                      <span class="credit-tag">
                        <Zap :size="12" :stroke-width="2.5" />
                        {{ order.credits }}
                      </span>
                    </td>
                    <td class="strong">{{ formatVnd(order.amountVnd) }}</td>
                    <td>
                      <span class="status" :class="order.status">{{ STATUS_LABEL[order.status] }}</span>
                    </td>
                    <td class="end">
                      <RouterLink :to="`/checkout/${order.uuid}`" class="link-go">{{ t('common.detail') }}</RouterLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <nav
              v-if="ordersTotalPages > 1"
              class="history-pager"
              :aria-label="t('profile.ordersPagerAria')"
            >
              <button
                type="button"
                class="history-pager-btn"
                :disabled="ordersPage <= 1"
                :aria-label="t('common.prev')"
                @click="goOrdersPage(ordersPage - 1)"
              >
                {{ t('common.prev') }}
              </button>

              <div class="history-pager-pages">
                <template v-for="(item, index) in ordersPageItems" :key="`${item}-${index}`">
                  <span v-if="item === '…'" class="history-pager-ellipsis" aria-hidden="true">…</span>
                  <button
                    v-else
                    type="button"
                    class="history-pager-num"
                    :class="{ active: item === ordersPage }"
                    :aria-current="item === ordersPage ? 'page' : undefined"
                    @click="goOrdersPage(item)"
                  >
                    {{ item }}
                  </button>
                </template>
              </div>

              <button
                type="button"
                class="history-pager-btn"
                :disabled="ordersPage >= ordersTotalPages"
                :aria-label="t('common.next')"
                @click="goOrdersPage(ordersPage + 1)"
              >
                {{ t('common.next') }}
              </button>
            </nav>
          </div>
        </div>

        <!-- Alerts / moderation -->
        <div v-else-if="activeTab === 'alerts'" class="sheet-panel alerts-panel" key="alerts">
          <div class="panel-bar">
            <div>
              <h2>{{ t('profile.alertsTitle') }}</h2>
              <span class="meta">
                {{ t('profile.alertsCount', { n: notifications.length }) }}
                <template v-if="unreadCount"> · {{ t('profile.alertsUnread', { n: unreadCount }) }}</template>
              </span>
            </div>
            <button
              v-if="unreadCount"
              type="button"
              class="btn-line compact"
              :disabled="alertsBusy"
              @click="markAllRead"
            >
              {{ t('profile.alertsMarkAll') }}
            </button>
          </div>

          <div class="alert-stats inline">
            <div class="alert-stat">
              <strong>{{ alertSummary.warnEmailCount }}</strong>
              <span>{{ t('profile.alertsStatsWarn') }}</span>
            </div>
            <div class="alert-stat">
              <strong>{{ alertSummary.violationCount }}</strong>
              <span>{{ t('profile.alertsStatsViolation') }}</span>
            </div>
            <div class="alert-stat">
              <strong>{{ alertSummary.unreadCount }}</strong>
              <span>{{ t('profile.alertsStatsUnread') }}</span>
            </div>
          </div>

          <div v-if="!ready" class="state-box bare">
            <div class="spinner" aria-hidden="true"></div>
            <p>{{ t('profile.alertsLoading') }}</p>
          </div>

          <template v-else>
            <div v-if="!notifications.length" class="state-box bare empty">
              <h3>{{ t('profile.alertsEmptyTitle') }}</h3>
              <p>{{ t('profile.alertsEmptyBody') }}</p>
            </div>

            <ul v-else class="alert-list">
              <li
                v-for="item in notifications"
                :key="item.id"
                class="alert-item"
                :class="{ unread: !item.readAt }"
              >
                <div class="alert-item-top">
                  <span class="alert-type" :class="item.type">{{ alertTypeLabel(item.type) }}</span>
                  <time>{{ formatWhen(item.createdAt) }}</time>
                </div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
                <div class="alert-item-actions">
                  <span v-if="item.readAt" class="read-tag">{{ t('profile.alertRead') }}</span>
                  <button
                    v-else
                    type="button"
                    class="link-go"
                    :disabled="alertsBusy"
                    @click="markRead(item)"
                  >
                    {{ t('profile.alertMarkRead') }}
                  </button>
                </div>
              </li>
            </ul>

          </template>
        </div>
      </main>

      <footer class="profile-foot">
        <button class="btn-logout" type="button" @click="logout">
          {{ t('profile.logout') }}
        </button>
        <RouterLink v-if="auth.isAdmin" to="/admin" class="btn-admin">
          {{ t('admin.open') }}
        </RouterLink>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Package, Zap } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { formatVnd, formatWhen, STATUS_LABEL } from '@/utils/format'
import { useI18n } from '@/i18n'

const PAGE_SIZE = 10

const auth = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()
const orders = ref([])
const notifications = ref([])
const alertSummary = ref({ warnEmailCount: 0, violationCount: 0, unreadCount: 0 })
const alertsBusy = ref(false)
const ready = ref(false)
const activeTab = ref('overview')
const ordersPage = ref(1)

const initial = computed(() => (auth.user?.name || 'C').slice(0, 1).toUpperCase())
const unreadCount = computed(() => Number(alertSummary.value.unreadCount) || 0)

const tabItems = computed(() => {
  void locale.value
  return [
    { id: 'overview', name: t('profile.tabOverview'), icon: Zap },
    { id: 'orders', name: t('profile.tabOrders'), icon: Package },
    { id: 'alerts', name: t('profile.tabAlerts'), icon: Bell },
  ]
})

const ordersTotalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / PAGE_SIZE)))

const pagedOrders = computed(() => {
  const start = (ordersPage.value - 1) * PAGE_SIZE
  return orders.value.slice(start, start + PAGE_SIZE)
})

function buildPageItems(total, current) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const items = []
  const push = (value) => {
    if (items[items.length - 1] !== value) items.push(value)
  }
  push(1)
  if (current > 3) push('…')
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n += 1) {
    push(n)
  }
  if (current < total - 2) push('…')
  push(total)
  return items
}

const ordersPageItems = computed(() => buildPageItems(ordersTotalPages.value, ordersPage.value))

function goOrdersPage(next) {
  const target = Math.min(ordersTotalPages.value, Math.max(1, Number(next) || 1))
  if (target === ordersPage.value) return
  ordersPage.value = target
}

watch(ordersTotalPages, (pages) => {
  if (ordersPage.value > pages) ordersPage.value = pages
})

watch(activeTab, (tab) => {
  if (tab === 'orders') ordersPage.value = 1
})

function logout() {
  auth.logout()
  router.push('/')
}

function alertTypeLabel(type) {
  if (type === 'warn_email') return t('profile.alertTypeWarn')
  if (type === 'video_violation') return t('profile.alertTypeViolation')
  if (type === 'renew_reminder') return t('profile.alertTypeRenew')
  if (type === 'custom_email') return t('profile.alertTypeEmail')
  return type
}

async function loadAlerts() {
  const [summary, list] = await Promise.all([
    api.notifications.summary(),
    api.notifications.list({ limit: 50 }),
  ])
  alertSummary.value = {
    warnEmailCount: Number(summary?.warnEmailCount) || 0,
    violationCount: Number(summary?.violationCount) || 0,
    unreadCount: Number(summary?.unreadCount) || 0,
  }
  notifications.value = Array.isArray(list?.items) ? list.items : []
  if (list?.unreadCount != null) {
    alertSummary.value.unreadCount = Number(list.unreadCount) || 0
  }
}

async function markRead(item) {
  if (!item?.id || item.readAt) return
  alertsBusy.value = true
  try {
    const updated = await api.notifications.markRead(item.id)
    notifications.value = notifications.value.map((row) => (
      row.id === updated.id ? updated : row
    ))
    alertSummary.value.unreadCount = Math.max(0, (Number(alertSummary.value.unreadCount) || 0) - 1)
  } finally {
    alertsBusy.value = false
  }
}

async function markAllRead() {
  alertsBusy.value = true
  try {
    await api.notifications.markAllRead()
    notifications.value = notifications.value.map((row) => (
      row.readAt ? row : { ...row, readAt: new Date().toISOString() }
    ))
    alertSummary.value.unreadCount = 0
  } finally {
    alertsBusy.value = false
  }
}

onMounted(async () => {
  try {
    const [orderRows] = await Promise.all([api.orders.list(), loadAlerts().catch(() => {})])
    orders.value = orderRows
  } finally {
    ready.value = true
  }
})
</script>

<style scoped>
.profile-page {
  --r-card: 20px;
  --r-pill: 999px;
  position: relative;
  isolation: isolate;
  padding: 40px 0 88px;
  min-height: calc(100vh - 72px);
  overflow: hidden;
}

.profile-atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
}

.glow-a {
  width: min(520px, 70vw);
  height: min(420px, 50vw);
  top: -120px;
  right: -80px;
  background: radial-gradient(circle at 30% 40%, rgba(var(--accent-rgb), 0.22), transparent 70%);
}

.glow-b {
  width: min(480px, 65vw);
  height: min(380px, 48vw);
  bottom: 10%;
  left: -100px;
  background: radial-gradient(circle at 60% 50%, rgba(251, 189, 118, 0.18), transparent 72%);
}

.grid-fade {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent 78%);
}

.profile-shell {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  padding-left: 24px;
  padding-right: 24px;
  box-sizing: border-box;
}

/* Hero */
.profile-hero {
  display: flex;
  align-items: flex-end;
  padding: 8px 0 28px;
  border-bottom: 1px solid var(--line);
  animation: rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-identity {
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;
}

.avatar-block {
  flex-shrink: 0;
}

.avatar {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border: 1px solid var(--line-strong);
  background: var(--bg-2);
  border-radius: 50%;
}

.avatar.fallback {
  display: grid;
  place-items: center;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
  background: linear-gradient(145deg, var(--accent) 0%, #f59e0b 100%);
}

.identity-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 450;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.identity-copy h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 850;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: var(--ink);
}

.email {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
  word-break: break-all;
}

.provider-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.provider {
  font-size: 12px;
  font-weight: 450;
  color: var(--ink-secondary);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  padding: 5px 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.profile-foot {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.btn-logout,
.btn-admin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 450;
  min-height: 44px;
  padding: 0 22px;
  border-radius: var(--r-pill);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.btn-logout {
  border: 1px solid #fecaca;
  background: #fff;
  color: #b91c1c;
}

.btn-logout:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-admin {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
}

.btn-admin:hover {
  border-color: rgba(var(--accent-rgb, 202, 138, 4), 0.45);
  background: var(--accent-light, #fffbeb);
  color: var(--accent-deep, #92400e);
}

/* Tabs */
.profile-tabs {
  display: flex;
  gap: 0;
  margin: 0 0 28px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
  animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
}

.profile-tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: var(--muted);
  font-size: 14.5px;
  font-weight: 450;
  padding: 16px 18px 14px;
  white-space: nowrap;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.tab:hover {
  color: var(--ink);
}

.tab.on {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab .count {
  font-style: normal;
  font-size: 11px;
  font-weight: 750;
  color: #fff;
  background: var(--accent);
  padding: 2px 8px;
  min-width: 18px;
  text-align: center;
  border-radius: var(--r-pill);
}

.tab .count.warn {
  background: #dc2626;
}

/* Panels */
.profile-main {
  min-width: 0;
}

.sheet-panel {
  animation: rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  background: #f8fafc;
  border: 0;
  border-radius: var(--r-card);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  padding: 24px 28px 8px;
  overflow: hidden;
}

.overview {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 36px 40px;
  align-items: start;
  animation: rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
}

@media (max-width: 860px) {
  .overview {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

.credit-panel,
.guide-panel,
.alert-summary-panel {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.alert-summary-panel {
  grid-column: 1 / -1;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  background: #fff;
}

.panel-bar.bare {
  margin-bottom: 14px;
  padding: 0;
  border: 0;
}

.alert-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.alert-stats.inline {
  margin: 0 0 20px;
}

.alert-stat {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.alert-stat strong {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 1.1;
}

.alert-stat span {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.35;
}

.btn-line.compact {
  min-height: 32px;
  padding: 0 12px;
  font-size: 12px;
}

.alerts-panel .panel-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.alert-list {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
  display: grid;
  gap: 10px;
}

.alert-item {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
}

.alert-item.unread {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
  background: color-mix(in srgb, var(--accent) 6%, #fff);
}

.alert-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.alert-item-top time,
.violation-list time {
  font-size: 12px;
  color: var(--muted);
}

.alert-type {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #f1f5f9;
  color: #334155;
}

.alert-type.warn_email,
.alert-type.video_violation {
  background: #fee2e2;
  color: #991b1b;
}

.alert-type.renew_reminder {
  background: #ffedd5;
  color: #9a3412;
}

.alert-item strong {
  font-size: 14px;
  color: var(--ink);
}

.alert-item p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  white-space: pre-wrap;
  line-height: 1.45;
}

.alert-item-actions {
  display: flex;
  justify-content: flex-end;
}

.read-tag {
  font-size: 12px;
  color: var(--muted);
}

.violations-block {
  padding-top: 8px;
  border-top: 1px solid var(--line);
  margin-bottom: 20px;
}

.violations-block h3 {
  margin: 0;
  font-size: 15px;
}

.state-box.mini {
  padding: 18px 8px;
}

.violation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.violation-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #fee2e2;
}

.violation-list strong {
  display: block;
  font-size: 13px;
}

.violation-list p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #b91c1c;
}

@media (max-width: 720px) {
  .alert-stats {
    grid-template-columns: 1fr;
  }
}

.state-box {
  background: #f8fafc;
  border: 0;
  border-radius: var(--r-card);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.state-box.bare {
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 40px 8px 48px;
}

.credit-panel {
  position: relative;
  padding: 8px 4px 8px 0;
  overflow: visible;
}

.credit-panel::after {
  display: none;
}

.credit-panel-top .kicker {
  display: block;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}

.credit-panel-top h2,
.guide-panel h2,
.panel-bar h2,
.state-box h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.credit-figure {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 22px 0 14px;
}

.credit-figure .num {
  font-size: clamp(52px, 7vw, 72px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.95;
  color: var(--ink);
  animation: tick 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.credit-figure .unit {
  font-size: 15px;
  font-weight: 450;
  color: var(--muted);
}

.credit-note {
  margin: 0 0 26px;
  max-width: 36ch;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--muted);
}

.credit-note strong {
  color: var(--ink-secondary);
}

.credit-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-solid,
.btn-line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 450;
  text-decoration: none;
  border-radius: var(--r-pill);
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.btn-solid {
  background: var(--accent);
  color: #fff;
  border: 1px solid var(--accent);
}

.btn-solid:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-line {
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--line-strong);
}

.btn-line:hover {
  border-color: var(--ink);
}

.guide-panel {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.guide-lead {
  margin: 8px 0 0;
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.5;
}

.steps {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.steps li {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}

.steps li:last-child {
  padding-bottom: 0;
}

.idx {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--accent);
  padding-top: 2px;
}

.steps strong {
  display: block;
  font-size: 15px;
  font-weight: 750;
  color: var(--ink);
}

.steps p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
}

.panel-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-bar .meta {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 56px 24px;
}

.state-box p {
  margin: 0;
  max-width: 36ch;
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.5;
}

.state-box.empty .btn-solid {
  margin-top: 8px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sheet-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -8px;
  padding: 0 0 8px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0 4px;
  border-top: 1px solid var(--line);
  margin-top: 8px;
}

.pager-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.pager-btn:hover:not(:disabled) {
  border-color: var(--ink);
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager-meta {
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  min-width: 4.5em;
  text-align: center;
}

.sheet-panel table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.sheet-panel th,
.sheet-panel td {
  padding: 14px 12px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  font-size: 14px;
  vertical-align: middle;
}

.sheet-panel th:first-child,
.sheet-panel td:first-child {
  padding-left: 8px;
}

.sheet-panel th:last-child,
.sheet-panel td:last-child {
  padding-right: 8px;
}

.sheet-panel th {
  background: transparent;
  font-size: 11px;
  font-weight: 450;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom-color: #e2e8f0;
}

tr:last-child td {
  border-bottom: 0;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:hover {
  background: rgba(var(--accent-rgb), 0.03);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.strong {
  font-weight: 450;
  color: var(--ink);
}

.title-cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.muted {
  color: var(--muted);
}

.end {
  text-align: right;
}

.credit-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-deep);
  background: var(--accent-light);
  border: 1px solid var(--accent-border);
  padding: 4px 10px;
  border-radius: var(--r-pill);
}

.status {
  display: inline-block;
  font-size: 12px;
  font-weight: 450;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
}

.status.queued,
.status.running,
.status.pending,
.status.unpaid {
  background: var(--gold-light);
  border-color: var(--accent-border);
  color: var(--accent-deep);
}

.status.completed,
.status.paid {
  background: #eff6ff;
  border-color: #a7f3d0;
  color: #047857;
}

.status.failed,
.status.cancelled {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.link-go {
  font-size: 13px;
  font-weight: 750;
  color: var(--accent);
  text-decoration: none;
}

.link-go:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* History gallery (giống /schedule) */
.history-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding-top: 4px;
}

.history-pager-pages {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.history-pager-btn,
.history-pager-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  min-width: 36px;
  padding: 0 12px;
  border: 1px solid var(--line-strong, var(--line));
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.history-pager-btn:hover:not(:disabled),
.history-pager-num:hover:not(.active) {
  border-color: var(--accent, #ff570f);
  color: var(--accent, #ff570f);
}

.history-pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.history-pager-num.active {
  background: var(--accent, #ff570f);
  border-color: var(--accent, #ff570f);
  color: #fff;
}

.history-pager-ellipsis {
  min-width: 20px;
  text-align: center;
  color: var(--muted);
  font-weight: 700;
}

.history-panel {
  animation: rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.history-gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px 16px;
}

.clip-card {
  display: block;
  border-radius: 20px;
  transition: transform 0.25s ease;
}

.clip-card:hover {
  transform: translateY(-4px);
}

.clip-media {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 20px;
  overflow: hidden;
  background: #1c140c;
  border: 1px solid #efe2d0;
  box-shadow: 0 14px 32px -8px rgba(28, 20, 12, 0.16);
}

.clip-media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.clip-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #2a1d12, #1c140c);
  color: rgba(255, 255, 255, 0.55);
}

.clip-placeholder.running,
.clip-placeholder.queued {
  background: linear-gradient(160deg, #5b3a12, #2a1d12);
  color: #fbbf24;
}

.clip-placeholder.failed {
  background: linear-gradient(160deg, #4c1515, #1c140c);
  color: #fca5a5;
}

.clip-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, transparent 38%, rgba(0, 0, 0, 0.78) 100%);
  pointer-events: none;
}

.clip-overlay .clip-cta,
.clip-overlay .clip-top,
.clip-overlay .clip-footer,
.clip-overlay .clip-progress {
  pointer-events: auto;
}

.clip-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-pill,
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
}

.status-pill.completed { background: rgba(21, 128, 61, 0.85); }
.status-pill.failed { background: rgba(185, 28, 28, 0.85); }
.status-pill.running,
.status-pill.queued { background: rgba(180, 83, 9, 0.88); }

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.running .dot,
.status-pill.queued .dot {
  animation: pulse-dot 1.4s ease infinite;
}

@keyframes pulse-dot {
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.clip-cta {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.96);
  z-index: 2;
  font-size: 13px;
  font-weight: 750;
  color: #fff;
  background: rgba(255, 87, 15, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 10px 16px;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  text-decoration: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
}

.clip-card:hover .clip-cta {
  opacity: 0.95;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
}

.clip-cta:hover {
  background: rgba(255, 87, 15, 0.92);
}

.clip-progress {
  margin-top: auto;
  margin-bottom: 10px;
  display: grid;
  gap: 6px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fde68a;
}

.bar {
  height: 5px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #fbbf24, #ff570f);
}

.clip-footer {
  position: relative;
  z-index: 1;
}

.clip-info {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.clip-user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 13px;
  font-weight: 750;
  flex-shrink: 0;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.clip-user-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.clip-desc {
  min-width: 0;
  flex: 1;
}

.clip-desc strong {
  display: block;
  font-size: 14px;
  font-weight: 750;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.clip-desc p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.88);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tick {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1080px) {
  .history-gallery { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
  .history-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 600px) {
  .profile-page {
    padding: 28px 0 64px;
  }

  .profile-shell {
    padding-left: 16px;
    padding-right: 16px;
  }

  .history-gallery {
    grid-template-columns: 1fr 1fr;
    gap: 12px 8px;
  }

  .hero-identity {
    align-items: flex-start;
  }

  .avatar {
    width: 72px;
    height: 72px;
  }

  .avatar.fallback {
    font-size: 28px;
  }

  .profile-foot {
    margin-top: 28px;
  }

  .profile-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-logout,
  .btn-admin {
    width: 100%;
  }

  .tab {
    padding: 14px 12px 12px;
    font-size: 13.5px;
  }

  .credit-panel,
  .guide-panel {
    padding: 4px 0;
  }

  th,
  td {
    padding: 12px 14px;
  }
}
</style>

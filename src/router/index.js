import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BotLayout from '@/layouts/BotLayout.vue'
import BotsHomeView from '@/views/BotsHomeView.vue'
import BotDetailView from '@/views/BotDetailView.vue'
import BotConfigView from '@/views/BotConfigView.vue'
import BotPricingView from '@/views/BotPricingView.vue'
import BotContactView from '@/views/BotContactView.vue'
import LoginView from '@/views/LoginView.vue'
import GeminiPinResetView from '@/views/GeminiPinResetView.vue'
import AccountProfileView from '@/views/AccountProfileView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminOverviewView from '@/views/admin/AdminOverviewView.vue'
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminBotsView from '@/views/admin/AdminBotsView.vue'
import AdminAiConfigView from '@/views/admin/AdminAiConfigView.vue'
import AdminOrdersView from '@/views/admin/AdminOrdersView.vue'
import AdminPackagesView from '@/views/admin/AdminPackagesView.vue'
import AdminSettingsView from '@/views/admin/AdminSettingsView.vue'
import AdminNotificationsView from '@/views/admin/AdminNotificationsView.vue'
import { api } from '@/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: BotLayout,
      children: [
        { path: '', name: 'home', component: BotsHomeView, meta: { fullWidth: true } },
        { path: 'config', name: 'config', component: BotConfigView },
        { path: 'pricing', name: 'pricing', component: BotPricingView, meta: { fullWidth: true } },
        { path: 'contact', name: 'contact', component: BotContactView },
        { path: 'account', name: 'account', component: AccountProfileView, meta: { requiresAuth: true } },
        {
          path: 'report',
          redirect: () => ({ path: '/contact', hash: '#incident-report' }),
        },
        {
          path: 'bots/new',
          redirect: { path: '/config', query: { create: '1' } },
        },
        {
          path: 'bots/:id/:tab?',
          name: 'bot-detail',
          component: BotDetailView,
          meta: { requiresAuth: true, workspace: true },
        },
        { path: 'login', name: 'login', component: LoginView },
        { path: 'pin-reset', name: 'pin-reset', component: GeminiPinResetView },
        { path: ':pathMatch(.*)*', redirect: { name: 'home' } },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin-overview', component: AdminOverviewView },
        { path: 'users', name: 'admin-users', component: AdminUsersView },
        { path: 'notifications', name: 'admin-notifications', component: AdminNotificationsView },
        { path: 'bots', name: 'admin-bots', component: AdminBotsView },
        { path: 'ai-config', name: 'admin-ai', component: AdminAiConfigView },
        { path: 'packages', name: 'admin-packages', component: AdminPackagesView },
        { path: 'orders', name: 'admin-orders', component: AdminOrdersView },
        { path: 'settings', name: 'admin-settings', component: AdminSettingsView },
      ],
    },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 88, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.restoreSession()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    auth.saveRedirect(to.fullPath)
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && auth.isLoggedIn && !to.query.token) {
    return auth.consumeRedirect('/')
  }

  if (to.matched.some((r) => r.meta.requiresAdmin) && !auth.isAdmin) {
    return { name: 'home' }
  }

  return true
})

router.afterEach((to) => {
  if (to.path.startsWith('/login')) return
  api.analytics.hit(to.fullPath).catch(() => {})
})

export default router
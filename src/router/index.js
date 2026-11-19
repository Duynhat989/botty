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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: BotLayout,
      children: [
        { path: '', name: 'home', component: BotsHomeView, meta: { fullWidth: true } },
        { path: 'config', name: 'config', component: BotConfigView },
        { path: 'pricing', name: 'pricing', component: BotPricingView },
        { path: 'contact', name: 'contact', component: BotContactView },
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
  ],
  scrollBehavior() {
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

  return true
})

export default router
<template>
  <header class="topbar-wrapper" :class="{ scrolled: isScrolled }">
    <div class="topbar-inner">
      <!-- BRAND LOGO -->
      <RouterLink to="/" class="brand" @click="closeMobile">
        <div class="brand-mark-box">
          <img class="brand-mark" src="/logo.png" :alt="t('nav.brandAlt')" width="32" height="32" />
        </div>
        <div class="brand-text">
          <span class="brand-title">Botty</span>
        </div>
      </RouterLink>

      <!-- DESKTOP NAVIGATION PILL -->
      <nav class="topnav" :aria-label="t('nav.ariaMain')">
        <RouterLink to="/" :class="{ on: route.path === '/' }">
          <span>{{ t('nav.home') }}</span>
        </RouterLink>
        <RouterLink to="/history" :class="{ on: route.path.startsWith('/history') }">
          <span>{{ t('nav.history') }}</span>
        </RouterLink>
        <button
          type="button"
          class="topnav-writing"
          :class="{ on: route.name === 'board' || drawSession.writingBoard, idle: !canUseWritingBoard }"
          :title="writingBoardNavTitle"
          :aria-pressed="drawSession.writingBoard"
          @click="onWritingBoardNavClick"
        >
          <span>{{ t('nav.writingBoard') }}</span>
        </button>
        <RouterLink to="/pricing" :class="{ on: route.path.startsWith('/pricing') }">
          <span>{{ t('nav.upgrade') }}</span>
        </RouterLink>
      </nav>

      <!-- RIGHT ACTIONS -->
      <div class="top-actions">
        <!-- Logged in state -->
        <template v-if="auth.isLoggedIn">
          <RouterLink
            to="/pricing"
            class="credit-pill"
            :class="{ on: route.path.startsWith('/pricing') || route.path.startsWith('/checkout') }"
            :title="t('nav.creditsTitle')"
          >
            <span class="coin-icon" aria-hidden="true">
              <Zap :size="12" fill="currentColor" :stroke-width="2" />
            </span>
            <span class="credit-num">{{ auth.credits }}</span>
            <span class="credit-label">{{ t('nav.creditsLabel') }}</span>
          </RouterLink>

          <RouterLink
            to="/profile"
            class="profile-btn"
            :class="{ on: route.path.startsWith('/profile') }"
            :title="t('nav.profileTitle')"
          >
            <div class="avatar-circle">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" class="avatar-img" />
              <span v-else class="avatar-initial">{{ (auth.user?.name || auth.user?.email || 'U')[0].toUpperCase() }}</span>
            </div>
            <span class="profile-name">{{ auth.user?.name || t('nav.profileFallback') }}</span>
          </RouterLink>
        </template>

        <!-- Guest state -->
        <template v-else>
          <RouterLink to="/login" class="btn-cta-primary">
            <span>{{ t('nav.cta') }}</span>
            <ArrowRight :size="13" :stroke-width="2.5" aria-hidden="true" />
          </RouterLink>
        </template>

        <!-- Mobile hamburger toggle -->
        <button
          type="button"
          class="mobile-menu-toggle"
          :class="{ active: mobileOpen }"
          :aria-label="t('nav.menu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="bar bar-1"></span>
          <span class="bar bar-2"></span>
          <span class="bar bar-3"></span>
        </button>
      </div>
    </div>

    <!-- MOBILE DROPDOWN MENU -->
    <Transition name="mobile-menu">
      <div v-if="mobileOpen" class="mobile-drawer">
        <nav class="mobile-nav">
          <RouterLink to="/" :class="{ on: route.path === '/' }" @click="closeMobile">
            <Home :size="18" :stroke-width="2" />
            <span>{{ t('nav.home') }}</span>
          </RouterLink>

          <RouterLink to="/history" :class="{ on: route.path.startsWith('/history') }" @click="closeMobile">
            <History :size="18" :stroke-width="2" />
            <span>{{ t('nav.history') }}</span>
          </RouterLink>

          <button
            type="button"
            class="mobile-nav-writing"
            :class="{ on: route.name === 'board' || drawSession.writingBoard, idle: !canUseWritingBoard }"
            :title="writingBoardNavTitle"
            :aria-pressed="drawSession.writingBoard"
            @click="onWritingBoardNavClick"
          >
            <PenLine :size="18" :stroke-width="2" />
            <span>{{ t('nav.writingBoard') }}</span>
          </button>

          <RouterLink to="/pricing" :class="{ on: route.path.startsWith('/pricing') }" @click="closeMobile">
            <CircleDollarSign :size="18" :stroke-width="2" />
            <span>{{ t('nav.upgrade') }}</span>
          </RouterLink>

          <template v-if="auth.isLoggedIn">
            <RouterLink to="/profile" :class="{ on: route.path.startsWith('/profile') }" @click="closeMobile">
              <User :size="18" :stroke-width="2" />
              <span>{{ t('nav.mobileProfile') }}</span>
            </RouterLink>
          </template>
        </nav>

        <div class="mobile-actions">
          <template v-if="auth.isLoggedIn">
            <div class="mobile-credit-box">
              <span>{{ t('nav.mobileBalance') }}</span>
              <strong>{{ t('nav.mobileCredits', { n: auth.credits }) }}</strong>
            </div>
          </template>
          <template v-else>
            <RouterLink to="/login" class="mobile-btn-cta" @click="closeMobile">
              {{ t('nav.mobileCta') }}
            </RouterLink>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRight,
  CircleDollarSign,
  History,
  Home,
  PenLine,
  User,
  Zap,
} from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useDrawSessionStore } from '@/stores/drawSession'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const drawSession = useDrawSessionStore()
const { t } = useI18n()

const canUseWritingBoard = computed(() => true)

const writingBoardNavTitle = computed(() =>
  drawSession.writingBoardHost ? t('structure.writingBoardHint') : t('nav.writingBoardOpenWorkspace'),
)

async function waitForWritingHost(maxMs = 2400) {
  const start = Date.now()
  while (!drawSession.writingBoardHost && Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 40))
    await nextTick()
  }
}

async function onWritingBoardNavClick() {
  closeMobile()

  if (route.name === 'board' && drawSession.writingBoardHost) {
    drawSession.toggleWritingBoard()
    return
  }

  if (route.name !== 'board') {
    if (!drawSession.writingOnly || !drawSession.ready) {
      drawSession.ensureBlankWritingCanvas()
    }
    drawSession.writingBoard = true
    await router.push({ name: 'board' })
    await waitForWritingHost()
    return
  }

  drawSession.writingBoard = true
  await waitForWritingHost()
}

const mobileOpen = ref(false)
const isScrolled = ref(false)

function closeMobile() {
  mobileOpen.value = false
}

function handleScroll() {
  isScrolled.value = window.scrollY > 12
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* ==========================================================================
   APP HEADER - SLEEK LIGHT GLASSMORPHISM
   ========================================================================== */
.topbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: rgb(255 237 229 / 88%);
  backdrop-filter: blur(16px) saturate(1.8);
  -webkit-backdrop-filter: blur(16px) saturate(1.8);
  border-bottom: 1px solid rgb(254 215 199 / 65%);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.topbar-wrapper.scrolled {
  background: rgb(255 237 229 / 94%);
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
  border-bottom-color: rgb(254 215 199 / 80%);
}

.topbar-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 72px 0 24px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* --------------------------------------------------------------------------
   BRAND
   -------------------------------------------------------------------------- */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  user-select: none;
}

.brand-mark-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.brand:hover .brand-mark-box {
  transform: scale(1.06);
}

.brand-mark {
  width: 34px;
  height: 34px;
  object-fit: contain;
  border-radius: 0;
}

.brand-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.brand-title {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.035em;
  color: var(--color-ink);
  line-height: 1;
}

.brand-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--accent-light);
  color: var(--accent);
}

/* --------------------------------------------------------------------------
   CENTER NAVIGATION PILL
   -------------------------------------------------------------------------- */
.topnav {
  display: flex;
  align-items: center;
  gap: 20px;
  background: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.topnav a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  font-size: 13px;
  font-weight: 450;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  position: relative;
}

.topnav a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent);
  border-radius: 999px;
  opacity: 0;
  transform: scaleX(0.8);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.topnav a:hover {
  color: #0f172a;
}

.topnav a.on {
  background: transparent;
  color: var(--accent);
  font-weight: 550;
  box-shadow: none;
}

.topnav a.on::after {
  opacity: 1;
  transform: scaleX(1);
}

.topnav-writing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-size: 13px;
  font-weight: 450;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.topnav-writing::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent);
  border-radius: 999px;
  opacity: 0;
  transform: scaleX(0.8);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.topnav-writing:hover {
  color: #0f172a;
}

.topnav-writing.on {
  color: var(--accent);
  font-weight: 550;
}

.topnav-writing.on::after {
  opacity: 1;
  transform: scaleX(1);
}

.topnav-writing.idle {
  opacity: 0.72;
  cursor: pointer;
}

.topnav-writing.idle:hover {
  color: #64748b;
}

/* --------------------------------------------------------------------------
   RIGHT ACTIONS
   -------------------------------------------------------------------------- */
.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.lang-menu {
  position: relative;
  flex-shrink: 0;
}

.lang-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.lang-trigger:hover,
.lang-trigger[aria-expanded='true'] {
  color: var(--accent-hover);
  background: var(--accent-light);
}

.lang-badge {
  position: absolute;
  top: 2px;
  right: 1px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  text-transform: lowercase;
  color: var(--accent);
  pointer-events: none;
}

.lang-popup {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  min-width: 176px;
  padding: 6px;
  border: 0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.lang-option {
  display: grid;
  grid-template-columns: 22px 1fr 16px;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 550;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.lang-option:hover {
  background: rgba(var(--accent-rgb), 0.08);
}

.lang-option.on {
  background: var(--accent-light);
  color: var(--accent-deep);
}

.lang-flag {
  font-size: 16px;
  line-height: 1;
}

.lang-name {
  min-width: 0;
}

.lang-check {
  color: var(--accent);
  justify-self: end;
}

.lang-pop-enter-active,
.lang-pop-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.lang-pop-enter-from,
.lang-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.credit-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-light);
  text-decoration: none;
  font-size: 13px;
  color: var(--accent-hover);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.credit-pill:hover,
.credit-pill.on {
  background: var(--accent-border);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.coin-icon {
  display: inline-flex;
  align-items: center;
  color: #eab308;
  filter: drop-shadow(0 1px 2px rgba(234, 179, 8, 0.4));
}

.credit-num {
  font-weight: 750;
  color: var(--accent);
}

.credit-label {
  font-size: 11.5px;
  color: var(--accent);
  font-weight: 500;
}

/* Profile Button */
.profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
}

.profile-btn:hover,
.profile-btn.on {
  background: #ffffffb0;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--gold));
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Guest buttons */
.btn-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 650;
  color: #ffffff;
  background: linear-gradient(135deg, var(--accent) 0%, var(--gold) 100%);
  text-decoration: none;
  box-shadow: 0 3px 12px rgba(var(--accent-rgb, 202, 138, 4), 0.28);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-cta-primary:hover {
  background: linear-gradient(135deg, var(--gold) 0%, var(--accent-deep) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(var(--accent-rgb, 202, 138, 4), 0.38);
}

/* Mobile Menu Toggle Button */
.mobile-menu-toggle {
  display: none;
  position: relative;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line-strong, #e2e8f0);
  border-radius: 999px;
  background: #fff;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.mobile-menu-toggle:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.mobile-menu-toggle.active {
  background: var(--ink, #0f172a);
  border-color: var(--ink, #0f172a);
  box-shadow: none;
}

.mobile-menu-toggle .bar {
  display: block;
  width: 16px;
  height: 1.5px;
  background: var(--ink, #0f172a);
  border-radius: 99px;
  transform-origin: center;
  transition: transform 0.22s ease, opacity 0.18s ease, background 0.2s ease;
}

.mobile-menu-toggle.active .bar {
  background: #fff;
}

.mobile-menu-toggle.active .bar-1 {
  transform: translateY(6.5px) rotate(45deg);
}

.mobile-menu-toggle.active .bar-2 {
  opacity: 0;
  transform: scaleX(0.4);
}

.mobile-menu-toggle.active .bar-3 {
  transform: translateY(-6.5px) rotate(-45deg);
}

/* --------------------------------------------------------------------------
   MOBILE DRAWER
   -------------------------------------------------------------------------- */
.mobile-drawer {
  background: rgb(255 237 229 / 96%);
  border-bottom: 1px solid rgb(254 215 199 / 80%);
  box-shadow: 0 16px 30px -10px rgba(15, 23, 42, 0.1);
  padding: 16px 20px 24px;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.mobile-nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #334155;
  text-decoration: none;
  font-size: 15px;
  font-weight: 550;
  transition: all 0.15s ease;
}

.mobile-nav a:hover,
.mobile-nav a.on {
  background: #f1f5f9;
  color: #0f172a;
}

.mobile-nav a.on {
  font-weight: 650;
  color: var(--accent);
}

.mobile-nav-writing {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #334155;
  font-size: 15px;
  font-weight: 550;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-nav-writing:hover,
.mobile-nav-writing.on {
  background: #f1f5f9;
  color: #0f172a;
}

.mobile-nav-writing.on {
  font-weight: 650;
  color: var(--accent);
}

.mobile-nav-writing.idle {
  opacity: 0.55;
}

.mobile-badge-new {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 7px;
  border-radius: 999px;
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.mobile-credit-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--accent-light);
  border-radius: 12px;
  color: var(--accent-hover);
  font-size: 14px;
}

.mobile-btn-cta {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--gold) 100%);
  color: #ffffff;
  text-decoration: none;
  font-weight: 650;
  font-size: 14.5px;
  box-shadow: 0 4px 14px rgba(var(--accent-rgb, 202, 138, 4), 0.25);
}

/* Animations */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* --------------------------------------------------------------------------
   RESPONSIVE BREAKPOINTS
   -------------------------------------------------------------------------- */
@media (max-width: 768px) {
  .topbar-inner {
    padding: 0 58px 0 14px;
    height: 58px;
    gap: 10px;
  }

  .brand-title {
    font-size: 17px;
  }

  .brand-mark-box,
  .brand-mark {
    width: 30px;
    height: 30px;
  }

  .topnav {
    display: none;
  }

  .btn-cta-primary {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .credit-label {
    display: none;
  }

  .credit-pill {
    gap: 5px;
    padding: 6px 10px;
  }

  .profile-name {
    display: none;
  }

  .profile-btn {
    padding: 4px;
  }

  .mobile-drawer {
    padding: 8px 14px 16px;
  }
}

@media (max-width: 380px) {
  .brand-text {
    display: none;
  }
}
</style>

<template>
  <div
    class="shell bot-shell"
    :class="{ 'shell--bot-test': isBotTestTab, 'shell--home': isHome }"
    ref="shellRef"
  >
    <header class="topbar" :class="{ scrolled: isScrolled }">
      <div class="topbar-inner">
        <RouterLink to="/" class="brand" @click="closeMenus">
          <img class="brand-mark" src="/logo.png" alt="" width="34" height="34" />
          <span class="brand-title">Bot<span class="brand-accent">ty</span></span>
        </RouterLink>

        <nav class="topnav" aria-label="Chính">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="topnav-link"
            :class="{ on: isNavActive(item) }"
            @click="closeMenus"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="top-actions">
          <template v-if="auth.isLoggedIn">
            <div class="user-menu" :class="{ open: userMenuOpen }">
              <button
                type="button"
                class="user-trigger"
                :aria-expanded="userMenuOpen"
                aria-haspopup="menu"
                @click="toggleUserMenu"
              >
                <span class="avatar" aria-hidden="true">
                  <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" class="avatar-img" />
                  <span v-else>{{ userInitial }}</span>
                </span>
                <span class="user-label">{{ auth.user?.name || 'Tài khoản' }}</span>
                <ChevronDown :size="14" class="chev" aria-hidden="true" />
              </button>
              <div v-if="userMenuOpen" class="user-popup" role="menu">
                <p class="user-popup-name">{{ auth.user?.name }}</p>
                <p v-if="auth.user?.email" class="user-popup-email">{{ auth.user.email }}</p>
                <hr class="sep" />
                <RouterLink to="/" class="menu-item" role="menuitem" @click="closeMenus">Trang chủ</RouterLink>
                <RouterLink to="/config" class="menu-item" role="menuitem" @click="closeMenus">Cấu hình bot</RouterLink>
                <RouterLink to="/config?create=1" class="menu-item" role="menuitem" @click="closeMenus">Tạo bot mới</RouterLink>
                <RouterLink to="/pricing" class="menu-item" role="menuitem" @click="closeMenus">Gói cước</RouterLink>
                <RouterLink to="/contact" class="menu-item" role="menuitem" @click="closeMenus">Liên hệ</RouterLink>
                <button
                  v-if="auth.user?.hasGeminiPin"
                  type="button"
                  class="menu-item"
                  role="menuitem"
                  :disabled="pinResetBusy"
                  @click="requestPinReset"
                >
                  {{ pinResetBusy ? 'Đang gửi email…' : 'Quên PIN — gửi email đặt lại' }}
                </button>
                <p v-if="pinResetMsg" class="user-popup-hint">{{ pinResetMsg }}</p>
                <hr class="sep" />
                <button type="button" class="menu-item danger" role="menuitem" @click="logout">Đăng xuất</button>
              </div>
            </div>
          </template>
          <RouterLink v-else-if="!isLogin" to="/login" class="b-btn b-btn--primary b-btn--sm" @click="closeMenus">
            Đăng nhập
          </RouterLink>

          <button
            type="button"
            class="mobile-toggle"
            :aria-expanded="mobileNavOpen"
            aria-label="Menu"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <span class="bar" />
            <span class="bar" />
            <span class="bar" />
          </button>
        </div>
      </div>

      <Transition name="drawer">
        <nav v-if="mobileNavOpen" class="mobile-nav" aria-label="Di động">
          <RouterLink
            v-for="item in navItems"
            :key="'m-' + item.to"
            :to="item.to"
            class="mobile-link"
            :class="{ on: isNavActive(item) }"
            @click="closeMenus"
          >
            {{ item.label }}
          </RouterLink>
          <template v-if="auth.isLoggedIn">
            <hr class="sep" />
            <RouterLink to="/config?create=1" class="mobile-link" @click="closeMenus">Tạo bot mới</RouterLink>
            <button type="button" class="mobile-link danger" @click="logout">Đăng xuất</button>
          </template>
        </nav>
      </Transition>
    </header>

    <main
      class="content"
      :class="{
        'content--auth': isLogin,
        'content--wide': isFullWidth,
        'content--workspace': isWorkspace && !isWorkspaceWide,
        'content--workspace-wide': isWorkspaceWide,
        'content--bot-test': isBotTestTab,
        'content--narrow': !isLogin && !isFullWidth && !isWorkspace,
        'content--home': isHome,
      }"
    >
      <RouterView />
    </main>

    <footer v-if="!isLogin" class="site-foot">
      <p>Phản hồi tự động Facebook — miễn phí với Gemini API key của bạn</p>
    </footer>

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChevronDown } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import { geminiPinGateState, openGeminiPinSetup } from '@/composables/useGeminiPinGate'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const shellRef = ref(null)
const isScrolled = ref(false)
const userMenuOpen = ref(false)
const mobileNavOpen = ref(false)

const isHome = computed(() => route.name === 'home')
const isLogin = computed(() => route.name === 'login')
const isPinReset = computed(() => route.name === 'pin-reset')
watch(
  () => [auth.initialized, auth.isLoggedIn, auth.user?.hasGeminiPin, isLogin.value, isPinReset.value],
  () => {
    if (
      auth.initialized &&
      auth.isLoggedIn &&
      !auth.user?.hasGeminiPin &&
      !isLogin.value &&
      !isPinReset.value
    ) {
      if (!(geminiPinGateState.open && geminiPinGateState.mode === 'setup')) {
        openGeminiPinSetup(true)
      }
    }
  },
  { immediate: true },
)
const pinResetBusy = ref(false)
const pinResetMsg = ref('')
const isFullWidth = computed(() => Boolean(route.meta.fullWidth))
const isWorkspace = computed(() => Boolean(route.meta.workspace))
const isWorkspaceWide = computed(() => route.name === 'bot-detail')
const isBotTestTab = computed(
  () => route.name === 'bot-detail' && String(route.params.tab || 'test') === 'test',
)

const navItems = [
  { to: '/', label: 'Trang chủ', names: ['home'] },
  { to: '/config', label: 'Cấu hình', names: ['config', 'bot-detail'] },
  { to: '/pricing', label: 'Gói cước', names: ['pricing'] },
  { to: '/contact', label: 'Liên hệ', names: ['contact'] },
]

const userInitial = computed(() => {
  const n = auth.user?.name || auth.user?.email || 'U'
  return n.charAt(0).toUpperCase()
})

function isNavActive(item) {
  const name = route.name
  if (item.names.includes(name)) return true
  if (item.to === '/config' && name === 'bot-detail') return true
  return false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
  if (userMenuOpen.value) mobileNavOpen.value = false
}

function closeMenus() {
  userMenuOpen.value = false
  mobileNavOpen.value = false
}

function logout() {
  closeMenus()
  auth.logout()
  router.push('/login')
}

async function requestPinReset() {
  pinResetMsg.value = ''
  pinResetBusy.value = true
  try {
    const data = await api.auth.requestGeminiPinReset()
    pinResetMsg.value = data?.message || 'Đã gửi email. Mở link để đặt PIN mới.'
    closeMenus()
  } catch (e) {
    pinResetMsg.value = e?.message || 'Không gửi được email'
  } finally {
    pinResetBusy.value = false
  }
}

function handleScroll() {
  isScrolled.value = window.scrollY > 12
}

function onDocClick(e) {
  if (!userMenuOpen.value) return
  const root = shellRef.value
  if (root && !root.contains(e.target)) userMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.shell.shell--home {
  background: #ffffff;
}

.shell--bot-test {
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

.shell--bot-test .site-foot {
  display: none;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--b-border);
}

.topbar.scrolled {
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
}

.topbar-inner {
  max-width: var(--b-layout);
  margin: 0 auto;
  padding: 0 24px;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  margin-right: auto;
}

@media (min-width: 900px) {
  .brand {
    margin-right: 0;
  }
}

.brand-mark {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.brand-title {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.035em;
  color: var(--b-ink);
  line-height: 1;
}

.brand-accent {
  color: var(--b-accent);
}

.topnav {
  display: none;
  align-items: center;
  gap: 20px;
}

@media (min-width: 900px) {
  .topnav {
    display: flex;
    flex: 1;
    justify-content: center;
  }
}

.topnav-link {
  position: relative;
  padding: 6px 4px;
  font-size: 13px;
  font-weight: 450;
  color: var(--b-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.topnav-link:hover {
  color: var(--b-ink);
}

.topnav-link.on {
  color: var(--b-accent);
  font-weight: 550;
}

.topnav-link.on::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--b-accent);
  border-radius: 999px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

@media (min-width: 900px) {
  .top-actions {
    margin-left: 0;
  }
}

.user-menu {
  position: relative;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  border: 1px solid var(--b-border);
  border-radius: 999px;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink);
  cursor: pointer;
  box-shadow: var(--b-shadow);
  transition: border-color 0.15s ease;
}

.user-menu.open .user-trigger,
.user-trigger:hover {
  border-color: var(--b-border-strong);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--b-accent-soft);
  color: var(--b-accent);
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

.user-label {
  display: none;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .user-label {
    display: inline;
  }
}

.chev {
  color: var(--b-muted);
  transition: transform 0.15s ease;
}

.user-menu.open .chev {
  transform: rotate(180deg);
}

.user-popup {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  min-width: 220px;
  padding: 8px;
  border: 1px solid var(--b-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.user-popup-name {
  margin: 4px 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b-ink);
}

.user-popup-email {
  margin: 2px 10px 8px;
  font-size: 12px;
  color: var(--b-muted);
  word-break: break-all;
}

.user-popup-hint {
  margin: 4px 10px 8px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-accent);
}

.sep {
  border: none;
  border-top: 1px solid var(--b-border);
  margin: 6px 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--b-ink-secondary);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.menu-item:hover {
  background: var(--b-accent-soft);
  color: var(--b-accent-hover);
}

.menu-item.danger {
  color: var(--b-danger);
}

.menu-item.danger:hover {
  background: var(--b-danger-soft);
}

.mobile-toggle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--b-border);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

@media (min-width: 900px) {
  .mobile-toggle {
    display: none;
  }
}

.bar {
  display: block;
  width: 18px;
  height: 2px;
  margin: 0 auto;
  background: var(--b-ink);
  border-radius: 2px;
}

.mobile-nav {
  display: grid;
  gap: 2px;
  padding: 8px 16px 16px;
  border-top: 1px solid var(--b-border);
  background: #fff;
}

@media (min-width: 900px) {
  .mobile-nav {
    display: none;
  }
}

.mobile-link {
  display: block;
  padding: 12px 10px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--b-ink-secondary);
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.mobile-link.on {
  color: var(--b-accent);
  background: var(--b-accent-soft);
}

.mobile-link.danger {
  color: var(--b-danger);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.content {
  flex: 1;
  width: 100%;
  padding: 2rem 1.25rem 3rem;
}

.content--narrow {
  width: min(var(--b-max), 100%);
  margin: 0 auto;
}

.content--wide {
  width: min(var(--b-layout), 100%);
  margin: 0 auto;
  padding-left: clamp(1.25rem, 4vw, 2.5rem);
  padding-right: clamp(1.25rem, 4vw, 2.5rem);
}

.content--home {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
}

.content--workspace {
  width: min(980px, 100%);
  margin: 0 auto;
  padding-bottom: 2.5rem;
}

.content--workspace-wide {
  width: 100%;
  max-width: none;
  margin: 0;
  /* Lề ngang do .detail-shell (90vw) — tránh chồng padding */
  padding: 1rem 0 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.content--workspace-wide > :deep(*) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.content--workspace-wide.content--bot-test {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: clamp(0.5rem, 1.5vw, 1rem);
  padding-bottom: 0.5rem;
}

.content--workspace-wide.content--bot-test > :deep(*) {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.content--auth {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 44px 20px 56px;
}

.site-foot {
  border-top: 1px solid var(--b-border);
  background: #fff;
  padding: 20px 24px;
}

.site-foot p {
  margin: 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--b-muted);
}
</style>
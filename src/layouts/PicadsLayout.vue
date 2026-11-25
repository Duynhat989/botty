<template>
  <div class="picads-root">
    <header v-if="showChrome" class="picads-top">
      <RouterLink :to="{ name: 'picads-extensions' }" class="brand">
        <span class="brand-mark">P</span>
        <span>PicAds Console</span>
      </RouterLink>
      <nav class="nav" aria-label="PicAds">
        <RouterLink :to="{ name: 'picads-extensions' }" active-class="on">Extension</RouterLink>
        <RouterLink :to="{ name: 'picads-keys' }" active-class="on">API keys</RouterLink>
        <RouterLink :to="{ name: 'picads-docs' }" active-class="on">Tài liệu API</RouterLink>
      </nav>
      <div class="top-actions">
        <span class="user-chip">{{ picads.user?.name || picads.user?.email }}</span>
        <button type="button" class="btn-ghost" @click="signOut">Đăng xuất</button>
      </div>
    </header>
    <main class="picads-main" :class="{ 'picads-main--auth': !showChrome }">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { usePicadsAuthStore } from '@/stores/picadsAuth'

const picads = usePicadsAuthStore()
const route = useRoute()
const router = useRouter()

const showChrome = computed(() => route.name !== 'picads-login' && picads.isLoggedIn)

function signOut() {
  picads.logout()
  router.push({ name: 'picads-login' })
}
</script>

<style scoped>
.picads-root {
  min-height: 100dvh;
  background:
    radial-gradient(70% 50% at 0% 0%, rgba(99, 102, 241, 0.12), transparent 55%),
    linear-gradient(180deg, #f5f3ff 0%, #fafafa 40%, #fff 100%);
  color: #0f172a;
}

.picads-top {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #312e81;
  text-decoration: none;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 15px;
}

.nav {
  display: flex;
  gap: 6px;
  flex: 1;
}

.nav a {
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
}

.nav a.on {
  background: #eef2ff;
  color: #4338ca;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-chip {
  font-size: 13px;
  color: #64748b;
}

.btn-ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
}

.picads-main {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.picads-main--auth {
  max-width: 480px;
  display: flex;
  align-items: center;
  min-height: calc(100dvh - 0px);
}
</style>
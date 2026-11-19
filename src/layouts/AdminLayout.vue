<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <RouterLink to="/" class="brand">
        <strong>Dyna<span>Geo</span></strong>
        <em>{{ t('admin.badge') }}</em>
      </RouterLink>
      <nav :aria-label="t('admin.navAria')">
        <RouterLink to="/admin/users" :class="{ on: route.path.startsWith('/admin/users') }">
          {{ t('admin.navUsers') }}
        </RouterLink>
        <RouterLink to="/admin/orders" :class="{ on: route.path.startsWith('/admin/orders') }">
          {{ t('admin.navOrders') }}
        </RouterLink>
        <RouterLink to="/admin/packages" :class="{ on: route.path.startsWith('/admin/packages') }">
          {{ t('admin.navPackages') }}
        </RouterLink>
      </nav>
      <div class="side-foot">
        <RouterLink to="/profile">{{ t('admin.backProfile') }}</RouterLink>
        <button type="button" @click="logout">{{ t('admin.logout') }}</button>
      </div>
    </aside>
    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  background: #f4f5f7;
  font-size: 13px;
  font-weight: 450;
}
.admin-shell,
.admin-shell * {
  font-weight: 450;
}
.admin-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 16px;
  background: #111827;
  color: #f8fafc;
}
.brand {
  display: grid;
  gap: 4px;
  color: inherit;
  text-decoration: none;
}
.brand strong {
  font-size: 20px;
  letter-spacing: -0.03em;
}
.brand span { color: var(--accent, #f5c518); }
.brand em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
}
nav {
  display: grid;
  gap: 6px;
}
nav a {
  padding: 10px 12px;
  border-radius: 10px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 13px;
}
nav a.on,
nav a:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.side-foot {
  margin-top: auto;
  display: grid;
  gap: 8px;
}
.side-foot a,
.side-foot button {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #e2e8f0;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.admin-main {
  min-width: 0;
  padding: 28px 24px 48px;
}
@media (max-width: 900px) {
  .admin-shell { grid-template-columns: 1fr; }
  .admin-side { padding-bottom: 12px; }
  nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .admin-main { padding: 20px 14px 40px; }
}

@media (max-width: 480px) {
  nav { grid-template-columns: 1fr; }
}
</style>

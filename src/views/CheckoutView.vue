<template>
  <Teleport to="body">
    <div class="checkout-overlay" @click.self="close">
      <div class="checkout-modal" role="dialog" aria-modal="true" :aria-label="pageTitle">
        <div class="modal-aura" aria-hidden="true">
          <span class="orb orb-a"></span>
          <span class="orb orb-b"></span>
        </div>

        <button type="button" class="modal-close" :aria-label="t('checkout.close')" @click="close">
          <span aria-hidden="true">×</span>
        </button>

        <header class="modal-head">
          <div class="head-badge">
            <span class="badge-dot" aria-hidden="true"></span>
            {{ t('checkout.eyebrow') }}
          </div>
          <h1>{{ pageTitle }}</h1>
          <p v-if="order" class="lede">{{ pageLede }}</p>
        </header>

        <p v-if="error" class="alert-box" role="alert">{{ error }}</p>

        <div v-else-if="!order" class="state-box">
          <div class="spinner" aria-hidden="true"></div>
          <p>{{ t('checkout.loading') }}</p>
        </div>

        <div v-else class="modal-body">
          <div class="amount-card">
            <div class="amount-meta">
              <span class="kicker">{{ t('checkout.payKicker') }}</span>
              <span class="status" :class="order.status">
                <span class="status-dot" aria-hidden="true"></span>
                {{ STATUS_LABEL[order.status] || order.status }}
              </span>
            </div>
            <p class="amount">{{ formatVnd(order.amountVnd) }}</p>
            <p class="amount-sub">
              {{ order.billingPeriod === 'year' ? t('checkout.periodYear') : t('checkout.periodMonth') }}
              · {{ order.credits }} {{ t('common.credits') }}
            </p>
          </div>

          <template v-if="order.status === 'pending' && payment">
            <div class="pay-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                :class="{ on: payTab === 'bank' }"
                :aria-selected="payTab === 'bank'"
                @click="payTab = 'bank'"
              >
                {{ t('checkout.tabBank') }}
              </button>
              <button
                type="button"
                role="tab"
                :class="{ on: payTab === 'paypal' }"
                :aria-selected="payTab === 'paypal'"
                @click="switchPaypal"
              >
                {{ t('checkout.tabPaypal') }}
              </button>
            </div>

            <Transition name="panel" mode="out-in">
              <div v-if="payTab === 'bank'" key="bank" class="pay-bank">
                <div class="qr-col">
                  <div class="qr-frame">
                    <div class="qr-shine" aria-hidden="true"></div>
                    <div class="qr-wrap">
                      <img :src="payment.qrUrl" :alt="t('checkout.qrAlt')" width="220" height="220" />
                      <span class="scan-line" aria-hidden="true"></span>
                    </div>
                  </div>
                  <p class="checking">
                    <span class="pulse" aria-hidden="true"></span>
                    {{ t('checkout.checking') }}
                  </p>
                </div>

                <dl class="bank-facts">
                  <div class="bank-row" style="--i: 0">
                    <dt>{{ t('checkout.bankHolder') }}</dt>
                    <dd>{{ payment.bank.holder }}</dd>
                  </div>
                  <div class="bank-row" style="--i: 1">
                    <dt>{{ t('checkout.bankName') }}</dt>
                    <dd>{{ payment.bank.name }}</dd>
                  </div>
                  <div class="bank-row" style="--i: 2">
                    <dt>{{ t('checkout.bankAccount') }}</dt>
                    <dd class="mono">{{ payment.bank.accountNo }}</dd>
                  </div>
                  <div
                    class="bank-row copyable"
                    :class="{ copied }"
                    style="--i: 3"
                    @click="copyMemo"
                  >
                    <dt>
                      {{ t('checkout.bankMemo') }}
                      <small>{{ t('checkout.bankMemoHint') }}</small>
                    </dt>
                    <dd class="mono memo">
                      {{ payment.memo }}
                      <span class="copy-hint">{{ copied ? t('checkout.copied') : t('checkout.copy') }}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div v-else key="paypal" class="pay-paypal">
                <p class="paypal-sub">{{ t('checkout.paypalSub') }}</p>
                <p class="paypal-memo">
                  {{ t('checkout.paypalMemoLabel') }}
                  <button type="button" class="memo-chip" @click="copyMemo">{{ payment.memo }}</button>
                </p>
                <div :id="paypalMountId" class="paypal-mount"></div>
                <p class="paypal-note">{{ t('checkout.paypalNote') }}</p>
              </div>
            </Transition>
          </template>

          <div v-else-if="order.status === 'paid'" class="paid-box">
            <div class="paid-icon" aria-hidden="true">✓</div>
            <p>
              {{ t('checkout.notePaidBefore') }}
              <strong>{{ t('checkout.notePaidStrong', { n: auth.credits }) }}</strong>
              {{ t('checkout.notePaidAfter') }}
            </p>
            <RouterLink class="btn-solid" to="/" @click="close">{{ t('checkout.payCreate') }}</RouterLink>
          </div>

          <div class="modal-foot">
            <button type="button" class="btn-line" @click="close">{{ t('checkout.close') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import { apiMessage } from '@/api/messages'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'
import { formatVnd, STATUS_LABEL } from '@/utils/format'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const order = ref(null)
const error = ref('')
const payTab = ref('bank')
const copied = ref(false)
const paypalMountId = 'paypal-container-clipstory'
let pollTimer = null
let copyTimer = null

const payment = computed(() => order.value?.payment || null)

const pageTitle = computed(() => {
  void locale.value
  if (!order.value) return t('checkout.titleDefault')
  if (order.value.status === 'pending') return t('checkout.titlePending')
  return t('checkout.titlePaid')
})

const pageLede = computed(() => {
  void locale.value
  if (!order.value) return t('checkout.ledeLoading')
  const name = order.value.packageName || 'credits'
  if (order.value.status === 'pending') {
    return t('checkout.ledePending', { name, code: order.value.code })
  }
  return t('checkout.ledePaid', { name })
})

const orderKey = computed(() => String(route.params.uuid || route.params.id || ''))

function close() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'pricing' })
}

async function load() {
  if (!orderKey.value) {
    error.value = t('checkout.errNotFound')
    return
  }
  try {
    const next = await api.orders.get(orderKey.value)
    order.value = next
    if (next.status === 'paid') {
      stopPoll()
      try {
        const me = await api.auth.me()
        auth.setCredits(me.credits)
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    error.value = apiMessage(err, 'checkout.errNotFound')
  }
}

function startPoll() {
  stopPoll()
  pollTimer = window.setInterval(() => {
    if (order.value?.status === 'pending') load()
  }, 4000)
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function copyMemo() {
  const memo = payment.value?.memo
  if (!memo) return
  try {
    await navigator.clipboard.writeText(memo)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1600)
  } catch {
    /* ignore */
  }
}

function loadPaypalSdk() {
  return new Promise((resolve, reject) => {
    if (window.paypal?.HostedButtons) {
      resolve()
      return
    }
    const existing = document.getElementById('paypal-js-sdk')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const clientId = payment.value?.paypal?.clientId
      || import.meta.env.VITE_PAYPAL_CLIENT_ID
      || 'BAAv7ozS9RMgfxawdBD2sWfeMYwgaEEay2ZgeeyEJxklZYbdUBeDc1xrcFukmuG1qJta1GlKyqtF13aR_o'
    const s = document.createElement('script')
    s.id = 'paypal-js-sdk'
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=hosted-buttons&disable-funding=venmo&currency=USD`
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function renderPaypal() {
  const buttonId = payment.value?.paypal?.buttonId || import.meta.env.VITE_PAYPAL_HOSTED_BUTTON_ID || 'UADKGNV4WVQYQ'
  await loadPaypalSdk()
  await nextTick()
  const el = document.getElementById(paypalMountId)
  if (!el || !window.paypal?.HostedButtons) return
  el.innerHTML = ''
  window.paypal.HostedButtons({ hostedButtonId: buttonId }).render(`#${paypalMountId}`)
  autoFillPaypalMemo()
}

function autoFillPaypalMemo() {
  const memo = payment.value?.memo
  if (!memo) return
  let tries = 0
  const iv = setInterval(() => {
    tries += 1
    const field = document.querySelector(`#${paypalMountId} textarea[id="memo"], #${paypalMountId} textarea[name="memo"]`)
    if (field) {
      clearInterval(iv)
      field.value = memo
      field.dispatchEvent(new Event('input', { bubbles: true }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    if (tries > 40) clearInterval(iv)
  }, 250)
}

async function switchPaypal() {
  payTab.value = 'paypal'
  try {
    await renderPaypal()
  } catch (err) {
    console.warn('PayPal render failed', err)
  }
}

watch(payTab, (tab) => {
  if (tab === 'paypal') nextTick(() => renderPaypal())
})

watch(orderKey, () => {
  load().then(() => {
    if (order.value?.status === 'pending') startPoll()
  })
})

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  await load()
  if (order.value?.status === 'pending') startPoll()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  stopPoll()
  clearTimeout(copyTimer)
})
</script>

<style scoped>
.checkout-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 87, 15, 0.18), transparent 55%),
    rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  animation: fadeIn 0.28s ease;
}

.checkout-modal {
  position: relative;
  isolation: isolate;
  width: min(760px, 100%);
  max-height: min(92vh, 920px);
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, #fff 40%),
    #fff;
  border-radius: 28px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.5) inset,
    0 32px 80px -24px rgba(15, 23, 42, 0.45),
    0 12px 28px rgba(255, 87, 15, 0.08);
  padding: 26px 26px 22px;
  animation: modalIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-aura {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
  animation: orbFloat 8s ease-in-out infinite alternate;
}

.orb-a {
  width: 220px;
  height: 220px;
  top: -80px;
  left: -60px;
  background: rgba(255, 87, 15, 0.22);
}

.orb-b {
  width: 180px;
  height: 180px;
  right: -40px;
  top: 40%;
  background: rgba(251, 189, 118, 0.28);
  animation-delay: -3s;
}

.modal-close,
.modal-head,
.modal-body,
.alert-box,
.state-box {
  position: relative;
  z-index: 1;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgba(241, 245, 249, 0.9);
  color: #475569;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
  background: #0f172a;
  color: #fff;
  transform: rotate(90deg) scale(1.05);
}

.modal-head {
  padding-right: 42px;
  margin-bottom: 18px;
  animation: fadeUp 0.5s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 87, 15, 0.08);
  border: 1px solid rgba(255, 87, 15, 0.16);
  font-size: 10px;
  font-weight: 450;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 rgba(255, 87, 15, 0.45);
  animation: badgePulse 2s ease-out infinite;
}

.modal-head h1 {
  margin: 0;
  font-size: clamp(17px, 2.6vw, 19px);
  font-weight: 450;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.2;
}

.lede {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.alert-box {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 12px;
}

.state-box {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 40px 12px;
  color: #64748b;
  font-size: 12px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.modal-body {
  display: grid;
  gap: 16px;
  animation: fadeUp 0.5s 0.14s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.amount-card {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 87, 15, 0.08) 0%, rgba(255, 247, 237, 0.9) 45%, #fff 100%);
  border: 1px solid rgba(255, 87, 15, 0.14);
}

.amount-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--accent), #fbbd76);
}

.amount-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-left: 12px;
}

.kicker {
  font-size: 10px;
  font-weight: 450;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.amount {
  margin: 6px 0 0;
  padding-left: 12px;
  font-size: clamp(26px, 4.5vw, 32px);
  font-weight: 450;
  letter-spacing: -0.04em;
  color: #0f172a;
  line-height: 1;
  animation: amountPop 0.55s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.amount-sub {
  margin: 8px 0 0;
  padding-left: 12px;
  font-size: 12px;
  color: #64748b;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 450;
  background: #f1f5f9;
  color: #64748b;
}

.status.pending {
  background: #fff7ed;
  color: #c2410c;
}

.status.paid {
  background: #dbeafe;
  color: #1e40af;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status.pending .status-dot {
  animation: pulseDot 1.2s ease-in-out infinite;
}

.pay-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border-radius: 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.pay-tabs button {
  border: 0;
  background: transparent;
  border-radius: 11px;
  min-height: 36px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 450;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.pay-tabs button:hover {
  color: #0f172a;
}

.pay-tabs button.on {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.pay-bank {
  display: grid;
  grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
  gap: 20px 24px;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(160deg, #f8fafc 0%, #fff 55%);
  border: 1px solid #e2e8f0;
}

.qr-col {
  display: grid;
  gap: 12px;
  justify-items: center;
}

.qr-frame {
  position: relative;
  width: 100%;
  max-width: 236px;
}

.qr-shine {
  position: absolute;
  inset: -2px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 87, 15, 0.35), transparent 40%, rgba(251, 189, 118, 0.3));
  opacity: 0.55;
  filter: blur(10px);
  animation: glowBreath 3.2s ease-in-out infinite;
}

.qr-wrap {
  position: relative;
  overflow: hidden;
  padding: 12px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(255, 87, 15, 0.18);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.qr-wrap img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
}

.scan-line {
  position: absolute;
  left: 14px;
  right: 14px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 12px rgba(255, 87, 15, 0.55);
  animation: scanMove 2.4s ease-in-out infinite;
  pointer-events: none;
}

.checking {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 87, 15, 0.08);
  font-size: 11px;
  font-weight: 450;
  color: var(--accent-deep);
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulseDot 1.2s ease-in-out infinite;
}

.bank-facts {
  margin: 0;
  display: grid;
  gap: 9px;
  min-width: 0;
  align-content: start;
}

.bank-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  padding: 9px 11px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  animation: rowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.08s + var(--i, 0) * 0.06s);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.bank-row:hover {
  border-color: #cbd5e1;
  transform: translateX(2px);
}

.bank-row dt {
  font-size: 9.5px;
  font-weight: 450;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.bank-row dt small {
  display: block;
  margin-top: 2px;
  font-size: 9px;
  font-weight: 450;
  text-transform: none;
  letter-spacing: 0;
  color: #64748b;
}

.bank-row dd {
  margin: 0;
  text-align: right;
  font-size: 12px;
  font-weight: 450;
  color: #0f172a;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
}

.bank-row.copyable {
  cursor: pointer;
  border-color: rgba(255, 87, 15, 0.22);
  background: linear-gradient(135deg, #fff7ed, #fff);
}

.bank-row.copyable:hover {
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgba(255, 87, 15, 0.12);
}

.bank-row.copyable.copied {
  animation: copyFlash 0.45s ease;
}

.bank-row .memo {
  display: grid;
  gap: 4px;
  justify-items: end;
}

.copy-hint {
  font-size: 10px;
  font-weight: 450;
  color: var(--accent);
}

.pay-paypal {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.paypal-sub,
.paypal-note,
.note {
  margin: 0;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.5;
}

.paypal-memo {
  margin: 0;
  font-size: 11.5px;
  color: #334155;
}

.memo-chip {
  display: inline-flex;
  margin-left: 6px;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 87, 15, 0.25);
  background: #fff7ed;
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 450;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.memo-chip:hover {
  transform: scale(1.04);
  background: #ffedd5;
}

.paypal-mount {
  min-height: 48px;
}

.paid-box {
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
  padding: 16px 12px;
  color: #475569;
  font-size: 12.5px;
}

.paid-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #dbeafe;
  color: #1e40af;
  font-size: 24px;
  font-weight: 450;
  animation: amountPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-solid,
.btn-line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  font-size: 12.5px;
  font-weight: 450;
  text-decoration: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.btn-solid {
  background: linear-gradient(135deg, var(--accent), #ea5404);
  color: #fff;
  border: 1px solid transparent;
  box-shadow: 0 10px 24px -8px rgba(255, 87, 15, 0.45);
}

.btn-solid:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px -8px rgba(255, 87, 15, 0.55);
}

.btn-line {
  width: 100%;
  background: #fff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

.btn-line:hover {
  border-color: #0f172a;
  transform: translateY(-1px);
}

.modal-foot {
  display: grid;
  gap: 10px;
  margin-top: 2px;
}

.txn-id {
  margin: 0;
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
  word-break: break-all;
  opacity: 0.85;
}

/* Transitions */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes amountPop {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scanMove {
  0% { top: 18%; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { top: 82%; opacity: 0; }
}

@keyframes glowBreath {
  0%, 100% { opacity: 0.35; transform: scale(0.98); }
  50% { opacity: 0.7; transform: scale(1.03); }
}

@keyframes orbFloat {
  from { transform: translate(0, 0); }
  to { transform: translate(18px, 12px); }
}

@keyframes badgePulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 87, 15, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(255, 87, 15, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 87, 15, 0); }
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes copyFlash {
  0% { transform: scale(1); }
  40% { transform: scale(1.02); border-color: var(--accent); }
  100% { transform: scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .pay-bank {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .bank-facts {
    width: 100%;
  }

  .amount-meta {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .checkout-overlay {
    padding: 0;
    align-items: end;
  }

  .checkout-modal {
    width: 100%;
    max-height: 94vh;
    border-radius: 24px 24px 0 0;
    padding: 18px 16px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .checkout-overlay,
  .checkout-modal,
  .modal-head,
  .modal-body,
  .amount,
  .bank-row,
  .orb,
  .scan-line,
  .qr-shine,
  .badge-dot,
  .pulse,
  .status-dot {
    animation: none !important;
  }
}
</style>

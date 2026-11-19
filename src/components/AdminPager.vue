<template>
  <div v-if="meta && meta.pages > 1" class="pager">
    <p class="meta">
      {{ t('admin.pageOf', { page: meta.page, pages: meta.pages, total: meta.total }) }}
    </p>
    <div class="actions">
      <button
        type="button"
        :disabled="!meta.hasPrev || loading"
        :aria-label="t('admin.prev')"
        @click="go(meta.page - 1)"
      >
        {{ t('admin.prev') }}
      </button>

      <div class="pages">
        <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
          <span v-if="item === '…'" class="ellipsis" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="num"
            :class="{ active: item === meta.page }"
            :disabled="loading"
            :aria-current="item === meta.page ? 'page' : undefined"
            @click="go(item)"
          >
            {{ item }}
          </button>
        </template>
      </div>

      <button
        type="button"
        :disabled="!meta.hasNext || loading"
        :aria-label="t('admin.next')"
        @click="go(meta.page + 1)"
      >
        {{ t('admin.next') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps({
  meta: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['change'])

const { t } = useI18n()

const pageItems = computed(() => {
  const total = Number(props.meta?.pages) || 1
  const current = Number(props.meta?.page) || 1
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
})

function go(next) {
  const total = Number(props.meta?.pages) || 1
  const current = Number(props.meta?.page) || 1
  const target = Math.min(total, Math.max(1, Number(next) || 1))
  if (target === current || props.loading) return
  emit('change', target)
}
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.meta {
  margin: 0;
  font-size: 13px;
  font-weight: 450;
  color: var(--muted);
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pages {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.actions button {
  min-height: 36px;
  min-width: 36px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  font-weight: 450;
  cursor: pointer;
}
.actions button.num.active {
  background: var(--accent);
  border-color: transparent;
  color: #1a1403;
}
.actions button:disabled {
  opacity: 0.45;
  cursor: default;
}
.ellipsis {
  min-width: 18px;
  text-align: center;
  color: var(--muted);
  font-weight: 450;
}
</style>

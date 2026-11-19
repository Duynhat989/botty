<template>
  <div class="tpl-block" :class="{ 'style-block': kind === 'chat_style' }">
    <div class="head-row">
      <p class="tpl-label">{{ title }}</p>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="emit('add')">
        + Thêm mẫu
      </button>
    </div>

    <p v-if="loading" class="b-caption">Đang tải mẫu…</p>

    <template v-else>
      <p v-if="global.length" class="scope-label">Mẫu chung</p>
      <div
        v-if="global.length"
        class="tpl-grid"
        :class="kind === 'chat_style' ? 'style-grid' : ''"
      >
        <BotPromptTemplateCard
          v-for="tpl in global"
          :key="tpl.id"
          :tpl="tpl"
          :kind="kind"
          :selected="isSelected(tpl)"
          @use="onUse(tpl)"
          @edit="emit('edit', tpl)"
          @remove="emit('remove', tpl)"
        />
      </div>

      <p v-if="mine.length" class="scope-label">Mẫu của bạn</p>
      <div
        v-if="mine.length"
        class="tpl-grid"
        :class="kind === 'chat_style' ? 'style-grid' : ''"
      >
        <BotPromptTemplateCard
          v-for="tpl in mine"
          :key="tpl.id"
          :tpl="tpl"
          :kind="kind"
          :selected="isSelected(tpl)"
          @use="onUse(tpl)"
          @edit="emit('edit', tpl)"
          @remove="emit('remove', tpl)"
        />
      </div>

      <p v-if="!global.length && !mine.length" class="b-caption">Chưa có mẫu.</p>
    </template>
  </div>
</template>

<script setup>
import BotPromptTemplateCard from './BotPromptTemplateCard.vue'

const props = defineProps({
  title: { type: String, required: true },
  kind: { type: String, required: true },
  global: { type: Array, default: () => [] },
  mine: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selectedKey: { type: String, default: '' },
})

const emit = defineEmits(['add', 'edit', 'remove', 'select', 'apply'])

function isSelected(tpl) {
  const key = props.selectedKey
  return key === tpl.id || (tpl.slug && key === tpl.slug)
}

function onUse(tpl) {
  if (props.kind === 'chat_style') emit('select', tpl)
  else emit('apply', tpl)
}
</script>

<style scoped>
.tpl-block {
  margin: 20px 0 22px;
  padding: 16px;
  border-radius: 14px;
  border: 1px dashed var(--b-border-strong);
  background: var(--b-surface-2);
}

.style-block {
  margin-top: 18px;
}

.tpl-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.scope-label {
  margin: 14px 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--b-muted);
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.style-grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
</style>
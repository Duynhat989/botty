<template>
  <div class="card-wrap">
    <button
      type="button"
      class="tpl-card"
      :class="[kind === 'chat_style' ? 'style-card' : '', { picked: selected }]"
      @click="emit('use')"
    >
      <span v-if="tpl.scope === 'global'" class="badge">Mọi người</span>
      <span class="tpl-name">{{ tpl.label }}</span>
      <span class="tpl-hint">{{ tpl.hint }}</span>
      <span v-if="kind === 'chat_style' && tpl.sample" class="style-sample">«{{ tpl.sample }}»</span>
    </button>
    <div v-if="tpl.canEdit" class="card-actions">
      <button type="button" class="link-btn" @click.stop="emit('edit')">Sửa</button>
      <button type="button" class="link-btn danger" @click.stop="emit('remove')">Xóa</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tpl: { type: Object, required: true },
  kind: { type: String, required: true },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['use', 'edit', 'remove'])
</script>

<style scoped>
.card-wrap {
  position: relative;
}

.tpl-card,
.style-card {
  width: 100%;
}

.badge {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--b-accent);
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  padding-left: 2px;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--b-accent);
  cursor: pointer;
}

.link-btn.danger {
  color: var(--b-danger);
}

.tpl-card,
.style-card {
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: #fff;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.tpl-card:hover,
.style-card:hover {
  border-color: #a7f3c0;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.08);
  transform: translateY(-1px);
}

.tpl-card.picked,
.style-card.picked {
  border-color: var(--b-accent);
  box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
}

.tpl-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--b-ink);
}

.tpl-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--b-muted);
  line-height: 1.4;
}

.style-sample {
  display: block;
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--b-muted);
  font-style: italic;
}
</style>
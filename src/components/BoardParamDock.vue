<template>
  <div v-if="params.length" class="param-dock" @pointerdown.stop>
    <label v-for="param in params" :key="param.id" class="param-row">
      <span class="param-label">{{ param.label || param.id }}</span>
      <input
        type="range"
        :value="values[param.id]"
        :min="param.min ?? -10"
        :max="param.max ?? 10"
        :step="param.step ?? 0.1"
        @input="onInput(param.id, $event)"
      />
      <em class="param-val">{{ format(param.id) }}</em>
    </label>
  </div>
</template>

<script setup>
const props = defineProps({
  params: { type: Array, default: () => [] },
  values: { type: Object, required: true },
  format: { type: Function, required: true },
})

const emit = defineEmits(['update:values'])

function onInput(id, e) {
  const n = Number(e.target.value)
  emit('update:values', { ...props.values, [id]: n })
}
</script>

<style scoped>
.param-dock {
  position: absolute;
  left: 14px;
  bottom: 72px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  max-width: min(280px, 42vw);
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(30, 34, 40, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}

.param-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  font-size: 12px;
  color: #cbd5e1;
}

.param-label {
  font-weight: 600;
  color: #e2e8f0;
}

.param-row input {
  width: 100%;
  accent-color: #60a5fa;
}

.param-val {
  font-style: normal;
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
  font-size: 11px;
}
</style>

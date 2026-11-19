<template>
  <svg
    class="writing-move-icon"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10 3v14M10 3l-2.2 2.4M10 3l2.2 2.4M10 17l-2.2-2.4M10 17l2.2-2.4"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M3 10h14M3 10l2.4-2.2M3 10l2.4 2.2M17 10l-2.4-2.2M17 10l-2.4 2.2"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 18 },
  strokeWidth: { type: Number, default: 1.65 },
})
</script>

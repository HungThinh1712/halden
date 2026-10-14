<script setup lang="ts">
const props = withDefaults(defineProps<{ value: number; min?: number; max?: number }>(), {
  min: 1,
  max: 8,
})
const emit = defineEmits<{ change: [value: number] }>()

function set(next: number) {
  const clamped = Math.min(props.max, Math.max(props.min, next))
  if (clamped !== props.value) emit('change', clamped)
}
</script>

<template>
  <div class="qty">
    <button type="button" aria-label="Decrease quantity" @click="set(value - 1)">−</button>
    <span>{{ value }}</span>
    <button type="button" aria-label="Increase quantity" @click="set(value + 1)">+</button>
  </div>
</template>

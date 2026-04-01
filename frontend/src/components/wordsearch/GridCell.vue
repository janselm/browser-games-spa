<script setup>
defineProps({
  letter:   { type: String,  required: true },
  found:    { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

defineEmits(['mousedown', 'mouseenter', 'mouseup'])
</script>

<template>
  <div
    class="flex items-center justify-center w-10 h-10 rounded font-display text-base font-bold
           select-none cursor-pointer transition-colors duration-75"
    :class="{
      'bg-green-600 text-white':                  found,
      'bg-brand-pop text-white':                  selected && !found,
      'bg-brand-accent text-brand-text hover:bg-brand-accent/70': !found && !selected,
    }"
    @mousedown.prevent="$emit('mousedown')"
    @mouseenter="$emit('mouseenter')"
    @mouseup="$emit('mouseup')"
  >
    {{ letter }}
  </div>
</template>

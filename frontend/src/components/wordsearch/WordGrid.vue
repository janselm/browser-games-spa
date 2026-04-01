<script setup>
import GridCell from './GridCell.vue'

const props = defineProps({
  grid:        { type: Array,  required: true },
  foundCells:  { type: Object, required: true }, // Set
  dragCells:   { type: Array,  required: true },
})

const emit = defineEmits(['mousedown', 'mouseenter', 'mouseup'])

function cellKey(row, col) { return `${row}-${col}` }
</script>

<template>
  <div
    class="inline-block select-none"
    @mouseleave="emit('mouseup')"
  >
    <div
      v-for="(row, ri) in grid"
      :key="ri"
      class="flex gap-0.5 mb-0.5"
    >
      <GridCell
        v-for="(letter, ci) in row"
        :key="ci"
        :letter="letter"
        :found="foundCells.has(cellKey(ri, ci))"
        :selected="dragCells.includes(cellKey(ri, ci))"
        @mousedown="emit('mousedown', ri, ci)"
        @mouseenter="emit('mouseenter', ri, ci)"
        @mouseup="emit('mouseup')"
      />
    </div>
  </div>
</template>

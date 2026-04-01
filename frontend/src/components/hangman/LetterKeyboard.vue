<script setup>
import { computed } from 'vue'

const props = defineProps({
  guessedLetters: { type: Object, required: true }, // Set
  wordLetters:    { type: Array,  required: true },
  disabled:       { type: Boolean, default: false },
})

const emit = defineEmits(['guess'])

const rows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

function letterClass(letter) {
  if (!props.guessedLetters.has(letter)) return 'bg-brand-accent text-brand-text hover:bg-brand-pop/70'
  if (props.wordLetters.includes(letter)) return 'bg-green-600 text-white cursor-default'
  return 'bg-brand-pop/40 text-brand-muted cursor-default line-through'
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div v-for="(row, ri) in rows" :key="ri" class="flex gap-1.5">
      <button
        v-for="letter in row"
        :key="letter"
        :disabled="disabled || guessedLetters.has(letter)"
        @click="emit('guess', letter)"
        class="w-9 h-10 rounded-lg font-display text-sm font-bold transition-colors duration-150
               disabled:cursor-default"
        :class="letterClass(letter)"
      >
        {{ letter }}
      </button>
    </div>
  </div>
</template>

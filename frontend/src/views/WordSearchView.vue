<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordSearch } from '../composables/useWordSearch.js'
import WordGrid      from '../components/wordsearch/WordGrid.vue'
import WordList      from '../components/wordsearch/WordList.vue'
import Modal         from '../components/common/Modal.vue'
import ReturnButton  from '../components/common/ReturnButton.vue'

const router = useRouter()
const {
  grid, placedWords, foundWords, foundCells,
  loading, error, isWon,
  dragCells, gridSize,
  loadPuzzle,
  onMouseDown, onMouseEnter, onMouseUp,
} = useWordSearch()

const SIZE_OPTIONS = [8, 10, 12, 15]

function selectSize(size) {
  gridSize.value = size
  loadPuzzle()
}

onMounted(loadPuzzle)
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6" @mouseup="onMouseUp">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 max-w-5xl mx-auto w-full">
      <ReturnButton />
      <h1 class="font-display text-4xl text-brand-pop">Word Search</h1>
      <div class="w-24" />
    </div>

    <!-- Size picker -->
    <div class="flex items-center justify-center gap-2 mb-6 max-w-5xl mx-auto w-full">
      <span class="text-brand-muted text-sm mr-1">Grid size:</span>
      <button
        v-for="size in SIZE_OPTIONS"
        :key="size"
        @click="selectSize(size)"
        :class="gridSize === size
          ? 'bg-brand-pop text-brand-text'
          : 'bg-brand-accent text-brand-muted hover:text-brand-text'"
        class="px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
      >
        {{ size }}×{{ size }}
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-brand-muted text-xl animate-pulse">Building puzzle…</p>
    </div>
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-brand-pop">{{ error }}</p>
      <button @click="loadPuzzle" class="px-4 py-2 bg-brand-pop rounded-lg font-semibold text-white">Retry</button>
    </div>

    <!-- Game -->
    <div
      v-else
      class="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full relative"
    >
      <!-- Grid — centered independently -->
      <div class="overflow-x-auto">
        <WordGrid
          :grid="grid"
          :found-cells="foundCells"
          :drag-cells="dragCells"
          @mousedown="onMouseDown"
          @mouseenter="onMouseEnter"
          @mouseup="onMouseUp"
        />
      </div>

      <!-- Word list — absolute right on lg+, stacked below on mobile -->
      <div class="w-full mt-6 lg:mt-0 lg:absolute lg:right-0 lg:top-0 lg:w-48">
        <WordList :words="placedWords" :found-words="foundWords" />
      </div>
    </div>

    <!-- Win Modal -->
    <Modal
      :show="isWon"
      title="Puzzle Complete!"
      message="You found all the words!"
      primary-label="New Puzzle"
      secondary-label="Exit"
      @primary="loadPuzzle"
      @secondary="router.push('/')"
    />
  </div>
</template>

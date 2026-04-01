<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHangman } from '../composables/useHangman.js'
import HangmanCanvas  from '../components/hangman/HangmanCanvas.vue'
import WordDisplay    from '../components/hangman/WordDisplay.vue'
import HintDisplay    from '../components/hangman/HintDisplay.vue'
import LetterKeyboard from '../components/hangman/LetterKeyboard.vue'
import Modal          from '../components/common/Modal.vue'
import ReturnButton   from '../components/common/ReturnButton.vue'

const router = useRouter()
const {
  currentWord, hint, difficulty,
  guessedLetters, loading, error,
  wordLetters, wrongCount, isWon, isLost,
  loadWord, guess,
} = useHangman()

const showHint = ref(true)

onMounted(loadWord)
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 max-w-4xl mx-auto w-full">
      <ReturnButton />
      <h1 class="font-display text-4xl text-brand-pop">Hangman</h1>
      <div class="flex items-center gap-2">
        <button
          @click="showHint = !showHint"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent
                 text-brand-text hover:bg-brand-pop transition-colors duration-200 font-semibold text-sm"
        >
          {{ showHint ? 'Hide Hint' : 'Show Hint' }}
        </button>
        <button
          @click="loadWord"
          :disabled="loading || isWon || isLost"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent
                 text-brand-text hover:bg-brand-pop transition-colors duration-200 font-semibold text-sm
                 disabled:opacity-40 disabled:pointer-events-none"
        >
          Skip →
        </button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-brand-muted text-xl animate-pulse">Loading word…</p>
    </div>
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-brand-pop">{{ error }}</p>
      <button @click="loadWord" class="px-4 py-2 bg-brand-pop rounded-lg font-semibold text-white">Retry</button>
    </div>

    <!-- Game -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto w-full">
      <!-- Wrong count indicator -->
      <p class="text-brand-muted text-sm">
        Wrong guesses:
        <span :class="wrongCount >= 5 ? 'text-brand-pop font-bold' : 'text-brand-text'">
          {{ wrongCount }} / 6
        </span>
      </p>

      <HangmanCanvas :wrong-count="wrongCount" />

      <HintDisplay v-if="showHint" :hint="hint" :difficulty="difficulty" />

      <WordDisplay
        :word-letters="wordLetters"
        :guessed-letters="guessedLetters"
        :is-lost="isLost"
      />

      <LetterKeyboard
        :guessed-letters="guessedLetters"
        :word-letters="wordLetters"
        :disabled="isWon || isLost"
        @guess="guess"
      />
    </div>

    <!-- Win Modal -->
    <Modal
      :show="!loading && isWon"
      title="You Won!"
      :message="`The word was: ${currentWord}`"
      primary-label="Play Again"
      secondary-label="Exit"
      @primary="loadWord"
      @secondary="router.push('/')"
    />

    <!-- Lose Modal -->
    <Modal
      :show="isLost"
      title="Game Over"
      :message="`The word was: ${currentWord}`"
      primary-label="Play Again"
      secondary-label="Exit"
      @primary="loadWord"
      @secondary="router.push('/')"
    />
  </div>
</template>

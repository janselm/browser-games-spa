/**
 * useHangman — composable for hangman game state.
 *
 * Fetches one word at a time from the backend (session-based rotation).
 * Exposes reactive state for the current word, guessed letters, and win/loss
 * conditions. The game is lost after 6 incorrect guesses.
 *
 * Computed properties:
 *   wordLetters    — array of uppercase characters in the current word
 *   correctLetters — Set of guessed letters that appear in the word
 *   wrongLetters   — array of guessed letters that do not appear in the word
 *   wrongCount     — number of incorrect guesses (loss triggers at 6)
 *   isWon          — true when every non-space letter has been guessed
 *   isLost         — true when wrongCount reaches 6
 */
import { ref, computed } from 'vue'
import { api } from '../services/api.js'
import { play } from '../services/AudioService.js'

export function useHangman() {
  const currentWord    = ref('')
  const hint           = ref('')
  const difficulty     = ref('')
  const guessedLetters = ref(new Set())
  const loading        = ref(true)
  const error          = ref(null)

  const wordLetters = computed(() => currentWord.value.toUpperCase().split(''))

  const correctLetters = computed(() =>
    new Set(wordLetters.value.filter(l => l !== ' ' && guessedLetters.value.has(l)))
  )

  const wrongLetters = computed(() =>
    [...guessedLetters.value].filter(l => !wordLetters.value.includes(l))
  )

  const wrongCount = computed(() => wrongLetters.value.length)

  const isWon = computed(() =>
    wordLetters.value
      .filter(l => l !== ' ')
      .every(l => guessedLetters.value.has(l))
  )

  const isLost = computed(() => wrongCount.value >= 6)

  async function loadWord() {
    loading.value = true
    error.value   = null
    guessedLetters.value = new Set()
    try {
      const data = await api.getHangmanWord()
      currentWord.value = data.word.toUpperCase()
      hint.value        = data.hint
      difficulty.value  = data.difficulty
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Records a letter guess. No-ops if the game is over or the letter was
   * already guessed. Sets are replaced rather than mutated to trigger Vue reactivity.
   */
  function guess(letter) {
    const l = letter.toUpperCase()
    if (isWon.value || isLost.value) return
    if (guessedLetters.value.has(l)) return
    guessedLetters.value = new Set([...guessedLetters.value, l])
    if (wordLetters.value.includes(l)) {
      play(isWon.value ? 'win' : 'success')
    } else {
      play(isLost.value ? 'lose' : 'incorrect')
    }
  }

  return {
    currentWord, hint, difficulty,
    guessedLetters, loading, error,
    wordLetters, correctLetters, wrongLetters,
    wrongCount, isWon, isLost,
    loadWord, guess,
  }
}

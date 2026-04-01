<script setup>
/**
 * AdminView — the main Word Manager admin panel.
 *
 * Three tabs:
 *   Hangman Words    — CRUD for hangman_words (word, hint, difficulty, active)
 *   Word Search Words — CRUD for word_search_words (word, category, active)
 *   Leaderboard       — view and delete typegame scores
 *
 * Includes a 10-minute inactivity timeout that automatically logs the admin out
 * by listening to mousemove, keydown, and click events to reset the timer.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ReturnButton      from '../components/common/ReturnButton.vue'
import WordTable         from '../components/admin/WordTable.vue'
import WordFormModal     from '../components/admin/WordFormModal.vue'
import BulkImportModal   from '../components/admin/BulkImportModal.vue'
import LeaderboardTable  from '../components/admin/LeaderboardTable.vue'
import { api } from '../services/api.js'

const router = useRouter()

async function handleLogout() {
  await api.logout()
  localStorage.removeItem('admin_auth')
  router.push('/admin/login')
}

const TIMEOUT_MS = 10 * 60 * 1000
let inactivityTimer = null

function resetTimer() {
  clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(handleLogout, TIMEOUT_MS)
}

// ── Tab ──────────────────────────────────────────────────────────────────────
const activeTab = ref('hangman') // 'hangman' | 'wordsearch' | 'leaderboard'

// ── Hangman state ─────────────────────────────────────────────────────────────
const hangmanWords   = ref([])
const hangmanLoading = ref(false)
const hangmanError   = ref('')

const hangmanColumns = [
  { key: 'id',         label: 'ID' },
  { key: 'word',       label: 'Word' },
  { key: 'hint',       label: 'Hint' },
  { key: 'difficulty', label: 'Difficulty' },
]

async function loadHangman() {
  hangmanLoading.value = true
  hangmanError.value   = ''
  try {
    hangmanWords.value = await api.listHangmanWords()
  } catch (e) {
    hangmanError.value = e.message
  } finally {
    hangmanLoading.value = false
  }
}

// ── Word Search state ─────────────────────────────────────────────────────────
const wsWords   = ref([])
const wsLoading = ref(false)
const wsError   = ref('')

const wsColumns = [
  { key: 'id',       label: 'ID' },
  { key: 'word',     label: 'Word' },
  { key: 'category', label: 'Category' },
]

async function loadWordsearch() {
  wsLoading.value = true
  wsError.value   = ''
  try {
    wsWords.value = await api.listWordsearchWords()
  } catch (e) {
    wsError.value = e.message
  } finally {
    wsLoading.value = false
  }
}

// ── Leaderboard state ─────────────────────────────────────────────────────────
const lbEntries = ref([])
const lbLoading = ref(false)
const lbError   = ref('')

async function loadLeaderboard() {
  lbLoading.value = true
  lbError.value   = ''
  try {
    lbEntries.value = await api.listLeaderboard()
  } catch (e) {
    lbError.value = e.message
  } finally {
    lbLoading.value = false
  }
}

async function handleDeleteLeaderboard(id) {
  if (!confirm('Delete this score?')) return
  try {
    await api.deleteLeaderboardEntry(id)
    lbEntries.value = lbEntries.value.filter(e => e.id !== id)
  } catch (e) {
    alert(`Delete failed: ${e.message}`)
  }
}

async function handleBulkDeleteLeaderboard(ids) {
  if (!confirm(`Delete ${ids.length} scores? This cannot be undone.`)) return
  try {
    await api.bulkDeleteLeaderboardEntries(ids)
    lbEntries.value = lbEntries.value.filter(e => !ids.includes(e.id))
  } catch (e) {
    alert(`Bulk delete failed: ${e.message}`)
  }
}

// ── Single-word modal ─────────────────────────────────────────────────────────
const modalShow = ref(false)
const modalMode = ref('hangman')
const modalWord = ref(null)  // null = add, object = edit

function openAdd(mode) {
  modalMode.value = mode
  modalWord.value = null
  modalShow.value = true
}

function openEdit(word, mode) {
  modalMode.value = mode
  modalWord.value = word
  modalShow.value = true
}

function closeModal() {
  modalShow.value = false
}

async function handleSave(formData) {
  try {
    if (modalMode.value === 'hangman') {
      if (modalWord.value) {
        const updated = await api.updateHangmanWord(formData.id, formData)
        const idx = hangmanWords.value.findIndex(w => w.id === updated.id)
        if (idx !== -1) hangmanWords.value[idx] = updated
      } else {
        const created = await api.createHangmanWord(formData)
        hangmanWords.value.push(created)
      }
    } else {
      if (modalWord.value) {
        const updated = await api.updateWordsearchWord(formData.id, formData)
        const idx = wsWords.value.findIndex(w => w.id === updated.id)
        if (idx !== -1) wsWords.value[idx] = updated
      } else {
        const created = await api.createWordsearchWord(formData)
        wsWords.value.push(created)
      }
    }
    closeModal()
  } catch (e) {
    alert(`Save failed: ${e.message}`)
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function handleDeleteHangman(id) {
  if (!confirm('Delete this word?')) return
  try {
    await api.deleteHangmanWord(id)
    hangmanWords.value = hangmanWords.value.filter(w => w.id !== id)
  } catch (e) {
    alert(`Delete failed: ${e.message}`)
  }
}

async function handleDeleteWordsearch(id) {
  if (!confirm('Delete this word?')) return
  try {
    await api.deleteWordsearchWord(id)
    wsWords.value = wsWords.value.filter(w => w.id !== id)
  } catch (e) {
    alert(`Delete failed: ${e.message}`)
  }
}

// ── Toggle active ─────────────────────────────────────────────────────────────
async function handleToggleHangman(id, currentActive) {
  try {
    const updated = await api.updateHangmanWord(id, { active: !currentActive })
    const idx = hangmanWords.value.findIndex(w => w.id === updated.id)
    if (idx !== -1) hangmanWords.value[idx] = updated
  } catch (e) {
    alert(`Update failed: ${e.message}`)
  }
}

async function handleToggleWordsearch(id, currentActive) {
  try {
    const updated = await api.updateWordsearchWord(id, { active: !currentActive })
    const idx = wsWords.value.findIndex(w => w.id === updated.id)
    if (idx !== -1) wsWords.value[idx] = updated
  } catch (e) {
    alert(`Update failed: ${e.message}`)
  }
}

// ── Bulk import modal ─────────────────────────────────────────────────────────
const bulkShow = ref(false)
const bulkMode = ref('hangman')

function openBulkImport(mode) {
  bulkMode.value = mode
  bulkShow.value = true
}

async function handleBulkSave(items) {
  try {
    if (bulkMode.value === 'hangman') {
      const created = await api.bulkCreateHangmanWords(items)
      hangmanWords.value.push(...created)
    } else {
      const created = await api.bulkCreateWordsearchWords(items)
      wsWords.value.push(...created)
    }
    bulkShow.value = false
  } catch (e) {
    alert(`Bulk import failed: ${e.message}`)
  }
}

// ── Bulk delete ───────────────────────────────────────────────────────────────
async function handleBulkDeleteHangman(ids) {
  if (!confirm(`Delete ${ids.length} selected words? This cannot be undone.`)) return
  try {
    await api.bulkDeleteHangmanWords(ids)
    hangmanWords.value = hangmanWords.value.filter(w => !ids.includes(w.id))
  } catch (e) {
    alert(`Bulk delete failed: ${e.message}`)
  }
}

async function handleBulkDeleteWordsearch(ids) {
  if (!confirm(`Delete ${ids.length} selected words? This cannot be undone.`)) return
  try {
    await api.bulkDeleteWordsearchWords(ids)
    wsWords.value = wsWords.value.filter(w => !ids.includes(w.id))
  } catch (e) {
    alert(`Bulk delete failed: ${e.message}`)
  }
}

// ── Load on mount ─────────────────────────────────────────────────────────────
onMounted(() => {
  loadHangman()
  loadWordsearch()
  loadLeaderboard()
  resetTimer()
  document.addEventListener('mousemove', resetTimer)
  document.addEventListener('keydown', resetTimer)
  document.addEventListener('click', resetTimer)
})

onUnmounted(() => {
  clearTimeout(inactivityTimer)
  document.removeEventListener('mousemove', resetTimer)
  document.removeEventListener('keydown', resetTimer)
  document.removeEventListener('click', resetTimer)
})
</script>

<template>
  <div class="min-h-screen px-4 py-10 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <ReturnButton />
      <h1 class="font-display text-4xl text-brand-pop flex-1">Word Manager</h1>
      <button
        @click="handleLogout"
        class="px-4 py-2 bg-brand-surface text-brand-muted rounded-lg text-sm font-semibold
               hover:text-brand-text transition-colors border border-brand-accent"
      >
        Logout
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        @click="activeTab = 'hangman'"
        :class="activeTab === 'hangman'
          ? 'bg-brand-pop text-white'
          : 'bg-brand-surface text-brand-muted hover:text-brand-text'"
        class="px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
      >
        Hangman Words
      </button>
      <button
        @click="activeTab = 'wordsearch'"
        :class="activeTab === 'wordsearch'
          ? 'bg-brand-pop text-white'
          : 'bg-brand-surface text-brand-muted hover:text-brand-text'"
        class="px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
      >
        Word Search Words
      </button>
      <button
        @click="activeTab = 'leaderboard'"
        :class="activeTab === 'leaderboard'
          ? 'bg-brand-pop text-white'
          : 'bg-brand-surface text-brand-muted hover:text-brand-text'"
        class="px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
      >
        Leaderboard
      </button>
    </div>

    <!-- ── Hangman Tab ── -->
    <div v-if="activeTab === 'hangman'">
      <div class="flex justify-between items-center mb-4">
        <p class="text-brand-muted text-sm">{{ hangmanWords.length }} words</p>
        <div class="flex gap-2">
          <button
            @click="openBulkImport('hangman')"
            class="px-4 py-2 bg-brand-surface text-brand-text rounded-lg text-sm font-semibold
                   hover:bg-brand-accent transition-colors border border-brand-accent"
          >
            Bulk Import
          </button>
          <button
            @click="openAdd('hangman')"
            class="px-4 py-2 bg-brand-pop text-white rounded-lg text-sm font-semibold
                   hover:opacity-90 transition-opacity"
          >
            + Add Word
          </button>
        </div>
      </div>

      <p v-if="hangmanError" class="text-brand-pop mb-4 text-sm">{{ hangmanError }}</p>
      <p v-if="hangmanLoading" class="text-brand-muted text-sm">Loading…</p>

      <WordTable
        v-else
        :words="hangmanWords"
        :columns="hangmanColumns"
        :selectable="true"
        @edit="word => openEdit(word, 'hangman')"
        @delete="handleDeleteHangman"
        @toggle="handleToggleHangman"
        @bulk-delete="handleBulkDeleteHangman"
      />
    </div>

    <!-- ── Word Search Tab ── -->
    <div v-if="activeTab === 'wordsearch'">
      <div class="flex justify-between items-center mb-4">
        <p class="text-brand-muted text-sm">{{ wsWords.length }} words</p>
        <div class="flex gap-2">
          <button
            @click="openBulkImport('wordsearch')"
            class="px-4 py-2 bg-brand-surface text-brand-text rounded-lg text-sm font-semibold
                   hover:bg-brand-accent transition-colors border border-brand-accent"
          >
            Bulk Import
          </button>
          <button
            @click="openAdd('wordsearch')"
            class="px-4 py-2 bg-brand-pop text-white rounded-lg text-sm font-semibold
                   hover:opacity-90 transition-opacity"
          >
            + Add Word
          </button>
        </div>
      </div>

      <p v-if="wsError" class="text-brand-pop mb-4 text-sm">{{ wsError }}</p>
      <p v-if="wsLoading" class="text-brand-muted text-sm">Loading…</p>

      <WordTable
        v-else
        :words="wsWords"
        :columns="wsColumns"
        :selectable="true"
        @edit="word => openEdit(word, 'wordsearch')"
        @delete="handleDeleteWordsearch"
        @toggle="handleToggleWordsearch"
        @bulk-delete="handleBulkDeleteWordsearch"
      />
    </div>

    <!-- ── Leaderboard Tab ── -->
    <div v-if="activeTab === 'leaderboard'">
      <div class="flex justify-between items-center mb-4">
        <p class="text-brand-muted text-sm">{{ lbEntries.length }} entries</p>
      </div>

      <p v-if="lbError" class="text-brand-pop mb-4 text-sm">{{ lbError }}</p>
      <p v-if="lbLoading" class="text-brand-muted text-sm">Loading…</p>

      <LeaderboardTable
        v-else
        :entries="lbEntries"
        @delete="handleDeleteLeaderboard"
        @bulk-delete="handleBulkDeleteLeaderboard"
      />
    </div>

    <!-- Shared Add/Edit Modal -->
    <WordFormModal
      :show="modalShow"
      :mode="modalMode"
      :word="modalWord"
      @save="handleSave"
      @close="closeModal"
    />

    <!-- Bulk Import Modal -->
    <BulkImportModal
      :show="bulkShow"
      :mode="bulkMode"
      @bulk-save="handleBulkSave"
      @close="bulkShow = false"
    />
  </div>
</template>

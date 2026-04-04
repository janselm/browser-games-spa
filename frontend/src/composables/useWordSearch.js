/**
 * useWordSearch — composable for the word search puzzle.
 *
 * Builds a 15×15 grid from words fetched from the backend, then handles
 * mouse-drag selection to find placed words.
 *
 * Grid building (buildGrid):
 *   - For each word, up to 100 random placements are attempted across 8
 *     directions. A placement is rejected if it goes out of bounds or conflicts
 *     with an existing letter. Remaining empty cells are filled with random letters.
 *
 * Drag selection:
 *   - onMouseDown starts a selection at the clicked cell.
 *   - onMouseEnter updates dragCells by computing the straight line from the
 *     start cell to the current cell (getCellsInLine).
 *   - onMouseUp checks whether the selected cell sequence matches any placed
 *     word's cell sequence (forward or reverse).
 *
 * getCellsInLine enforces straight-line-only selections: horizontal, vertical,
 * and 45° diagonal. Non-straight drags are snapped back to the start cell.
 */
import { ref, computed } from 'vue'
import { play } from '../services/AudioService.js'
import { api } from '../services/api.js'

/**
 * The 8 cardinal and diagonal directions used for word placement.
 * Each entry is [rowDelta, colDelta].
 */
const DIRECTIONS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
]
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function buildGrid(words, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(''))
  const placedWords = []

  for (const wordObj of words) {
    const word = wordObj.word.toUpperCase()
    let placed = false

    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)

      const endRow = row + dr * (word.length - 1)
      const endCol = col + dc * (word.length - 1)

      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue

      let canPlace = true
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i
        const c = col + dc * i
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
          canPlace = false
          break
        }
      }

      if (!canPlace) continue

      const cells = []
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i
        const c = col + dc * i
        grid[r][c] = word[i]
        cells.push(`${r}-${c}`)
      }
      placedWords.push({ ...wordObj, word, cells })
      placed = true
    }
  }

  // Fill blanks
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)]
      }
    }
  }

  return { grid, placedWords }
}

export function useWordSearch() {
  const words         = ref([])
  const grid          = ref([])
  const placedWords   = ref([])
  const foundWords    = ref(new Set())
  const foundCells    = ref(new Set())
  const loading       = ref(false)
  const error         = ref(null)
  const gridSize      = ref(15)

  // Drag selection state
  const isDragging    = ref(false)
  const dragStart     = ref(null)   // { row, col }
  const dragCells     = ref([])     // array of 'row-col' strings

  const isWon = computed(() =>
    placedWords.value.length > 0 &&
    placedWords.value.every(w => foundWords.value.has(w.word))
  )

  async function loadPuzzle() {
    loading.value = true
    error.value   = null
    foundWords.value  = new Set()
    foundCells.value  = new Set()
    dragCells.value   = []
    isDragging.value  = false
    dragStart.value   = null

    try {
      words.value = await api.getWordSearchWords()
      const result = buildGrid(words.value, gridSize.value)
      grid.value        = result.grid
      placedWords.value = result.placedWords
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function getCellsInLine(start, end) {
    const dr = end.row - start.row
    const dc = end.col - start.col

    if (dr === 0 && dc === 0) return [`${start.row}-${start.col}`]

    // Only allow straight lines (horizontal, vertical, diagonal)
    const absDr = Math.abs(dr)
    const absDc = Math.abs(dc)
    if (absDr !== 0 && absDc !== 0 && absDr !== absDc) {
      // Not a valid diagonal — snap to closest axis or diagonal
      return [`${start.row}-${start.col}`]
    }

    const steps = Math.max(absDr, absDc)
    const stepR = steps === 0 ? 0 : dr / steps
    const stepC = steps === 0 ? 0 : dc / steps
    const cells = []
    for (let i = 0; i <= steps; i++) {
      cells.push(`${start.row + Math.round(stepR * i)}-${start.col + Math.round(stepC * i)}`)
    }
    return cells
  }

  function onMouseDown(row, col) {
    isDragging.value = true
    dragStart.value  = { row, col }
    dragCells.value  = [`${row}-${col}`]
  }

  function onMouseEnter(row, col) {
    if (!isDragging.value || !dragStart.value) return
    dragCells.value = getCellsInLine(dragStart.value, { row, col })
  }

  function onMouseUp() {
    if (!isDragging.value) return
    isDragging.value = false

    const selected = dragCells.value
    if (selected.length < 2) {
      dragCells.value = []
      return
    }

    // Check forward and reverse against each placed word
    const selectedStr    = selected.join(',')
    const selectedStrRev = [...selected].reverse().join(',')

    for (const pw of placedWords.value) {
      if (foundWords.value.has(pw.word)) continue
      const wordStr = pw.cells.join(',')
      if (selectedStr === wordStr || selectedStrRev === wordStr) {
        foundWords.value = new Set([...foundWords.value, pw.word])
        foundCells.value = new Set([...foundCells.value, ...pw.cells])
        play(isWon.value ? 'win' : 'success')
        break
      }
    }

    dragCells.value = []
  }

  return {
    words, grid, placedWords,
    foundWords, foundCells,
    loading, error, isWon,
    isDragging, dragCells,
    gridSize,
    loadPuzzle,
    onMouseDown, onMouseEnter, onMouseUp,
  }
}

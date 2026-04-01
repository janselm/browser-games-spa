/**
 * Centralised API client for the Games SPA backend.
 *
 * All requests are sent to /api (proxied to the PHP backend in dev via Vite,
 * or served directly in production). Responses follow a success-envelope format:
 * { success: true, data: ... } or { success: false, error: '...' }.
 *
 * session cookies are sent automatically via credentials: 'include', which
 * maintains the PHP admin session across requests.
 */

const BASE = '/api'

/**
 * Makes a fetch request to the backend and unwraps the success envelope.
 * Throws an Error if the HTTP status is not OK or if success is false.
 *
 * @param {string} path    - Path relative to BASE (e.g. '/hangman/word')
 * @param {string} method  - HTTP method (default: 'GET')
 * @param {object|null} body - JSON request body (default: null)
 * @returns {Promise<any>} Resolves to response.data on success
 */
async function request(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
  if (body !== null) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API error')
  return json.data
}

export const api = {
  // Game
  getHangmanWord:     () => request('/hangman/word'),
  getWordSearchWords: () => request('/wordsearch/words'),

  // Admin — Hangman
  listHangmanWords:   ()        => request('/admin/hangman/words'),
  createHangmanWord:  (body)    => request('/admin/hangman/words', 'POST', body),
  updateHangmanWord:  (id, body) => request(`/admin/hangman/words/${id}`, 'PUT', body),
  deleteHangmanWord:  (id)      => request(`/admin/hangman/words/${id}`, 'DELETE'),

  // Admin — Word Search
  listWordsearchWords:        ()        => request('/admin/wordsearch/words'),
  createWordsearchWord:       (body)    => request('/admin/wordsearch/words', 'POST', body),
  updateWordsearchWord:       (id, body) => request(`/admin/wordsearch/words/${id}`, 'PUT', body),
  deleteWordsearchWord:       (id)      => request(`/admin/wordsearch/words/${id}`, 'DELETE'),
  bulkCreateWordsearchWords:  (words)   => request('/admin/wordsearch/words/bulk', 'POST', { words }),
  bulkDeleteWordsearchWords:  (ids)     => request('/admin/wordsearch/words/bulk', 'DELETE', { ids }),

  // Admin — Hangman bulk
  bulkCreateHangmanWords: (words) => request('/admin/hangman/words/bulk', 'POST', { words }),
  bulkDeleteHangmanWords: (ids)   => request('/admin/hangman/words/bulk', 'DELETE', { ids }),

  // Admin — Leaderboard
  listLeaderboard:              ()        => request('/admin/leaderboard'),
  deleteLeaderboardEntry:       (id)      => request(`/admin/leaderboard/${id}`, 'DELETE'),
  bulkDeleteLeaderboardEntries: (ids)     => request('/admin/leaderboard/bulk', 'DELETE', { ids }),

  // Auth
  login:     (username, password) => request('/admin/login', 'POST', { username, password }),
  logout:    ()                   => request('/admin/logout', 'POST'),
  checkAuth: ()                   => request('/admin/check'),
}

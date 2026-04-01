/**
 * LeaderboardService
 *
 * Handles leaderboard API calls.
 */

const API_URL = '/api/leaderboard.php';

/**
 * Save a score to the leaderboard
 * @param {Object} params
 * @param {string} params.name - Player name
 * @param {number} params.score - Player score
 * @param {number} params.difficulty - Difficulty level (1, 2, or 3)
 * @returns {Promise<Object>}
 */
export async function saveScore({ name, score, difficulty }) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, score, difficulty })
  });

  if (!response.ok) {
    throw new Error('Failed to save score');
  }

  return response.json();
}

/**
 * Load leaderboard entries
 * @param {number} difficulty - Filter by difficulty (0 = all)
 * @param {number} limit - Number of entries to fetch
 * @returns {Promise<Array>}
 */
export async function loadLeaderboard(difficulty = 0, limit = 50) {
  const url = `${API_URL}?difficulty=${difficulty}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load leaderboard');
  }

  return response.json();
}

/**
 * Get difficulty label from ID
 * @param {number} difficultyId
 * @returns {string}
 */
export function getDifficultyLabel(difficultyId) {
  switch (difficultyId) {
    case 1: return 'E';
    case 2: return 'M';
    case 3: return 'H';
    default: return '';
  }
}

/**
 * Refresh all leaderboard tables in the DOM
 */
export async function refreshLeaderboardUI() {
  try {
    const entries = await loadLeaderboard(0, 50);
    const tables = document.querySelectorAll('.overlay-leaderboard tbody');

    tables.forEach(tbody => {
      tbody.innerHTML = '';
      entries.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.name}</td>
          <td>${entry.score}</td>
          <td>${getDifficultyLabel(entry.difficulty)}</td>
        `;
        tbody.appendChild(row);
      });
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

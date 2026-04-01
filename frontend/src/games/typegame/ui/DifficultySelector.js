/**
 * DifficultySelector
 *
 * Handles the start overlay difficulty and mode selection UI.
 */

// Track if already initialized to avoid duplicate handlers
let isInitialized = false;
let currentKeydownHandler = null;
let selectedDifficulty = 1;
let selectedMode = 'letters';

/**
 * Initialize difficulty selector and return promise that resolves with selected difficulty
 * @param {Function} onStart - Callback when game should start with (difficultyId, mode, wordList)
 */
export function initDifficultySelector(onStart) {
  const overlay = document.getElementById('start-overlay');
  const difficultyOptions = document.querySelectorAll('.difficulty');
  const modeOptions = document.querySelectorAll('.mode');
  const wordsInputContainer = document.getElementById('words-input-container');
  const wordsInput = document.getElementById('words-input');

  // Reset selection to Easy and Letters mode on reinit
  selectedDifficulty = 1;
  selectedMode = 'letters';
  difficultyOptions.forEach(opt => opt.classList.remove('selected'));
  difficultyOptions[0].classList.add('selected');
  modeOptions.forEach(opt => opt.classList.remove('selected'));
  modeOptions[0].classList.add('selected');
  wordsInputContainer.classList.add('hidden');

  // Remove previous keydown handler if exists
  if (currentKeydownHandler) {
    window.removeEventListener('keydown', currentKeydownHandler);
  }

  // Only add click handlers once
  if (!isInitialized) {
    // Difficulty click handlers
    difficultyOptions.forEach(option => {
      option.addEventListener('click', () => {
        difficultyOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedDifficulty = parseInt(option.dataset.level, 10);
      });
    });

    // Mode click handlers
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        modeOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedMode = option.dataset.mode;

        // Show/hide words input
        if (selectedMode === 'words') {
          wordsInputContainer.classList.remove('hidden');
        } else {
          wordsInputContainer.classList.add('hidden');
        }
      });
    });

    isInitialized = true;
  }

  // Arrow key navigation (only for difficulty when not focused on textarea)
  const handleKeydown = (event) => {
    // Ignore if overlay is not visible
    if (overlay.style.display === 'none') return;

    // Don't handle arrow keys if typing in textarea
    if (document.activeElement === wordsInput) {
      if (event.key === 'Escape') {
        wordsInput.blur();
      }
      return;
    }

    const options = Array.from(difficultyOptions);
    const currentIndex = options.findIndex(opt => opt.classList.contains('selected'));

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = Math.max(0, currentIndex - 1);
      options.forEach(opt => opt.classList.remove('selected'));
      options[newIndex].classList.add('selected');
      selectedDifficulty = parseInt(options[newIndex].dataset.level, 10);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = Math.min(options.length - 1, currentIndex + 1);
      options.forEach(opt => opt.classList.remove('selected'));
      options[newIndex].classList.add('selected');
      selectedDifficulty = parseInt(options[newIndex].dataset.level, 10);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      startGame();
    }
  };

  const startGame = () => {
    // Get word list if in words mode
    let wordList = [];
    if (selectedMode === 'words' && wordsInput.value.trim()) {
      wordList = wordsInput.value
        .split(',')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0);
    }

    // If words mode but no words, use default list
    if (selectedMode === 'words' && wordList.length === 0) {
      wordList = ['APPLE', 'BANANA', 'CHERRY', 'DOG', 'CAT', 'HELLO', 'WORLD', 'GAME', 'TYPE', 'FAST'];
    }

    // Remove keyboard listener
    window.removeEventListener('keydown', handleKeydown);
    currentKeydownHandler = null;

    // Fade out overlay
    overlay.classList.add('fade-out');

    setTimeout(() => {
      overlay.style.display = 'none';
      onStart(selectedDifficulty, selectedMode, wordList);
    }, 500);
  };

  currentKeydownHandler = handleKeydown;
  window.addEventListener('keydown', handleKeydown);
}

/**
 * Reset initialization state — call from onUnmounted so re-mounting re-registers handlers
 */
export function resetDifficultySelector() {
  isInitialized = false;
  if (currentKeydownHandler) {
    window.removeEventListener('keydown', currentKeydownHandler);
    currentKeydownHandler = null;
  }
}

/**
 * Show start overlay (for restarting)
 */
export function showStartOverlay() {
  const overlay = document.getElementById('start-overlay');
  overlay.classList.remove('fade-out');
  overlay.style.display = 'flex';
}

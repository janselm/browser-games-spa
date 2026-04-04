/**
 * AudioService
 *
 * Loads a manifest from /audio/manifest.json and plays a random sound from the
 * requested category. Add sound files to frontend/public/audio/{category}/ and
 * list them in manifest.json to make them available. Categories with empty arrays
 * are silently skipped.
 *
 * Sound effects:  play(category)
 * Background music: playMusic() / pauseMusic() / resumeMusic() / stopMusic()
 *                   getMusicEnabled() / setMusicEnabled(bool)
 * Volume:         getSfxVolume() / setSfxVolume(0–1)
 *                 getMusicVolume() / setMusicVolume(0–1)
 *
 * All preferences persist to localStorage.
 */

const cache = {};
let ready = false;

(async function init() {
  try {
    const res = await fetch('/audio/manifest.json');
    const manifest = await res.json();
    for (const [category, files] of Object.entries(manifest)) {
      cache[category] = files.map(f => new Audio(`/audio/${category}/${f}`));
    }
    ready = true;
  } catch {}
})();

// ── Volume ────────────────────────────────────────────────────────────────────

let sfxVolume   = parseFloat(localStorage.getItem('sfx_volume')   ?? '0.8');
let musicVolume = parseFloat(localStorage.getItem('music_volume')  ?? '0.35');

export function getSfxVolume()   { return sfxVolume; }
export function getMusicVolume() { return musicVolume; }

export function setSfxVolume(vol) {
  sfxVolume = Math.max(0, Math.min(1, vol));
  localStorage.setItem('sfx_volume', sfxVolume);
}

export function setMusicVolume(vol) {
  musicVolume = Math.max(0, Math.min(1, vol));
  localStorage.setItem('music_volume', musicVolume);
  if (currentMusic) currentMusic.volume = musicVolume;
}

// ── Sound effects ─────────────────────────────────────────────────────────────

/**
 * Play a random sound effect from the given category.
 * No-ops if the service is not ready or the category has no files.
 */
export function play(category) {
  if (!ready) return;
  const sounds = cache[category];
  if (!sounds || sounds.length === 0) return;
  const clone = sounds[Math.floor(Math.random() * sounds.length)].cloneNode();
  clone.volume = sfxVolume;
  clone.play().catch(() => {});
}

// ── Music ─────────────────────────────────────────────────────────────────────

let currentMusic = null;
let musicEnabled = localStorage.getItem('music_enabled') !== 'false';
let playlist = [];    // shuffled copy of track indices
let playlistPos = 0;  // current position in playlist

/**
 * Fisher-Yates shuffle an array in place and return it.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Play a specific track by playlist index, advancing through all tracks before reshuffling.
 */
function playTrack(index) {
  const tracks = cache['music'];
  if (!tracks || tracks.length === 0) return;
  currentMusic = tracks[playlist[index]].cloneNode();
  currentMusic.volume = musicVolume;
  currentMusic.addEventListener('ended', () => {
    playlistPos = (playlistPos + 1) % playlist.length;
    // Reshuffle when the playlist wraps, avoiding the same track back-to-back
    if (playlistPos === 0) shuffle(playlist);
    if (musicEnabled) playTrack(playlistPos);
  });
  currentMusic.play().catch(() => {});
}

/**
 * Start playing all music tracks in a shuffled order, cycling through the full
 * playlist before reshuffling. Stops any currently playing track first.
 */
export function playMusic() {
  if (!ready || !musicEnabled) return;
  const tracks = cache['music'];
  if (!tracks || tracks.length === 0) return;
  stopMusic();
  playlist = shuffle([...Array(tracks.length).keys()]);
  playlistPos = 0;
  playTrack(playlistPos);
}

/**
 * Pause the current music track (e.g. when the game is paused).
 */
export function pauseMusic() {
  if (currentMusic) currentMusic.pause();
}

/**
 * Resume the current music track if music is enabled.
 */
export function resumeMusic() {
  if (currentMusic && musicEnabled) currentMusic.play().catch(() => {});
}

/**
 * Stop and discard the current music track.
 */
export function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

/**
 * Returns whether music is currently enabled.
 */
export function getMusicEnabled() {
  return musicEnabled;
}

/**
 * Enable or disable music. Persists the preference to localStorage.
 * Stops playback immediately when disabled.
 */
export function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  localStorage.setItem('music_enabled', enabled);
  if (!enabled) {
    stopMusic();
  }
}

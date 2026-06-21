import { createNewGameState, repairGameState } from './gameState.js';

const SAVE_KEY = 'guildmasters.save.v1';

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createNewGameState();
    return repairGameState(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load Guildmasters save:', error);
    return createNewGameState();
  }
}

export function saveGame(state) {
  state.lastSeenAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  return createNewGameState();
}

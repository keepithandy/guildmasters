import { createNewGameState, repairGameState } from './gameState.js';
import { createActionResult } from './actionResult.js';
import { validateGameState } from './invariants.js';

const SAVE_KEY = 'guildmasters.save.v2';

export function loadGame(storage) {
  try {
    const raw = resolveStorage(storage).getItem(SAVE_KEY);
    if (!raw) return createNewGameState();
    return repairGameState(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load GuildMasters save:', error);
    const state = createNewGameState();
    state.statusMessage = 'The saved guild could not be loaded; a safe new guild was created.';
    state.lastAction = createActionResult(false, state.statusMessage);
    return state;
  }
}

export function saveGame(state, storage, now = Date.now()) {
  const invariantErrors = validateGameState(state);
  if (invariantErrors.length) return createActionResult(false, `Save blocked: ${invariantErrors[0]}`, { errors: invariantErrors });
  const previousLastSeen = state.lastSeenAt;
  try {
    state.lastSeenAt = now;
    resolveStorage(storage).setItem(SAVE_KEY, JSON.stringify(state));
    return createActionResult(true, 'Guild saved safely.');
  } catch (error) {
    state.lastSeenAt = previousLastSeen;
    console.warn('Failed to save GuildMasters state:', error);
    return createActionResult(false, 'The guild could not be saved. Check browser storage and try again.', { error });
  }
}

export function resetGame(storage, now = Date.now()) {
  try {
    resolveStorage(storage).removeItem(SAVE_KEY);
    return createActionResult(true, 'Guild progress reset.', { state: createNewGameState(now) });
  } catch (error) {
    console.warn('Failed to reset GuildMasters save:', error);
    return createActionResult(false, 'Guild progress could not be reset because browser storage is unavailable.', { state: null, error });
  }
}

function resolveStorage(storage) {
  return storage ?? globalThis.localStorage;
}

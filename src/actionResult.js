import { appendLog } from './gameState.js';

export function createActionResult(ok, reason = '', details = {}) {
  return { ok: Boolean(ok), reason, ...details };
}

export function reportAction(state, reason, now = Date.now(), ok = true) {
  state.statusMessage = reason;
  state.lastAction = createActionResult(ok, reason);
  appendLog(state, reason, now);
  return state;
}

export function markAction(state, ok, reason = '') {
  state.lastAction = createActionResult(ok, reason);
  return state;
}

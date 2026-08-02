import { appendLog } from './gameState.js';

export function createActionResult(ok, reason = '', details = {}) {
  const normalizedDetails = Array.isArray(details.details) ? details.details.filter(Boolean).map(String) : [];
  return { ok: Boolean(ok), reason: String(reason || ''), details: normalizedDetails, retryAction: typeof details.retryAction === 'string' ? details.retryAction : '', ...details };
}

export function reportAction(state, reason, now = Date.now(), ok = true, details = {}) {
  state.statusMessage = reason;
  state.lastAction = createActionResult(ok, reason, details);
  appendLog(state, reason, now, details.category);
  return state;
}

export function markAction(state, ok, reason = '', details = {}) {
  state.lastAction = createActionResult(ok, reason, details);
  return state;
}

import { createActionResult } from './actionResult.js';
import { classifySaveVersion, repairGameState } from './gameState.js';
import { validateGameState } from './invariants.js';

export function exportPortableSave(state) {
  const errors = validateGameState(state);
  if (errors.length) return createActionResult(false, `Export blocked: ${errors[0]}`, { errors });
  return createActionResult(true, 'Portable guild save prepared.', { text: JSON.stringify(state, null, 2) });
}

export function prepareImportedSave(text, now = Date.now()) {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch {
    return createActionResult(false, 'Import rejected: the file is not valid Guildmasters JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return createActionResult(false, 'Import rejected: the save must be an object.');
  if (classifySaveVersion(parsed) === 'future') return createActionResult(false, `Import rejected: save version ${parsed.saveVersion} is newer than this build.`);
  const state = repairGameState(parsed, now);
  const errors = validateGameState(state);
  if (errors.length || state.lastAction?.ok === false && /not loaded|malformed/i.test(state.lastAction.reason)) {
    return createActionResult(false, `Import rejected: ${errors[0] || state.lastAction.reason}`, { errors });
  }
  return createActionResult(true, 'Import ready for confirmation.', {
    state,
    summary: `${state.guild.name}: ${state.heroes.length} heroes, level ${state.guild.level}, day ${state.guild.day}.`
  });
}

export function downloadPortableSave(text, filename = 'guildmasters-save.json') {
  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return createActionResult(true, 'Save exported.');
  } catch {
    return createActionResult(false, 'Export could not start in this browser.');
  }
}

export function applyImportedSave(currentState, prepared, persist) {
  if (!prepared?.ok || !prepared.state) return createActionResult(false, 'Import was not ready for confirmation.', { state: currentState });
  const result = persist(prepared.state);
  if (!result?.ok) return createActionResult(false, `Import was not applied: ${result?.reason || 'storage rejected the save.'}`, { state: currentState });
  return createActionResult(true, 'Imported save applied.', { state: prepared.state });
}

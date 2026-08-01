export const MAX_LOG_ENTRIES = 80;

export function appendLog(state, message, timestamp = Date.now()) {
  const baseId = `log-${timestamp}-${state.log.length}`;
  const entry = { id: uniqueId(baseId, new Set(state.log.map(item => item?.id))), timestamp, message: safeText(message, 'Guild event') };
  state.log = [entry, ...repairLog(state.log, [])].slice(0, MAX_LOG_ENTRIES);
  return state;
}

export function repairLog(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  const seenIds = new Set();
  return source.map((entry, index) => {
    const positionTimestamp = source.length - index;
    const baseId = entry && typeof entry === 'object' ? safeText(entry.id, `log-repaired-${index}`) : `log-legacy-${index}`;
    const repaired = entry && typeof entry === 'object'
      ? { id: uniqueId(baseId, seenIds), timestamp: nonNegativeNumber(entry.timestamp, positionTimestamp), message: safeText(entry.message, 'Guild event') }
      : { id: uniqueId(baseId, seenIds), timestamp: positionTimestamp, message: safeText(entry, 'Guild event') };
    seenIds.add(repaired.id);
    return repaired;
  }).filter(entry => entry.message).sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_LOG_ENTRIES);
}

function safeText(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function nonNegativeNumber(value, fallback) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback; }
function uniqueId(baseId, seenIds) {
  let id = baseId;
  let suffix = 1;
  while (seenIds.has(id)) { id = `${baseId}-${suffix}`; suffix += 1; }
  return id;
}

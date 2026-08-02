const DEFAULT_PERSISTENCE_INTERVAL_MS = 1000;

export function createPersistenceLifecycle({
  resolveState = () => ({ changed: false }),
  saveState,
  renderState = () => {},
  eventTarget = globalThis,
  timerTarget = globalThis,
  intervalMs = DEFAULT_PERSISTENCE_INTERVAL_MS
} = {}) {
  if (typeof saveState !== 'function') throw new TypeError('A saveState function is required.');

  let dirty = false;
  let started = false;
  let timerId = null;

  function markDirty() {
    dirty = true;
  }

  function flush({ force = false, render = true } = {}) {
    const resolution = resolveState();
    if (resolution?.changed) dirty = true;
    if (!dirty && !force) return null;

    const result = saveState();
    if (result?.ok !== false) dirty = false;
    if (render) renderState();
    return result;
  }

  function handleVisibilityChange() {
    if (eventTarget.document?.visibilityState === 'hidden') flush({ force: true, render: false });
  }

  function handlePageHide() {
    flush({ force: true, render: false });
  }

  function start() {
    if (started) return;
    started = true;
    if (typeof timerTarget.setInterval === 'function') {
      timerId = timerTarget.setInterval(() => flush(), intervalMs);
    }
    if (typeof eventTarget.addEventListener === 'function') {
      eventTarget.addEventListener('visibilitychange', handleVisibilityChange);
      eventTarget.addEventListener('pagehide', handlePageHide);
    }
  }

  function stop() {
    if (!started) return;
    started = false;
    if (timerId !== null && typeof timerTarget.clearInterval === 'function') timerTarget.clearInterval(timerId);
    timerId = null;
    if (typeof eventTarget.removeEventListener === 'function') {
      eventTarget.removeEventListener('visibilitychange', handleVisibilityChange);
      eventTarget.removeEventListener('pagehide', handlePageHide);
    }
  }

  return {
    flush,
    isDirty: () => dirty,
    markDirty,
    start,
    stop
  };
}

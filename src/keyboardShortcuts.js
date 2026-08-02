export function initKeyboardShortcuts(actions, target = document) {
  target.addEventListener('keydown', event => {
    if (isTypingTarget(event.target)) return;
    if (event.key === '?' || (event.shiftKey && event.key === '/')) { event.preventDefault(); actions.toggleShortcutHelp(); }
    else if (event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); actions.saveGame(); }
    else if (event.altKey && event.key.toLowerCase() === 'r') { event.preventDefault(); actions.recruitHero(); }
    else if (event.altKey && event.key.toLowerCase() === 'c') { event.preventDefault(); actions.focusContracts(); }
  });
}

export function isTypingTarget(target) {
  return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
}

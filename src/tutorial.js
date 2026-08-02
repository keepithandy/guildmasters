export const TUTORIAL_VERSION = 1;

export const TUTORIAL_STEPS = Object.freeze([
  step('command-bar', 'Your command bar', 'Watch resources, save confidence, alerts, export/import, display density, and common actions here.'),
  step('guild-overview', 'Guild command', 'This is the guild’s level, capacity, identity, mode, resources, records, and best next-action guidance.'),
  step('campaign', 'Advance the campaign', 'Complete chapter requirements, collect major rewards, and make story decisions that shape permanent flags.'),
  step('guild-events', 'Resolve guild events', 'Event choices preview deterministic resource changes and stay transactional when a cost cannot be paid.'),
  step('heroes', 'Recruit and develop heroes', 'Every recruit starts at level 1. Compare class, power, morale, gear, and availability; select idle heroes for parties or safe bulk training.'),
  step('contract-board', 'Choose contracts', 'Unlocked contracts show duration, risk, rewards, and ranked hero assignments. Stronger heroes have better success chances.'),
  step('active-expeditions', 'Track active expeditions', 'Real-time progress continues across reloads. Filter the queue by running or ready and sort by remaining time.'),
  step('guildhall', 'Build the guildhall', 'Upgrade rooms for capacity, training, healing, research, morale, crafting, influence, and prestige.'),
  step('world-regions', 'Open the world', 'Unlock regions with guild level and gold, then explore them for routes, resources, reputation, and prestige.'),
  step('factions', 'Shape faction standing', 'Spend influence on pledges and build relationships with the Crown, merchants, mages, rangers, foundries, and thieves.'),
  step('rival-guilds', 'Challenge rival guilds', 'Rivals unlock by guild level, build heat, and award gold, reputation, records, and achievements.'),
  step('tactical-encounters', 'Build tactical parties', 'Use Select idle, Clear, or deterministic Recommended selection. Class counters and party power matter in multi-round combat.'),
  step('boss-expeditions', 'Prepare for bosses', 'Bosses have region, level, and reputation requirements plus bespoke phases and persistent defeat records.'),
  step('relationships', 'Develop relationships', 'Idle hero pairs can share moments that improve morale, strengthen bonds, and unlock achievements.'),
  step('achievements', 'Review achievements', 'Achievements track tactical victories, rivals, bosses, relationships, campaign progress, and legendary completion.'),
  step('research-specialists', 'Research and hire staff', 'Daily research unlocks durable improvements; specialists reinforce training, healing, supplies, diplomacy, and intel.'),
  step('armory', 'Equip and craft', 'Buy or craft class-compatible equipment, then equip it to raise hero power. Confirmations show exact costs before spending.'),
  step('guild-records', 'Measure long-term progress', 'Records summarize gold, contracts, recruitment, levels, exploration, crafting, and boss victories.'),
  step('guild-log', 'Use the activity center', 'The Guild Log preserves outcomes by category. Save failures expose retry, and repeated low-value system messages are condensed.')
]);

export function shouldAutoStartTutorial(preferences = {}) {
  return Number(preferences.tutorialVersion || 0) < TUTORIAL_VERSION;
}

export function createTutorialState(index = 0) {
  return { active: true, index: clampIndex(index) };
}

export function currentTutorialStep(tutorial) {
  return tutorial?.active ? TUTORIAL_STEPS[clampIndex(tutorial.index)] : null;
}

export function moveTutorial(tutorial, delta) {
  return createTutorialState(clampIndex((Number(tutorial?.index) || 0) + delta));
}

export function isLastTutorialStep(tutorial) {
  return clampIndex(tutorial?.index) === TUTORIAL_STEPS.length - 1;
}

export function syncTutorialTarget(root, tutorial, view = globalThis) {
  root?.querySelectorAll?.('.tutorial-target').forEach(element => {
    element.classList.remove('tutorial-target');
    element.removeAttribute('aria-describedby');
  });
  const current = currentTutorialStep(tutorial);
  if (!root || !current) return null;
  const target = root.querySelector(`#${current.targetId}`);
  if (!target) return null;
  target.classList.remove('is-collapsed');
  target.querySelector(':scope > .panel-body')?.removeAttribute('hidden');
  const collapseButton = target.querySelector('[data-ui-panel-action="collapse"]');
  if (collapseButton) {
    collapseButton.setAttribute('aria-expanded', 'true');
    collapseButton.setAttribute('aria-label', `Collapse ${target.id}`);
    collapseButton.title = 'Collapse section';
    collapseButton.textContent = '−';
  }
  target.classList.add('tutorial-target');
  target.setAttribute('aria-describedby', 'tutorial-step-description');
  const reducedMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  target.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  return target;
}

function step(targetId, title, description) { return Object.freeze({ targetId, title, description }); }
function clampIndex(index) { return Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Number(index) || 0)); }

const PREFERENCE_KEY = 'guildmasters.ui.preferences.v1';

const DEFAULT_PREFERENCES = {
  collapsedPanels: [],
  collapsedPanelsInitialized: false,
  pinnedPanels: [],
  navGroups: {},
  heroFilter: 'all',
  heroSort: 'recommended',
  contractFilter: 'all',
  contractSort: 'recommended',
  queueFilter: 'all',
  queueSort: 'remaining',
  activityFilter: 'all',
  partyHeroIds: [],
  tutorialVersion: 0,
  notificationsReadAt: 0,
  density: 'comfortable'
};

const PREFERENCE_OPTIONS = {
  heroFilter: ['all', 'idle', 'deployed', 'injured'],
  heroSort: ['recommended', 'power', 'level', 'morale', 'name'],
  contractFilter: ['all', 'available', 'locked', 'boss'],
  contractSort: ['recommended', 'reward', 'power', 'duration'],
  queueFilter: ['all', 'running', 'ready'],
  queueSort: ['remaining', 'name'],
  activityFilter: ['all', 'contracts', 'combat', 'recruitment', 'events', 'economy', 'system'],
  density: ['comfortable', 'compact']
};

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, navGroups: {} };
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...DEFAULT_PREFERENCES, navGroups: {} };
    return {
      ...DEFAULT_PREFERENCES,
      collapsedPanels: stringList(parsed.collapsedPanels),
      collapsedPanelsInitialized: parsed.collapsedPanelsInitialized === true,
      pinnedPanels: stringList(parsed.pinnedPanels),
      navGroups: booleanMap(parsed.navGroups),
      heroFilter: optionValue('heroFilter', parsed.heroFilter),
      heroSort: optionValue('heroSort', parsed.heroSort),
      contractFilter: optionValue('contractFilter', parsed.contractFilter),
      contractSort: optionValue('contractSort', parsed.contractSort),
      queueFilter: optionValue('queueFilter', parsed.queueFilter),
      queueSort: optionValue('queueSort', parsed.queueSort),
      activityFilter: optionValue('activityFilter', parsed.activityFilter),
      partyHeroIds: stringList(parsed.partyHeroIds),
      tutorialVersion: nonNegativeInteger(parsed.tutorialVersion, DEFAULT_PREFERENCES.tutorialVersion),
      notificationsReadAt: nonNegativeInteger(parsed.notificationsReadAt, DEFAULT_PREFERENCES.notificationsReadAt),
      density: optionValue('density', parsed.density)
    };
  } catch {
    return { ...DEFAULT_PREFERENCES, navGroups: {} };
  }
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
    return { ok: true, preferences };
  } catch {
    return { ok: false, preferences };
  }
}

export function updatePreferences(mutator) {
  const preferences = loadPreferences();
  mutator(preferences);
  return savePreferences(preferences).preferences;
}

export function tryUpdatePreferences(mutator) {
  const preferences = loadPreferences();
  mutator(preferences);
  return savePreferences(preferences);
}

export function preferenceKey() {
  return PREFERENCE_KEY;
}

function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function stringList(value) { return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))] : []; }
function booleanMap(value) { return isRecord(value) ? Object.fromEntries(Object.entries(value).filter(([, expanded]) => typeof expanded === 'boolean')) : {}; }
function optionValue(key, value) { return PREFERENCE_OPTIONS[key].includes(value) ? value : DEFAULT_PREFERENCES[key]; }
function nonNegativeInteger(value, fallback) { return Number.isInteger(value) && value >= 0 ? value : fallback; }

const PREFERENCE_KEY = 'guildmasters.ui.preferences.v1';

const DEFAULT_PREFERENCES = {
  collapsedPanels: [],
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
  notificationsReadAt: 0,
  density: 'comfortable'
};

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, navGroups: {} };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      collapsedPanels: Array.isArray(parsed.collapsedPanels) ? parsed.collapsedPanels : [],
      pinnedPanels: Array.isArray(parsed.pinnedPanels) ? parsed.pinnedPanels : [],
      navGroups: parsed.navGroups && typeof parsed.navGroups === 'object' ? parsed.navGroups : {},
      partyHeroIds: Array.isArray(parsed.partyHeroIds) ? [...new Set(parsed.partyHeroIds.filter(id => typeof id === 'string'))] : []
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

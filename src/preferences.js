const PREFERENCE_KEY = 'guildmasters.ui.preferences.v1';

const DEFAULT_PREFERENCES = {
  collapsedPanels: [],
  pinnedPanels: [],
  navGroups: {},
  heroFilter: 'all',
  heroSort: 'recommended',
  contractFilter: 'all',
  contractSort: 'recommended',
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
      navGroups: parsed.navGroups && typeof parsed.navGroups === 'object' ? parsed.navGroups : {}
    };
  } catch {
    return { ...DEFAULT_PREFERENCES, navGroups: {} };
  }
}

export function savePreferences(preferences) {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
  return preferences;
}

export function updatePreferences(mutator) {
  const preferences = loadPreferences();
  mutator(preferences);
  return savePreferences(preferences);
}

export function preferenceKey() {
  return PREFERENCE_KEY;
}

export const GAME_VERSION = '0.2.0';
export const SAVE_SCHEMA_VERSION = 1;
export const MAX_LOG_ENTRIES = 50;

export function createNewGameState(now = Date.now()) {
  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: GAME_VERSION,
    guild: {
      level: 1,
      gold: 100,
      reputation: 0,
      heroCapacity: 3,
      totalGoldEarned: 0,
      contractsCompleted: 0,
      contractsFailed: 0
    },
    heroes: [],
    activeContracts: [],
    log: ['Guild founded. Recruit your first hero.'],
    lastSeenAt: now,
    statusMessage: 'Guild ready.'
  };
}

export function classifySaveVersion(input) {
  if (!input || typeof input !== 'object') return 'malformed';
  if (!Object.prototype.hasOwnProperty.call(input, 'saveVersion')) return 'legacy';
  if (!Number.isInteger(input.saveVersion)) return 'malformed';
  if (input.saveVersion > SAVE_SCHEMA_VERSION) return 'future';
  if (input.saveVersion < SAVE_SCHEMA_VERSION) return 'legacy';
  return 'current';
}

export function repairGameState(input, now = Date.now()) {
  const fallback = createNewGameState(now);
  const classification = classifySaveVersion(input);
  if (classification === 'malformed') return { ...fallback, statusMessage: 'Save data was malformed; a safe new guild was loaded.' };
  if (classification === 'future') return { ...fallback, statusMessage: `Save version ${input.saveVersion} is newer than this build and was not loaded.` };

  const guild = input.guild && typeof input.guild === 'object' ? input.guild : {};
  const heroes = Array.isArray(input.heroes) ? input.heroes.filter(Boolean).map(repairHero) : [];
  const heroIds = new Set(heroes.map(hero => hero.id));
  const activeContracts = repairActiveContracts(input.activeContracts, heroIds, now);
  const busyHeroIds = new Set(activeContracts.map(active => active.heroId));
  for (const hero of heroes) hero.status = busyHeroIds.has(hero.id) ? 'on_contract' : 'idle';

  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: typeof input.version === 'string' ? input.version : GAME_VERSION,
    guild: {
      level: positiveInt(guild.level, 1),
      gold: nonNegativeNumber(guild.gold, fallback.guild.gold),
      reputation: nonNegativeNumber(guild.reputation, 0),
      heroCapacity: positiveInt(guild.heroCapacity, 3),
      totalGoldEarned: nonNegativeNumber(guild.totalGoldEarned, 0),
      contractsCompleted: nonNegativeNumber(guild.contractsCompleted, 0),
      contractsFailed: nonNegativeNumber(guild.contractsFailed, 0)
    },
    heroes,
    activeContracts,
    log: repairLog(input.log, fallback.log),
    lastSeenAt: nonNegativeNumber(input.lastSeenAt, now),
    statusMessage: classification === 'legacy' ? 'Legacy save repaired to the current schema.' : safeText(input.statusMessage, 'Save loaded.')
  };
}

export function appendLog(state, message, timestamp = Date.now()) {
  const entry = {
    id: `log-${timestamp}-${state.log.length}`,
    timestamp,
    message: safeText(message, 'Guild event')
  };
  state.log = [entry, ...repairLog(state.log, [])].slice(0, MAX_LOG_ENTRIES);
  return state;
}

function repairActiveContracts(value, heroIds, now) {
  if (!Array.isArray(value)) return [];
  const seenHeroes = new Set();
  const seenIds = new Set();
  const repaired = [];
  for (let index = 0; index < value.length; index += 1) {
    const active = value[index];
    if (!active || typeof active !== 'object') continue;
    if (typeof active.heroId !== 'string' || !heroIds.has(active.heroId) || seenHeroes.has(active.heroId)) continue;
    if (typeof active.contractId !== 'string') continue;
    const startedAt = nonNegativeNumber(active.startedAt, now);
    const completesAt = nonNegativeNumber(active.completesAt, startedAt);
    const baseId = typeof active.id === 'string' && active.id ? active.id : `active-repaired-${index}`;
    let id = baseId;
    let suffix = 1;
    while (seenIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    repaired.push({
      id,
      heroId: active.heroId,
      contractId: active.contractId,
      startedAt,
      completesAt: Math.max(startedAt, completesAt)
    });
    seenHeroes.add(active.heroId);
    seenIds.add(id);
  }
  return repaired;
}

function repairLog(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((entry, index) => {
    const positionTimestamp = source.length - index;
    if (entry && typeof entry === 'object') {
      return {
        id: safeText(entry.id, `log-repaired-${index}`),
        timestamp: nonNegativeNumber(entry.timestamp, positionTimestamp),
        message: safeText(entry.message, 'Guild event')
      };
    }
    return { id: `log-legacy-${index}`, timestamp: positionTimestamp, message: safeText(entry, 'Guild event') };
  }).filter(entry => entry.message).sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_LOG_ENTRIES);
}

function repairHero(hero, index) {
  return {
    id: typeof hero.id === 'string' ? hero.id : `hero-${index + 1}`,
    name: typeof hero.name === 'string' ? hero.name : 'Unnamed Hero',
    className: typeof hero.className === 'string' ? hero.className : 'Warrior',
    level: positiveInt(hero.level, 1),
    power: positiveInt(hero.power, 10),
    status: 'idle'
  };
}

function safeText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function positiveInt(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

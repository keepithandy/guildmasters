export const GAME_VERSION = '1.2.0';
export const SAVE_SCHEMA_VERSION = 4;
export const MAX_LOG_ENTRIES = 80;

export function createNewGameState(now = Date.now()) {
  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: GAME_VERSION,
    guild: {
      name: 'Guildmasters',
      identity: 'Independent',
      mode: 'story',
      level: 1,
      gold: 100,
      reputation: 0,
      heroCapacity: 3,
      totalGoldEarned: 0,
      contractsCompleted: 0,
      contractsFailed: 0,
      day: 1,
      influence: 0,
      researchPoints: 0,
      materials: 0,
      prestige: 0,
      records: {
        highestGuildLevel: 1,
        highestHeroLevel: 1,
        legendaryClears: 0,
        regionsExplored: 0,
        heroesRecruited: 0,
        itemsCrafted: 0,
        bossesDefeated: 0
      }
    },
    heroes: [],
    activeContracts: [],
    rooms: { 'main-hall': 1 },
    inventory: [],
    research: [],
    staff: [],
    factions: {},
    regions: { unlocked: ['frontier'], explored: [] },
    events: [],
    campaign: { chaptersCompleted: [], activeChapter: 'small-beginning' },
    rivals: {},
    tactical: { drillsCompleted: 0, encountersWon: 0, encountersLost: 0 },
    combat: { victories: 0, defeats: 0, rounds: 0, lastEncounter: null },
    achievements: [],
    relationshipEvents: [],
    offlineSummary: { elapsedSeconds: 0, resolvedContracts: 0, returnedAt: now },
    flags: {},
    log: [{ id: 'log-founded', timestamp: now, message: 'Guild founded. Recruit your first hero.' }],
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

  const sourceGuild = input.guild && typeof input.guild === 'object' ? input.guild : {};
  const heroes = Array.isArray(input.heroes) ? input.heroes.filter(Boolean).map(repairHero) : [];
  const heroIds = new Set(heroes.map(hero => hero.id));
  const activeContracts = repairActiveContracts(input.activeContracts, heroIds, now);
  const busyHeroIds = new Set(activeContracts.map(active => active.heroId));
  for (const hero of heroes) hero.status = busyHeroIds.has(hero.id) ? 'on_contract' : 'idle';
  const guild = repairGuild(sourceGuild, fallback.guild);
  guild.heroCapacity = Math.max(guild.heroCapacity, 3 + Math.max(0, numberMap(input.rooms, 'main-hall', 1) - 1));
  guild.records.heroesRecruited = Math.max(guild.records.heroesRecruited, heroes.length);

  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: GAME_VERSION,
    guild,
    heroes,
    activeContracts,
    rooms: repairRooms(input.rooms),
    inventory: repairInventory(input.inventory),
    research: repairStringList(input.research),
    staff: repairStringList(input.staff),
    factions: repairFactions(input.factions),
    regions: repairRegions(input.regions),
    events: repairEvents(input.events),
    campaign: repairCampaign(input.campaign),
    rivals: repairRivals(input.rivals),
    tactical: repairTactical(input.tactical),
    combat: repairCombat(input.combat),
    achievements: repairStringList(input.achievements),
    relationshipEvents: repairRelationshipEvents(input.relationshipEvents),
    offlineSummary: repairOfflineSummary(input.offlineSummary, now),
    flags: input.flags && typeof input.flags === 'object' ? { ...input.flags } : {},
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

export function updateRecord(state, key, value) {
  if (!state.guild.records || typeof state.guild.records !== 'object') state.guild.records = {};
  state.guild.records[key] = Math.max(Number(state.guild.records[key]) || 0, Number(value) || 0);
  return state;
}

function repairGuild(source, fallback) {
  const records = source.records && typeof source.records === 'object' ? source.records : {};
  return {
    name: safeText(source.name, fallback.name),
    identity: safeText(source.identity, fallback.identity),
    mode: safeText(source.mode, fallback.mode),
    level: positiveInt(source.level, 1),
    gold: nonNegativeNumber(source.gold, fallback.gold),
    reputation: nonNegativeNumber(source.reputation, 0),
    heroCapacity: positiveInt(source.heroCapacity, 3),
    totalGoldEarned: nonNegativeNumber(source.totalGoldEarned, 0),
    contractsCompleted: nonNegativeNumber(source.contractsCompleted, 0),
    contractsFailed: nonNegativeNumber(source.contractsFailed, 0),
    day: positiveInt(source.day, 1),
    influence: nonNegativeNumber(source.influence, 0),
    researchPoints: nonNegativeNumber(source.researchPoints, 0),
    materials: nonNegativeNumber(source.materials, 0),
    prestige: nonNegativeNumber(source.prestige, 0),
    records: {
      highestGuildLevel: positiveInt(records.highestGuildLevel, positiveInt(source.level, 1)),
      highestHeroLevel: positiveInt(records.highestHeroLevel, 1),
      legendaryClears: nonNegativeNumber(records.legendaryClears, 0),
      regionsExplored: nonNegativeNumber(records.regionsExplored, 0),
      heroesRecruited: nonNegativeNumber(records.heroesRecruited, 0),
      itemsCrafted: nonNegativeNumber(records.itemsCrafted, 0),
      bossesDefeated: nonNegativeNumber(records.bossesDefeated, 0)
    }
  };
}

function repairHero(hero, index) {
  const equipment = hero.equipment && typeof hero.equipment === 'object' ? hero.equipment : {};
  return {
    id: typeof hero.id === 'string' ? hero.id : `hero-${index + 1}`,
    name: safeText(hero.name, 'Unnamed Hero'),
    className: safeText(hero.className, 'Warrior'),
    level: positiveInt(hero.level, 1),
    power: positiveInt(hero.power, 10),
    experience: nonNegativeNumber(hero.experience, 0),
    morale: Math.max(0, Math.min(100, nonNegativeNumber(hero.morale, 75))),
    status: 'idle',
    traits: Array.isArray(hero.traits) ? hero.traits.filter(item => typeof item === 'string').slice(0, 4) : [],
    skills: Array.isArray(hero.skills) ? hero.skills.filter(item => typeof item === 'string').slice(0, 8) : [],
    equipment: { weapon: safeText(equipment.weapon, ''), offhand: safeText(equipment.offhand, ''), armor: safeText(equipment.armor, ''), charm: safeText(equipment.charm, '') },
    injuries: Array.isArray(hero.injuries) ? hero.injuries.filter(item => typeof item === 'string').slice(0, 3) : [],
    statusEffects: Array.isArray(hero.statusEffects) ? hero.statusEffects.filter(item => typeof item === 'string').slice(0, 4) : [],
    relationships: repairHeroRelationships(hero.relationships),
    personalGoal: safeText(hero.personalGoal, 'Become a respected guild veteran.')
  };
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
    while (seenIds.has(id)) { id = `${baseId}-${suffix}`; suffix += 1; }
    repaired.push({ id, heroId: active.heroId, contractId: active.contractId, startedAt, completesAt: Math.max(startedAt, completesAt) });
    seenHeroes.add(active.heroId);
    seenIds.add(id);
  }
  return repaired;
}

function repairRooms(value) {
  const rooms = value && typeof value === 'object' ? value : {};
  const repaired = {};
  for (const [id, level] of Object.entries(rooms)) repaired[id] = Math.max(1, Math.min(5, positiveInt(level, 1)));
  if (!repaired['main-hall']) repaired['main-hall'] = 1;
  return repaired;
}

function repairInventory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object').map((item, index) => ({
    id: safeText(item.id, `item-${index}`),
    itemId: safeText(item.itemId, ''),
    quantity: positiveInt(item.quantity, 1),
    acquiredAt: nonNegativeNumber(item.acquiredAt, 0)
  }));
}

function repairStringList(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; }

function repairFactions(value) {
  const factions = value && typeof value === 'object' ? value : {};
  const repaired = {};
  for (const [id, standing] of Object.entries(factions)) repaired[id] = Math.max(-100, Math.min(100, Number(standing) || 0));
  return repaired;
}

function repairRegions(value) {
  const regions = value && typeof value === 'object' ? value : {};
  return {
    unlocked: Array.isArray(regions.unlocked) ? regions.unlocked.filter(item => typeof item === 'string') : ['frontier'],
    explored: Array.isArray(regions.explored) ? regions.explored.filter(item => typeof item === 'string') : []
  };
}

function repairEvents(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object').slice(0, 4).map(item => ({ id: safeText(item.id, ''), eventId: safeText(item.eventId, ''), createdDay: positiveInt(item.createdDay, 1) }));
}

function repairCampaign(value) {
  const campaign = value && typeof value === 'object' ? value : {};
  return {
    chaptersCompleted: Array.isArray(campaign.chaptersCompleted) ? campaign.chaptersCompleted.filter(item => typeof item === 'string') : [],
    activeChapter: safeText(campaign.activeChapter, 'small-beginning')
  };
}

function repairRivals(value) {
  const rivals = value && typeof value === 'object' ? value : {};
  const repaired = {};
  for (const [id, rival] of Object.entries(rivals)) {
    if (!rival || typeof rival !== 'object') continue;
    repaired[id] = { victories: nonNegativeNumber(rival.victories, 0), defeats: nonNegativeNumber(rival.defeats, 0), reputation: nonNegativeNumber(rival.reputation, 0) };
  }
  return repaired;
}

function repairTactical(value) {
  const tactical = value && typeof value === 'object' ? value : {};
  return { drillsCompleted: nonNegativeNumber(tactical.drillsCompleted, 0), encountersWon: nonNegativeNumber(tactical.encountersWon, 0), encountersLost: nonNegativeNumber(tactical.encountersLost, 0) };
}

function repairCombat(value) {
  const combat = value && typeof value === 'object' ? value : {};
  const lastEncounter = combat.lastEncounter && typeof combat.lastEncounter === 'object' ? {
    id: safeText(combat.lastEncounter.id, ''),
    name: safeText(combat.lastEncounter.name, 'Expedition'),
    result: safeText(combat.lastEncounter.result, 'unknown'),
    rounds: positiveInt(combat.lastEncounter.rounds, 1),
    transcript: Array.isArray(combat.lastEncounter.transcript) ? combat.lastEncounter.transcript.filter(item => typeof item === 'string').slice(-12) : []
  } : null;
  return { victories: nonNegativeNumber(combat.victories, 0), defeats: nonNegativeNumber(combat.defeats, 0), rounds: nonNegativeNumber(combat.rounds, 0), lastEncounter };
}

function repairRelationshipEvents(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object').slice(0, 8).map(item => ({ id: safeText(item.id, ''), heroIds: Array.isArray(item.heroIds) ? item.heroIds.filter(id => typeof id === 'string').slice(0, 2) : [], eventId: safeText(item.eventId, 'campfire'), createdDay: positiveInt(item.createdDay, 1) }));
}

function repairHeroRelationships(value) {
  const relationships = value && typeof value === 'object' ? value : {};
  const repaired = {};
  for (const [id, score] of Object.entries(relationships)) repaired[id] = Math.max(0, Math.min(100, Number(score) || 0));
  return repaired;
}

function repairOfflineSummary(value, now) {
  const summary = value && typeof value === 'object' ? value : {};
  return { elapsedSeconds: nonNegativeNumber(summary.elapsedSeconds, 0), resolvedContracts: nonNegativeNumber(summary.resolvedContracts, 0), returnedAt: nonNegativeNumber(summary.returnedAt, now) };
}

function repairLog(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((entry, index) => {
    const positionTimestamp = source.length - index;
    if (entry && typeof entry === 'object') return { id: safeText(entry.id, `log-repaired-${index}`), timestamp: nonNegativeNumber(entry.timestamp, positionTimestamp), message: safeText(entry.message, 'Guild event') };
    return { id: `log-legacy-${index}`, timestamp: positionTimestamp, message: safeText(entry, 'Guild event') };
  }).filter(entry => entry.message).sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_LOG_ENTRIES);
}

function numberMap(value, key, fallback) { return value && typeof value === 'object' ? positiveInt(value[key], fallback) : fallback; }
function safeText(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function positiveInt(value, fallback) { return Number.isInteger(value) && value > 0 ? value : fallback; }
function nonNegativeNumber(value, fallback) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback; }

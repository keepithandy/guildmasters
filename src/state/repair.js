import { ACHIEVEMENT_CATALOG, BOSS_ENCOUNTERS, CAMPAIGN_CHAPTERS, EVENT_CATALOG, FACTION_CATALOG, GAME_MODES, GUILD_IDENTITIES, REGION_CATALOG, RELATIONSHIP_EVENTS, RESEARCH_CATALOG, RIVAL_GUILDS, ROOM_CATALOG, STAFF_CATALOG, STORY_DECISIONS, catalogHeroClass, catalogItem } from '../content.js';
import { CONTRACT_CATALOG } from '../contractCatalog.js';
import { repairLog } from './activityLog.js';
import { GAME_VERSION, SAVE_SCHEMA_VERSION, createNewGameState } from './create.js';

const ACHIEVEMENT_IDS = idsOf(ACHIEVEMENT_CATALOG);
const BOSS_IDS = idsOf(BOSS_ENCOUNTERS);
const CAMPAIGN_IDS = idsOf(CAMPAIGN_CHAPTERS);
const CONTRACT_IDS = idsOf(CONTRACT_CATALOG);
const EVENT_IDS = idsOf(EVENT_CATALOG);
const FACTION_IDS = idsOf(FACTION_CATALOG);
const REGION_IDS = idsOf(REGION_CATALOG);
const RELATIONSHIP_EVENT_IDS = idsOf(RELATIONSHIP_EVENTS);
const RESEARCH_IDS = idsOf(RESEARCH_CATALOG);
const RIVAL_IDS = idsOf(RIVAL_GUILDS);
const ROOM_IDS = idsOf(ROOM_CATALOG);
const STAFF_IDS = idsOf(STAFF_CATALOG);
const STORY_DECISION_IDS = idsOf(STORY_DECISIONS);

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
  if (classification === 'malformed') return recoveryState(fallback, 'Save data was malformed; a safe new guild was loaded.');
  if (classification === 'future') return recoveryState(fallback, `Save version ${input.saveVersion} is newer than this build and was not loaded.`);

  const sourceGuild = objectOrEmpty(input.guild);
  const heroes = repairHeroes(input.heroes);
  const heroIds = new Set(heroes.map(hero => hero.id));
  for (const hero of heroes) hero.relationships = repairHeroRelationships(hero.relationships, hero.id, heroIds);
  const activeContracts = repairActiveContracts(input.activeContracts, heroIds, now);
  const busyHeroIds = new Set(activeContracts.map(active => active.heroId));
  for (const hero of heroes) hero.status = busyHeroIds.has(hero.id) ? 'on_contract' : 'idle';
  const rooms = repairRooms(input.rooms);
  const guild = repairGuild(sourceGuild, fallback.guild);
  guild.heroCapacity = Math.max(guild.heroCapacity, heroes.length, 3 + Math.max(0, rooms['main-hall'] - 1));
  guild.records.heroesRecruited = Math.max(guild.records.heroesRecruited, heroes.length);

  const statusMessage = classification === 'legacy' ? 'Legacy save repaired to the current schema.' : safeText(input.statusMessage, 'Save loaded.');
  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: GAME_VERSION,
    guild,
    heroes,
    activeContracts,
    rooms,
    inventory: repairInventory(input.inventory),
    research: repairCatalogList(input.research, RESEARCH_IDS),
    staff: repairCatalogList(input.staff, STAFF_IDS),
    factions: repairFactions(input.factions),
    regions: repairRegions(input.regions),
    events: repairEvents(input.events),
    campaign: repairCampaign(input.campaign),
    rivals: repairRivals(input.rivals),
    bosses: repairBosses(input.bosses),
    worldThreat: Math.max(0, Math.min(100, Number(input.worldThreat) || 0)),
    tactical: repairTactical(input.tactical),
    combat: repairCombat(input.combat),
    achievements: repairCatalogList(input.achievements, ACHIEVEMENT_IDS),
    relationshipEvents: repairRelationshipEvents(input.relationshipEvents, heroIds),
    offlineSummary: repairOfflineSummary(input.offlineSummary, now),
    flags: objectOrEmpty(input.flags),
    log: repairLog(input.log, fallback.log),
    lastSeenAt: nonNegativeNumber(input.lastSeenAt, now),
    statusMessage,
    lastAction: repairLastAction(input.lastAction, statusMessage)
  };
}

function repairGuild(source, fallback) {
  const records = objectOrEmpty(source.records);
  return {
    name: safeText(source.name, fallback.name), identity: GUILD_IDENTITIES.includes(source.identity) ? source.identity : fallback.identity, mode: GAME_MODES.some(mode => mode.id === source.mode) ? source.mode : fallback.mode,
    level: positiveInt(source.level, 1), gold: nonNegativeNumber(source.gold, fallback.gold), reputation: nonNegativeNumber(source.reputation, 0),
    heroCapacity: positiveInt(source.heroCapacity, 3), totalGoldEarned: nonNegativeNumber(source.totalGoldEarned, 0),
    contractsCompleted: nonNegativeNumber(source.contractsCompleted, 0), contractsFailed: nonNegativeNumber(source.contractsFailed, 0), day: positiveInt(source.day, 1),
    influence: nonNegativeNumber(source.influence, 0), researchPoints: nonNegativeNumber(source.researchPoints, 0), materials: nonNegativeNumber(source.materials, 0), prestige: nonNegativeNumber(source.prestige, 0),
    records: {
      highestGuildLevel: positiveInt(records.highestGuildLevel, positiveInt(source.level, 1)), highestHeroLevel: positiveInt(records.highestHeroLevel, 1),
      legendaryClears: nonNegativeNumber(records.legendaryClears, 0), regionsExplored: nonNegativeNumber(records.regionsExplored, 0),
      heroesRecruited: nonNegativeNumber(records.heroesRecruited, 0), itemsCrafted: nonNegativeNumber(records.itemsCrafted, 0), bossesDefeated: nonNegativeNumber(records.bossesDefeated, 0)
    }
  };
}

function repairHeroes(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(Boolean).map((hero, index) => {
    const baseId = safeText(hero.id, `hero-${index + 1}`);
    let id = baseId;
    let suffix = 1;
    while (seen.has(id)) { id = `${baseId}-${suffix}`; suffix += 1; }
    seen.add(id);
    return repairHero(hero, id);
  });
}

function repairHero(hero, id) {
  const requestedClass = safeText(hero.className, 'Warrior');
  const className = catalogHeroClass(requestedClass)?.name || 'Warrior';
  return {
    id, name: safeText(hero.name, 'Unnamed Hero'), className, level: positiveInt(hero.level, 1), power: positiveInt(hero.power, 10),
    experience: nonNegativeNumber(hero.experience, 0), morale: Math.max(0, Math.min(100, nonNegativeNumber(hero.morale, 75))), status: 'idle',
    traits: stringList(hero.traits, 4), skills: stringList(hero.skills, 8), equipment: repairEquipment(hero.equipment, className), injuries: stringList(hero.injuries, 3),
    statusEffects: [], relationships: objectOrEmpty(hero.relationships), personalGoal: safeText(hero.personalGoal, 'Become a respected guild veteran.')
  };
}

function repairEquipment(value, className) {
  const equipment = objectOrEmpty(value);
  const repaired = { weapon: '', offhand: '', armor: '', charm: '' };
  for (const slot of Object.keys(repaired)) {
    const item = catalogItem(equipment[slot]);
    if (item && item.slot === slot && (!item.className || item.className === className)) repaired[slot] = item.id;
  }
  return repaired;
}

function repairActiveContracts(value, heroIds, now) {
  if (!Array.isArray(value)) return [];
  const seenHeroes = new Set();
  const seenIds = new Set();
  const repaired = [];
  for (let index = 0; index < value.length; index += 1) {
    const active = value[index];
    if (!active || typeof active !== 'object' || typeof active.heroId !== 'string' || !heroIds.has(active.heroId) || seenHeroes.has(active.heroId) || !CONTRACT_IDS.has(active.contractId)) continue;
    const startedAt = nonNegativeNumber(active.startedAt, now);
    const completesAt = nonNegativeNumber(active.completesAt, startedAt);
    const baseId = safeText(active.id, `active-repaired-${index}`);
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
  const rooms = objectOrEmpty(value);
  const repaired = {};
  for (const [id, level] of Object.entries(rooms)) if (ROOM_IDS.has(id)) repaired[id] = Math.max(1, Math.min(5, positiveInt(level, 1)));
  if (!repaired['main-hall']) repaired['main-hall'] = 1;
  return repaired;
}

function repairInventory(value) {
  if (!Array.isArray(value)) return [];
  const repaired = new Map();
  const seenIds = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== 'object' || !catalogItem(item.itemId)) continue;
    const quantity = positiveInt(item.quantity, 0);
    if (!quantity) continue;
    const existing = repaired.get(item.itemId);
    if (existing) existing.quantity += quantity;
    else {
      const baseId = safeText(item.id, `item-${index}`);
      let id = baseId;
      let suffix = 1;
      while (seenIds.has(id)) { id = `${baseId}-${suffix}`; suffix += 1; }
      seenIds.add(id);
      repaired.set(item.itemId, { id, itemId: item.itemId, quantity, acquiredAt: nonNegativeNumber(item.acquiredAt, 0) });
    }
  }
  return [...repaired.values()];
}

function repairFactions(value) {
  const repaired = {};
  for (const [id, standing] of Object.entries(objectOrEmpty(value))) if (FACTION_IDS.has(id)) repaired[id] = Math.max(-100, Math.min(100, Number(standing) || 0));
  return repaired;
}

function repairRegions(value) {
  const regions = objectOrEmpty(value);
  const unlocked = repairCatalogList(regions.unlocked, REGION_IDS);
  if (!unlocked.includes('frontier')) unlocked.unshift('frontier');
  const unlockedIds = new Set(unlocked);
  const explored = repairCatalogList(regions.explored, REGION_IDS).filter(id => unlockedIds.has(id));
  return { unlocked, explored };
}

function repairEvents(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const repaired = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || !EVENT_IDS.has(item.eventId) || seen.has(item.eventId)) continue;
    repaired.push({ id: safeText(item.id, `event-${item.eventId}`), eventId: item.eventId, createdDay: positiveInt(item.createdDay, 1) });
    seen.add(item.eventId);
    if (repaired.length >= 4) break;
  }
  return repaired;
}

function repairCampaign(value) {
  const campaign = objectOrEmpty(value);
  const chaptersCompleted = repairCatalogList(campaign.chaptersCompleted, CAMPAIGN_IDS);
  const nextChapter = CAMPAIGN_CHAPTERS.find(chapter => !chaptersCompleted.includes(chapter.id));
  const requestedChapterAvailable = CAMPAIGN_IDS.has(campaign.activeChapter) && !chaptersCompleted.includes(campaign.activeChapter);
  const activeChapter = requestedChapterAvailable ? campaign.activeChapter : nextChapter?.id || CAMPAIGN_CHAPTERS.at(-1).id;
  const decisionsMade = repairCatalogList(campaign.decisionsMade, STORY_DECISION_IDS).filter(id => {
    const decision = STORY_DECISIONS.find(candidate => candidate.id === id);
    return decision && chaptersCompleted.includes(decision.chapterId);
  });
  return { chaptersCompleted, activeChapter, decisionsMade };
}

function repairRivals(value) {
  const repaired = {};
  for (const [id, rival] of Object.entries(objectOrEmpty(value))) {
    if (!RIVAL_IDS.has(id) || !rival || typeof rival !== 'object') continue;
    repaired[id] = { victories: nonNegativeNumber(rival.victories, 0), defeats: nonNegativeNumber(rival.defeats, 0), reputation: nonNegativeNumber(rival.reputation, 0), heat: nonNegativeNumber(rival.heat, 0), lastAction: safeText(rival.lastAction, '') };
  }
  return repaired;
}

function repairBosses(value) {
  const bosses = objectOrEmpty(value);
  const attempts = {};
  for (const [id, count] of Object.entries(objectOrEmpty(bosses.attempts))) if (BOSS_IDS.has(id)) attempts[id] = nonNegativeNumber(count, 0);
  return { defeated: repairCatalogList(bosses.defeated, BOSS_IDS), attempts };
}

function repairTactical(value) {
  const tactical = objectOrEmpty(value);
  return { drillsCompleted: nonNegativeNumber(tactical.drillsCompleted, 0), encountersWon: nonNegativeNumber(tactical.encountersWon, 0), encountersLost: nonNegativeNumber(tactical.encountersLost, 0) };
}

function repairCombat(value) {
  const combat = objectOrEmpty(value);
  const last = objectOrEmpty(combat.lastEncounter);
  const lastEncounter = Object.keys(last).length ? { id: safeText(last.id, ''), name: safeText(last.name, 'Expedition'), result: safeText(last.result, 'unknown'), rounds: positiveInt(last.rounds, 1), transcript: stringList(last.transcript, 12) } : null;
  return { victories: nonNegativeNumber(combat.victories, 0), defeats: nonNegativeNumber(combat.defeats, 0), rounds: nonNegativeNumber(combat.rounds, 0), lastEncounter };
}

function repairRelationshipEvents(value, heroIds) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && RELATIONSHIP_EVENT_IDS.has(item.eventId))
    .map(item => ({ id: safeText(item.id, ''), heroIds: uniqueStrings(item.heroIds).filter(id => heroIds.has(id)).slice(0, 2), eventId: item.eventId, createdDay: positiveInt(item.createdDay, 1) }))
    .filter(item => item.heroIds.length === 2).slice(0, 8);
}

function repairHeroRelationships(value, heroId, heroIds) {
  const repaired = {};
  for (const [id, score] of Object.entries(objectOrEmpty(value))) if (id !== heroId && heroIds.has(id)) repaired[id] = Math.max(0, Math.min(100, Number(score) || 0));
  return repaired;
}

function repairOfflineSummary(value, now) {
  const summary = objectOrEmpty(value);
  return { elapsedSeconds: nonNegativeNumber(summary.elapsedSeconds, 0), resolvedContracts: nonNegativeNumber(summary.resolvedContracts, 0), returnedAt: nonNegativeNumber(summary.returnedAt, now) };
}

function repairLastAction(value, fallbackReason) {
  const action = objectOrEmpty(value);
  return { ok: typeof action.ok === 'boolean' ? action.ok : true, reason: safeText(action.reason, fallbackReason) };
}

function recoveryState(fallback, reason) { return { ...fallback, statusMessage: reason, lastAction: { ok: false, reason } }; }

function objectOrEmpty(value) { return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}; }
function repairStringList(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; }
function uniqueStrings(value) { return [...new Set(repairStringList(value))]; }
function repairCatalogList(value, validIds) { return uniqueStrings(value).filter(id => validIds.has(id)); }
function stringList(value, limit) { return repairStringList(value).slice(0, limit); }
function idsOf(catalog) { return new Set(catalog.map(item => item.id)); }
function safeText(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function positiveInt(value, fallback) { return Number.isInteger(value) && value > 0 ? value : fallback; }
function nonNegativeNumber(value, fallback) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback; }

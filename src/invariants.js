import { ACHIEVEMENT_CATALOG, BOSS_ENCOUNTERS, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, ENEMY_CATALOG, EVENT_CATALOG, FACTION_CATALOG, GAME_MODES, GUILD_IDENTITIES, HERO_CLASS_CATALOG, ITEM_CATALOG, REGION_CATALOG, RELATIONSHIP_EVENTS, RESEARCH_CATALOG, RIVAL_GUILDS, ROOM_CATALOG, STAFF_CATALOG, STORY_DECISIONS, catalogItem } from './content.js';
import { CONTRACT_CATALOG, catalogContract } from './contractCatalog.js';

const HERO_CLASS_NAMES = HERO_CLASS_CATALOG.map(profile => profile.name);
const CATALOG_IDS = {
  achievements: idsOf(ACHIEVEMENT_CATALOG), bosses: idsOf(BOSS_ENCOUNTERS), chapters: idsOf(CAMPAIGN_CHAPTERS),
  events: idsOf(EVENT_CATALOG), factions: idsOf(FACTION_CATALOG), regions: idsOf(REGION_CATALOG), relationshipEvents: idsOf(RELATIONSHIP_EVENTS),
  research: idsOf(RESEARCH_CATALOG), rivals: idsOf(RIVAL_GUILDS), rooms: idsOf(ROOM_CATALOG), staff: idsOf(STAFF_CATALOG), decisions: idsOf(STORY_DECISIONS)
};

const RESOURCE_KEYS = ['gold', 'reputation', 'heroCapacity', 'totalGoldEarned', 'contractsCompleted', 'contractsFailed', 'day', 'influence', 'researchPoints', 'materials', 'prestige'];

export function validateGameState(state) {
  const errors = validateCatalogs();
  if (!state || typeof state !== 'object') return ['Game state must be an object.'];
  if (!state.guild || typeof state.guild !== 'object') errors.push('Guild state is missing.');
  for (const key of RESOURCE_KEYS) {
    const value = state.guild?.[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) errors.push(`Guild resource ${key} must be a finite nonnegative number.`);
  }
  if (!GAME_MODES.some(mode => mode.id === state.guild?.mode)) errors.push(`Guild mode ${state.guild?.mode || '(missing)'} is unavailable.`);
  if (!GUILD_IDENTITIES.includes(state.guild?.identity)) errors.push(`Guild identity ${state.guild?.identity || '(missing)'} is unavailable.`);

  const heroes = Array.isArray(state.heroes) ? state.heroes : [];
  if (!Array.isArray(state.heroes)) errors.push('Heroes must be an array.');
  if (heroes.length > (state.guild?.heroCapacity || 0)) errors.push('Hero roster exceeds guild capacity.');
  const heroIds = new Set();
  for (const hero of heroes) {
    if (!hero?.id || heroIds.has(hero.id)) errors.push(`Hero id ${hero?.id || '(missing)'} is not unique.`);
    heroIds.add(hero?.id);
    if (!HERO_CLASS_NAMES.includes(hero?.className)) errors.push(`Hero ${hero?.id || '(missing)'} has unknown class ${hero?.className || '(missing)'}.`);
    for (const [slot, itemId] of Object.entries(hero?.equipment || {})) {
      if (!itemId) continue;
      const item = catalogItem(itemId);
      if (!item) errors.push(`Hero ${hero.id} has unknown equipped item ${itemId}.`);
      else if (item.slot !== slot || (item.className && item.className !== hero.className)) errors.push(`Hero ${hero.id} cannot equip ${itemId} in ${slot}.`);
    }
  }

  const assignedHeroes = new Set();
  const activeIds = new Set();
  for (const active of Array.isArray(state.activeContracts) ? state.activeContracts : []) {
    if (!active?.id || activeIds.has(active.id)) errors.push(`Active contract id ${active?.id || '(missing)'} is not unique.`);
    activeIds.add(active?.id);
    if (!heroIds.has(active?.heroId)) errors.push(`Contract ${active?.id || '(missing)'} references an unknown hero.`);
    if (!catalogContract(active?.contractId)) errors.push(`Contract ${active?.id || '(missing)'} references unknown contract ${active?.contractId || '(missing)'}.`);
    if (assignedHeroes.has(active?.heroId)) errors.push(`Hero ${active.heroId} has more than one active contract.`);
    if (!Number.isFinite(active?.startedAt) || !Number.isFinite(active?.completesAt) || active.completesAt < active.startedAt) errors.push(`Contract ${active?.id || '(missing)'} has invalid timestamps.`);
    assignedHeroes.add(active?.heroId);
  }
  for (const hero of heroes) {
    const expectedStatus = assignedHeroes.has(hero.id) ? 'on_contract' : 'idle';
    if (hero.status !== expectedStatus) errors.push(`Hero ${hero.id} status does not match active assignments.`);
    for (const relatedHeroId of Object.keys(hero.relationships || {})) if (relatedHeroId === hero.id || !heroIds.has(relatedHeroId)) errors.push(`Hero ${hero.id} has an invalid relationship target ${relatedHeroId}.`);
  }

  const inventoryIds = new Set();
  const inventoryItemIds = new Set();
  for (const entry of Array.isArray(state.inventory) ? state.inventory : []) {
    if (!entry?.id || inventoryIds.has(entry.id)) errors.push(`Inventory id ${entry?.id || '(missing)'} is not unique.`);
    if (inventoryItemIds.has(entry?.itemId)) errors.push(`Inventory item ${entry?.itemId || '(missing)'} has duplicate stacks.`);
    inventoryIds.add(entry?.id);
    inventoryItemIds.add(entry?.itemId);
    if (!catalogItem(entry?.itemId)) errors.push(`Inventory entry ${entry?.id || '(missing)'} references an unknown item.`);
    if (!Number.isInteger(entry?.quantity) || entry.quantity <= 0) errors.push(`Inventory entry ${entry?.id || '(missing)'} has an invalid quantity.`);
  }

  validateCatalogList(errors, state.research, CATALOG_IDS.research, 'Research');
  validateCatalogList(errors, state.staff, CATALOG_IDS.staff, 'Staff');
  validateCatalogList(errors, state.achievements, CATALOG_IDS.achievements, 'Achievement');
  validateCatalogList(errors, state.regions?.unlocked, CATALOG_IDS.regions, 'Unlocked region');
  validateCatalogList(errors, state.regions?.explored, CATALOG_IDS.regions, 'Explored region');
  if (!state.regions?.unlocked?.includes('frontier')) errors.push('The frontier region must remain unlocked.');
  for (const id of state.regions?.explored || []) if (!state.regions.unlocked.includes(id)) errors.push(`Explored region ${id} is not unlocked.`);
  for (const id of Object.keys(state.rooms || {})) if (!CATALOG_IDS.rooms.has(id)) errors.push(`Guild room ${id} is unknown.`);
  for (const id of Object.keys(state.factions || {})) if (!CATALOG_IDS.factions.has(id)) errors.push(`Faction ${id} is unknown.`);
  for (const id of Object.keys(state.rivals || {})) if (!CATALOG_IDS.rivals.has(id)) errors.push(`Rival ${id} is unknown.`);
  for (const id of state.bosses?.defeated || []) if (!CATALOG_IDS.bosses.has(id)) errors.push(`Defeated boss ${id} is unknown.`);
  for (const id of Object.keys(state.bosses?.attempts || {})) if (!CATALOG_IDS.bosses.has(id)) errors.push(`Boss attempt ${id} is unknown.`);
  const eventIds = new Set();
  for (const event of state.events || []) {
    if (!CATALOG_IDS.events.has(event?.eventId)) errors.push(`Guild event ${event?.eventId || '(missing)'} is unknown.`);
    if (eventIds.has(event?.eventId)) errors.push(`Guild event ${event.eventId} is duplicated.`);
    eventIds.add(event?.eventId);
  }
  validateCatalogList(errors, state.campaign?.chaptersCompleted, CATALOG_IDS.chapters, 'Campaign chapter');
  validateCatalogList(errors, state.campaign?.decisionsMade, CATALOG_IDS.decisions, 'Story decision');
  if (!CATALOG_IDS.chapters.has(state.campaign?.activeChapter)) errors.push(`Active campaign chapter ${state.campaign?.activeChapter || '(missing)'} is unknown.`);
  for (const event of state.relationshipEvents || []) {
    const relatedHeroes = [...new Set(Array.isArray(event?.heroIds) ? event.heroIds : [])];
    if (!CATALOG_IDS.relationshipEvents.has(event?.eventId)) errors.push(`Relationship event ${event?.eventId || '(missing)'} is unknown.`);
    if (relatedHeroes.length !== 2 || relatedHeroes.some(id => !heroIds.has(id))) errors.push(`Relationship event ${event?.id || '(missing)'} has invalid heroes.`);
  }
  const logIds = new Set();
  for (const entry of state.log || []) {
    if (!entry?.id || logIds.has(entry.id)) errors.push(`Activity log id ${entry?.id || '(missing)'} is not unique.`);
    logIds.add(entry?.id);
  }
  if (!state.lastAction || typeof state.lastAction.ok !== 'boolean' || typeof state.lastAction.reason !== 'string') errors.push('Last action result is malformed.');
  return errors;
}

export function validateCatalogs() {
  const errors = [];
  for (const enemy of ENEMY_CATALOG) if (!HERO_CLASS_NAMES.includes(enemy.weakness)) errors.push(`Enemy ${enemy.id} references unavailable class ${enemy.weakness}.`);
  for (const item of ITEM_CATALOG) if (item.className && !HERO_CLASS_NAMES.includes(item.className)) errors.push(`Item ${item.id} references unavailable class ${item.className}.`);
  for (const contract of CONTRACT_CATALOG) {
    if (!CATALOG_IDS.regions.has(contract.region)) errors.push(`Contract ${contract.id} references unknown region ${contract.region}.`);
    if (!CATALOG_IDS.factions.has(contract.faction)) errors.push(`Contract ${contract.id} references unknown faction ${contract.faction}.`);
    if (!ENEMY_CATALOG.some(enemy => enemy.id === contract.enemy)) errors.push(`Contract ${contract.id} references unknown enemy ${contract.enemy || '(missing)'}.`);
    if (contract.rewardItem && !catalogItem(contract.rewardItem)) errors.push(`Contract ${contract.id} references unknown reward item ${contract.rewardItem}.`);
  }
  for (const encounter of COMBAT_ENCOUNTERS) if (!ENEMY_CATALOG.some(enemy => enemy.id === encounter.enemy)) errors.push(`Encounter ${encounter.id} references unknown enemy ${encounter.enemy}.`);
  for (const boss of BOSS_ENCOUNTERS) {
    if (!ENEMY_CATALOG.some(enemy => enemy.id === boss.enemy)) errors.push(`Boss ${boss.id} references unknown enemy ${boss.enemy}.`);
    if (!CATALOG_IDS.regions.has(boss.region)) errors.push(`Boss ${boss.id} references unknown region ${boss.region}.`);
  }
  for (const decision of STORY_DECISIONS) {
    if (!CATALOG_IDS.chapters.has(decision.chapterId)) errors.push(`Story decision ${decision.id} references unknown chapter ${decision.chapterId}.`);
    for (const option of decision.options) if (option.faction && !CATALOG_IDS.factions.has(option.faction)) errors.push(`Story decision ${decision.id} references unknown faction ${option.faction}.`);
  }
  return errors;
}

export function assertGameState(state) {
  const errors = validateGameState(state);
  if (errors.length) throw new Error(`Game-state invariant failure: ${errors.join(' ')}`);
  return state;
}

function validateCatalogList(errors, value, validIds, label) {
  if (!Array.isArray(value)) { errors.push(`${label} state must be an array.`); return; }
  const seen = new Set();
  for (const id of value) {
    if (!validIds.has(id)) errors.push(`${label} ${id} is unknown.`);
    if (seen.has(id)) errors.push(`${label} ${id} is duplicated.`);
    seen.add(id);
  }
}

function idsOf(catalog) { return new Set(catalog.map(item => item.id)); }

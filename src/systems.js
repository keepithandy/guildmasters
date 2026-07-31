import { appendLog, updateRecord } from './gameState.js';
import { EVENT_CATALOG, GAME_MODES, REGION_CATALOG, RESEARCH_CATALOG, STAFF_CATALOG, catalogEvent, catalogRegion, catalogResearch, catalogStaff } from './content.js';
import { addInventory, findHero, trainHero } from './heroes.js';
import { buyItem, upgradeRoom } from './guild.js';

export function advanceDay(state, now = Date.now()) {
  state.guild.day += 1;
  const roomResearch = Number(state.rooms?.library) || 1;
  const staffResearch = state.staff.includes('archivist') ? 2 : 0;
  state.guild.researchPoints += Math.max(1, roomResearch - 1) + staffResearch;
  for (const hero of state.heroes) {
    if (hero.injuries?.length) {
      const healing = (Number(state.rooms?.infirmary) || 1) + (state.staff.includes('healer') ? 1 : 0) + (state.research.includes('field-medicine') ? 1 : 0);
      if (healing >= 2 || state.guild.day % healing === 0) hero.injuries.pop();
    }
    hero.morale = Math.min(100, (hero.morale || 75) + (state.rooms?.tavern || 1));
  }
  maybeCreateEvent(state, now);
  state.statusMessage = `Day ${state.guild.day} begins. The guild has new opportunities.`;
  appendLog(state, state.statusMessage, now);
  return state;
}

export function exploreRegion(state, regionId, now = Date.now()) {
  const region = catalogRegion(regionId);
  if (!region) return state;
  if (state.regions.unlocked.includes(region.id)) {
    if (state.regions.explored.includes(region.id)) return setSystemMessage(state, `${region.name} has already been explored.`, now);
    state.regions.explored.push(region.id);
    state.guild.reputation += 2;
    state.guild.materials += 3;
    state.guild.prestige += 1;
    state.guild.records.regionsExplored += 1;
    return setSystemMessage(state, `${region.name} explored. The guild found new routes and resources.`, now);
  }
  if (state.guild.level < region.minGuildLevel) return setSystemMessage(state, `${region.name} requires guild level ${region.minGuildLevel}.`, now);
  if (state.guild.gold < region.cost) return setSystemMessage(state, `Exploring ${region.name} needs ${region.cost} gold.`, now);
  state.guild.gold -= region.cost;
  state.regions.unlocked.push(region.id);
  state.statusMessage = `${region.name} is now open to the guild.`;
  appendLog(state, state.statusMessage, now);
  return state;
}

export function researchProject(state, projectId, now = Date.now()) {
  const project = catalogResearch(projectId);
  if (!project) return state;
  if (state.research.includes(project.id)) return setSystemMessage(state, `${project.name} is already complete.`, now);
  if (state.guild.researchPoints < project.cost) return setSystemMessage(state, `${project.name} needs ${project.cost} research points.`, now);
  state.guild.researchPoints -= project.cost;
  state.research.push(project.id);
  return setSystemMessage(state, `Research complete: ${project.name}.`, now);
}

export function hireStaff(state, staffId, now = Date.now()) {
  const staff = catalogStaff(staffId);
  if (!staff) return state;
  if (state.staff.includes(staff.id)) return setSystemMessage(state, `${staff.name} already works for the guild.`, now);
  if (state.guild.gold < staff.cost) return setSystemMessage(state, `Hiring ${staff.name} needs ${staff.cost} gold.`, now);
  state.guild.gold -= staff.cost;
  state.staff.push(staff.id);
  return setSystemMessage(state, `${staff.name} joined the guild staff.`, now);
}

export function craftItem(state, itemId, now = Date.now()) {
  const recipes = { 'iron-sword': { materials: 3, gold: 30 }, 'hunter-bow': { materials: 3, gold: 30 }, 'apprentice-staff': { materials: 4, gold: 40 }, 'tower-shield': { materials: 5, gold: 45 }, 'shadow-dagger': { materials: 6, gold: 55 }, 'guildmail': { materials: 5, gold: 50 }, 'ember-charm': { materials: 8, gold: 80 }, 'dragon-signet': { materials: 15, gold: 150 } };
  const recipe = recipes[itemId];
  if (!recipe) return state;
  if (!state.research.includes('runic-craft') && itemId === 'dragon-signet') return setSystemMessage(state, 'Dragon Signet requires Runic Craft research.', now);
  if (state.guild.materials < recipe.materials || state.guild.gold < recipe.gold) return setSystemMessage(state, `Crafting needs ${recipe.materials} materials and ${recipe.gold} gold.`, now);
  state.guild.materials -= recipe.materials;
  state.guild.gold -= recipe.gold;
  addInventory(state, itemId, 1, now);
  state.guild.records.itemsCrafted += 1;
  return setSystemMessage(state, `Crafted ${itemId.replaceAll('-', ' ')} and added it to the Armory.`, now);
}

export function chooseEvent(state, eventId, optionId, now = Date.now()) {
  const event = catalogEvent(eventId);
  const active = state.events.find(entry => entry.eventId === eventId);
  const option = event?.options.find(item => item.id === optionId);
  if (!event || !option || !active) return state;
  state.guild.gold = Math.max(0, state.guild.gold + (option.gold || 0));
  state.guild.reputation += option.reputation || 0;
  state.guild.researchPoints += option.research || 0;
  if (option.id === 'recruit' && state.heroes.length < state.guild.heroCapacity) trainHero(state, state.heroes[0]?.id, now);
  state.events = state.events.filter(entry => entry !== active);
  return setSystemMessage(state, `${event.title}: ${option.label}.`, now);
}

export function supportFaction(state, factionId, now = Date.now()) {
  const current = state.factions[factionId] || 0;
  if (state.guild.influence < 1) return setSystemMessage(state, 'The guild needs 1 influence to make a faction pledge.', now);
  state.guild.influence -= 1;
  state.factions[factionId] = Math.min(100, current + 3);
  return setSystemMessage(state, `The guild pledged support to ${factionId}.`, now);
}

export function setMode(state, modeId, now = Date.now()) {
  if (!GAME_MODES.some(mode => mode.id === modeId)) return state;
  state.guild.mode = modeId;
  return setSystemMessage(state, `Game mode set to ${modeId}.`, now);
}

export function bootstrapFoundation(state, now = Date.now()) {
  if (!state.inventory.length) addInventory(state, 'iron-sword', 1, now);
  if (!state.inventory.some(item => item.itemId === 'hunter-bow')) addInventory(state, 'hunter-bow', 1, now);
  return state;
}

export { EVENT_CATALOG, GAME_MODES, REGION_CATALOG, RESEARCH_CATALOG, STAFF_CATALOG, buyItem, upgradeRoom };

function maybeCreateEvent(state, now) {
  if (state.events.length >= 2 || state.guild.day < 2) return;
  const available = EVENT_CATALOG.filter(event => !state.events.some(active => active.eventId === event.id));
  if (!available.length || state.guild.day % 2 !== 0) return;
  const event = available[state.guild.day % available.length];
  state.events.push({ id: `event-${state.guild.day}`, eventId: event.id, createdDay: state.guild.day });
  appendLog(state, `Guild event: ${event.title}.`, now);
}

function setSystemMessage(state, message, now) { state.statusMessage = message; appendLog(state, message, now); return state; }

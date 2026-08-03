import { addInventory } from '../heroes.js';
import { GAME_MODES, catalogFaction, catalogRegion, catalogResearch, catalogStaff } from '../content.js';
import { reportAction } from '../actionResult.js';
import { createDailyEvent } from './events.js';
import { advanceRivalPressure } from './rivals.js';

export const CRAFTING_RECIPES = {
  'iron-sword': { materials: 3, gold: 30 },
  'hunter-bow': { materials: 3, gold: 30 },
  'apprentice-staff': { materials: 4, gold: 40 },
  'tower-shield': { materials: 5, gold: 45 },
  'shadow-dagger': { materials: 6, gold: 55 },
  guildmail: { materials: 5, gold: 50 },
  'ember-charm': { materials: 8, gold: 80 },
  'dragon-signet': { materials: 15, gold: 150 }
};

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
    hero.morale = Math.min(100, (hero.morale ?? 75) + (state.rooms?.tavern || 1));
  }
  createDailyEvent(state, now);
  advanceRivalPressure(state, now);
  return reportAction(state, `Day ${state.guild.day} begins. The guild has new opportunities.`, now, true);
}

export function exploreRegion(state, regionId, now = Date.now()) {
  const region = catalogRegion(regionId);
  if (!region) return reportAction(state, 'That region could not be found.', now, false);
  if (state.regions.unlocked.includes(region.id)) {
    if (state.regions.explored.includes(region.id)) return reportAction(state, `${region.name} has already been explored.`, now, false);
    state.regions.explored.push(region.id);
    state.guild.reputation += 2;
    state.guild.materials += 3;
    state.guild.prestige += 1;
    state.guild.records.regionsExplored += 1;
    return reportAction(state, `${region.name} explored. The guild found new routes and resources.`, now, true);
  }
  if (state.guild.level < region.minGuildLevel) return reportAction(state, `${region.name} requires guild level ${region.minGuildLevel}.`, now, false);
  if (state.guild.gold < region.cost) return reportAction(state, `Exploring ${region.name} needs ${region.cost} gold.`, now, false);
  state.guild.gold -= region.cost;
  state.regions.unlocked.push(region.id);
  return reportAction(state, `${region.name} is now open to the guild.`, now, true);
}

export function researchProject(state, projectId, now = Date.now()) {
  const project = catalogResearch(projectId);
  if (!project) return reportAction(state, 'That research project could not be found.', now, false);
  if (state.research.includes(project.id)) return reportAction(state, `${project.name} is already complete.`, now, false);
  if (state.guild.researchPoints < project.cost) return reportAction(state, `${project.name} needs ${project.cost} research points.`, now, false);
  state.guild.researchPoints -= project.cost;
  state.research.push(project.id);
  return reportAction(state, `Research complete: ${project.name}.`, now, true);
}

export function hireStaff(state, staffId, now = Date.now()) {
  const staff = catalogStaff(staffId);
  if (!staff) return reportAction(state, 'That staff role could not be found.', now, false);
  if (state.staff.includes(staff.id)) return reportAction(state, `${staff.name} already works for the guild.`, now, false);
  if (state.guild.gold < staff.cost) return reportAction(state, `Hiring ${staff.name} needs ${staff.cost} gold.`, now, false);
  state.guild.gold -= staff.cost;
  state.staff.push(staff.id);
  return reportAction(state, `${staff.name} joined the guild staff.`, now, true);
}

export function craftItem(state, itemId, now = Date.now()) {
  const recipe = CRAFTING_RECIPES[itemId];
  if (!recipe) return reportAction(state, 'That crafting recipe could not be found.', now, false);
  if (!state.research.includes('runic-craft') && itemId === 'dragon-signet') return reportAction(state, 'Dragon Signet requires Runic Craft research.', now, false);
  if (state.guild.materials < recipe.materials || state.guild.gold < recipe.gold) return reportAction(state, `Crafting needs ${recipe.materials} materials and ${recipe.gold} gold.`, now, false);
  state.guild.materials -= recipe.materials;
  state.guild.gold -= recipe.gold;
  addInventory(state, itemId, 1, now);
  state.guild.records.itemsCrafted += 1;
  return reportAction(state, `Crafted ${itemId.replaceAll('-', ' ')} and added it to the Armory.`, now, true);
}

export function supportFaction(state, factionId, now = Date.now()) {
  if (!catalogFaction(factionId)) return reportAction(state, 'That faction could not be found.', now, false);
  if (state.guild.influence < 1) return reportAction(state, 'The guild needs 1 influence to make a faction pledge.', now, false);
  state.guild.influence -= 1;
  state.factions[factionId] = Math.min(100, (state.factions[factionId] || 0) + 3);
  return reportAction(state, `The guild pledged support to ${factionId}.`, now, true);
}

export function setMode(state, modeId, now = Date.now()) {
  if (!GAME_MODES.some(mode => mode.id === modeId)) return reportAction(state, 'That game mode is unavailable.', now, false);
  state.guild.mode = modeId;
  return reportAction(state, `Game mode set to ${modeId}.`, now, true);
}

export function bootstrapFoundation(state, now = Date.now()) {
  for (const itemId of ['iron-sword', 'hunter-bow']) {
    if (!guildOwnsItem(state, itemId)) addInventory(state, itemId, 1, now);
  }
  return state;
}

function guildOwnsItem(state, itemId) {
  return state.inventory.some(item => item.itemId === itemId)
    || state.heroes.some(hero => Object.values(hero.equipment || {}).includes(itemId));
}

export function recordOfflineReturn(state, previousLastSeen, activeBefore, now = Date.now()) {
  const elapsedSeconds = Math.max(0, Math.floor((now - previousLastSeen) / 1000));
  const resolvedContracts = Math.max(0, activeBefore - state.activeContracts.length);
  state.offlineSummary = { elapsedSeconds, resolvedContracts, returnedAt: now };
  if (elapsedSeconds < 30 && resolvedContracts === 0) return state;
  const awayMinutes = Math.max(1, Math.floor(elapsedSeconds / 60));
  const message = resolvedContracts > 0 ? `Welcome back. ${resolvedContracts} expedition${resolvedContracts === 1 ? '' : 's'} resolved while you were away (${awayMinutes}m).` : `Welcome back. The guild kept watch for ${awayMinutes}m.`;
  return reportAction(state, message, now, true);
}

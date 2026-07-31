import { appendLog, updateRecord } from './gameState.js';
import { ACHIEVEMENT_CATALOG, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, EVENT_CATALOG, GAME_MODES, REGION_CATALOG, RESEARCH_CATALOG, RELATIONSHIP_EVENTS, RIVAL_GUILDS, STAFF_CATALOG, TACTICAL_DRILLS, catalogAchievement, catalogChapter, catalogEncounter, catalogEvent, catalogRegion, catalogResearch, catalogRelationshipEvent, catalogRival, catalogStaff } from './content.js';
import { addInventory, findHero, heroTotalPower, trainHero } from './heroes.js';
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

export function advanceCampaign(state, now = Date.now()) {
  const chapter = catalogChapter(state.campaign.activeChapter);
  if (!chapter) return state;
  if (!chapter.requirement(state)) return setSystemMessage(state, `${chapter.title} is not ready. ${chapter.description}`, now);
  if (!state.campaign.chaptersCompleted.includes(chapter.id)) {
    state.campaign.chaptersCompleted.push(chapter.id);
    state.guild.gold += chapter.rewardGold;
    state.guild.reputation += chapter.rewardReputation;
    const next = CAMPAIGN_CHAPTERS.find(candidate => !state.campaign.chaptersCompleted.includes(candidate.id));
    state.campaign.activeChapter = next?.id || chapter.id;
    if (state.campaign.chaptersCompleted.length >= 3) awardAchievement(state, 'chapter-keeper', now);
    if (chapter.id === 'final-expedition') awardAchievement(state, 'legendary-guild', now);
    return setSystemMessage(state, `${chapter.title} completed. +${chapter.rewardGold} gold and +${chapter.rewardReputation} reputation.`, now);
  }
  return state;
}

export function challengeRival(state, rivalId, now = Date.now()) {
  const rival = catalogRival(rivalId);
  if (!rival) return state;
  if (state.guild.level < rival.requiredGuildLevel) return setSystemMessage(state, `${rival.name} requires guild level ${rival.requiredGuildLevel}.`, now);
  const rosterPower = state.heroes.reduce((total, hero) => total + heroTotalPower(hero), 0);
  const requiredPower = rival.requiredGuildLevel * 30;
  state.rivals[rivalId] ||= { victories: 0, defeats: 0, reputation: 0 };
  const result = rosterPower >= requiredPower;
  if (result) {
    state.rivals[rivalId].victories += 1;
    state.rivals[rivalId].reputation += rival.rewardReputation;
    state.guild.gold += rival.rewardGold;
    state.guild.reputation += rival.rewardReputation;
    state.guild.prestige += 2;
    awardAchievement(state, 'rival-breaker', now);
    return setSystemMessage(state, `Rival challenge won against ${rival.name}. +${rival.rewardGold} gold and +${rival.rewardReputation} reputation.`, now);
  }
  state.rivals[rivalId].defeats += 1;
  state.guild.reputation = Math.max(0, state.guild.reputation - 1);
  return setSystemMessage(state, `${rival.name} won the challenge. The guild lost 1 reputation but learned from the defeat.`, now);
}

export function runTacticalDrill(state, drillId, heroIds = [], now = Date.now()) {
  return runCombatEncounter(state, drillId, heroIds, now);
}

export function runCombatEncounter(state, encounterId, heroIds = [], now = Date.now()) {
  const encounter = catalogEncounter(encounterId);
  const party = heroIds.map(heroId => findHero(state, heroId)).filter(Boolean).filter(hero => hero.status === 'idle');
  if (!encounter) return state;
  if (!party.length) return setSystemMessage(state, 'Choose at least one idle hero for the tactical drill.', now);
  const weaknessClass = weaknessFor(encounter.enemy);
  let enemyHp = encounter.enemyHp;
  let rounds = 0;
  let stunned = false;
  let marked = false;
  const transcript = [];
  state.tactical.drillsCompleted += 1;
  for (let round = 1; round <= encounter.rounds && enemyHp > 0; round += 1) {
    rounds = round;
    let roundDamage = 0;
    for (const hero of party) {
      const power = heroTotalPower(hero);
      let damage = Math.max(2, Math.floor(power * 0.22));
      if (hero.className === weaknessClass) damage += 6;
      if (hero.className === 'Warrior') { hero.statusEffects = ['guarding']; damage += 2; }
      if (hero.className === 'Ranger') { marked = true; hero.statusEffects = ['marked-target']; damage += 3; }
      if (hero.className === 'Mage') { hero.statusEffects = ['burning']; damage += 5; }
      if (hero.className === 'Guardian') { stunned = round % 2 === 1; hero.statusEffects = ['taunting']; damage += 1; }
      if (hero.className === 'Rogue') { hero.statusEffects = ['evasive']; damage += round === 1 ? 8 : 2; }
      roundDamage += damage;
    }
    if (marked) roundDamage += 3;
    enemyHp = Math.max(0, enemyHp - roundDamage);
    transcript.push(`Round ${round}: the party dealt ${roundDamage} damage${enemyHp === 0 ? ' and broke the enemy line.' : '.'}`);
    if (enemyHp <= 0) break;
    if (!stunned) {
      const target = party[round % party.length];
      const damage = Math.max(1, encounter.enemyAttack - (party.some(hero => hero.className === 'Guardian') ? 4 : 0));
      target.morale = Math.max(0, (target.morale || 75) - 2);
      if (encounter.enemy === 'spiders' && round === 2) target.statusEffects = ['poisoned'];
      transcript.push(`Round ${round}: ${encounter.enemy} struck ${target.name} for ${damage} pressure.`);
    } else {
      transcript.push(`Round ${round}: the guardian’s taunt interrupted the enemy.`);
    }
    stunned = false;
  }
  const success = enemyHp <= 0;
  state.combat.rounds += rounds;
  state.combat.lastEncounter = { id: encounter.id, name: encounter.name, result: success ? 'victory' : 'defeat', rounds, transcript };
  if (success) {
    state.tactical.encountersWon += 1;
    state.combat.victories += 1;
    state.guild.gold += encounter.rewardGold;
    state.guild.materials += encounter.rewardMaterials;
    state.guild.prestige += 1;
    party.forEach(hero => { hero.morale = Math.min(100, (hero.morale || 75) + 5); });
    awardAchievement(state, 'first-blood', now);
    if (state.tactical.encountersWon >= 5) awardAchievement(state, 'tactical-veteran', now);
    party.forEach(hero => { hero.statusEffects = []; });
    return setSystemMessage(state, `${encounter.name} won in ${rounds} rounds. The party exploited the ${weaknessClass} counter and earned rewards.`, now);
  }
  state.tactical.encountersLost += 1;
  state.combat.defeats += 1;
  party.forEach(hero => { hero.morale = Math.max(0, (hero.morale || 75) - 4); });
  return setSystemMessage(state, `${encounter.name} lost after ${rounds} rounds. Study the enemy weakness and improve the party before trying again.`, now);
}

export function bondHeroes(state, firstHeroId, secondHeroId, now = Date.now()) {
  const first = findHero(state, firstHeroId);
  const second = findHero(state, secondHeroId);
  if (!first || !second || first.id === second.id) return state;
  if (first.status !== 'idle' || second.status !== 'idle') return setSystemMessage(state, 'Both heroes must be idle to build a relationship.', now);
  const event = RELATIONSHIP_EVENTS[state.guild.day % RELATIONSHIP_EVENTS.length];
  first.relationships[second.id] = Math.min(100, (first.relationships[second.id] || 0) + event.bond);
  second.relationships[first.id] = Math.min(100, (second.relationships[first.id] || 0) + event.bond);
  first.morale = Math.min(100, (first.morale || 75) + event.morale);
  second.morale = Math.min(100, (second.morale || 75) + event.morale);
  state.relationshipEvents.push({ id: `relationship-${now}`, heroIds: [first.id, second.id], eventId: event.id, createdDay: state.guild.day });
  state.relationshipEvents = state.relationshipEvents.slice(-8);
  awardAchievement(state, 'bond-forged', now);
  return setSystemMessage(state, `${event.title}: ${first.name} and ${second.name} grew closer.`, now);
}

export function recordOfflineReturn(state, previousLastSeen, activeBefore, now = Date.now()) {
  const elapsedSeconds = Math.max(0, Math.floor((now - previousLastSeen) / 1000));
  const resolvedContracts = Math.max(0, activeBefore - state.activeContracts.length);
  state.offlineSummary = { elapsedSeconds, resolvedContracts, returnedAt: now };
  if (elapsedSeconds >= 30 || resolvedContracts > 0) {
    const awayMinutes = Math.max(1, Math.floor(elapsedSeconds / 60));
    const message = resolvedContracts > 0 ? `Welcome back. ${resolvedContracts} expedition${resolvedContracts === 1 ? '' : 's'} resolved while you were away (${awayMinutes}m).` : `Welcome back. The guild kept watch for ${awayMinutes}m.`;
    state.statusMessage = message;
    appendLog(state, message, now);
  }
  return state;
}

export function bootstrapFoundation(state, now = Date.now()) {
  if (!state.inventory.length) addInventory(state, 'iron-sword', 1, now);
  if (!state.inventory.some(item => item.itemId === 'hunter-bow')) addInventory(state, 'hunter-bow', 1, now);
  return state;
}

export { ACHIEVEMENT_CATALOG, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, EVENT_CATALOG, GAME_MODES, REGION_CATALOG, RESEARCH_CATALOG, RELATIONSHIP_EVENTS, RIVAL_GUILDS, STAFF_CATALOG, TACTICAL_DRILLS, buyItem, upgradeRoom };

function maybeCreateEvent(state, now) {
  if (state.events.length >= 2 || state.guild.day < 2) return;
  const available = EVENT_CATALOG.filter(event => !state.events.some(active => active.eventId === event.id));
  if (!available.length || state.guild.day % 2 !== 0) return;
  const event = available[state.guild.day % available.length];
  state.events.push({ id: `event-${state.guild.day}`, eventId: event.id, createdDay: state.guild.day });
  appendLog(state, `Guild event: ${event.title}.`, now);
}

function setSystemMessage(state, message, now) { state.statusMessage = message; appendLog(state, message, now); return state; }
function weaknessFor(enemy) { return { goblins: 'Warrior', spiders: 'Mage', elementals: 'Rogue', undead: 'Cleric' }[enemy] || 'Ranger'; }
function awardAchievement(state, achievementId, now) {
  if (!catalogAchievement(achievementId) || state.achievements.includes(achievementId)) return state;
  state.achievements.push(achievementId);
  appendLog(state, `Achievement unlocked: ${catalogAchievement(achievementId).name}.`, now);
  return state;
}

import { appendLog, updateRecord } from './gameState.js';
import { catalogFaction } from './content.js';
import { addInventory, findHero, heroTotalPower, levelHero } from './heroes.js';
import { markAction, reportAction } from './actionResult.js';
import { CONTRACT_CATALOG, catalogContract } from './contractCatalog.js';

export const CONTRACTS = CONTRACT_CATALOG;

export function isContractUnlocked(state, contract) {
  const requirements = contractUnlockRequirements(contract);
  const regionUnlocked = !contract.region || state.regions?.unlocked?.includes(contract.region);
  const legendaryResearch = contract.tier !== 'Legendary' || state.research?.includes('legend-seeking');
  return state.guild.level >= requirements.minGuildLevel
    && state.guild.reputation >= requirements.minReputation
    && regionUnlocked
    && legendaryResearch;
}

export function contractUnlockRequirements(contract) {
  return { minGuildLevel: contract.minGuildLevel || 1, minReputation: contract.minReputation ?? 0 };
}

export function contractUnlockProgress(state, contract) {
  const requirements = contractUnlockRequirements(contract);
  if (requirements.minReputation > 0) {
    const base = `Locked. Guild level: ${state.guild.level} / ${requirements.minGuildLevel}. Reputation: ${state.guild.reputation} / ${requirements.minReputation}.`;
    const extras = [];
    if (contract.region && !state.regions?.unlocked?.includes(contract.region)) extras.push(`${contract.region.replaceAll('-', ' ')} region`);
    if (contract.tier === 'Legendary' && !state.research?.includes('legend-seeking')) extras.push('Legend-Seeking research');
    return extras.length ? `${base} Also requires ${extras.join(' and ')}.` : base;
  }
  const missing = [];
  if (state.guild.level < requirements.minGuildLevel) missing.push(`guild level ${state.guild.level}/${requirements.minGuildLevel}`);
  if (state.guild.reputation < requirements.minReputation) missing.push(`reputation ${state.guild.reputation}/${requirements.minReputation}`);
  if (contract.region && !state.regions?.unlocked?.includes(contract.region)) missing.push(`${contract.region.replaceAll('-', ' ')} region`);
  if (contract.tier === 'Legendary' && !state.research?.includes('legend-seeking')) missing.push('Legend-Seeking research');
  return missing.length ? `Locked until ${missing.join(', ')}.` : 'Locked by guild progression.';
}

export function contractLockMessage(state, contract) { return `${contract.name} is locked. ${contractUnlockProgress(state, contract)}`; }
export function nextContractUnlock(state) { return CONTRACTS.find(contract => !isContractUnlocked(state, contract)) || null; }

export function calculateSuccessChance(heroPower, requiredPower) {
  const raw = Math.round((heroPower / Math.max(requiredPower, 1)) * 70);
  return Math.max(10, Math.min(95, raw));
}

export function canAssignHero(state, heroId) {
  const hero = findHero(state, heroId);
  if (!hero) return { allowed: false, reason: 'Hero not found.' };
  if (hero.status !== 'idle' || state.activeContracts.some(active => active.heroId === heroId)) return { allowed: false, reason: `${hero.name} is already assigned to a contract.` };
  return { allowed: true, reason: 'Hero is available.' };
}

export function startContract(state, heroId, contractId, now = Date.now(), idFactory = defaultIdFactory) {
  const hero = findHero(state, heroId);
  const contract = catalogContract(contractId);
  const assignment = canAssignHero(state, heroId);
  if (!hero || !contract) return reportAction(state, 'Contract could not be started because the hero or contract was unavailable.', now, false);
  if (!assignment.allowed) return reportAction(state, assignment.reason, now, false);
  if (!isContractUnlocked(state, contract)) return reportAction(state, contractLockMessage(state, contract), now, false);
  hero.status = 'on_contract';
  state.activeContracts.push({ id: uniqueActiveId(state, idFactory(now)), heroId, contractId, startedAt: now, completesAt: now + contract.durationSeconds * 1000 });
  return reportAction(state, `${hero.name} started ${contract.name}.`, now, true);
}

export function resolveContracts(state, now = Date.now(), random = Math.random) {
  const remaining = [];
  const resolvedIds = new Set();
  for (const active of state.activeContracts) {
    if (!active || resolvedIds.has(active.id)) continue;
    resolvedIds.add(active.id);
    if (!Number.isFinite(active.completesAt) || active.completesAt > now) { remaining.push(active); continue; }
    const hero = findHero(state, active.heroId);
    const contract = catalogContract(active.contractId);
    if (!hero || !contract) { if (hero) hero.status = 'idle'; continue; }
    const chance = calculateSuccessChance(heroTotalPower(hero), contract.requiredPower);
    const roll = Math.floor(clampRandom(random()) * 100) + 1;
    const success = roll <= chance;
    const challengingAssignment = heroTotalPower(hero) <= contract.requiredPower;
    hero.status = 'idle';
    if (success) resolveSuccess(state, hero, contract, challengingAssignment, random, now);
    else resolveFailure(state, hero, contract, now);
  }
  state.activeContracts = remaining;
  return state;
}

export function activeContractDetails(state, active) { return { hero: findHero(state, active.heroId), contract: catalogContract(active.contractId) }; }

function resolveSuccess(state, hero, contract, challengingAssignment, random, now) {
  const reputationBefore = state.guild.reputation;
  const rewardMultiplier = state.guild.mode === 'challenge' ? 1.25 : 1;
  const gold = Math.round(contract.rewardGold * rewardMultiplier);
  state.guild.gold += gold;
  state.guild.reputation += contract.rewardReputation;
  state.guild.materials += contract.rewardMaterials || 0;
  state.guild.totalGoldEarned += gold;
  state.guild.contractsCompleted += 1;
  state.guild.prestige += contract.tier === 'Legendary' ? 4 : 1;
  const trainingBonus = (state.rooms?.['training-yard'] || 1) > 1 || state.staff.includes('trainer') || state.research.includes('advanced-training') ? 1 : 0;
  const powerGain = levelHero(hero, challengingAssignment ? 1 + trainingBonus : trainingBonus, random);
  updateRecord(state, 'highestHeroLevel', hero.level);
  if (contract.tier === 'Legendary') { state.guild.records.legendaryClears += 1; if (contract.boss) state.guild.records.bossesDefeated += 1; }
  if (contract.rewardItem) addInventory(state, contract.rewardItem, 1, now);
  const faction = catalogFaction(contract.faction);
  if (contract.faction) state.factions[contract.faction] = Math.min(100, (state.factions[contract.faction] || 0) + 2 + (state.research.includes('diplomatic-charters') ? 1 : 0));
  state.statusMessage = `${hero.name} completed ${contract.name}.`;
  markAction(state, true, state.statusMessage);
  const messages = [`${hero.name} completed ${contract.name}. +${gold} gold, +${contract.rewardReputation} reputation, +${powerGain} power${challengingAssignment ? ' (including +1 challenging assignment bonus)' : ''}.`];
  if (contract.rewardItem) messages.push(`${contract.rewardItem} recovered and added to the Armory.`);
  if (faction) messages.push(`${faction.name} standing improved.`);
  messages.push(...progressMilestoneMessages(state, hero, contract, reputationBefore));
  appendMessages(state, messages, now);
}

function resolveFailure(state, hero, contract, now) {
  state.guild.gold += contract.failureGold;
  state.guild.totalGoldEarned += contract.failureGold;
  state.guild.contractsFailed += 1;
  hero.morale = Math.max(0, (hero.morale ?? 75) - 8);
  if (contract.tier === 'Legendary' && state.guild.mode === 'ironman') hero.injuries = [...(hero.injuries || []), 'Severe expedition injury'];
  state.statusMessage = `${hero.name} failed ${contract.name}.`;
  markAction(state, false, state.statusMessage);
  const messages = [`${hero.name} failed ${contract.name}. +${contract.failureGold} gold recovered.`, `${hero.name}'s morale fell after the setback.`];
  if (state.guild.contractsFailed === 1) messages.push('Guild milestone: the guild survived its first failed contract.');
  appendMessages(state, messages, now);
}

function progressMilestoneMessages(state, hero, contract, reputationBefore) {
  const messages = [];
  for (const candidate of CONTRACTS) {
    const requirements = contractUnlockRequirements(candidate);
    if (requirements.minReputation > 0 && reputationBefore < requirements.minReputation && state.guild.reputation >= requirements.minReputation) {
      messages.push(isContractUnlocked(state, candidate) ? `Contract milestone: ${candidate.name} unlocked.` : `Reputation milestone: ${requirements.minReputation} reached for ${candidate.name}.`);
    }
  }
  if (hero.level % 5 === 0) messages.push(`Hero milestone: ${hero.name} reached level ${hero.level}.`);
  if (contract.id === 'ogre-toll-road') messages.push('Prototype victory: Ogre Toll Road cleared. The current guild progression path is complete.');
  return messages;
}

function appendMessages(state, messages, timestamp) { for (let index = messages.length - 1; index >= 0; index -= 1) appendLog(state, messages[index], timestamp); }
function clampRandom(value) { return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.999999; }
function defaultIdFactory(now) { return `active-${now}-${Math.random().toString(16).slice(2)}`; }
function uniqueActiveId(state, candidate) {
  const base = typeof candidate === 'string' && candidate ? candidate : `active-${Date.now()}`;
  let id = base; let suffix = 1;
  while (state.activeContracts.some(active => active.id === id)) { id = `${base}-${suffix}`; suffix += 1; }
  return id;
}

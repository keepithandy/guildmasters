import { appendLog } from './gameState.js';
import { findHero, levelHero } from './heroes.js';

export const CONTRACTS = [
  { id: 'rat-extermination', name: 'Rat Extermination', tier: 'Common', minGuildLevel: 1, durationSeconds: 60, requiredPower: 10, rewardGold: 20, rewardReputation: 1, failureGold: 5 },
  { id: 'supply-escort', name: 'Supply Escort', tier: 'Common', minGuildLevel: 2, durationSeconds: 120, requiredPower: 20, rewardGold: 40, rewardReputation: 2, failureGold: 10 },
  { id: 'goblin-cleanup', name: 'Goblin Cleanup', tier: 'Common', minGuildLevel: 3, durationSeconds: 180, requiredPower: 30, rewardGold: 60, rewardReputation: 3, failureGold: 15 },
  { id: 'ogre-toll-road', name: 'Ogre Toll Road', tier: 'Uncommon', minGuildLevel: 4, durationSeconds: 240, requiredPower: 42, rewardGold: 95, rewardReputation: 5, failureGold: 24 }
];

export function isContractUnlocked(state, contract) {
  return state.guild.level >= (contract.minGuildLevel || 1);
}

export function nextContractUnlock(state) {
  return CONTRACTS.find(contract => !isContractUnlocked(state, contract)) || null;
}

export function calculateSuccessChance(heroPower, requiredPower) {
  const raw = Math.round((heroPower / Math.max(requiredPower, 1)) * 70);
  return Math.max(10, Math.min(95, raw));
}

export function canAssignHero(state, heroId) {
  const hero = findHero(state, heroId);
  if (!hero) return { allowed: false, reason: 'Hero not found.' };
  if (hero.status !== 'idle' || state.activeContracts.some(active => active.heroId === heroId)) {
    return { allowed: false, reason: `${hero.name} is already assigned to a contract.` };
  }
  return { allowed: true, reason: 'Hero is available.' };
}

export function startContract(state, heroId, contractId, now = Date.now(), idFactory = defaultIdFactory) {
  const hero = findHero(state, heroId);
  const contract = CONTRACTS.find(item => item.id === contractId);
  const assignment = canAssignHero(state, heroId);

  if (!hero || !contract) {
    state.statusMessage = 'Contract could not be started because the hero or contract was unavailable.';
    appendLog(state, state.statusMessage, now);
    return state;
  }
  if (!assignment.allowed) {
    state.statusMessage = assignment.reason;
    appendLog(state, assignment.reason, now);
    return state;
  }
  if (!isContractUnlocked(state, contract)) {
    state.statusMessage = `${contract.name} is locked until guild level ${contract.minGuildLevel}.`;
    appendLog(state, state.statusMessage, now);
    return state;
  }

  hero.status = 'on_contract';
  state.activeContracts.push({
    id: idFactory(now),
    heroId,
    contractId,
    startedAt: now,
    completesAt: now + contract.durationSeconds * 1000
  });
  state.statusMessage = `${hero.name} started ${contract.name}.`;
  appendLog(state, state.statusMessage, now);
  return state;
}

export function resolveContracts(state, now = Date.now(), random = Math.random) {
  const remaining = [];
  const resolvedIds = new Set();

  for (const active of state.activeContracts) {
    if (!active || resolvedIds.has(active.id)) continue;
    resolvedIds.add(active.id);
    if (!Number.isFinite(active.completesAt) || active.completesAt > now) {
      remaining.push(active);
      continue;
    }

    const hero = findHero(state, active.heroId);
    const contract = CONTRACTS.find(item => item.id === active.contractId);
    if (!hero || !contract) continue;

    const chance = calculateSuccessChance(hero.power, contract.requiredPower);
    const roll = Math.floor(clampRandom(random()) * 100) + 1;
    const success = roll <= chance;
    hero.status = 'idle';

    if (success) {
      state.guild.gold += contract.rewardGold;
      state.guild.reputation += contract.rewardReputation;
      state.guild.totalGoldEarned += contract.rewardGold;
      state.guild.contractsCompleted += 1;
      levelHero(hero, random);
      state.statusMessage = `${hero.name} completed ${contract.name}.`;
      appendLog(state, `${state.statusMessage} +${contract.rewardGold} gold, +${contract.rewardReputation} reputation.`, now);
    } else {
      state.guild.gold += contract.failureGold;
      state.guild.totalGoldEarned += contract.failureGold;
      state.guild.contractsFailed += 1;
      state.statusMessage = `${hero.name} failed ${contract.name}.`;
      appendLog(state, `${state.statusMessage} +${contract.failureGold} gold recovered.`, now);
    }
  }

  state.activeContracts = remaining;
  state.lastSeenAt = Math.max(0, now);
  return state;
}

export function activeContractDetails(state, active) {
  return {
    hero: findHero(state, active.heroId),
    contract: CONTRACTS.find(item => item.id === active.contractId)
  };
}

function clampRandom(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.999999;
}

function defaultIdFactory(now) {
  return `active-${now}-${Math.random().toString(16).slice(2)}`;
}

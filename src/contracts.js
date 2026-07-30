import { appendLog } from './gameState.js';
import { findHero, levelHero } from './heroes.js';

export const CONTRACTS = [
  {
    id: 'rat-extermination',
    name: 'Rat Extermination',
    tier: 'Common',
    minGuildLevel: 1,
    durationSeconds: 60,
    requiredPower: 10,
    rewardGold: 20,
    rewardReputation: 1,
    failureGold: 5
  },
  {
    id: 'supply-escort',
    name: 'Supply Escort',
    tier: 'Common',
    minGuildLevel: 2,
    durationSeconds: 120,
    requiredPower: 20,
    rewardGold: 40,
    rewardReputation: 2,
    failureGold: 10
  },
  {
    id: 'goblin-cleanup',
    name: 'Goblin Cleanup',
    tier: 'Common',
    minGuildLevel: 3,
    durationSeconds: 180,
    requiredPower: 30,
    rewardGold: 60,
    rewardReputation: 3,
    failureGold: 15
  },
  {
    id: 'ogre-toll-road',
    name: 'Ogre Toll Road',
    tier: 'Uncommon',
    minGuildLevel: 4,
    minReputation: 6,
    durationSeconds: 240,
    requiredPower: 42,
    rewardGold: 95,
    rewardReputation: 5,
    failureGold: 24
  }
];

export function isContractUnlocked(state, contract) {
  const requirements = contractUnlockRequirements(contract);
  return state.guild.level >= requirements.minGuildLevel
    && state.guild.reputation >= requirements.minReputation;
}

export function contractUnlockRequirements(contract) {
  return {
    minGuildLevel: contract.minGuildLevel || 1,
    minReputation: contract.minReputation ?? 0
  };
}

export function contractUnlockProgress(state, contract) {
  const requirements = contractUnlockRequirements(contract);

  if (requirements.minReputation === 0) {
    return `Locked until guild level ${requirements.minGuildLevel}.`;
  }

  return `Locked. Guild level: ${state.guild.level} / ${requirements.minGuildLevel}. Reputation: ${state.guild.reputation} / ${requirements.minReputation}.`;
}

export function contractLockMessage(state, contract) {
  const requirements = contractUnlockRequirements(contract);

  if (requirements.minReputation === 0) {
    return `${contract.name} is locked until guild level ${requirements.minGuildLevel}.`;
  }

  return `${contract.name} is locked. Guild level: ${state.guild.level} / ${requirements.minGuildLevel}. Reputation: ${state.guild.reputation} / ${requirements.minReputation}.`;
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
    state.statusMessage = contractLockMessage(state, contract);
    appendLog(state, state.statusMessage, now);
    return state;
  }

  hero.status = 'on_contract';
  state.activeContracts.push({
    id: uniqueActiveId(state, idFactory(now)),
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
    if (!hero || !contract) {
      if (hero) hero.status = 'idle';
      continue;
    }

    const chance = calculateSuccessChance(hero.power, contract.requiredPower);
    const roll = Math.floor(clampRandom(random()) * 100) + 1;
    const success = roll <= chance;
    const challengingAssignment = hero.power <= contract.requiredPower;
    hero.status = 'idle';

    if (success) {
      const reputationBefore = state.guild.reputation;
      state.guild.gold += contract.rewardGold;
      state.guild.reputation += contract.rewardReputation;
      state.guild.totalGoldEarned += contract.rewardGold;
      state.guild.contractsCompleted += 1;
      const powerGain = levelHero(hero, challengingAssignment ? 1 : 0, random);
      state.statusMessage = `${hero.name} completed ${contract.name}.`;
      const completionMessage = `${hero.name} completed ${contract.name}. +${contract.rewardGold} gold, +${contract.rewardReputation} reputation, +${powerGain} power${challengingAssignment ? ' (including +1 challenging assignment bonus)' : ''}.`;
      const milestoneMessages = progressMilestoneMessages(state, hero, contract, reputationBefore);
      appendMessages(state, [completionMessage, ...milestoneMessages], now);
    } else {
      state.guild.gold += contract.failureGold;
      state.guild.totalGoldEarned += contract.failureGold;
      state.guild.contractsFailed += 1;
      state.statusMessage = `${hero.name} failed ${contract.name}.`;
      const failureMessage = `${hero.name} failed ${contract.name}. +${contract.failureGold} gold recovered.`;
      const milestoneMessages = state.guild.contractsFailed === 1
        ? ['Guild milestone: the guild survived its first failed contract.']
        : [];
      appendMessages(state, [failureMessage, ...milestoneMessages], now);
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

function uniqueActiveId(state, candidate) {
  const base = typeof candidate === 'string' && candidate ? candidate : `active-${Date.now()}`;
  let id = base;
  let suffix = 1;
  while (state.activeContracts.some(active => active.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function appendMessages(state, messages, timestamp) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    appendLog(state, messages[index], timestamp);
  }
}

function progressMilestoneMessages(state, hero, contract, reputationBefore) {
  const messages = [];

  for (const candidate of CONTRACTS) {
    const requirements = contractUnlockRequirements(candidate);
    if (requirements.minReputation > 0
      && reputationBefore < requirements.minReputation
      && state.guild.reputation >= requirements.minReputation) {
      messages.push(isContractUnlocked(state, candidate)
        ? `Contract milestone: ${candidate.name} unlocked.`
        : `Reputation milestone: ${requirements.minReputation} reached for ${candidate.name}.`);
    }
  }

  if (hero.level % 5 === 0) {
    messages.push(`Hero milestone: ${hero.name} reached level ${hero.level}.`);
  }

  if (contract.id === 'ogre-toll-road') {
    messages.push('Prototype victory: Ogre Toll Road cleared. The current guild progression path is complete.');
  }

  return messages;
}

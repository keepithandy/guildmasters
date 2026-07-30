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

export function startContract(state, heroId, contractId, now = Date.now()) {
  const hero = findHero(state, heroId);
  const contract = CONTRACTS.find(item => item.id === contractId);

  if (!hero || !contract || hero.status !== 'idle') {
    state.log.unshift('Contract could not be started.');
    return state;
  }

  if (!isContractUnlocked(state, contract)) {
    state.log.unshift(contractLockMessage(state, contract));
    return state;
  }

  hero.status = 'on_contract';
  state.activeContracts.push({
    id: `active-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    heroId,
    contractId,
    startedAt: now,
    completesAt: now + contract.durationSeconds * 1000
  });
  state.log.unshift(`${hero.name} started ${contract.name}.`);
  return state;
}

export function resolveContracts(state, now = Date.now()) {
  const remaining = [];

  for (const active of state.activeContracts) {
    if (active.completesAt > now) {
      remaining.push(active);
      continue;
    }

    const hero = findHero(state, active.heroId);
    const contract = CONTRACTS.find(item => item.id === active.contractId);

    if (!hero || !contract) continue;

    const chance = calculateSuccessChance(hero.power, contract.requiredPower);
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= chance;
    const challengingAssignment = hero.power <= contract.requiredPower;

    hero.status = 'idle';

    if (success) {
      const reputationBefore = state.guild.reputation;
      state.guild.gold += contract.rewardGold;
      state.guild.reputation += contract.rewardReputation;
      state.guild.totalGoldEarned += contract.rewardGold;
      state.guild.contractsCompleted += 1;
      const powerGain = levelHero(hero, challengingAssignment ? 1 : 0);
      const completionMessage = `${hero.name} completed ${contract.name}. +${contract.rewardGold} gold, +${contract.rewardReputation} reputation, +${powerGain} power${challengingAssignment ? ' (including +1 challenging assignment bonus)' : ''}.`;
      const milestoneMessages = progressMilestoneMessages(state, hero, contract, reputationBefore);
      state.log.unshift(completionMessage, ...milestoneMessages);
    } else {
      state.guild.gold += contract.failureGold;
      state.guild.totalGoldEarned += contract.failureGold;
      state.guild.contractsFailed += 1;
      const failureMessage = `${hero.name} failed ${contract.name}. +${contract.failureGold} gold recovered.`;
      const milestoneMessages = state.guild.contractsFailed === 1
        ? ['Guild milestone: the guild survived its first failed contract.']
        : [];
      state.log.unshift(failureMessage, ...milestoneMessages);
    }
  }

  state.activeContracts = remaining;
  state.lastSeenAt = now;
  return state;
}

export function activeContractDetails(state, active) {
  const hero = findHero(state, active.heroId);
  const contract = CONTRACTS.find(item => item.id === active.contractId);
  return { hero, contract };
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

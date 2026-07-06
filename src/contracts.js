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
    durationSeconds: 240,
    requiredPower: 42,
    rewardGold: 95,
    rewardReputation: 5,
    failureGold: 24
  }
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

export function startContract(state, heroId, contractId, now = Date.now()) {
  const hero = findHero(state, heroId);
  const contract = CONTRACTS.find(item => item.id === contractId);

  if (!hero || !contract || hero.status !== 'idle') {
    state.log.unshift('Contract could not be started.');
    return state;
  }

  if (!isContractUnlocked(state, contract)) {
    state.log.unshift(`${contract.name} is locked until guild level ${contract.minGuildLevel}.`);
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

    hero.status = 'idle';

    if (success) {
      state.guild.gold += contract.rewardGold;
      state.guild.reputation += contract.rewardReputation;
      state.guild.totalGoldEarned += contract.rewardGold;
      state.guild.contractsCompleted += 1;
      levelHero(hero);
      state.log.unshift(`${hero.name} completed ${contract.name}. +${contract.rewardGold} gold, +${contract.rewardReputation} reputation.`);
    } else {
      state.guild.gold += contract.failureGold;
      state.guild.totalGoldEarned += contract.failureGold;
      state.guild.contractsFailed += 1;
      state.log.unshift(`${hero.name} failed ${contract.name}. +${contract.failureGold} gold recovered.`);
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

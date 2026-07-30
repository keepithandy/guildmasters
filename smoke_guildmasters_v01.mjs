import assert from 'node:assert/strict';

import { CONTRACTS, contractUnlockProgress, isContractUnlocked, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, repairGameState } from './src/gameState.js';
import { upgradeGuild } from './src/guild.js';
import { recruitHero, recruitPowerBonus } from './src/heroes.js';

const originalRandom = Math.random;

try {
  Math.random = () => 0;

  let state = createNewGameState(1000);
  assert.equal(state.guild.gold, 100, 'new guild starts with starter gold');
  assert.equal(state.heroes.length, 0, 'new guild starts without heroes');
  assert.equal(recruitPowerBonus(state), 0, 'level 1 recruits have no guild bonus');
  assert.equal(isContractUnlocked(state, CONTRACTS[0]), true, 'first contract is unlocked at level 1');
  assert.equal(isContractUnlocked(state, CONTRACTS[1]), false, 'second contract is locked at level 1');

  state = recruitHero(state);
  assert.equal(state.heroes.length, 1, 'recruiting adds one hero');
  assert.equal(state.heroes[0].status, 'idle', 'new hero starts idle');

  const firstContract = CONTRACTS[0];
  const supplyEscort = CONTRACTS[1];
  const ogreTollRoad = CONTRACTS.find(contract => contract.id === 'ogre-toll-road');
  assert.ok(ogreTollRoad, 'Ogre Toll Road exists as the Uncommon progression contract');
  assert.equal(ogreTollRoad.minReputation, 6, 'Ogre Toll Road requires the combined reputation of the prior Common contracts');
  state.guild.reputation = 999;
  assert.equal(isContractUnlocked(state, supplyEscort), false, 'level-only contracts remain locked below their guild-level requirement regardless of reputation');
  state.guild.level = 2;
  state.guild.reputation = 0;
  assert.equal(isContractUnlocked(state, supplyEscort), true, 'level-only contracts remain unlocked without reputation');
  state.guild.level = 1;
  state.heroes[0].power = 999;
  state = startContract(state, state.heroes[0].id, firstContract.id, 2000);
  assert.equal(state.activeContracts.length, 1, 'starting a contract adds active contract');
  assert.equal(state.heroes[0].status, 'on_contract', 'hero enters contract state');

  state = resolveContracts(state, 2000 + firstContract.durationSeconds * 1000 + 1);
  assert.equal(state.activeContracts.length, 0, 'completed contract is removed from active contracts');
  assert.equal(state.heroes[0].status, 'idle', 'hero returns to idle after resolution');
  assert.equal(state.guild.contractsCompleted, 1, 'successful contract increments completed count');
  assert.equal(state.guild.reputation, firstContract.rewardReputation, 'successful contract grants its existing reputation reward');
  assert.ok(state.guild.gold >= firstContract.rewardGold, 'successful contract pays gold');
  assert.ok(state.log.some((entry) => entry.includes('completed')), 'success creates a readable log entry');

  const reputationAfterSuccess = state.guild.reputation;
  state = resolveContracts(state, 2000 + firstContract.durationSeconds * 1000 + 2);
  assert.equal(state.guild.reputation, reputationAfterSuccess, 'resolving an already completed contract does not grant reputation twice');

  let failedState = createNewGameState(3000);
  failedState.heroes.push({
    id: 'failing-hero',
    name: 'Failing Hero',
    className: 'Warrior',
    level: 1,
    power: 1,
    status: 'idle'
  });
  failedState = startContract(failedState, 'failing-hero', firstContract.id, 3000);
  Math.random = () => 0.99;
  const reputationBeforeFailure = failedState.guild.reputation;
  failedState = resolveContracts(failedState, 3000 + firstContract.durationSeconds * 1000 + 1);
  assert.equal(failedState.guild.reputation, reputationBeforeFailure, 'failed contracts grant zero reputation');
  Math.random = () => 0;

  let reputationGateState = createNewGameState(4000);
  reputationGateState.heroes.push({
    id: 'gate-hero',
    name: 'Gate Hero',
    className: 'Warrior',
    level: 1,
    power: 999,
    status: 'idle'
  });
  reputationGateState.guild.level = 3;
  reputationGateState.guild.reputation = 6;
  assert.equal(isContractUnlocked(reputationGateState, ogreTollRoad), false, 'Ogre Toll Road remains locked below guild level 4 with enough reputation');
  reputationGateState.guild.level = 4;
  reputationGateState.guild.reputation = 5;
  assert.equal(isContractUnlocked(reputationGateState, ogreTollRoad), false, 'Ogre Toll Road remains locked below 6 reputation at guild level 4');
  assert.match(contractUnlockProgress(reputationGateState, ogreTollRoad), /Guild level: 4 \/ 4\. Reputation: 5 \/ 6\./, 'reputation-gated progress names both requirements');
  reputationGateState = startContract(reputationGateState, 'gate-hero', ogreTollRoad.id, 4000);
  assert.equal(reputationGateState.activeContracts.length, 0, 'direct start cannot activate a reputation-locked contract');
  assert.equal(reputationGateState.heroes[0].status, 'idle', 'reputation-locked start leaves the hero idle');
  reputationGateState.guild.reputation = 6;
  assert.equal(isContractUnlocked(reputationGateState, ogreTollRoad), true, 'Ogre Toll Road unlocks at guild level 4 with 6 reputation');

  state.guild.gold = 999;
  const previousLevel = state.guild.level;
  state = upgradeGuild(state);
  assert.equal(state.guild.level, previousLevel + 1, 'guild upgrade increases level');
  assert.equal(isContractUnlocked(state, CONTRACTS[1]), true, 'level 2 unlocks second contract');
  assert.equal(recruitPowerBonus(state), 2, 'guild level improves future recruit power');
  assert.ok(state.log.some((entry) => entry.includes('New contract unlocked')), 'upgrade logs contract unlock milestone');

  const reputationUpgradeState = createNewGameState(5000);
  reputationUpgradeState.guild.level = 3;
  reputationUpgradeState.guild.gold = 999;
  reputationUpgradeState.guild.reputation = 5;
  upgradeGuild(reputationUpgradeState);
  assert.equal(reputationUpgradeState.guild.level, 4, 'guild upgrade reaches Ogre Toll Road level requirement');
  assert.equal(reputationUpgradeState.log.some(entry => entry.includes('New contract unlocked: Ogre Toll Road.')), false, 'guild upgrade does not falsely claim a reputation-locked contract unlocked');

  const repaired = repairGameState(JSON.parse(JSON.stringify(state)));
  assert.equal(repaired.guild.level, state.guild.level, 'repair preserves guild level');
  assert.equal(repaired.guild.reputation, state.guild.reputation, 'repair preserves valid reputation');
  assert.ok(repaired.log.length > 0, 'repair preserves readable guild log');

  const missingReputation = repairGameState({ guild: { level: 1 } });
  assert.equal(missingReputation.guild.reputation, 0, 'repair defaults missing reputation to zero');
  const negativeReputation = repairGameState({ guild: { reputation: -1 } });
  assert.equal(negativeReputation.guild.reputation, 0, 'repair defaults negative reputation to zero');

  console.log('Guildmasters smoke passed.');
} finally {
  Math.random = originalRandom;
}

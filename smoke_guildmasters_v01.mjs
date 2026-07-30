import assert from 'node:assert/strict';
import fs from 'node:fs';

import { CONTRACTS, calculateSuccessChance, canAssignHero, contractUnlockProgress, isContractUnlocked, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, MAX_LOG_ENTRIES, repairGameState, SAVE_SCHEMA_VERSION } from './src/gameState.js';
import { upgradeGuild } from './src/guild.js';
import { recruitHero, recruitPowerBonus } from './src/heroes.js';
import { nextActionGuidance, rankHeroesForContract } from './src/ui.js';

const originalRandom = Math.random;
const logMessage = entry => typeof entry === 'string' ? entry : entry?.message || '';
const logMessages = state => state.log.map(logMessage);

try {
  Math.random = () => 0;

  let state = createNewGameState(1000);
  assert.equal(state.saveVersion, SAVE_SCHEMA_VERSION, 'new saves use the current schema');
  assert.equal(state.guild.gold, 100, 'new guild starts with starter gold');
  assert.equal(state.heroes.length, 0, 'new guild starts without heroes');
  assert.equal(recruitPowerBonus(state), 0, 'level 1 recruits have no guild bonus');
  assert.equal(isContractUnlocked(state, CONTRACTS[0]), true, 'first contract is unlocked at level 1');
  assert.equal(isContractUnlocked(state, CONTRACTS[1]), false, 'second contract is locked at level 1');
  assert.equal(nextActionGuidance(state), 'Next action: recruit your first hero.', 'new guild guidance recommends recruitment');

  state = recruitHero(state);
  assert.equal(state.heroes.length, 1, 'recruiting adds one hero');
  assert.equal(state.heroes[0].status, 'idle', 'new hero starts idle');
  assert.equal(nextActionGuidance(state), 'Next action: assign an idle hero to Rat Extermination.', 'idle hero guidance recommends the highest unlocked contract');

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
  assert.ok(state.log.some(entry => logMessage(entry).includes('completed')), 'success creates a readable log entry');

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
  assert.equal(failedState.heroes[0].level, 1, 'failed contracts do not level the assigned hero');
  assert.equal(failedState.heroes[0].power, 1, 'failed contracts do not increase hero power');
  assert.equal(failedState.log.filter(entry => logMessage(entry).includes('first failed contract')).length, 1, 'the first failure creates one guild milestone');
  failedState = resolveContracts(failedState, 3000 + firstContract.durationSeconds * 1000 + 2);
  assert.equal(failedState.log.filter(entry => logMessage(entry).includes('first failed contract')).length, 1, 'an already resolved failure cannot duplicate its milestone');
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
  assert.ok(state.log.some(entry => logMessage(entry).includes('New contract unlocked')), 'upgrade logs contract unlock milestone');

  const reputationUpgradeState = createNewGameState(5000);
  reputationUpgradeState.guild.level = 3;
  reputationUpgradeState.guild.gold = 999;
  reputationUpgradeState.guild.reputation = 5;
  upgradeGuild(reputationUpgradeState);
  assert.equal(reputationUpgradeState.guild.level, 4, 'guild upgrade reaches Ogre Toll Road level requirement');
  assert.equal(reputationUpgradeState.log.some(entry => logMessage(entry).includes('New contract unlocked: Ogre Toll Road.')), false, 'guild upgrade does not falsely claim a reputation-locked contract unlocked');

  const rankingInput = [
    { id: 'tie-first', power: 14 },
    { id: 'lower-chance', power: 9 },
    { id: 'tie-second', power: 20 }
  ];
  const rankedHeroes = rankHeroesForContract(rankingInput, firstContract);
  assert.deepEqual(rankedHeroes.map(hero => hero.id), ['tie-first', 'tie-second', 'lower-chance'], 'assignment ranking orders heroes by displayed success chance and preserves tied roster order');
  assert.deepEqual(rankingInput.map(hero => hero.id), ['tie-first', 'lower-chance', 'tie-second'], 'assignment ranking does not mutate roster order');

  const upgradeGuidanceState = createNewGameState(6000);
  upgradeGuidanceState.guild.gold = 150;
  upgradeGuidanceState.heroes.push({
    id: 'upgrade-guide',
    name: 'Upgrade Guide',
    className: 'Warrior',
    level: 1,
    power: 10,
    status: 'idle'
  });
  assert.equal(nextActionGuidance(upgradeGuidanceState), 'Next action: upgrade the guild to level 2.', 'affordable guild progression is recommended before another assignment');

  const reputationGuidanceState = createNewGameState(6100);
  reputationGuidanceState.guild.level = 4;
  reputationGuidanceState.guild.reputation = 5;
  reputationGuidanceState.heroes.push({
    id: 'reputation-guide',
    name: 'Reputation Guide',
    className: 'Ranger',
    level: 1,
    power: 30,
    status: 'idle'
  });
  assert.equal(nextActionGuidance(reputationGuidanceState), 'Next action: earn 1 reputation to unlock Ogre Toll Road.', 'reputation guidance names the remaining gated requirement');

  const waitGuidanceState = createNewGameState(6200);
  waitGuidanceState.heroes.push({
    id: 'busy-guide',
    name: 'Busy Guide',
    className: 'Mage',
    level: 1,
    power: 10,
    status: 'on_contract'
  });
  waitGuidanceState.activeContracts.push({
    id: 'active-guidance',
    heroId: 'busy-guide',
    contractId: firstContract.id,
    startedAt: 6200,
    completesAt: 6200 + firstContract.durationSeconds * 1000
  });
  assert.equal(nextActionGuidance(waitGuidanceState), 'Next action: wait for an active contract to finish.', 'busy-guild guidance recommends waiting for active work');

  let challengingGrowthState = createNewGameState(7000);
  challengingGrowthState.heroes.push({
    id: 'challenging-growth',
    name: 'Challenging Growth',
    className: 'Warrior',
    level: 1,
    power: firstContract.requiredPower,
    status: 'idle'
  });
  challengingGrowthState = startContract(challengingGrowthState, 'challenging-growth', firstContract.id, 7000);
  challengingGrowthState = resolveContracts(challengingGrowthState, 7000 + firstContract.durationSeconds * 1000 + 1);
  assert.equal(challengingGrowthState.heroes[0].level, 2, 'a successful challenging assignment levels the hero');
  assert.equal(challengingGrowthState.heroes[0].power, firstContract.requiredPower + 3, 'a successful assignment at required power grants base growth plus one bonus power');
  assert.ok(challengingGrowthState.log.some(entry => logMessage(entry).includes('including +1 challenging assignment bonus')), 'challenging growth is explained in the completion log');

  let standardGrowthState = createNewGameState(7100);
  standardGrowthState.heroes.push({
    id: 'standard-growth',
    name: 'Standard Growth',
    className: 'Warrior',
    level: 1,
    power: firstContract.requiredPower + 1,
    status: 'idle'
  });
  standardGrowthState = startContract(standardGrowthState, 'standard-growth', firstContract.id, 7100);
  standardGrowthState = resolveContracts(standardGrowthState, 7100 + firstContract.durationSeconds * 1000 + 1);
  assert.equal(standardGrowthState.heroes[0].power, firstContract.requiredPower + 3, 'an overpowered successful assignment keeps the existing base growth');
  assert.equal(standardGrowthState.log.some(entry => logMessage(entry).includes('challenging assignment bonus')), false, 'standard growth does not claim the challenging bonus');

  let unlockedMilestoneState = createNewGameState(8000);
  unlockedMilestoneState.guild.level = 4;
  unlockedMilestoneState.guild.reputation = 5;
  unlockedMilestoneState.heroes.push({
    id: 'unlock-milestone',
    name: 'Unlock Milestone',
    className: 'Ranger',
    level: 1,
    power: 99,
    status: 'idle'
  });
  unlockedMilestoneState = startContract(unlockedMilestoneState, 'unlock-milestone', firstContract.id, 8000);
  unlockedMilestoneState = resolveContracts(unlockedMilestoneState, 8000 + firstContract.durationSeconds * 1000 + 1);
  assert.ok(logMessages(unlockedMilestoneState).includes('Contract milestone: Ogre Toll Road unlocked.'), 'reaching the final requirement logs an actual contract unlock');

  let reputationMilestoneState = createNewGameState(8100);
  reputationMilestoneState.guild.level = 3;
  reputationMilestoneState.guild.reputation = 5;
  reputationMilestoneState.heroes.push({
    id: 'reputation-milestone',
    name: 'Reputation Milestone',
    className: 'Mage',
    level: 1,
    power: 99,
    status: 'idle'
  });
  reputationMilestoneState = startContract(reputationMilestoneState, 'reputation-milestone', firstContract.id, 8100);
  reputationMilestoneState = resolveContracts(reputationMilestoneState, 8100 + firstContract.durationSeconds * 1000 + 1);
  assert.ok(logMessages(reputationMilestoneState).includes('Reputation milestone: 6 reached for Ogre Toll Road.'), 'reputation progress is recorded without falsely claiming a level-locked contract is unlocked');
  assert.equal(logMessages(reputationMilestoneState).includes('Contract milestone: Ogre Toll Road unlocked.'), false, 'reputation alone does not create an unlock milestone');

  let heroMilestoneState = createNewGameState(8200);
  heroMilestoneState.heroes.push({
    id: 'hero-milestone',
    name: 'Hero Milestone',
    className: 'Warrior',
    level: 4,
    power: 99,
    status: 'idle'
  });
  heroMilestoneState = startContract(heroMilestoneState, 'hero-milestone', firstContract.id, 8200);
  heroMilestoneState = resolveContracts(heroMilestoneState, 8200 + firstContract.durationSeconds * 1000 + 1);
  assert.ok(logMessages(heroMilestoneState).includes('Hero milestone: Hero Milestone reached level 5.'), 'successful growth logs five-level hero milestones');

  let ogreVictoryState = createNewGameState(8300);
  ogreVictoryState.guild.level = 4;
  ogreVictoryState.guild.reputation = 6;
  ogreVictoryState.heroes.push({
    id: 'ogre-victor',
    name: 'Ogre Victor',
    className: 'Warrior',
    level: 1,
    power: ogreTollRoad.requiredPower,
    status: 'idle'
  });
  ogreVictoryState = startContract(ogreVictoryState, 'ogre-victor', ogreTollRoad.id, 8300);
  ogreVictoryState = resolveContracts(ogreVictoryState, 8300 + ogreTollRoad.durationSeconds * 1000 + 1);
  const victoryMessage = 'Prototype victory: Ogre Toll Road cleared. The current guild progression path is complete.';
  assert.equal(ogreVictoryState.log.filter(entry => logMessage(entry) === victoryMessage).length, 1, 'a successful Ogre Toll Road completion logs the prototype victory');
  ogreVictoryState = resolveContracts(ogreVictoryState, 8300 + ogreTollRoad.durationSeconds * 1000 + 2);
  assert.equal(ogreVictoryState.log.filter(entry => logMessage(entry) === victoryMessage).length, 1, 'an already resolved Ogre contract cannot duplicate its victory message');

  let failedOgreState = createNewGameState(8400);
  failedOgreState.guild.level = 4;
  failedOgreState.guild.reputation = 6;
  failedOgreState.heroes.push({
    id: 'failed-ogre',
    name: 'Failed Ogre',
    className: 'Warrior',
    level: 1,
    power: 1,
    status: 'idle'
  });
  failedOgreState = startContract(failedOgreState, 'failed-ogre', ogreTollRoad.id, 8400);
  Math.random = () => 0.99;
  failedOgreState = resolveContracts(failedOgreState, 8400 + ogreTollRoad.durationSeconds * 1000 + 1);
  assert.equal(logMessages(failedOgreState).includes(victoryMessage), false, 'a failed Ogre Toll Road attempt does not log victory');
  Math.random = () => 0;

  const repaired = repairGameState(JSON.parse(JSON.stringify(state)));
  assert.equal(repaired.guild.level, state.guild.level, 'repair preserves guild level');
  assert.equal(repaired.guild.reputation, state.guild.reputation, 'repair preserves valid reputation');
  assert.ok(repaired.log.length > 0, 'repair preserves readable guild log');

  const missingReputation = repairGameState({ guild: { level: 1 } });
  assert.equal(missingReputation.guild.reputation, 0, 'repair defaults missing reputation to zero');
  const negativeReputation = repairGameState({ guild: { reputation: -1 } });
  assert.equal(negativeReputation.guild.reputation, 0, 'repair defaults negative reputation to zero');

  const newestFirstLog = Array.from({ length: 25 }, (_, index) => `entry-${index}`);
  const repairedLog = repairGameState({ log: newestFirstLog }).log;
  assert.equal(repairedLog.length, 25, 'repair preserves logs within the fifty-entry retention bound');
  assert.equal(repairedLog[0].message, 'entry-0', 'repair keeps the newest log entry first');
  assert.equal(repairedLog[24].message, 'entry-24', 'repair preserves the oldest entry within the bound');

  const reliabilityState = createNewGameState(9000);
  recruitHero(reliabilityState, () => 0, 9001);
  const reliabilityHeroId = reliabilityState.heroes[0].id;
  reliabilityState.heroes[0].power = 999;
  startContract(reliabilityState, reliabilityHeroId, firstContract.id, 9100, now => `active-${now}`);
  assert.equal(canAssignHero(reliabilityState, reliabilityHeroId).allowed, false, 'busy hero cannot be assigned again');
  startContract(reliabilityState, reliabilityHeroId, firstContract.id, 9101, now => `active-${now}`);
  assert.equal(reliabilityState.activeContracts.length, 1, 'rapid or stale assignment does not duplicate a contract');
  assert.match(reliabilityState.statusMessage, /already assigned/, 'blocked assignment has a readable reason');

  const beforeDue = repairGameState(JSON.parse(JSON.stringify(reliabilityState)), 9200);
  const dueAt = beforeDue.activeContracts[0].completesAt;
  assert.equal(beforeDue.activeContracts.length, 1, 'future contract survives reload');
  resolveContracts(beforeDue, dueAt - 1, () => 0);
  assert.equal(beforeDue.activeContracts.length, 1, 'contract does not resolve before its absolute deadline');
  resolveContracts(beforeDue, dueAt + 1, () => 0);
  const goldAfterReliabilitySuccess = beforeDue.guild.gold;
  resolveContracts(beforeDue, dueAt + 2, () => 0);
  assert.equal(beforeDue.guild.gold, goldAfterReliabilitySuccess, 'resolved contract cannot duplicate rewards');
  assert.equal(calculateSuccessChance(10, 10), 70, 'success threshold remains unchanged');

  const legacy = JSON.parse(JSON.stringify(beforeDue));
  delete legacy.saveVersion;
  const repairedLegacy = repairGameState(legacy, 9300);
  assert.equal(repairedLegacy.saveVersion, SAVE_SCHEMA_VERSION, 'legacy save is upgraded in memory');
  assert.equal(repairedLegacy.guild.level, beforeDue.guild.level, 'legacy repair preserves progress');
  const future = repairGameState({ saveVersion: SAVE_SCHEMA_VERSION + 1, guild: { gold: 9999 } }, 9400);
  assert.equal(future.guild.gold, 100, 'future save is rejected safely');
  assert.match(future.statusMessage, /newer than this build/, 'future rejection is readable');

  const malformed = repairGameState({ saveVersion: SAVE_SCHEMA_VERSION, log: [null, 'valid', { message: 'newer', timestamp: 9 }, { message: 'older', timestamp: 2 }], heroes: [] }, 9500);
  assert.equal(malformed.log[0].message, 'newer', 'timestamped log repair orders newest events first');
  for (let index = 0; index < MAX_LOG_ENTRIES + 20; index += 1) {
    malformed.log.push({ id: `x-${index}`, timestamp: index, message: `event ${index}` });
  }
  assert.equal(repairGameState(malformed, 9600).log.length, MAX_LOG_ENTRIES, 'log retention is bounded');

  const uiSource = fs.readFileSync('src/ui.js', 'utf8');
  assert.match(uiSource, /aria-live="polite"/, 'status changes use a polite live region');
  assert.match(uiSource, /No heroes yet/, 'empty roster copy is explicit');
  assert.match(uiSource, /No idle heroes/, 'blocked contract copy is explicit');
  const mobileCss = fs.readFileSync('mobile.css', 'utf8');
  assert.match(mobileCss, /min-height: 44px/, 'touch targets meet the mobile contract');
  assert.match(mobileCss, /overflow-x: hidden/, 'narrow layouts prevent horizontal overflow');

  console.log('Guildmasters v0.2 reliability and progression smoke passed.');
} finally {
  Math.random = originalRandom;
}

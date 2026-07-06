import assert from 'node:assert/strict';

import { CONTRACTS, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, repairGameState } from './src/gameState.js';
import { upgradeGuild } from './src/guild.js';
import { recruitHero } from './src/heroes.js';

const originalRandom = Math.random;

try {
  Math.random = () => 0;

  let state = createNewGameState(1000);
  assert.equal(state.guild.gold, 100, 'new guild starts with starter gold');
  assert.equal(state.heroes.length, 0, 'new guild starts without heroes');

  state = recruitHero(state);
  assert.equal(state.heroes.length, 1, 'recruiting adds one hero');
  assert.equal(state.heroes[0].status, 'idle', 'new hero starts idle');

  const firstContract = CONTRACTS[0];
  state.heroes[0].power = 999;
  state = startContract(state, state.heroes[0].id, firstContract.id, 2000);
  assert.equal(state.activeContracts.length, 1, 'starting a contract adds active contract');
  assert.equal(state.heroes[0].status, 'on_contract', 'hero enters contract state');

  state = resolveContracts(state, 2000 + firstContract.durationSeconds * 1000 + 1);
  assert.equal(state.activeContracts.length, 0, 'completed contract is removed from active contracts');
  assert.equal(state.heroes[0].status, 'idle', 'hero returns to idle after resolution');
  assert.equal(state.guild.contractsCompleted, 1, 'successful contract increments completed count');
  assert.ok(state.guild.gold >= firstContract.rewardGold, 'successful contract pays gold');
  assert.ok(state.log.some((entry) => entry.includes('completed')), 'success creates a readable log entry');

  state.guild.gold = 999;
  const previousLevel = state.guild.level;
  state = upgradeGuild(state);
  assert.equal(state.guild.level, previousLevel + 1, 'guild upgrade increases level');
  assert.ok(state.log.some((entry) => entry.includes('Guild upgraded')), 'upgrade creates a log entry');

  const repaired = repairGameState(JSON.parse(JSON.stringify(state)));
  assert.equal(repaired.guild.level, state.guild.level, 'repair preserves guild level');
  assert.ok(repaired.log.length > 0, 'repair preserves readable guild log');

  console.log('Guildmasters smoke passed.');
} finally {
  Math.random = originalRandom;
}

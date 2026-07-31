import assert from 'node:assert/strict';

import { CONTRACTS, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, repairGameState } from './src/gameState.js';
import { upgradeRoom } from './src/guild.js';
import { recruitHero } from './src/heroes.js';
import { ROOM_CATALOG } from './src/content.js';
import { advanceDay, craftItem, exploreRegion, hireStaff, researchProject } from './src/systems.js';

const originalRandom = Math.random;
try {
  Math.random = () => 0;
  let state = createNewGameState(1000);
  assert.equal(state.saveVersion, 4, 'new games use the v1.2 schema');
  assert.equal(ROOM_CATALOG.length, 9, 'guildhall catalog exposes the planned room system');
  assert.ok(CONTRACTS.some(contract => contract.tier === 'Elite'), 'elite contracts are wired');
  assert.ok(CONTRACTS.some(contract => contract.tier === 'Legendary'), 'legendary contracts are wired');

  state = recruitHero(state, Math.random, 1100);
  assert.equal(state.heroes[0].skills.length, 2, 'recruits receive class skills');
  assert.equal(state.heroes[0].traits.length, 1, 'recruits receive a trait');

  state.guild.gold = 9999;
  state = upgradeRoom(state, 'training-yard', 1200);
  assert.equal(state.rooms['training-yard'], 1, 'first room level is already represented safely');
  state = upgradeRoom(state, 'training-yard', 1201);
  assert.equal(state.rooms['training-yard'], 2, 'guild rooms can be upgraded');

  state.guild.level = 9;
  state.guild.reputation = 100;
  state.regions.unlocked = ['frontier', 'greenwood', 'ashen-mountains', 'old-kingdom', 'forbidden-depths'];
  state.research.push('legend-seeking');
  state = startContract(state, state.heroes[0].id, CONTRACTS[0].id, 1300, now => `active-${now}`);
  state = resolveContracts(state, 1300 + CONTRACTS[0].durationSeconds * 1000 + 1, Math.random);
  assert.equal(state.guild.contractsCompleted, 1, 'expanded state still resolves contracts');
  assert.ok(state.guild.materials > 0, 'successful contracts award crafting materials');
  state.heroes[0].power = 999;
  state = startContract(state, state.heroes[0].id, 'ogre-toll-road', 1400, now => `active-${now}`);
  state = resolveContracts(state, 1400 + 240000 + 1, Math.random);
  assert.ok(state.inventory.length > 0, 'successful progression stores equipment');

  state.guild.gold = 9999;
  state.guild.materials = 99;
  state.guild.researchPoints = 99;
  state = exploreRegion(state, 'greenwood', 1600);
  assert.ok(state.regions.explored.includes('greenwood'), 'regions can be explored');
  state = researchProject(state, 'field-medicine', 1401);
  assert.ok(state.research.includes('field-medicine'), 'research projects can be completed');
  state = hireStaff(state, 'quartermaster', 1402);
  assert.ok(state.staff.includes('quartermaster'), 'guild staff can be hired');
  state = craftItem(state, 'iron-sword', 1403);
  assert.ok(state.guild.records.itemsCrafted >= 1, 'workshop crafting updates records');
  state = advanceDay(state, 1500);
  assert.equal(state.guild.day, 2, 'advancing a day advances the campaign clock');
  assert.ok(state.guild.researchPoints >= 1, 'library research generates daily points');

  const repaired = repairGameState(JSON.parse(JSON.stringify(state)), 1600);
  assert.equal(repaired.rooms['training-yard'], 2, 'v1.0 repair preserves room progression');
  assert.deepEqual(repaired.research, state.research, 'v1.0 repair preserves research');
  assert.deepEqual(repaired.staff, state.staff, 'v1.0 repair preserves staff');
  assert.ok(repaired.guild.records.itemsCrafted >= 1, 'v1.0 repair preserves records');
  console.log('Guildmasters v1.0 roadmap systems smoke passed.');
} finally {
  Math.random = originalRandom;
}

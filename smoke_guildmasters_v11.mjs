import assert from 'node:assert/strict';

import { createNewGameState, repairGameState } from './src/gameState.js';
import { recruitHero } from './src/heroes.js';
import { advanceCampaign, challengeRival, recordOfflineReturn, runTacticalDrill } from './src/systems.js';

const originalRandom = Math.random;
try {
  Math.random = () => 0;
  let state = createNewGameState(1000);
  state.guild.gold = 9999;
  state.guild.level = 6;
  state.guild.reputation = 60;
  state.guild.contractsCompleted = 1;
  state.guild.prestige = 10;
  state.guild.records.bossesDefeated = 1;
  state.heroes.push({ id: 'hero-a', name: 'Alden', className: 'Warrior', level: 3, power: 60, status: 'idle', morale: 80, equipment: {}, skills: [], traits: [], injuries: [] });
  state.heroes.push({ id: 'hero-b', name: 'Mira', className: 'Mage', level: 3, power: 60, status: 'idle', morale: 80, equipment: {}, skills: [], traits: [], injuries: [] });

  state = advanceCampaign(state, 1100);
  assert.ok(state.campaign.chaptersCompleted.includes('small-beginning'), 'campaign chapters can be completed');
  assert.equal(state.campaign.activeChapter, 'frontier-trouble', 'campaign advances to the next chapter');

  state = challengeRival(state, 'silver-company', 1200);
  assert.equal(state.rivals['silver-company'].victories, 1, 'rival victories are recorded');
  assert.ok(state.guild.prestige > 10, 'rival victories add prestige');

  state = runTacticalDrill(state, 'goblin-skirmish', ['hero-a', 'hero-b'], 1300);
  assert.equal(state.tactical.encountersWon, 1, 'tactical drills resolve with a party');
  assert.ok(state.guild.materials > 0, 'tactical drills award materials');

  state.activeContracts.push({ id: 'away-contract', heroId: 'hero-a', contractId: 'rat-extermination', startedAt: 1000, completesAt: 1050 });
  const before = state.activeContracts.length;
  state = recordOfflineReturn(state, 1000, before, 120000);
  assert.equal(state.offlineSummary.elapsedSeconds, 119, 'offline summary records elapsed time');
  assert.equal(state.offlineSummary.resolvedContracts, 0, 'offline summary does not invent resolutions');
  assert.match(state.statusMessage, /Welcome back/, 'offline return is announced');

  const repaired = repairGameState(JSON.parse(JSON.stringify(state)), 130000);
  assert.deepEqual(repaired.campaign, state.campaign, 'save repair preserves campaign progress');
  assert.deepEqual(repaired.rivals, state.rivals, 'save repair preserves rival records');
  assert.deepEqual(repaired.tactical, state.tactical, 'save repair preserves tactical records');
  assert.deepEqual(repaired.offlineSummary, state.offlineSummary, 'save repair preserves offline summary');
  console.log('Guildmasters v1.1 campaign, rival, tactical, and offline smoke passed.');
} finally {
  Math.random = originalRandom;
}

import assert from 'node:assert/strict';

import { createNewGameState, repairGameState } from './src/gameState.js';
import { advanceDay, challengeBoss, makeStoryChoice } from './src/systems.js';

let state = createNewGameState(1000);
state.guild.level = 9;
state.guild.reputation = 100;
state.guild.gold = 9999;
state.regions.unlocked = ['frontier', 'greenwood', 'ashen-mountains', 'old-kingdom', 'forbidden-depths'];
state.heroes.push({ id: 'ranger', name: 'Sable', className: 'Ranger', level: 8, power: 999, status: 'idle', morale: 90, traits: [], skills: [], equipment: {}, injuries: [], statusEffects: [], relationships: {} });
state.heroes.push({ id: 'guardian', name: 'Borin', className: 'Guardian', level: 8, power: 999, status: 'idle', morale: 90, traits: [], skills: [], equipment: {}, injuries: [], statusEffects: [], relationships: {} });

state = challengeBoss(state, 'dragon-below', ['ranger', 'guardian'], 1100);
assert.ok(state.bosses.defeated.includes('dragon-below'), 'unique multi-phase bosses can be defeated');
assert.equal(state.guild.records.bossesDefeated, 1, 'boss defeat updates guild records');
assert.equal(state.combat.lastEncounter.result, 'victory', 'boss victory stores a combat result');
assert.ok(state.combat.lastEncounter.transcript.some(line => line.includes('Worldfire')), 'boss transcript names unique phase mechanics');
assert.ok(state.achievements.includes('boss-slayer'), 'boss victories award the boss achievement');

state.campaign.chaptersCompleted.push('frontier-trouble');
state = makeStoryChoice(state, 'frontier-alliance', 'rangers', 1200);
assert.ok(state.campaign.decisionsMade.includes('frontier-alliance'), 'story choices are recorded');
assert.equal(state.flags['ranger-ally'], true, 'story choices set route flags');
assert.ok((state.factions.rangers || 0) >= 4, 'story choices affect faction standing');

const reputationBeforePressure = state.guild.reputation;
for (let index = 0; index < 5; index += 1) state = advanceDay(state, 1300 + index);
assert.ok(state.rivals['silver-company'], 'rival pressure creates rival state');
assert.ok(state.rivals['silver-company'].lastAction === 'rumor-campaign' || state.guild.reputation < reputationBeforePressure, 'rivals can take pressure actions over time');

const repaired = repairGameState(JSON.parse(JSON.stringify(state)), 1400);
assert.deepEqual(repaired.bosses, state.bosses, 'save repair preserves boss records');
assert.deepEqual(repaired.campaign, state.campaign, 'save repair preserves story decisions');
assert.deepEqual(repaired.rivals, state.rivals, 'save repair preserves rival behavior state');
assert.equal(repaired.worldThreat, state.worldThreat, 'save repair preserves world threat');
console.log('Guildmasters v1.3 boss, story, and rival-depth smoke passed.');

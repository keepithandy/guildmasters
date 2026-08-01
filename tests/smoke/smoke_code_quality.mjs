import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolveContracts } from '../../src/contracts.js';
import { MAX_LOG_ENTRIES, appendLog, createNewGameState, repairGameState } from '../../src/gameState.js';
import { recruitHero } from '../../src/heroes.js';
import { validateCatalogs, validateGameState } from '../../src/invariants.js';
import { advanceDay, chooseEvent, runCombatEncounter, supportFaction } from '../../src/systems.js';

function testHero(id, overrides = {}) {
  return { id, name: id, className: 'Warrior', level: 1, power: 1, experience: 0, morale: 75, status: 'idle', traits: [], skills: [], equipment: { weapon: '', offhand: '', armor: '', charm: '' }, injuries: [], statusEffects: [], relationships: {}, personalGoal: 'Test the guild.', ...overrides };
}

let state = createNewGameState(1000);
assert.deepEqual(validateCatalogs(), [], 'authored catalogs contain no stale cross-references');
state.heroes.push(testHero('zero-morale', { morale: 0 }));
state = advanceDay(state, 1100);
assert.equal(state.heroes[0].morale, 1, 'daily recovery treats zero morale as a real value');
assert.match(fs.readFileSync('src/ui.js', 'utf8'), /hero\.morale \?\? 75/, 'UI displays zero morale instead of replacing it with 75');

state = createNewGameState(1200);
state.heroes.push(testHero('defeated', { className: 'Mage', morale: 0 }));
state = runCombatEncounter(state, 'goblin-skirmish', ['defeated'], 1300);
assert.equal(state.combat.lastEncounter.result, 'defeat', 'fixture reaches the combat-defeat path');
assert.deepEqual(state.heroes[0].statusEffects, [], 'temporary combat effects clear after defeat');
assert.equal(state.heroes[0].morale, 0, 'combat defeat does not revive zero morale');

state = createNewGameState(1400);
state.guild.gold = 59;
state.events.push({ id: 'arcane-test', eventId: 'arcane-warning', createdDay: 2 });
state = chooseEvent(state, 'arcane-warning', 'research', 1500, () => 0);
assert.equal(state.guild.gold, 59, 'unaffordable event choices do not partially spend gold');
assert.equal(state.guild.researchPoints, 0, 'unaffordable event choices do not grant rewards');
assert.equal(state.events.length, 1, 'unaffordable event choices remain available');
assert.equal(state.lastAction.ok, false, 'unaffordable event choices report failure');

state.guild.influence = 1;
state = supportFaction(state, 'retired-faction', 1600);
assert.equal(state.guild.influence, 1, 'unknown factions cannot consume influence');
assert.equal(state.factions['retired-faction'], undefined, 'unknown factions cannot create stale state');
assert.equal(state.lastAction.ok, false, 'unknown faction actions report failure');

state = createNewGameState(1700);
state.guild.gold = 1000;
state = recruitHero(state, () => 0, 1800);
state = recruitHero(state, () => 0, 1800);
assert.equal(new Set(state.heroes.map(hero => hero.id)).size, 2, 'recruitment resolves deterministic id collisions');

state.lastSeenAt = 1900;
state = resolveContracts(state, 9999);
assert.equal(state.lastSeenAt, 1900, 'contract polling does not claim persistence timestamps');

state.log = Array.from({ length: MAX_LOG_ENTRIES }, (_, index) => ({ id: `existing-${index}`, timestamp: index, message: `Entry ${index}` }));
appendLog(state, 'First capped entry', 2000);
appendLog(state, 'Second capped entry', 2000);
assert.equal(new Set(state.log.map(entry => entry.id)).size, state.log.length, 'capped activity logs retain unique ids');

const damaged = createNewGameState(2000);
damaged.guild.mode = 'retired-mode';
damaged.guild.identity = 'Retired Identity';
damaged.guild.heroCapacity = 1;
damaged.heroes = [testHero('repair-a', { status: 'on_contract', statusEffects: ['burning'], relationships: { ghost: 50 } })];
damaged.activeContracts = [{ id: 'stale-active', heroId: 'repair-a', contractId: 'retired-contract', startedAt: 2000, completesAt: 3000 }];
damaged.rooms = { 'main-hall': 999, 'retired-room': 5 };
damaged.inventory = [
  { id: 'same-id', itemId: 'iron-sword', quantity: 1, acquiredAt: 1 },
  { id: 'same-id', itemId: 'hunter-bow', quantity: 1, acquiredAt: 2 },
  { id: 'zero-item', itemId: 'shadow-dagger', quantity: 0, acquiredAt: 2 },
  { id: 'stale-item', itemId: 'retired-item', quantity: 1, acquiredAt: 3 }
];
damaged.research = ['contract-lore', 'contract-lore', 'retired-research'];
damaged.staff = ['trainer', 'retired-staff'];
damaged.factions = { crown: 5, retired: 50 };
damaged.regions = { unlocked: ['retired-region'], explored: ['retired-region'] };
damaged.events = [{ id: 'stale-event', eventId: 'retired-event', createdDay: 2 }];
damaged.campaign = { chaptersCompleted: ['small-beginning'], activeChapter: 'small-beginning', decisionsMade: ['frontier-alliance', 'retired-decision'] };
damaged.rivals = { retired: { victories: 1 } };
damaged.bosses = { defeated: ['retired-boss'], attempts: { 'retired-boss': 1 } };
damaged.achievements = ['first-blood', 'retired-achievement'];
damaged.relationshipEvents = [{ id: 'retired-relationship', heroIds: ['repair-a', 'ghost'], eventId: 'retired-event', createdDay: 2 }];

const repaired = repairGameState(damaged, 2100);
assert.equal(repaired.activeContracts.length, 0, 'save repair removes stale contract references');
assert.equal(repaired.rooms['main-hall'], 5, 'save repair clamps room levels to catalog limits');
assert.equal(repaired.guild.heroCapacity, 7, 'save repair derives room capacity from the repaired room level');
assert.equal(repaired.heroes[0].status, 'idle', 'save repair reconciles hero assignment status');
assert.deepEqual(repaired.heroes[0].statusEffects, [], 'save repair clears temporary combat effects');
assert.deepEqual(repaired.research, ['contract-lore'], 'save repair deduplicates and filters research');
assert.deepEqual(repaired.regions, { unlocked: ['frontier'], explored: [] }, 'save repair restores required regions and removes stale ones');
assert.equal(new Set(repaired.inventory.map(item => item.id)).size, repaired.inventory.length, 'save repair produces unique inventory ids');
assert.equal(repaired.inventory.some(item => item.itemId === 'shadow-dagger'), false, 'save repair drops nonpositive inventory stacks');
assert.equal(repaired.campaign.activeChapter, 'frontier-trouble', 'save repair advances away from an already-completed active chapter');
assert.deepEqual(repaired.campaign.decisionsMade, [], 'save repair removes decisions whose prerequisite chapters are incomplete');
assert.deepEqual(validateGameState(repaired), [], 'repaired catalog state satisfies all invariants');

console.log('Guildmasters structured code-quality smoke passed.');

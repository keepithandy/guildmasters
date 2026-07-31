import assert from 'node:assert/strict';

import { createNewGameState, repairGameState } from './src/gameState.js';
import { bondHeroes, runCombatEncounter } from './src/systems.js';

let state = createNewGameState(1000);
state.heroes.push({ id: 'warrior', name: 'Alden', className: 'Warrior', level: 2, power: 60, status: 'idle', morale: 75, traits: ['Brave'], skills: ['Shield Bash'], equipment: {}, injuries: [], statusEffects: [], relationships: {} });
state.heroes.push({ id: 'mage', name: 'Mira', className: 'Mage', level: 2, power: 60, status: 'idle', morale: 75, traits: ['Curious'], skills: ['Fireball'], equipment: {}, injuries: [], statusEffects: [], relationships: {} });

state = runCombatEncounter(state, 'goblin-skirmish', ['warrior', 'mage'], 1100);
assert.equal(state.combat.victories, 1, 'multi-round combat records a victory');
assert.ok(state.combat.rounds >= 1, 'combat records rounds played');
assert.equal(state.combat.lastEncounter.result, 'victory', 'combat stores the last encounter result');
assert.ok(state.combat.lastEncounter.transcript.length > 0, 'combat stores a readable transcript');
assert.ok(state.achievements.includes('first-blood'), 'first victory awards an achievement');
assert.equal(state.heroes.every(hero => hero.statusEffects.length === 0), true, 'temporary combat effects clear after victory');

state = bondHeroes(state, 'warrior', 'mage', 1200);
assert.ok(state.heroes[0].relationships.mage > 0, 'hero bonds increase relationship strength');
assert.equal(state.relationshipEvents.length, 1, 'relationship moments are recorded');
assert.ok(state.achievements.includes('bond-forged'), 'hero bonds award an achievement');

const repaired = repairGameState(JSON.parse(JSON.stringify(state)), 1300);
assert.deepEqual(repaired.combat, state.combat, 'save repair preserves combat history');
assert.deepEqual(repaired.achievements, state.achievements, 'save repair preserves achievements');
assert.deepEqual(repaired.relationshipEvents, state.relationshipEvents, 'save repair preserves relationship moments');
assert.equal(repaired.heroes[0].relationships.mage, state.heroes[0].relationships.mage, 'save repair preserves hero bonds');
console.log('Guildmasters v1.2 combat, relationships, and achievements smoke passed.');

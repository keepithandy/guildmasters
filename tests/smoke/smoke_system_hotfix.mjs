import assert from 'node:assert/strict';

import { createNewGameState } from '../../src/gameState.js';
import { HERO_CLASS_NAMES } from '../../src/heroes.js';
import { validateGameState } from '../../src/invariants.js';
import { loadGame, resetGame, saveGame } from '../../src/saveSystem.js';
import { bootstrapFoundation, chooseEvent } from '../../src/systems.js';
import { enemyWeakness } from '../../src/systems/combat.js';

const wanderingEvent = { id: 'event-test', eventId: 'wandering-hero', createdDay: 2 };

const starterGearState = createNewGameState(900);
starterGearState.heroes.push(
  { equipment: { weapon: 'iron-sword' } },
  { equipment: { weapon: 'hunter-bow' } }
);
bootstrapFoundation(starterGearState, 950);
assert.equal(starterGearState.inventory.some(item => item.itemId === 'iron-sword'), false, 'equipped starter sword is not granted again on bootstrap');
assert.equal(starterGearState.inventory.some(item => item.itemId === 'hunter-bow'), false, 'equipped starter bow is not granted again on bootstrap');

let state = createNewGameState(1000);
state.events.push(wanderingEvent);
state = chooseEvent(state, 'wandering-hero', 'recruit', 1100, () => 0.99);
assert.equal(state.heroes.length, 1, 'wandering-hero event recruits exactly one hero');
assert.equal(state.guild.gold, 20, 'event recruitment charges its authored 80g cost once');
assert.equal(state.guild.records.heroesRecruited, 1, 'event recruitment updates permanent records');
assert.equal(state.events.length, 0, 'successful event recruitment resolves the event');
assert.equal(state.lastAction.ok, true, 'successful recruitment exposes a successful action result');

state = createNewGameState(1200);
state.guild.gold = 79;
state.events.push({ ...wanderingEvent });
state = chooseEvent(state, 'wandering-hero', 'recruit', 1300, () => 0);
assert.equal(state.heroes.length, 0, 'unaffordable event recruitment does not add a hero');
assert.equal(state.guild.gold, 79, 'unaffordable event recruitment does not charge gold');
assert.equal(state.events.length, 1, 'unaffordable event recruitment remains available');
assert.equal(state.lastAction.ok, false, 'failed recruitment exposes a failed action result');

const memoryStorage = {
  value: '',
  setItem(key, value) { this.value = `${key}:${value}`; },
  removeItem() { this.value = ''; }
};
state = createNewGameState(1400);
const saved = saveGame(state, memoryStorage, 1500);
assert.equal(saved.ok, true, 'successful persistence returns a successful result');
assert.equal(state.lastSeenAt, 1500, 'successful persistence advances last-seen time');

const failingStorage = {
  setItem() { throw new Error('quota exceeded'); },
  removeItem() { throw new Error('storage denied'); }
};
const beforeFailure = state.lastSeenAt;
const originalWarn = console.warn;
console.warn = () => {};
const failedSave = saveGame(state, failingStorage, 1600);
assert.equal(failedSave.ok, false, 'storage write exceptions become failed results');
assert.equal(state.lastSeenAt, beforeFailure, 'failed saves restore last-seen time');
const failedReset = resetGame(failingStorage, 1700);
assert.equal(failedReset.ok, false, 'storage reset exceptions become failed results');
assert.equal(failedReset.state, null, 'failed resets do not replace live state');

const inaccessibleDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
if (!inaccessibleDescriptor || inaccessibleDescriptor.configurable) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('storage getter denied'); } });
  const inaccessibleLoad = loadGame();
  const inaccessibleSave = saveGame(createNewGameState(1710));
  const inaccessibleReset = resetGame();
  assert.equal(inaccessibleLoad.lastAction.ok, false, 'storage getter failures become visible load results');
  assert.equal(inaccessibleSave.ok, false, 'storage getter failures are caught during save');
  assert.equal(inaccessibleReset.ok, false, 'storage getter failures are caught during reset');
  if (inaccessibleDescriptor) Object.defineProperty(globalThis, 'localStorage', inaccessibleDescriptor);
  else delete globalThis.localStorage;
}

const corruptLoad = loadGame({ getItem() { return '{broken-json'; } });
assert.equal(corruptLoad.lastAction.ok, false, 'corrupt JSON loads a visible recovery state');
console.warn = originalWarn;

assert.ok(HERO_CLASS_NAMES.includes('Cleric'), 'Cleric is a recruitable hero class');
assert.equal(enemyWeakness('undead'), 'Cleric', 'undead encounters use the recruitable Cleric counter');
assert.deepEqual(validateGameState(state), [], 'a normal state satisfies all invariants');
state.heroes = [{ id: 'duplicate', className: 'Warrior', equipment: {} }, { id: 'duplicate', className: 'Warrior', equipment: {} }];
assert.ok(validateGameState(state).some(error => error.includes('not unique')), 'invariant validation catches duplicate hero ids');

console.log('Guildmasters system hotfix regression smoke passed.');

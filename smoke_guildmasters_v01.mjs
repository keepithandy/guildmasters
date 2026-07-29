import assert from 'node:assert/strict';
import fs from 'node:fs';

import { CONTRACTS, calculateSuccessChance, canAssignHero, isContractUnlocked, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, MAX_LOG_ENTRIES, repairGameState, SAVE_SCHEMA_VERSION } from './src/gameState.js';
import { upgradeGuild } from './src/guild.js';
import { recruitHero, recruitPowerBonus } from './src/heroes.js';

const successRandom = () => 0;
const failureRandom = () => 0.999999;

let state = createNewGameState(1000);
assert.equal(state.saveVersion, SAVE_SCHEMA_VERSION, 'new saves use the current schema');
assert.equal(state.guild.gold, 100, 'new guild starts with starter gold');
assert.equal(recruitPowerBonus(state), 0, 'level 1 recruits have no guild bonus');
assert.equal(isContractUnlocked(state, CONTRACTS[0]), true, 'first contract is unlocked');
assert.equal(isContractUnlocked(state, CONTRACTS[1]), false, 'second contract starts locked');

state = recruitHero(state, successRandom, 1100);
assert.equal(state.heroes.length, 1, 'recruiting adds one hero');
const heroId = state.heroes[0].id;
state.heroes[0].power = 999;
state = startContract(state, heroId, CONTRACTS[0].id, 2000, now => `active-${now}`);
assert.equal(state.activeContracts.length, 1, 'starting adds one active contract');
assert.equal(canAssignHero(state, heroId).allowed, false, 'busy hero cannot be assigned again');
state = startContract(state, heroId, CONTRACTS[0].id, 2001, now => `active-${now}`);
assert.equal(state.activeContracts.length, 1, 'rapid or stale assignment does not duplicate a contract');
assert.match(state.statusMessage, /already assigned/, 'blocked assignment has a readable reason');

const beforeDue = repairGameState(JSON.parse(JSON.stringify(state)), 3000);
assert.equal(beforeDue.activeContracts.length, 1, 'future contract survives reload');
const dueAt = beforeDue.activeContracts[0].completesAt;
state = resolveContracts(beforeDue, dueAt + 1, successRandom);
assert.equal(state.activeContracts.length, 0, 'overdue contract resolves once');
assert.equal(state.guild.contractsCompleted, 1, 'success increments completed count');
assert.equal(state.heroes[0].status, 'idle', 'hero returns idle');
const goldAfterSuccess = state.guild.gold;
state = resolveContracts(state, dueAt + 2, successRandom);
assert.equal(state.guild.gold, goldAfterSuccess, 'resolved contract cannot duplicate rewards');
assert.ok(state.log.some(entry => entry.message.includes('completed')), 'success creates durable log entry');

const failureState = createNewGameState(5000);
recruitHero(failureState, successRandom, 5001);
failureState.heroes[0].power = 1;
startContract(failureState, failureState.heroes[0].id, CONTRACTS[0].id, 6000, now => `failure-${now}`);
resolveContracts(failureState, 6000 + CONTRACTS[0].durationSeconds * 1000 + 1, failureRandom);
assert.equal(failureState.guild.contractsFailed, 1, 'failure increments failed count');
assert.equal(failureState.guild.gold, 55, 'failure grants the existing partial reward after recruitment');
assert.equal(calculateSuccessChance(10, 10), 70, 'success threshold remains unchanged');

state.guild.gold = 999;
const previousLevel = state.guild.level;
upgradeGuild(state, 7000);
assert.equal(state.guild.level, previousLevel + 1, 'upgrade increases level');
assert.equal(isContractUnlocked(state, CONTRACTS[1]), true, 'level 2 unlocks second contract');
assert.ok(state.log.some(entry => entry.message.includes('New contract unlocked')), 'unlock is logged');

const legacy = { ...JSON.parse(JSON.stringify(state)) };
delete legacy.saveVersion;
const repairedLegacy = repairGameState(legacy, 8000);
assert.equal(repairedLegacy.saveVersion, SAVE_SCHEMA_VERSION, 'legacy save is upgraded in memory');
assert.equal(repairedLegacy.guild.level, state.guild.level, 'legacy repair preserves progress');
const future = repairGameState({ saveVersion: SAVE_SCHEMA_VERSION + 1, guild: { gold: 9999 } }, 9000);
assert.equal(future.guild.gold, 100, 'future save is rejected safely');
assert.match(future.statusMessage, /newer than this build/, 'future rejection is readable');

const malformed = repairGameState({ saveVersion: 1, log: [null, 'valid', { message: 'newer', timestamp: 9 }, { message: 'older', timestamp: 2 }], heroes: [] }, 10000);
assert.equal(malformed.log[0].message, 'newer', 'log ordering is newest first');
for (let i = 0; i < MAX_LOG_ENTRIES + 20; i += 1) malformed.log.push({ id: `x-${i}`, timestamp: i, message: `event ${i}` });
const bounded = repairGameState(malformed, 11000);
assert.equal(bounded.log.length, MAX_LOG_ENTRIES, 'log retention is bounded');

const uiSource = fs.readFileSync('src/ui.js', 'utf8');
assert.match(uiSource, /aria-live="polite"/, 'status changes use a polite live region');
assert.match(uiSource, /No heroes yet/, 'empty roster copy is explicit');
assert.match(uiSource, /No idle heroes/, 'blocked contract copy is explicit');
const mobileCss = fs.readFileSync('mobile.css', 'utf8');
assert.match(mobileCss, /min-height: 44px/, 'touch targets meet the mobile contract');
assert.match(mobileCss, /overflow-x: hidden/, 'narrow layouts prevent horizontal overflow');

console.log('Guildmasters reliability smoke passed.');
console.log('saveVersion=ok');
console.log('reloadTiming=ok');
console.log('doubleAssignment=ok');
console.log('deterministicResolution=ok');
console.log('logRetention=ok');
console.log('mobileAccessibility=ok');

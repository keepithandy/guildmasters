import assert from 'node:assert/strict';
import fs from 'node:fs';

import { CONTRACTS, resolveContracts, startContract } from './src/contracts.js';
import { createNewGameState, repairGameState, SAVE_SCHEMA_VERSION } from './src/gameState.js';
import { buyItem, setGuildIdentity, upgradeGuild, upgradeRoom } from './src/guild.js';
import { recruitHero, trainHero } from './src/heroes.js';
import { ACHIEVEMENT_CATALOG, BOSS_ENCOUNTERS, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, ENEMY_CATALOG, EVENT_CATALOG, FACTION_CATALOG, GAME_MODES, ITEM_CATALOG, REGION_CATALOG, RESEARCH_CATALOG, RIVAL_GUILDS, ROOM_CATALOG, STAFF_CATALOG } from './src/content.js';
import { advanceCampaign, advanceDay, bondHeroes, challengeBoss, challengeRival, chooseEvent, craftItem, exploreRegion, hireStaff, makeStoryChoice, researchProject, runCombatEncounter, setMode, supportFaction } from './src/systems.js';

const read = file => fs.readFileSync(file, 'utf8');
const roadmap = read('ROADMAP.md');
const index = read('index.html');
const sourceUi = read('src/ui.js');
const packageJson = JSON.parse(read('package.json'));

assert.equal(SAVE_SCHEMA_VERSION, 5, 'release candidate uses save schema v5');
for (let phase = 1; phase <= 22; phase += 1) assert.match(roadmap, new RegExp(`^${phase}\\.`, 'm'), `ROADMAP lists phase ${phase}`);
assert.match(index, /v2\.0\.0-rc\.\d+ release candidate/i, 'browser shell presents the release candidate');
assert.match(sourceUi, /Boss Expeditions/, 'dashboard exposes boss expeditions');
assert.equal(packageJson.scripts['smoke:roadmap'], 'node smoke_guildmasters_roadmap.mjs', 'package exposes the roadmap audit');

assert.ok(CONTRACTS.length >= 10 && new Set(CONTRACTS.map(contract => contract.tier)).size >= 4, 'phase 5 contract ladder is present');
assert.ok(ROOM_CATALOG.length >= 9, 'phase 7 guildhall catalog is present');
assert.ok(ITEM_CATALOG.length >= 8, 'phase 6 equipment catalog is present');
assert.ok(REGION_CATALOG.length >= 5, 'phase 9 region catalog is present');
assert.ok(ENEMY_CATALOG.length >= 7, 'phase 10 enemy catalog is present');
assert.ok(BOSS_ENCOUNTERS.length >= 4, 'phase 11 bespoke boss catalog is present');
assert.ok(FACTION_CATALOG.length >= 6, 'phase 12 faction catalog is present');
assert.ok(RIVAL_GUILDS.length >= 3, 'phase 14 rival catalog is present');
assert.ok(CAMPAIGN_CHAPTERS.length >= 6, 'phase 15 campaign catalog is present');
assert.ok(RESEARCH_CATALOG.length >= 6 && STAFF_CATALOG.length >= 6, 'phase 16 research and staff catalogs are present');
assert.ok(COMBAT_ENCOUNTERS.length >= 4 && ACHIEVEMENT_CATALOG.length >= 6, 'phase 17 endgame and achievement catalogs are present');
assert.equal(GAME_MODES.length, 4, 'phase 18 game modes are present');
assert.ok(EVENT_CATALOG.length >= 4, 'phase 13 dynamic event catalog is present');

let state = createNewGameState(1000);
state = recruitHero(state, () => 0, 1100);
state = recruitHero(state, () => 0.4, 1101);
assert.equal(state.heroes.length, 2, 'phase 1 recruits heroes');
state.heroes.forEach(hero => { hero.power = 999; });
state = startContract(state, state.heroes[0].id, CONTRACTS[0].id, 1200, now => `active-${now}`);
state = resolveContracts(state, 1200 + CONTRACTS[0].durationSeconds * 1000 + 1, () => 0);
assert.equal(state.guild.contractsCompleted, 1, 'phase 2 core loop resolves a contract');

state.guild.gold = 99999;
state.guild.level = 9;
state.guild.reputation = 100;
state.guild.researchPoints = 99;
state.guild.materials = 99;
state = upgradeGuild(state);
state = upgradeRoom(state, 'training-yard');
state = trainHero(state, state.heroes[0].id);
state = setGuildIdentity(state, 'Monster Hunters');
state = setMode(state, 'challenge');
assert.equal(state.guild.mode, 'challenge', 'phase 18 mode selection works');
assert.equal(state.guild.identity, 'Monster Hunters', 'phase 16 guild identity works');

state = runCombatEncounter(state, 'goblin-skirmish', state.heroes.map(hero => hero.id), 1300);
assert.ok(state.combat.lastEncounter, 'phase 3 tactical combat stores an encounter transcript');
state = bondHeroes(state, state.heroes[0].id, state.heroes[1].id, 1301);
assert.ok(state.relationshipEvents.length, 'phase 16 hero relationships create moments');

state.regions.unlocked = ['frontier'];
state = exploreRegion(state, 'greenwood', 1400);
state = researchProject(state, 'contract-lore', 1401);
state = hireStaff(state, 'quartermaster', 1402);
state = buyItem(state, ITEM_CATALOG[0], 1403);
state = craftItem(state, 'iron-sword', 1404);
assert.ok(state.regions.unlocked.includes('greenwood'), 'phase 9 region exploration works');
assert.ok(state.research.includes('contract-lore'), 'phase 16 research works');
assert.ok(state.staff.includes('quartermaster'), 'phase 16 staff hiring works');
assert.ok(state.guild.records.itemsCrafted >= 1, 'phase 6 crafting records work');

state.events.push({ id: 'audit-event', eventId: 'merchant-gift', createdDay: state.guild.day });
state = chooseEvent(state, 'merchant-gift', 'accept', 1405);
assert.equal(state.events.length, 0, 'phase 13 event choices resolve');
state.guild.influence = 1;
state = supportFaction(state, 'rangers', 1406);
assert.ok((state.factions.rangers || 0) > 0, 'phase 12 faction support works');
state = challengeRival(state, RIVAL_GUILDS[0].id, 1407);
assert.ok(state.rivals[RIVAL_GUILDS[0].id].victories >= 1, 'phase 14 rival challenges work');

state.campaign.chaptersCompleted.push('frontier-trouble');
state = makeStoryChoice(state, 'frontier-alliance', 'rangers', 1408);
assert.ok(state.campaign.decisionsMade.includes('frontier-alliance'), 'phase 15 story decisions work');
state.guild.records.bossesDefeated = 1;
state = advanceCampaign(state, 1409);
state.regions.unlocked = REGION_CATALOG.map(region => region.id);
state = challengeBoss(state, 'dragon-below', state.heroes.map(hero => hero.id), 1410);
assert.ok(state.bosses.defeated.includes('dragon-below'), 'phase 11 bespoke boss encounters work');
state = advanceDay(state, 1500);
assert.ok(state.guild.day > 1, 'phase 2 daily progression works');

const repaired = repairGameState(JSON.parse(JSON.stringify(state)), 1600);
assert.deepEqual(repaired.bosses, state.bosses, 'phase 1 save repair preserves bosses');
assert.deepEqual(repaired.campaign, state.campaign, 'phase 15 save repair preserves story routes');
assert.deepEqual(repaired.rivals, state.rivals, 'phase 14 save repair preserves rival behavior');
assert.deepEqual(repaired.combat, state.combat, 'phase 3 save repair preserves combat history');
assert.equal(repaired.guild.records.bossesDefeated, state.guild.records.bossesDefeated, 'phase 17 records persist');
console.log('Guildmasters 22-phase roadmap audit passed.');

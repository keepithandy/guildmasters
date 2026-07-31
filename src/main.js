import { resolveContracts, startContract } from './contracts.js';
import { upgradeGuild, buyItem, setGuildIdentity, upgradeRoom } from './guild.js';
import { equipItem, recruitHero, trainHero } from './heroes.js';
import { advanceCampaign, advanceDay, bondHeroes, bootstrapFoundation, challengeBoss, challengeRival, chooseEvent, craftItem, exploreRegion, hireStaff, makeStoryChoice, recordOfflineReturn, researchProject, runTacticalDrill, setMode, supportFaction } from './systems.js';
import { loadGame, resetGame, saveGame } from './saveSystem.js';
import { render } from './ui.js';
import { catalogItem } from './content.js';

let state = loadGame();
const previousLastSeen = state.lastSeenAt;
const activeContractsBeforeLoad = state.activeContracts.length;
state = bootstrapFoundation(state);
state = resolveContracts(state);
state = recordOfflineReturn(state, previousLastSeen, activeContractsBeforeLoad);
saveGame(state);

const actions = {
  recruitHero() { state = recruitHero(state); saveAndRender(); },
  startContract(heroId, contractId) { state = startContract(state, heroId, contractId); saveAndRender(); },
  upgradeGuild() { state = upgradeGuild(state); saveAndRender(); },
  upgradeRoom(roomId) { state = upgradeRoom(state, roomId); saveAndRender(); },
  advanceDay() { state = advanceDay(state); saveAndRender(); },
  advanceCampaign() { state = advanceCampaign(state); saveAndRender(); },
  makeStoryChoice(decisionId, optionId) { state = makeStoryChoice(state, decisionId, optionId); saveAndRender(); },
  challengeRival(rivalId) { state = challengeRival(state, rivalId); saveAndRender(); },
  challengeBoss(bossId) { state = challengeBoss(state, bossId, state.heroes.map(hero => hero.id)); saveAndRender(); },
  runTacticalDrill(drillId) { state = runTacticalDrill(state, drillId, state.heroes.map(hero => hero.id)); saveAndRender(); },
  bondHeroes(firstHeroId, secondHeroId) { state = bondHeroes(state, firstHeroId, secondHeroId); saveAndRender(); },
  trainHero(heroId) { state = trainHero(state, heroId); saveAndRender(); },
  equipItem(heroId, itemId) { state = equipItem(state, heroId, itemId); saveAndRender(); },
  exploreRegion(regionId) { state = exploreRegion(state, regionId); saveAndRender(); },
  researchProject(projectId) { state = researchProject(state, projectId); saveAndRender(); },
  hireStaff(staffId) { state = hireStaff(state, staffId); saveAndRender(); },
  craftItem(itemId) { state = craftItem(state, itemId); saveAndRender(); },
  buyItem(itemId) { state = buyItem(state, catalogItem(itemId)); saveAndRender(); },
  chooseEvent(eventId, optionId) { state = chooseEvent(state, eventId, optionId); saveAndRender(); },
  supportFaction(factionId) { state = supportFaction(state, factionId); saveAndRender(); },
  setGuildIdentity(identity) { state = setGuildIdentity(state, identity); saveAndRender(); },
  setMode(modeId) { state = setMode(state, modeId); saveAndRender(); },
  saveGame() { saveGame(state); state.statusMessage = 'Guild saved safely.'; render(state, actions); },
  resetGame() {
    if (!confirm('Reset Guildmasters progress?')) return;
    state = resetGame();
    state = bootstrapFoundation(state);
    saveAndRender();
  }
};

function saveAndRender() {
  state = resolveContracts(state);
  saveGame(state);
  render(state, actions);
}

setInterval(saveAndRender, 1000);
render(state, actions);

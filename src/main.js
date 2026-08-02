import { resolveContracts, startContract } from './contracts.js';
import { upgradeGuild, buyItem, setGuildIdentity, upgradeRoom } from './guild.js';
import { equipItem, recruitHero, trainHero } from './heroes.js';
import { advanceCampaign, advanceDay, bondHeroes, bootstrapFoundation, challengeBoss, challengeRival, chooseEvent, craftItem, exploreRegion, hireStaff, makeStoryChoice, recordOfflineReturn, researchProject, runTacticalDrill, setMode, supportFaction } from './systems.js';
import { loadGame, resetGame, saveGame } from './saveSystem.js';
import { initQuickNavigation } from './navigation.js';
import { render } from './ui.js';
import { catalogItem } from './content.js';
import { markAction, reportAction } from './actionResult.js';
import { createPersistenceLifecycle } from './persistenceLifecycle.js';

let state = loadGame();
const previousLastSeen = state.lastSeenAt;
const activeContractsBeforeLoad = state.activeContracts.length;
state = bootstrapFoundation(state);
state = resolveContracts(state);
state = recordOfflineReturn(state, previousLastSeen, activeContractsBeforeLoad);
saveGame(state);

const actions = {
  refresh() { render(state, actions); },
  recruitHero() { state = recruitHero(state); saveAndRender(true); },
  startContract(heroId, contractId) { state = startContract(state, heroId, contractId); saveAndRender(true); },
  upgradeGuild() { state = upgradeGuild(state); saveAndRender(true); },
  upgradeRoom(roomId) { state = upgradeRoom(state, roomId); saveAndRender(true); },
  advanceDay() { state = advanceDay(state); saveAndRender(true); },
  advanceCampaign() { state = advanceCampaign(state); saveAndRender(true); },
  makeStoryChoice(decisionId, optionId) { state = makeStoryChoice(state, decisionId, optionId); saveAndRender(true); },
  challengeRival(rivalId) { state = challengeRival(state, rivalId); saveAndRender(true); },
  challengeBoss(bossId) { state = challengeBoss(state, bossId, state.heroes.map(hero => hero.id)); saveAndRender(true); },
  runTacticalDrill(drillId) { state = runTacticalDrill(state, drillId, state.heroes.map(hero => hero.id)); saveAndRender(true); },
  bondHeroes(firstHeroId, secondHeroId) { state = bondHeroes(state, firstHeroId, secondHeroId); saveAndRender(true); },
  trainHero(heroId) { state = trainHero(state, heroId); saveAndRender(true); },
  equipItem(heroId, itemId) { state = equipItem(state, heroId, itemId); saveAndRender(true); },
  exploreRegion(regionId) { state = exploreRegion(state, regionId); saveAndRender(true); },
  researchProject(projectId) { state = researchProject(state, projectId); saveAndRender(true); },
  hireStaff(staffId) { state = hireStaff(state, staffId); saveAndRender(true); },
  craftItem(itemId) { state = craftItem(state, itemId); saveAndRender(true); },
  buyItem(itemId) { state = buyItem(state, catalogItem(itemId)); saveAndRender(true); },
  chooseEvent(eventId, optionId) { state = chooseEvent(state, eventId, optionId); saveAndRender(true); },
  supportFaction(factionId) { state = supportFaction(state, factionId); saveAndRender(true); },
  setGuildIdentity(identity) { state = setGuildIdentity(state, identity); saveAndRender(true); },
  setMode(modeId) { state = setMode(state, modeId); saveAndRender(true); },
  saveGame() {
    const result = saveAndRender(false, { force: true, render: false });
    reportAction(state, result.reason, Date.now(), result.ok);
    render(state, actions);
  },
  resetGame() {
    if (!confirm('Reset Guildmasters progress?')) return;
    const result = resetGame();
    if (!result.ok) {
      reportAction(state, result.reason, Date.now(), false);
      render(state, actions);
      return;
    }
    state = result.state;
    state = bootstrapFoundation(state);
    saveAndRender(true);
  }
};

const persistence = createPersistenceLifecycle({
  resolveState() {
    const before = state.activeContracts.length ? JSON.stringify(state) : '';
    state = resolveContracts(state);
    return { changed: before !== '' && before !== JSON.stringify(state) };
  },
  saveState() {
    const result = saveGame(state);
    if (!result.ok) {
      state.statusMessage = result.reason;
      markAction(state, false, result.reason);
    }
    return result;
  },
  renderState() {
    render(state, actions);
  }
});

function saveAndRender(markDirty = false, options = {}) {
  if (markDirty) persistence.markDirty();
  return persistence.flush(options);
}

render(state, actions);
initQuickNavigation();
persistence.start();

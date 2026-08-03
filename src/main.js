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
import { loadPreferences, tryUpdatePreferences } from './preferences.js';
import { recommendedParty, repairPartySelection } from './partySelection.js';
import { applyImportedSave, downloadPortableSave, exportPortableSave, prepareImportedSave } from './saveTransfer.js';
import { initKeyboardShortcuts } from './keyboardShortcuts.js';
import { prepareBulkTraining } from './bulkRoster.js';
import { TUTORIAL_VERSION, createTutorialState, isLastTutorialStep, moveTutorial, shouldAutoStartTutorial } from './tutorial.js';

let state = loadGame();
const initialPreferences = loadPreferences();
const uiState = { saveStatus: 'Saved', shortcutHelpOpen: false, pendingImport: null, undoPreferences: null, tutorial: shouldAutoStartTutorial(initialPreferences) ? createTutorialState() : { active: false, index: 0 } };
const previousLastSeen = state.lastSeenAt;
const activeContractsBeforeLoad = state.activeContracts.length;
state = bootstrapFoundation(state);
state = resolveContracts(state);
state = recordOfflineReturn(state, previousLastSeen, activeContractsBeforeLoad);
const initialSave = saveGame(state);
if (!initialSave.ok) uiState.saveStatus = 'Save failed';

const actions = {
  getUiState() { return uiState; },
  refresh() { render(state, actions); },
  recruitHero() { state = recruitHero(state); saveAndRender(true); },
  startContract(heroId, contractId) { state = startContract(state, heroId, contractId); saveAndRender(true); },
  upgradeGuild() { state = upgradeGuild(state); saveAndRender(true); },
  upgradeRoom(roomId) { state = upgradeRoom(state, roomId); saveAndRender(true); },
  advanceDay() { state = advanceDay(state); saveAndRender(true); },
  advanceCampaign() { state = advanceCampaign(state); saveAndRender(true); },
  makeStoryChoice(decisionId, optionId) { state = makeStoryChoice(state, decisionId, optionId); saveAndRender(true); },
  challengeRival(rivalId) { state = challengeRival(state, rivalId); saveAndRender(true); },
  challengeBoss(bossId) { state = challengeBoss(state, bossId, selectedParty()); saveAndRender(true); },
  runTacticalDrill(drillId) { state = runTacticalDrill(state, drillId, selectedParty()); saveAndRender(true); },
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
  retrySave() { saveAndRender(true); },
  exportSave() {
    const prepared = exportPortableSave(state);
    if (!prepared.ok) {
      reportAction(state, prepared.reason, Date.now(), false);
      render(state, actions);
      return;
    }
    const result = downloadPortableSave(prepared.text);
    reportAction(state, result.reason, Date.now(), result.ok);
    render(state, actions);
  },
  importSave(text) {
    const prepared = prepareImportedSave(text);
    if (!prepared.ok) {
      reportAction(state, prepared.reason, Date.now(), false);
      render(state, actions);
      return;
    }
    uiState.pendingImport = prepared;
    render(state, actions);
  },
  confirmImport() {
    const pending = uiState.pendingImport;
    if (!pending?.state) return;
    const applied = applyImportedSave(state, pending, saveGame);
    if (!applied.ok) {
      reportAction(state, applied.reason, Date.now(), false);
      render(state, actions);
      return;
    }
    state = applied.state;
    uiState.pendingImport = null;
    reportAction(state, `Imported ${pending.summary}`, Date.now(), true);
    saveAndRender(true);
  },
  cancelImport() { uiState.pendingImport = null; render(state, actions); },
  setParty(heroIds) { updateParty(heroIds); render(state, actions); },
  selectIdleParty() { updateParty(state.heroes.filter(hero => hero.status === 'idle').map(hero => hero.id)); render(state, actions); },
  clearParty() { updateParty([]); render(state, actions); },
  recommendParty() { updateParty(recommendedParty(state.heroes)); render(state, actions); },
  bulkTrain(heroIds) {
    const plan = prepareBulkTraining(state, heroIds);
    if (!plan.ok) return showUiFailure(plan.reason);
    plan.heroes.forEach(hero => { state = trainHero(state, hero.id); });
    reportAction(state, `${plan.heroes.length} heroes completed training for ${plan.totalCost} gold.`, Date.now(), true, { details: [`${plan.heroes.length}/${plan.heroes.length} trained`], category: 'economy' });
    saveAndRender(true);
  },
  updatePreference(key, value) {
    uiState.undoPreferences = { preferences: loadPreferences(), expiresAt: Date.now() + 10000 };
    const result = tryUpdatePreferences(preferences => { preferences[key] = value; });
    if (!result.ok) showUiFailure('View preference could not be saved. Your current game data is safe.');
    else render(state, actions);
  },
  undoPreference() {
    const undo = uiState.undoPreferences;
    if (!undo || undo.expiresAt < Date.now()) return showUiFailure('The view-change undo window has expired.');
    const result = tryUpdatePreferences(preferences => Object.assign(preferences, undo.preferences));
    uiState.undoPreferences = null;
    if (!result.ok) showUiFailure('View preference could not be restored.');
    else render(state, actions);
  },
  toggleShortcutHelp() { uiState.shortcutHelpOpen = !uiState.shortcutHelpOpen; render(state, actions); },
  startTutorial() { uiState.shortcutHelpOpen = false; uiState.pendingImport = null; uiState.tutorial = createTutorialState(); render(state, actions); },
  previousTutorialStep() { uiState.tutorial = moveTutorial(uiState.tutorial, -1); render(state, actions); },
  nextTutorialStep() {
    if (isLastTutorialStep(uiState.tutorial)) return finishTutorial();
    uiState.tutorial = moveTutorial(uiState.tutorial, 1);
    render(state, actions);
  },
  skipTutorial() { finishTutorial(); },
  focusContracts() {
    const target = document.getElementById('contract-board');
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); target.focus({ preventScroll: true }); }
  },
  resetGame() {
    if (!confirm('Reset GuildMasters progress?')) return;
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
    uiState.saveStatus = 'Saving…';
    const result = saveGame(state);
    if (!result.ok) {
      uiState.saveStatus = 'Save failed';
      state.statusMessage = result.reason;
      markAction(state, false, result.reason, { retryAction: 'retrySave', category: 'system' });
    } else {
      uiState.saveStatus = 'Saved';
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

function updateParty(heroIds) {
  const repaired = repairPartySelection(heroIds, state.heroes);
  const result = tryUpdatePreferences(preferences => { preferences.partyHeroIds = repaired; });
  if (!result.ok) showUiFailure('Party selection could not be remembered.');
}

function selectedParty() {
  const preferences = loadPreferences();
  const repaired = repairPartySelection(preferences.partyHeroIds, state.heroes);
  if (repaired.length !== preferences.partyHeroIds.length) tryUpdatePreferences(current => { current.partyHeroIds = repaired; });
  return repaired;
}

function showUiFailure(reason) {
  reportAction(state, reason, Date.now(), false);
  render(state, actions);
}

function finishTutorial() {
  const result = tryUpdatePreferences(preferences => { preferences.tutorialVersion = TUTORIAL_VERSION; });
  uiState.tutorial = { active: false, index: 0 };
  if (!result.ok) reportAction(state, 'Tutorial finished, but this browser could not remember that choice.', Date.now(), false);
  render(state, actions);
}

render(state, actions);
initQuickNavigation();
initKeyboardShortcuts(actions);
persistence.start();

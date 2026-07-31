import { resolveContracts, startContract } from './contracts.js';
import { upgradeGuild, buyItem, setGuildIdentity, upgradeRoom } from './guild.js';
import { equipItem, recruitHero, trainHero } from './heroes.js';
import { advanceDay, bootstrapFoundation, chooseEvent, craftItem, exploreRegion, hireStaff, researchProject, setMode, supportFaction } from './systems.js';
import { loadGame, resetGame, saveGame } from './saveSystem.js';
import { render } from './ui.js';
import { catalogItem } from './content.js';

let state = bootstrapFoundation(loadGame());
state = resolveContracts(state);
saveGame(state);

const actions = {
  recruitHero() { state = recruitHero(state); saveAndRender(); },
  startContract(heroId, contractId) { state = startContract(state, heroId, contractId); saveAndRender(); },
  upgradeGuild() { state = upgradeGuild(state); saveAndRender(); },
  upgradeRoom(roomId) { state = upgradeRoom(state, roomId); saveAndRender(); },
  advanceDay() { state = advanceDay(state); saveAndRender(); },
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

import { resolveContracts, startContract } from './contracts.js';
import { upgradeGuild } from './guild.js';
import { recruitHero } from './heroes.js';
import { loadGame, resetGame, saveGame } from './saveSystem.js';
import { render } from './ui.js';

let state = loadGame();
state = resolveContracts(state);
saveGame(state);

const actions = {
  recruitHero() {
    state = recruitHero(state);
    saveAndRender();
  },
  startContract(heroId, contractId) {
    state = startContract(state, heroId, contractId);
    saveAndRender();
  },
  upgradeGuild() {
    state = upgradeGuild(state);
    saveAndRender();
  },
  resetGame() {
    if (!confirm('Reset Guildmasters progress?')) return;
    state = resetGame();
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

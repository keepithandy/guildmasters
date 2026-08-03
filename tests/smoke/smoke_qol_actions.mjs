import assert from 'node:assert/strict';

import { appendLog } from '../../src/gameState.js';
import { createNewGameState } from '../../src/gameState.js';
import { isTypingTarget } from '../../src/keyboardShortcuts.js';
import { prepareBulkTraining } from '../../src/bulkRoster.js';
import { recommendedParty, repairPartySelection } from '../../src/partySelection.js';
import { loadPreferences, savePreferences } from '../../src/preferences.js';
import { applyImportedSave, exportPortableSave, prepareImportedSave } from '../../src/saveTransfer.js';

const state = createNewGameState(1000);
state.heroes = [
  { id: 'away', name: 'Away', status: 'on_contract', power: 50, equipment: {} },
  { id: 'alpha', name: 'Alpha', status: 'idle', power: 20, equipment: {} },
  { id: 'bravo', name: 'Bravo', status: 'idle', power: 20, equipment: {} },
  { id: 'charlie', name: 'Charlie', status: 'idle', power: 10, equipment: {} }
];

assert.deepEqual(repairPartySelection(['away', 'alpha', 'alpha', 'missing'], state.heroes), ['alpha'], 'remembered parties discard unavailable and duplicate heroes');
assert.deepEqual(recommendedParty(state.heroes), ['alpha', 'bravo', 'charlie'], 'recommended party is deterministic by power then name');
state.guild.gold = 50;
assert.equal(prepareBulkTraining(state, ['alpha', 'bravo']).ok, false, 'bulk training rejects the entire unaffordable selection');
state.guild.gold = 100;
const bulkPlan = prepareBulkTraining(state, ['alpha', 'bravo', 'away']);
assert.equal(bulkPlan.ok, true, 'bulk training validates all selected idle heroes before mutation');
assert.equal(bulkPlan.totalCost, 60, 'bulk training reports the exact combined cost');

const transferState = createNewGameState(1500);
const exported = exportPortableSave(transferState);
assert.equal(exported.ok, true, 'valid state exports safely');
const circularExportState = createNewGameState(1501);
circularExportState.flags.self = circularExportState;
assert.equal(exportPortableSave(circularExportState).ok, false, 'non-serializable exports return a safe failure result');
const prepared = prepareImportedSave(exported.text, 2000);
assert.equal(prepared.ok, true, 'exported state imports after repair and validation');
assert.equal(prepared.state.guild.name, transferState.guild.name, 'import retains valid guild data');
assert.equal(prepareImportedSave('{broken', 2000).ok, false, 'malformed imports are rejected');
assert.equal(prepareImportedSave(JSON.stringify({ saveVersion: 999 }), 2000).ok, false, 'future saves are rejected without replacement');
const rejectedApply = applyImportedSave(transferState, prepared, () => ({ ok: false, reason: 'storage denied' }));
assert.equal(rejectedApply.state, transferState, 'failed import persistence preserves the current state');
const thrownApply = applyImportedSave(transferState, prepared, () => { throw new Error('storage denied'); });
assert.equal(thrownApply.state, transferState, 'thrown import persistence failures preserve the current state');
const acceptedApply = applyImportedSave(transferState, prepared, () => ({ ok: true }));
assert.equal(acceptedApply.state, prepared.state, 'import replaces state only after persistence succeeds');

const logLengthBefore = state.log.length;
appendLog(state, 'Guild saved safely.', 3000, 'system');
appendLog(state, 'Guild saved safely.', 3001, 'system');
assert.equal(state.log.length, logLengthBefore + 1, 'repeated low-value activity messages are deduplicated');
appendLog(state, 'Alpha completed Rat Extermination.', 3002, 'contracts');
assert.equal(state.log[0].category, 'contracts', 'activity categories are preserved');

assert.equal(isTypingTarget({ closest: selector => selector.includes('input') ? {} : null }), true, 'shortcuts ignore typing controls');
assert.equal(isTypingTarget({ closest: () => null }), false, 'shortcuts work outside typing controls');

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
if (!originalStorage || originalStorage.configurable) {
  const malformedPreferenceStorage = {
    getItem() {
      return JSON.stringify({
        collapsedPanels: ['heroes', 1, 'heroes'],
        pinnedPanels: ['contract-board', null],
        navGroups: ['not-a-map'],
        heroFilter: 'invalid',
        density: 'invalid',
        partyHeroIds: ['alpha', 4, 'alpha'],
        tutorialVersion: -1,
        notificationsReadAt: 'never'
      });
    }
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: malformedPreferenceStorage });
  const repairedPreferences = loadPreferences();
  assert.deepEqual(repairedPreferences.collapsedPanels, ['heroes'], 'malformed panel preferences retain only unique string IDs');
  assert.deepEqual(repairedPreferences.navGroups, {}, 'malformed navigation preferences are discarded');
  assert.equal(repairedPreferences.heroFilter, 'all', 'invalid filter preferences fall back safely');
  assert.equal(repairedPreferences.density, 'comfortable', 'invalid density preferences fall back safely');
  assert.deepEqual(repairedPreferences.partyHeroIds, ['alpha'], 'malformed party preferences retain only unique string IDs');
  assert.equal(repairedPreferences.tutorialVersion, 0, 'invalid tutorial progress falls back safely');
  assert.equal(repairedPreferences.notificationsReadAt, 0, 'invalid notification timestamps fall back safely');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('storage unavailable'); } });
  assert.equal(savePreferences({ density: 'compact' }).ok, false, 'preference writes handle storage exceptions');
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
}

console.log('GuildMasters QoL action smoke passed.');

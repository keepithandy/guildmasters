import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const ui = read('src/ui.js');
const preferences = read('src/preferences.js');
const main = read('src/main.js');
const styles = read('styles.css');
const packageJson = JSON.parse(read('package.json'));

assert.equal(packageJson.version, '2.0.0-rc.4', 'QoL and hotfix pass is versioned as the next release candidate');
assert.match(preferences, /guildmasters\.ui\.preferences\.v1/, 'QoL preferences use a separate versioned browser record');
for (const key of ['collapsedPanels', 'pinnedPanels', 'navGroups', 'heroFilter', 'heroSort', 'contractFilter', 'contractSort', 'notificationsReadAt', 'density']) {
  assert.match(preferences, new RegExp(key), `preferences preserve ${key}`);
}

assert.match(ui, /id="command-bar" class="command-bar"/, 'persistent command bar is rendered');
assert.match(ui, /data-ui-action="toggleNotifications"/, 'activity center has a toggle');
assert.match(ui, /data-ui-action="markNotificationsRead"/, 'activity center can mark entries read');
assert.match(ui, /data-ui-control="heroFilter"/, 'hero filtering is rendered');
assert.match(ui, /data-ui-control="contractFilter"/, 'contract filtering is rendered');
assert.match(ui, /data-ui-panel-action="pin"/, 'dashboard panels can be pinned');
assert.match(ui, /data-ui-panel-action="collapse"/, 'dashboard panels can be collapsed');
assert.match(ui, /Show unlock path/, 'locked contracts expose a requirements disclosure');
assert.match(ui, /recommended-action/, 'contracts expose a recommended assignment action');
assert.match(ui, /formatRelativeTime/, 'activity entries expose readable timestamps');
assert.match(main, /refresh\(\) \{ render\(state, actions\); \}/, 'UI-only controls can refresh without mutating game state');

assert.match(styles, /\.command-bar\s*\{[\s\S]*?position: sticky/, 'command bar remains available while scrolling');
assert.match(styles, /\.panel\.is-pinned/, 'pinned sections receive visual priority');
assert.match(styles, /\.command-bar-actions\s*\{[\s\S]*?grid-template-columns: repeat\(3/, 'mobile command actions remain readable');
assert.match(styles, /#app\[data-density="compact"\]/, 'compact display density is supported');
assert.match(styles, /\.requirements-list/, 'unlock requirements have dedicated styling');

console.log('Guildmasters QoL smoke audit passed.');

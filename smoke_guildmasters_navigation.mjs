import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const index = read('index.html');
const main = read('src/main.js');
const navigation = read('src/navigation.js');
const styles = read('styles.css');
const ui = read('src/ui.js');

const quickLinks = [...index.matchAll(/class="quick-nav-link"\s+href="#([^"]+)"/g)].map(match => match[1]);
const groupControls = [...index.matchAll(/class="quick-nav-group-toggle"[\s\S]*?aria-controls="([^"]+)"/g)].map(match => match[1]);
const knownTargets = new Set([
  ...[...index.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]),
  ...[...ui.matchAll(/\sid="([^"]+)"/g)].map(match => match[1])
]);

assert.equal(quickLinks.length, 18, 'quick navigation exposes all 18 permanent dashboard destinations');
assert.equal(new Set(quickLinks).size, quickLinks.length, 'quick navigation destinations are unique');
quickLinks.forEach(target => assert.ok(knownTargets.has(target), `quick navigation target #${target} exists`));

assert.deepEqual(groupControls, [
  'quickNavCommand',
  'quickNavExpeditions',
  'quickNavGuild',
  'quickNavRealm',
  'quickNavProgress'
], 'quick navigation exposes five titled dropdown groups');
groupControls.forEach(id => assert.match(index, new RegExp(`id="${id}"`), `${id} submenu exists`));

assert.match(index, /id="quickNavToggle"[\s\S]*?aria-expanded="false"/, 'mobile quick-menu button begins collapsed');
assert.equal((index.match(/class="quick-nav-group-toggle"[\s\S]*?aria-expanded="true"/g) || []).length, 0, 'all quick-menu groups begin collapsed');
assert.match(index, /id="quickNav" class="quick-nav" aria-label="Quick access"/, 'sidebar has an accessible landmark');
assert.match(index, /id="quickNavClose"[\s\S]*?aria-label="Close quick menu"/, 'drawer exposes an accessible close action');
assert.match(main, /initQuickNavigation\(\)/, 'browser startup initializes quick navigation');

assert.match(navigation, /submenu\.hidden = !expanded/, 'dropdown buttons update submenu visibility');
assert.match(navigation, /event\.key === 'Escape'/, 'Escape closes the mobile drawer');
assert.match(navigation, /setAttribute\('inert', ''\)/, 'closed mobile drawer leaves keyboard navigation');
assert.match(navigation, /setAttribute\('aria-hidden', 'true'\)/, 'closed mobile drawer leaves the accessibility tree');
assert.match(navigation, /scrollIntoView/, 'quick links scroll their destination into view');
assert.match(navigation, /aria-current/, 'selected quick link is announced as current');

assert.match(styles, /\.quick-nav\s*\{[\s\S]*?position: fixed/, 'sidebar is fixed for quick access');
assert.match(styles, /body\.quick-nav-open \.quick-nav\s*\{[\s\S]*?translateX\(0\)/, 'mobile drawer has an open state');
assert.match(styles, /@media \(min-width: 1280px\)[\s\S]*?\.quick-nav\s*\{[\s\S]*?translateX\(0\)/, 'desktop sidebar remains visible');
assert.match(styles, /\.quick-nav-group-toggle\[aria-expanded="true"\]/, 'expanded dropdowns have a visible state');

console.log('Guildmasters quick-navigation smoke audit passed.');

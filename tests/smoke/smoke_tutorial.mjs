import assert from 'node:assert/strict';
import fs from 'node:fs';

import { TUTORIAL_STEPS, TUTORIAL_VERSION, createTutorialState, currentTutorialStep, isLastTutorialStep, moveTutorial, shouldAutoStartTutorial, syncTutorialTarget } from '../../src/tutorial.js';

const ui = fs.readFileSync('src/ui.js', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');
const targets = TUTORIAL_STEPS.map(step => step.targetId);

assert.ok(TUTORIAL_STEPS.length >= 18, 'tutorial covers the complete permanent dashboard');
assert.equal(new Set(targets).size, targets.length, 'tutorial targets are unique');
for (const id of targets) assert.match(ui, new RegExp(`id=["']${id}["']`), `tutorial target ${id} is rendered`);
assert.equal(shouldAutoStartTutorial({}), true, 'new players automatically receive the tutorial');
assert.equal(shouldAutoStartTutorial({ tutorialVersion: TUTORIAL_VERSION }), false, 'completed tutorial does not auto-repeat');
assert.equal(currentTutorialStep(createTutorialState()).targetId, 'command-bar', 'tutorial starts at the command bar');
assert.equal(moveTutorial(createTutorialState(), -1).index, 0, 'tutorial back navigation clamps at the first step');
assert.equal(isLastTutorialStep(moveTutorial(createTutorialState(), 999)), true, 'tutorial forward navigation clamps at the final step');

const classes = new Set(['is-collapsed']);
const attributes = new Map();
const body = { removeAttribute(name) { attributes.set(`body-${name}`, 'removed'); } };
const collapseButton = {
  setAttribute(name, value) { attributes.set(`collapse-${name}`, value); },
  title: '',
  textContent: ''
};
let scrollOptions = null;
const target = {
  id: 'command-bar',
  classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } },
  setAttribute(name, value) { attributes.set(name, value); },
  removeAttribute(name) { attributes.delete(name); },
  querySelector(selector) {
    if (selector === ':scope > .panel-body') return body;
    if (selector === '[data-ui-panel-action="collapse"]') return collapseButton;
    return null;
  },
  scrollIntoView(options) { scrollOptions = options; }
};
const root = { querySelectorAll() { return []; }, querySelector(selector) { return selector === '#command-bar' ? target : null; } };
assert.equal(syncTutorialTarget(root, createTutorialState(), { matchMedia: () => ({ matches: true }) }), target, 'tutorial locates its current panel');
assert.equal(classes.has('is-collapsed'), false, 'tutorial temporarily expands a collapsed target');
assert.equal(classes.has('tutorial-target'), true, 'tutorial highlights the current target');
assert.equal(attributes.get('collapse-aria-expanded'), 'true', 'tutorial keeps temporary expansion controls accurate');
assert.equal(scrollOptions.behavior, 'auto', 'tutorial honors reduced motion while navigating');
assert.equal(scrollOptions.block, 'start', 'tutorial keeps each section heading in view');

assert.match(ui, /data-ui-action="startTutorial"/, 'tutorial can be restarted');
assert.match(ui, /data-ui-action="nextTutorialStep"/, 'tutorial has forward controls');
assert.match(ui, /data-ui-action="skipTutorial"/, 'tutorial can be skipped');
assert.match(ui, /event\.stopPropagation\(\)/, 'tutorial blocks gameplay shortcuts behind the modal');
assert.match(styles, /\.tutorial-target/, 'tutorial target has visible highlight styling');

console.log('Guildmasters guided tutorial smoke passed.');

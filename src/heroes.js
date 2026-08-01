import { HERO_CLASS_CATALOG, catalogItem } from './content.js';
import { createActionResult, reportAction } from './actionResult.js';

const HERO_NAMES = ['Alden', 'Mira', 'Rowan', 'Thorn', 'Elara', 'Cedric', 'Nia', 'Borin', 'Sable', 'Tamsin', 'Orin', 'Veya'];
const HERO_CLASSES = HERO_CLASS_CATALOG;

export const RECRUIT_COST = 50;
export const HERO_CLASS_NAMES = HERO_CLASSES.map(profile => profile.name);

export function classProfile(className) { return HERO_CLASSES.find(profile => profile.name === className) || HERO_CLASSES[0]; }
export function recruitPowerBonus(state) { return Math.max(0, (state.guild.level - 1) * 2 + roomLevel(state, 'tavern') - 1); }
export function canRecruitHero(state, cost = RECRUIT_COST) { return state.heroes.length < state.guild.heroCapacity && state.guild.gold >= cost; }

export function recruitmentBlockedReason(state) {
  if (state.heroes.length >= state.guild.heroCapacity) return 'Hero roster is full. Upgrade the guild or Main Hall for another slot.';
  if (state.guild.gold < RECRUIT_COST) return `Recruitment needs ${RECRUIT_COST} gold. Complete existing contracts to earn more.`;
  return '';
}

export function recruitHero(state, random = Math.random, now = Date.now()) {
  return performRecruitment(state, { random, now }).state;
}

export function performRecruitment(state, { cost = RECRUIT_COST, random = Math.random, now = Date.now(), source = 'guild' } = {}) {
  if (state.heroes.length >= state.guild.heroCapacity) {
    const reason = 'Hero roster is full. Upgrade the guild or Main Hall for another slot.';
    reportAction(state, reason, now, false);
    return createActionResult(false, reason, { state, hero: null });
  }
  if (state.guild.gold < cost) {
    const reason = `Recruitment needs ${cost} gold. Complete existing contracts to earn more.`;
    reportAction(state, reason, now, false);
    return createActionResult(false, reason, { state, hero: null });
  }
  const archetype = pick(HERO_CLASSES, random);
  const bonus = recruitPowerBonus(state);
  const hero = {
    id: uniqueHeroId(state, `hero-${now}-${Math.floor(clampRandom(random()) * 1e6)}`),
    name: pick(HERO_NAMES, random),
    className: archetype.name,
    level: 1,
    power: randomInt(archetype.minPower + bonus, archetype.maxPower + bonus, random),
    experience: 0,
    morale: 75,
    status: 'idle',
    traits: [archetype.trait],
    skills: [...archetype.skills],
    equipment: { weapon: '', offhand: '', armor: '', charm: '' },
    injuries: [],
    statusEffects: [],
    relationships: {},
    personalGoal: `Become the guild's most reliable ${archetype.name.toLowerCase()}.`
  };
  state.guild.gold -= cost;
  state.heroes.push(hero);
  state.guild.records.heroesRecruited += 1;
  const reason = `${hero.name} the ${hero.className} joined with ${hero.power} power${source === 'event' ? ' through a guild event' : ''}.`;
  reportAction(state, reason, now, true);
  return createActionResult(true, reason, { state, hero });
}

export function idleHeroes(state) { return state.heroes.filter(hero => hero.status === 'idle'); }
export function findHero(state, heroId) { return state.heroes.find(hero => hero.id === heroId) || null; }

export function heroEquipmentPower(hero) {
  return Object.values(hero?.equipment || {}).reduce((power, itemId) => power + (catalogItem(itemId)?.power || 0), 0);
}

export function heroTotalPower(hero) { return Math.max(1, Number(hero?.power) || 1) + heroEquipmentPower(hero); }

export function levelHero(hero, powerBonus = 0, random = Math.random) {
  const powerGain = randomInt(2, 5, random) + Math.max(0, powerBonus);
  hero.level += 1;
  hero.power += powerGain;
  hero.experience = 0;
  hero.morale = Math.min(100, (hero.morale ?? 75) + 4);
  return powerGain;
}

export function trainHero(state, heroId, now = Date.now()) {
  const hero = findHero(state, heroId);
  const cost = 20 + ((hero?.level || 1) * 10);
  if (!hero) return reportAction(state, 'Hero not found.', now, false);
  if (hero.status !== 'idle') return reportAction(state, `${hero.name} is away on a contract.`, now, false);
  if (state.guild.gold < cost) return reportAction(state, `Training ${hero.name} needs ${cost} gold.`, now, false);
  state.guild.gold -= cost;
  const yardBonus = roomLevel(state, 'training-yard') - 1;
  hero.power += 1 + yardBonus;
  hero.experience += 10 + (yardBonus * 5);
  hero.morale = Math.min(100, (hero.morale ?? 75) + 3);
  return reportAction(state, `${hero.name} completed training and gained ${1 + yardBonus} power.`, now, true);
}

export function equipItem(state, heroId, itemId, now = Date.now()) {
  const hero = findHero(state, heroId);
  const item = catalogItem(itemId);
  const inventoryItem = state.inventory.find(entry => entry.itemId === itemId && entry.quantity > 0);
  if (!hero || !item || !inventoryItem) return reportAction(state, 'That equipment action is unavailable.', now, false);
  if (item.className && item.className !== hero.className) return reportAction(state, `${item.name} is not suited to ${hero.name}.`, now, false);
  const previous = hero.equipment[item.slot];
  if (previous) addInventory(state, previous, 1, now);
  hero.equipment[item.slot] = item.id;
  inventoryItem.quantity -= 1;
  state.inventory = state.inventory.filter(entry => entry.quantity > 0);
  return reportAction(state, `${hero.name} equipped ${item.name}.`, now, true);
}

export function addInventory(state, itemId, quantity = 1, now = Date.now()) {
  if (!catalogItem(itemId) || quantity <= 0) return state;
  const existing = state.inventory.find(entry => entry.itemId === itemId);
  if (existing) existing.quantity += quantity;
  else state.inventory.push({ id: `inv-${itemId}-${now}-${state.inventory.length}`, itemId, quantity, acquiredAt: now });
  return state;
}

function roomLevel(state, id) { return Number(state.rooms?.[id]) || 1; }
function uniqueHeroId(state, base) {
  let id = base;
  let suffix = 1;
  while (state.heroes.some(hero => hero.id === id)) { id = `${base}-${suffix}`; suffix += 1; }
  return id;
}
function pick(list, random) { return list[Math.floor(clampRandom(random()) * list.length)]; }
function randomInt(min, max, random) { return Math.floor(clampRandom(random()) * (max - min + 1)) + min; }
function clampRandom(value) { return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0; }

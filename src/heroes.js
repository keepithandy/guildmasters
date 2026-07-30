import { appendLog } from './gameState.js';

const HERO_NAMES = ['Alden', 'Mira', 'Rowan', 'Thorn', 'Elara', 'Cedric', 'Nia', 'Borin'];
const HERO_CLASSES = [
  { name: 'Warrior', minPower: 14, maxPower: 22 },
  { name: 'Ranger', minPower: 12, maxPower: 20 },
  { name: 'Mage', minPower: 10, maxPower: 24 },
  { name: 'Guardian', minPower: 16, maxPower: 20 }
];

export const RECRUIT_COST = 50;

export function recruitPowerBonus(state) {
  return Math.max(0, (state.guild.level - 1) * 2);
}

export function canRecruitHero(state) {
  return state.heroes.length < state.guild.heroCapacity && state.guild.gold >= RECRUIT_COST;
}

export function recruitmentBlockedReason(state) {
  if (state.heroes.length >= state.guild.heroCapacity) return 'Hero roster is full. Upgrade the guild for another slot.';
  if (state.guild.gold < RECRUIT_COST) return `Recruitment needs ${RECRUIT_COST} gold. Complete existing contracts to earn more.`;
  return '';
}

export function recruitHero(state, random = Math.random, now = Date.now()) {
  if (!canRecruitHero(state)) {
    state.statusMessage = recruitmentBlockedReason(state);
    appendLog(state, state.statusMessage, now);
    return state;
  }

  const archetype = pick(HERO_CLASSES, random);
  const bonus = recruitPowerBonus(state);
  const hero = {
    id: `hero-${now}-${Math.floor(clampRandom(random()) * 1e6)}`,
    name: pick(HERO_NAMES, random),
    className: archetype.name,
    level: 1,
    power: randomInt(archetype.minPower + bonus, archetype.maxPower + bonus, random),
    status: 'idle'
  };

  state.guild.gold -= RECRUIT_COST;
  state.heroes.push(hero);
  state.statusMessage = `${hero.name} joined the guild.`;
  appendLog(state, `${hero.name} the ${hero.className} joined with ${hero.power} power.`, now);
  return state;
}

export function idleHeroes(state) {
  return state.heroes.filter(hero => hero.status === 'idle');
}

export function findHero(state, heroId) {
  return state.heroes.find(hero => hero.id === heroId) || null;
}

export function levelHero(hero, powerBonus = 0, random = Math.random) {
  const powerGain = randomInt(2, 5, random) + Math.max(0, powerBonus);
  hero.level += 1;
  hero.power += powerGain;
  return powerGain;
}

function pick(list, random) {
  return list[Math.floor(clampRandom(random()) * list.length)];
}

function randomInt(min, max, random) {
  return Math.floor(clampRandom(random()) * (max - min + 1)) + min;
}

function clampRandom(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
}

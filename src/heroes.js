const HERO_NAMES = ['Alden', 'Mira', 'Rowan', 'Thorn', 'Elara', 'Cedric', 'Nia', 'Borin'];
const HERO_CLASSES = [
  { name: 'Warrior', minPower: 14, maxPower: 22 },
  { name: 'Ranger', minPower: 12, maxPower: 20 },
  { name: 'Mage', minPower: 10, maxPower: 24 },
  { name: 'Guardian', minPower: 16, maxPower: 20 }
];

export const RECRUIT_COST = 50;

export function canRecruitHero(state) {
  return state.heroes.length < state.guild.heroCapacity && state.guild.gold >= RECRUIT_COST;
}

export function recruitHero(state) {
  if (!canRecruitHero(state)) {
    state.log.unshift('Recruitment failed: not enough gold or hero slots.');
    return state;
  }

  const archetype = pick(HERO_CLASSES);
  const hero = {
    id: `hero-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: pick(HERO_NAMES),
    className: archetype.name,
    level: 1,
    power: randomInt(archetype.minPower, archetype.maxPower),
    status: 'idle'
  };

  state.guild.gold -= RECRUIT_COST;
  state.heroes.push(hero);
  state.log.unshift(`${hero.name} the ${hero.className} joined the guild.`);
  return state;
}

export function idleHeroes(state) {
  return state.heroes.filter(hero => hero.status === 'idle');
}

export function findHero(state, heroId) {
  return state.heroes.find(hero => hero.id === heroId) || null;
}

export function levelHero(hero) {
  hero.level += 1;
  hero.power += randomInt(2, 5);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

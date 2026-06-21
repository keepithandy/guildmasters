export const GAME_VERSION = '0.1.0-dev';

export function createNewGameState(now = Date.now()) {
  return {
    version: GAME_VERSION,
    guild: {
      level: 1,
      gold: 100,
      reputation: 0,
      heroCapacity: 3,
      totalGoldEarned: 0,
      contractsCompleted: 0,
      contractsFailed: 0
    },
    heroes: [],
    activeContracts: [],
    log: ['Guild founded. Recruit your first hero.'],
    lastSeenAt: now
  };
}

export function repairGameState(input, now = Date.now()) {
  const fallback = createNewGameState(now);
  if (!input || typeof input !== 'object') return fallback;

  const guild = input.guild && typeof input.guild === 'object' ? input.guild : {};

  return {
    version: typeof input.version === 'string' ? input.version : GAME_VERSION,
    guild: {
      level: positiveInt(guild.level, 1),
      gold: nonNegativeNumber(guild.gold, fallback.guild.gold),
      reputation: nonNegativeNumber(guild.reputation, 0),
      heroCapacity: positiveInt(guild.heroCapacity, 3),
      totalGoldEarned: nonNegativeNumber(guild.totalGoldEarned, 0),
      contractsCompleted: nonNegativeNumber(guild.contractsCompleted, 0),
      contractsFailed: nonNegativeNumber(guild.contractsFailed, 0)
    },
    heroes: Array.isArray(input.heroes) ? input.heroes.filter(Boolean).map(repairHero) : [],
    activeContracts: Array.isArray(input.activeContracts) ? input.activeContracts.filter(Boolean) : [],
    log: Array.isArray(input.log) ? input.log.slice(-20).map(String) : fallback.log,
    lastSeenAt: nonNegativeNumber(input.lastSeenAt, now)
  };
}

function repairHero(hero, index) {
  return {
    id: typeof hero.id === 'string' ? hero.id : `hero-${index + 1}`,
    name: typeof hero.name === 'string' ? hero.name : 'Unnamed Hero',
    className: typeof hero.className === 'string' ? hero.className : 'Warrior',
    level: positiveInt(hero.level, 1),
    power: positiveInt(hero.power, 10),
    status: hero.status === 'on_contract' ? 'on_contract' : 'idle'
  };
}

function positiveInt(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

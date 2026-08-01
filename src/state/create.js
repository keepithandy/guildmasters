export const GAME_VERSION = '2.0.0-rc.3';
export const SAVE_SCHEMA_VERSION = 5;

export function createNewGameState(now = Date.now()) {
  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    version: GAME_VERSION,
    guild: {
      name: 'Guildmasters', identity: 'Independent', mode: 'story', level: 1, gold: 100, reputation: 0, heroCapacity: 3,
      totalGoldEarned: 0, contractsCompleted: 0, contractsFailed: 0, day: 1, influence: 0, researchPoints: 0, materials: 0, prestige: 0,
      records: { highestGuildLevel: 1, highestHeroLevel: 1, legendaryClears: 0, regionsExplored: 0, heroesRecruited: 0, itemsCrafted: 0, bossesDefeated: 0 }
    },
    heroes: [],
    activeContracts: [],
    rooms: { 'main-hall': 1 },
    inventory: [],
    research: [],
    staff: [],
    factions: {},
    regions: { unlocked: ['frontier'], explored: [] },
    events: [],
    campaign: { chaptersCompleted: [], activeChapter: 'small-beginning', decisionsMade: [] },
    rivals: {},
    bosses: { defeated: [], attempts: {} },
    worldThreat: 0,
    tactical: { drillsCompleted: 0, encountersWon: 0, encountersLost: 0 },
    combat: { victories: 0, defeats: 0, rounds: 0, lastEncounter: null },
    achievements: [],
    relationshipEvents: [],
    offlineSummary: { elapsedSeconds: 0, resolvedContracts: 0, returnedAt: now },
    flags: {},
    log: [{ id: 'log-founded', timestamp: now, message: 'Guild founded. Recruit your first hero.' }],
    lastSeenAt: now,
    statusMessage: 'Guild ready.',
    lastAction: { ok: true, reason: 'Guild ready.' }
  };
}

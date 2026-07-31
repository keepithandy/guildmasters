export const ROOM_CATALOG = [
  { id: 'main-hall', name: 'Main Hall', description: 'Raises the guild capacity and unlocks new contracts.', maxLevel: 5, baseCost: 125, effect: 'capacity' },
  { id: 'training-yard', name: 'Training Yard', description: 'Improves hero training and expedition growth.', maxLevel: 5, baseCost: 100, effect: 'training' },
  { id: 'armory', name: 'Armory', description: 'Adds equipment slots and improves gear value.', maxLevel: 5, baseCost: 150, effect: 'gear' },
  { id: 'infirmary', name: 'Infirmary', description: 'Shortens injury recovery and protects morale.', maxLevel: 5, baseCost: 110, effect: 'healing' },
  { id: 'library', name: 'Library', description: 'Generates research points and reveals mission intel.', maxLevel: 5, baseCost: 140, effect: 'research' },
  { id: 'tavern', name: 'Tavern', description: 'Attracts recruits and creates guild events.', maxLevel: 5, baseCost: 90, effect: 'morale' },
  { id: 'workshop', name: 'Workshop', description: 'Crafts reliable equipment from expedition materials.', maxLevel: 5, baseCost: 180, effect: 'crafting' },
  { id: 'war-room', name: 'War Room', description: 'Improves faction influence and regional planning.', maxLevel: 5, baseCost: 220, effect: 'influence' },
  { id: 'trophy-room', name: 'Trophy Room', description: 'Records legendary victories and increases prestige.', maxLevel: 5, baseCost: 250, effect: 'prestige' }
];

export const ITEM_CATALOG = [
  { id: 'iron-sword', name: 'Iron Sword', slot: 'weapon', className: 'Warrior', power: 4, rarity: 'Common', cost: 45 },
  { id: 'hunter-bow', name: 'Hunter Bow', slot: 'weapon', className: 'Ranger', power: 4, rarity: 'Common', cost: 45 },
  { id: 'apprentice-staff', name: 'Apprentice Staff', slot: 'weapon', className: 'Mage', power: 5, rarity: 'Common', cost: 55 },
  { id: 'tower-shield', name: 'Tower Shield', slot: 'offhand', className: 'Guardian', power: 5, rarity: 'Uncommon', cost: 75 },
  { id: 'shadow-dagger', name: 'Shadow Dagger', slot: 'weapon', className: 'Rogue', power: 6, rarity: 'Rare', cost: 110 },
  { id: 'guildmail', name: 'Guildmail', slot: 'armor', power: 5, rarity: 'Uncommon', cost: 85 },
  { id: 'ember-charm', name: 'Ember Charm', slot: 'charm', power: 7, rarity: 'Rare', cost: 140 },
  { id: 'dragon-signet', name: 'Dragon Signet', slot: 'charm', power: 12, rarity: 'Legendary', cost: 500 }
];

export const FACTION_CATALOG = [
  { id: 'crown', name: 'The Crown', shortName: 'Crown', description: 'Order, protection, and official contracts.' },
  { id: 'merchants', name: 'Merchant Consortium', shortName: 'Merchants', description: 'Trade routes, supplies, and profitable escorts.' },
  { id: 'mages', name: 'Mages’ Circle', shortName: 'Mages', description: 'Research, relics, and dangerous arcana.' },
  { id: 'rangers', name: 'Rangers’ Lodge', shortName: 'Rangers', description: 'Frontier scouting and monster hunting.' },
  { id: 'foundries', name: 'Dwarven Foundries', shortName: 'Foundries', description: 'Rare metalwork and dependable equipment.' },
  { id: 'thieves', name: 'Thieves’ Network', shortName: 'Thieves', description: 'Secrets, shortcuts, and questionable favors.' }
];

export const REGION_CATALOG = [
  { id: 'frontier', name: 'The Frontier', description: 'A rough borderland where new guilds earn their first reputation.', minGuildLevel: 1, cost: 0, threat: 'Bandits and beasts' },
  { id: 'greenwood', name: 'The Greenwood', description: 'An ancient forest hiding old paths and stranger creatures.', minGuildLevel: 2, cost: 120, threat: 'Spiders and fae' },
  { id: 'ashen-mountains', name: 'The Ashen Mountains', description: 'Mines, fortresses, and a sleeping fire beneath the stone.', minGuildLevel: 4, cost: 260, threat: 'Orcs and elementals' },
  { id: 'old-kingdom', name: 'The Old Kingdom', description: 'The ruins of a fallen empire still hold impossible treasures.', minGuildLevel: 6, cost: 500, threat: 'Undead and guardians' },
  { id: 'forbidden-depths', name: 'The Forbidden Depths', description: 'A final descent into the place where the old stories began.', minGuildLevel: 9, cost: 900, threat: 'Dragons and demons' }
];

export const RESEARCH_CATALOG = [
  { id: 'field-medicine', name: 'Field Medicine', description: 'Injured heroes recover faster.', cost: 4, effect: 'healing' },
  { id: 'contract-lore', name: 'Contract Lore', description: 'Reveals more useful mission information.', cost: 5, effect: 'intel' },
  { id: 'advanced-training', name: 'Advanced Training', description: 'Successful expeditions grant extra power.', cost: 7, effect: 'training' },
  { id: 'runic-craft', name: 'Runic Craft', description: 'Unlocks stronger crafted equipment.', cost: 9, effect: 'crafting' },
  { id: 'diplomatic-charters', name: 'Diplomatic Charters', description: 'Improves faction reputation rewards.', cost: 10, effect: 'influence' },
  { id: 'legend-seeking', name: 'Legend-Seeking', description: 'Unlocks legendary contracts and relics.', cost: 14, effect: 'legendary' }
];

export const STAFF_CATALOG = [
  { id: 'quartermaster', name: 'Quartermaster', description: 'Reduces supply costs and improves expedition rewards.', cost: 180, effect: 'supplies' },
  { id: 'trainer', name: 'Master Trainer', description: 'Adds training power and hero growth.', cost: 240, effect: 'training' },
  { id: 'healer', name: 'Guild Healer', description: 'Keeps injuries from becoming long-term setbacks.', cost: 220, effect: 'healing' },
  { id: 'archivist', name: 'Guild Archivist', description: 'Generates research points each day.', cost: 300, effect: 'research' },
  { id: 'diplomat', name: 'Guild Diplomat', description: 'Improves faction standing from successful contracts.', cost: 350, effect: 'influence' },
  { id: 'spymaster', name: 'Guild Spymaster', description: 'Finds better contracts and reveals rival activity.', cost: 450, effect: 'intel' }
];

export const ENEMY_CATALOG = [
  { id: 'bandits', name: 'Bandits', role: 'Bruiser', weakness: 'Ranger' },
  { id: 'goblins', name: 'Goblins', role: 'Swarm', weakness: 'Warrior' },
  { id: 'spiders', name: 'Giant Spiders', role: 'Controller', weakness: 'Mage' },
  { id: 'undead', name: 'Undead', role: 'Tank', weakness: 'Cleric' },
  { id: 'elementals', name: 'Elementals', role: 'Caster', weakness: 'Rogue' },
  { id: 'dragons', name: 'Dragons', role: 'Boss', weakness: 'Ranger' },
  { id: 'demons', name: 'Demons', role: 'Boss', weakness: 'Mage' }
];

export const EVENT_CATALOG = [
  { id: 'wandering-hero', title: 'A Wandering Hero', description: 'A veteran adventurer is considering their next banner.', options: [{ id: 'recruit', label: 'Offer a place', gold: -80, reputation: 1 }, { id: 'decline', label: 'Wish them well' }] },
  { id: 'merchant-gift', title: 'Merchant’s Gift', description: 'A grateful merchant leaves supplies at the guildhall.', options: [{ id: 'accept', label: 'Accept the supplies', gold: 65, reputation: 1 }, { id: 'decline', label: 'Decline politely' }] },
  { id: 'rival-challenge', title: 'A Rival’s Challenge', description: 'A neighboring guild wants to settle things in the arena.', options: [{ id: 'accept', label: 'Accept the challenge', reputation: 3, gold: 90 }, { id: 'decline', label: 'Keep the peace' }] },
  { id: 'arcane-warning', title: 'Arcane Warning', description: 'The Mages’ Circle warns that an old seal is weakening.', options: [{ id: 'research', label: 'Fund the research', gold: -60, research: 5 }, { id: 'ignore', label: 'Stay out of it' }] }
];

export const GAME_MODES = [
  { id: 'story', name: 'Story', description: 'A guided campaign through the world.' },
  { id: 'sandbox', name: 'Sandbox', description: 'Open-ended guild building with flexible progression.' },
  { id: 'challenge', name: 'Challenge', description: 'Harder contracts and tighter resources.' },
  { id: 'ironman', name: 'Ironman', description: 'Failure is permanent and rewards are higher.' }
];

export const CAMPAIGN_CHAPTERS = [
  { id: 'small-beginning', title: 'Chapter I: A Small Beginning', description: 'Prove that the new guild can protect its neighbors.', requirement: state => state.guild.contractsCompleted >= 1, rewardGold: 80, rewardReputation: 2 },
  { id: 'frontier-trouble', title: 'Chapter II: Trouble on the Frontier', description: 'Earn a reputation strong enough to draw the attention of rival guilds.', requirement: state => state.guild.reputation >= 6, rewardGold: 140, rewardReputation: 4 },
  { id: 'old-secrets', title: 'Chapter III: Secrets of the Old Kingdom', description: 'Explore beyond the frontier and begin researching the old seals.', requirement: state => state.regions.explored.includes('greenwood') && state.research.includes('contract-lore'), rewardGold: 240, rewardReputation: 6 },
  { id: 'war-of-influence', title: 'Chapter IV: War of Influence', description: 'Build enough standing to choose the guild’s allies.', requirement: state => Object.values(state.factions).some(value => value >= 10), rewardGold: 400, rewardReputation: 8 },
  { id: 'greater-threat', title: 'Chapter V: The Greater Threat', description: 'Prepare a legendary roster for the threat beneath the world.', requirement: state => state.guild.level >= 6 && state.guild.prestige >= 8, rewardGold: 700, rewardReputation: 12 },
  { id: 'final-expedition', title: 'Chapter VI: The Final Expedition', description: 'Defeat a legendary boss and decide what the guild becomes.', requirement: state => state.guild.records.bossesDefeated >= 1, rewardGold: 1500, rewardReputation: 20 }
];

export const RIVAL_GUILDS = [
  { id: 'silver-company', name: 'The Silver Company', style: 'Elite contract specialists', requiredGuildLevel: 2, rewardGold: 100, rewardReputation: 2 },
  { id: 'black-lanterns', name: 'The Black Lanterns', style: 'Secretive ruin hunters', requiredGuildLevel: 4, rewardGold: 260, rewardReputation: 5 },
  { id: 'royal-standard', name: 'The Royal Standard', style: 'Crown-backed champions', requiredGuildLevel: 6, rewardGold: 600, rewardReputation: 9 }
];

export const TACTICAL_DRILLS = [
  { id: 'goblin-skirmish', name: 'Goblin Skirmish', enemy: 'goblins', requiredPower: 20, rewardGold: 30, rewardMaterials: 1 },
  { id: 'spider-ambush', name: 'Spider Ambush', enemy: 'spiders', requiredPower: 42, rewardGold: 75, rewardMaterials: 3 },
  { id: 'elemental-breach', name: 'Elemental Breach', enemy: 'elementals', requiredPower: 75, rewardGold: 150, rewardMaterials: 6 },
  { id: 'undead-vanguard', name: 'Undead Vanguard', enemy: 'undead', requiredPower: 120, rewardGold: 300, rewardMaterials: 10 }
];

export const COMBAT_ENCOUNTERS = [
  { id: 'goblin-skirmish', name: 'Goblin Skirmish', enemy: 'goblins', enemyHp: 36, enemyAttack: 7, requiredPower: 20, rounds: 4, rewardGold: 30, rewardMaterials: 1 },
  { id: 'spider-ambush', name: 'Spider Ambush', enemy: 'spiders', enemyHp: 72, enemyAttack: 12, requiredPower: 42, rounds: 5, rewardGold: 75, rewardMaterials: 3 },
  { id: 'elemental-breach', name: 'Elemental Breach', enemy: 'elementals', enemyHp: 130, enemyAttack: 18, requiredPower: 75, rounds: 6, rewardGold: 150, rewardMaterials: 6 },
  { id: 'undead-vanguard', name: 'Undead Vanguard', enemy: 'undead', enemyHp: 220, enemyAttack: 25, requiredPower: 120, rounds: 7, rewardGold: 300, rewardMaterials: 10 }
];

export const ACHIEVEMENT_CATALOG = [
  { id: 'first-blood', name: 'First Blood', description: 'Win your first tactical encounter.' },
  { id: 'tactical-veteran', name: 'Tactical Veteran', description: 'Win five tactical encounters.' },
  { id: 'rival-breaker', name: 'Rival Breaker', description: 'Defeat a rival guild.' },
  { id: 'boss-slayer', name: 'Boss Slayer', description: 'Defeat a bespoke multi-phase boss.' },
  { id: 'bond-forged', name: 'Bond Forged', description: 'Build a bond between two heroes.' },
  { id: 'chapter-keeper', name: 'Chapter Keeper', description: 'Complete three campaign chapters.' },
  { id: 'legendary-guild', name: 'Legendary Guild', description: 'Complete the final campaign chapter.' }
];

export const RELATIONSHIP_EVENTS = [
  { id: 'campfire', title: 'Campfire Stories', description: 'Two heroes share stories after a hard day.', morale: 6, bond: 2 },
  { id: 'sparring', title: 'Friendly Sparring', description: 'A controlled duel turns into a lesson in trust.', morale: 4, bond: 3 },
  { id: 'shared-oath', title: 'A Shared Oath', description: 'The pair promise to watch each other’s backs.', morale: 8, bond: 4 }
];

export const BOSS_ENCOUNTERS = [
  { id: 'goblin-king', name: 'The Goblin King', description: 'A warlord has united the frontier clans beneath one banner.', enemy: 'goblins', phases: [{ name: 'Warband', hp: 90, attack: 12, mechanic: 'swarm' }, { name: 'Crown Guard', hp: 120, attack: 16, mechanic: 'enrage' }], requiredGuildLevel: 3, requiredReputation: 18, rewardGold: 420, rewardReputation: 12, rewardMaterials: 10, region: 'frontier' },
  { id: 'mirror-witch', name: 'The Mirror Witch', description: 'An ancient illusionist turns every weakness back upon its source.', enemy: 'spiders', phases: [{ name: 'Reflections', hp: 130, attack: 18, mechanic: 'echo' }, { name: 'Shattered Mirror', hp: 160, attack: 22, mechanic: 'poison' }], requiredGuildLevel: 5, requiredReputation: 35, rewardGold: 760, rewardReputation: 20, rewardMaterials: 18, region: 'greenwood' },
  { id: 'ash-tyrant', name: 'The Ash Tyrant', description: 'A living furnace commands the burning mines beneath the mountains.', enemy: 'elementals', phases: [{ name: 'Molten Shell', hp: 190, attack: 24, mechanic: 'burn' }, { name: 'Eruption', hp: 240, attack: 30, mechanic: 'eruption' }], requiredGuildLevel: 7, requiredReputation: 55, rewardGold: 1200, rewardReputation: 28, rewardMaterials: 30, region: 'ashen-mountains' },
  { id: 'dragon-below', name: 'The Dragon Below', description: 'The oldest threat beneath the world wakes for its final reckoning.', enemy: 'dragons', phases: [{ name: 'Ancient Scales', hp: 260, attack: 32, mechanic: 'armor' }, { name: 'Worldfire', hp: 340, attack: 40, mechanic: 'worldfire' }, { name: 'Last Breath', hp: 420, attack: 48, mechanic: 'enrage' }], requiredGuildLevel: 9, requiredReputation: 85, rewardGold: 3000, rewardReputation: 50, rewardMaterials: 60, region: 'forbidden-depths' }
];

export const STORY_DECISIONS = [
  { id: 'frontier-alliance', chapterId: 'frontier-trouble', title: 'The Frontier Alliance', prompt: 'The Crown and the Rangers both want your support.', options: [{ id: 'crown', label: 'Stand with the Crown', faction: 'crown', reputation: 3, flag: 'crown-ally' }, { id: 'rangers', label: 'Stand with the Rangers', faction: 'rangers', reputation: 3, flag: 'ranger-ally' }] },
  { id: 'old-seal', chapterId: 'old-secrets', title: 'The Old Seal', prompt: 'The Mages’ Circle asks whether the seal should be studied or destroyed.', options: [{ id: 'study', label: 'Study the seal', faction: 'mages', research: 6, flag: 'seal-studied' }, { id: 'destroy', label: 'Destroy the seal', reputation: 4, flag: 'seal-destroyed' }] },
  { id: 'war-council', chapterId: 'war-of-influence', title: 'The War Council', prompt: 'Your allies want a single leader for the coming conflict.', options: [{ id: 'lead', label: 'Lead the coalition', prestige: 4, flag: 'coalition-leader' }, { id: 'mediate', label: 'Keep the factions equal', influence: 3, flag: 'coalition-mediator' }] },
  { id: 'final-oath', chapterId: 'final-expedition', title: 'The Final Oath', prompt: 'Before the final expedition, the guild must decide what it will protect.', options: [{ id: 'people', label: 'Protect the people', reputation: 10, flag: 'people-protected' }, { id: 'knowledge', label: 'Preserve forbidden knowledge', research: 10, flag: 'knowledge-preserved' }] }
];

export function catalogItem(id) { return ITEM_CATALOG.find(item => item.id === id) || null; }
export function catalogRoom(id) { return ROOM_CATALOG.find(room => room.id === id) || null; }
export function catalogFaction(id) { return FACTION_CATALOG.find(faction => faction.id === id) || null; }
export function catalogRegion(id) { return REGION_CATALOG.find(region => region.id === id) || null; }
export function catalogResearch(id) { return RESEARCH_CATALOG.find(project => project.id === id) || null; }
export function catalogStaff(id) { return STAFF_CATALOG.find(staff => staff.id === id) || null; }
export function catalogEvent(id) { return EVENT_CATALOG.find(event => event.id === id) || null; }
export function catalogChapter(id) { return CAMPAIGN_CHAPTERS.find(chapter => chapter.id === id) || null; }
export function catalogRival(id) { return RIVAL_GUILDS.find(rival => rival.id === id) || null; }
export function catalogDrill(id) { return TACTICAL_DRILLS.find(drill => drill.id === id) || null; }
export function catalogEncounter(id) { return COMBAT_ENCOUNTERS.find(encounter => encounter.id === id) || null; }
export function catalogAchievement(id) { return ACHIEVEMENT_CATALOG.find(achievement => achievement.id === id) || null; }
export function catalogRelationshipEvent(id) { return RELATIONSHIP_EVENTS.find(event => event.id === id) || null; }
export function catalogBoss(id) { return BOSS_ENCOUNTERS.find(boss => boss.id === id) || null; }
export function catalogStoryDecision(id) { return STORY_DECISIONS.find(decision => decision.id === id) || null; }

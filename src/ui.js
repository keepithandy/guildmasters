import { CONTRACTS, activeContractDetails, calculateSuccessChance, contractUnlockProgress, contractUnlockRequirements, isContractUnlocked, nextContractUnlock } from './contracts.js';
import { canUpgradeGuild, guildUpgradeBlockedReason, guildUpgradeCost, canUpgradeRoom, roomUpgradeCost } from './guild.js';
import { canRecruitHero, heroTotalPower, RECRUIT_COST, recruitPowerBonus, recruitmentBlockedReason } from './heroes.js';
import { ACHIEVEMENT_CATALOG, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, EVENT_CATALOG, GAME_MODES, ITEM_CATALOG, REGION_CATALOG, RESEARCH_CATALOG, RIVAL_GUILDS, ROOM_CATALOG, STAFF_CATALOG, catalogChapter, catalogEvent, catalogItem } from './content.js';

export function render(state, actions) {
  const root = document.getElementById('app');
  if (!root) return;
  const nextUnlock = nextContractUnlock(state);
  const recruitReason = recruitmentBlockedReason(state);
  const upgradeReason = guildUpgradeBlockedReason(state);
  root.innerHTML = `
    <p id="guildStatus" class="status-banner" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(state.statusMessage || 'Guild ready.')}</p>
    ${renderGuildPanel(state, nextUnlock, upgradeReason)}
    ${renderOfflinePanel(state)}
    ${renderCampaignPanel(state)}
    ${renderEventPanel(state)}
    ${renderHeroPanel(state, recruitReason)}
    ${renderContractPanel(state)}
    ${renderActivePanel(state)}
    ${renderGuildhallPanel(state)}
    ${renderWorldPanel(state)}
    ${renderFactionPanel(state)}
    ${renderRivalPanel(state)}
    ${renderTacticalPanel(state)}
    ${renderRelationshipPanel(state)}
    ${renderAchievementPanel(state)}
    ${renderProgressionPanel(state)}
    ${renderArmoryPanel(state)}
    ${renderRecordsPanel(state)}
    ${renderLogPanel(state)}
  `;
  bindActions(root, actions);
}

function renderGuildPanel(state, nextUnlock, upgradeReason) {
  const records = state.guild.records || {};
  return `<section class="panel guild-panel">
    <div class="panel-title-row"><div><p class="eyebrow">Guild command</p><h2>${escapeHtml(state.guild.name)}</h2></div><div class="button-row inline-actions">
      <button data-action="upgradeGuild" ${canUpgradeGuild(state) ? '' : 'disabled'}>Upgrade Guild (${guildUpgradeCost(state)}g)</button>
      <button data-action="advanceDay">Begin Day ${state.guild.day + 1}</button>
      <button data-action="saveGame">Save</button>
    </div></div>
    <div class="stats-grid"><span>Level<strong>${state.guild.level}</strong></span><span>Gold<strong>${state.guild.gold}</strong></span><span>Reputation<strong>${state.guild.reputation}</strong></span><span>Heroes<strong>${state.heroes.length}/${state.guild.heroCapacity}</strong></span><span>Materials<strong>${state.guild.materials}</strong></span><span>Research<strong>${state.guild.researchPoints}</strong></span><span>Influence<strong>${state.guild.influence}</strong></span><span>Prestige<strong>${state.guild.prestige}</strong></span></div>
    <p class="helper-text">Identity: <strong>${escapeHtml(state.guild.identity)}</strong> • Mode: <strong>${escapeHtml(state.guild.mode)}</strong> • Day ${state.guild.day}</p>
    <div class="button-row compact-actions"><button data-action="identity" data-value="Noble Protectors">Noble Identity</button><button data-action="identity" data-value="Monster Hunters">Hunter Identity</button><button data-action="mode" data-value="sandbox">Sandbox Mode</button><button data-action="mode" data-value="challenge">Challenge Mode</button></div>
    <p class="helper-text">${escapeHtml(nextUnlock ? renderNextUnlock(state, nextUnlock) : 'All available contracts unlocked.')}</p><p class="helper-text">${escapeHtml(nextActionGuidance(state))}</p>
    ${upgradeReason ? `<p class="blocked-copy">${escapeHtml(upgradeReason)}</p>` : ''}
    <p class="mini-record">Best guild level ${records.highestGuildLevel || 1} • ${records.contractsCompleted || state.guild.contractsCompleted} contracts completed • ${records.legendaryClears || 0} legendary clears</p>
  </section>`;
}

function renderEventPanel(state) {
  return `<section class="panel event-panel"><div class="panel-title-row"><h2>Guild Events</h2><span class="badge">${state.events.length} waiting</span></div>
    ${state.events.length ? `<div class="card-list">${state.events.map(active => { const event = catalogEvent(active.eventId); return event ? `<article class="card event-card"><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p><div class="button-row">${event.options.map(option => `<button data-action="event" data-event-id="${escapeHtml(event.id)}" data-option-id="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}</div></article>` : ''; }).join('')}</div>` : '<p class="empty-copy">No urgent events. Begin another day to see what the world brings.</p>'}
  </section>`;
}

function renderOfflinePanel(state) {
  const summary = state.offlineSummary || {};
  if (!summary.elapsedSeconds && !summary.resolvedContracts) return '';
  const minutes = Math.max(1, Math.floor((summary.elapsedSeconds || 0) / 60));
  return `<section class="panel offline-panel"><div class="panel-title-row"><div><p class="eyebrow">Return report</p><h2>While You Were Away</h2></div><span class="badge">${minutes}m</span></div><p>${summary.resolvedContracts ? `${summary.resolvedContracts} expedition${summary.resolvedContracts === 1 ? '' : 's'} resolved while the guild was unattended.` : 'The guild held its position while you were away.'}</p><p class="helper-text">Offline recovery is safe: absolute contract deadlines were preserved and each completed contract was awarded once.</p></section>`;
}

function renderCampaignPanel(state) {
  const chapter = catalogChapter(state.campaign.activeChapter);
  return `<section class="panel campaign-panel"><div class="panel-title-row"><div><p class="eyebrow">Story campaign</p><h2>${escapeHtml(chapter?.title || 'Campaign complete')}</h2></div><span class="badge">${state.campaign.chaptersCompleted.length}/${CAMPAIGN_CHAPTERS.length}</span></div><p>${escapeHtml(chapter?.description || 'The guild has written its own ending.')}</p><button data-action="advanceCampaign" ${chapter && chapter.requirement(state) ? '' : 'disabled'}>${chapter ? 'Complete chapter' : 'Campaign complete'}</button><div class="chapter-list">${CAMPAIGN_CHAPTERS.map(item => `<span class="chapter-pill ${state.campaign.chaptersCompleted.includes(item.id) ? 'complete' : item.id === state.campaign.activeChapter ? 'current' : ''}">${escapeHtml(item.title)}</span>`).join('')}</div></section>`;
}

function renderHeroPanel(state, recruitReason) {
  return `<section class="panel hero-panel"><div class="panel-title-row"><div><p class="eyebrow">Roster and relationships</p><h2>Heroes</h2></div><button data-action="recruitHero" ${canRecruitHero(state) ? '' : 'disabled'}>Recruit Hero (${RECRUIT_COST}g)</button></div>
    <p class="helper-text">Recruit bonus: +${recruitPowerBonus(state)} power. Training, traits, skills, morale, equipment, injuries, and personal goals shape every expedition.</p>
    ${recruitReason ? `<p class="blocked-copy">${escapeHtml(recruitReason)}</p>` : ''}
    <div class="card-list">${state.heroes.length ? state.heroes.map(hero => renderHero(state, hero)).join('') : '<p class="empty-copy">No heroes yet. Recruit your first hero when you have an open slot and enough gold.</p>'}</div>
  </section>`;
}

function renderHero(state, hero) {
  const equipment = Object.entries(hero.equipment || {}).filter(([, id]) => id).map(([slot, id]) => `${slot}: ${catalogItem(id)?.name || id}`).join(' • ') || 'No equipment equipped';
  const compatibleItems = ITEM_CATALOG.filter(item => item.className === hero.className && state.inventory.some(entry => entry.itemId === item.id && entry.quantity > 0));
  return `<article class="card hero-card"><div class="card-title-row"><div><h3>${escapeHtml(hero.name)}</h3><p>${escapeHtml(hero.className)} • Level ${hero.level} • ${heroTotalPower(hero)} power</p></div><span class="badge ${hero.status === 'idle' ? 'good' : 'busy'}">${hero.status === 'idle' ? 'Idle' : 'On Contract'}</span></div>
    <p>Morale ${hero.morale || 75}% • Traits: ${escapeHtml((hero.traits || []).join(', ') || 'Unproven')}</p><p>Skills: ${escapeHtml((hero.skills || []).join(', ') || 'Learning the trade')}${hero.statusEffects?.length ? ` • Effects: ${escapeHtml(hero.statusEffects.join(', '))}` : ''}</p><p>Gear: ${escapeHtml(equipment)}</p><p class="mini-record">Goal: ${escapeHtml(hero.personalGoal || 'Become a guild veteran.')}${hero.injuries?.length ? ` • Injuries: ${escapeHtml(hero.injuries.join(', '))}` : ''}</p>
    <div class="button-row"><button data-action="trainHero" data-hero-id="${escapeHtml(hero.id)}" ${hero.status === 'idle' ? '' : 'disabled'}>Train Hero</button>${compatibleItems.map(item => `<button data-action="equipItem" data-hero-id="${escapeHtml(hero.id)}" data-item-id="${escapeHtml(item.id)}">Equip ${escapeHtml(item.name)}</button>`).join('')}</div>
  </article>`;
}

function renderContractPanel(state) {
  return `<section class="panel contract-panel"><div class="panel-title-row"><div><p class="eyebrow">Risk and reward</p><h2>Contract Board</h2></div><span class="badge">${CONTRACTS.length} contracts</span></div><div class="card-list">${CONTRACTS.map(contract => renderContract(state, contract)).join('')}</div></section>`;
}

function renderContract(state, contract) {
  const unlocked = isContractUnlocked(state, contract);
  const requirements = contractUnlockRequirements(contract);
  const idleHeroes = unlocked ? state.heroes.filter(hero => hero.status === 'idle') : [];
  const rankedHeroes = [...idleHeroes].sort((left, right) => calculateSuccessChance(heroTotalPower(right), contract.requiredPower) - calculateSuccessChance(heroTotalPower(left), contract.requiredPower));
  const options = rankedHeroes.map((hero, index) => { const chance = calculateSuccessChance(heroTotalPower(hero), contract.requiredPower); return `<button data-action="startContract" data-hero-id="${escapeHtml(hero.id)}" data-contract-id="${escapeHtml(contract.id)}">${escapeHtml(hero.name)} (${chance}%${index === 0 && rankedHeroes.length > 1 ? ' • Best fit' : ''})</button>`; }).join('');
  const actionCopy = unlocked ? options || '<span class="blocked-copy">No idle heroes. Wait for an active contract or recruit another hero.</span>' : `<span class="blocked-copy">${escapeHtml(contractUnlockProgress(state, contract))}</span>`;
  return `<article class="card ${unlocked ? '' : 'locked-card'}"><div class="card-title-row"><div><h3>${escapeHtml(contract.name)}</h3><p>${escapeHtml(contract.tier)} • ${escapeHtml(contract.region || 'frontier')} • ${contract.durationSeconds}s</p></div><span class="badge">${contract.requiredPower} power</span></div><p>${escapeHtml(contract.description || 'A guild contract awaits.')}</p><p>Success: +${contract.rewardGold}g / +${contract.rewardReputation} rep • Failure: +${contract.failureGold}g</p><p class="mini-record">Threat: ${escapeHtml(contract.enemy || 'Unknown')} • Materials: +${contract.rewardMaterials || 0}${contract.rewardItem ? ` • Item: ${escapeHtml(catalogItem(contract.rewardItem)?.name || contract.rewardItem)}` : ''}</p><div class="button-row">${actionCopy}</div></article>`;
}

function renderActivePanel(state) {
  return `<section class="panel active-contracts-panel"><div class="panel-title-row"><h2>Active Expeditions</h2><span class="badge">${state.activeContracts.length} away</span></div><div class="card-list">${state.activeContracts.length ? state.activeContracts.map(active => renderActiveContract(state, active)).join('') : '<p class="empty-copy">No contracts running. Assign an idle hero from the Contract Board.</p>'}</div></section>`;
}

function renderActiveContract(state, active) {
  const { hero, contract } = activeContractDetails(state, active);
  if (!hero || !contract) return '';
  const secondsLeft = Math.max(0, Math.ceil((active.completesAt - Date.now()) / 1000));
  return `<article class="card active-card"><h3>${escapeHtml(contract.name)}</h3><p><strong>${escapeHtml(hero.name)}</strong> is working against ${escapeHtml(contract.enemy || 'unknown threats')}.</p><p aria-label="${secondsLeft} seconds remaining">${secondsLeft}s remaining</p><div class="progress-track"><span style="width:${Math.min(100, Math.max(0, ((Date.now() - active.startedAt) / Math.max(1, active.completesAt - active.startedAt)) * 100))}%"></span></div></article>`;
}

function renderGuildhallPanel(state) {
  return `<section class="panel guildhall-panel"><div class="panel-title-row"><div><p class="eyebrow">Facilities and staff</p><h2>Guildhall</h2></div><span class="badge">${Object.keys(state.rooms).length} rooms</span></div><div class="card-list">${ROOM_CATALOG.map(room => { const level = state.rooms[room.id] || 0; const maxed = level >= room.maxLevel; const cost = roomUpgradeCost(state, room.id); return `<article class="card"><div class="card-title-row"><h3>${escapeHtml(room.name)}</h3><span class="badge">Lv ${level}/${room.maxLevel}</span></div><p>${escapeHtml(room.description)}</p><button data-action="upgradeRoom" data-room-id="${escapeHtml(room.id)}" ${maxed || !canUpgradeRoom(state, room.id) ? 'disabled' : ''}>${maxed ? 'Fully upgraded' : `Upgrade (${cost}g)`}</button></article>`; }).join('')}</div></section>`;
}

function renderWorldPanel(state) {
  return `<section class="panel world-panel"><div class="panel-title-row"><div><p class="eyebrow">Map and exploration</p><h2>World Regions</h2></div><span class="badge">${state.regions.explored.length} explored</span></div><div class="card-list">${REGION_CATALOG.map(region => { const unlocked = state.regions.unlocked.includes(region.id); const explored = state.regions.explored.includes(region.id); return `<article class="card ${unlocked ? '' : 'locked-card'}"><div class="card-title-row"><h3>${escapeHtml(region.name)}</h3><span class="badge">Lv ${region.minGuildLevel}+</span></div><p>${escapeHtml(region.description)}</p><p class="mini-record">Threat: ${escapeHtml(region.threat)}${unlocked ? '' : ` • Unlock: ${region.cost}g`}</p><button data-action="exploreRegion" data-region-id="${escapeHtml(region.id)}" ${!unlocked && (state.guild.level < region.minGuildLevel || state.guild.gold < region.cost) ? 'disabled' : ''}>${explored ? 'Explore again' : unlocked ? 'Explore region' : 'Unlock region'}</button></article>`; }).join('')}</div></section>`;
}

function renderFactionPanel(state) {
  const factions = ['crown', 'merchants', 'mages', 'rangers', 'foundries', 'thieves'];
  return `<section class="panel faction-panel"><div class="panel-title-row"><div><p class="eyebrow">Politics and alliances</p><h2>Faction Standing</h2></div><span class="badge">${state.guild.influence} influence</span></div><div class="card-list">${factions.map(id => { const standing = state.factions[id] || 0; return `<article class="card"><h3>${escapeHtml(id.replaceAll('-', ' '))}</h3><p>Standing: <strong>${standing}</strong></p><button data-action="supportFaction" data-faction-id="${escapeHtml(id)}" ${state.guild.influence < 1 ? 'disabled' : ''}>Pledge Support</button></article>`; }).join('')}</div></section>`;
}

function renderRivalPanel(state) {
  return `<section class="panel rival-panel"><div class="panel-title-row"><div><p class="eyebrow">Competition and pressure</p><h2>Rival Guilds</h2></div><span class="badge">${Object.values(state.rivals).reduce((total, rival) => total + rival.victories, 0)} wins</span></div><div class="card-list">${RIVAL_GUILDS.map(rival => { const score = state.rivals[rival.id] || { victories: 0, defeats: 0 }; return `<article class="card"><div class="card-title-row"><h3>${escapeHtml(rival.name)}</h3><span class="badge">${score.victories}–${score.defeats}</span></div><p>${escapeHtml(rival.style)} • Requires guild level ${rival.requiredGuildLevel}.</p><button data-action="challengeRival" data-rival-id="${escapeHtml(rival.id)}" ${state.guild.level < rival.requiredGuildLevel || !state.heroes.length ? 'disabled' : ''}>Challenge Rival</button></article>`; }).join('')}</div></section>`;
}

function renderTacticalPanel(state) {
  const idleCount = state.heroes.filter(hero => hero.status === 'idle').length;
  const last = state.combat?.lastEncounter;
  return `<section class="panel tactical-panel"><div class="panel-title-row"><div><p class="eyebrow">Expedition preparation</p><h2>Tactical Encounters</h2></div><span class="badge">${state.tactical.encountersWon} wins</span></div><p class="helper-text">Multi-round encounters use all idle heroes as a temporary party. Class abilities create guards, marks, burns, taunts, and evasive openings.</p>${last ? `<p class="mini-record">Last encounter: ${escapeHtml(last.name)} • ${escapeHtml(last.result)} in ${last.rounds} rounds.</p>` : ''}<div class="card-list">${COMBAT_ENCOUNTERS.map(encounter => `<article class="card"><div class="card-title-row"><h3>${escapeHtml(encounter.name)}</h3><span class="badge">${encounter.enemyHp} HP</span></div><p>Enemy: ${escapeHtml(encounter.enemy)} • ${encounter.rounds} rounds • Reward: ${encounter.rewardGold}g and ${encounter.rewardMaterials} materials.</p><button data-action="runTacticalDrill" data-drill-id="${escapeHtml(encounter.id)}" ${idleCount === 0 ? 'disabled' : ''}>Run with ${idleCount} idle hero${idleCount === 1 ? '' : 'es'}</button></article>`).join('')}</div></section>`;
}

function renderRelationshipPanel(state) {
  const pairs = [];
  for (let first = 0; first < state.heroes.length; first += 1) for (let second = first + 1; second < state.heroes.length; second += 1) pairs.push([state.heroes[first], state.heroes[second]]);
  return `<section class="panel relationship-panel"><div class="panel-title-row"><div><p class="eyebrow">Hero stories</p><h2>Relationships</h2></div><span class="badge">${state.relationshipEvents.length} moments</span></div>${pairs.length ? `<div class="card-list">${pairs.map(([first, second]) => { const bond = first.relationships?.[second.id] || 0; return `<article class="card"><h3>${escapeHtml(first.name)} & ${escapeHtml(second.name)}</h3><p>Bond strength: ${bond}/100</p><button data-action="bondHeroes" data-first-hero-id="${escapeHtml(first.id)}" data-second-hero-id="${escapeHtml(second.id)}" ${first.status !== 'idle' || second.status !== 'idle' ? 'disabled' : ''}>Create shared moment</button></article>`; }).join('')}</div>` : '<p class="empty-copy">Recruit two heroes to begin their personal stories.</p>'}</section>`;
}

function renderAchievementPanel(state) {
  return `<section class="panel achievement-panel"><div class="panel-title-row"><div><p class="eyebrow">Milestones</p><h2>Achievements</h2></div><span class="badge">${state.achievements.length}/${ACHIEVEMENT_CATALOG.length}</span></div><div class="card-list">${ACHIEVEMENT_CATALOG.map(achievement => `<article class="card ${state.achievements.includes(achievement.id) ? 'achievement-complete' : ''}"><div class="card-title-row"><h3>${escapeHtml(achievement.name)}</h3><span class="badge">${state.achievements.includes(achievement.id) ? 'Earned' : 'Locked'}</span></div><p>${escapeHtml(achievement.description)}</p></article>`).join('')}</div></section>`;
}

function renderProgressionPanel(state) {
  return `<section class="panel progression-panel"><div class="panel-title-row"><div><p class="eyebrow">Long-term development</p><h2>Research and Specialists</h2></div><span class="badge">${state.research.length}/${RESEARCH_CATALOG.length} researched</span></div><div class="subsection"><h3>Research</h3><div class="card-list">${RESEARCH_CATALOG.map(project => `<article class="card"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p><button data-action="research" data-project-id="${escapeHtml(project.id)}" ${state.research.includes(project.id) || state.guild.researchPoints < project.cost ? 'disabled' : ''}>${state.research.includes(project.id) ? 'Complete' : `Research (${project.cost} pts)`}</button></article>`).join('')}</div></div><div class="subsection"><h3>Guild Staff</h3><div class="card-list">${STAFF_CATALOG.map(staff => `<article class="card"><h3>${escapeHtml(staff.name)}</h3><p>${escapeHtml(staff.description)}</p><button data-action="hireStaff" data-staff-id="${escapeHtml(staff.id)}" ${state.staff.includes(staff.id) || state.guild.gold < staff.cost ? 'disabled' : ''}>${state.staff.includes(staff.id) ? 'Hired' : `Hire (${staff.cost}g)`}</button></article>`).join('')}</div></div></section>`;
}

function renderArmoryPanel(state) {
  const inventory = state.inventory.map(entry => { const item = catalogItem(entry.itemId); return item ? `<span class="inventory-chip">${escapeHtml(item.name)} ×${entry.quantity}</span>` : ''; }).join('');
  return `<section class="panel armory-panel"><div class="panel-title-row"><div><p class="eyebrow">Equipment and crafting</p><h2>Armory & Workshop</h2></div><span class="badge">${state.guild.materials} materials</span></div><p class="helper-text">Inventory: ${inventory || 'No equipment stored yet.'}</p><div class="card-list">${ITEM_CATALOG.map(item => `<article class="card"><div class="card-title-row"><h3>${escapeHtml(item.name)}</h3><span class="badge">${escapeHtml(item.rarity)} • +${item.power}</span></div><p>${escapeHtml(item.className)} • ${escapeHtml(item.slot)} • Buy ${item.cost}g</p><div class="button-row"><button data-action="buyItem" data-item-id="${escapeHtml(item.id)}" ${state.guild.gold < item.cost ? 'disabled' : ''}>Buy</button><button data-action="craftItem" data-item-id="${escapeHtml(item.id)}" ${state.guild.materials < 3 ? 'disabled' : ''}>Craft</button></div></article>`).join('')}</div></section>`;
}

function renderRecordsPanel(state) {
  const records = state.guild.records || {};
  return `<section class="panel records-panel"><div class="panel-title-row"><div><p class="eyebrow">Permanent history</p><h2>Guild Records</h2></div><span class="badge">${state.guild.prestige} prestige</span></div><div class="stats-grid record-grid"><span>Gold earned<strong>${state.guild.totalGoldEarned}</strong></span><span>Contracts<strong>${state.guild.contractsCompleted}</strong></span><span>Failures<strong>${state.guild.contractsFailed}</strong></span><span>Heroes recruited<strong>${records.heroesRecruited || 0}</strong></span><span>Highest guild<strong>${records.highestGuildLevel || 1}</strong></span><span>Highest hero<strong>${records.highestHeroLevel || 1}</strong></span><span>Regions explored<strong>${records.regionsExplored || 0}</strong></span><span>Bosses defeated<strong>${records.bossesDefeated || 0}</strong></span></div><div class="button-row">${GAME_MODES.map(mode => `<button data-action="mode" data-value="${escapeHtml(mode.id)}">${escapeHtml(mode.name)} mode</button>`).join('')}</div></section>`;
}

function renderLogPanel(state) {
  return `<section class="panel guild-log-panel"><div class="panel-title-row"><div><p class="eyebrow">Durable history</p><h2>Guild Log</h2></div><button data-action="resetGame" class="danger">Reset</button></div><p class="helper-text">Newest events appear first. Every contract, discovery, upgrade, and decision becomes part of the guild’s history.</p><ul class="log-list">${state.log.slice(0, 16).map(renderLogEntry).join('')}</ul></section>`;
}

function bindActions(root, actions) {
  root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'startContract') actions.startContract(button.dataset.heroId, button.dataset.contractId);
    else if (action === 'event') actions.chooseEvent(button.dataset.eventId, button.dataset.optionId);
    else if (action === 'identity') actions.setGuildIdentity(button.dataset.value);
    else if (action === 'mode') actions.setMode(button.dataset.value);
    else if (action === 'trainHero') actions.trainHero(button.dataset.heroId);
    else if (action === 'equipItem') actions.equipItem(button.dataset.heroId, button.dataset.itemId);
    else if (action === 'upgradeRoom') actions.upgradeRoom(button.dataset.roomId);
    else if (action === 'exploreRegion') actions.exploreRegion(button.dataset.regionId);
    else if (action === 'supportFaction') actions.supportFaction(button.dataset.factionId);
    else if (action === 'research') actions.researchProject(button.dataset.projectId);
    else if (action === 'hireStaff') actions.hireStaff(button.dataset.staffId);
    else if (action === 'buyItem') actions.buyItem(button.dataset.itemId);
    else if (action === 'craftItem') actions.craftItem(button.dataset.itemId);
    else if (action === 'upgradeGuild') actions.upgradeGuild();
    else if (action === 'advanceDay') actions.advanceDay();
    else if (action === 'advanceCampaign') actions.advanceCampaign();
    else if (action === 'challengeRival') actions.challengeRival(button.dataset.rivalId);
    else if (action === 'runTacticalDrill') actions.runTacticalDrill(button.dataset.drillId);
    else if (action === 'bondHeroes') actions.bondHeroes(button.dataset.firstHeroId, button.dataset.secondHeroId);
    else if (action === 'recruitHero') actions.recruitHero();
    else if (action === 'saveGame') actions.saveGame();
    else if (action === 'resetGame') actions.resetGame();
  }));
}

function renderNextUnlock(state, contract) { const requirements = contractUnlockRequirements(contract); return `Next unlock: ${contract.name}. Guild level: ${state.guild.level} / ${requirements.minGuildLevel}. Reputation: ${state.guild.reputation} / ${requirements.minReputation}.`; }

export function nextActionGuidance(state) {
  if (state.heroes.length === 0) return 'Next action: recruit your first hero.';
  if (!state.heroes.some(hero => hero.status === 'idle') && state.activeContracts.length > 0) return 'Next action: wait for an active contract to finish.';
  const nextUnlock = nextContractUnlock(state);
  if (nextUnlock) {
    const requirements = contractUnlockRequirements(nextUnlock);
    if (state.guild.level >= requirements.minGuildLevel && state.guild.reputation < requirements.minReputation) return `Next action: earn ${requirements.minReputation - state.guild.reputation} reputation to unlock ${nextUnlock.name}.`;
    if (state.guild.level < requirements.minGuildLevel && canUpgradeGuild(state)) return `Next action: upgrade the guild to level ${state.guild.level + 1}.`;
  }
  if (state.heroes.some(hero => hero.status === 'idle')) {
    const highestUnlockedContract = [...CONTRACTS].reverse().find(contract => isContractUnlocked(state, contract));
    return `Next action: assign an idle hero to ${highestUnlockedContract.name}.`;
  }
  if (canRecruitHero(state)) return 'Next action: recruit another hero.';
  return 'Next action: prepare the guild for its next contract.';
}

export function rankHeroesForContract(heroes, contract) { return [...heroes].sort((left, right) => calculateSuccessChance(heroTotalPower(right), contract.requiredPower) - calculateSuccessChance(heroTotalPower(left), contract.requiredPower)); }
function renderLogEntry(entry) { const message = typeof entry === 'string' ? entry : entry?.message; return `<li>${escapeHtml(message || 'Guild event')}</li>`; }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

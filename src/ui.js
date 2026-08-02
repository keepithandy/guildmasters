import { CONTRACTS, activeContractDetails, calculateSuccessChance, contractUnlockProgress, contractUnlockRequirements, isContractUnlocked, nextContractUnlock } from './contracts.js';
import { canUpgradeGuild, guildUpgradeBlockedReason, guildUpgradeCost, canUpgradeRoom, roomUpgradeCost } from './guild.js';
import { canRecruitHero, heroTotalPower, RECRUIT_COST, recruitPowerBonus, recruitmentBlockedReason } from './heroes.js';
import { ACHIEVEMENT_CATALOG, BOSS_ENCOUNTERS, CAMPAIGN_CHAPTERS, COMBAT_ENCOUNTERS, EVENT_CATALOG, GAME_MODES, ITEM_CATALOG, REGION_CATALOG, RESEARCH_CATALOG, RIVAL_GUILDS, ROOM_CATALOG, STAFF_CATALOG, STORY_DECISIONS, catalogChapter, catalogEvent, catalogItem } from './content.js';
import { loadPreferences, updatePreferences } from './preferences.js';
import { partyUnavailableReason, repairPartySelection } from './partySelection.js';
import { TUTORIAL_STEPS, currentTutorialStep, isLastTutorialStep, syncTutorialTarget } from './tutorial.js';

let notificationsOpen = false;
let completionTicker = null;

export function render(state, actions) {
  const root = document.getElementById('app');
  if (!root) return;
  const uiState = actions.getUiState?.() || {};
  const nextUnlock = nextContractUnlock(state);
  const recruitReason = recruitmentBlockedReason(state);
  const upgradeReason = guildUpgradeBlockedReason(state);
  const preferences = loadPreferences();
  root.dataset.density = preferences.density;
  root.innerHTML = `
    ${renderCommandBar(state, preferences, uiState)}
    <p id="guildStatus" class="status-banner" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(state.statusMessage || 'Guild ready.')}</p>
    ${renderSaveRecovery(state, uiState)}
    ${renderGuildPanel(state, nextUnlock, upgradeReason)}
    ${renderOfflinePanel(state)}
    ${renderCampaignPanel(state)}
    ${renderStoryDecisionPanel(state)}
    ${renderEventPanel(state)}
    ${renderHeroPanel(state, recruitReason)}
    ${renderContractPanel(state)}
    ${renderActivePanel(state)}
    ${renderGuildhallPanel(state)}
    ${renderWorldPanel(state)}
    ${renderFactionPanel(state)}
    ${renderRivalPanel(state)}
    ${renderTacticalPanel(state)}
    ${renderBossPanel(state)}
    ${renderRelationshipPanel(state)}
    ${renderAchievementPanel(state)}
    ${renderProgressionPanel(state)}
    ${renderArmoryPanel(state)}
    ${renderRecordsPanel(state)}
    ${renderLogPanel(state)}
    ${renderMobileTray()}
    ${renderShortcutHelp(uiState)}
    ${renderImportDialog(uiState)}
    ${renderTutorial(uiState)}
    <input id="saveImportInput" type="file" accept="application/json,.json" hidden>
  `;
  bindActions(root, actions);
  decorateDashboard(root, actions, preferences);
  refreshCompletionTimers(root);
  syncTutorialTarget(root, uiState.tutorial, window);
  if (uiState.tutorial?.active) queueMicrotask(() => root.querySelector('[data-tutorial-primary]')?.focus());
}

function renderCommandBar(state, preferences, uiState) {
  const unreadCount = state.log.filter(entry => Number(entry?.timestamp) > Number(preferences.notificationsReadAt || 0)).length;
  const recentEntries = state.log.slice(0, 8);
  return `<section id="command-bar" class="command-bar" data-density="${escapeHtml(preferences.density)}" aria-label="Guild at a glance">
    <div class="command-bar-heading"><p class="eyebrow">At a glance</p><strong>Day ${state.guild.day}</strong><span>${state.heroes.filter(hero => hero.status === 'idle').length} idle heroes • ${state.activeContracts.length} expeditions away</span></div>
    <div class="command-resources" aria-label="Guild resources"><span>Gold<strong>${state.guild.gold}</strong></span><span>Rep<strong>${state.guild.reputation}</strong></span><span>Materials<strong>${state.guild.materials}</strong></span><span>Influence<strong>${state.guild.influence}</strong></span></div>
    <div class="command-bar-actions"><button data-action="advanceDay">Begin Day ${state.guild.day + 1}</button><button data-action="saveGame" class="secondary-action" title="Alt+S">Save</button><span class="save-indicator ${saveStatusClass(uiState.saveStatus)}" role="status" aria-live="polite">${escapeHtml(uiState.saveStatus || 'Saved')}</span><button data-ui-action="exportSave" class="text-action">Export</button><button data-ui-action="openImport" class="text-action">Import</button><button data-ui-action="startTutorial" class="text-action">Tutorial</button><button data-ui-action="toggleShortcutHelp" class="text-action" title="?">Shortcuts</button><button data-ui-action="toggleNotifications" class="notification-trigger secondary-action" aria-expanded="${notificationsOpen}" aria-controls="notificationCenter">Alerts <span class="notification-count ${unreadCount ? 'has-unread' : ''}">${unreadCount}</span></button><label class="density-control">View<select data-ui-control="density" aria-label="Display density"><option value="comfortable" ${preferences.density === 'comfortable' ? 'selected' : ''}>Comfortable</option><option value="compact" ${preferences.density === 'compact' ? 'selected' : ''}>Compact</option></select></label></div>
    <div id="notificationCenter" class="notification-center" ${notificationsOpen ? '' : 'hidden'}><div class="notification-heading"><strong>Recent activity</strong><button data-ui-action="markNotificationsRead" class="text-action">Mark read</button></div>${recentEntries.length ? `<ul>${recentEntries.map(entry => `<li><span>${escapeHtml(entry.message)}</span><small>${formatRelativeTime(entry.timestamp)}</small></li>`).join('')}</ul>` : '<p class="empty-copy">No activity yet.</p>'}<button data-ui-action="openLog" class="text-action">Open Guild Log</button></div>
  </section>`;
}

function renderSaveRecovery(state, uiState) {
  const retry = uiState.saveStatus === 'Save failed' || state.lastAction?.retryAction === 'retrySave';
  const undo = uiState.undoPreferences?.expiresAt > Date.now();
  return `<div class="qol-recovery-row">${retry ? '<button data-ui-action="retrySave" class="secondary-action">Retry save</button>' : ''}${undo ? '<button data-ui-action="undoPreference" class="text-action">Undo view change</button>' : ''}</div>`;
}

function renderGuildPanel(state, nextUnlock, upgradeReason) {
  const records = state.guild.records || {};
  return `<section id="guild-overview" class="panel guild-panel" tabindex="-1">
    <div class="panel-title-row"><div><p class="eyebrow">Guild command</p><h2>${escapeHtml(state.guild.name)}</h2></div><div class="button-row inline-actions">
      <button data-action="upgradeGuild" data-confirm="Upgrade the guild for ${guildUpgradeCost(state)} gold. This permanently spends gold and raises hero capacity." ${canUpgradeGuild(state) ? '' : 'disabled'}>Upgrade Guild (${guildUpgradeCost(state)}g)</button>
      <button data-action="advanceDay">Begin Day ${state.guild.day + 1}</button>
      <button data-action="saveGame">Save</button>
    </div></div>
    <div class="stats-grid"><span>Level<strong>${state.guild.level}</strong></span><span>Gold<strong>${state.guild.gold}</strong></span><span>Reputation<strong>${state.guild.reputation}</strong></span><span>Heroes<strong>${state.heroes.length}/${state.guild.heroCapacity}</strong></span><span>Materials<strong>${state.guild.materials}</strong></span><span>Research<strong>${state.guild.researchPoints}</strong></span><span>Influence<strong>${state.guild.influence}</strong></span><span>World threat<strong>${state.worldThreat || 0}%</strong></span></div>
    <p class="helper-text">Identity: <strong>${escapeHtml(state.guild.identity)}</strong> • Mode: <strong>${escapeHtml(state.guild.mode)}</strong> • Day ${state.guild.day}</p>
    <div class="button-row compact-actions"><button data-action="identity" data-value="Noble Protectors">Noble Identity</button><button data-action="identity" data-value="Monster Hunters">Hunter Identity</button><button data-action="mode" data-value="sandbox">Sandbox Mode</button><button data-action="mode" data-value="challenge">Challenge Mode</button></div>
    <p class="helper-text">${escapeHtml(nextUnlock ? renderNextUnlock(state, nextUnlock) : 'All available contracts unlocked.')}</p><p class="helper-text">${escapeHtml(nextActionGuidance(state))}</p>
    ${upgradeReason ? `<p class="blocked-copy">${escapeHtml(upgradeReason)}</p>` : ''}
    <p class="mini-record">Best guild level ${records.highestGuildLevel || 1} • ${records.contractsCompleted || state.guild.contractsCompleted} contracts completed • ${records.legendaryClears || 0} legendary clears</p>
  </section>`;
}

function renderEventPanel(state) {
  return `<section id="guild-events" class="panel event-panel" tabindex="-1"><div class="panel-title-row"><h2>Guild Events</h2><span class="badge">${state.events.length} waiting</span></div>
    ${state.events.length ? `<div class="card-list">${state.events.map(active => { const event = catalogEvent(active.eventId); return event ? `<article class="card event-card"><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p><div class="button-row">${event.options.map(option => `<button data-action="event" data-event-id="${escapeHtml(event.id)}" data-option-id="${escapeHtml(option.id)}" data-confirm="${escapeHtml(eventOutcome(option))}">${escapeHtml(option.label)} <small>${escapeHtml(eventOutcome(option))}</small></button>`).join('')}</div></article>` : ''; }).join('')}</div>` : '<p class="empty-copy">No urgent events. Begin another day to see what the world brings.</p>'}
  </section>`;
}

function renderStoryDecisionPanel(state) {
  const available = STORY_DECISIONS.filter(decision => state.campaign.chaptersCompleted.includes(decision.chapterId) && !state.campaign.decisionsMade.includes(decision.id));
  if (!available.length) return '';
  return `<section id="story-decisions" class="panel story-decision-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Branching story</p><h2>Decisions Await</h2></div><span class="badge">${available.length} choice${available.length === 1 ? '' : 's'}</span></div><div class="card-list">${available.map(decision => `<article class="card"><h3>${escapeHtml(decision.title)}</h3><p>${escapeHtml(decision.prompt)}</p><div class="button-row">${decision.options.map(option => `<button data-action="storyChoice" data-decision-id="${escapeHtml(decision.id)}" data-option-id="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}</div></article>`).join('')}</div></section>`;
}

function renderOfflinePanel(state) {
  const summary = state.offlineSummary || {};
  if (!summary.elapsedSeconds && !summary.resolvedContracts) return '';
  const minutes = Math.max(1, Math.floor((summary.elapsedSeconds || 0) / 60));
  return `<section id="offline-report" class="panel offline-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Return report</p><h2>While You Were Away</h2></div><span class="badge">${minutes}m</span></div><p>${summary.resolvedContracts ? `${summary.resolvedContracts} expedition${summary.resolvedContracts === 1 ? '' : 's'} resolved while the guild was unattended.` : 'The guild held its position while you were away.'}</p><p class="helper-text">Offline recovery is safe: absolute contract deadlines were preserved and each completed contract was awarded once.</p></section>`;
}

function renderCampaignPanel(state) {
  const chapter = catalogChapter(state.campaign.activeChapter);
  return `<section id="campaign" class="panel campaign-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Story campaign</p><h2>${escapeHtml(chapter?.title || 'Campaign complete')}</h2></div><span class="badge">${state.campaign.chaptersCompleted.length}/${CAMPAIGN_CHAPTERS.length}</span></div><p>${escapeHtml(chapter?.description || 'The guild has written its own ending.')}</p><button data-action="advanceCampaign" ${chapter && chapter.requirement(state) ? '' : 'disabled'}>${chapter ? 'Complete chapter' : 'Campaign complete'}</button><div class="chapter-list">${CAMPAIGN_CHAPTERS.map(item => `<span class="chapter-pill ${state.campaign.chaptersCompleted.includes(item.id) ? 'complete' : item.id === state.campaign.activeChapter ? 'current' : ''}">${escapeHtml(item.title)}</span>`).join('')}</div></section>`;
}

function renderHeroPanel(state, recruitReason) {
  const preferences = loadPreferences();
  const heroFilter = preferences.heroFilter || 'all';
  const heroSort = preferences.heroSort || 'recommended';
  const visibleHeroes = sortHeroes(filterHeroes(state.heroes, heroFilter), heroSort);
  const selected = repairPartySelection(preferences.partyHeroIds, state.heroes);
  return `<section id="heroes" class="panel hero-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Roster and relationships</p><h2>Heroes <span class="section-count">${visibleHeroes.length}/${state.heroes.length}</span></h2></div><button data-action="recruitHero" ${canRecruitHero(state) ? '' : 'disabled'}>Recruit Hero (${RECRUIT_COST}g)</button></div>
    <p class="helper-text">Recruit bonus: +${recruitPowerBonus(state)} power. Training, traits, skills, morale, equipment, injuries, and personal goals shape every expedition.</p>
    ${recruitReason ? `<p class="blocked-copy">${escapeHtml(recruitReason)}</p>` : ''}
    <div class="qol-toolbar"><label>Show<select data-ui-control="heroFilter" aria-label="Filter heroes"><option value="all" ${heroFilter === 'all' ? 'selected' : ''}>All heroes</option><option value="idle" ${heroFilter === 'idle' ? 'selected' : ''}>Idle</option><option value="deployed" ${heroFilter === 'deployed' ? 'selected' : ''}>On contract</option><option value="injured" ${heroFilter === 'injured' ? 'selected' : ''}>Injured</option></select></label><label>Sort<select data-ui-control="heroSort" aria-label="Sort heroes"><option value="recommended" ${heroSort === 'recommended' ? 'selected' : ''}>Recommended</option><option value="power" ${heroSort === 'power' ? 'selected' : ''}>Power</option><option value="level" ${heroSort === 'level' ? 'selected' : ''}>Level</option><option value="morale" ${heroSort === 'morale' ? 'selected' : ''}>Morale</option><option value="name" ${heroSort === 'name' ? 'selected' : ''}>Name</option></select></label><button data-ui-action="selectVisibleHeroes" class="text-action">Select all visible</button><button data-ui-action="clearRosterSelection" class="text-action">Clear selection</button><button data-ui-action="bulkTrain" class="text-action" data-confirm="Train selected idle heroes for their exact combined cost?">Train selected</button></div>
    <div class="card-list">${visibleHeroes.length ? visibleHeroes.map(hero => renderHero(state, hero, selected)).join('') : state.heroes.length ? '<p class="empty-copy">No heroes match this view.</p>' : '<p class="empty-copy">No heroes yet. Recruit your first hero when you have an open slot and enough gold.</p>'}</div>
  </section>`;
}

function renderHero(state, hero, selected) {
  const equipment = Object.entries(hero.equipment || {}).filter(([, id]) => id).map(([slot, id]) => `${slot}: ${catalogItem(id)?.name || id}`).join(' • ') || 'No equipment equipped';
  const compatibleItems = ITEM_CATALOG.filter(item => item.className === hero.className && state.inventory.some(entry => entry.itemId === item.id && entry.quantity > 0));
  const unavailable = partyUnavailableReason(hero);
  return `<article class="card hero-card"><div class="card-title-row"><div><h3>${escapeHtml(hero.name)}</h3><p>${escapeHtml(hero.className)} • Level ${hero.level} • ${heroTotalPower(hero)} power</p></div><span class="badge ${hero.status === 'idle' ? 'good' : 'busy'}">${hero.status === 'idle' ? 'Idle' : 'On Contract'}</span></div>
    <p>Morale ${hero.morale ?? 75}% • Traits: ${escapeHtml((hero.traits || []).join(', ') || 'Unproven')}</p><p>Skills: ${escapeHtml((hero.skills || []).join(', ') || 'Learning the trade')}${hero.statusEffects?.length ? ` • Effects: ${escapeHtml(hero.statusEffects.join(', '))}` : ''}</p><p>Gear: ${escapeHtml(equipment)}</p><p class="mini-record">Goal: ${escapeHtml(hero.personalGoal || 'Become a guild veteran.')}${hero.injuries?.length ? ` • Injuries: ${escapeHtml(hero.injuries.join(', '))}` : ''}</p>
    <div class="button-row"><label class="roster-select"><input type="checkbox" data-party-id="${escapeHtml(hero.id)}" ${selected.includes(hero.id) ? 'checked' : ''} ${unavailable ? 'disabled' : ''}> Party${unavailable ? ` (${escapeHtml(unavailable)})` : ''}</label><button data-action="trainHero" data-hero-id="${escapeHtml(hero.id)}" data-confirm="Training ${escapeHtml(hero.name)} costs ${20 + (hero.level * 10)} gold and permanently spends it." ${hero.status === 'idle' ? '' : 'disabled'}>Train Hero</button>${compatibleItems.map(item => `<button data-action="equipItem" data-hero-id="${escapeHtml(hero.id)}" data-item-id="${escapeHtml(item.id)}">Equip ${escapeHtml(item.name)}</button>`).join('')}</div>
  </article>`;
}

function renderContractPanel(state) {
  const preferences = loadPreferences();
  const contractFilter = preferences.contractFilter || 'all';
  const contractSort = preferences.contractSort || 'recommended';
  const visibleContracts = sortContracts(filterContracts(state, contractFilter), contractSort, state);
  return `<section id="contract-board" class="panel contract-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Risk and reward</p><h2>Contract Board <span class="section-count">${visibleContracts.length}/${CONTRACTS.length}</span></h2></div><span class="badge">${state.activeContracts.length} active</span></div><div class="qol-toolbar"><label>Show<select data-ui-control="contractFilter" aria-label="Filter contracts"><option value="all" ${contractFilter === 'all' ? 'selected' : ''}>All contracts</option><option value="available" ${contractFilter === 'available' ? 'selected' : ''}>Available</option><option value="locked" ${contractFilter === 'locked' ? 'selected' : ''}>Locked</option><option value="boss" ${contractFilter === 'boss' ? 'selected' : ''}>Boss contracts</option></select></label><label>Sort<select data-ui-control="contractSort" aria-label="Sort contracts"><option value="recommended" ${contractSort === 'recommended' ? 'selected' : ''}>Recommended</option><option value="reward" ${contractSort === 'reward' ? 'selected' : ''}>Reward</option><option value="power" ${contractSort === 'power' ? 'selected' : ''}>Required power</option><option value="duration" ${contractSort === 'duration' ? 'selected' : ''}>Duration</option></select></label></div><div class="card-list">${visibleContracts.length ? visibleContracts.map(contract => renderContract(state, contract)).join('') : '<p class="empty-copy">No contracts match this view.</p>'}</div></section>`;
}

function renderContract(state, contract) {
  const unlocked = isContractUnlocked(state, contract);
  const idleHeroes = unlocked ? state.heroes.filter(hero => hero.status === 'idle') : [];
  const rankedHeroes = [...idleHeroes].sort((left, right) => calculateSuccessChance(heroTotalPower(right), contract.requiredPower) - calculateSuccessChance(heroTotalPower(left), contract.requiredPower));
  const options = rankedHeroes.map((hero, index) => { const chance = calculateSuccessChance(heroTotalPower(hero), contract.requiredPower); return `<button data-action="startContract" data-hero-id="${escapeHtml(hero.id)}" data-contract-id="${escapeHtml(contract.id)}" ${index === 0 ? 'class="recommended-action"' : ''}>${index === 0 ? 'Assign ' : ''}${escapeHtml(hero.name)} (${chance}%${index === 0 && rankedHeroes.length > 1 ? ' • Best fit' : ''})</button>`; }).join('');
  const actionCopy = unlocked ? options || '<span class="blocked-copy">No idle heroes. Wait for an active contract or recruit another hero.</span>' : `<span class="blocked-copy">${escapeHtml(contractUnlockProgress(state, contract))}</span><details class="requirements-details"><summary>Show unlock path</summary>${renderContractRequirements(state, contract)}</details>`;
  return `<article class="card ${unlocked ? '' : 'locked-card'}"><div class="card-title-row"><div><h3>${escapeHtml(contract.name)}</h3><p>${escapeHtml(contract.tier)} • ${escapeHtml(contract.region || 'frontier')} • ${formatDuration(contract.durationSeconds)}</p></div><span class="badge">${contract.requiredPower} power</span></div><p>${escapeHtml(contract.description || 'A guild contract awaits.')}</p><p>Success: +${contract.rewardGold}g / +${contract.rewardReputation} rep • Failure: +${contract.failureGold}g</p><p class="mini-record">Threat: ${escapeHtml(contract.enemy || 'Unknown')} • Materials: +${contract.rewardMaterials || 0}${contract.rewardItem ? ` • Item: ${escapeHtml(catalogItem(contract.rewardItem)?.name || contract.rewardItem)}` : ''}</p><div class="button-row">${actionCopy}</div></article>`;
}

function renderActivePanel(state) {
  const preferences = loadPreferences();
  const filter = preferences.queueFilter || 'all';
  const sort = preferences.queueSort || 'remaining';
  const now = Date.now();
  const visible = state.activeContracts.filter(active => filter === 'all' || filter === 'ready' ? (filter !== 'ready' || active.completesAt <= now) : active.completesAt > now)
    .sort((left, right) => sort === 'name' ? String(left.contractId).localeCompare(String(right.contractId)) : left.completesAt - right.completesAt);
  return `<section id="active-expeditions" class="panel active-contracts-panel" tabindex="-1"><div class="panel-title-row"><h2>Active Expeditions</h2><span class="badge">${state.activeContracts.length} away</span></div><div class="qol-toolbar"><label>Show<select data-ui-control="queueFilter" aria-label="Filter expedition queue"><option value="all">All</option><option value="running" ${filter === 'running' ? 'selected' : ''}>Running</option><option value="ready" ${filter === 'ready' ? 'selected' : ''}>Ready</option></select></label><label>Sort<select data-ui-control="queueSort" aria-label="Sort expedition queue"><option value="remaining" ${sort === 'remaining' ? 'selected' : ''}>Time remaining</option><option value="name" ${sort === 'name' ? 'selected' : ''}>Contract</option></select></label></div><div class="card-list">${visible.length ? visible.map(active => renderActiveContract(state, active)).join('') : '<p class="empty-copy">No expeditions match this view.</p>'}</div></section>`;
}

function renderActiveContract(state, active) {
  const { hero, contract } = activeContractDetails(state, active);
  if (!hero || !contract) return '';
  const secondsLeft = Math.max(0, Math.ceil((active.completesAt - Date.now()) / 1000));
  return `<article class="card active-card" data-completes-at="${active.completesAt}" data-started-at="${active.startedAt}"><h3>${escapeHtml(contract.name)}</h3><p><strong>${escapeHtml(hero.name)}</strong> is working against ${escapeHtml(contract.enemy || 'unknown threats')}.</p><p data-remaining aria-label="${secondsLeft} seconds remaining">${secondsLeft}s remaining</p><div class="progress-track"><span data-progress style="width:${Math.min(100, Math.max(0, ((Date.now() - active.startedAt) / Math.max(1, active.completesAt - active.startedAt)) * 100))}%"></span></div></article>`;
}

function renderGuildhallPanel(state) {
  return `<section id="guildhall" class="panel guildhall-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Facilities and staff</p><h2>Guildhall</h2></div><span class="badge">${Object.keys(state.rooms).length} rooms</span></div><div class="card-list">${ROOM_CATALOG.map(room => { const level = state.rooms[room.id] || 0; const maxed = level >= room.maxLevel; const cost = roomUpgradeCost(state, room.id); return `<article class="card"><div class="card-title-row"><h3>${escapeHtml(room.name)}</h3><span class="badge">Lv ${level}/${room.maxLevel}</span></div><p>${escapeHtml(room.description)}</p><button data-action="upgradeRoom" data-room-id="${escapeHtml(room.id)}" data-confirm="Upgrade ${escapeHtml(room.name)} for ${cost} gold. This permanently spends gold." ${maxed || !canUpgradeRoom(state, room.id) ? 'disabled' : ''}>${maxed ? 'Fully upgraded' : `Upgrade (${cost}g)`}</button></article>`; }).join('')}</div></section>`;
}

function renderWorldPanel(state) {
  return `<section id="world-regions" class="panel world-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Map and exploration</p><h2>World Regions</h2></div><span class="badge">${state.regions.explored.length} explored</span></div><div class="card-list">${REGION_CATALOG.map(region => { const unlocked = state.regions.unlocked.includes(region.id); const explored = state.regions.explored.includes(region.id); return `<article class="card ${unlocked ? '' : 'locked-card'}"><div class="card-title-row"><h3>${escapeHtml(region.name)}</h3><span class="badge">Lv ${region.minGuildLevel}+</span></div><p>${escapeHtml(region.description)}</p><p class="mini-record">Threat: ${escapeHtml(region.threat)}${unlocked ? '' : ` • Unlock: ${region.cost}g`}</p><button data-action="exploreRegion" data-region-id="${escapeHtml(region.id)}" ${!unlocked && (state.guild.level < region.minGuildLevel || state.guild.gold < region.cost) ? 'disabled' : ''}>${explored ? 'Explore again' : unlocked ? 'Explore region' : 'Unlock region'}</button></article>`; }).join('')}</div></section>`;
}

function renderFactionPanel(state) {
  const factions = ['crown', 'merchants', 'mages', 'rangers', 'foundries', 'thieves'];
  return `<section id="factions" class="panel faction-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Politics and alliances</p><h2>Faction Standing</h2></div><span class="badge">${state.guild.influence} influence</span></div><div class="card-list">${factions.map(id => { const standing = state.factions[id] || 0; return `<article class="card"><h3>${escapeHtml(id.replaceAll('-', ' '))}</h3><p>Standing: <strong>${standing}</strong></p><button data-action="supportFaction" data-faction-id="${escapeHtml(id)}" ${state.guild.influence < 1 ? 'disabled' : ''}>Pledge Support</button></article>`; }).join('')}</div></section>`;
}

function renderRivalPanel(state) {
  return `<section id="rival-guilds" class="panel rival-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Competition and pressure</p><h2>Rival Guilds</h2></div><span class="badge">${Object.values(state.rivals).reduce((total, rival) => total + rival.victories, 0)} wins</span></div><div class="card-list">${RIVAL_GUILDS.map(rival => { const score = state.rivals[rival.id] || { victories: 0, defeats: 0, heat: 0, lastAction: '' }; return `<article class="card"><div class="card-title-row"><h3>${escapeHtml(rival.name)}</h3><span class="badge">${score.victories}–${score.defeats}</span></div><p>${escapeHtml(rival.style)} • Requires guild level ${rival.requiredGuildLevel}.</p><p class="mini-record">Rival heat: ${score.heat || 0}/10${score.lastAction ? ` • Last action: ${escapeHtml(score.lastAction)}` : ''}</p><button data-action="challengeRival" data-rival-id="${escapeHtml(rival.id)}" ${state.guild.level < rival.requiredGuildLevel || !state.heroes.length ? 'disabled' : ''}>Challenge Rival</button></article>`; }).join('')}</div></section>`;
}

function renderTacticalPanel(state) {
  const party = selectedParty(state);
  const last = state.combat?.lastEncounter;
  return `<section id="tactical-encounters" class="panel tactical-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Expedition preparation</p><h2>Tactical Encounters</h2></div><span class="badge">${state.tactical.encountersWon} wins</span></div>${renderPartyBuilder(state, party)}<p class="helper-text">Selected idle heroes form a temporary party; recommended selection uses the three highest-power idle heroes, with names breaking ties.</p>${last ? `<p class="mini-record">Last encounter: ${escapeHtml(last.name)} • ${escapeHtml(last.result)} in ${last.rounds} rounds.</p>` : ''}<div class="card-list">${COMBAT_ENCOUNTERS.map(encounter => `<article class="card"><div class="card-title-row"><h3>${escapeHtml(encounter.name)}</h3><span class="badge">${encounter.enemyHp} HP</span></div><p>Enemy: ${escapeHtml(encounter.enemy)} • ${encounter.rounds} rounds • Reward: ${encounter.rewardGold}g and ${encounter.rewardMaterials} materials.</p><button data-action="runTacticalDrill" data-drill-id="${escapeHtml(encounter.id)}" ${party.length === 0 ? 'disabled' : ''}>Run with ${party.length} selected hero${party.length === 1 ? '' : 'es'}</button></article>`).join('')}</div></section>`;
}

function renderBossPanel(state) {
  const party = selectedParty(state);
  return `<section id="boss-expeditions" class="panel boss-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Legendary endgame</p><h2>Boss Expeditions</h2></div><span class="badge">${state.bosses.defeated.length}/${BOSS_ENCOUNTERS.length} defeated</span></div><p class="helper-text">Each boss has unique phases, mechanics, requirements, and a persistent defeat record.</p><div class="card-list">${BOSS_ENCOUNTERS.map(boss => { const defeated = state.bosses.defeated.includes(boss.id); const unlocked = state.guild.level >= boss.requiredGuildLevel && state.guild.reputation >= boss.requiredReputation && state.regions.unlocked.includes(boss.region); return `<article class="card ${unlocked ? '' : 'locked-card'}"><div class="card-title-row"><h3>${escapeHtml(boss.name)}</h3><span class="badge">${boss.phases.length} phases</span></div><p>${escapeHtml(boss.description)}</p><p class="mini-record">Requires guild ${boss.requiredGuildLevel} • ${boss.requiredReputation} reputation • ${escapeHtml(boss.region.replaceAll('-', ' '))}</p><button data-action="challengeBoss" data-boss-id="${escapeHtml(boss.id)}" ${!unlocked || party.length === 0 || defeated ? 'disabled' : ''}>${defeated ? 'Defeated' : `Challenge with ${party.length} selected heroes`}</button></article>`; }).join('')}</div></section>`;
}

function renderPartyBuilder(state, selected) {
  const idle = state.heroes.filter(hero => hero.status === 'idle');
  return `<div class="party-builder" aria-label="Party builder"><div class="button-row"><button data-ui-action="selectIdleParty" class="text-action">Select idle</button><button data-ui-action="recommendParty" class="text-action">Recommended</button><button data-ui-action="clearParty" class="text-action">Clear</button></div><p class="mini-record">${selected.length} selected. ${idle.length ? `Available: ${idle.map(hero => escapeHtml(hero.name)).join(', ')}.` : 'No idle heroes are currently available.'}</p></div>`;
}

function renderRelationshipPanel(state) {
  const pairs = [];
  for (let first = 0; first < state.heroes.length; first += 1) for (let second = first + 1; second < state.heroes.length; second += 1) pairs.push([state.heroes[first], state.heroes[second]]);
  return `<section id="relationships" class="panel relationship-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Hero stories</p><h2>Relationships</h2></div><span class="badge">${state.relationshipEvents.length} moments</span></div>${pairs.length ? `<div class="card-list">${pairs.map(([first, second]) => { const bond = first.relationships?.[second.id] || 0; return `<article class="card"><h3>${escapeHtml(first.name)} & ${escapeHtml(second.name)}</h3><p>Bond strength: ${bond}/100</p><button data-action="bondHeroes" data-first-hero-id="${escapeHtml(first.id)}" data-second-hero-id="${escapeHtml(second.id)}" ${first.status !== 'idle' || second.status !== 'idle' ? 'disabled' : ''}>Create shared moment</button></article>`; }).join('')}</div>` : '<p class="empty-copy">Recruit two heroes to begin their personal stories.</p>'}</section>`;
}

function renderAchievementPanel(state) {
  return `<section id="achievements" class="panel achievement-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Milestones</p><h2>Achievements</h2></div><span class="badge">${state.achievements.length}/${ACHIEVEMENT_CATALOG.length}</span></div><div class="card-list">${ACHIEVEMENT_CATALOG.map(achievement => `<article class="card ${state.achievements.includes(achievement.id) ? 'achievement-complete' : ''}"><div class="card-title-row"><h3>${escapeHtml(achievement.name)}</h3><span class="badge">${state.achievements.includes(achievement.id) ? 'Earned' : 'Locked'}</span></div><p>${escapeHtml(achievement.description)}</p></article>`).join('')}</div></section>`;
}

function renderProgressionPanel(state) {
  return `<section id="research-specialists" class="panel progression-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Long-term development</p><h2>Research and Specialists</h2></div><span class="badge">${state.research.length}/${RESEARCH_CATALOG.length} researched</span></div><div class="subsection"><h3>Research</h3><div class="card-list">${RESEARCH_CATALOG.map(project => `<article class="card"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p><button data-action="research" data-project-id="${escapeHtml(project.id)}" data-confirm="Research ${escapeHtml(project.name)} for ${project.cost} points. Points are permanently spent." ${state.research.includes(project.id) || state.guild.researchPoints < project.cost ? 'disabled' : ''}>${state.research.includes(project.id) ? 'Complete' : `Research (${project.cost} pts)`}</button></article>`).join('')}</div></div><div class="subsection"><h3>Guild Staff</h3><div class="card-list">${STAFF_CATALOG.map(staff => `<article class="card"><h3>${escapeHtml(staff.name)}</h3><p>${escapeHtml(staff.description)}</p><button data-action="hireStaff" data-staff-id="${escapeHtml(staff.id)}" data-confirm="Hire ${escapeHtml(staff.name)} for ${staff.cost} gold. This permanently spends gold." ${state.staff.includes(staff.id) || state.guild.gold < staff.cost ? 'disabled' : ''}>${state.staff.includes(staff.id) ? 'Hired' : `Hire (${staff.cost}g)`}</button></article>`).join('')}</div></div></section>`;
}

function renderArmoryPanel(state) {
  const inventory = state.inventory.map(entry => { const item = catalogItem(entry.itemId); return item ? `<span class="inventory-chip">${escapeHtml(item.name)} ×${entry.quantity}</span>` : ''; }).join('');
  return `<section id="armory" class="panel armory-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Equipment and crafting</p><h2>Armory & Workshop</h2></div><span class="badge">${state.guild.materials} materials</span></div><p class="helper-text">Inventory: ${inventory || 'No equipment stored yet.'}</p><div class="card-list">${ITEM_CATALOG.map(item => `<article class="card"><div class="card-title-row"><h3>${escapeHtml(item.name)}</h3><span class="badge">${escapeHtml(item.rarity)} • +${item.power}</span></div><p>${escapeHtml(item.className)} • ${escapeHtml(item.slot)} • Buy ${item.cost}g</p><div class="button-row"><button data-action="buyItem" data-item-id="${escapeHtml(item.id)}" data-confirm="Buy ${escapeHtml(item.name)} for ${item.cost} gold. Gold is permanently spent." ${state.guild.gold < item.cost ? 'disabled' : ''}>Buy</button><button data-action="craftItem" data-item-id="${escapeHtml(item.id)}" data-confirm="Craft ${escapeHtml(item.name)} for 3 materials. Materials are permanently spent." ${state.guild.materials < 3 ? 'disabled' : ''}>Craft</button></div></article>`).join('')}</div></section>`;
}

function renderRecordsPanel(state) {
  const records = state.guild.records || {};
  return `<section id="guild-records" class="panel records-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Permanent history</p><h2>Guild Records</h2></div><span class="badge">${state.guild.prestige} prestige</span></div><div class="stats-grid record-grid"><span>Gold earned<strong>${state.guild.totalGoldEarned}</strong></span><span>Contracts<strong>${state.guild.contractsCompleted}</strong></span><span>Failures<strong>${state.guild.contractsFailed}</strong></span><span>Heroes recruited<strong>${records.heroesRecruited || 0}</strong></span><span>Highest guild<strong>${records.highestGuildLevel || 1}</strong></span><span>Highest hero<strong>${records.highestHeroLevel || 1}</strong></span><span>Regions explored<strong>${records.regionsExplored || 0}</strong></span><span>Bosses defeated<strong>${records.bossesDefeated || 0}</strong></span></div><div class="button-row">${GAME_MODES.map(mode => `<button data-action="mode" data-value="${escapeHtml(mode.id)}">${escapeHtml(mode.name)} mode</button>`).join('')}</div></section>`;
}

function renderLogPanel(state) {
  const preferences = loadPreferences();
  const filter = preferences.activityFilter || 'all';
  const visible = state.log.filter(entry => filter === 'all' || activityCategory(entry) === filter).slice(0, 16);
  return `<section id="guild-log" class="panel guild-log-panel" tabindex="-1"><div class="panel-title-row"><div><p class="eyebrow">Durable history</p><h2>Guild Log</h2></div><button data-action="resetGame" class="danger" data-confirm="Reset permanently removes the stored guild save and cannot be undone.">Reset</button></div><div class="qol-toolbar"><label>Category<select data-ui-control="activityFilter" aria-label="Filter activity"><option value="all">All</option>${['contracts', 'combat', 'recruitment', 'events', 'economy', 'system'].map(category => `<option value="${category}" ${filter === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label></div><p class="helper-text">Newest events appear first. Repeated low-value system messages are condensed without hiding distinct outcomes.</p><ul class="log-list">${visible.map(renderLogEntry).join('')}</ul></section>`;
}

function bindActions(root, actions) {
  root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.confirm && !confirm(button.dataset.confirm)) return;
    const action = button.dataset.action;
    if (action === 'startContract') actions.startContract(button.dataset.heroId, button.dataset.contractId);
    else if (action === 'event') actions.chooseEvent(button.dataset.eventId, button.dataset.optionId);
    else if (action === 'storyChoice') actions.makeStoryChoice(button.dataset.decisionId, button.dataset.optionId);
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
    else if (action === 'challengeBoss') actions.challengeBoss(button.dataset.bossId);
    else if (action === 'runTacticalDrill') actions.runTacticalDrill(button.dataset.drillId);
    else if (action === 'bondHeroes') actions.bondHeroes(button.dataset.firstHeroId, button.dataset.secondHeroId);
    else if (action === 'recruitHero') actions.recruitHero();
    else if (action === 'saveGame') actions.saveGame();
    else if (action === 'resetGame') actions.resetGame();
  }));
  bindUiActions(root, actions);
}

function bindUiActions(root, actions) {
  root.querySelectorAll('[data-ui-action]').forEach(control => control.addEventListener('click', () => {
    if (control.dataset.confirm && !confirm(control.dataset.confirm)) return;
    const action = control.dataset.uiAction;
    if (action === 'toggleNotifications') notificationsOpen = !notificationsOpen;
    else if (action === 'markNotificationsRead') updatePreferences(preferences => { preferences.notificationsReadAt = Date.now(); });
    else if (action === 'openLog') {
      notificationsOpen = false;
      const target = document.getElementById('guild-log');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      }
    }
    else if (action === 'retrySave') return actions.retrySave();
    else if (action === 'exportSave') return actions.exportSave();
    else if (action === 'openImport') return root.querySelector('#saveImportInput')?.click();
    else if (action === 'confirmImport') return actions.confirmImport();
    else if (action === 'cancelImport') return actions.cancelImport();
    else if (action === 'toggleShortcutHelp') return actions.toggleShortcutHelp();
    else if (action === 'startTutorial') return actions.startTutorial();
    else if (action === 'previousTutorialStep') return actions.previousTutorialStep();
    else if (action === 'nextTutorialStep') return actions.nextTutorialStep();
    else if (action === 'skipTutorial') return actions.skipTutorial();
    else if (action === 'focusContracts') return actions.focusContracts();
    else if (action === 'undoPreference') return actions.undoPreference();
    else if (action === 'selectIdleParty') return actions.selectIdleParty();
    else if (action === 'clearParty') return actions.clearParty();
    else if (action === 'recommendParty') return actions.recommendParty();
    else if (action === 'selectVisibleHeroes') return actions.setParty([...root.querySelectorAll('[data-party-id]:not(:disabled)')].map(input => input.dataset.partyId));
    else if (action === 'clearRosterSelection') return actions.setParty([]);
    else if (action === 'bulkTrain') return actions.bulkTrain([...root.querySelectorAll('[data-party-id]:checked')].map(input => input.dataset.partyId));
    actions.refresh();
  }));

  root.querySelectorAll('[data-ui-control]').forEach(control => control.addEventListener('change', () => {
    actions.updatePreference(control.dataset.uiControl, control.value);
  }));

  root.querySelectorAll('[data-party-id]').forEach(control => control.addEventListener('change', () => {
    actions.setParty([...root.querySelectorAll('[data-party-id]:checked')].map(input => input.dataset.partyId));
  }));

  root.querySelector('#saveImportInput')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => actions.importSave(reader.result);
    reader.onerror = () => actions.importSave('');
    reader.readAsText(file);
  });

  const tutorial = root.querySelector('#tutorialOverlay');
  tutorial?.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); actions.skipTutorial(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); actions.nextTutorialStep(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); actions.previousTutorialStep(); }
    else if (event.key === 'Tab') keepTutorialFocus(tutorial, event);
  });
}

function decorateDashboard(root, actions, preferences) {
  const panels = [...root.querySelectorAll('.panel[id]')];
  panels.forEach(panel => {
    const titleRow = [...panel.children].find(child => child.classList.contains('panel-title-row'));
    if (!titleRow) return;
    let body = [...panel.children].find(child => child.classList.contains('panel-body'));
    if (!body) {
      body = document.createElement('div');
      body.className = 'panel-body';
      [...panel.children].filter(child => child !== titleRow).forEach(child => body.append(child));
      panel.append(body);
    }

    const collapsed = preferences.collapsedPanels.includes(panel.id);
    const pinned = preferences.pinnedPanels.includes(panel.id);
    panel.classList.toggle('is-collapsed', collapsed);
    panel.classList.toggle('is-pinned', pinned);
    body.hidden = collapsed;

    const controls = document.createElement('div');
    controls.className = 'qol-panel-controls';
    controls.innerHTML = `<button type="button" class="panel-pin" data-ui-panel-action="pin" aria-pressed="${pinned}" aria-label="${pinned ? 'Unpin' : 'Pin'} ${escapeHtml(panel.id)}" title="${pinned ? 'Unpin section' : 'Pin section'}">${pinned ? '★' : '☆'}</button><button type="button" class="panel-collapse" data-ui-panel-action="collapse" aria-expanded="${!collapsed}" aria-label="${collapsed ? 'Expand' : 'Collapse'} ${escapeHtml(panel.id)}" title="${collapsed ? 'Expand section' : 'Collapse section'}">${collapsed ? '＋' : '−'}</button><a class="panel-top-link" href="#page-top">Top</a>`;
    titleRow.append(controls);

    controls.querySelector('[data-ui-panel-action="pin"]').addEventListener('click', () => {
      updatePreferences(current => {
        current.pinnedPanels = current.pinnedPanels.includes(panel.id) ? current.pinnedPanels.filter(id => id !== panel.id) : [...current.pinnedPanels, panel.id];
      });
      const nextPinned = !panel.classList.contains('is-pinned');
      panel.classList.toggle('is-pinned', nextPinned);
      const pinButton = controls.querySelector('[data-ui-panel-action="pin"]');
      pinButton.setAttribute('aria-pressed', String(nextPinned));
      pinButton.setAttribute('aria-label', `${nextPinned ? 'Unpin' : 'Pin'} ${panel.id}`);
      pinButton.title = nextPinned ? 'Unpin section' : 'Pin section';
      pinButton.textContent = nextPinned ? '★' : '☆';
    });

    controls.querySelector('[data-ui-panel-action="collapse"]').addEventListener('click', () => {
      const nextCollapsed = !panel.classList.contains('is-collapsed');
      updatePreferences(current => {
        current.collapsedPanels = nextCollapsed ? [...new Set([...current.collapsedPanels, panel.id])] : current.collapsedPanels.filter(id => id !== panel.id);
      });
      panel.classList.toggle('is-collapsed', nextCollapsed);
      body.hidden = nextCollapsed;
      const collapseButton = controls.querySelector('[data-ui-panel-action="collapse"]');
      collapseButton.setAttribute('aria-expanded', String(!nextCollapsed));
      collapseButton.setAttribute('aria-label', `${nextCollapsed ? 'Expand' : 'Collapse'} ${panel.id}`);
      collapseButton.title = nextCollapsed ? 'Expand section' : 'Collapse section';
      collapseButton.textContent = nextCollapsed ? '＋' : '−';
    });
  });

  root.querySelectorAll('[data-ui-panel-action]').forEach(control => {
    if (control.dataset.uiPanelBound === 'true') return;
    control.dataset.uiPanelBound = 'true';
  });
}

function filterHeroes(heroes, filter) {
  if (filter === 'idle') return heroes.filter(hero => hero.status === 'idle');
  if (filter === 'deployed') return heroes.filter(hero => hero.status === 'on_contract');
  if (filter === 'injured') return heroes.filter(hero => (hero.injuries || []).length > 0);
  return heroes;
}

function sortHeroes(heroes, sort) {
  return [...heroes].sort((left, right) => {
    if (sort === 'name') return left.name.localeCompare(right.name);
    if (sort === 'level') return right.level - left.level || heroTotalPower(right) - heroTotalPower(left);
    if (sort === 'morale') return (right.morale || 0) - (left.morale || 0);
    if (sort === 'power') return heroTotalPower(right) - heroTotalPower(left);
    return Number(right.status === 'idle') - Number(left.status === 'idle') || heroTotalPower(right) - heroTotalPower(left);
  });
}

function filterContracts(state, filter) {
  if (filter === 'available') return CONTRACTS.filter(contract => isContractUnlocked(state, contract));
  if (filter === 'locked') return CONTRACTS.filter(contract => !isContractUnlocked(state, contract));
  if (filter === 'boss') return CONTRACTS.filter(contract => contract.boss);
  return CONTRACTS;
}

function sortContracts(contracts, sort, gameState) {
  return [...contracts].sort((left, right) => {
    if (sort === 'reward') return right.rewardGold - left.rewardGold;
    if (sort === 'power') return left.requiredPower - right.requiredPower;
    if (sort === 'duration') return left.durationSeconds - right.durationSeconds;
    return Number(isContractUnlocked(gameState, right)) - Number(isContractUnlocked(gameState, left)) || left.requiredPower - right.requiredPower;
  });
}

function renderContractRequirements(state, contract) {
  const requirements = contractUnlockRequirements(contract);
  const checks = [
    [`Guild level ${requirements.minGuildLevel}`, state.guild.level >= requirements.minGuildLevel],
    [`Reputation ${requirements.minReputation}`, state.guild.reputation >= requirements.minReputation]
  ];
  if (contract.region) checks.push([`${contract.region.replaceAll('-', ' ')} region`, state.regions?.unlocked?.includes(contract.region)]);
  if (contract.tier === 'Legendary') checks.push(['Legend-Seeking research', state.research?.includes('legend-seeking')]);
  return `<ul class="requirements-list">${checks.map(([label, met]) => `<li class="${met ? 'requirement-met' : 'requirement-missing'}"><span aria-hidden="true">${met ? '✓' : '○'}</span>${escapeHtml(label)}</li>`).join('')}</ul>`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m${seconds % 60 ? ` ${seconds % 60}s` : ''}`;
}

function formatRelativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - Number(timestamp || Date.now())) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
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
function renderLogEntry(entry) { const message = typeof entry === 'string' ? entry : entry?.message; const category = activityCategory(entry); return `<li data-category="${category}"><span class="log-category">${escapeHtml(category)}</span>${escapeHtml(message || 'Guild event')}</li>`; }
function activityCategory(entry) {
  const message = String(typeof entry === 'string' ? entry : entry?.message || '').toLowerCase();
  if (/contract|expedition/.test(message)) return 'contracts';
  if (/combat|tactical|boss|rival/.test(message)) return 'combat';
  if (/recruit|hero joined/.test(message)) return 'recruitment';
  if (/event|mages|merchant|wandering/.test(message)) return 'events';
  if (/gold|buy|craft|train|upgrade|research|staff/.test(message)) return 'economy';
  return 'system';
}
function eventOutcome(option) {
  const outcomes = [];
  if (option.gold) outcomes.push(`${option.gold > 0 ? '+' : ''}${option.gold} gold`);
  if (option.reputation) outcomes.push(`${option.reputation > 0 ? '+' : ''}${option.reputation} reputation`);
  if (option.research) outcomes.push(`${option.research > 0 ? '+' : ''}${option.research} research`);
  return outcomes.length ? outcomes.join(', ') : 'No resource change';
}
function saveStatusClass(status) { return status === 'Save failed' ? 'is-failed' : status === 'Saving…' ? 'is-saving' : 'is-saved'; }
function selectedParty(state) { return repairPartySelection(loadPreferences().partyHeroIds, state.heroes); }
function renderMobileTray() { return `<nav class="mobile-action-tray" aria-label="Quick actions"><button data-action="saveGame">Save</button><button data-ui-action="focusContracts">Contracts</button><button data-action="recruitHero">Recruit</button></nav>`; }
function renderShortcutHelp(uiState) { return uiState.shortcutHelpOpen ? `<section class="shortcut-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div><h2>Keyboard shortcuts</h2><p><kbd>Alt</kbd>+<kbd>S</kbd> Save</p><p><kbd>Alt</kbd>+<kbd>R</kbd> Recruit</p><p><kbd>Alt</kbd>+<kbd>C</kbd> Contract board</p><p><kbd>?</kbd> Close this help</p><button data-ui-action="toggleShortcutHelp">Close</button></div></section>` : ''; }
function renderImportDialog(uiState) { return uiState.pendingImport ? `<section class="shortcut-overlay" role="dialog" aria-modal="true" aria-label="Confirm imported save"><div><h2>Replace current guild?</h2><p>${escapeHtml(uiState.pendingImport.summary)}</p><p>The imported save was repaired and validated. Confirming replaces the current guild only after browser storage accepts it.</p><button data-ui-action="confirmImport" class="danger">Replace current guild</button><button data-ui-action="cancelImport" class="secondary-action">Cancel</button></div></section>` : ''; }
function renderTutorial(uiState) {
  const tutorial = uiState.tutorial;
  const current = currentTutorialStep(tutorial);
  if (!current) return '';
  const finalStep = isLastTutorialStep(tutorial);
  return `<section id="tutorialOverlay" class="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-step-title" aria-describedby="tutorial-step-description"><div class="tutorial-card"><p class="eyebrow">Guided tour • ${tutorial.index + 1}/${TUTORIAL_STEPS.length}</p><h2 id="tutorial-step-title">${escapeHtml(current.title)}</h2><p id="tutorial-step-description">${escapeHtml(current.description)}</p><div class="tutorial-progress" aria-hidden="true"><span style="width:${((tutorial.index + 1) / TUTORIAL_STEPS.length) * 100}%"></span></div><div class="button-row"><button data-ui-action="previousTutorialStep" ${tutorial.index === 0 ? 'disabled' : ''}>Back</button><button data-ui-action="nextTutorialStep" data-tutorial-primary>${finalStep ? 'Finish tour' : 'Next'}</button><button data-ui-action="skipTutorial" class="text-action">Skip tour</button></div><p class="mini-record">Use Left/Right Arrow to move and Escape to skip.</p></div></section>`;
}
function keepTutorialFocus(tutorial, event) {
  const controls = [...tutorial.querySelectorAll('button:not([disabled])')];
  if (!controls.length) return;
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function refreshCompletionTimers(root) {
  const update = () => root.querySelectorAll('[data-completes-at]').forEach(card => {
    const completesAt = Number(card.dataset.completesAt);
    const startedAt = Number(card.dataset.startedAt);
    const seconds = Math.max(0, Math.ceil((completesAt - Date.now()) / 1000));
    const remaining = card.querySelector('[data-remaining]');
    const progress = card.querySelector('[data-progress]');
    if (remaining) { remaining.textContent = seconds ? `${seconds}s remaining` : 'Completing…'; remaining.setAttribute('aria-label', `${seconds} seconds remaining`); }
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ((Date.now() - startedAt) / Math.max(1, completesAt - startedAt)) * 100))}%`;
  });
  update();
  if (!completionTicker) completionTicker = setInterval(() => refreshCompletionTimers(document.getElementById('app') || root), 1000);
}
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

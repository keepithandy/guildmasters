import { CONTRACTS, activeContractDetails, calculateSuccessChance, contractUnlockProgress, contractUnlockRequirements, isContractUnlocked, nextContractUnlock } from './contracts.js';
import { canUpgradeGuild, guildUpgradeBlockedReason, guildUpgradeCost } from './guild.js';
import { canRecruitHero, RECRUIT_COST, recruitPowerBonus, recruitmentBlockedReason } from './heroes.js';

export function render(state, actions) {
  const root = document.getElementById('app');
  if (!root) return;

  const nextUnlock = nextContractUnlock(state);
  const recruitReason = recruitmentBlockedReason(state);
  const upgradeReason = guildUpgradeBlockedReason(state);

  root.innerHTML = `
    <p id="guildStatus" class="status-banner" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(state.statusMessage || 'Guild ready.')}</p>

    <section class="panel">
      <div class="panel-title-row">
        <h2>Guild</h2>
        <button id="upgradeGuild" ${canUpgradeGuild(state) ? '' : 'disabled'}>Upgrade Guild (${guildUpgradeCost(state)}g)</button>
      </div>
      <div class="stats-grid">
        <span>Level <strong>${state.guild.level}</strong></span>
        <span>Gold <strong>${state.guild.gold}</strong></span>
        <span>Reputation <strong>${state.guild.reputation}</strong></span>
        <span>Heroes <strong>${state.heroes.length}/${state.guild.heroCapacity}</strong></span>
      </div>
      <p class="helper-text">${nextUnlock ? escapeHtml(renderNextUnlock(state, nextUnlock)) : 'All starter contracts unlocked.'}</p>
      <p class="helper-text">${escapeHtml(nextActionGuidance(state))}</p>
      ${upgradeReason ? `<p class="blocked-copy">${escapeHtml(upgradeReason)}</p>` : ''}
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <h2>Heroes</h2>
        <button id="recruitHero" ${canRecruitHero(state) ? '' : 'disabled'}>Recruit Hero (${RECRUIT_COST}g)</button>
      </div>
      <p class="helper-text">Recruit quality bonus from guild level: +${recruitPowerBonus(state)} power.</p>
      ${recruitReason ? `<p class="blocked-copy">${escapeHtml(recruitReason)}</p>` : ''}
      <div class="card-list">
        ${state.heroes.length ? state.heroes.map(renderHero).join('') : '<p class="empty-copy">No heroes yet. Recruit your first hero when you have an open slot and enough gold.</p>'}
      </div>
    </section>

    <section class="panel">
      <h2>Contract Board</h2>
      <div class="card-list">
        ${CONTRACTS.map(contract => renderContract(state, contract)).join('')}
      </div>
    </section>

    <section class="panel active-contracts-panel">
      <h2>Active Contracts</h2>
      <div class="card-list">
        ${state.activeContracts.length ? state.activeContracts.map(active => renderActiveContract(state, active)).join('') : '<p class="empty-copy">No contracts running. Assign an idle hero from the Contract Board.</p>'}
      </div>
    </section>

    <section class="panel guild-log-panel">
      <div class="panel-title-row">
        <h2>Guild Log</h2>
        <button id="resetGame" class="danger">Reset</button>
      </div>
      <p class="helper-text">Newest events appear first. The log is durable history; the status banner announces the latest change.</p>
      <ul class="log-list">${state.log.slice(0, 12).map(renderLogEntry).join('')}</ul>
    </section>
  `;

  document.getElementById('upgradeGuild')?.addEventListener('click', actions.upgradeGuild);
  document.getElementById('recruitHero')?.addEventListener('click', actions.recruitHero);
  document.getElementById('resetGame')?.addEventListener('click', actions.resetGame);

  root.querySelectorAll('[data-start-contract]').forEach(button => {
    button.addEventListener('click', () => {
      actions.startContract(button.dataset.heroId, button.dataset.contractId);
    });
  });
}

function renderHero(hero) {
  return `
    <article class="card">
      <h3>${escapeHtml(hero.name)}</h3>
      <p>${escapeHtml(hero.className)} • Level ${hero.level} • Power ${hero.power}</p>
      <p>Status: <strong>${hero.status === 'idle' ? 'Idle' : 'On Contract'}</strong></p>
    </article>
  `;
}

function renderContract(state, contract) {
  const unlocked = isContractUnlocked(state, contract);
  const requirements = contractUnlockRequirements(contract);
  const idleHeroes = unlocked ? state.heroes.filter(hero => hero.status === 'idle') : [];
  const rankedHeroes = rankHeroesForContract(idleHeroes, contract);
  const options = rankedHeroes.map((hero, index) => {
    const chance = calculateSuccessChance(hero.power, contract.requiredPower);
    const bestFit = index === 0 && rankedHeroes.length > 1 ? ' • Best fit' : '';
    return `<button data-start-contract data-hero-id="${escapeHtml(hero.id)}" data-contract-id="${escapeHtml(contract.id)}">${escapeHtml(hero.name)} (${chance}%${bestFit})</button>`;
  }).join('');

  const actionCopy = unlocked
    ? options || '<span class="blocked-copy">No idle heroes. Wait for an active contract or recruit another hero.</span>'
    : `<span class="blocked-copy">${escapeHtml(contractUnlockProgress(state, contract))}</span>`;

  const reputationRequirement = requirements.minReputation > 0
    ? ` • Reputation ${requirements.minReputation}+`
    : '';

  return `
    <article class="card ${unlocked ? '' : 'locked-card'}">
      <h3>${escapeHtml(contract.name)}</h3>
      <p>${escapeHtml(contract.tier)} • Level ${requirements.minGuildLevel}+${reputationRequirement} • ${contract.durationSeconds}s • Required Power ${contract.requiredPower}</p>
      <p>Success: +${contract.rewardGold}g / +${contract.rewardReputation} rep</p>
      <p>Failure: +${contract.failureGold}g</p>
      <div class="button-row">${actionCopy}</div>
    </article>
  `;
}

function renderNextUnlock(state, contract) {
  const requirements = contractUnlockRequirements(contract);

  if (requirements.minReputation === 0) {
    return `Next unlock: ${contract.name} at guild level ${requirements.minGuildLevel}.`;
  }

  return `Next unlock: ${contract.name}. Guild level: ${state.guild.level} / ${requirements.minGuildLevel}. Reputation: ${state.guild.reputation} / ${requirements.minReputation}.`;
}

export function nextActionGuidance(state) {
  if (state.heroes.length === 0) {
    return 'Next action: recruit your first hero.';
  }

  if (!state.heroes.some(hero => hero.status === 'idle') && state.activeContracts.length > 0) {
    return 'Next action: wait for an active contract to finish.';
  }

  const nextUnlock = nextContractUnlock(state);
  if (nextUnlock) {
    const requirements = contractUnlockRequirements(nextUnlock);
    if (state.guild.level >= requirements.minGuildLevel
      && state.guild.reputation < requirements.minReputation) {
      const reputationNeeded = requirements.minReputation - state.guild.reputation;
      return `Next action: earn ${reputationNeeded} reputation to unlock ${nextUnlock.name}.`;
    }

    if (state.guild.level < requirements.minGuildLevel && canUpgradeGuild(state)) {
      return `Next action: upgrade the guild to level ${state.guild.level + 1}.`;
    }
  }

  if (state.heroes.some(hero => hero.status === 'idle')) {
    const highestUnlockedContract = [...CONTRACTS].reverse().find(contract => isContractUnlocked(state, contract));
    return `Next action: assign an idle hero to ${highestUnlockedContract.name}.`;
  }

  if (canRecruitHero(state)) {
    return 'Next action: recruit another hero.';
  }

  return 'Next action: prepare the guild for its next contract.';
}

export function rankHeroesForContract(heroes, contract) {
  return [...heroes].sort((left, right) => {
    return calculateSuccessChance(right.power, contract.requiredPower)
      - calculateSuccessChance(left.power, contract.requiredPower);
  });
}

function renderActiveContract(state, active) {
  const { hero, contract } = activeContractDetails(state, active);
  if (!hero || !contract) return '';
  const secondsLeft = Math.max(0, Math.ceil((active.completesAt - Date.now()) / 1000));
  return `
    <article class="card active-card">
      <h3>${escapeHtml(contract.name)}</h3>
      <p><strong>${escapeHtml(hero.name)}</strong> is working.</p>
      <p aria-label="${secondsLeft} seconds remaining">${secondsLeft}s remaining</p>
    </article>
  `;
}

function renderLogEntry(entry) {
  const message = typeof entry === 'string' ? entry : entry?.message;
  return `<li>${escapeHtml(message || 'Guild event')}</li>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

import { CONTRACTS, activeContractDetails, calculateSuccessChance, isContractUnlocked, nextContractUnlock } from './contracts.js';
import { canUpgradeGuild, guildUpgradeCost } from './guild.js';
import { canRecruitHero, RECRUIT_COST, recruitPowerBonus } from './heroes.js';

export function render(state, actions) {
  const root = document.getElementById('app');
  if (!root) return;

  const nextUnlock = nextContractUnlock(state);

  root.innerHTML = `
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
      <p class="helper-text">${nextUnlock ? `Next unlock: ${nextUnlock.name} at guild level ${nextUnlock.minGuildLevel}.` : 'All starter contracts unlocked.'}</p>
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <h2>Heroes</h2>
        <button id="recruitHero" ${canRecruitHero(state) ? '' : 'disabled'}>Recruit Hero (${RECRUIT_COST}g)</button>
      </div>
      <p class="helper-text">Recruit quality bonus from guild level: +${recruitPowerBonus(state)} power.</p>
      <div class="card-list">
        ${state.heroes.length ? state.heroes.map(renderHero).join('') : '<p>No heroes recruited yet.</p>'}
      </div>
    </section>

    <section class="panel">
      <h2>Contract Board</h2>
      <div class="card-list">
        ${CONTRACTS.map(contract => renderContract(state, contract)).join('')}
      </div>
    </section>

    <section class="panel">
      <h2>Active Contracts</h2>
      <div class="card-list">
        ${state.activeContracts.length ? state.activeContracts.map(active => renderActiveContract(state, active)).join('') : '<p>No contracts running.</p>'}
      </div>
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <h2>Guild Log</h2>
        <button id="resetGame" class="danger">Reset</button>
      </div>
      <ul class="log-list">${state.log.slice(0, 8).map(entry => `<li>${entry}</li>`).join('')}</ul>
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
      <h3>${hero.name}</h3>
      <p>${hero.className} • Level ${hero.level} • Power ${hero.power}</p>
      <p>Status: ${hero.status === 'idle' ? 'Idle' : 'On Contract'}</p>
    </article>
  `;
}

function renderContract(state, contract) {
  const unlocked = isContractUnlocked(state, contract);
  const idleHeroes = unlocked ? state.heroes.filter(hero => hero.status === 'idle') : [];
  const options = idleHeroes.map(hero => {
    const chance = calculateSuccessChance(hero.power, contract.requiredPower);
    return `<button data-start-contract data-hero-id="${hero.id}" data-contract-id="${contract.id}">${hero.name} (${chance}%)</button>`;
  }).join('');

  const actionCopy = unlocked
    ? options || '<span>No idle heroes available.</span>'
    : `<span>Locked until guild level ${contract.minGuildLevel}.</span>`;

  return `
    <article class="card ${unlocked ? '' : 'locked-card'}">
      <h3>${contract.name}</h3>
      <p>${contract.tier} • Level ${contract.minGuildLevel}+ • ${contract.durationSeconds}s • Required Power ${contract.requiredPower}</p>
      <p>Success: +${contract.rewardGold}g / +${contract.rewardReputation} rep</p>
      <p>Failure: +${contract.failureGold}g</p>
      <div class="button-row">${actionCopy}</div>
    </article>
  `;
}

function renderActiveContract(state, active) {
  const { hero, contract } = activeContractDetails(state, active);
  if (!hero || !contract) return '';

  const secondsLeft = Math.max(0, Math.ceil((active.completesAt - Date.now()) / 1000));
  return `
    <article class="card">
      <h3>${contract.name}</h3>
      <p>${hero.name} is working.</p>
      <p>${secondsLeft}s remaining</p>
    </article>
  `;
}

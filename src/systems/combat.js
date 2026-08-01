import { catalogBoss, catalogEncounter, catalogEnemy } from '../content.js';
import { findHero, heroTotalPower } from '../heroes.js';
import { reportAction } from '../actionResult.js';
import { awardAchievement } from './achievements.js';

export function enemyWeakness(enemyId) {
  return catalogEnemy(enemyId)?.weakness || 'Ranger';
}

export function challengeBoss(state, bossId, heroIds = [], now = Date.now()) {
  const boss = catalogBoss(bossId);
  const party = heroIds.map(heroId => findHero(state, heroId)).filter(Boolean).filter(hero => hero.status === 'idle');
  if (!boss) return reportAction(state, 'That boss expedition could not be found.', now, false);
  if (state.guild.level < boss.requiredGuildLevel || state.guild.reputation < boss.requiredReputation) return reportAction(state, `${boss.name} requires guild level ${boss.requiredGuildLevel} and ${boss.requiredReputation} reputation.`, now, false);
  if (!state.regions.unlocked.includes(boss.region)) return reportAction(state, `${boss.name} is beyond the ${boss.region.replaceAll('-', ' ')} region.`, now, false);
  if (!party.length) return reportAction(state, 'Choose at least one idle hero for the boss expedition.', now, false);
  state.bosses.attempts[boss.id] = (state.bosses.attempts[boss.id] || 0) + 1;
  const partyPower = party.reduce((total, hero) => total + heroTotalPower(hero), 0);
  const counterClass = enemyWeakness(boss.enemy);
  const counterBonus = party.filter(hero => hero.className === counterClass).length * 18;
  const transcript = [];
  let totalRounds = 0;
  let defeated = true;
  for (const phase of boss.phases) {
    let phaseHp = phase.hp;
    let phaseRounds = 0;
    while (phaseHp > 0 && phaseRounds < 4) {
      phaseRounds += 1;
      totalRounds += 1;
      const phaseDamage = Math.max(8, Math.floor(partyPower * 0.28) + counterBonus + (phase.mechanic === 'armor' && party.some(hero => hero.className === 'Rogue') ? 12 : 0));
      phaseHp = Math.max(0, phaseHp - phaseDamage);
      transcript.push(`${phase.name}, round ${phaseRounds}: the party dealt ${phaseDamage} damage.`);
      if (phaseHp > 0) {
        const pressure = phase.attack - (party.some(hero => hero.className === 'Guardian') ? 5 : 0);
        const target = party[totalRounds % party.length];
        target.morale = Math.max(0, (target.morale ?? 75) - Math.max(1, Math.floor(pressure / 4)));
        if (phase.mechanic === 'burn' || phase.mechanic === 'worldfire') target.statusEffects = ['burning'];
        if (phase.mechanic === 'poison') target.statusEffects = ['poisoned'];
        transcript.push(`${phase.name} answered with ${phase.mechanic}; ${target.name} endured the pressure.`);
      }
    }
    if (phaseHp > 0) { defeated = false; break; }
  }
  state.combat.rounds += totalRounds;
  state.combat.lastEncounter = { id: boss.id, name: boss.name, result: defeated ? 'victory' : 'defeat', rounds: totalRounds, transcript: transcript.slice(-12) };
  party.forEach(hero => { hero.statusEffects = []; });
  if (defeated) {
    if (!state.bosses.defeated.includes(boss.id)) state.bosses.defeated.push(boss.id);
    state.guild.records.bossesDefeated += 1;
    state.guild.gold += boss.rewardGold;
    state.guild.reputation += boss.rewardReputation;
    state.guild.materials += boss.rewardMaterials;
    state.guild.prestige += 5;
    state.worldThreat = Math.max(0, state.worldThreat - 12);
    awardAchievement(state, 'boss-slayer', now);
    return reportAction(state, `${boss.name} defeated across ${boss.phases.length} phases. The world threat recedes.`, now, true);
  }
  state.worldThreat = Math.min(100, state.worldThreat + 6);
  if (state.guild.mode === 'ironman') party.forEach(hero => { hero.injuries = [...(hero.injuries || []), `Wounded by ${boss.name}`].slice(-3); });
  return reportAction(state, `${boss.name} survived the expedition. The guild must regroup before trying again.`, now, false);
}

export function runTacticalDrill(state, drillId, heroIds = [], now = Date.now()) {
  return runCombatEncounter(state, drillId, heroIds, now);
}

export function runCombatEncounter(state, encounterId, heroIds = [], now = Date.now()) {
  const encounter = catalogEncounter(encounterId);
  const party = heroIds.map(heroId => findHero(state, heroId)).filter(Boolean).filter(hero => hero.status === 'idle');
  if (!encounter) return reportAction(state, 'That tactical encounter could not be found.', now, false);
  if (!party.length) return reportAction(state, 'Choose at least one idle hero for the tactical drill.', now, false);
  const weaknessClass = enemyWeakness(encounter.enemy);
  let enemyHp = encounter.enemyHp;
  let rounds = 0;
  let stunned = false;
  let marked = false;
  const transcript = [];
  state.tactical.drillsCompleted += 1;
  for (let round = 1; round <= encounter.rounds && enemyHp > 0; round += 1) {
    rounds = round;
    let roundDamage = 0;
    for (const hero of party) {
      const power = heroTotalPower(hero);
      let damage = Math.max(2, Math.floor(power * 0.22));
      if (hero.className === weaknessClass) damage += 6;
      if (hero.className === 'Warrior') { hero.statusEffects = ['guarding']; damage += 2; }
      if (hero.className === 'Ranger') { marked = true; hero.statusEffects = ['marked-target']; damage += 3; }
      if (hero.className === 'Mage') { hero.statusEffects = ['burning']; damage += 5; }
      if (hero.className === 'Guardian') { stunned = round % 2 === 1; hero.statusEffects = ['taunting']; damage += 1; }
      if (hero.className === 'Rogue') { hero.statusEffects = ['evasive']; damage += round === 1 ? 8 : 2; }
      if (hero.className === 'Cleric') { hero.statusEffects = ['blessed']; damage += encounter.enemy === 'undead' ? 8 : 2; }
      roundDamage += damage;
    }
    if (marked) roundDamage += 3;
    enemyHp = Math.max(0, enemyHp - roundDamage);
    transcript.push(`Round ${round}: the party dealt ${roundDamage} damage${enemyHp === 0 ? ' and broke the enemy line.' : '.'}`);
    if (enemyHp <= 0) break;
    if (!stunned) {
      const target = party[round % party.length];
      const damage = Math.max(1, encounter.enemyAttack - (party.some(hero => hero.className === 'Guardian') ? 4 : 0));
      target.morale = Math.max(0, (target.morale ?? 75) - 2);
      if (encounter.enemy === 'spiders' && round === 2) target.statusEffects = ['poisoned'];
      transcript.push(`Round ${round}: ${encounter.enemy} struck ${target.name} for ${damage} pressure.`);
    } else {
      transcript.push(`Round ${round}: the guardian’s taunt interrupted the enemy.`);
    }
    stunned = false;
  }
  const success = enemyHp <= 0;
  state.combat.rounds += rounds;
  state.combat.lastEncounter = { id: encounter.id, name: encounter.name, result: success ? 'victory' : 'defeat', rounds, transcript };
  if (success) {
    state.tactical.encountersWon += 1;
    state.combat.victories += 1;
    state.guild.gold += encounter.rewardGold;
    state.guild.materials += encounter.rewardMaterials;
    state.guild.prestige += 1;
    party.forEach(hero => { hero.morale = Math.min(100, (hero.morale ?? 75) + 5); });
    awardAchievement(state, 'first-blood', now);
    if (state.tactical.encountersWon >= 5) awardAchievement(state, 'tactical-veteran', now);
    party.forEach(hero => { hero.statusEffects = []; });
    return reportAction(state, `${encounter.name} won in ${rounds} rounds. The party exploited the ${weaknessClass} counter and earned rewards.`, now, true);
  }
  state.tactical.encountersLost += 1;
  state.combat.defeats += 1;
  party.forEach(hero => {
    hero.morale = Math.max(0, (hero.morale ?? 75) - 4);
    hero.statusEffects = [];
  });
  return reportAction(state, `${encounter.name} lost after ${rounds} rounds. Study the enemy weakness and improve the party before trying again.`, now, false);
}

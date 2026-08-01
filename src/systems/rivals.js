import { appendLog } from '../gameState.js';
import { RIVAL_GUILDS, catalogRival } from '../content.js';
import { heroTotalPower } from '../heroes.js';
import { reportAction } from '../actionResult.js';
import { awardAchievement } from './achievements.js';

export function challengeRival(state, rivalId, now = Date.now()) {
  const rival = catalogRival(rivalId);
  if (!rival) return reportAction(state, 'That rival guild could not be found.', now, false);
  if (state.guild.level < rival.requiredGuildLevel) return reportAction(state, `${rival.name} requires guild level ${rival.requiredGuildLevel}.`, now, false);
  const rosterPower = state.heroes.reduce((total, hero) => total + heroTotalPower(hero), 0);
  const requiredPower = rival.requiredGuildLevel * 30;
  state.rivals[rivalId] ||= { victories: 0, defeats: 0, reputation: 0, heat: 0, lastAction: '' };
  if (rosterPower >= requiredPower) {
    state.rivals[rivalId].victories += 1;
    state.rivals[rivalId].reputation += rival.rewardReputation;
    state.rivals[rivalId].heat = 0;
    state.rivals[rivalId].lastAction = 'challenged-and-defeated';
    state.guild.gold += rival.rewardGold;
    state.guild.reputation += rival.rewardReputation;
    state.guild.prestige += 2;
    awardAchievement(state, 'rival-breaker', now);
    return reportAction(state, `Rival challenge won against ${rival.name}. +${rival.rewardGold} gold and +${rival.rewardReputation} reputation.`, now, true);
  }
  state.rivals[rivalId].defeats += 1;
  state.rivals[rivalId].heat = Math.min(10, state.rivals[rivalId].heat + 1);
  state.rivals[rivalId].lastAction = 'challenge-lost';
  state.guild.reputation = Math.max(0, state.guild.reputation - 1);
  return reportAction(state, `${rival.name} won the challenge. The guild lost 1 reputation but learned from the defeat.`, now, false);
}

export function advanceRivalPressure(state, now = Date.now()) {
  for (const rival of RIVAL_GUILDS) {
    if (state.guild.level < rival.requiredGuildLevel) continue;
    const record = state.rivals[rival.id] ||= { victories: 0, defeats: 0, reputation: 0, heat: 0, lastAction: '' };
    record.heat = Math.min(10, record.heat + 1);
    if (record.heat >= 3 && state.guild.day % 3 === 0) {
      record.lastAction = 'rumor-campaign';
      record.heat = 0;
      state.guild.reputation = Math.max(0, state.guild.reputation - 1);
      state.worldThreat = Math.min(100, state.worldThreat + 2);
      appendLog(state, `${rival.name} spread rumors about the guild. Reputation -1.`, now);
    }
  }
  return state;
}

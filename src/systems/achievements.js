import { appendLog } from '../gameState.js';
import { catalogAchievement } from '../content.js';

export function awardAchievement(state, achievementId, now = Date.now()) {
  const achievement = catalogAchievement(achievementId);
  if (!achievement || state.achievements.includes(achievementId)) return state;
  state.achievements.push(achievementId);
  appendLog(state, `Achievement unlocked: ${achievement.name}.`, now);
  return state;
}

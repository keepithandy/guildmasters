import { appendLog } from './gameState.js';
import { isContractUnlocked, nextContractUnlock } from './contracts.js';

export function guildUpgradeCost(state) {
  return state.guild.level * 150;
}

export function canUpgradeGuild(state) {
  return state.guild.gold >= guildUpgradeCost(state);
}

export function guildUpgradeBlockedReason(state) {
  const cost = guildUpgradeCost(state);
  return state.guild.gold >= cost ? '' : `Guild upgrade needs ${cost} gold. Complete existing contracts to earn more.`;
}

export function upgradeGuild(state, now = Date.now()) {
  const cost = guildUpgradeCost(state);

  if (!canUpgradeGuild(state)) {
    state.statusMessage = guildUpgradeBlockedReason(state);
    appendLog(state, state.statusMessage, now);
    return state;
  }

  const previousNextUnlock = nextContractUnlock(state);
  state.guild.gold -= cost;
  state.guild.level += 1;
  state.guild.heroCapacity += 1;

  let upgradeMessage = `Guild upgraded to level ${state.guild.level}. Hero capacity increased.`;
  if (previousNextUnlock && isContractUnlocked(state, previousNextUnlock)) {
    upgradeMessage += ` New contract unlocked: ${previousNextUnlock.name}.`;
  }

  state.statusMessage = upgradeMessage;
  appendLog(state, upgradeMessage, now);
  return state;
}

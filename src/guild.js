import { nextContractUnlock } from './contracts.js';

export function guildUpgradeCost(state) {
  return state.guild.level * 150;
}

export function canUpgradeGuild(state) {
  return state.guild.gold >= guildUpgradeCost(state);
}

export function upgradeGuild(state) {
  const cost = guildUpgradeCost(state);

  if (!canUpgradeGuild(state)) {
    state.log.unshift(`Guild upgrade failed: ${cost} gold required.`);
    return state;
  }

  const previousNextUnlock = nextContractUnlock(state);

  state.guild.gold -= cost;
  state.guild.level += 1;
  state.guild.heroCapacity += 1;

  let upgradeMessage = `Guild upgraded to level ${state.guild.level}. Hero capacity increased.`;
  if (previousNextUnlock && state.guild.level >= previousNextUnlock.minGuildLevel) {
    upgradeMessage += ` New contract unlocked: ${previousNextUnlock.name}.`;
  }

  state.log.unshift(upgradeMessage);
  return state;
}

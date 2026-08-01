import { updateRecord } from './gameState.js';
import { GUILD_IDENTITIES, ROOM_CATALOG, catalogRoom } from './content.js';
import { addInventory } from './heroes.js';
import { isContractUnlocked, nextContractUnlock } from './contracts.js';
import { reportAction } from './actionResult.js';

export function guildUpgradeCost(state) { return state.guild.level * 150; }
export function canUpgradeGuild(state) { return state.guild.gold >= guildUpgradeCost(state); }

export function guildUpgradeBlockedReason(state) {
  const cost = guildUpgradeCost(state);
  return state.guild.gold >= cost ? '' : `Guild upgrade needs ${cost} gold. Complete existing contracts to earn more.`;
}

export function upgradeGuild(state, now = Date.now()) {
  const cost = guildUpgradeCost(state);
  if (!canUpgradeGuild(state)) return setGuildMessage(state, guildUpgradeBlockedReason(state), now, false);
  const previousNextUnlock = nextContractUnlock(state);
  state.guild.gold -= cost;
  state.guild.level += 1;
  state.guild.heroCapacity += 1;
  updateRecord(state, 'highestGuildLevel', state.guild.level);
  let message = `Guild upgraded to level ${state.guild.level}. Hero capacity increased.`;
  if (previousNextUnlock && isContractUnlocked(state, previousNextUnlock)) message += ` New contract unlocked: ${previousNextUnlock.name}.`;
  return setGuildMessage(state, message, now);
}

export function roomUpgradeCost(state, roomId) {
  const room = catalogRoom(roomId);
  const level = Number(state.rooms?.[roomId]) || 0;
  return room ? room.baseCost * (level + 1) : Infinity;
}

export function canUpgradeRoom(state, roomId) {
  const room = catalogRoom(roomId);
  const level = Number(state.rooms?.[roomId]) || 0;
  return Boolean(room && level < room.maxLevel && state.guild.gold >= roomUpgradeCost(state, roomId));
}

export function upgradeRoom(state, roomId, now = Date.now()) {
  const room = catalogRoom(roomId);
  if (!room) return setGuildMessage(state, 'That guild room could not be found.', now, false);
  const currentLevel = Number(state.rooms?.[roomId]) || 0;
  if (currentLevel >= room.maxLevel) return setGuildMessage(state, `${room.name} is fully upgraded.`, now, false);
  const cost = roomUpgradeCost(state, roomId);
  if (state.guild.gold < cost) return setGuildMessage(state, `${room.name} upgrade needs ${cost} gold.`, now, false);
  state.guild.gold -= cost;
  state.rooms[roomId] = currentLevel + 1;
  if (room.effect === 'capacity') state.guild.heroCapacity += 1;
  if (room.effect === 'prestige') state.guild.prestige += 1;
  return setGuildMessage(state, `${room.name} upgraded to level ${currentLevel + 1}.`, now);
}

export function buyItem(state, item, now = Date.now()) {
  if (!item || state.guild.gold < item.cost) return setGuildMessage(state, `The guild needs ${item?.cost || 0} gold to buy that item.`, now, false);
  state.guild.gold -= item.cost;
  addInventory(state, item.id, 1, now);
  return setGuildMessage(state, `${item.name} added to the Armory.`, now);
}

export function setGuildIdentity(state, identity, now = Date.now()) {
  if (!GUILD_IDENTITIES.includes(identity)) return setGuildMessage(state, 'That guild identity is unavailable.', now, false);
  state.guild.identity = identity;
  return setGuildMessage(state, `Guild identity set to ${identity}.`, now);
}

function setGuildMessage(state, message, now, ok = true) { return reportAction(state, message, now, ok); }

export { ROOM_CATALOG };

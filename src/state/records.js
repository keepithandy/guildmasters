export function updateRecord(state, key, value) {
  if (!state.guild.records || typeof state.guild.records !== 'object') state.guild.records = {};
  state.guild.records[key] = Math.max(Number(state.guild.records[key]) || 0, Number(value) || 0);
  return state;
}

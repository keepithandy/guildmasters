import { appendLog } from '../gameState.js';
import { EVENT_CATALOG, catalogEvent } from '../content.js';
import { performRecruitment } from '../heroes.js';
import { reportAction } from '../actionResult.js';

export function chooseEvent(state, eventId, optionId, now = Date.now(), random = Math.random) {
  const event = catalogEvent(eventId);
  const active = state.events.find(entry => entry.eventId === eventId);
  const option = event?.options.find(item => item.id === optionId);
  if (!event || !option || !active) return reportAction(state, 'That guild event is no longer available.', now, false);
  const goldDelta = option.gold || 0;
  const cost = Math.max(0, -goldDelta);

  if (option.id === 'recruit') {
    const recruitment = performRecruitment(state, { cost, random, now, source: 'event' });
    if (!recruitment.ok) return state;
  } else {
    if (state.guild.gold < cost) return reportAction(state, `${event.title} needs ${cost} gold.`, now, false);
    state.guild.gold += goldDelta;
  }

  state.guild.reputation += option.reputation || 0;
  state.guild.researchPoints += option.research || 0;
  state.events = state.events.filter(entry => entry !== active);
  return reportAction(state, `${event.title}: ${option.label}.`, now, true);
}

export function createDailyEvent(state, now = Date.now()) {
  if (state.events.length >= 2 || state.guild.day < 2) return state;
  const available = EVENT_CATALOG.filter(event => !state.events.some(active => active.eventId === event.id));
  if (!available.length || state.guild.day % 2 !== 0) return state;
  const event = available[state.guild.day % available.length];
  state.events.push({ id: `event-${state.guild.day}`, eventId: event.id, createdDay: state.guild.day });
  appendLog(state, `Guild event: ${event.title}.`, now);
  return state;
}

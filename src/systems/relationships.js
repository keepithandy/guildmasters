import { RELATIONSHIP_EVENTS } from '../content.js';
import { findHero } from '../heroes.js';
import { reportAction } from '../actionResult.js';
import { awardAchievement } from './achievements.js';

export function bondHeroes(state, firstHeroId, secondHeroId, now = Date.now()) {
  const first = findHero(state, firstHeroId);
  const second = findHero(state, secondHeroId);
  if (!first || !second || first.id === second.id) return reportAction(state, 'Choose two different heroes to build a relationship.', now, false);
  if (first.status !== 'idle' || second.status !== 'idle') return reportAction(state, 'Both heroes must be idle to build a relationship.', now, false);
  const event = RELATIONSHIP_EVENTS[state.guild.day % RELATIONSHIP_EVENTS.length];
  first.relationships[second.id] = Math.min(100, (first.relationships[second.id] || 0) + event.bond);
  second.relationships[first.id] = Math.min(100, (second.relationships[first.id] || 0) + event.bond);
  first.morale = Math.min(100, (first.morale ?? 75) + event.morale);
  second.morale = Math.min(100, (second.morale ?? 75) + event.morale);
  state.relationshipEvents.push({ id: `relationship-${now}`, heroIds: [first.id, second.id], eventId: event.id, createdDay: state.guild.day });
  state.relationshipEvents = state.relationshipEvents.slice(-8);
  awardAchievement(state, 'bond-forged', now);
  return reportAction(state, `${event.title}: ${first.name} and ${second.name} grew closer.`, now, true);
}

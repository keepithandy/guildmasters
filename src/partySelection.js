import { heroTotalPower } from './heroes.js';

export function repairPartySelection(heroIds, heroes) {
  const idleIds = new Set((heroes || []).filter(hero => hero?.status === 'idle').map(hero => hero.id));
  return [...new Set(Array.isArray(heroIds) ? heroIds : [])].filter(id => idleIds.has(id));
}

export function recommendedParty(heroes, limit = 3) {
  return (heroes || []).filter(hero => hero?.status === 'idle')
    .sort((left, right) => heroTotalPower(right) - heroTotalPower(left) || left.name.localeCompare(right.name))
    .slice(0, Math.max(1, limit)).map(hero => hero.id);
}

export function partyUnavailableReason(hero) {
  if (!hero) return 'This hero is no longer available.';
  if (hero.status !== 'idle') return `${hero.name} is away on a contract.`;
  return '';
}

import { createActionResult } from './actionResult.js';

export function prepareBulkTraining(state, heroIds) {
  const selected = [...new Set(heroIds || [])].map(id => state.heroes.find(hero => hero.id === id)).filter(hero => hero?.status === 'idle');
  if (!selected.length) return createActionResult(false, 'Choose at least one idle hero to train.', { heroes: [], totalCost: 0 });
  const totalCost = selected.reduce((total, hero) => total + 20 + ((Number(hero.level) || 1) * 10), 0);
  if (state.guild.gold < totalCost) return createActionResult(false, `Bulk training needs ${totalCost} gold; no heroes were trained.`, { heroes: [], totalCost });
  return createActionResult(true, `${selected.length} heroes are ready for bulk training.`, { heroes: selected, totalCost });
}

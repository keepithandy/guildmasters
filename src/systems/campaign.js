import { CAMPAIGN_CHAPTERS, catalogChapter, catalogStoryDecision } from '../content.js';
import { reportAction } from '../actionResult.js';
import { awardAchievement } from './achievements.js';

export function advanceCampaign(state, now = Date.now()) {
  const chapter = catalogChapter(state.campaign.activeChapter);
  if (!chapter) return reportAction(state, 'The active campaign chapter could not be found.', now, false);
  if (!chapter.requirement(state)) return reportAction(state, `${chapter.title} is not ready. ${chapter.description}`, now, false);
  if (state.campaign.chaptersCompleted.includes(chapter.id)) return reportAction(state, `${chapter.title} is already complete.`, now, false);
  state.campaign.chaptersCompleted.push(chapter.id);
  state.guild.gold += chapter.rewardGold;
  state.guild.reputation += chapter.rewardReputation;
  const next = CAMPAIGN_CHAPTERS.find(candidate => !state.campaign.chaptersCompleted.includes(candidate.id));
  state.campaign.activeChapter = next?.id || chapter.id;
  if (state.campaign.chaptersCompleted.length >= 3) awardAchievement(state, 'chapter-keeper', now);
  if (chapter.id === 'final-expedition') awardAchievement(state, 'legendary-guild', now);
  return reportAction(state, `${chapter.title} completed. +${chapter.rewardGold} gold and +${chapter.rewardReputation} reputation.`, now, true);
}

export function makeStoryChoice(state, decisionId, optionId, now = Date.now()) {
  const decision = catalogStoryDecision(decisionId);
  const option = decision?.options.find(candidate => candidate.id === optionId);
  if (!decision || !option) return reportAction(state, 'That story choice is unavailable.', now, false);
  if (state.campaign.decisionsMade.includes(decision.id)) return reportAction(state, `${decision.title} has already been decided.`, now, false);
  if (!state.campaign.chaptersCompleted.includes(decision.chapterId)) return reportAction(state, `${decision.title} is not available yet.`, now, false);
  state.campaign.decisionsMade.push(decision.id);
  if (option.faction) state.factions[option.faction] = Math.min(100, (state.factions[option.faction] || 0) + 4);
  state.guild.reputation += option.reputation || 0;
  state.guild.researchPoints += option.research || 0;
  state.guild.prestige += option.prestige || 0;
  state.guild.influence += option.influence || 0;
  if (option.flag) state.flags[option.flag] = true;
  return reportAction(state, `${decision.title}: ${option.label}. The guild’s story has changed.`, now, true);
}

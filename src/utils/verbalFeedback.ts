import type { VerbalFeedback } from '../types/analytics';

const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'you know'];
const POSITIVE_WORDS = ['good', 'great', 'excellent', 'positive', 'confident'];
const NEGATIVE_WORDS = ['bad', 'poor', 'terrible', 'negative', 'nervous'];

/**
 * Analyze a transcript for filler words and a very small sentiment score.
 * Sentiment is returned on a 0..1 scale where 0.5 is neutral.
 */
export function analyzeVerbalResponse(text: string): VerbalFeedback {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  let fillerCount = 0;
  let sentiment = 0;
  for (const token of tokens) {
    if (FILLER_WORDS.includes(token)) fillerCount++;
    if (POSITIVE_WORDS.includes(token)) sentiment++;
    if (NEGATIVE_WORDS.includes(token)) sentiment--;
  }
  const sentimentScore = tokens.length ? 0.5 + sentiment / (2 * tokens.length) : 0.5;
  const suggestions: string[] = [];
  if (fillerCount > 0) suggestions.push(`You used ${fillerCount} filler words. Try pausing instead.`);
  if (sentimentScore < 0.4) suggestions.push('Your tone seemed negative; aim for a calmer delivery.');
  if (sentimentScore > 0.6) suggestions.push('Positive tone maintained.');
  if (suggestions.length === 0) suggestions.push('Clear and confident response.');
  return { fillerCount, sentiment: Number(sentimentScore.toFixed(2)), suggestions };
}


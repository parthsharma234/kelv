// Expression Analytics Utilities
// Convert Hume expression measurements into actionable interview insights

import { EmotionScore, ProsodyPrediction, LanguagePrediction } from './humeExpressionMeasurement';

export interface ExpressionInsights {
  overallEmotionalProfile: {
    dominantEmotions: EmotionScore[];
    emotionalStability: number; // 0-1, how consistent emotions are
    positiveEmotionRatio: number; // 0-1, ratio of positive to all emotions
  };
  communicationStyle: {
    confidence: number; // 0-1
    enthusiasm: number; // 0-1
    authenticity: number; // 0-1
    stress: number; // 0-1
  };
  timelineAnalysis: {
    emotionalTrajectory: 'improving' | 'stable' | 'declining';
    peakMoments: { time: number; emotion: string; score: number }[];
    lowMoments: { time: number; emotion: string; score: number }[];
  };
  recommendations: string[];
}

// Emotion categories for classification
const POSITIVE_EMOTIONS = new Set([
  'Joy', 'Amusement', 'Excitement', 'Contentment', 'Satisfaction', 'Relief',
  'Interest', 'Admiration', 'Pride', 'Triumph', 'Ecstasy', 'Enthusiasm',
  'Determination', 'Concentration'
]);

const NEGATIVE_EMOTIONS = new Set([
  'Sadness', 'Fear', 'Anxiety', 'Anger', 'Disgust', 'Shame', 'Guilt',
  'Disappointment', 'Distress', 'Embarrassment', 'Horror', 'Pain',
  'Awkwardness', 'Confusion'
]);

const CONFIDENCE_EMOTIONS = new Set([
  'Confidence', 'Pride', 'Determination', 'Triumph', 'Satisfaction',
  'Calmness', 'Interest', 'Concentration'
]);

const STRESS_EMOTIONS = new Set([
  'Anxiety', 'Fear', 'Distress', 'Awkwardness', 'Embarrassment',
  'Confusion', 'Doubt', 'Tiredness'
]);

const ENTHUSIASM_EMOTIONS = new Set([
  'Excitement', 'Joy', 'Enthusiasm', 'Interest', 'Admiration',
  'Amusement', 'Ecstasy', 'Surprise (positive)'
]);

/**
 * Analyze expression measurements and generate insights
 */
export function analyzeExpressionMeasurements(
  prosodyPredictions: ProsodyPrediction[],
  languagePredictions: LanguagePrediction[]
): ExpressionInsights {
  // Combine all predictions for analysis
  const allPredictions = [...prosodyPredictions, ...languagePredictions];

  if (allPredictions.length === 0) {
    return getDefaultInsights();
  }

  // Aggregate emotions across all predictions
  const emotionMap = new Map<string, number[]>();

  allPredictions.forEach(prediction => {
    prediction.emotions.forEach(emotion => {
      if (!emotionMap.has(emotion.name)) {
        emotionMap.set(emotion.name, []);
      }
      emotionMap.get(emotion.name)!.push(emotion.score);
    });
  });

  // Calculate average scores for each emotion
  const averagedEmotions: EmotionScore[] = Array.from(emotionMap.entries())
    .map(([name, scores]) => ({
      name,
      score: scores.reduce((sum, s) => sum + s, 0) / scores.length
    }))
    .sort((a, b) => b.score - a.score);

  // Get top 5 dominant emotions
  const dominantEmotions = averagedEmotions.slice(0, 5);

  // Calculate emotional stability (lower variance = more stable)
  const emotionalStability = calculateEmotionalStability(allPredictions);

  // Calculate positive emotion ratio
  const positiveEmotionRatio = calculatePositiveRatio(averagedEmotions);

  // Analyze communication style
  const communicationStyle = analyzeCommunicationStyle(averagedEmotions);

  // Analyze emotional trajectory over time
  const timelineAnalysis = analyzeEmotionalTimeline(prosodyPredictions);

  // Generate recommendations
  const recommendations = generateRecommendations(
    dominantEmotions,
    communicationStyle,
    timelineAnalysis
  );

  return {
    overallEmotionalProfile: {
      dominantEmotions,
      emotionalStability,
      positiveEmotionRatio
    },
    communicationStyle,
    timelineAnalysis,
    recommendations
  };
}

function calculateEmotionalStability(predictions: (ProsodyPrediction | LanguagePrediction)[]): number {
  if (predictions.length < 2) return 1.0;

  // Calculate variance in top emotion scores across time
  const topEmotionScores = predictions.map(p => {
    const sortedEmotions = [...p.emotions].sort((a, b) => b.score - a.score);
    return sortedEmotions[0]?.score || 0;
  });

  const mean = topEmotionScores.reduce((sum, score) => sum + score, 0) / topEmotionScores.length;
  const variance = topEmotionScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / topEmotionScores.length;
  const stdDev = Math.sqrt(variance);

  // Convert to 0-1 scale (lower stdDev = higher stability)
  // Assume stdDev of 0.2 or less is very stable (1.0), 0.5+ is unstable (0.0)
  return Math.max(0, Math.min(1, 1 - (stdDev / 0.5)));
}

function calculatePositiveRatio(emotions: EmotionScore[]): number {
  let positiveSum = 0;
  let negativeSum = 0;

  emotions.forEach(emotion => {
    if (POSITIVE_EMOTIONS.has(emotion.name)) {
      positiveSum += emotion.score;
    } else if (NEGATIVE_EMOTIONS.has(emotion.name)) {
      negativeSum += emotion.score;
    }
  });

  const total = positiveSum + negativeSum;
  return total > 0 ? positiveSum / total : 0.5;
}

function analyzeCommunicationStyle(emotions: EmotionScore[]): ExpressionInsights['communicationStyle'] {
  let confidenceScore = 0;
  let enthusiasmScore = 0;
  let stressScore = 0;

  emotions.forEach(emotion => {
    if (CONFIDENCE_EMOTIONS.has(emotion.name)) {
      confidenceScore += emotion.score;
    }
    if (ENTHUSIASM_EMOTIONS.has(emotion.name)) {
      enthusiasmScore += emotion.score;
    }
    if (STRESS_EMOTIONS.has(emotion.name)) {
      stressScore += emotion.score;
    }
  });

  // Normalize scores (these are accumulated, so divide by typical max)
  const normalize = (score: number) => Math.min(1, score / 0.5);

  // Authenticity is high when there's emotional variety and not all flat
  const emotionVariety = emotions.length > 3 ? 0.8 : 0.5;
  const authenticityScore = emotionVariety * (1 - stressScore / 2);

  return {
    confidence: normalize(confidenceScore),
    enthusiasm: normalize(enthusiasmScore),
    authenticity: Math.max(0, Math.min(1, authenticityScore)),
    stress: normalize(stressScore)
  };
}

function analyzeEmotionalTimeline(prosodyPredictions: ProsodyPrediction[]): ExpressionInsights['timelineAnalysis'] {
  if (prosodyPredictions.length < 3) {
    return {
      emotionalTrajectory: 'stable',
      peakMoments: [],
      lowMoments: []
    };
  }

  // Split into thirds to analyze trajectory
  const thirdSize = Math.floor(prosodyPredictions.length / 3);
  const firstThird = prosodyPredictions.slice(0, thirdSize);
  const lastThird = prosodyPredictions.slice(-thirdSize);

  const getAveragePositivity = (predictions: ProsodyPrediction[]) => {
    let positiveSum = 0;
    let total = 0;

    predictions.forEach(p => {
      p.emotions.forEach(e => {
        if (POSITIVE_EMOTIONS.has(e.name)) {
          positiveSum += e.score;
        }
        total += e.score;
      });
    });

    return total > 0 ? positiveSum / total : 0.5;
  };

  const startPositivity = getAveragePositivity(firstThird);
  const endPositivity = getAveragePositivity(lastThird);
  const change = endPositivity - startPositivity;

  let emotionalTrajectory: 'improving' | 'stable' | 'declining';
  if (change > 0.1) {
    emotionalTrajectory = 'improving';
  } else if (change < -0.1) {
    emotionalTrajectory = 'declining';
  } else {
    emotionalTrajectory = 'stable';
  }

  // Find peak and low moments
  const moments = prosodyPredictions.map(p => {
    const topEmotion = [...p.emotions].sort((a, b) => b.score - a.score)[0];
    return {
      time: p.time.begin,
      emotion: topEmotion.name,
      score: topEmotion.score,
      isPositive: POSITIVE_EMOTIONS.has(topEmotion.name)
    };
  });

  const peakMoments = moments
    .filter(m => m.isPositive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ time, emotion, score }) => ({ time, emotion, score }));

  const lowMoments = moments
    .filter(m => !m.isPositive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ time, emotion, score }) => ({ time, emotion, score }));

  return {
    emotionalTrajectory,
    peakMoments,
    lowMoments
  };
}

function generateRecommendations(
  dominantEmotions: EmotionScore[],
  communicationStyle: ExpressionInsights['communicationStyle'],
  timeline: ExpressionInsights['timelineAnalysis']
): string[] {
  const recommendations: string[] = [];

  // Confidence recommendations
  if (communicationStyle.confidence < 0.4) {
    recommendations.push('Work on projecting more confidence through your voice and language. Practice power poses before interviews.');
  } else if (communicationStyle.confidence > 0.7) {
    recommendations.push('Great confidence! Make sure it comes across as authentic rather than overconfident.');
  }

  // Enthusiasm recommendations
  if (communicationStyle.enthusiasm < 0.3) {
    recommendations.push('Show more enthusiasm and interest in the role. Your emotional energy should match your words.');
  } else if (communicationStyle.enthusiasm > 0.7) {
    recommendations.push('Excellent enthusiasm! Your passion for the role comes through clearly.');
  }

  // Stress recommendations
  if (communicationStyle.stress > 0.6) {
    recommendations.push('High stress detected. Practice relaxation techniques and mock interviews to build comfort.');
  }

  // Authenticity recommendations
  if (communicationStyle.authenticity < 0.5) {
    recommendations.push('Be more genuine in your responses. Interviewers value authenticity over perfectly rehearsed answers.');
  }

  // Trajectory recommendations
  if (timeline.emotionalTrajectory === 'declining') {
    recommendations.push('Your emotional energy declined during the interview. Work on maintaining consistent energy throughout.');
  } else if (timeline.emotionalTrajectory === 'improving') {
    recommendations.push('Great job warming up! You showed increasing positive energy as the interview progressed.');
  }

  // Dominant emotion recommendations
  const topEmotion = dominantEmotions[0]?.name;
  if (topEmotion && STRESS_EMOTIONS.has(topEmotion)) {
    recommendations.push(`Your primary emotion was ${topEmotion}. Focus on techniques to manage interview anxiety.`);
  } else if (topEmotion && CONFIDENCE_EMOTIONS.has(topEmotion)) {
    recommendations.push(`Your primary emotion was ${topEmotion}. This is excellent - keep it up!`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Your emotional communication was well-balanced. Continue practicing to maintain this level.');
  }

  return recommendations;
}

function getDefaultInsights(): ExpressionInsights {
  return {
    overallEmotionalProfile: {
      dominantEmotions: [],
      emotionalStability: 0.5,
      positiveEmotionRatio: 0.5
    },
    communicationStyle: {
      confidence: 0.5,
      enthusiasm: 0.5,
      authenticity: 0.5,
      stress: 0.5
    },
    timelineAnalysis: {
      emotionalTrajectory: 'stable',
      peakMoments: [],
      lowMoments: []
    },
    recommendations: ['Not enough expression data was collected for detailed analysis.']
  };
}

/**
 * Format expression insights for display in feedback UI
 */
export function formatExpressionInsights(insights: ExpressionInsights): string {
  let output = '## Emotional Expression Analysis\n\n';

  output += '### Overall Profile\n';
  output += `- **Dominant Emotions:** ${insights.overallEmotionalProfile.dominantEmotions.map(e => `${e.name} (${(e.score * 100).toFixed(1)}%)`).join(', ')}\n`;
  output += `- **Emotional Stability:** ${(insights.overallEmotionalProfile.emotionalStability * 100).toFixed(0)}%\n`;
  output += `- **Positive Emotion Ratio:** ${(insights.overallEmotionalProfile.positiveEmotionRatio * 100).toFixed(0)}%\n\n`;

  output += '### Communication Style\n';
  output += `- **Confidence:** ${(insights.communicationStyle.confidence * 100).toFixed(0)}%\n`;
  output += `- **Enthusiasm:** ${(insights.communicationStyle.enthusiasm * 100).toFixed(0)}%\n`;
  output += `- **Authenticity:** ${(insights.communicationStyle.authenticity * 100).toFixed(0)}%\n`;
  output += `- **Stress Level:** ${(insights.communicationStyle.stress * 100).toFixed(0)}%\n\n`;

  output += '### Timeline\n';
  output += `- **Emotional Trajectory:** ${insights.timelineAnalysis.emotionalTrajectory}\n`;
  if (insights.timelineAnalysis.peakMoments.length > 0) {
    output += `- **Peak Moments:** ${insights.timelineAnalysis.peakMoments.map(m => `${m.emotion} at ${Math.floor(m.time)}s`).join(', ')}\n`;
  }
  if (insights.timelineAnalysis.lowMoments.length > 0) {
    output += `- **Challenging Moments:** ${insights.timelineAnalysis.lowMoments.map(m => `${m.emotion} at ${Math.floor(m.time)}s`).join(', ')}\n`;
  }
  output += '\n';

  output += '### Recommendations\n';
  insights.recommendations.forEach((rec, i) => {
    output += `${i + 1}. ${rec}\n`;
  });

  return output;
}

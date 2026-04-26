import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { InterviewMetrics } from '../../utils/analyticsEngine';

ChartJS.register(
  RadialLinearScale,
  ArcElement,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

interface EnhancedChartsProps {
  metrics: InterviewMetrics;
}

// Signal color palette
const EMOTION_COLORS: Record<string, { bg: string; border: string }> = {
  Joy: { bg: 'rgba(16, 185, 129, 0.6)', border: '#10b981' },
  Calmness: { bg: 'rgba(59, 130, 246, 0.6)', border: '#3b82f6' },
  Interest: { bg: 'rgba(139, 92, 246, 0.6)', border: '#8b5cf6' },
  Determination: { bg: 'rgba(6, 182, 212, 0.6)', border: '#06b6d4' },
  Excitement: { bg: 'rgba(236, 72, 153, 0.6)', border: '#ec4899' },
  Concentration: { bg: 'rgba(99, 102, 241, 0.6)', border: '#6366f1' },
  Contemplation: { bg: 'rgba(168, 85, 247, 0.6)', border: '#a855f7' },
  Anxiety: { bg: 'rgba(239, 68, 68, 0.6)', border: '#ef4444' },
  Confusion: { bg: 'rgba(245, 158, 11, 0.6)', border: '#f59e0b' },
  Distress: { bg: 'rgba(220, 38, 38, 0.6)', border: '#dc2626' },
  Fear: { bg: 'rgba(249, 115, 22, 0.6)', border: '#f97316' },
  Sadness: { bg: 'rgba(107, 114, 128, 0.6)', border: '#6b7280' }
};

// Delivery Trend - Built from transcript-based confidence proxies
export const EmotionTimeline: React.FC<{ metrics: InterviewMetrics }> = ({ metrics }) => {
  // Get top signal categories with actual data
  const topEmotions = Object.entries(metrics.expressionBreakdown)
    .filter(([_, value]) => value > 5) // Only emotions above 5%
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if (topEmotions.length === 0 || metrics.timeline.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        No delivery trend data available
      </div>
    );
  }

  // Create smooth line data for each signal
  const datasets = topEmotions.map(([emotion]) => {
    const colors = EMOTION_COLORS[emotion] || { bg: 'rgba(107, 114, 128, 0.3)', border: '#6b7280' };

    return {
      label: emotion,
      data: metrics.timeline.map(t => {
        // Show intensity when this signal is dominant, otherwise show baseline
        if (t.dominantEmotion === emotion) {
          return t.emotionIntensity * 100;
        }
        // Keep a reduced baseline to show recurring signal strength
        const emotionScore = metrics.expressionBreakdown[emotion] || 0;
        return emotionScore * 0.3; // Show a baseline level
      }),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4
    };
  });

  const data = {
    labels: metrics.timeline.map(t => t.timestamp),
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          font: { size: 11 },
          usePointStyle: true,
          padding: 16,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 18, 0.95)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${Math.round(context.parsed.y)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#6b7280',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          font: { size: 10 }
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#6b7280',
          stepSize: 25,
          font: { size: 10 },
          callback: (value: any) => value + '%'
        }
      }
    }
  };

  return <Line data={data} options={options} />;
};

// Voice Confidence Over Time
export const VoiceConfidenceChart: React.FC<{ metrics: InterviewMetrics }> = ({ metrics }) => {
  if (metrics.timeline.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        No voice data available
      </div>
    );
  }

  const data = {
    labels: metrics.timeline.map(t => t.timestamp),
    datasets: [
      {
        label: 'Voice Confidence',
        data: metrics.timeline.map(t => t.voiceConfidence * 100),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 18, 0.95)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Confidence: ${Math.round(context.parsed.y)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', maxRotation: 0, autoSkip: true, maxTicksLimit: 6, font: { size: 10 } }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#6b7280', stepSize: 25, font: { size: 10 }, callback: (v: any) => v + '%' }
      }
    }
  };

  return <Line data={data} options={options} />;
};

// Speaking Pace Distribution
export const PaceDistributionChart: React.FC<{ metrics: InterviewMetrics }> = ({ metrics }) => {
  const wpm = metrics.wpm;
  const optimalMin = 130;
  const optimalMax = 150;

  // Determine pace category
  let paceCategory: 'slow' | 'optimal' | 'fast';
  if (wpm < optimalMin) paceCategory = 'slow';
  else if (wpm > optimalMax) paceCategory = 'fast';
  else paceCategory = 'optimal';

  const data = {
    labels: ['Your Pace'],
    datasets: [
      {
        label: 'WPM',
        data: [wpm],
        backgroundColor: paceCategory === 'optimal' ? 'rgba(16, 185, 129, 0.8)' :
          paceCategory === 'slow' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(249, 115, 22, 0.8)',
        borderRadius: 8,
        barThickness: 40
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 18, 0.95)',
        callbacks: {
          label: () => `${wpm} words per minute`
        }
      }
    },
    scales: {
      x: {
        min: 0,
        max: 200,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#6b7280', font: { size: 10 } }
      },
      y: {
        grid: { display: false },
        ticks: { display: false }
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Bar data={data} options={options} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
        <span>Slow (&lt;130)</span>
        <span className="text-green-400">Optimal (130-150)</span>
        <span>Fast (&gt;150)</span>
      </div>
    </div>
  );
};

// Filler Word Breakdown
export const FillerWordChart: React.FC<{ fillerCount: number; totalWords: number }> = ({ fillerCount, totalWords }) => {
  const fillerPercentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;
  const cleanPercentage = 100 - fillerPercentage;

  const data = {
    labels: ['Clean Speech', 'Filler Words'],
    datasets: [
      {
        data: [cleanPercentage, fillerPercentage],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0,
        cutout: '70%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 18, 0.95)',
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed.toFixed(1)}%`
        }
      }
    }
  };

  return (
    <div className="relative h-full flex items-center justify-center">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{fillerCount}</span>
        <span className="text-xs text-gray-500">fillers</span>
      </div>
    </div>
  );
};

// Tonal Variety Gauge
export const TonalVarietyGauge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);
  const label = score >= 70 ? 'Dynamic' : score >= 50 ? 'Moderate' : 'Monotone';

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.51} 251`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
};

// Posture Analysis Display (unique visualization)
export const PostureAnalysisDisplay: React.FC<{
  postureData?: {
    shoulderAlignment: number;
    headPosition: 'centered' | 'forward' | 'tilted';
    overallScore: number;
    timeInGoodPosture: number;
  }
}> = ({ postureData }) => {
  if (!postureData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="w-24 h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center mb-3">
          <svg className="w-12 h-16 text-gray-600" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="6" r="4" />
            <path d="M12 10v8M8 14h8M8 22l4-4 4 4" />
          </svg>
        </div>
        <p className="text-sm">Posture data not available</p>
        <p className="text-xs text-gray-600 mt-1">Complete warm-up for posture analysis</p>
      </div>
    );
  }

  const { shoulderAlignment, headPosition, overallScore, timeInGoodPosture } = postureData;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const headPositionLabel = {
    centered: { text: 'Centered', color: '#10b981' },
    forward: { text: 'Forward Lean', color: '#f59e0b' },
    tilted: { text: 'Tilted', color: '#ef4444' }
  }[headPosition];

  return (
    <div className="h-full flex flex-col">
      {/* Body Diagram */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Simplified body outline */}
          <svg className="w-28 h-36" viewBox="0 0 56 72" fill="none">
            {/* Head */}
            <circle
              cx="28"
              cy="12"
              r="10"
              stroke={getScoreColor(overallScore)}
              strokeWidth="2"
              fill="rgba(255,255,255,0.03)"
            />
            {/* Neck */}
            <line x1="28" y1="22" x2="28" y2="28" stroke={getScoreColor(overallScore)} strokeWidth="2" />
            {/* Shoulders */}
            <line
              x1="12"
              y1="32"
              x2="44"
              y2="32"
              stroke={getScoreColor(shoulderAlignment)}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Torso */}
            <line x1="28" y1="28" x2="28" y2="52" stroke={getScoreColor(overallScore)} strokeWidth="2" />
            {/* Arms */}
            <line x1="12" y1="32" x2="8" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
            <line x1="44" y1="32" x2="48" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
            {/* Chair back indicator */}
            <path d="M16 36 L16 60 L40 60 L40 36" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          </svg>

          {/* Score badge */}
          <div
            className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: getScoreColor(overallScore) + '20', color: getScoreColor(overallScore) }}
          >
            {overallScore}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Shoulders</p>
          <p className="text-sm font-bold" style={{ color: getScoreColor(shoulderAlignment) }}>
            {shoulderAlignment}%
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Head</p>
          <p className="text-sm font-bold" style={{ color: headPositionLabel.color }}>
            {headPositionLabel.text}
          </p>
        </div>
      </div>

      {/* Time in good posture */}
      <div className="mt-2 bg-white/5 rounded-lg p-2 text-center">
        <p className="text-xs text-gray-500">Time in Good Posture</p>
        <p className="text-sm font-bold text-white">{timeInGoodPosture}%</p>
      </div>
    </div>
  );
};

// Main component - Voice & Delivery focused
const EnhancedCharts: React.FC<EnhancedChartsProps> = ({ metrics }) => {
  // Estimate total words from WPM and duration
  const estimatedTotalWords = Math.round((metrics.wpm * (metrics.timeline.length * 5)) / 60);

  return (
    <div className="space-y-6">
      {/* Emotion Timeline - Full Width */}
      <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-6">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
          Delivery Signals Over Time
        </h3>
        <div className="h-[280px] w-full">
          <EmotionTimeline metrics={metrics} />
        </div>
      </div>

      {/* Voice Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Voice Confidence */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Voice Confidence
          </h3>
          <div className="h-[160px]">
            <VoiceConfidenceChart metrics={metrics} />
          </div>
        </div>

        {/* Speaking Pace */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Speaking Pace
          </h3>
          <div className="h-[160px]">
            <PaceDistributionChart metrics={metrics} />
          </div>
        </div>

        {/* Filler Words */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Speech Clarity
          </h3>
          <div className="h-[160px]">
            <FillerWordChart fillerCount={metrics.fillerWordCount} totalWords={estimatedTotalWords} />
          </div>
        </div>

        {/* Tonal Variety */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-5">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Tonal Variety
          </h3>
          <div className="h-[160px]">
            <TonalVarietyGauge score={metrics.tonalVariety} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCharts;

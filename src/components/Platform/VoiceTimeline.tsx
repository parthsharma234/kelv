import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  BarChart3
} from 'lucide-react';
import { VoiceTimelinePoint } from '../../utils/speechAnalysis';

interface VoiceTimelineProps {
  voiceTimeline: VoiceTimelinePoint[];
}

const METRICS = [
  { key: 'speechRate', label: 'Speech Rate (WPM)', color: '#3b82f6' },
  { key: 'fluencyScore', label: 'Fluency (%)', color: '#06b6d4' },
  { key: 'voiceConfidence', label: 'Voice Confidence (%)', color: '#6366f1' },
  { key: 'deliveryScore', label: 'Delivery (%)', color: '#f59e42' },
  { key: 'clarityScore', label: 'Clarity (%)', color: '#10b981' },
  { key: 'fillerWordCount', label: 'Filler Words', color: '#ef4444' },
];

const VoiceTimeline: React.FC<VoiceTimelineProps> = ({ voiceTimeline }) => {
  const [selectedPoint, setSelectedPoint] = useState<VoiceTimelinePoint | null>(null);

  if (!voiceTimeline || voiceTimeline.length === 0) {
    return (
      <div className="bg-dark-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Voice Analysis</h3>
        </div>
        <p className="text-gray-400">Voice analysis data not available for this interview.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare data for the line graph
  const times = voiceTimeline.map(pt => (pt.timestamp - voiceTimeline[0].timestamp) / 1000);
  const minTime = 0;
  const maxTime = Math.max(...times, 1);

  // SVG dimensions: width is proportional to duration, min 400px, max 1200px
  const pxPerSec = 12;
  const width = Math.max(400, Math.min(1200, (maxTime - minTime) * pxPerSec + 2 * 40));
  const height = 220;
  const padding = 40;

  // Helper to scale X
  const scaleX = (t: number) => padding + ((t - minTime) / (maxTime - minTime || 1)) * (width - 2 * padding);
  // Helper to scale Y for a metric
  const scaleY = (val: number, metric: keyof typeof yRanges) => {
    const { min, max } = yRanges[metric];
    return height - padding - ((val - min) / (max - min)) * (height - 2 * padding);
  };

  // Find Y-axis ranges for each metric
  const yRanges = {
    speechRate: { min: 60, max: 200 },
    fluencyScore: { min: 0, max: 100 },
    voiceConfidence: { min: 0, max: 100 },
    deliveryScore: { min: 0, max: 100 },
    clarityScore: { min: 0, max: 100 },
    fillerWordCount: { min: 0, max: Math.max(5, ...voiceTimeline.map(pt => pt.metrics.fillerWordCount)) },
  };

  // Build line paths for each metric
  const buildLine = (metric: keyof typeof yRanges) => {
    return voiceTimeline.map((pt, i) => {
      const t = times[i];
      const val = pt.metrics[metric];
      return `${i === 0 ? 'M' : 'L'}${scaleX(t)},${scaleY(val, metric)}`;
    }).join(' ');
  };

  // Legend
  const legend = (
    <div className="flex flex-wrap gap-4 mb-4">
      {METRICS.map(m => (
        <div key={m.key} className="flex items-center gap-2">
          <span style={{ background: m.color }} className="inline-block w-4 h-1.5 rounded-full" />
          <span className="text-xs text-gray-300">{m.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-dark-700/30 rounded-xl p-6 border border-dark-600/30">
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-5 h-5 text-orange-400" />
          <h4 className="text-lg font-semibold text-white">Voice Metrics Timeline</h4>
        </div>
        {legend}
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="block">
            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#888" strokeWidth={1} />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#888" strokeWidth={1} />
            {/* Y-axis ticks and labels for each metric (left side) */}
            {METRICS.map((m, idx) => {
              const { min, max } = yRanges[m.key as keyof typeof yRanges];
              const steps = 4;
              return Array.from({ length: steps + 1 }).map((_, i) => {
                const val = min + ((max - min) * (steps - i)) / steps;
                return (
                  <g key={m.key + '-' + i}>
                    <text
                      x={padding - 8 - idx * 40}
                      y={scaleY(val, m.key as keyof typeof yRanges) + 4}
                      fontSize={10}
                      fill={m.color}
                      textAnchor="end"
                    >
                      {m.key === 'fillerWordCount' ? Math.round(val) : Math.round(val)}
                    </text>
                  </g>
                );
              });
            })}
            {/* X-axis ticks and labels */}
            {voiceTimeline.map((pt, i) => (
              <g key={i + '-tick'}>
                <line
                  x1={scaleX(times[i])}
                  y1={height - padding}
                  x2={scaleX(times[i])}
                  y2={height - padding + 6}
                  stroke="#aaa"
                  strokeWidth={1}
                />
                <text
                  x={scaleX(times[i])}
                  y={height - padding + 18}
                  fontSize={10}
                  fill="#aaa"
                  textAnchor="middle"
                >
                  {formatTime(times[i])}
                </text>
              </g>
            ))}
            {/* Metric lines */}
            {METRICS.map(m => (
              <path
                key={m.key}
                d={buildLine(m.key as keyof typeof yRanges)}
                fill="none"
                stroke={m.color}
                strokeWidth={2}
                style={{ opacity: 0.9 }}
              />
            ))}
            {/* Points for selection */}
            {METRICS.map(m => (
              voiceTimeline.map((pt, i) => {
                const t = times[i];
                const val = pt.metrics[m.key as keyof typeof yRanges];
                return (
                  <circle
                    key={m.key + '-' + i}
                    cx={scaleX(t)}
                    cy={scaleY(val, m.key as keyof typeof yRanges)}
                    r={selectedPoint === pt ? 6 : 3}
                    fill={m.color}
                    stroke="#fff"
                    strokeWidth={selectedPoint === pt ? 2 : 0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPoint(pt)}
                  />
                );
              })
            ))}
          </svg>
        </div>
      </div>

      {/* Detailed Analysis for Selected Point */}
      {selectedPoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">
              Detailed Analysis - {formatTime(selectedPoint.timestamp / 1000)}
            </h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedPoint.feedback.score >= 85 ? 'text-green-400' : selectedPoint.feedback.score >= 70 ? 'text-blue-400' : selectedPoint.feedback.score >= 55 ? 'text-yellow-400' : 'text-red-400'}`}>
              Score: {selectedPoint.feedback.score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice Metrics */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-white mb-3">Voice Metrics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Speech Rate</span>
                  <span className="text-white">{Math.round(selectedPoint.metrics.speechRate)} WPM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fluency Score</span>
                  <span className={selectedPoint.metrics.fluencyScore >= 85 ? 'text-green-400' : selectedPoint.metrics.fluencyScore >= 70 ? 'text-blue-400' : selectedPoint.metrics.fluencyScore >= 55 ? 'text-yellow-400' : 'text-red-400'}>
                    {Math.round(selectedPoint.metrics.fluencyScore)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Voice Confidence</span>
                  <span className={selectedPoint.metrics.voiceConfidence >= 85 ? 'text-green-400' : selectedPoint.metrics.voiceConfidence >= 70 ? 'text-blue-400' : selectedPoint.metrics.voiceConfidence >= 55 ? 'text-yellow-400' : 'text-red-400'}>
                    {Math.round(selectedPoint.metrics.voiceConfidence)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Delivery Score</span>
                  <span className={selectedPoint.metrics.deliveryScore >= 85 ? 'text-green-400' : selectedPoint.metrics.deliveryScore >= 70 ? 'text-blue-400' : selectedPoint.metrics.deliveryScore >= 55 ? 'text-yellow-400' : 'text-red-400'}>
                    {Math.round(selectedPoint.metrics.deliveryScore)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Clarity Score</span>
                  <span className={selectedPoint.metrics.clarityScore >= 85 ? 'text-green-400' : selectedPoint.metrics.clarityScore >= 70 ? 'text-blue-400' : selectedPoint.metrics.clarityScore >= 55 ? 'text-yellow-400' : 'text-red-400'}>
                    {Math.round(selectedPoint.metrics.clarityScore)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Filler Words</span>
                  <span className={selectedPoint.metrics.fillerWordCount > 3 ? 'text-red-400' : 'text-green-400'}>
                    {selectedPoint.metrics.fillerWordCount}
                  </span>
                </div>
              </div>
            </div>
            {/* Feedback */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-white mb-3">Feedback</h5>
              <div className="bg-dark-700 rounded-lg p-4">
                <p className="text-gray-300 mb-3">{selectedPoint.feedback.overall}</p>
                {selectedPoint.feedback.strengths.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-green-400 font-medium mb-2">Strengths:</h6>
                    <ul className="space-y-1">
                      {selectedPoint.feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedPoint.feedback.improvements.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-yellow-400 font-medium mb-2">Areas for Improvement:</h6>
                    <ul className="space-y-1">
                      {selectedPoint.feedback.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedPoint.feedback.specificTips.length > 0 && (
                  <div>
                    <h6 className="text-blue-400 font-medium mb-2">Specific Tips:</h6>
                    <ul className="space-y-1">
                      {selectedPoint.feedback.specificTips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overall Recommendations */}
      <div className="bg-dark-800 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Overall Voice Recommendations</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-green-400 font-medium mb-3">Key Strengths to Maintain:</h5>
            <div className="space-y-2">
              {Array.from(new Set(voiceTimeline.flatMap(point => point.feedback.strengths))).slice(0, 5).map((strength, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{strength}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-blue-400 font-medium mb-3">Priority Improvements:</h5>
            <div className="space-y-2">
              {Array.from(new Set(voiceTimeline.flatMap(point => point.feedback.specificTips))).slice(0, 5).map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTimeline;

import React from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
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

  // Find Y-axis ranges for each metric with proper limits
  const yRanges = {
    speechRate: { min: 80, max: 220 },
    fluencyScore: { min: 20, max: 100 },
    voiceConfidence: { min: 20, max: 100 },
    deliveryScore: { min: 20, max: 100 },
    clarityScore: { min: 20, max: 100 },
    fillerWordCount: { min: 0, max: Math.max(8, ...voiceTimeline.map(pt => pt.metrics.fillerWordCount)) },
  };

  // Build line paths for each metric
  const buildLine = (metric: keyof typeof yRanges) => {
    return voiceTimeline.map((pt, i) => {
      const t = times[i];
      const val = pt.metrics[metric];
      return `${i === 0 ? 'M' : 'L'}${scaleX(t)},${scaleY(val, metric)}`;
    }).join(' ');
  };



  return (
    <div className="space-y-6">
      {/* High-Tech Neural Network Style */}
      <div className="bg-gradient-to-br from-dark-800/90 to-dark-900/95 rounded-2xl p-6 border border-orange-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent rounded-xl animate-pulse"></div>
                <BarChart3 className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Voice Metrics Timeline
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </h3>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>Neural voice analysis</span>
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  <span>Real-time processing</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-dark-700/50 px-3 py-1.5 rounded-lg border border-dark-600/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="font-medium">Live Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-dark-700/50 px-3 py-1.5 rounded-lg border border-dark-600/30">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                <span className="font-medium">AI Processing</span>
              </div>
            </div>
          </div>
          
          <div className="relative bg-gradient-to-br from-dark-900/80 to-black/90 rounded-xl p-6 border border-orange-500/10 shadow-inner">
            {/* High-tech corner decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-orange-500/40 rounded-tl"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-orange-500/40 rounded-tr"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-orange-500/40 rounded-bl"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-orange-500/40 rounded-br"></div>
            
            <svg width={width} height={height} className="rounded-lg relative z-10">
              {/* Enhanced grid and gradients */}
              <defs>
                <pattern id="neuralGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.2" opacity="0.3" />
                  <circle cx="20" cy="10" r="0.5" fill="#6b7280" opacity="0.2" />
                </pattern>
                <linearGradient id="highTechGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f0f0f" stopOpacity="0.95"/>
                  <stop offset="50%" stopColor="#1a1a1a" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.95"/>
                </linearGradient>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
                <filter id="dataGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#highTechGradient)" />
              <rect width="100%" height="100%" fill="url(#neuralGrid)" />
            
            {/* Enhanced metric lines with high-tech effects */}
            {METRICS.map((metric) => {
              const path = buildLine(metric.key as keyof typeof yRanges);
              const gradientId = `gradient-${metric.key}`;
              const glowGradientId = `glow-gradient-${metric.key}`;
              
              return (
                <g key={metric.key}>
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={metric.color} stopOpacity="0.6"/>
                      <stop offset="50%" stopColor={metric.color} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={metric.color} stopOpacity="0.05"/>
                    </linearGradient>
                    <linearGradient id={glowGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={metric.color} stopOpacity="0.9"/>
                      <stop offset="100%" stopColor={metric.color} stopOpacity="0.4"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Glow effect background */}
                  <path
                    d={path}
                    fill="none"
                    stroke={`url(#${glowGradientId})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                    filter="url(#neonGlow)"
                  />
                  
                  {/* Main data line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#dataGlow)"
                    className="drop-shadow-lg"
                  />
                  
                  {/* Enhanced data points with pulse effect */}
                  {voiceTimeline.map((pt, i) => {
                    const t = times[i];
                    const val = pt.metrics[metric.key as keyof typeof yRanges];
                    const x = scaleX(t);
                    const y = scaleY(val, metric.key as keyof typeof yRanges);
                    return (
                      <g key={i}>
                        {/* Outer glow ring */}
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill="none"
                          stroke={metric.color}
                          strokeWidth="1"
                          opacity="0.3"
                          filter="url(#neonGlow)"
                        />
                        {/* Main data point */}
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={metric.color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          filter="url(#dataGlow)"
                          className="drop-shadow-lg"
                        />
                        {/* Inner core */}
                        <circle
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="#ffffff"
                          opacity="0.9"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            
            {/* Enhanced Y-axis with high-tech styling */}
            {METRICS.map((metric) => {
              const { min, max } = yRanges[metric.key as keyof typeof yRanges];
              const steps = 5;
              return Array.from({ length: steps + 1 }, (_, i) => {
                const value = min + (max - min) * (i / steps);
                const y = scaleY(value, metric.key as keyof typeof yRanges);
                const isMiddle = i === Math.floor(steps / 2);
                return (
                  <g key={`${metric.key}-label-${i}`}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="#374151"
                      strokeWidth="0.3"
                      opacity="0.4"
                      strokeDasharray={isMiddle ? "none" : "2,4"}
                    />
                    {/* Axis indicator */}
                    <circle
                      cx={padding}
                      cy={y}
                      r="2"
                      fill={isMiddle ? "#f97316" : "#6b7280"}
                      opacity={isMiddle ? "0.8" : "0.4"}
                    />
                    <text
                      x={padding - 15}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-300 font-semibold"
                      style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
                    >
                      {Math.round(value)}
                    </text>
                  </g>
                );
              });
            })}
            
            {/* Enhanced X-axis with neural network styling */}
            {times.map((t, i) => {
              if (i % Math.ceil(times.length / 8) === 0) {
                const x = scaleX(t);
                return (
                  <g key={`time-${i}`}>
                    <line
                      x1={x}
                      y1={padding}
                      x2={x}
                      y2={height - padding}
                      stroke="#374151"
                      strokeWidth="0.3"
                      opacity="0.3"
                      strokeDasharray="1,3"
                    />
                    {/* Time marker */}
                    <circle
                      cx={x}
                      cy={height - padding}
                      r="2"
                      fill="#6b7280"
                      opacity="0.6"
                    />
                    <text
                      x={x}
                      y={height - padding + 20}
                      textAnchor="middle"
                      className="text-xs fill-gray-300 font-semibold"
                      style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
                    >
                      {Math.round(t)}s
                    </text>
                  </g>
                );
              }
              return null;
            })}
            
            {/* Chart border */}
            <rect
              x={padding}
              y={padding}
              width={width - 2 * padding}
              height={height - 2 * padding}
              fill="none"
              stroke="#4b5563"
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>
        </div>
        
        {/* High-Tech Neural Legend */}
        <div className="mt-8 bg-gradient-to-br from-dark-800/40 to-dark-900/60 rounded-xl p-6 border border-orange-500/10 backdrop-blur-sm relative overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
          
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-orange-500/30 rounded-tl"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-orange-500/30 rounded-tr"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-orange-500/30 rounded-bl"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-orange-500/30 rounded-br"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                Neural Metrics Legend
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {METRICS.map((metric, index) => (
                <motion.div 
                  key={metric.key} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 120 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-dark-700/40 to-dark-800/60 border border-dark-600/20 hover:border-orange-500/30 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="relative">
                      <div 
                        className="w-4 h-4 rounded-full shadow-lg relative z-10" 
                        style={{ 
                          backgroundColor: metric.color, 
                          boxShadow: `0 0 12px ${metric.color}60`,
                          filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                        }}
                      />
                      <div 
                        className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: metric.color }}
                      />
                    </div>
                    <div 
                      className="w-10 h-1 rounded-full relative overflow-hidden" 
                      style={{ backgroundColor: `${metric.color}40` }}
                    >
                      <div 
                        className="absolute inset-0 w-full h-full rounded-full animate-pulse"
                        style={{ backgroundColor: metric.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-200 font-semibold tracking-wide relative z-10">{metric.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default VoiceTimeline;

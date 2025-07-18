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

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 55) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'excellent': return <Star className="w-4 h-4 text-green-400" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'fair': return <Info className="w-4 h-4 text-yellow-400" />;
      case 'needs_improvement': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const averageScore = voiceTimeline.reduce((sum, point) => sum + point.feedback.score, 0) / voiceTimeline.length;

  return (
    <div className="space-y-6">
      {/* Overall Voice Metrics */}
      <div className="bg-dark-700/30 rounded-xl p-6 border border-dark-600/30">
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-5 h-5 text-orange-400" />
          <h4 className="text-lg font-semibold text-white">Your Interview Flow</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Average Score</span>
            </div>
            <span className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {Math.round(averageScore)}
            </span>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Analysis Points</span>
            </div>
            <span className="text-2xl font-bold text-white">{voiceTimeline.length}</span>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Strengths</span>
            </div>
            <span className="text-2xl font-bold text-green-400">
              {voiceTimeline.reduce((sum, point) => sum + point.feedback.strengths.length, 0)}
            </span>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Areas to Improve</span>
            </div>
            <span className="text-2xl font-bold text-red-400">
              {voiceTimeline.reduce((sum, point) => sum + point.feedback.improvements.length, 0)}
            </span>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Performance Timeline</h4>
          
          <div className="relative bg-dark-700 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-end gap-2 min-w-full" style={{ minWidth: `${voiceTimeline.length * 60}px` }}>
              {voiceTimeline.map((point, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedPoint(point)}
                >
                  <div
                    className={`w-8 h-20 rounded-t-lg ${
                      point.feedback.score >= 85 ? 'bg-green-400' :
                      point.feedback.score >= 70 ? 'bg-blue-400' :
                      point.feedback.score >= 55 ? 'bg-yellow-400' : 'bg-red-400'
                    } relative`}
                    style={{ 
                      height: `${Math.max(8, (point.feedback.score / 100) * 80)}px`,
                      opacity: selectedPoint === point ? 1 : 0.7 
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs text-white font-medium">{point.feedback.score}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {formatTime(point.timestamp / 1000)}
                  </div>
                  {getCategoryIcon(point.feedback.category)}
                </motion.div>
              ))}
            </div>
          </div>
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedPoint.feedback.score)}`}>
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
                  <span className={getScoreColor(selectedPoint.metrics.fluencyScore)}>
                    {Math.round(selectedPoint.metrics.fluencyScore)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Voice Confidence</span>
                  <span className={getScoreColor(selectedPoint.metrics.voiceConfidence)}>
                    {Math.round(selectedPoint.metrics.voiceConfidence)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Clarity Score</span>
                  <span className={getScoreColor(selectedPoint.metrics.clarityScore)}>
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

              {selectedPoint.questionContext && (
                <div className="bg-dark-700 rounded-lg p-4">
                  <h6 className="text-orange-400 font-medium mb-2">Question Context:</h6>
                  <p className="text-sm text-gray-300">{selectedPoint.questionContext}</p>
                </div>
              )}
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

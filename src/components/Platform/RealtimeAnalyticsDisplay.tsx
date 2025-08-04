import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Brain, 
  Mic, 
  Activity, 
  TrendingUp, 
  Target,
  Heart,
  Volume2,
  Camera,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ComputerVisionMetrics } from '../../utils/computerVision';
import { AdvancedVoiceMetrics } from '../../utils/advancedVoiceAnalytics';

interface RealtimeAnalyticsDisplayProps {
  cvMetrics: ComputerVisionMetrics | null;
  voiceMetrics: AdvancedVoiceMetrics | null;
  isActive: boolean;
}

const RealtimeAnalyticsDisplay: React.FC<RealtimeAnalyticsDisplayProps> = ({
  cvMetrics,
  voiceMetrics,
  isActive
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);

  // Update performance history
  useEffect(() => {
    if (cvMetrics && voiceMetrics) {
      const overallScore = (
        cvMetrics.overallEngagement + 
        voiceMetrics.emotional.confidence + 
        voiceMetrics.professional.credibility
      ) / 3;
      
      setPerformanceHistory(prev => {
        const newHistory = [...prev, overallScore];
        return newHistory.slice(-20); // Keep last 20 data points
      });
    }
  }, [cvMetrics, voiceMetrics]);

  const formatScore = (score: number): string => {
    return Math.round(score * 100).toString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500/20 border-green-500/30';
    if (score >= 0.6) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 0.4) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      {cvMetrics && voiceMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 rounded-xl p-4 border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-semibold">Live Performance Analysis</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {Math.round((cvMetrics.overallEngagement + voiceMetrics.emotional.confidence + voiceMetrics.professional.credibility) / 3 * 100)}%
              </div>
              <div className="text-xs text-gray-400">Overall Score</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold mb-1 ${getScoreColor(cvMetrics.overallEngagement)}`}>
                {formatScore(cvMetrics.overallEngagement)}%
              </div>
              <div className="text-xs text-gray-400">Visual Presence</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold mb-1 ${getScoreColor(voiceMetrics.professional.credibility)}`}>
                {formatScore(voiceMetrics.professional.credibility)}%
              </div>
              <div className="text-xs text-gray-400">Voice Authority</div>
            </div>
          </div>

          {/* Performance Trend Graph */}
          {performanceHistory.length > 5 && (
            <div className="bg-dark-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Performance Trend</span>
              </div>
              <div className="h-16 flex items-end justify-between gap-1">
                {performanceHistory.map((score, index) => (
                  <div
                    key={index}
                    className={`w-2 rounded-t transition-all duration-300 ${
                      score >= 0.8 ? 'bg-green-400' :
                      score >= 0.6 ? 'bg-yellow-400' :
                      score >= 0.4 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ height: `${score * 100}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Computer Vision Metrics */}
      {cvMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 rounded-xl border border-blue-500/20 overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === 'cv' ? null : 'cv')}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Computer Vision Analysis</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getScoreColor(cvMetrics.overallEngagement)}`}>
                {formatScore(cvMetrics.overallEngagement)}%
              </span>
              {expandedSection === 'cv' ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>

          {expandedSection === 'cv' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 pb-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Eye Tracking */}
                <div className={`p-3 rounded-lg border ${getScoreBgColor(cvMetrics.confidenceIndicators.eyeContactConfidence)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-white text-sm font-medium">Eye Contact</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatScore(cvMetrics.confidenceIndicators.eyeContactConfidence)}%
                  </div>
                  {cvMetrics.eyeTracking.length > 0 && (
                    <div className="text-xs text-gray-300 mt-1">
                      Blink Rate: {Math.round(cvMetrics.eyeTracking.slice(-1)[0].blinkRate)}/min
                    </div>
                  )}
                </div>

                {/* Posture Analysis */}
                <div className={`p-3 rounded-lg border ${getScoreBgColor(cvMetrics.confidenceIndicators.postureConfidence)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-white text-sm font-medium">Posture</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatScore(cvMetrics.confidenceIndicators.postureConfidence)}%
                  </div>
                  {cvMetrics.posture.length > 0 && (
                    <div className="text-xs text-gray-300 mt-1">
                      Energy: {formatScore(cvMetrics.posture.slice(-1)[0].energyLevel)}%
                    </div>
                  )}
                </div>

                {/* Facial Expression */}
                <div className={`p-3 rounded-lg border ${getScoreBgColor(cvMetrics.confidenceIndicators.facialConfidence)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-white text-sm font-medium">Expression</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatScore(cvMetrics.confidenceIndicators.facialConfidence)}%
                  </div>
                  {cvMetrics.facialExpressions.length > 0 && (
                    <div className="text-xs text-gray-300 mt-1">
                      Engagement: {formatScore(cvMetrics.facialExpressions.slice(-1)[0].engagement)}%
                    </div>
                  )}
                </div>

                {/* Professional Presence */}
                <div className={`p-3 rounded-lg border ${getScoreBgColor(cvMetrics.professionalismScore)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-white text-sm font-medium">Presence</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatScore(cvMetrics.professionalismScore)}%
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Professional Impact
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Advanced Voice Metrics */}
      {voiceMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 rounded-xl border border-green-500/20 overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Advanced Voice Analytics</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getScoreColor(voiceMetrics.emotional.confidence)}`}>
                {formatScore(voiceMetrics.emotional.confidence)}%
              </span>
              {expandedSection === 'voice' ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>

          {expandedSection === 'voice' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 pb-4 space-y-3"
            >
              {/* Emotional State */}
              <div className="bg-dark-700/30 rounded-lg p-3">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Emotional Analysis
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className={getScoreColor(voiceMetrics.emotional.confidence)}>
                      {formatScore(voiceMetrics.emotional.confidence)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Enthusiasm</span>
                    <span className={getScoreColor(voiceMetrics.emotional.enthusiasm)}>
                      {formatScore(voiceMetrics.emotional.enthusiasm)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement</span>
                    <span className={getScoreColor(voiceMetrics.emotional.engagement)}>
                      {formatScore(voiceMetrics.emotional.engagement)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stress</span>
                    <span className={getScoreColor(1 - voiceMetrics.emotional.stress)}>
                      {formatScore(1 - voiceMetrics.emotional.stress)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Communication Effectiveness */}
              <div className="bg-dark-700/30 rounded-lg p-3">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Communication
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Articulation</span>
                    <span className={getScoreColor(voiceMetrics.communication.articulation)}>
                      {formatScore(voiceMetrics.communication.articulation)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Projection</span>
                    <span className={getScoreColor(voiceMetrics.communication.projection)}>
                      {formatScore(voiceMetrics.communication.projection)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pace Variation</span>
                    <span className={getScoreColor(voiceMetrics.communication.paceVariation)}>
                      {formatScore(voiceMetrics.communication.paceVariation)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emphasis</span>
                    <span className={getScoreColor(voiceMetrics.communication.emphasis)}>
                      {formatScore(voiceMetrics.communication.emphasis)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Prosodic Features */}
              <div className="bg-dark-700/30 rounded-lg p-3">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Prosody & Rhythm
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intonation</span>
                    <span className={getScoreColor(voiceMetrics.prosody.intonationVariety)}>
                      {formatScore(voiceMetrics.prosody.intonationVariety)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rhythm</span>
                    <span className={getScoreColor(voiceMetrics.prosody.rhythmConsistency)}>
                      {formatScore(voiceMetrics.prosody.rhythmConsistency)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stress Patterns</span>
                    <span className={getScoreColor(voiceMetrics.prosody.stressPatterns)}>
                      {formatScore(voiceMetrics.prosody.stressPatterns)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Melodic Range</span>
                    <span className={getScoreColor(voiceMetrics.prosody.melodicRange)}>
                      {formatScore(voiceMetrics.prosody.melodicRange)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Presence */}
              <div className="bg-dark-700/30 rounded-lg p-3">
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  Professional Presence
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Authority</span>
                    <span className={getScoreColor(voiceMetrics.professional.authorityLevel)}>
                      {formatScore(voiceMetrics.professional.authorityLevel)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credibility</span>
                    <span className={getScoreColor(voiceMetrics.professional.credibility)}>
                      {formatScore(voiceMetrics.professional.credibility)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Persuasiveness</span>
                    <span className={getScoreColor(voiceMetrics.professional.persuasiveness)}>
                      {formatScore(voiceMetrics.professional.persuasiveness)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Likeability</span>
                    <span className={getScoreColor(voiceMetrics.professional.likeability)}>
                      {formatScore(voiceMetrics.professional.likeability)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Real-time Insights */}
      {voiceMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-xl p-4 border border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Real-time Insights</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Performance Trend</span>
              <div className="flex items-center gap-1">
                {voiceMetrics.realtime.trendDirection === 'improving' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Improving</span>
                  </>
                )}
                {voiceMetrics.realtime.trendDirection === 'declining' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                    <span className="text-red-400">Declining</span>
                  </>
                )}
                {voiceMetrics.realtime.trendDirection === 'stable' && (
                  <>
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400">Stable</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Current Confidence</span>
              <span className={getScoreColor(voiceMetrics.realtime.currentConfidence)}>
                {formatScore(voiceMetrics.realtime.currentConfidence)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Current Clarity</span>
              <span className={getScoreColor(voiceMetrics.realtime.currentClarity)}>
                {formatScore(voiceMetrics.realtime.currentClarity)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-xl p-4 border border-gray-700"
      >
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-semibold">Performance Indicators</h3>
        </div>
        
        <div className="space-y-2">
          {/* Overall engagement indicator */}
          {cvMetrics && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Visual Engagement</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${cvMetrics.overallEngagement * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className={`text-xs font-medium ${getScoreColor(cvMetrics.overallEngagement)}`}>
                  {formatScore(cvMetrics.overallEngagement)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Voice confidence indicator */}
          {voiceMetrics && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Voice Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${voiceMetrics.emotional.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className={`text-xs font-medium ${getScoreColor(voiceMetrics.emotional.confidence)}`}>
                  {formatScore(voiceMetrics.emotional.confidence)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Professional presence indicator */}
          {voiceMetrics && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Professional Presence</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${voiceMetrics.professional.credibility * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className={`text-xs font-medium ${getScoreColor(voiceMetrics.professional.credibility)}`}>
                  {formatScore(voiceMetrics.professional.credibility)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RealtimeAnalyticsDisplay;
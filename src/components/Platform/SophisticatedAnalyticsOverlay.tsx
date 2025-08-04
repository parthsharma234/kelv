import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Brain, 
  Mic, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Zap,
  Heart,
  Volume2,
  Camera,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ComputerVisionMetrics, computerVisionAnalyzer } from '../../utils/computerVision';
import { AdvancedVoiceMetrics, advancedVoiceAnalyzer } from '../../utils/advancedVoiceAnalytics';

interface SophisticatedAnalyticsOverlayProps {
  videoElement: HTMLVideoElement | null;
  audioStream: MediaStream | null;
  isActive: boolean;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
}

const SophisticatedAnalyticsOverlay: React.FC<SophisticatedAnalyticsOverlayProps> = ({
  videoElement,
  audioStream,
  isActive,
  onToggleMinimize,
  isMinimized = false
}) => {
  const [cvMetrics, setCvMetrics] = useState<ComputerVisionMetrics | null>(null);
  const [voiceMetrics, setVoiceMetrics] = useState<AdvancedVoiceMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Start/stop analysis based on active state
  useEffect(() => {
    if (isActive && videoElement && audioStream && !isAnalyzing) {
      startAnalysis();
    } else if (!isActive && isAnalyzing) {
      stopAnalysis();
    }

    return () => {
      if (isAnalyzing) {
        stopAnalysis();
      }
    };
  }, [isActive, videoElement, audioStream]);

  const startAnalysis = async () => {
    if (!videoElement || !audioStream) return;

    setIsAnalyzing(true);

    try {
      // Start computer vision analysis
      await computerVisionAnalyzer.startAnalysis(videoElement);

      // Start advanced voice analysis
      await advancedVoiceAnalyzer.startRealtimeAnalysis(audioStream);

      // Set up real-time callbacks
      advancedVoiceAnalyzer.onRealtimeUpdate((metrics) => {
        setVoiceMetrics(metrics);
      });

      // Update CV metrics every 500ms
      const cvInterval = setInterval(() => {
        const metrics = computerVisionAnalyzer.getRealtimeMetrics();
        setCvMetrics(metrics);
      }, 500);

      // Store interval for cleanup
      (window as any).cvAnalysisInterval = cvInterval;

    } catch (error) {
      console.error('Failed to start sophisticated analysis:', error);
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    
    computerVisionAnalyzer.stopAnalysis();
    advancedVoiceAnalyzer.stopRealtimeAnalysis();
    
    if ((window as any).cvAnalysisInterval) {
      clearInterval((window as any).cvAnalysisInterval);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return CheckCircle;
    if (score >= 0.6) return TrendingUp;
    if (score >= 0.4) return Target;
    return AlertCircle;
  };

  const formatScore = (score: number): string => {
    return Math.round(score * 100).toString();
  };

  if (!isActive || !isAnalyzing) {
    return null;
  }

  // Minimized view
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 right-4 z-50 bg-dark-900/95 backdrop-blur-sm rounded-xl border border-orange-500/30 p-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">AI Analysis Active</span>
          </div>
          
          {cvMetrics && (
            <div className="text-xs text-gray-300">
              Engagement: {formatScore(cvMetrics.overallEngagement)}%
            </div>
          )}
          
          {voiceMetrics && (
            <div className="text-xs text-gray-300">
              Voice: {formatScore(voiceMetrics.voiceConfidence)}%
            </div>
          )}
          
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 bottom-4 w-80 z-50 bg-dark-900/95 backdrop-blur-sm rounded-xl border border-orange-500/30 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-white font-semibold">AI Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetailedView(!showDetailedView)}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Computer Vision Metrics */}
        {cvMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800/50 rounded-lg p-3 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-blue-400" />
              <h4 className="text-white font-medium text-sm">Computer Vision</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagement</span>
                  <span className={getScoreColor(cvMetrics.overallEngagement)}>
                    {formatScore(cvMetrics.overallEngagement)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Eye Contact</span>
                  <span className={getScoreColor(cvMetrics.confidenceIndicators.eyeContactConfidence)}>
                    {formatScore(cvMetrics.confidenceIndicators.eyeContactConfidence)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Posture</span>
                  <span className={getScoreColor(cvMetrics.confidenceIndicators.postureConfidence)}>
                    {formatScore(cvMetrics.confidenceIndicators.postureConfidence)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Professional</span>
                  <span className={getScoreColor(cvMetrics.professionalismScore)}>
                    {formatScore(cvMetrics.professionalismScore)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Facial Conf.</span>
                  <span className={getScoreColor(cvMetrics.confidenceIndicators.facialConfidence)}>
                    {formatScore(cvMetrics.confidenceIndicators.facialConfidence)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gestures</span>
                  <span className={getScoreColor(cvMetrics.confidenceIndicators.gestureConfidence)}>
                    {formatScore(cvMetrics.confidenceIndicators.gestureConfidence)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time facial expression indicators */}
            {cvMetrics.facialExpressions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-gray-400">Live Expression</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cvMetrics.facialExpressions.slice(-1)[0].happiness > 0.6 && (
                      <span className="text-green-400">😊</span>
                    )}
                    {cvMetrics.facialExpressions.slice(-1)[0].concentration > 0.7 && (
                      <span className="text-blue-400">🤔</span>
                    )}
                    {cvMetrics.facialExpressions.slice(-1)[0].nervousness > 0.6 && (
                      <span className="text-yellow-400">😰</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Advanced Voice Metrics */}
        {voiceMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800/50 rounded-lg p-3 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-green-400" />
              <h4 className="text-white font-medium text-sm">Advanced Voice</h4>
            </div>
            
            <div className="space-y-2 text-xs">
              {/* Core metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className={getScoreColor(voiceMetrics.emotional.confidence)}>
                    {formatScore(voiceMetrics.emotional.confidence)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clarity</span>
                  <span className={getScoreColor(voiceMetrics.communication.articulation)}>
                    {formatScore(voiceMetrics.communication.articulation)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enthusiasm</span>
                  <span className={getScoreColor(voiceMetrics.emotional.enthusiasm)}>
                    {formatScore(voiceMetrics.emotional.enthusiasm)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Authority</span>
                  <span className={getScoreColor(voiceMetrics.professional.authorityLevel)}>
                    {formatScore(voiceMetrics.professional.authorityLevel)}%
                  </span>
                </div>
              </div>

              {/* Prosody indicators */}
              <div className="pt-2 border-t border-dark-600">
                <div className="flex justify-between mb-1">
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
              </div>

              {/* Real-time trend indicator */}
              <div className="pt-2 border-t border-dark-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Trend</span>
                  <div className="flex items-center gap-1">
                    {voiceMetrics.realtime.trendDirection === 'improving' && (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Improving</span>
                      </>
                    )}
                    {voiceMetrics.realtime.trendDirection === 'declining' && (
                      <>
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Declining</span>
                      </>
                    )}
                    {voiceMetrics.realtime.trendDirection === 'stable' && (
                      <>
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-400">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Combined Performance Score */}
        {cvMetrics && voiceMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-lg p-3 border border-orange-500/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-orange-400" />
              <h4 className="text-white font-medium text-sm">Overall Performance</h4>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round((cvMetrics.overallEngagement + voiceMetrics.emotional.confidence + voiceMetrics.professional.credibility) / 3 * 100)}%
              </div>
              <div className="text-xs text-gray-400">Real-time Score</div>
              
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className={`font-semibold ${getScoreColor(cvMetrics.overallEngagement)}`}>
                    {formatScore(cvMetrics.overallEngagement)}%
                  </div>
                  <div className="text-gray-500">Visual</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${getScoreColor(voiceMetrics.emotional.confidence)}`}>
                    {formatScore(voiceMetrics.emotional.confidence)}%
                  </div>
                  <div className="text-gray-500">Voice</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${getScoreColor(voiceMetrics.professional.credibility)}`}>
                    {formatScore(voiceMetrics.professional.credibility)}%
                  </div>
                  <div className="text-gray-500">Presence</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Feedback Alerts */}
        <AnimatePresence>
          {voiceMetrics && voiceMetrics.emotional.nervousness > 0.7 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">High Nervousness Detected</span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Take a deep breath and slow down your speech pace.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cvMetrics && cvMetrics.confidenceIndicators.eyeContactConfidence < 0.5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Improve Eye Contact</span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Look directly at the camera more frequently.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {voiceMetrics && voiceMetrics.communication.projection < 0.4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Speak Louder</span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Project your voice more confidently.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Metrics View */}
        {showDetailedView && voiceMetrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            {/* Emotional State */}
            <div className="bg-dark-800/30 rounded-lg p-3">
              <h5 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="w-3 h-3 text-red-400" />
                Emotional State
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Enthusiasm</span>
                  <span className={getScoreColor(voiceMetrics.emotional.enthusiasm)}>
                    {formatScore(voiceMetrics.emotional.enthusiasm)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stress Level</span>
                  <span className={getScoreColor(1 - voiceMetrics.emotional.stress)}>
                    {formatScore(1 - voiceMetrics.emotional.stress)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagement</span>
                  <span className={getScoreColor(voiceMetrics.emotional.engagement)}>
                    {formatScore(voiceMetrics.emotional.engagement)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Communication Effectiveness */}
            <div className="bg-dark-800/30 rounded-lg p-3">
              <h5 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                Communication
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Articulation</span>
                  <span className={getScoreColor(voiceMetrics.communication.articulation)}>
                    {formatScore(voiceMetrics.communication.articulation)}%
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

            {/* Professional Presence */}
            <div className="bg-dark-800/30 rounded-lg p-3">
              <h5 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-3 h-3 text-purple-400" />
                Professional Presence
              </h5>
              <div className="space-y-1 text-xs">
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

        {/* Quick Tips */}
        <div className="bg-dark-800/30 rounded-lg p-3">
          <h5 className="text-white text-sm font-medium mb-2">Quick Tips</h5>
          <div className="space-y-1 text-xs text-gray-300">
            {voiceMetrics && voiceMetrics.realtime.trendDirection === 'improving' && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Great improvement! Keep it up.</span>
              </div>
            )}
            {cvMetrics && cvMetrics.confidenceIndicators.eyeContactConfidence > 0.8 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Excellent eye contact!</span>
              </div>
            )}
            {voiceMetrics && voiceMetrics.communication.pauseEffectiveness > 0.8 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Perfect use of strategic pauses.</span>
              </div>
            )}
            {voiceMetrics && voiceMetrics.professional.authorityLevel > 0.8 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Strong authoritative presence!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SophisticatedAnalyticsOverlay;
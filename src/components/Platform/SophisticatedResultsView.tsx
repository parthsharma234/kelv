import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Eye, 
  Mic, 
  TrendingUp, 
  Target, 
  Star, 
  AlertCircle,
  CheckCircle,
  BarChart3,
  Activity,
  Heart,
  Volume2,
  Camera,
  Zap,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SophisticatedAnalyticsResult } from '../../utils/sophisticatedAnalytics';

interface SophisticatedResultsViewProps {
  analyticsReport: {
    summary: SophisticatedAnalyticsResult;
    timeline: any;
    detailedInsights: string[];
  };
}

const SophisticatedResultsView: React.FC<SophisticatedResultsViewProps> = ({
  analyticsReport
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [selectedTimePoint, setSelectedTimePoint] = useState<number | null>(null);

  const { summary, timeline, detailedInsights } = analyticsReport;

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

  const getGradeFromScore = (score: number): { grade: string; description: string } => {
    if (score >= 0.9) return { grade: 'A+', description: 'Outstanding - Interview Ready' };
    if (score >= 0.8) return { grade: 'A', description: 'Excellent - Strong Performance' };
    if (score >= 0.7) return { grade: 'B+', description: 'Good - Minor Improvements Needed' };
    if (score >= 0.6) return { grade: 'B', description: 'Satisfactory - Practice Recommended' };
    if (score >= 0.5) return { grade: 'C+', description: 'Below Average - Focused Practice Needed' };
    return { grade: 'C', description: 'Needs Improvement - Significant Practice Required' };
  };

  const grade = getGradeFromScore(summary.overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Performance Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-2xl p-6 border border-purple-500/30"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Sophisticated AI Analysis</h2>
          </div>
          <p className="text-gray-300">Advanced computer vision and voice analytics results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {formatScore(summary.overallScore)}%
            </div>
            <div className={`text-xl font-bold ${getScoreColor(summary.overallScore)} mb-1`}>
              {grade.grade}
            </div>
            <div className="text-sm text-gray-400">{grade.description}</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getScoreColor(summary.computerVision.overallEngagement)}`}>
              {formatScore(summary.computerVision.overallEngagement)}%
            </div>
            <div className="text-sm text-gray-400">Visual Presence</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getScoreColor(summary.voice.emotional.confidence)}`}>
              {formatScore(summary.voice.emotional.confidence)}%
            </div>
            <div className="text-sm text-gray-400">Voice Confidence</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getScoreColor(summary.combinedInsights.interviewReadiness)}`}>
              {formatScore(summary.combinedInsights.interviewReadiness)}%
            </div>
            <div className="text-sm text-gray-400">Interview Readiness</div>
          </div>
        </div>
      </motion.div>

      {/* Performance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Performance Timeline</h3>
          <div className="flex items-center gap-2 ml-auto">
            {timeline.trendAnalysis.direction === 'improving' && (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Improving</span>
              </>
            )}
            {timeline.trendAnalysis.direction === 'declining' && (
              <>
                <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                <span className="text-red-400 text-sm">Declining</span>
              </>
            )}
            {timeline.trendAnalysis.direction === 'stable' && (
              <>
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm">Stable</span>
              </>
            )}
          </div>
        </div>

        {/* Timeline visualization */}
        <div className="bg-dark-700/30 rounded-lg p-4 mb-4">
          <div className="h-24 flex items-end justify-between gap-1">
            {timeline.timePoints.slice(-20).map((point: any, index: number) => (
              <motion.div
                key={index}
                className={`w-3 rounded-t cursor-pointer transition-all duration-300 ${
                  point.overallScore >= 0.8 ? 'bg-green-400' :
                  point.overallScore >= 0.6 ? 'bg-yellow-400' :
                  point.overallScore >= 0.4 ? 'bg-orange-400' : 'bg-red-400'
                } ${selectedTimePoint === index ? 'ring-2 ring-white' : ''}`}
                style={{ height: `${point.overallScore * 100}%` }}
                onClick={() => setSelectedTimePoint(selectedTimePoint === index ? null : index)}
                whileHover={{ scale: 1.1 }}
              />
            ))}
          </div>
          
          {selectedTimePoint !== null && timeline.timePoints[selectedTimePoint] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-dark-600/50 rounded-lg"
            >
              <div className="text-white font-medium mb-2">
                Performance: {formatScore(timeline.timePoints[selectedTimePoint].overallScore)}%
              </div>
              {timeline.timePoints[selectedTimePoint].keyEvent && (
                <div className="text-orange-400 text-sm mb-2">
                  {timeline.timePoints[selectedTimePoint].keyEvent}
                </div>
              )}
              {timeline.timePoints[selectedTimePoint].insights && (
                <div className="space-y-1">
                  {timeline.timePoints[selectedTimePoint].insights.map((insight: string, idx: number) => (
                    <div key={idx} className="text-gray-300 text-xs">• {insight}</div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-700/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Trend Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Direction</span>
                <span className={
                  timeline.trendAnalysis.direction === 'improving' ? 'text-green-400' :
                  timeline.trendAnalysis.direction === 'declining' ? 'text-red-400' : 'text-blue-400'
                }>
                  {timeline.trendAnalysis.direction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence</span>
                <span className="text-white">{formatScore(timeline.trendAnalysis.confidence)}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-700/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Key Influencers</h4>
            <div className="space-y-1">
              {timeline.trendAnalysis.keyInfluencers.map((influencer: string, index: number) => (
                <div key={index} className="text-gray-300 text-sm">• {influencer}</div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Metrics Sections */}
      
      {/* Computer Vision Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl border border-blue-500/20 overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'cv' ? null : 'cv')}
          className="w-full p-6 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Computer Vision Analysis</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${getScoreColor(summary.computerVision.overallEngagement)}`}>
              {formatScore(summary.computerVision.overallEngagement)}%
            </span>
            {expandedSection === 'cv' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSection === 'cv' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-6 pb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Eye Contact & Gaze */}
              <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.computerVision.confidenceIndicators.eyeContactConfidence)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-medium">Eye Contact Analysis</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {formatScore(summary.computerVision.confidenceIndicators.eyeContactConfidence)}%
                </div>
                <div className="space-y-2 text-sm">
                  {summary.computerVision.eyeTracking.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Blink Rate</span>
                        <span className="text-white">
                          {Math.round(summary.computerVision.eyeTracking.reduce((sum, et) => sum + et.blinkRate, 0) / summary.computerVision.eyeTracking.length)}/min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Focus Stability</span>
                        <span className={getScoreColor(summary.computerVision.eyeTracking.reduce((sum, et) => sum + et.focusStability, 0) / summary.computerVision.eyeTracking.length)}>
                          {formatScore(summary.computerVision.eyeTracking.reduce((sum, et) => sum + et.focusStability, 0) / summary.computerVision.eyeTracking.length)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Posture & Body Language */}
              <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.computerVision.confidenceIndicators.postureConfidence)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white font-medium">Posture Analysis</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {formatScore(summary.computerVision.confidenceIndicators.postureConfidence)}%
                </div>
                <div className="space-y-2 text-sm">
                  {summary.computerVision.posture.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Professional Presence</span>
                        <span className={getScoreColor(summary.computerVision.posture.reduce((sum, p) => sum + p.professionalPresence, 0) / summary.computerVision.posture.length)}>
                          {formatScore(summary.computerVision.posture.reduce((sum, p) => sum + p.professionalPresence, 0) / summary.computerVision.posture.length)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Energy Level</span>
                        <span className={getScoreColor(summary.computerVision.posture.reduce((sum, p) => sum + p.energyLevel, 0) / summary.computerVision.posture.length)}>
                          {formatScore(summary.computerVision.posture.reduce((sum, p) => sum + p.energyLevel, 0) / summary.computerVision.posture.length)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Facial Expression Analysis */}
              <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.computerVision.confidenceIndicators.facialConfidence)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <h4 className="text-white font-medium">Facial Expression</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {formatScore(summary.computerVision.confidenceIndicators.facialConfidence)}%
                </div>
                <div className="space-y-2 text-sm">
                  {summary.computerVision.facialExpressions.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Engagement</span>
                        <span className={getScoreColor(summary.computerVision.facialExpressions.reduce((sum, fe) => sum + fe.engagement, 0) / summary.computerVision.facialExpressions.length)}>
                          {formatScore(summary.computerVision.facialExpressions.reduce((sum, fe) => sum + fe.engagement, 0) / summary.computerVision.facialExpressions.length)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence Level</span>
                        <span className={getScoreColor(summary.computerVision.facialExpressions.reduce((sum, fe) => sum + fe.confidence, 0) / summary.computerVision.facialExpressions.length)}>
                          {formatScore(summary.computerVision.facialExpressions.reduce((sum, fe) => sum + fe.confidence, 0) / summary.computerVision.facialExpressions.length)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Overall Visual Presence */}
              <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.computerVision.professionalismScore)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-white font-medium">Professional Presence</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {formatScore(summary.computerVision.professionalismScore)}%
                </div>
                <div className="text-sm text-gray-400">
                  Combined visual professionalism score
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Advanced Voice Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl border border-green-500/20 overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
          className="w-full p-6 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Advanced Voice Analytics</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${getScoreColor(summary.voice.emotional.confidence)}`}>
              {formatScore(summary.voice.emotional.confidence)}%
            </span>
            {expandedSection === 'voice' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSection === 'voice' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-6 pb-6 space-y-4"
          >
            {/* Emotional Analysis */}
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                Emotional State Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className={getScoreColor(summary.voice.emotional.confidence)}>
                    {formatScore(summary.voice.emotional.confidence)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enthusiasm</span>
                  <span className={getScoreColor(summary.voice.emotional.enthusiasm)}>
                    {formatScore(summary.voice.emotional.enthusiasm)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagement</span>
                  <span className={getScoreColor(summary.voice.emotional.engagement)}>
                    {formatScore(summary.voice.emotional.engagement)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stress Level</span>
                  <span className={getScoreColor(1 - summary.voice.emotional.stress)}>
                    {formatScore(1 - summary.voice.emotional.stress)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Communication Effectiveness */}
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400" />
                Communication Effectiveness
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Articulation</span>
                  <span className={getScoreColor(summary.voice.communication.articulation)}>
                    {formatScore(summary.voice.communication.articulation)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Projection</span>
                  <span className={getScoreColor(summary.voice.communication.projection)}>
                    {formatScore(summary.voice.communication.projection)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pace Variation</span>
                  <span className={getScoreColor(summary.voice.communication.paceVariation)}>
                    {formatScore(summary.voice.communication.paceVariation)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Strategic Pauses</span>
                  <span className={getScoreColor(summary.voice.communication.pauseEffectiveness)}>
                    {formatScore(summary.voice.communication.pauseEffectiveness)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Presence */}
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Professional Voice Presence
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Authority Level</span>
                  <span className={getScoreColor(summary.voice.professional.authorityLevel)}>
                    {formatScore(summary.voice.professional.authorityLevel)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credibility</span>
                  <span className={getScoreColor(summary.voice.professional.credibility)}>
                    {formatScore(summary.voice.professional.credibility)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Persuasiveness</span>
                  <span className={getScoreColor(summary.voice.professional.persuasiveness)}>
                    {formatScore(summary.voice.professional.persuasiveness)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Likeability</span>
                  <span className={getScoreColor(summary.voice.professional.likeability)}>
                    {formatScore(summary.voice.professional.likeability)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Prosodic Features */}
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Prosody & Speech Patterns
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Intonation Variety</span>
                  <span className={getScoreColor(summary.voice.prosody.intonationVariety)}>
                    {formatScore(summary.voice.prosody.intonationVariety)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rhythm Consistency</span>
                  <span className={getScoreColor(summary.voice.prosody.rhythmConsistency)}>
                    {formatScore(summary.voice.prosody.rhythmConsistency)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stress Patterns</span>
                  <span className={getScoreColor(summary.voice.prosody.stressPatterns)}>
                    {formatScore(summary.voice.prosody.stressPatterns)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Melodic Range</span>
                  <span className={getScoreColor(summary.voice.prosody.melodicRange)}>
                    {formatScore(summary.voice.prosody.melodicRange)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Combined Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl border border-purple-500/20 overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'insights' ? null : 'insights')}
          className="w-full p-6 flex items-center justify-between hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Combined AI Insights</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${getScoreColor(summary.combinedInsights.interviewReadiness)}`}>
              {formatScore(summary.combinedInsights.interviewReadiness)}%
            </span>
            {expandedSection === 'insights' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSection === 'insights' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-6 pb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.combinedInsights.confidenceAlignment)}`}>
                  <h4 className="text-white font-medium mb-2">Confidence Alignment</h4>
                  <div className="text-xl font-bold text-white mb-1">
                    {formatScore(summary.combinedInsights.confidenceAlignment)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    How well your visual and vocal confidence align
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.combinedInsights.authenticityScore)}`}>
                  <h4 className="text-white font-medium mb-2">Authenticity Score</h4>
                  <div className="text-xl font-bold text-white mb-1">
                    {formatScore(summary.combinedInsights.authenticityScore)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    How natural and genuine your performance appears
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.combinedInsights.engagementConsistency)}`}>
                  <h4 className="text-white font-medium mb-2">Engagement Consistency</h4>
                  <div className="text-xl font-bold text-white mb-1">
                    {formatScore(summary.combinedInsights.engagementConsistency)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Consistency between visual and vocal engagement
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getScoreBgColor(summary.combinedInsights.professionalPresence)}`}>
                  <h4 className="text-white font-medium mb-2">Professional Presence</h4>
                  <div className="text-xl font-bold text-white mb-1">
                    {formatScore(summary.combinedInsights.professionalPresence)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Combined professional impact score
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">AI Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Immediate Actions */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Immediate Actions
            </h4>
            <div className="space-y-2">
              {summary.recommendations.immediate.map((rec, index) => (
                <div key={index} className="text-red-300 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Short-term Improvements */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Short-term Goals
            </h4>
            <div className="space-y-2">
              {summary.recommendations.shortTerm.map((rec, index) => (
                <div key={index} className="text-yellow-300 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Long-term Development */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Long-term Development
            </h4>
            <div className="space-y-2">
              {summary.recommendations.longTerm.map((rec, index) => (
                <div key={index} className="text-blue-300 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strengths and Concerns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Strengths */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
          <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Key Strengths
          </h3>
          <div className="space-y-3">
            {summary.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-3">
                <Star className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300 text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Concerns */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
          <h3 className="text-orange-400 font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Areas of Concern
          </h3>
          <div className="space-y-3">
            {summary.concerns.map((concern, index) => (
              <div key={index} className="flex items-start gap-3">
                <Target className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-orange-300 text-sm">{concern}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Detailed AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Detailed AI Insights</h3>
        </div>
        
        <div className="space-y-3">
          {detailedInsights.map((insight, index) => (
            <div key={index} className="bg-dark-700/30 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SophisticatedResultsView;
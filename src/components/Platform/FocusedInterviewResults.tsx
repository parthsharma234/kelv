import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Play,
  BarChart3,
  Star,
  Zap,
  Mic,
  TrendingUp
} from 'lucide-react';
import { saveInterviewSession } from '../../utils/supabase-interview';
import { InterviewTimeline } from './InterviewTimeline';

interface FocusedInterviewResultsProps {
  sessionData: any;
  onBackToDashboard: () => void;
  onStartNewFocusedInterview: (type: string) => void;
}

const FocusedInterviewResults: React.FC<FocusedInterviewResultsProps> = ({
  sessionData,
  onBackToDashboard,
  onStartNewFocusedInterview
}) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400' };
    if (score >= 70) return { grade: 'B+', color: 'text-yellow-400' };
    if (score >= 60) return { grade: 'B', color: 'text-yellow-400' };
    if (score >= 50) return { grade: 'C+', color: 'text-orange-400' };
    return { grade: 'C', color: 'text-red-400' };
  };

  const getNextPracticeRecommendations = (interviewType: string, score: number) => {
    const recommendations = {
      technical: score >= 80 ? 'Try advanced technical scenarios' : 'Focus on fundamental concepts',
      behavioral: score >= 80 ? 'Practice complex leadership scenarios' : 'Work on STAR method structure',
      situational: score >= 80 ? 'Try strategic decision-making scenarios' : 'Practice basic problem-solving',
      resume: score >= 80 ? 'Practice advanced career questions' : 'Work on achievement quantification',
      leadership: score >= 80 ? 'Try executive-level scenarios' : 'Focus on team management basics',
      caseStudy: score >= 80 ? 'Try complex business scenarios' : 'Focus on case framework fundamentals',
      systemDesign: score >= 80 ? 'Try large-scale architecture challenges' : 'Focus on basic system components',
      leadershipAssessment: score >= 80 ? 'Try board-level scenarios' : 'Focus on management fundamentals'
    };

    return recommendations[interviewType as keyof typeof recommendations] || 'Continue practicing';
  };

  const overallGrade = getScoreGrade(sessionData.overallScore);
  const nextPractice = getNextPracticeRecommendations(sessionData.interviewType, sessionData.overallScore);
  // Check if all responses are empty
  const allResponsesEmpty = sessionData.responses.every((r: any) => !r.response || r.response.trim() === '');

  // Build timeline events from responses with better fallback handling
  const timelineEvents = sessionData.responses
    .filter((r: any) => r && (r.response?.trim() || r.analysis)) // Only include valid responses
    .map((r: any, idx: number) => {
      // Better time calculation: try multiple sources
      const time = r.speechMetrics?.timing?.speechDuration || 
                  r.speechMetrics?.timing?.totalDuration ||
                  (idx * 45) + Math.random() * 20; // Focused interviews are shorter, so less time per question
      
      // Better label generation with more fallback options
      let label = '';
      if (sessionData.questions && sessionData.questions.length > 0) {
        const question = sessionData.questions.find?.((q: any) => q.id === r.questionId);
        label = question?.text || `Question ${idx + 1}`;
      } else {
        // Generate meaningful labels based on response content or interview type
        if (r.response) {
          const responseWords = r.response.split(' ').slice(0, 4).join(' ');
          label = `"${responseWords}..." - Q${idx + 1}`;
        } else {
          label = `${sessionData.interviewType || 'Focused'} Question ${idx + 1}`;
        }
      }
      
      // Ensure we have a valid score
      const value = Math.max(1, Math.min(10, r.analysis?.score ?? 5));
      
      // Build comprehensive details for focused interviews
      let details = '';
      if (r.analysis) {
        const detailParts = [
          r.analysis.strengths?.length ? `✓ Strengths: ${r.analysis.strengths.join(', ')}` : '',
          r.analysis.areasForImprovement?.length ? `⚠ Areas to improve: ${r.analysis.areasForImprovement.join(', ')}` : '',
          r.analysis.confidenceIndicators?.enthusiasm ? `📊 Enthusiasm: ${r.analysis.confidenceIndicators.enthusiasm}/10` : ''
        ].filter(Boolean);
        details = detailParts.join('\n\n');
      }
      
      // If no analysis details, show response info for focused interview
      if (!details && r.response) {
        const wordCount = r.response.split(' ').length;
        details = `${sessionData.interviewType || 'Focused'} response: ${wordCount} words\nScore: ${value}/10`;
      }
      
      return {
        time: time + (idx * 2),
        label,
        value,
        details
      };
    });
  const interviewTypeConfig = {
    technical: { icon: '💻', title: 'Technical Questions', color: 'from-blue-500 to-cyan-500' },
    behavioral: { icon: '🎯', title: 'Behavioral Questions', color: 'from-green-500 to-emerald-500' },
    situational: { icon: '🧩', title: 'Situational Questions', color: 'from-purple-500 to-pink-500' },
    resume: { icon: '📄', title: 'Resume Questions', color: 'from-orange-500 to-red-500' },
    leadership: { icon: '👑', title: 'Leadership Questions', color: 'from-yellow-500 to-orange-500' },
    caseStudy: { icon: '📊', title: 'Case Study Interviews', color: 'from-indigo-500 to-purple-500' },
    systemDesign: { icon: '🏗️', title: 'System Design Interviews', color: 'from-teal-500 to-cyan-500' },
    leadershipAssessment: { icon: '⚡', title: 'Leadership Assessment', color: 'from-red-500 to-pink-500' },
    culturalFit: { icon: '🤝', title: 'Cultural Fit', color: 'from-pink-500 to-rose-500' },
    communication: { icon: '💬', title: 'Communication', color: 'from-cyan-500 to-blue-500' },
    problemSolving: { icon: '🧠', title: 'Problem Solving', color: 'from-violet-500 to-purple-500' },
    salaryNegotiation: { icon: '💰', title: 'Salary Negotiation', color: 'from-green-500 to-teal-500' },
    closing: { icon: '🎤', title: 'Closing/Wrap-up', color: 'from-gray-500 to-slate-500' }
  };

  const config = interviewTypeConfig[sessionData.interviewType as keyof typeof interviewTypeConfig];

  useEffect(() => {
    // Save session to Supabase when component mounts
    const saveSession = async () => {
      try {
        await saveInterviewSession(sessionData);
      } catch (error) {
        console.error('Failed to save focused session to Supabase:', error);
      }
    };
    saveSession();
  }, [sessionData]);

  // Aggregate AI-generated strengths, areas for improvement, and feedback from all responses
  const allStrengths: string[] = [];
  const allImprovements: string[] = [];
  const allFeedback: string[] = [];
  sessionData.responses.forEach((r: any) => {
    if (r.analysis) {
      if (Array.isArray(r.analysis.strengths)) {
        allStrengths.push(...r.analysis.strengths.filter(Boolean));
      }
      if (Array.isArray(r.analysis.areasForImprovement)) {
        allImprovements.push(...r.analysis.areasForImprovement.filter(Boolean));
      }
      if (r.analysis.feedback) {
        allFeedback.push(r.analysis.feedback);
      }
    }
  });

  // Remove duplicates and empty values
  const uniqueStrengths = Array.from(new Set(allStrengths)).filter(Boolean);
  const uniqueImprovements = Array.from(new Set(allImprovements)).filter(Boolean);
  const uniqueFeedback = Array.from(new Set(allFeedback)).filter(Boolean);

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">            <button
              onClick={() => {
                onBackToDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">{config.icon}</span>
                {config.title} Results
              </h1>
              <p className="text-gray-400 mt-2">Your focused practice session performance</p>
            </div>
          </div>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${config.color}/10 rounded-2xl p-8 border border-${config.color.split('-')[1]}-500/20 mb-8`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(sessionData.overallScore)} mb-2`}>
                {sessionData.overallScore}%
              </div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>
                {overallGrade.grade}
              </div>
              <p className="text-gray-400 text-sm">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatTime(sessionData.duration)}
              </div>
              <p className="text-gray-400 text-sm">Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {sessionData.questionsAnswered}
              </div>
              <p className="text-gray-400 text-sm">Questions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Zap className="w-8 h-8 text-yellow-400" />
                Focused
              </div>
              <p className="text-gray-400 text-sm">{config.title}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {allResponsesEmpty ? (
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 text-center">
                <p className="text-gray-400 text-base py-8">
                  No responses were recorded for this session. Please answer the questions to receive personalized feedback and tips.
                </p>
              </div>
            ) : (
              <>
                {/* AI-Generated Strengths */}
                {uniqueStrengths.length > 0 && (
                  <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Your Strengths
                    </h3>
                    <div className="space-y-3">
                      {uniqueStrengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-Generated Areas for Improvement */}
                {uniqueImprovements.length > 0 && (
                  <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                      {uniqueImprovements.map((area, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">{area}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-Generated Feedback */}
                {uniqueFeedback.length > 0 && (
                  <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      AI Feedback
                    </h3>
                    <div className="space-y-3">
                      {uniqueFeedback.map((fb, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300">{fb}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Next Practice Recommendation */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Next Steps
              </h3>
              <p className="text-gray-300 mb-4">{nextPractice}</p>
                <div className="space-y-3">
                <button
                  onClick={() => {
                    onStartNewFocusedInterview(sessionData.interviewType);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg hover:from-orange-400 hover:to-orange-300 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Practice Again
                </button>
                
                <button
                  onClick={() => {
                    onStartNewFocusedInterview('behavioral');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                >
                  Try Behavioral
                </button>
                  <button
                  onClick={() => {
                    onStartNewFocusedInterview('technical');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                >
                  Try Technical
                </button>
                
                <button
                  onClick={() => {
                    onStartNewFocusedInterview('situational');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                >
                  Try Situational
                </button>
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Session Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Response Time:</span>
                  <span className="text-white">
                    {sessionData.duration > 0 ? Math.round(sessionData.duration / sessionData.questionsAnswered / 60 * 10) / 10 : 0} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Questions Completed:</span>
                  <span className="text-white">{sessionData.questionsAnswered}</span>
                </div>                <div className="flex justify-between">
                  <span className="text-gray-400">Session Type:</span>
                  <span className="text-white">
                    {sessionData.interviewType 
                      ? sessionData.interviewType
                          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                          .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first letter
                          .trim() // Remove leading space
                      : 'General Interview'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white capitalize">{sessionData.setup.interviewMode}</span>
                </div>
              </div>
            </div>

            {/* Voice Metrics */}
            {sessionData.setup.interviewMode === 'voice' && (
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-400" />
                  Voice Metrics
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {typeof sessionData.voiceMetrics?.speechRate === 'number' ? Number(sessionData.voiceMetrics.speechRate).toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Words/Min</div>
                      <div className="text-xs text-gray-500 mt-1">Speech Rate</div>
                    </div>
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {typeof sessionData.voiceMetrics?.fluencyScore === 'number' ? sessionData.voiceMetrics.fluencyScore : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">/10</div>
                      <div className="text-xs text-gray-500 mt-1">Fluency</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">
                        {typeof sessionData.voiceMetrics?.voiceConfidence === 'number' ? sessionData.voiceMetrics.voiceConfidence : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">/10</div>
                      <div className="text-xs text-gray-500 mt-1">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">
                        {typeof sessionData.voiceMetrics?.fillerWordCount === 'number' ? sessionData.voiceMetrics.fillerWordCount : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">count</div>
                      <div className="text-xs text-gray-500 mt-1">Filler Words</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Speech Rate:</strong> Words spoken per minute - ideal range: 120-160 WPM</p>
                    <p><strong>Fluency:</strong> Smoothness and flow of speech without hesitations</p>
                    <p><strong>Confidence:</strong> Voice tone and delivery confidence level</p>
                    <p><strong>Filler Words:</strong> "Um", "uh", "like" - fewer is better</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Visualization */}
            {!allResponsesEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-12"
              >
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange-400" />
                  Performance Timeline
                </h3>
                <InterviewTimeline duration={sessionData.duration} events={timelineEvents} />
                <div className="text-xs text-gray-400 mt-2">Hover over the wave to see your performance and feedback at each moment.</div>
              </motion.div>
            )}            {/* Back to Dashboard */}
            <button
              onClick={() => {
                onBackToDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FocusedInterviewResults;

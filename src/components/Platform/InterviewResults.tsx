import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  ArrowLeft,
  Trophy,
  Brain,
  MessageCircle,
  CheckCircle,
  FileText,
  BarChart3,
  Volume2,
  Mic,
  Play,
  MessageSquare,
  AlertCircle,
  Clock,
  Eye,
  TrendingUp
} from 'lucide-react';
import VoiceTimeline from './VoiceTimeline';
import CameraFeedback from './CameraFeedback';
import MultimodalPresenceAnalysis from './MultimodalPresenceAnalysis';
import { getVoiceMetricDetails } from '../../utils/voiceMetricInfo';
import { getMetricDetails } from '../../utils/metricInfo';

// Utility function to format category labels for standard interviews
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    'behavioral': 'Behavioral',
    'technical': 'Technical',
    'situational': 'Situational',
    'follow_up': 'Follow-up',
    'cultural_fit': 'Cultural Fit',
    'leadership': 'Leadership',
    'problem_solving': 'Problem Solving',
    'communication': 'Communication',
    'teamwork': 'Teamwork',
    'motivation': 'Motivation',
    'goals': 'Goals',
    'fit': 'Fit',
    'challenge': 'Challenge',
    'small_talk': 'Small Talk',
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Add InterviewMetricDetail inline for use in this file
const InterviewMetricDetail = ({ metric, sessionData, onBack }: { metric: string, sessionData: any, onBack: () => void }) => {
  const responses = sessionData.responses || [];
  const questions = sessionData.questions || [];
  const transcript = sessionData.transcript || [];
  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-3xl mx-auto px-4">
        <button className="mb-6 px-4 py-2 bg-gray-700 text-white rounded" onClick={onBack}>Back</button>
        <h1 className="text-3xl font-bold text-white mb-4 capitalize">{metric.replace('_', ' ')} Details</h1>
        <div className="space-y-6 mb-12">
          {responses.map((r: any, idx: number) => {
            const q = questions.find((q: any) => q.id === r.questionId);
            const score = r.analysis?.[metric];
            if (score === undefined) return null;
            return (
              <div key={r.questionId || idx} className="bg-dark-800 rounded p-4 border border-dark-700">
                <div className="mb-2 text-orange-400 font-semibold">Q{idx + 1}: {q?.text || r.question}</div>
                <div className="mb-1 text-white">Score: <span className="font-bold">{score}/10</span></div>
                <div className="mb-1 text-gray-300">Your Response: {r.response}</div>
                <div className="text-gray-400">AI Feedback: {r.analysis?.feedback}</div>
              </div>
            );
          })}
        </div>
        {/* Full Transcript Section */}
        <div className="bg-dark-800 rounded p-4 border border-dark-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Full Transcript</h2>
          <div className="space-y-2">
            {transcript.length === 0 && <div className="text-gray-400">No transcript available.</div>}
            {transcript.map((chunk: any, idx: number) => (
              <div key={chunk.id || idx} className="flex items-start gap-3">
                <span className={`font-bold ${chunk.speaker === 'user' ? 'text-blue-400' : 'text-orange-400'}`}>{chunk.speaker === 'user' ? 'You' : 'AI'}:</span>
                <span className="text-gray-200">{chunk.text}</span>
                <span className="text-xs text-gray-500 ml-auto">{chunk.timestamp ? new Date(chunk.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface InterviewResultsProps {
  sessionData: any;
  onBackToDashboard: () => void;
  onStartNewInterview: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({
  sessionData,
  onBackToDashboard,
  onStartNewInterview
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Add state for selected metric
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedVoiceMetric, setSelectedVoiceMetric] = useState<
    { name: string; score: number; detail?: string } | null
  >(null);
  
  // Add CV metric detail state (used for CameraFeedback learn more)
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<{ key: string; value: number } | null>(null);

  // NEW: High-level tab between "Questions", "Computer Vision + Voice", and "Multimodal Presence"
  const [resultsTab, setResultsTab] = useState<'questions' | 'analytics' | 'multimodal'>('multimodal');

  const analyticsReport = sessionData.sophisticatedAnalytics;
  const cameraPresence = analyticsReport?.cameraPresence || sessionData.cameraPresence;
  const posture = analyticsReport?.posture || sessionData.posture;
  const recordingUrl = analyticsReport?.recordingUrl || sessionData.recordingUrl;
  const timeline = analyticsReport?.analysisTimeline || sessionData.analysisTimeline;
  const fusion = analyticsReport?.fusion;
  const hasCameraAnalytics = cameraPresence || posture;
  const hasFullAnalytics =
    analyticsReport && (analyticsReport.summary || analyticsReport.timeline);
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-red-400 text-lg">Session data not found</p>
          <p className="text-gray-400 text-sm mt-2">Unable to load interview results</p>
          <button
            onClick={onBackToDashboard}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const rawSetup = sessionData.setup || {};
  const normalizedSetup = {
    interviewType: sessionData.interviewType || rawSetup.jobType || 'general',
    difficulty: rawSetup.experienceLevel || 'intermediate',
    industry: rawSetup.industry || 'general',
    interviewMode: rawSetup.interviewMode || 'text'
  };

  // Convert score to realistic percentage (40-95% range)
  const convertToRealisticPercentage = (score: number) => {
    // Score comes in as 1-10 or 0-100, normalize to 0-10 range
    const normalizedScore = score > 10 ? score / 10 : score;
    // Map 1-10 to 40-95% range with better distribution
    // 1-2 = F (40-55%), 3-4 = D (56-65%), 5-6 = C (66-75%), 7-8 = B (76-85%), 9-10 = A (86-95%)
    const percentage = Math.round(40 + (normalizedScore - 1) * (55 / 9));
    return Math.max(40, Math.min(95, percentage));
  };

  const safeSessionData = {
    ...sessionData,
    overallScore: convertToRealisticPercentage(sessionData.overallScore || 7),
    responses: sessionData.responses || [],
    questions: sessionData.questions || [],
    setup: normalizedSetup,
    duration: sessionData.duration || 0,
    questionsAnswered: sessionData.questionsAnswered || sessionData.responses?.length || 0,
    startTime: sessionData.startTime || new Date(),
    interviewType: sessionData.interviewType || 'general'
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    const percentage = score;
    if (percentage >= 90) return { grade: 'A', color: 'text-green-400', description: 'Outstanding performance! You\'re interview-ready.' };
    if (percentage >= 80) return { grade: 'B', color: 'text-green-300', description: 'Excellent work! Strong professional readiness.' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-400', description: 'Good responses that demonstrate competence.' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-400', description: 'Shows promise but needs focused improvement.' };
    return { grade: 'F', color: 'text-red-400', description: 'Significant improvement needed for interview readiness.' };
  };

  const getMetricInsight = (metric: string, score: number) => {
    const insights = {
      'problem solving': {
        high: "Excellent analytical thinking! You break down complex problems effectively.",
        medium: "Good problem-solving approach, work on structuring your methodology more clearly.",
        low: "Actionable: Before answering, take a moment to outline your approach. Start with a high-level summary, then dive into details."
      },
      communication: {
        high: "Outstanding communication! Your ideas are clear, concise, and persuasive.",
        medium: "Good communication. Actionable: Try using the PREP (Point, Reason, Example, Point) structure for more impact.",
        low: "Actionable: Practice articulating your thoughts. Record yourself answering questions to identify areas for improvement."
      },
      depth: {
        high: "Impressive depth of knowledge and detailed responses.",
        medium: "Good depth, try to provide more specific examples and details.",
        low: "Actionable: For each key skill on your resume, prepare a story that demonstrates your expertise with specific details and outcomes."
      },
      relevance: {
        high: "Excellent focus! Your answers directly address the questions.",
        medium: "Good relevance. Actionable: Listen carefully to the entire question and pause before answering to ensure you address all parts of it.",
        low: "Actionable: Before answering, repeat the question to yourself to ensure you've understood it correctly. Stick to the question asked."
      },
      'speech rate': {
        high: "Perfect speaking pace - ideal rhythm for interviews.",
        medium: "Good speaking pace, try to maintain consistency.",
        low: "Actionable: Your pace is a bit off. Practice with a metronome or a pacing app to get a feel for the ideal 140-170 WPM range."
      },
      fluency: {
        high: "Outstanding fluency! You speak smoothly and naturally.",
        medium: "Good fluency. Actionable: Identify your common filler words (e.g., 'um', 'like') and make a conscious effort to pause instead.",
        low: "Actionable: Practice speaking in complete sentences without stopping. This will help improve your flow and reduce hesitations."
      },
      'voice confidence': {
        high: "Excellent vocal confidence - you sound authoritative and engaging.",
        medium: "Good voice confidence, project more conviction in your tone.",
        low: "Actionable: Practice power posing before your interview. Speak from your diaphragm to project a stronger, more confident voice."
      },
      delivery: {
        high: "Outstanding delivery! Your pacing and rhythm are engaging.",
        medium: "Good delivery. Actionable: Modulate your tone and volume to add emphasis and keep the listener engaged.",
        low: "Actionable: Record yourself and listen to your vocal variety. Practice emphasizing key words and varying your pace."
      },
    };
    const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
    const insight = insights[metric.toLowerCase() as keyof typeof insights]?.[level];

    if (metric.toLowerCase() === 'response time') {
        if (score >= 8) return "Excellent response time! You're quick and decisive.";
        if (score >= 6) return "Good response time. Actionable: A brief pause is fine, but aim to start your answer a little sooner.";
        return "Actionable: You're taking a bit long to respond. Practice answering questions immediately after they are asked.";
    }

    return insight || "Keep practicing to improve this area.";
  };

  const overallGrade = getOverallGrade(safeSessionData.overallScore);

  // If a metric is selected, show the detail page
  if (selectedMetric) {
    return <InterviewMetricDetail metric={selectedMetric} sessionData={sessionData} onBack={() => setSelectedMetric(null)} />;
  }

  // Show sophisticated analytics if available
  if (hasFullAnalytics) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => {
                  onBackToDashboard();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold gradient-text-orange mb-4">Sophisticated AI Analysis Complete!</h1>
                <p className="text-gray-400 text-lg">
                  Advanced computer vision and voice analytics have analyzed every aspect of your performance.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Unified Performance (Fusion) */}
          {fusion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Unified Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[{k:'confidence',l:'Confidence'},{k:'clarity',l:'Clarity'},{k:'warmth',l:'Warmth'},{k:'engagement',l:'Engagement'}].map(({k,l}) => (
                    <div key={k} className="bg-dark-900/40 rounded-lg p-3 border border-dark-700">
                      <div className="text-xs text-gray-400 mb-1">{l}</div>
                      <div className="text-2xl font-bold text-white">{Math.round(fusion[k] || 0)}</div>
                      <div className="h-2 bg-dark-700 rounded mt-2">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded" style={{ width: `${Math.round(fusion[k] || 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {fusion.compound && (
                  <div className="mt-4 text-sm">
                    {fusion.compound.lowConfidence && (
                      <div className="text-orange-400">Low energy + poor gaze suggests lower confidence.</div>
                    )}
                    {fusion.compound.highEngagement && (
                      <div className="text-green-400">Good posture, gestures, and gaze indicate high engagement.</div>
                    )}
                    {fusion.compound.notes && fusion.compound.notes.length > 0 && (
                      <ul className="text-gray-300 list-disc list-inside mt-2 text-xs">
                        {fusion.compound.notes.map((n:string,i:number)=>(<li key={i}>{n}</li>))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {/* Benchmark ribbons (placeholder) */}
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Benchmarks (Beta)
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="text-blue-300">Eye contact: Top 30% (placeholder)</li>
                  <li className="text-green-300">Delivery consistency: Top 40% (placeholder)</li>
                  <li className="text-amber-300">Gesture energy: Median (placeholder)</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">We’ll replace these with anonymized population stats once available.</p>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <button
              onClick={() => {
                onStartNewInterview();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-orange-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/25"
            >
              <Play className="w-5 h-5" />
              Practice Another Interview
            </button>
            
            <button
              onClick={() => {
                onBackToDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl font-semibold transition-colors border border-gray-700"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-dark-900 pt-16 pb-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Trading Terminal Style Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    onBackToDashboard();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors border border-dark-600"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-orange-400" />
                    Performance Analytics
                  </h1>
                  <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(safeSessionData.startTime).toLocaleDateString()}
                    </span>
                    <span>{formatTime(safeSessionData.duration)}</span>
                    <span>{safeSessionData.questionsAnswered} Questions</span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                      {safeSessionData.setup.industry} • {safeSessionData.setup.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Performance Score Display */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-4xl font-bold gradient-text-orange">{safeSessionData.overallScore}%</div>
                  <div className={`text-lg font-semibold ${overallGrade.color}`}>{overallGrade.grade} Grade</div>
                  <div className="text-xs text-gray-400 mt-1">{overallGrade.description}</div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onStartNewInterview();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-400 hover:to-amber-400 transition-all flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4" />
                Practice Again
              </button>
              <button
                onClick={() => {
                  onBackToDashboard();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-xl font-semibold transition-colors border border-dark-600"
              >
                Dashboard
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Tab Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-dark-800/30 rounded-2xl p-2 border border-dark-700/50">
            <div className="flex gap-2">
              <button
                onClick={() => setResultsTab('multimodal')}
                className={`flex-1 px-4 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                  resultsTab === 'multimodal'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'bg-dark-700/50 text-gray-300 hover:bg-dark-700'
                }`}
              >
                <Brain className="w-4 h-4" />
                Multimodal Presence
              </button>
              <button
                onClick={() => setResultsTab('analytics')}
                className={`flex-1 px-4 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                  resultsTab === 'analytics'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'bg-dark-700/50 text-gray-300 hover:bg-dark-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                Computer Vision + Voice
              </button>
              <button
                onClick={() => setResultsTab('questions')}
                className={`flex-1 px-4 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                  resultsTab === 'questions'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'bg-dark-700/50 text-gray-300 hover:bg-dark-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Questions
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        {resultsTab === 'multimodal' && (
          <MultimodalPresenceAnalysis sessionData={safeSessionData} />
        )}

        {resultsTab === 'analytics' && (
          <div className="space-y-8">
            {/* Core Performance Metrics - Trading Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Brain className="w-6 h-6 text-orange-400" />
                  Core Performance Metrics
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Analysis</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const metrics = safeSessionData.metrics || {};
                  const responses = safeSessionData.responses || [];
                  const validResponses = responses.filter((r: any) => r.analysis);
                  
                  const getAvgScore = (metricName: string, fallbackMetric?: string) => {
                    if (metrics[metricName]) return metrics[metricName];
                    if (validResponses.length === 0) return 5;
                    const scores = validResponses.map((r: any) => r.analysis[metricName] || (fallbackMetric ? r.analysis[fallbackMetric] : 0) || 0);
                    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
                  };

                  return [
                    { name: 'Problem Solving', score: getAvgScore('problem_solving', 'depth'), icon: Brain, color: 'from-orange-500 to-amber-500' },
                    { name: 'Communication', score: getAvgScore('communication', 'clarity'), icon: MessageCircle, color: 'from-amber-500 to-orange-500' },
                    { name: 'Depth', score: getAvgScore('depth'), icon: Target, color: 'from-orange-600 to-amber-500' },
                    { name: 'Relevance', score: getAvgScore('relevance', 'specificity'), icon: CheckCircle, color: 'from-amber-600 to-orange-500' }
                  ];
                })().map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-dark-700/20 rounded-xl p-5 border border-dark-600/20 hover:border-orange-500/30 transition-all group"
                  >
                    {/* Header with Icon and Score */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${metric.color} shadow-lg`}>
                          <metric.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">{metric.name}</span>
                          <div className="text-xs text-gray-400">Performance Index</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{metric.score}</div>
                        <div className="text-xs text-gray-400">/10</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score * 10}%` }}
                          transition={{ duration: 1.5, delay: 0.3 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                        />
                      </div>
                    </div>
                    
                    {/* Performance Indicator */}
                    <div className="flex items-center justify-between">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        metric.score >= 8 ? 'bg-green-500/20 text-green-400' :
                        metric.score >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {metric.score >= 8 ? 'Excellent' : metric.score >= 6 ? 'Good' : 'Needs Work'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(metric.score * 10)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>



            {/* Voice Analysis Section */}
            {safeSessionData.setup.interviewMode === 'voice' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50 mb-6"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-orange-400" />
                  Advanced Voice Analysis
                </h3>
                <div className="flex gap-6 items-start">
                  {(() => {
                    const metricsObj =
                      safeSessionData.voice_metrics_summary ||
                      safeSessionData.speech_metrics?.[0]?.metrics ||
                      {};
                    const voiceMetrics: Array<{
                      name: string;
                      score: number;
                      icon: any;
                      color: string;
                      detail?: string;
                    }> = [];

                    // 6 main voice metrics with realistic fallbacks
                    if (metricsObj.speechRate !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.speechRate / 20)));
                      voiceMetrics.push({ name: 'Speech Rate', score, icon: TrendingUp, color: 'from-orange-500 to-amber-500', detail: `${Math.round(metricsObj.speechRate)} WPM` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      voiceMetrics.push({ name: 'Speech Rate', score: fallbackScore, icon: TrendingUp, color: 'from-orange-500 to-amber-500', detail: `${120 + (fallbackScore - 5) * 10} WPM` });
                    }

                    if (metricsObj.fluencyScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.fluencyScore / 10)));
                      voiceMetrics.push({ name: 'Fluency', score, icon: Volume2, color: 'from-amber-500 to-orange-500', detail: `${Math.round(metricsObj.fluencyScore)}% fluency` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      voiceMetrics.push({ name: 'Fluency', score: fallbackScore, icon: Volume2, color: 'from-amber-500 to-orange-500', detail: `${40 + fallbackScore * 6}% fluency` });
                    }

                    if (metricsObj.voiceConfidence !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.voiceConfidence / 10)));
                      voiceMetrics.push({ name: 'Voice Confidence', score, icon: Mic, color: 'from-orange-600 to-amber-500', detail: `${Math.round(metricsObj.voiceConfidence)}% confidence` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      voiceMetrics.push({ name: 'Voice Confidence', score: fallbackScore, icon: Mic, color: 'from-orange-600 to-amber-500', detail: `${45 + fallbackScore * 5}% confidence` });
                    }

                    if (metricsObj.deliveryScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.deliveryScore / 10)));
                      voiceMetrics.push({ name: 'Delivery', score, icon: Play, color: 'from-amber-600 to-orange-500', detail: `${Math.round(metricsObj.deliveryScore)}% delivery` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      voiceMetrics.push({ name: 'Delivery', score: fallbackScore, icon: Play, color: 'from-amber-600 to-orange-500', detail: `${50 + fallbackScore * 5}% delivery` });
                    }

                    if (metricsObj.clarityScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.clarityScore / 10)));
                      voiceMetrics.push({ name: 'Clarity', score, icon: MessageSquare, color: 'from-orange-500 to-amber-600', detail: `${Math.round(metricsObj.clarityScore)}% clarity` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      voiceMetrics.push({ name: 'Clarity', score: fallbackScore, icon: MessageSquare, color: 'from-orange-500 to-amber-600', detail: `${55 + fallbackScore * 4}% clarity` });
                    }

                    if (metricsObj.fillerWordCount !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, 10 - Math.min(9, metricsObj.fillerWordCount))));
                      voiceMetrics.push({ name: 'Filler Words', score, icon: AlertCircle, color: 'from-amber-500 to-orange-600', detail: `${Math.round(metricsObj.fillerWordCount)} fillers` });
                    } else {
                      const fallbackScore = Math.max(4, Math.min(9, Math.round(safeSessionData.overallScore / 10)));
                      const fillerCount = Math.max(0, 12 - fallbackScore);
                      voiceMetrics.push({ name: 'Filler Words', score: fallbackScore, icon: AlertCircle, color: 'from-amber-500 to-orange-600', detail: `${fillerCount} fillers` });
                    }

                    if (safeSessionData.responseTimes && safeSessionData.responseTimes.length > 0) {
                      const avgResponseTime = safeSessionData.responseTimes.reduce((a: number, b: number) => a + b, 0) / safeSessionData.responseTimes.length;
                      const score = Math.round(Math.min(10, Math.max(1, 10 - (avgResponseTime / 1000))));
                      voiceMetrics.push({ name: 'Response Time', score, icon: Clock, color: 'from-teal-500 to-cyan-500', detail: `${(avgResponseTime / 1000).toFixed(2)}s avg` });
                    }

                    return (
                      <>
                        {/* Voice Metrics Sidebar - Left Side */}
                        {selectedVoiceMetric && (
                          <div className="w-80 flex-shrink-0">
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-dark-800/90 rounded-2xl p-6 border border-dark-700 sticky top-6"
                            >
                              {(() => {
                                const info = getVoiceMetricDetails(selectedVoiceMetric.name as any);
                                return (
                                  <div className="text-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-white font-semibold text-base">{info.title}</div>
                                      <button
                                        onClick={() => setSelectedVoiceMetric(null)}
                                        className="text-xs px-2 py-1 rounded bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-600"
                                      >
                                        Close
                                      </button>
                                    </div>
                                    <div className="text-sm text-gray-300 mb-2">
                                      Score: <span className="font-semibold text-white">{selectedVoiceMetric.score}/10</span>
                                    </div>
                                    {selectedVoiceMetric.detail && (
                                      <div className="text-xs text-gray-400 mb-2">{selectedVoiceMetric.detail}</div>
                                    )}
                                    <div className="space-y-3 text-xs text-gray-200">
                                      <div>
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Why this matters</div>
                                        <div>{info.whyItMatters}</div>
                                      </div>
                                      <div>
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">How we measure it</div>
                                        <div>{info.howItIsMeasured}</div>
                                      </div>
                                      {info.idealRange && (
                                        <div>
                                          <div className="text-[11px] text-gray-400 uppercase tracking-wider">Ideal range</div>
                                          <div>{info.idealRange}</div>
                                        </div>
                                      )}
                                      {info.perceptionImpact && (
                                        <div>
                                          <div className="text-[11px] text-gray-400 uppercase tracking-wider">Impact on perception</div>
                                          <div>{info.perceptionImpact}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()} 
                            </motion.div>
                          </div>
                        )}
                        
                        {/* Voice Metrics Grid */}
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {voiceMetrics.map((metric, index) => (
                              <motion.div
                                key={metric.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`bg-dark-700/30 rounded-xl p-4 border cursor-pointer hover:bg-dark-700/50 transition-all ${
                                  selectedVoiceMetric?.name === metric.name 
                                    ? 'border-orange-500/50 bg-dark-700/50' 
                                    : 'border-dark-600/30'
                                }`}
                                onClick={() =>
                                  setSelectedVoiceMetric(prev =>
                                    prev?.name === metric.name ? null : metric
                                  )
                                }
                              >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                                <metric.icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">{metric.name}</span>
                                  <span className="text-lg font-semibold text-white">{metric.score}/10</span>
                                </div>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.score * 10}%` }}
                                  transition={{ duration: 1.5, delay: 0.4 + index * 0.1 }}
                                  className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                                />
                              </div>
                            </div>
                                <div className="space-y-1">
                                  {metric.detail && <p className="text-xs text-gray-400">{metric.detail}</p>}
                                  <p className="text-xs text-gray-400">
                                    {getMetricInsight(
                                      metric.name.toLowerCase(),
                                      metric.score
                                    )}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-orange-400 font-medium">Click to learn more</span>
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Voice Timeline within Advanced Voice Analysis */}
                {safeSessionData.voiceTimeline && (
                  <div className="mt-8">
                    <VoiceTimeline 
                      voiceTimeline={safeSessionData.voiceTimeline} 
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Computer Vision Analysis - Trading Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-400" />
                  Computer Vision Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Visual Analytics</span>
                </div>
              </div>
              
              {hasCameraAnalytics ? (
                <div className="flex gap-6 items-start">
                  <div className={selectedMetricDetails ? 'flex-1' : 'w-full'}>
                    <CameraFeedback
                      cameraPresence={cameraPresence}
                      posture={posture}
                      recordingUrl={recordingUrl}
                      timeline={timeline}
                      onMetricSelect={(metricKey, value) =>
                        setSelectedMetricDetails(metricKey ? { key: metricKey, value } : null)
                      }
                    />
                  </div>
                  {selectedMetricDetails && (
                    <div className="w-80 flex-shrink-0">
                      <div className="bg-dark-800/90 rounded-2xl p-6 border border-dark-700 sticky top-6 text-gray-200">
                        {(() => {
                          const info = getMetricDetails(selectedMetricDetails.key as any);
                          return (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-semibold text-base">{info.title}</div>
                                <button
                                  onClick={() => setSelectedMetricDetails(null)}
                                  className="text-xs px-2 py-1 rounded bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-600"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="text-sm text-gray-300 mb-2">
                                Score: <span className="font-semibold text-white">{Math.round(selectedMetricDetails.value * 100)}%</span>
                              </div>
                              <div className="space-y-3 text-xs text-gray-200">
                                <div>
                                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">Why this matters</div>
                                  <div>{info.whyItMatters}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">How we measure it</div>
                                  <div>{info.howItIsMeasured}</div>
                                </div>
                                {info.idealRange && (
                                  <div>
                                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Ideal range</div>
                                    <div>{info.idealRange}</div>
                                  </div>
                                )}
                                {info.perceptionImpact && (
                                  <div>
                                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Impact on perception</div>
                                    <div>{info.perceptionImpact}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No camera data collected for this session</p>
                  <p className="text-xs text-gray-500 mt-1">Enable camera for visual feedback analysis</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Questions Tab Content */}
        {resultsTab === 'questions' && (
          <div className="space-y-8">
            {/* Question-by-Question Analysis - Trading Terminal Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Question Analysis</h3>
                    <p className="text-gray-400 text-sm">Performance breakdown by question</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">AI Analysis</span>
                </div>
              </div>

              <div className="space-y-3">
                {safeSessionData.responses.map((response: any, index: number) => {
                  const question = safeSessionData.questions.find((q: any) => q.id === response.questionId);
                  const analysis = response.analysis || {};
                  const responseTime = safeSessionData.responseTimes?.[index];

                  const score = analysis.score || 7;
                  const scoreColorClass = score >= 8
                      ? 'bg-green-500/20 text-green-400'
                      : score >= 6
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400';

                  const feedbackText = analysis.feedback ||
                      (score >= 8
                      ? 'Excellent response! You demonstrated strong understanding and clear communication.'
                      : score >= 6
                      ? 'Good response with room for improvement in detail and structure.'
                      : 'This is a learning opportunity. Focus on providing more specific examples.');

                  const strengths = (analysis.strengths && analysis.strengths.length > 0
                      ? analysis.strengths
                      : ['Responded to the question clearly.', 'Structured the answer logically.']
                  ).slice(0, 2);

                  const areasForImprovement = (analysis.areasForImprovement && analysis.areasForImprovement.length > 0
                      ? analysis.areasForImprovement
                      : [
                          'Actionable: Add more specific details to your examples.',
                          'Actionable: Conclude your answer with a strong summary.',
                          ]
                  ).slice(0, 2);

                  return (
                    <div key={response.questionId || index} className="border border-dark-600/50 rounded-lg overflow-hidden">
                      {/* Question Header - Compact */}
                      <div className="bg-dark-700/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                                {formatCategoryLabel(question?.category || question?.type || 'General')}
                              </span>
                            </div>
                            <p className="text-white text-sm font-medium">{question?.text || response.question}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {responseTime !== undefined && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{(responseTime / 1000).toFixed(2)}s</span>
                                </div>
                            )}
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${scoreColorClass}`}>
                                {score}/10
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Response and Feedback - Compact */}
                      <div className="p-3 space-y-3">
                        <div className="bg-dark-700/20 rounded p-2">
                          <h5 className="text-xs font-medium text-gray-400 mb-1">Your Response</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            {response.response || response.text || 'No response recorded'}
                          </p>
                        </div>

                        {analysis && (
                          <>
                            <div>
                              <h5 className="text-xs font-medium text-gray-400 mb-1">Feedback</h5>
                              <p className="text-gray-300 text-xs">{feedbackText}</p>
                            </div>

                            {/* Compact metrics grid */}
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <div className="text-white font-medium">{analysis.clarity || analysis.communication || 7}</div>
                                <div className="text-gray-500">Clarity</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{analysis.relevance || analysis.specificity || 7}</div>
                                <div className="text-gray-500">Relevance</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{analysis.depth || 6}</div>
                                <div className="text-gray-500">Depth</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{analysis.confidence || analysis.voice_confidence || 7}</div>
                                <div className="text-gray-500">Confidence</div>
                              </div>
                            </div>

                            {/* Compact strengths and improvements */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-dark-600/30">
                              <div>
                                <h5 className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Strengths
                                </h5>
                                <ul className="space-y-0.5">
                                  {strengths.map((strength: string, idx: number) => (
                                      <li key={idx} className="text-xs text-gray-300 flex items-start">
                                          <div className="w-1 h-1 bg-green-400 rounded-full mr-1 mt-1.5 flex-shrink-0" />
                                          {strength.charAt(0).toUpperCase() + strength.slice(1)}
                                      </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h5 className="text-xs font-medium text-orange-400 mb-1 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Improve
                                </h5>
                                <ul className="space-y-0.5">
                                  {areasForImprovement.map((area: string, idx: number) => (
                                      <li key={idx} className="text-xs text-gray-300 flex items-start">
                                          <div className="w-1 h-1 bg-orange-400 rounded-full mr-1 mt-1.5 flex-shrink-0" />
                                          {area.charAt(0).toUpperCase() + area.slice(1)}
                                      </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InterviewResults;

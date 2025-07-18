import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target,
  ArrowLeft,
  Trophy,
  Brain,
  MessageCircle,
  TrendingUp,
  Lightbulb,
  Star,
  CheckCircle,
  FileText,
  BarChart3,
  Volume2,
  Mic,
  BookOpen,
  Play,
  MessageSquare,
  AlertCircle,
  Clock
} from 'lucide-react';
import VoiceTimeline from './VoiceTimeline';
import RedPandaLogo from '../RedPandaLogo';

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
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
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

  const getInterviewTypeAdvice = (interviewType: string) => {
    const advice = {
      behavioral: {
        title: 'Behavioral Interview Tips',
        tips: [
          'Use The STAR Method For Structured Responses',
          'Prepare Specific Examples From Your Experience',
          'Show Growth Mindset In Challenge Situations',
          'Demonstrate Leadership And Collaboration Skills'
        ]
      },
      technical: {
        title: 'Technical Interview Tips',
        tips: [
          'Practice Coding Problems Daily And Think Out Loud',
          'Master Data Structures And Algorithm Fundamentals',
          'Explain Your Approach Before Writing Code',
          'Test Your Solutions With Edge Cases'
        ]
      },
    };
    return advice[interviewType as keyof typeof advice] || {
      title: 'General Interview Tips',
      tips: [
        'Research The Company And Role Thoroughly',
        'Prepare Specific Examples From Your Experience',
        'Practice Common Interview Questions',
        'Show Genuine Interest And Enthusiasm'
      ]
    };
  };

  const getSkillAdvice = (interviewType: string) => {
    const advice = {
      behavioral: [
        'Reflect On Past Experiences And Lessons Learned',
        'Practice Storytelling With Clear Structure',
        'Develop Self-Awareness And Emotional Intelligence',
        'Work On Communication And Presentation Skills'
      ],
      technical: [
        'Practice LeetCode Problems Regularly',
        'Study System Design Concepts',
        'Review Computer Science Fundamentals',
        'Build Projects To Demonstrate Skills'
      ],
    };
    return advice[interviewType as keyof typeof advice] || [
      'Continue Learning And Improving Relevant Skills',
      'Seek Feedback From Mentors And Peers',
      'Practice Interview Skills Regularly',
      'Stay Updated With Industry Trends'
    ];
  };

  const getNextSteps = (overallScore: number) => {
    const percentage = overallScore;
    if (percentage >= 85) {
      return {
        title: "You're Interview Ready! 🎉",
        steps: [
          "Apply to target roles with confidence",
          "Research specific company cultures and values",
          "Prepare thoughtful questions for your interviewers",
          "Practice with senior professionals or mentors"
        ]
      };
    } else if (percentage >= 75) {
      return {
        title: "Almost There - Polish Your Skills ✨",
        steps: [
          `Practice more behavioral and situational questions`,
          "Refine your examples using the STAR method",
          "Record yourself and review your performance",
          "Get feedback from peers or experienced professionals"
        ]
      };
    } else {
      return {
        title: "Build Your Foundation 💪",
        steps: [
          `Focus on interview fundamentals and core concepts`,
          "Develop your professional story and key achievements",
          "Practice basic interview etiquette and communication",
          "Work with a mentor or interview coach for guidance"
        ]
      };
    }
  };

  const overallGrade = getOverallGrade(safeSessionData.overallScore);
  const interviewAdvice = getInterviewTypeAdvice(safeSessionData.interviewType);
  const skillAdvice = getSkillAdvice(safeSessionData.interviewType);
  const nextSteps = getNextSteps(safeSessionData.overallScore);

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
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text-orange mb-4">Interview Complete!</h1>
              <p className="text-gray-400 text-lg">
                Your standard interview practice session has been analyzed with detailed AI feedback.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overall Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/10 to-amber-400/5 rounded-2xl p-8 border border-orange-500/20 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text-orange mb-2">{safeSessionData.overallScore}%</div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>{overallGrade.grade}</div>
              <p className="text-gray-400 text-sm">{overallGrade.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{formatTime(safeSessionData.duration)}</div>
              <p className="text-gray-400 text-sm">Interview Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{safeSessionData.questionsAnswered}</div>
              <p className="text-gray-400 text-sm">Questions Answered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Trophy className={`w-8 h-8 ${safeSessionData.overallScore >= 80 ? 'text-yellow-400' : 'text-gray-500'}`} />
                {safeSessionData.overallScore >= 80 ? 'Role Ready' : 'Needs Practice'}
              </div>
              <p className="text-gray-400 text-sm">Standard Interview</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interview Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                Interview Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30"
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
                          transition={{ duration: 1.5, delay: 0.3 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{getMetricInsight(metric.name.toLowerCase(), metric.score)}</p>
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
                className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-orange-400" />
                  Advanced Voice Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const metricsObj = safeSessionData.voice_metrics_summary || safeSessionData.speech_metrics?.[0]?.metrics || {};
                    const voiceMetrics = [];
                    
                    // 6 main voice metrics with realistic fallbacks
                    if (metricsObj.speechRate !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.speechRate / 20)));
                      voiceMetrics.push({ name: 'Speech Rate', score, icon: TrendingUp, color: 'from-orange-500 to-amber-500', detail: `${Math.round(metricsObj.speechRate)} WPM` });
                    } else {
                      // Fallback based on overall performance
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
                      // Invert filler word count - fewer is better (max 10 for scoring)
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
                    
                    return voiceMetrics;
                  })().map((metric, index) => (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30"
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
                        <p className="text-xs text-gray-400">{metric.detail}</p>
                        <p className="text-xs text-gray-400">{getMetricInsight(metric.name.toLowerCase(), metric.score)}</p>
                      </div>
                    </motion.div>
                  ))}
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

            {/* Question-by-Question Analysis - Compact Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <RedPandaLogo size="sm" animate={false} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-400" />
                    Question-by-Question Analysis
                  </h3>
                  <p className="text-gray-400 text-sm">Detailed feedback from your AI interview coach</p>
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
                                {formatCategoryLabel(question?.category || 'General')}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                {nextSteps.title}
              </h3>
              <div className="space-y-3">
                {nextSteps.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onStartNewInterview();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-400 hover:to-amber-400 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Practice Again
                </button>
              </div>
            </motion.div>

            {/* Interview Type Advice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                {interviewAdvice.title}
              </h3>
              <div className="space-y-3">
                {interviewAdvice.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Skill Development */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                Skill Development Tips
              </h3>
              <div className="space-y-3">
                {skillAdvice.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Session Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Interview Type:</span>
                  <span className="text-white capitalize">
                    {safeSessionData.interviewType.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()).trim()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className="text-white capitalize">{safeSessionData.setup.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white capitalize">{safeSessionData.setup.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interview Mode:</span>
                  <span className="text-white capitalize">{safeSessionData.setup.interviewMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(safeSessionData.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interview Focus:</span>
                  <span className="text-orange-400">Standard Practice</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  TrendingUp, 
  Target, 
  Brain,
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Sparkles,
  Mic,
  Volume2,
  Activity,
  Zap,
  FileText,
  Trophy,
  Play,
  Lightbulb,
  Star,
  BookOpen,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { saveInterviewSession } from '../../utils/supabase-interview';
import { InterviewTimeline } from './InterviewTimeline';

// Utility function to format category labels
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    'school_fit': 'School Fit',
    'personal_qualities': 'Personal Qualities',
    'academic_readiness': 'Academic Readiness',
    'future_goals': 'Future Goals',
    'personal': 'Personal',
    'academic': 'Academic',
    'values': 'Values',
    'community': 'Community',
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
    'extracurricular': 'Extracurricular',
    'goals': 'Goals',
    'fit': 'Fit',
    'challenge': 'Challenge',
    'diversity': 'Diversity'
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
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Add safety checks for sessionData
  if (!sessionData) {
    console.error('InterviewResults: No sessionData provided');
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

  // Debug logging
  console.log('InterviewResults: Received sessionData:', sessionData);
  console.log('InterviewResults: sessionData.setup:', sessionData.setup);
  console.log('InterviewResults: sessionData.speechMetrics:', sessionData.speechMetrics);
  console.log('InterviewResults: sessionData.responses:', sessionData.responses);
  console.log('InterviewResults: sessionData.questions:', sessionData.questions);

  // Handle setup data structure - normalize the setup object
  const rawSetup = sessionData.setup || {};
  const normalizedSetup = {
    industry: rawSetup.industry || 'Technology',
    jobType: rawSetup.jobType || 'Software Engineer',
    experienceLevel: rawSetup.experienceLevel || 'intermediate',
    interviewMode: rawSetup.interviewMode || 'text'
  };

  // Ensure other required fields exist
  const safeSessionData = {
    ...sessionData,
    overallScore: sessionData.overallScore || 70,
    responses: sessionData.responses || [],
    questions: sessionData.questions || [],
    setup: normalizedSetup,
    duration: sessionData.duration || 0,
    startTime: sessionData.startTime || new Date()
  };

  useEffect(() => {
    // Save session to Supabase when component mounts
    const saveSession = async () => {
      try {
        await saveInterviewSession(safeSessionData);
      } catch (error) {
        console.error('Failed to save session to Supabase:', error);
      }
    };

    saveSession();
  }, [safeSessionData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    // Score is already a percentage (0-100)
    const percentage = score;
    if (percentage >= 90) return { grade: 'A+', color: 'text-orange-400', description: 'Outstanding performance! You\'re interview-ready for this role.' };
    if (percentage >= 85) return { grade: 'A', color: 'text-orange-400', description: 'Excellent work! Your responses show strong professional readiness.' };
    if (percentage >= 80) return { grade: 'A-', color: 'text-orange-400', description: 'Very good performance with room for minor improvements.' };
    if (percentage >= 75) return { grade: 'B+', color: 'text-yellow-400', description: 'Good responses that demonstrate your potential.' };
    if (percentage >= 70) return { grade: 'B', color: 'text-yellow-400', description: 'Solid foundation with opportunities for enhancement.' };
    if (percentage >= 65) return { grade: 'B-', color: 'text-yellow-400', description: 'Decent responses that need more development.' };
    if (percentage >= 60) return { grade: 'C+', color: 'text-orange-400', description: 'Shows promise but needs improvement.' };
    if (percentage >= 55) return { grade: 'C', color: 'text-orange-400', description: 'Below average performance with significant room for growth.' };
    if (percentage >= 50) return { grade: 'C-', color: 'text-red-400', description: 'Poor performance requiring substantial improvement.' };
    if (percentage >= 45) return { grade: 'D+', color: 'text-red-400', description: 'Very poor performance needing major work.' };
    if (percentage >= 40) return { grade: 'D', color: 'text-red-400', description: 'Failing performance requiring complete preparation overhaul.' };
    return { grade: 'F', color: 'text-red-500', description: 'Unacceptable performance - extensive practice needed.' };
  };

  const getMetricInsight = (metric: string, score: number) => {
    const insights = {
      'communication clarity': {
        high: "Outstanding communication skills! You articulate ideas clearly and persuasively.",
        medium: "Good communication, focus on being more concise and structured.",
        low: "Work on organizing your thoughts and expressing them more clearly."
      },
      'technical depth': {
        high: "Impressive technical knowledge and problem-solving abilities.",
        medium: "Good technical understanding, work on providing more detailed explanations.",
        low: "Focus on strengthening your technical fundamentals and practical knowledge."
      },
      'response quality': {
        high: "Excellent response structure and relevance to questions asked.",
        medium: "Good responses, work on being more specific and comprehensive.",
        low: "Focus on structuring answers and staying relevant to the question."
      },
      'confidence level': {
        high: "Excellent confidence and enthusiasm throughout the interview.",
        medium: "Good confidence level, project more conviction in your responses.",
        low: "Work on building confidence and speaking with more authority."
      },
      'voice delivery': {
        high: "Outstanding vocal delivery - perfect pace and clarity for interviews.",
        medium: "Good voice delivery, focus on maintaining consistent energy.",
        low: "Work on your speaking pace and vocal clarity."
      },
      'speech rate': {
        high: "Perfect speaking pace - you speak at an ideal rhythm for interviews.",
        medium: "Good speaking pace, try to maintain consistency throughout.",
        low: "Adjust your speaking pace - aim for 140-170 words per minute."
      },
      fluency: {
        high: "Outstanding fluency - you speak smoothly with excellent flow.",
        medium: "Good fluency, work on reducing minor hesitations.",
        low: "Focus on speaking more smoothly and reducing filler words."
      },
      'voice confidence': {
        high: "Excellent vocal confidence - you sound authoritative and engaging.",
        medium: "Good voice confidence, project more conviction in your tone.",
        low: "Work on speaking with more confidence and stronger vocal presence."
      },
      delivery: {
        high: "Outstanding delivery - your pacing and rhythm are perfect for interviews.",
        medium: "Good delivery, focus on maintaining consistent energy levels.",
        low: "Work on your vocal delivery and speaking rhythm."
      },
      'vocal clarity': {
        high: "Excellent vocal clarity - you articulate words clearly and precisely.",
        medium: "Good clarity, focus on enunciating key words more clearly.",
        low: "Practice speaking more clearly and improving your articulation."
      },
      'filler words': {
        high: "Excellent - you avoid filler words and speak with precision.",
        medium: "Good control of filler words, continue reducing 'um' and 'uh'.",
        low: "Focus on reducing filler words like 'um', 'uh', and 'like'."
      }
    };

    const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    return insights[metric.toLowerCase() as keyof typeof insights]?.[level] || "Keep practicing to improve this area.";
  };

  const getInterviewAdvice = () => {
    return {
      title: 'Dynamic Interview Tips',
      tips: [
        'Prepare For Adaptive Question Flow And Follow-Ups',
        'Show Enthusiasm And Genuine Interest In Responses',
        'Use Specific Examples To Support Your Answers',
        'Practice Both Technical And Behavioral Questions'
      ]
    };
  };

  const getSkillAdvice = () => {
    return [
      'Continue Practicing With Dynamic Interview Simulations',
      'Work On Storytelling And Example Preparation',
      'Develop Technical Communication Skills',
      'Practice Thinking Out Loud During Problem Solving'
    ];
  };

  const getNextSteps = (overallScore: number) => {
    const percentage = overallScore;
    if (percentage >= 85) {
      return {
        title: "You're Interview Ready! 🎉",
        steps: [
          "Apply to target positions with confidence",
          "Research specific company cultures and values",
          "Prepare thoughtful questions for interviewers",
          "Practice with senior professionals in your field"
        ]
      };
    } else if (percentage >= 75) {
      return {
        title: "Almost There - Polish Your Skills ✨",
        steps: [
          "Practice more dynamic interview scenarios",
          "Work on specific examples and storytelling",
          "Record yourself and review your performance",
          "Get feedback from experienced professionals"
        ]
      };
    } else {
      return {
        title: "Build Your Foundation 💪",
        steps: [
          "Focus on interview fundamentals and core concepts",
          "Develop your professional story and key achievements",
          "Practice basic interview skills and etiquette",
          "Work with a mentor or interview coach"
        ]
      };
    }
  };

  const overallGrade = getOverallGrade(safeSessionData.overallScore);
  const interviewAdvice = getInterviewAdvice();
  const skillAdvice = getSkillAdvice();
  const nextSteps = getNextSteps(safeSessionData.overallScore);

  // Calculate insights
  const avgConfidence = safeSessionData.responses.reduce((sum: number, r: any) => 
    sum + (r.analysis?.confidenceIndicators?.enthusiasm || 5), 0) / safeSessionData.responses.length;
  
  const hasSpecificExamples = safeSessionData.responses.some((r: any) => 
    r.analysis?.confidenceIndicators?.specificExamples);
  
  const questionTypes = safeSessionData.responses.reduce((acc: any, r: any) => {
    const question = safeSessionData.questions.find((q: any) => q.id === r.questionId);
    if (question) {
      acc[question.type] = (acc[question.type] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate speech metrics averages if available
  const speechMetricsAvailable = safeSessionData.speechMetrics && safeSessionData.speechMetrics.length > 0;
  let avgSpeechMetrics = null;
  
  if (speechMetricsAvailable) {
    const metrics = safeSessionData.speechMetrics.map((m: any) => m.metrics).filter(Boolean);
    if (metrics.length > 0) {
      avgSpeechMetrics = {
        voiceConfidence: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.voiceConfidence || 0), 0) / metrics.length),
        fluencyScore: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.fluencyScore || 0), 0) / metrics.length),
        speechRate: Number((metrics.reduce((sum: number, m: any) => sum + (m.speechRate || 0), 0) / metrics.length).toFixed(2)),
        clarity: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.clarity || 0), 0) / metrics.length),
        delivery: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.delivery || 0), 0) / metrics.length),
        fillerWordCount: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.fillerWordCount || 0), 0) / metrics.length),
        averageVolume: Math.round(metrics.reduce((sum: number, m: any) => sum + (m.averageVolume || 0), 0) / metrics.length)
      };
    }
  }

  // Calculate skill breakdown metrics similar to hero section
  const skillBreakdownMetrics = [
    {
      name: "Communication Clarity",
      score: Math.round(safeSessionData.responses.reduce((sum: number, r: any) => 
        sum + (r.analysis?.score || 5), 0) / safeSessionData.responses.length * 10),
      icon: MessageSquare,
      color: "from-orange-500 to-orange-400",
      improvement: avgSpeechMetrics ? `+${Math.max(0, avgSpeechMetrics.clarity - 70)}%` : "+8%",
      description: "How clearly you communicate your ideas and thoughts"
    },
    {
      name: "Technical Depth",
      score: Math.round(safeSessionData.responses.filter((r: any) => {
        const question = safeSessionData.questions.find((q: any) => q.id === r.questionId);
        return question?.type === 'technical';
      }).reduce((sum: number, r: any) => sum + (r.analysis?.score || 5), 0) / 
      Math.max(1, safeSessionData.responses.filter((r: any) => {
        const question = safeSessionData.questions.find((q: any) => q.id === r.questionId);
        return question?.type === 'technical';
      }).length) * 10),
      icon: Brain,
      color: "from-amber-500 to-orange-500",
      improvement: "+12%",
      description: "Your technical knowledge and problem-solving abilities"
    },
    {
      name: "Response Quality",
      score: Math.round(safeSessionData.responses.reduce((sum: number, r: any) => 
        sum + (r.analysis?.confidenceIndicators?.structuredAnswer ? 8 : 5), 0) / safeSessionData.responses.length * 10),
      icon: Target,
      color: "from-orange-600 to-red-500",
      improvement: "+15%",
      description: "Structure, relevance, and completeness of your answers"
    },
    {
      name: "Confidence Level",
      score: Math.round(avgConfidence * 10),
      icon: TrendingUp,
      color: "from-red-500 to-orange-600",
      improvement: "+6%",
      description: "Your confidence and enthusiasm during the interview"
    }
  ];

  // Add voice-specific metrics if available
  if (avgSpeechMetrics) {
    skillBreakdownMetrics.push({
      name: "Voice Delivery",
      score: avgSpeechMetrics.delivery,
      icon: Mic,
      color: "from-pink-500 to-pink-400",
      improvement: `+${Math.max(0, avgSpeechMetrics.delivery - 60)}%`,
      description: "Your speaking pace, clarity, and vocal confidence"
    });
  }

  // Check if all responses are empty
  const allResponsesEmpty = safeSessionData.responses.every((r: any) => !r.response || r.response.trim() === '');
  // Build timeline events from responses with better fallback handling
  const timelineEvents = safeSessionData.responses
    .filter((r: any) => r && (r.response?.trim() || r.analysis)) // Only include valid responses
    .map((r: any, idx: number) => {
      // Better time calculation: try multiple sources
      const time = r.speechMetrics?.timing?.speechDuration || 
                  r.speechMetrics?.timing?.totalDuration ||
                  (idx * 60) + Math.random() * 30; // Add variation to make timeline more interesting
      
      // Better label generation with more fallback options
      let label = '';
      if (safeSessionData.questions && safeSessionData.questions.length > 0) {
        const question = safeSessionData.questions.find((q: any) => q.id === r.questionId);
        label = question?.text || `Question ${idx + 1}`;
      } else {
        // Generate meaningful labels based on response content or question type
        if (r.response) {
          const responseWords = r.response.split(' ').slice(0, 5).join(' ');
          label = `Response: "${responseWords}..."`;
        } else {
          label = `Interview Question ${idx + 1}`;
        }
      }
      
      // Ensure we have a valid score
      const value = Math.max(1, Math.min(10, r.analysis?.score ?? 5));
      
      // Build comprehensive details
      let details = '';
      if (r.analysis) {
        const detailParts = [
          r.analysis.strengths?.length ? `✓ Strengths: ${r.analysis.strengths.join(', ')}` : '',
          r.analysis.areasForImprovement?.length ? `⚠ Areas to improve: ${r.analysis.areasForImprovement.join(', ')}` : '',
          r.analysis.confidenceIndicators?.enthusiasm ? `📊 Enthusiasm: ${r.analysis.confidenceIndicators.enthusiasm}/10` : ''
        ].filter(Boolean);
        details = detailParts.join('\n\n');
      }
      
      // If no analysis details, show response length info
      if (!details && r.response) {
        const wordCount = r.response.split(' ').length;
        details = `Response: ${wordCount} words\nScore: ${value}/10`;
      }
      
      return {
        time: time + (idx * 2), // spread out a bit
        label,
        value,
        details
      };
    });

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
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Dynamic Interview Complete!</h1>
              <p className="text-gray-400 text-lg">
                Your adaptive interview session has been analyzed with detailed AI feedback
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overall Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-2xl p-8 border border-orange-500/20 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text mb-2">{safeSessionData.overallScore}%</div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>{overallGrade.grade}</div>
              <p className="text-gray-400 text-sm">{overallGrade.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{formatTime(safeSessionData.duration)}</div>
              <p className="text-gray-400 text-sm">Interview Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{safeSessionData.responses.length}</div>
              <p className="text-gray-400 text-sm">Questions Answered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Trophy className={`w-8 h-8 ${safeSessionData.overallScore >= 70 ? 'text-yellow-400' : 'text-gray-500'}`} />
                {safeSessionData.overallScore >= 70 ? 'Interview Ready' : 'Needs Practice'}
              </div>
              <p className="text-gray-400 text-sm">
                {safeSessionData.setup.interviewMode === 'voice' ? 'Voice Interview' : 'Text Interview'} • Dynamic
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interview Performance Metrics - Dynamic Interview Fundamentals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                Dynamic Interview Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillBreakdownMetrics.map((metric, index) => (
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
                          <span className="text-lg font-semibold text-white">{metric.score}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score}%` }}
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

            {/* Voice Analysis Section - Only show for voice interviews */}
            {(() => {
              // Check multiple possible locations for voice metrics
              const hasVoiceMetrics = 
                (Array.isArray(safeSessionData.speechMetrics) && safeSessionData.speechMetrics.length > 0 && (safeSessionData.speechMetrics[0].metrics || safeSessionData.speechMetrics[0])) ||
                safeSessionData.voice_metrics_summary ||
                (Array.isArray(safeSessionData.speech_metrics) && safeSessionData.speech_metrics.length > 0) ||
                avgSpeechMetrics;
              
              return safeSessionData.setup.interviewMode === 'voice' && hasVoiceMetrics;
            })() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-orange-400" />
                  Advanced Voice Analysis
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                    Dynamic Interview Optimized
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {avgSpeechMetrics && [
                    { 
                      name: 'Voice Confidence', 
                      score: Math.round(avgSpeechMetrics.voiceConfidence / 10), 
                      icon: Mic, 
                      color: 'from-orange-500 to-red-500',
                      detail: `${avgSpeechMetrics.voiceConfidence}% confidence`
                    },
                    { 
                      name: 'Fluency', 
                      score: Math.round(avgSpeechMetrics.fluencyScore / 10), 
                      icon: Volume2, 
                      color: 'from-red-500 to-orange-500',
                      detail: `${avgSpeechMetrics.fluencyScore}% fluency`
                    },
                    { 
                      name: 'Speech Rate', 
                      score: Math.min(10, Math.max(0, 
                        avgSpeechMetrics.speechRate >= 140 && avgSpeechMetrics.speechRate <= 170 
                          ? Math.round(8 + (avgSpeechMetrics.speechRate - 140) / 30 * 2)
                          : Math.round((avgSpeechMetrics.speechRate / 150) * 8)
                      )), 
                      icon: TrendingUp, 
                      color: 'from-orange-600 to-amber-600',
                      detail: `${Number(avgSpeechMetrics.speechRate).toFixed(2)} WPM`
                    },
                    { 
                      name: 'Delivery', 
                      score: Math.round(avgSpeechMetrics.delivery / 10), 
                      icon: CheckCircle, 
                      color: 'from-amber-600 to-orange-600',
                      detail: `${avgSpeechMetrics.delivery}% delivery`
                    },
                    { 
                      name: 'Clarity', 
                      score: Math.round(avgSpeechMetrics.clarity / 10), 
                      icon: MessageCircle, 
                      color: 'from-orange-400 to-red-400',
                      detail: `${avgSpeechMetrics.clarity}% clarity`
                    },
                    { 
                      name: 'Filler Words', 
                      score: Math.max(0, Math.min(10, 10 - Math.floor(avgSpeechMetrics.fillerWordCount / 2))), 
                      icon: AlertCircle, 
                      color: 'from-orange-300 to-red-300',
                      detail: `${avgSpeechMetrics.fillerWordCount} filler words`
                    }
                  ].map((metric, index) => (
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
              </motion.div>
            )}

            {/* Timeline Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-orange-400" />
                Interview Performance Timeline
              </h3>
              <InterviewTimeline duration={safeSessionData.duration} events={timelineEvents} />
              <div className="text-xs text-gray-400 mt-2">Hover over the wave to see your performance and feedback at each moment.</div>
            </motion.div>

            {/* Skill Breakdown Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                Performance Breakdown
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skillBreakdownMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30 hover:border-orange-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} group-hover:scale-110 transition-transform`}>
                        <metric.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white truncate">{metric.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-white">{metric.score}%</span>
                            <span className="text-xs text-orange-400">{metric.improvement}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score}%` }}
                          transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </motion.div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400">{metric.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Interview Breakdown - Compact Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-400" />
                Question-by-Question Analysis
              </h3>
              
              <div className="space-y-3">
                {safeSessionData.responses.map((response: any, index: number) => {
                  const question = safeSessionData.questions.find((q: any) => q.id === response.questionId);
                  const speechMetric = safeSessionData.speechMetrics?.find((m: any) => m.questionId === response.questionId);
                  
                  return (
                    <div key={response.questionId} className="border border-dark-600/50 rounded-lg overflow-hidden">
                      {/* Question Header - Compact */}
                      <div className="bg-dark-700/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                question?.type === 'small_talk'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : question?.type === 'behavioral'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : question?.type === 'technical'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : question?.type === 'follow_up'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {formatCategoryLabel(question?.type || 'Dynamic')}
                              </span>
                              {speechMetric && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                                  <Mic className="w-3 h-3 inline mr-1" />
                                  Voice
                                </span>
                              )}
                            </div>
                            <p className="text-white text-sm font-medium">{question?.text}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                            response.analysis?.score >= 8 
                              ? 'bg-orange-500/20 text-orange-400'
                              : response.analysis?.score >= 6
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {response.analysis?.score || 0}/10
                          </div>
                        </div>
                      </div>
                      
                      {/* Response and Feedback - Compact */}
                      <div className="p-3 space-y-3">
                        <div className="bg-dark-700/20 rounded p-2">
                          <h5 className="text-xs font-medium text-gray-400 mb-1">Your Response</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">{response.response}</p>
                          {response.audioBlob && (
                            <audio controls className="mt-2 w-full">
                              <source src={typeof response.audioBlob === 'string' ? response.audioBlob : URL.createObjectURL(response.audioBlob)} type="audio/webm" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                        
                        {/* Speech Metrics for this question */}
                        {speechMetric?.metrics && (
                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                            <h5 className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-2">
                              <Volume2 className="w-3 h-3" />
                              Speech Analysis
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-sm font-bold text-white">{speechMetric.metrics.voiceConfidence}%</div>
                                <div className="text-gray-400">Confidence</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-white">{speechMetric.metrics.fluencyScore}%</div>
                                <div className="text-gray-400">Fluency</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-white">{Number(speechMetric.metrics.speechRate).toFixed(1)}</div>
                                <div className="text-gray-400">WPM</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-white">{speechMetric.metrics.clarity}%</div>
                                <div className="text-gray-400">Clarity</div>
                              </div>
                            </div>
                            {speechMetric.metrics.fillerWordCount > 0 && (
                              <div className="mt-2 text-xs text-yellow-400">
                                ⚠️ {speechMetric.metrics.fillerWordCount} filler words detected
                              </div>
                            )}
                          </div>
                        )}
                        
                        {response.analysis && (
                          <>
                            <div>
                              <h5 className="text-xs font-medium text-orange-400 mb-1">AI Feedback</h5>
                              <p className="text-gray-300 text-xs capitalize-first">
                                {response.analysis.feedback.charAt(0).toUpperCase() + response.analysis.feedback.slice(1)}
                              </p>
                            </div>
                            
                            {/* Compact metrics grid */}
                            {response.analysis.confidenceIndicators && (
                              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div>
                                  <div className="text-white font-medium">{response.analysis.confidenceIndicators.enthusiasm || 0}</div>
                                  <div className="text-gray-500">Confidence</div>
                                </div>
                                <div>
                                  <div className="text-white font-medium">{response.analysis.confidenceIndicators.specificExamples ? 'Yes' : 'No'}</div>
                                  <div className="text-gray-500">Examples</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Compact strengths and improvements */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-dark-600/30">
                              <div>
                                <h5 className="text-xs font-medium text-orange-400 mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Strengths
                                </h5>
                                <ul className="space-y-0.5">
                                  {response.analysis.strengths?.slice(0, 2).map((strength: string, idx: number) => (
                                    <li key={idx} className="text-xs text-gray-300 flex items-start">
                                      <div className="w-1 h-1 bg-orange-400 rounded-full mr-1 mt-1.5 flex-shrink-0" />
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
                                  {response.analysis.areasForImprovement?.slice(0, 2).map((area: string, idx: number) => (
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

            {allResponsesEmpty ? (
              <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 text-center">
                <p className="text-gray-400 text-base py-8">
                  No responses were recorded for this session. Please answer the questions to receive personalized feedback and tips.
                </p>
              </div>
            ) : (
              <>
                {/* Speech Metrics Summary */}
                {avgSpeechMetrics && (
                  <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-400" />
                      Speech Performance Summary
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-orange-400">{avgSpeechMetrics.voiceConfidence}%</div>
                          <div className="text-xs text-gray-400">Voice Confidence</div>
                        </div>
                        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-orange-400">{avgSpeechMetrics.fluencyScore}%</div>
                          <div className="text-xs text-gray-400">Fluency Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-purple-400">{Number(avgSpeechMetrics.speechRate).toFixed(2)}</div>
                          <div className="text-xs text-gray-400">Words/Min</div>
                        </div>
                        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-orange-400">{avgSpeechMetrics.clarity}%</div>
                          <div className="text-xs text-gray-400">Clarity</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Analysis */}
                <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-orange-400" />
                    Analysis Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-dark-700/30 rounded-lg">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        Adaptive Performance
                      </h4>
                      <p className="text-sm text-gray-400">
                        {safeSessionData.overallScore >= 80 
                          ? "Excellent! The system recognized your strong performance and provided appropriately challenging questions."
                          : safeSessionData.overallScore >= 60
                          ? "Good progress! The system adapted to help you improve throughout the interview."
                          : "The system provided supportive questions to help build your confidence. Keep practicing!"
                        }
                      </p>
                    </div>
                    
                    <div className="p-4 bg-dark-700/30 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Question Flow</h4>
                      <div className="space-y-2">
                        {Object.entries(questionTypes).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-gray-400">{formatCategoryLabel(type)}:</span>
                            <span className="text-white">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-dark-700/30 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Communication Style</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Avg Confidence:</span>
                          <span className="text-white">{Math.round(avgConfidence)}/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Used Examples:</span>
                          <span className={hasSpecificExamples ? 'text-green-400' : 'text-orange-400'}>
                            {hasSpecificExamples ? 'Yes' : 'Improve'}
                          </span>
                        </div>
                        {avgSpeechMetrics && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Speech Quality:</span>
                            <span className={avgSpeechMetrics.voiceConfidence >= 70 ? 'text-green-400' : 'text-orange-400'}>
                              {avgSpeechMetrics.voiceConfidence >= 70 ? 'Strong' : 'Developing'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

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
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white">{safeSessionData.setup.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white">{safeSessionData.setup.jobType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white">{safeSessionData.setup.experienceLevel}</span>
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
                  <span className="text-green-400">Dynamic Practice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white">GPT-4o Dynamic</span>
                </div>
                {avgSpeechMetrics && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speech Analysis:</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Enabled
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;
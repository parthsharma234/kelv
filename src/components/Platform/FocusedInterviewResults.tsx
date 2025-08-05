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
  AlertCircle,
  BookOpen,
  Play,
  Eye
} from 'lucide-react';
import VoiceTimeline from './VoiceTimeline';
import RedPandaLogo from '../RedPandaLogo';
import SophisticatedResultsView from './SophisticatedResultsView';

// Utility function to format category labels for focused interviews
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    'technical': 'Technical',
    'behavioral': 'Behavioral',
    'situational': 'Situational',
    'leadership': 'Leadership',
    'problem_solving': 'Problem Solving',
    'communication': 'Communication',
    'teamwork': 'Teamwork',
    'cultural_fit': 'Cultural Fit',
    'case_study': 'Case Study',
    'system_design': 'System Design',
    'coding': 'Coding',
    'algorithms': 'Algorithms',
    'data_structures': 'Data Structures',
    'system_architecture': 'System Architecture',
    'conflict_resolution': 'Conflict Resolution',
    'time_management': 'Time Management',
    'decision_making': 'Decision Making',
    'adaptability': 'Adaptability',
    'innovation': 'Innovation',
    'analytical': 'Analytical',
    'strategic': 'Strategic',
    'customer_focus': 'Customer Focus',
    'results_oriented': 'Results Oriented',
    'small_talk': 'Small Talk'
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

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

  // Check if sophisticated analytics are available
  const analyticsReport = sessionData.sophisticatedAnalytics;
  const cameraPresence = analyticsReport?.cameraPresence || sessionData.cameraPresence;
  const posture = analyticsReport?.posture || sessionData.posture;
  const hasCameraAnalytics = cameraPresence || posture;
  const hasSophisticatedAnalytics = analyticsReport && (
    analyticsReport.summary ||
    analyticsReport.timeline ||
    cameraPresence ||
    posture
  );
  // Add safety checks for sessionData
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-red-400 text-lg">Session data not found</p>
          <p className="text-gray-400 text-sm mt-2">Unable to load focused interview results</p>
          <button
            onClick={onBackToDashboard}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle setup data structure - support both focused format and converted format
  const rawSetup = sessionData.setup || {};
  let normalizedSetup;

  // Normalize setup data for focused interviews
  if (rawSetup.jobType || rawSetup.industry) {
    // This is likely from database with job/industry format
    normalizedSetup = {
      interviewType: sessionData.interviewType || rawSetup.jobType || 'general',
      difficulty: rawSetup.experienceLevel || 'intermediate',
      industry: rawSetup.industry || 'general',
      interviewMode: rawSetup.interviewMode || 'text'
    };
  } else {
    // This is the original focused format
    normalizedSetup = {
      interviewType: sessionData.interviewType || rawSetup.interviewType || 'general',
      difficulty: rawSetup.difficulty || 'intermediate',
      industry: rawSetup.industry || 'general',
      interviewMode: rawSetup.interviewMode || 'text'
    };
  }

  // Convert score to realistic percentage (40-95% range)
  const convertToRealisticPercentage = (score: number) => {
    // Score comes in as 1-10 or 0-100, normalize to 0-10 range
    const normalizedScore = score > 10 ? score / 10 : score;
    // Map 1-10 to 40-95% range with better distribution
    const percentage = Math.round(40 + (normalizedScore - 1) * (55 / 9));
    return Math.max(40, Math.min(95, percentage));
  };

  // Ensure other required fields exist
  const safeSessionData = {
    ...sessionData,
    overallScore: convertToRealisticPercentage(sessionData.overallScore || 7),
    responses: sessionData.responses || [],
    questions: sessionData.questions || [],
    setup: normalizedSetup,
    duration: sessionData.duration || 0,
    questionsAnswered: sessionData.questionsAnswered || 0,
    startTime: sessionData.startTime || new Date(),
    interviewType: sessionData.interviewType || 'general'
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
        low: "Practice breaking down problems into smaller, manageable components."
      },
      communication: {
        high: "Outstanding communication skills! You articulate ideas clearly and persuasively.",
        medium: "Good communication, focus on being more concise and structured.",
        low: "Work on organizing your thoughts and expressing them more clearly."
      },
      depth: {
        high: "Impressive depth of knowledge and detailed responses.",
        medium: "Good depth, try to provide more specific examples and details.",
        low: "Develop deeper understanding and provide more comprehensive answers."
      },
      relevance: {
        high: "Excellent focus! All your responses directly address the question.",
        medium: "Good relevance, ensure you're fully answering what's being asked.",
        low: "Practice staying focused on the specific question being asked."
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

    const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
    return insights[metric.toLowerCase() as keyof typeof insights]?.[level] || "Keep practicing to improve this area.";
  };

  const getInterviewTypeAdvice = (interviewType: string) => {
    const advice = {
      technical: {
        title: 'Technical Interview Tips',
        tips: [
          'Practice Coding Problems Daily And Think Out Loud',
          'Master Data Structures And Algorithm Fundamentals',
          'Explain Your Approach Before Writing Code',
          'Test Your Solutions With Edge Cases'
        ]
      },
      behavioral: {
        title: 'Behavioral Interview Tips',
        tips: [
          'Use The STAR Method For Structured Responses',
          'Prepare Specific Examples From Your Experience',
          'Show Growth Mindset In Challenge Situations',
          'Demonstrate Leadership And Collaboration Skills'
        ]
      },
      situational: {
        title: 'Situational Interview Tips',
        tips: [
          'Think Through Problems Step-By-Step',
          'Consider Multiple Stakeholder Perspectives',
          'Show Decision-Making Under Pressure',
          'Demonstrate Practical Problem-Solving Skills'
        ]
      },
      leadership: {
        title: 'Leadership Interview Tips',
        tips: [
          'Share Concrete Examples Of Leading Teams',
          'Discuss How You Handle Difficult Decisions',
          'Show How You Motivate And Develop Others',
          'Demonstrate Strategic Thinking Abilities'
        ]
      },
      'case-study': {
        title: 'Case Study Interview Tips',
        tips: [
          'Structure Your Analysis With Clear Frameworks',
          'Ask Clarifying Questions Before Starting',
          'Think Business Impact And ROI',
          'Present Recommendations With Supporting Data'
        ]
      }
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
      technical: [
        'Practice LeetCode Problems Regularly',
        'Study System Design Concepts',
        'Review Computer Science Fundamentals',
        'Build Projects To Demonstrate Skills'
      ],
      behavioral: [
        'Reflect On Past Experiences And Lessons Learned',
        'Practice Storytelling With Clear Structure',
        'Develop Self-Awareness And Emotional Intelligence',
        'Work On Communication And Presentation Skills'
      ],
      situational: [
        'Study Business Cases And Decision-Making Frameworks',
        'Practice Analytical And Critical Thinking',
        'Develop Problem-Solving Methodologies',
        'Learn About Industry-Specific Challenges'
      ],
      leadership: [
        'Seek Leadership Opportunities In Current Role',
        'Study Leadership Theories And Best Practices',
        'Practice Giving And Receiving Feedback',
        'Develop Team Management Skills'
      ]
    };

    return advice[interviewType as keyof typeof advice] || [
      'Continue Learning And Improving Relevant Skills',
      'Seek Feedback From Mentors And Peers',
      'Practice Interview Skills Regularly',
      'Stay Updated With Industry Trends'
    ];
  };

  const getNextSteps = (overallScore: number, interviewType: string) => {
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
          `Practice more ${interviewType} interview scenarios`,
          "Work on specific examples and storytelling",
          "Record yourself and review your performance",
          "Get feedback from experienced professionals"
        ]
      };
    } else {
      return {
        title: "Build Your Foundation 💪",
        steps: [
          `Focus on ${interviewType} fundamentals and core concepts`,
          "Develop your professional story and key achievements",
          "Practice basic interview skills and etiquette",
          "Work with a mentor or interview coach"
        ]
      };
    }
  };
  // Show sophisticated analytics if available
  if (hasSophisticatedAnalytics) {
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold gradient-text mb-4">Sophisticated Focused Interview Analysis!</h1>
                <p className="text-gray-400 text-lg">
                  Advanced AI analysis of your focused interview performance with computer vision and voice analytics.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sophisticated Results */}
          <SophisticatedResultsView analyticsReport={sessionData.sophisticatedAnalytics} />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <button
              onClick={() => {
                onStartNewFocusedInterview(safeSessionData.interviewType);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/25"
            >
              <Play className="w-5 h-5" />
              Practice Again
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

  const overallGrade = getOverallGrade(safeSessionData.overallScore);
  const interviewAdvice = getInterviewTypeAdvice(safeSessionData.interviewType);
  const skillAdvice = getSkillAdvice(safeSessionData.interviewType);
  const nextSteps = getNextSteps(safeSessionData.overallScore, safeSessionData.interviewType);

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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Focused Interview Complete!</h1>
              <p className="text-gray-400 text-lg">
                Your focused interview practice session has been analyzed with detailed AI feedback
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overall Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-cyan-400/5 rounded-2xl p-8 border border-blue-500/20 mb-8"
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
              <div className="text-3xl font-bold text-white mb-2">{safeSessionData.questionsAnswered}</div>
              <p className="text-gray-400 text-sm">Questions Answered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Trophy className={`w-8 h-8 ${safeSessionData.overallScore >= 80 ? 'text-yellow-400' : 'text-gray-500'}`} />
                {safeSessionData.overallScore >= 80 ? 'Interview Ready' : 'Needs Practice'}
              </div>
              <p className="text-gray-400 text-sm">
                {safeSessionData.interviewType ? 
                  safeSessionData.interviewType.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str: string) => str.toUpperCase())
                    .trim() + ' Focused' : 'Focused Interview'
                }
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interview Performance Metrics - Focused Interview Fundamentals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Focused Interview Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  // First try to get metrics from the database
                  if (safeSessionData.metrics) {
                    return [
                      { name: 'Problem Solving', score: safeSessionData.metrics.problem_solving || 0, icon: Brain, color: 'from-blue-500 to-cyan-500' },
                      { name: 'Communication', score: safeSessionData.metrics.communication || 0, icon: MessageCircle, color: 'from-cyan-500 to-blue-500' },
                      { name: 'Depth', score: safeSessionData.metrics.depth || 0, icon: Target, color: 'from-blue-600 to-indigo-500' },
                      { name: 'Relevance', score: safeSessionData.metrics.relevance || 0, icon: CheckCircle, color: 'from-indigo-500 to-blue-600' }
                    ];
                  }
                  
                  // Calculate actual scores from response analysis if no saved metrics
                  const responses = safeSessionData.responses || [];
                  const validResponses = responses.filter((r: any) => r.analysis);
                  
                  if (validResponses.length === 0) {
                    // Fallback to default scores if no analysis data
                    return [
                      { name: 'Problem Solving', score: 5, icon: Brain, color: 'from-blue-500 to-cyan-500' },
                      { name: 'Communication', score: 5, icon: MessageCircle, color: 'from-cyan-500 to-blue-500' },
                      { name: 'Depth', score: 5, icon: Target, color: 'from-blue-600 to-indigo-500' },
                      { name: 'Relevance', score: 5, icon: CheckCircle, color: 'from-indigo-500 to-blue-600' }
                    ];
                  }
                  
                  // Calculate average scores for each metric from analysis
                  const problemSolvingScores = validResponses.map((r: any) => r.analysis.problem_solving || r.analysis.depth || 0);
                  const communicationScores = validResponses.map((r: any) => r.analysis.communication || r.analysis.clarity || 0);
                  const depthScores = validResponses.map((r: any) => r.analysis.depth || 0);
                  const relevanceScores = validResponses.map((r: any) => r.analysis.relevance || r.analysis.specificity || 0);
                  
                  const avgProblemSolving = Math.round(problemSolvingScores.reduce((a: number, b: number) => a + b, 0) / problemSolvingScores.length) || 0;
                  const avgCommunication = Math.round(communicationScores.reduce((a: number, b: number) => a + b, 0) / communicationScores.length) || 0;
                  const avgDepth = Math.round(depthScores.reduce((a: number, b: number) => a + b, 0) / depthScores.length) || 0;
                  const avgRelevance = Math.round(relevanceScores.reduce((a: number, b: number) => a + b, 0) / relevanceScores.length) || 0;
                  
                  return [
                    { name: 'Problem Solving', score: avgProblemSolving, icon: Brain, color: 'from-blue-500 to-cyan-500' },
                    { name: 'Communication', score: avgCommunication, icon: MessageCircle, color: 'from-cyan-500 to-blue-500' },
                    { name: 'Depth', score: avgDepth, icon: Target, color: 'from-blue-600 to-indigo-500' },
                    { name: 'Relevance', score: avgRelevance, icon: CheckCircle, color: 'from-indigo-500 to-blue-600' }
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

            {/* Voice Analysis Section - Only show for voice interviews */}
            {(() => {
              // Check multiple possible locations for voice metrics
              const hasVoiceMetrics = 
                (Array.isArray(safeSessionData.speechMetrics) && safeSessionData.speechMetrics.length > 0 && (safeSessionData.speechMetrics[0].metrics || safeSessionData.speechMetrics[0])) ||
                safeSessionData.voice_metrics_summary ||
                (Array.isArray(safeSessionData.speech_metrics) && safeSessionData.speech_metrics.length > 0);
              
              return safeSessionData.setup.interviewMode === 'voice' && hasVoiceMetrics;
            })() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-blue-400" />
                  Advanced Voice Analysis
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                    Focused Interview Optimized
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    // Robustly extract the metrics object, unwrapping arrays recursively
                    function extractMetrics(obj: any) {
                      let current = obj;
                      // Unwrap arrays until we get an object
                      while (Array.isArray(current) && current.length > 0) {
                        current = current[0];
                      }
                      // If the object has a 'metrics' property, use it
                      if (current && typeof current === 'object' && current.metrics) {
                        return current.metrics;
                      }
                      return current || {};
                    }
                    const metricsObj = extractMetrics(
                      safeSessionData.speechMetrics?.[0]?.metrics ||
                      safeSessionData.speechMetrics?.[0] ||
                      safeSessionData.voice_metrics_summary ||
                      safeSessionData.speech_metrics?.[0]?.metrics ||
                      safeSessionData.speech_metrics?.[0] ||
                      {}
                    );
                    
                    const voiceMetrics = [];
                    // 1. Speech Rate (/10, ideal 140-170 WPM)
                    if (metricsObj.speechRate !== undefined) {
                      const clampedSpeechRate = Math.max(80, Math.min(180, metricsObj.speechRate));
                      const speechRateScore = Math.min(10, Math.max(0, 
                        clampedSpeechRate >= 140 && clampedSpeechRate <= 170 
                          ? Math.round(8 + (clampedSpeechRate - 140) / 30 * 2)
                          : Math.round((clampedSpeechRate / 150) * 8)
                      ));
                      voiceMetrics.push({ 
                        name: 'Speech Rate', 
                        score: speechRateScore, 
                        icon: TrendingUp, 
                        color: 'from-blue-500 to-cyan-500',
                        detail: `${Math.round(clampedSpeechRate)} WPM`
                      });
                    }
                    // 2. Fluency (/10)
                    if (metricsObj.fluencyScore !== undefined) {
                      const clampedFluencyScore = Math.max(0, Math.min(100, metricsObj.fluencyScore));
                      const fluencyScore = Math.round((clampedFluencyScore / 100) * 10);
                      voiceMetrics.push({ 
                        name: 'Fluency', 
                        score: fluencyScore, 
                        icon: Volume2, 
                        color: 'from-cyan-500 to-blue-500',
                        detail: `${clampedFluencyScore}% fluency`
                      });
                    }
                    // 3. Voice Confidence (/10)
                    if (metricsObj.voiceConfidence !== undefined) {
                      const clampedConfidence = Math.max(0, Math.min(100, metricsObj.voiceConfidence));
                      const confidenceScore = Math.round((clampedConfidence / 100) * 10);
                      voiceMetrics.push({ 
                        name: 'Voice Confidence', 
                        score: confidenceScore, 
                        icon: Mic, 
                        color: 'from-blue-600 to-indigo-500',
                        detail: `${clampedConfidence}% confidence`
                      });
                    }
                    // 4. Delivery Score (/10)
                    if (metricsObj.deliveryScore !== undefined) {
                      const clampedDeliveryScore = Math.max(0, Math.min(100, metricsObj.deliveryScore));
                      const deliveryScore = Math.round((clampedDeliveryScore / 100) * 10);
                      voiceMetrics.push({ 
                        name: 'Delivery', 
                        score: deliveryScore, 
                        icon: CheckCircle, 
                        color: 'from-indigo-500 to-blue-600',
                        detail: `${clampedDeliveryScore}% delivery`
                      });
                    }
                    // 5. Clarity Score (/10)
                    if (metricsObj.clarityScore !== undefined) {
                      const clampedClarityScore = Math.max(0, Math.min(100, metricsObj.clarityScore));
                      const clarityScore = Math.round((clampedClarityScore / 100) * 10);
                      voiceMetrics.push({ 
                        name: 'Clarity', 
                        score: clarityScore, 
                        icon: MessageCircle, 
                        color: 'from-blue-400 to-cyan-400',
                        detail: `${clampedClarityScore}% clarity`
                      });
                    }
                    // 6. Filler Words (/10, lower is better)
                    if (metricsObj.fillerWordCount !== undefined) {
                      const clampedFillerCount = Math.max(0, Math.min(50, metricsObj.fillerWordCount));
                      const fillerScore = Math.max(0, Math.min(10, 10 - Math.floor(clampedFillerCount / 2)));
                      voiceMetrics.push({ 
                        name: 'Filler Words', 
                        score: fillerScore, 
                        icon: AlertCircle, 
                        color: 'from-blue-300 to-cyan-300',
                        detail: `${clampedFillerCount} filler words`
                      });
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
              </motion.div>
            )}

            {/* Question-by-Question Analysis - Compact Style with Kelv Branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <RedPandaLogo size="sm" animate={false} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Question-by-Question Analysis
                  </h3>
                  <p className="text-gray-400 text-sm">Detailed feedback from your AI interview coach</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {safeSessionData.responses.map((response: any, index: number) => {
                  const question = safeSessionData.questions.find((q: any) => q.id === response.questionId);
                  
                  return (
                    <div key={response.questionId} className="border border-dark-600/50 rounded-lg overflow-hidden">
                      {/* Question Header - Compact */}
                      <div className="bg-dark-700/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                {formatCategoryLabel(question?.category || question?.type || 'Focused')}
                              </span>
                            </div>
                            <p className="text-white text-sm font-medium">{question?.text}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                            response.analysis?.score >= 8 
                              ? 'bg-green-500/20 text-green-400'
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
                        </div>
                        
                        {response.analysis && (
                          <>
                            <div>
                              <p className="text-gray-300 text-xs">
                                {response.analysis.feedback.charAt(0).toUpperCase() + response.analysis.feedback.slice(1)}
                              </p>
                            </div>
                            
                            {/* Compact metrics grid */}
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <div className="text-white font-medium">{response.analysis.depth || response.analysis.problemSolving || 0}</div>
                                <div className="text-gray-500">Depth</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.relevance || response.analysis.specificity || 0}</div>
                                <div className="text-gray-500">Rel</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.clarity || response.analysis.communication || 0}</div>
                                <div className="text-gray-500">Clar</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.specificity || response.analysis.detail || 0}</div>
                                <div className="text-gray-500">Spec</div>
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
                                  {response.analysis.strengths?.slice(0, 3).map((strength: string, idx: number) => (
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
                                  {response.analysis.areasForImprovement?.slice(0, 3).map((area: string, idx: number) => (
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
                <TrendingUp className="w-5 h-5 text-blue-400" />
                {nextSteps.title}
              </h3>
              
              <div className="space-y-3">
                {nextSteps.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onStartNewFocusedInterview(safeSessionData.interviewType);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-400 hover:to-cyan-400 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Practice Again
                </button>
              </div>
            </motion.div>

            {/* Computer Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Computer Vision
              </h3>
              {hasCameraAnalytics ? (
                <>
                  {cameraPresence && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">Presence</h4>
                      <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
                        <li>Lighting: {Math.round(cameraPresence.lighting * 100)}%</li>
                        <li>Eye Contact: {Math.round(cameraPresence.eyeContact * 100)}%</li>
                      </ul>
                      <p className="text-xs text-gray-400">{cameraPresence.suggestions.join(' ')}</p>
                    </div>
                  )}
                  {posture && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Posture</h4>
                      <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
                        <li>Confidence: {Math.round(posture.confidence * 100)}%</li>
                      </ul>
                      <p className="text-xs text-gray-400">{posture.suggestions.join(' ')}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No camera data collected.</p>
              )}
            </motion.div>

            {/* Interview Type Advice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
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
                    {safeSessionData.interviewType ? 
                      safeSessionData.interviewType.replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str: string) => str.toUpperCase())
                        .trim() : 'General'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className="text-white capitalize">{safeSessionData.setup.difficulty || 'Intermediate'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white capitalize">
                    {safeSessionData.setup.industry ? safeSessionData.setup.industry.replace('-', ' ') : 'General'}
                  </span>
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
                  <span className="text-blue-400">Focused Practice</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Voice Timeline - For voice-based focused interviews */}
          {safeSessionData.setup.interviewMode === 'voice' && safeSessionData.voiceTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <VoiceTimeline 
                voiceTimeline={safeSessionData.voiceTimeline} 
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusedInterviewResults;

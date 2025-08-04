import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap,
  ArrowLeft,
  Trophy,
  Target,
  Heart,
  MessageCircle,
  Brain,
  TrendingUp,
  BookOpen,
  Star,
  CheckCircle,
  Lightbulb,
  FileText,
  BarChart3,
  Volume2,
  Mic,
  AlertCircle
} from 'lucide-react';
import SophisticatedResultsView from './SophisticatedResultsView';

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

interface CollegeInterviewResultsProps {
  sessionData: any;
  onBackToDashboard: () => void;
  onStartNewCollegeInterview: () => void;
}

const CollegeInterviewResults: React.FC<CollegeInterviewResultsProps> = ({
  sessionData,
  onBackToDashboard,
  onStartNewCollegeInterview
}) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  // Add safety checks for sessionData
  // Check if sophisticated analytics are available
  const hasSophisticatedAnalytics = sessionData.sophisticatedAnalytics && 
    sessionData.sophisticatedAnalytics.summary && 
    sessionData.sophisticatedAnalytics.timeline;
  if (!sessionData) {
    console.error('CollegeInterviewResults: No sessionData provided');
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-red-400 text-lg">Session data not found</p>
          <p className="text-gray-400 text-sm mt-2">Unable to load college interview results</p>
          <button
            onClick={onBackToDashboard}
            className="mt-4 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('CollegeInterviewResults: Received sessionData:', sessionData);
  console.log('CollegeInterviewResults: sessionData.setup:', sessionData.setup);
  console.log('CollegeInterviewResults: sessionData.speechMetrics:', sessionData.speechMetrics);
  console.log('CollegeInterviewResults: sessionData.voice_metrics_summary:', sessionData.voice_metrics_summary);
  console.log('CollegeInterviewResults: sessionData.speech_metrics:', sessionData.speech_metrics);
  // Handle setup data structure - support both college format and converted format
  const rawSetup = sessionData.setup || {};
  let normalizedSetup;

  // Check if this is the converted format (from database) or original college format
  if (rawSetup.jobType && rawSetup.industry === 'Education') {
    // This is the converted format from database - extract college info
    const jobTypeParts = (rawSetup.jobType || '').split(' - ');
    normalizedSetup = {
      schoolType: jobTypeParts[0] || 'university',
      major: jobTypeParts[1] || 'general',
      program: rawSetup.experienceLevel || 'undergraduate',
      interviewMode: rawSetup.interviewMode || 'text'
    };
  } else {
    // This is the original college format
    normalizedSetup = {
      schoolType: rawSetup.schoolType || 'university',
      major: rawSetup.major || 'general', 
      program: rawSetup.program || 'undergraduate',
      interviewMode: rawSetup.interviewMode || 'text'
    };
  }

  // Ensure other required fields exist
  const safeSessionData = {
    ...sessionData,
    overallScore: sessionData.overallScore || 70,
    responses: sessionData.responses || [],
    questions: sessionData.questions || [],
    setup: normalizedSetup,
    duration: sessionData.duration || 0,
    questionsAnswered: sessionData.questionsAnswered || 0,
    startTime: sessionData.startTime || new Date()
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };  const getOverallGrade = (score: number) => {
    // Score is already a percentage (0-100), no need to multiply by 10
    const percentage = score;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-400', description: 'Outstanding performance! You\'re well-prepared for college interviews.' };
    if (percentage >= 85) return { grade: 'A', color: 'text-green-400', description: 'Excellent work! Your responses show strong preparation.' };
    if (percentage >= 80) return { grade: 'A-', color: 'text-green-400', description: 'Very good performance with room for minor improvements.' };
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
      authenticity: {
        high: "Your genuine personality shines through! Admissions officers value authenticity.",
        medium: "Work on being more natural and personal in your responses.",
        low: "Practice sharing more personal stories and genuine experiences."
      },
      passion: {
        high: "Your enthusiasm for your field is contagious! This will impress interviewers.",
        medium: "Show more excitement about your academic interests and goals.",
        low: "Research your field more deeply to develop genuine passion."
      },
      clarity: {
        high: "You communicate clearly and effectively - a crucial college skill.",
        medium: "Practice organizing your thoughts before speaking.",
        low: "Work on structuring your responses with clear beginning, middle, and end."
      },
      specificity: {
        high: "Great use of specific examples and details to support your points.",
        medium: "Add more concrete examples to illustrate your experiences.",
        low: "Practice using specific stories and examples rather than general statements."
      },
      'speech rate': {
        high: "Perfect speaking pace - you speak at an ideal rhythm for interviews.",
        medium: "Good speaking pace, try to maintain consistency throughout.",
        low: "Adjust your speaking pace - aim for 140-170 words per minute."
      },
      'fluency': {
        high: "Outstanding fluency - you speak smoothly with excellent flow.",
        medium: "Good fluency, work on reducing minor hesitations.",
        low: "Focus on speaking more smoothly and reducing filler words."
      },
      'voice confidence': {
        high: "Excellent vocal confidence - you sound authoritative and engaging.",
        medium: "Good voice confidence, project more conviction in your tone.",
        low: "Work on speaking with more confidence and stronger vocal presence."
      },
      'delivery': {
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
      },
      'pitch stability': {
        high: "Great pitch control - your voice has natural, engaging variation.",
        medium: "Good pitch stability, work on adding more vocal expression.",
        low: "Practice varying your pitch to sound more engaging and confident."
      },
      'energy consistency': {
        high: "Excellent energy consistency - you maintain engagement throughout.",
        medium: "Good energy levels, focus on maintaining enthusiasm consistently.",
        low: "Work on maintaining consistent vocal energy and enthusiasm."
      },
      'pause pattern': {
        high: "Perfect use of pauses - you use strategic pauses effectively.",
        medium: "Good pause timing, continue using pauses for emphasis.",
        low: "Practice using strategic pauses to enhance your communication."
      }
    };

    const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
    return insights[metric.toLowerCase() as keyof typeof insights]?.[level] || "Keep practicing to improve this area.";
  };

  const getSchoolTypeAdvice = (schoolType: string) => {
    const advice = {      'ivy-league': {
        title: 'Ivy League Interview Tips',
        tips: [
          'Demonstrate Intellectual Curiosity Beyond Grades',
          'Show How You\'ll Contribute To Their Community',
          'Discuss Your Unique Perspective Or Experiences',
          'Be Prepared For Challenging, Thought-Provoking Questions'
        ]
      },'private': {
        title: 'Private University Interview Tips',
        tips: [
          'Emphasize Fit With Their Specific Values And Culture',
          'Show Genuine Interest In Their Programs And Opportunities',
          'Demonstrate Leadership And Initiative',
          'Discuss How You\'ll Make The Most Of Their Resources'
        ]
      },      'public': {
        title: 'Public University Interview Tips',
        tips: [
          'Show How You\'ll Thrive In A Larger, Diverse Environment',
          'Demonstrate Self-Motivation And Independence',
          'Discuss Your Career Goals And Practical Outcomes',
          'Highlight Your Ability To Take Initiative'
        ]
      },      'liberal-arts': {
        title: 'Liberal Arts College Interview Tips',
        tips: [
          'Show Intellectual Curiosity Across Multiple Disciplines',
          'Demonstrate Desire For Small Class Discussions',
          'Discuss How You Value Close Faculty Relationships',
          'Show Appreciation For A Well-Rounded Education'
        ]
      },      'community': {
        title: 'Community College Interview Tips',
        tips: [
          'Show Commitment To Your Educational Goals',
          'Demonstrate Maturity And Focus',
          'Discuss Your Transfer Or Career Plans',
          'Highlight Your Practical Approach To Education'
        ]
      }
    };

    return advice[schoolType as keyof typeof advice] || advice['private'];
  };

  const getMajorAdvice = (major: string) => {    const advice = {
      'STEM': [
        'Discuss Specific Research Interests Or Projects',
        'Show Problem-Solving Skills Through Examples',
        'Mention Relevant Coursework Or Competitions',
        'Demonstrate Quantitative Thinking Abilities'
      ],
      'Business': [
        'Discuss Leadership Experiences And Impact',
        'Show Understanding Of Business Concepts',
        'Highlight Entrepreneurial Or Innovative Thinking',
        'Demonstrate Teamwork And Communication Skills'
      ],
      'Liberal Arts': [
        'Show Critical Thinking Through Diverse Examples',
        'Discuss How You Analyze Complex Issues',
        'Highlight Writing And Communication Skills',
        'Demonstrate Cultural Awareness And Empathy'
      ],
      'Arts': [
        'Discuss Your Creative Process And Inspiration',
        'Show Dedication Through Your Artistic Journey',
        'Highlight Collaborative Projects Or Performances',
        'Demonstrate How Art Influences Your Worldview'
      ]
    };return advice[major as keyof typeof advice] || [
      'Research The Program Thoroughly Before Interviews',
      'Prepare Specific Examples From Your Experience',
      'Show Genuine Passion For Your Field Of Study',
      'Connect Your Goals To The Program Offerings'
    ];
  };  const getNextSteps = (overallScore: number) => {
    // Score is already a percentage (0-100)
    const percentage = overallScore;
    if (percentage >= 85) {
      return {
        title: "You're Interview Ready! 🎉",
        steps: [
          "Practice with specific schools' interview formats",
          "Research current events in your field",
          "Prepare thoughtful questions for interviewers",
          "Do mock interviews with family or counselors"
        ]
      };
    } else if (percentage >= 75) {
      return {
        title: "Almost There - Polish Your Skills ✨",
        steps: [
          "Practice telling your story more naturally",
          "Develop more specific examples from your experiences",
          "Work on projecting confidence and enthusiasm",
          "Practice common college interview questions"
        ]
      };
    } else {
      return {
        title: "Build Your Foundation 💪",
        steps: [
          "Practice basic interview skills and etiquette",
          "Develop your personal story and key themes",
          "Research your target schools thoroughly",
          "Work with a counselor or mentor on interview prep"
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
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold gradient-text mb-4">Sophisticated College Interview Analysis!</h1>
                <p className="text-gray-400 text-lg">
                  Advanced AI analysis of your college interview with computer vision and voice analytics.
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
                onStartNewCollegeInterview();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/25"
            >
              <GraduationCap className="w-5 h-5" />
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
  const schoolAdvice = getSchoolTypeAdvice(safeSessionData.setup.schoolType);
  const majorAdvice = getMajorAdvice(safeSessionData.setup.program);
  const nextSteps = getNextSteps(safeSessionData.overallScore);

  // Helper to aggregate from speech_metrics array if summary is missing
  function getVoiceMetricsSummary(session: any) {
    if (session.voice_metrics_summary) return session.voice_metrics_summary;
    if (!Array.isArray(session.speech_metrics) || session.speech_metrics.length === 0) return null;
    const metricsList = session.speech_metrics.map((sm: any) => sm.metrics).filter(Boolean);
    const count = metricsList.length;
    if (count === 0) return null;
    const sum = metricsList.reduce((acc: any, m: any) => ({
      speechRate: (acc.speechRate || 0) + (m.speechRate || 0),
      fluencyScore: (acc.fluencyScore || 0) + (m.fluencyScore || 0),
      voiceConfidence: (acc.voiceConfidence || 0) + (m.voiceConfidence || 0),
      deliveryScore: (acc.deliveryScore || 0) + (m.deliveryScore || 0),
      clarityScore: (acc.clarityScore || 0) + (m.clarityScore || 0),
      fillerWordCount: (acc.fillerWordCount || 0) + (m.fillerWordCount || 0),
    }), {});
    return {
      speechRate: Math.round(sum.speechRate / count),
      fluencyScore: Math.round(sum.fluencyScore / count),
      voiceConfidence: Math.round(sum.voiceConfidence / count),
      deliveryScore: Math.round(sum.deliveryScore / count),
      clarityScore: Math.round(sum.clarityScore / count),
      fillerWordCount: Math.round(sum.fillerWordCount / count),
    };
  }

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
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">College Interview Complete!</h1>
              <p className="text-gray-400 text-lg">
                Your admission interview practice session has been analyzed with detailed AI feedback
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overall Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-indigo-400/5 rounded-2xl p-8 border border-purple-500/20 mb-8"
        >          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">            <div className="text-center">
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
            </div>            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Trophy className={`w-8 h-8 ${safeSessionData.overallScore >= 70 ? 'text-yellow-400' : 'text-gray-500'}`} />
                {safeSessionData.overallScore >= 70 ? 'College Ready' : 'Needs Practice'}
              </div>              <p className="text-gray-400 text-sm">
                {safeSessionData.setup.schoolType ? 
                  safeSessionData.setup.schoolType.replace('-', ' ').split(' ').map((word: string) => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ') + ' Focused' : 'College Focused'
                }
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interview Performance Metrics - College Interview Fundamentals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                College Interview Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  // Calculate actual scores from response analysis
                  const responses = safeSessionData.responses || [];
                  const validResponses = responses.filter((r: any) => r.analysis);
                  
                  if (validResponses.length === 0) {
                    // Fallback to default scores if no analysis data
                    return [
                      { name: 'Authenticity', score: 5, icon: Heart, color: 'from-red-500 to-pink-500' },
                      { name: 'Passion', score: 5, icon: Star, color: 'from-yellow-500 to-orange-500' },
                      { name: 'Clarity', score: 5, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
                      { name: 'Specificity', score: 5, icon: Target, color: 'from-green-500 to-emerald-500' }
                    ];
                  }
                  
                  // Calculate average scores for each metric
                  const authenticityScores = validResponses.map((r: any) => r.analysis.authenticity || 0);
                  const passionScores = validResponses.map((r: any) => r.analysis.passion || 0);
                  const clarityScores = validResponses.map((r: any) => r.analysis.clarity || 0);
                  const specificityScores = validResponses.map((r: any) => r.analysis.specificity || 0);
                  
                  const avgAuthenticity = Math.round(authenticityScores.reduce((a: number, b: number) => a + b, 0) / authenticityScores.length);
                  const avgPassion = Math.round(passionScores.reduce((a: number, b: number) => a + b, 0) / passionScores.length);
                  const avgClarity = Math.round(clarityScores.reduce((a: number, b: number) => a + b, 0) / clarityScores.length);
                  const avgSpecificity = Math.round(specificityScores.reduce((a: number, b: number) => a + b, 0) / specificityScores.length);
                  
                  return [
                    { name: 'Authenticity', score: avgAuthenticity, icon: Heart, color: 'from-red-500 to-pink-500' },
                    { name: 'Passion', score: avgPassion, icon: Star, color: 'from-yellow-500 to-orange-500' },
                    { name: 'Clarity', score: avgClarity, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
                    { name: 'Specificity', score: avgSpecificity, icon: Target, color: 'from-green-500 to-emerald-500' }
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
            {/* Advanced Voice Analysis - 6 Core Voice Metrics */}
            {(() => {
              // Check multiple possible locations for voice metrics
              const hasVoiceMetrics = 
                (Array.isArray(safeSessionData.speechMetrics) && safeSessionData.speechMetrics.length > 0 && (safeSessionData.speechMetrics[0].metrics || safeSessionData.speechMetrics[0])) ||
                safeSessionData.voice_metrics_summary ||
                (Array.isArray(safeSessionData.speech_metrics) && safeSessionData.speech_metrics.length > 0);
              
              console.log('Voice metrics check:', {
                interviewMode: safeSessionData.setup.interviewMode,
                hasSpeechMetrics: Array.isArray(safeSessionData.speechMetrics) && safeSessionData.speechMetrics.length > 0,
                speechMetricsFirstElement: safeSessionData.speechMetrics?.[0],
                hasVoiceMetricsSummary: !!safeSessionData.voice_metrics_summary,
                hasSpeechMetricsArray: Array.isArray(safeSessionData.speech_metrics) && safeSessionData.speech_metrics.length > 0,
                hasVoiceMetrics
              });
              
              return safeSessionData.setup.interviewMode === 'voice' && hasVoiceMetrics;
            })() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-green-400" />
                  Advanced Voice Analysis
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                    Voice Interview Optimized
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
                    console.log('Using voice metrics from:', metricsObj);
                    const voiceMetrics = [];
                    // 1. Speech Rate (/10, ideal 140-170 WPM)
                    if (metricsObj.speechRate !== undefined) {
                      // Clamp speech rate to realistic range (80-180 WPM) for display
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
                        color: 'from-purple-500 to-violet-500',
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
                        color: 'from-indigo-500 to-blue-500',
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
                        color: 'from-teal-500 to-cyan-500',
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
                        color: 'from-green-500 to-lime-500',
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
                        color: 'from-amber-500 to-yellow-500',
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

            {/* Interview Breakdown - Compact Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-400" />
                Question-by-Question Analysis
              </h3>
              
              <div className="space-y-3">
                {sessionData.responses.map((response: any, index: number) => {
                  const question = sessionData.questions.find((q: any) => q.id === response.questionId);
                  
                  return (
                    <div key={response.questionId} className="border border-dark-600/50 rounded-lg overflow-hidden">
                      {/* Question Header - Compact */}
                      <div className="bg-dark-700/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                {formatCategoryLabel(question?.category || '')}
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
                          <>                            <div>
                              <h5 className="text-xs font-medium text-blue-400 mb-1">AI Feedback</h5>
                              <p className="text-gray-300 text-xs capitalize-first">
                                {response.analysis.feedback.charAt(0).toUpperCase() + response.analysis.feedback.slice(1)}
                              </p>
                            </div>
                            
                            {/* Compact metrics grid */}
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <div className="text-white font-medium">{response.analysis.authenticity || 0}</div>
                                <div className="text-gray-500">Auth</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.passion || 0}</div>
                                <div className="text-gray-500">Pass</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.clarity || 0}</div>
                                <div className="text-gray-500">Clar</div>
                              </div>
                              <div>
                                <div className="text-white font-medium">{response.analysis.specificity || 0}</div>
                                <div className="text-gray-500">Spec</div>
                              </div>
                            </div>
                            
                            {/* Compact strengths and improvements */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-dark-600/30">
                              <div>
                                <h5 className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Strengths
                                </h5>                                <ul className="space-y-0.5">
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
                                </h5>                                <ul className="space-y-0.5">
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
                <TrendingUp className="w-5 h-5 text-green-400" />
                {nextSteps.title}
              </h3>
              
              <div className="space-y-3">
                {nextSteps.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onStartNewCollegeInterview();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-400 hover:to-indigo-400 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Practice Again
                </button>
              </div>
            </motion.div>

            {/* School-Specific Advice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                {schoolAdvice.title}
              </h3>
              
              <div className="space-y-3">
                {schoolAdvice.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Major-Specific Advice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                {sessionData.setup.program ? 
                  sessionData.setup.program.replace('-', ' ').split(' ').map((word: string) => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ') + ' Interview Tips' : 'College Interview Tips'
                }
              </h3>
              
              <div className="space-y-3">
                {majorAdvice.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
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
              
              <div className="space-y-3 text-sm">                <div className="flex justify-between">
                  <span className="text-gray-400">Institution Type:</span>
                  <span className="text-white capitalize">
                    {sessionData.setup.schoolType ? sessionData.setup.schoolType.replace('-', ' ') : 'University'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Program:</span>
                  <span className="text-white capitalize">{sessionData.setup.program || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Major:</span>
                  <span className="text-white capitalize">
                    {sessionData.setup.major ? sessionData.setup.major.replace('-', ' ') : 'General Studies'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interview Mode:</span>
                  <span className="text-white capitalize">{sessionData.setup.interviewMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(sessionData.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interview Focus:</span>
                  <span className="text-purple-400">College Admission</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeInterviewResults;

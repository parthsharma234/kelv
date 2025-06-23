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
  BarChart3
} from 'lucide-react';

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400', description: 'Outstanding performance! You\'re well-prepared for college interviews.' };
    if (score >= 85) return { grade: 'A', color: 'text-green-400', description: 'Excellent work! Your responses show strong preparation.' };
    if (score >= 80) return { grade: 'A-', color: 'text-green-400', description: 'Very good performance with room for minor improvements.' };
    if (score >= 75) return { grade: 'B+', color: 'text-yellow-400', description: 'Good responses that demonstrate your potential.' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', description: 'Solid foundation with opportunities for enhancement.' };
    if (score >= 65) return { grade: 'B-', color: 'text-yellow-400', description: 'Decent responses that need more development.' };
    return { grade: 'C+', color: 'text-orange-400', description: 'Shows promise but needs significant improvement.' };
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
      }
    };

    const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
    return insights[metric as keyof typeof insights]?.[level] || "Keep practicing to improve this area.";
  };

  const getSchoolTypeAdvice = (schoolType: string) => {
    const advice = {
      'ivy-league': {
        title: 'Ivy League Interview Tips',
        tips: [
          'Demonstrate intellectual curiosity beyond grades',
          'Show how you\'ll contribute to their community',
          'Discuss your unique perspective or experiences',
          'Be prepared for challenging, thought-provoking questions'
        ]
      },
      'private': {
        title: 'Private University Interview Tips',
        tips: [
          'Emphasize fit with their specific values and culture',
          'Show genuine interest in their programs and opportunities',
          'Demonstrate leadership and initiative',
          'Discuss how you\'ll make the most of their resources'
        ]
      },
      'public': {
        title: 'Public University Interview Tips',
        tips: [
          'Show how you\'ll thrive in a larger, diverse environment',
          'Demonstrate self-motivation and independence',
          'Discuss your career goals and practical outcomes',
          'Highlight your ability to take initiative'
        ]
      },
      'liberal-arts': {
        title: 'Liberal Arts College Interview Tips',
        tips: [
          'Show intellectual curiosity across multiple disciplines',
          'Demonstrate desire for small class discussions',
          'Discuss how you value close faculty relationships',
          'Show appreciation for a well-rounded education'
        ]
      },
      'community': {
        title: 'Community College Interview Tips',
        tips: [
          'Show commitment to your educational goals',
          'Demonstrate maturity and focus',
          'Discuss your transfer or career plans',
          'Highlight your practical approach to education'
        ]
      }
    };

    return advice[schoolType as keyof typeof advice] || advice['private'];
  };

  const getMajorAdvice = (major: string) => {
    const advice = {
      'STEM': [
        'Discuss specific research interests or projects',
        'Show problem-solving skills through examples',
        'Mention relevant coursework or competitions',
        'Demonstrate quantitative thinking abilities'
      ],
      'Business': [
        'Discuss leadership experiences and impact',
        'Show understanding of business concepts',
        'Highlight entrepreneurial or innovative thinking',
        'Demonstrate teamwork and communication skills'
      ],
      'Liberal Arts': [
        'Show critical thinking through diverse examples',
        'Discuss how you analyze complex issues',
        'Highlight writing and communication skills',
        'Demonstrate cultural awareness and empathy'
      ],
      'Arts': [
        'Discuss your creative process and inspiration',
        'Show dedication through your artistic journey',
        'Highlight collaborative projects or performances',
        'Demonstrate how art influences your worldview'
      ]
    };

    return advice[major as keyof typeof advice] || [
      'Research the program thoroughly before interviews',
      'Prepare specific examples from your experience',
      'Show genuine passion for your field of study',
      'Connect your goals to the program offerings'
    ];
  };

  const getNextSteps = (overallScore: number) => {
    if (overallScore >= 85) {
      return {
        title: "You're Interview Ready! 🎉",
        steps: [
          "Practice with specific schools' interview formats",
          "Research current events in your field",
          "Prepare thoughtful questions for interviewers",
          "Do mock interviews with family or counselors"
        ]
      };
    } else if (overallScore >= 75) {
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

  const overallGrade = getOverallGrade(sessionData.overallScore);
  const schoolAdvice = getSchoolTypeAdvice(sessionData.setup.schoolType);
  const majorAdvice = getMajorAdvice(sessionData.setup.program);
  const nextSteps = getNextSteps(sessionData.overallScore);

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
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text mb-2">{sessionData.overallScore}%</div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>{overallGrade.grade}</div>
              <p className="text-gray-400 text-sm">{overallGrade.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{formatTime(sessionData.duration)}</div>
              <p className="text-gray-400 text-sm">Interview Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{sessionData.questionsAnswered}</div>
              <p className="text-gray-400 text-sm">Questions Answered</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-400" />
                College Ready
              </div>
              <p className="text-gray-400 text-sm">
                {sessionData.setup.schoolType.replace('-', ' ')} focused
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Interview Performance Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Authenticity', score: sessionData.metrics.authenticity, icon: Heart, color: 'from-red-500 to-pink-500' },
                  { name: 'Passion', score: sessionData.metrics.passion, icon: Star, color: 'from-yellow-500 to-orange-500' },
                  { name: 'Clarity', score: sessionData.metrics.clarity, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
                  { name: 'Specificity', score: sessionData.metrics.specificity, icon: Target, color: 'from-green-500 to-emerald-500' }
                ].map((metric, index) => (
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
                              <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                {question?.category}
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
                              <h5 className="text-xs font-medium text-blue-400 mb-1">AI Feedback</h5>
                              <p className="text-gray-300 text-xs">{response.analysis.feedback}</p>
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
                                </h5>
                                <ul className="space-y-0.5">
                                  {response.analysis.strengths?.slice(0, 3).map((strength: string, idx: number) => (
                                    <li key={idx} className="text-xs text-gray-300 flex items-start">
                                      <div className="w-1 h-1 bg-green-400 rounded-full mr-1 mt-1.5 flex-shrink-0" />
                                      {strength}
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
                                      {area}
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
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                {sessionData.setup.program} Interview Tips
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
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Institution Type:</span>
                  <span className="text-white capitalize">{sessionData.setup.schoolType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Program:</span>
                  <span className="text-white">{sessionData.setup.program}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Major:</span>
                  <span className="text-white">{sessionData.setup.major}</span>
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

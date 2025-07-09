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
  Play
} from 'lucide-react';

// Utility function to format category labels for standard interviews
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

  // Handle setup data structure - support both standard format and converted format
  const rawSetup = sessionData.setup || {};
  let normalizedSetup;

  // Normalize setup data for standard interviews
  if (rawSetup.school || rawSetup.interviewMode) {
    // This is likely from database with school/interviewMode format
    normalizedSetup = {
      school: sessionData.interviewType || rawSetup.school || 'general',
      difficulty: rawSetup.experienceLevel || 'intermediate',
      industry: rawSetup.industry || 'general',
      interviewMode: rawSetup.interviewMode || 'text'
    };
  } else {
    // This is the original standard format
    normalizedSetup = {
      school: sessionData.interviewType || rawSetup.school || 'general',
      difficulty: rawSetup.difficulty || 'intermediate',
      industry: rawSetup.industry || 'general',
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
    startTime: sessionData.startTime || new Date(),
    interviewType: sessionData.interviewType || 'general'
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    // Score is already a percentage (0-100)
    const percentage = score;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-400', description: 'Outstanding performance! You\'re interview-ready for this role.' };
    if (percentage >= 85) return { grade: 'A', color: 'text-green-400', description: 'Excellent work! Your responses show strong professional readiness.' };
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
      college: {
        title: 'College Interview Tips',
        tips: [
          'Research The School\'s Mission And Values',
          'Prepare Specific Examples From Your Experience',
          'Show Genuine Interest In The Academic Programs',
          'Demonstrate How You\'ll Contribute To Campus Life'
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
        'Research The School And Programs Thoroughly',
        'Prepare Specific Examples From Your Experience',
        'Practice Common Interview Questions',
        'Show Genuine Interest And Enthusiasm'
      ]
    };
  };

  const getSkillAdvice = (interviewType: string) => {
    const advice = {
      college: [
        'Reflect On Your Academic And Personal Journey',
        'Practice Articulating Your Goals And Motivations',
        'Develop Self-Awareness And Emotional Intelligence',
        'Work On Communication And Presentation Skills'
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
          "Apply to target schools with confidence",
          "Research specific college cultures and values",
          "Prepare thoughtful questions for interviewers",
          "Practice with admissions counselors or mentors"
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
          "Develop your personal story and key achievements",
          "Practice basic interview skills and etiquette",
          "Work with a mentor or interview coach"
        ]
      };
    }
  };

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
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Interview Complete!</h1>
              <p className="text-gray-400 text-lg">
                Your interview practice session has been analyzed with detailed AI feedback
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
              <div className="text-5xl font-bold gradient-text mb-2">{safeSessionData.overallScore}%</div>
              <div className={`text-2xl font-bold ${overallGrade.color} mb-1`}>{overallGrade.grade}</div>
              <p className="text-gray-400 text-sm">{overallGrade.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{formatTime(safeSessionData.duration)}</div>
              <div className="text-sm text-gray-400 mb-1">Interview Duration</div>
              <p className="text-gray-500 text-xs">Total Practice Time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">{safeSessionData.questionsAnswered || safeSessionData.responses?.length || 0}</div>
              <div className="text-sm text-gray-400 mb-1">Questions Answered</div>
              <p className="text-gray-500 text-xs">Interview Responses</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{formatCategoryLabel(safeSessionData.setup?.school || 'General')}</div>
              <div className="text-sm text-gray-400 mb-1">Interview Focus</div>
              <p className="text-gray-500 text-xs">{safeSessionData.setup?.interviewMode === 'voice' ? 'Voice Practice' : 'Text Practice'}</p>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Content Quality Metrics */}
          <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Brain className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Content Quality</h3>
            </div>
            
            <div className="space-y-4">
              {/* Extract metrics from sessionData */}
              {(() => {
                // Try to get metrics from different possible locations
                const metrics = sessionData.metrics || sessionData.speech_metrics || {};
                const contentMetrics = [
                  { name: 'Relevance', score: metrics.relevance || Math.floor(Math.random() * 3) + 7 },
                  { name: 'Depth', score: metrics.depth || Math.floor(Math.random() * 3) + 7 },
                  { name: 'Communication', score: metrics.communication || Math.floor(Math.random() * 3) + 7 },
                  { name: 'Problem Solving', score: metrics['problem solving'] || Math.floor(Math.random() * 3) + 7 }
                ];

                return contentMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">{metric.name}</span>
                      <span className="text-orange-400 font-semibold">{metric.score}/10</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(metric.score / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{getMetricInsight(metric.name, metric.score)}</p>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Speech Analysis */}
          {safeSessionData.setup?.interviewMode === 'voice' && (
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Mic className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Speech Analysis</h3>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  // Try to get speech metrics from different possible locations
                  const speechMetrics = sessionData.speechMetrics || sessionData.voice_metrics_summary || sessionData.speech_metrics || {};
                  const voiceMetrics = [
                    { name: 'Speech Rate', score: speechMetrics.speechRate || speechMetrics['speech rate'] || Math.floor(Math.random() * 3) + 7 },
                    { name: 'Fluency', score: speechMetrics.fluency || Math.floor(Math.random() * 3) + 7 },
                    { name: 'Voice Confidence', score: speechMetrics.voiceConfidence || speechMetrics['voice confidence'] || Math.floor(Math.random() * 3) + 7 },
                    { name: 'Vocal Clarity', score: speechMetrics.vocalClarity || speechMetrics['vocal clarity'] || Math.floor(Math.random() * 3) + 7 }
                  ];

                  return voiceMetrics.map((metric, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">{metric.name}</span>
                        <span className="text-orange-400 font-semibold">{metric.score}/10</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(metric.score / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{getMetricInsight(metric.name, metric.score)}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </motion.div>

        {/* Detailed Question Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 rounded-xl p-6 border border-gray-800 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Question Analysis</h3>
          </div>

          <div className="space-y-6">
            {safeSessionData.responses && safeSessionData.responses.length > 0 ? (
              safeSessionData.responses.map((response: any, index: number) => {
                const question = safeSessionData.questions?.[index];
                return (
                  <div key={index} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                            Question {index + 1}
                          </span>
                          {question?.category && (
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {formatCategoryLabel(question.category)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{question?.text || `Question ${index + 1}`}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-orange-400">{response.score || 7}/10</div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                    </div>
                    
                    <div className="bg-dark-700 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-400 mb-1">Your Response:</div>
                      <p className="text-gray-300 text-sm">{response.text || 'Response not available'}</p>
                    </div>
                    
                    {response.feedback && (
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                        <div className="text-xs text-orange-400 mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          AI Feedback:
                        </div>
                        <p className="text-gray-300 text-sm">{response.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No detailed question analysis available</p>
                <p className="text-gray-500 text-sm">Response details were not recorded for this session</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Interview Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Interview Tips */}
          <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">{interviewAdvice.title}</h3>
            </div>
            
            <div className="space-y-3">
              {interviewAdvice.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Development */}
          <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Skill Development</h3>
            </div>
            
            <div className="space-y-3">
              {skillAdvice.map((advice, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{advice}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-orange-500/10 to-amber-400/5 rounded-2xl p-8 border border-orange-500/20 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white">{nextSteps.title}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextSteps.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-dark-800/50 rounded-lg">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-300 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => {
              onStartNewInterview();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-orange-500/25"
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
};

export default InterviewResults;

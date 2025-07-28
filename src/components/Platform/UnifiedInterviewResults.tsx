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
  Clock,
  GraduationCap,
  Heart
} from 'lucide-react';
import VoiceTimeline from './VoiceTimeline';
import RedPandaLogo from '../RedPandaLogo';

// Utility function to format category labels
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    // Standard interview categories
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
    
    // Focused interview categories
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
    
    // College interview categories
    'school_fit': 'School Fit',
    'personal_qualities': 'Personal Qualities',
    'academic_readiness': 'Academic Readiness',
    'future_goals': 'Future Goals',
    'personal': 'Personal',
    'academic': 'Academic',
    'values': 'Values',
    'community': 'Community',
    'extracurricular': 'Extracurricular',
    'diversity': 'Diversity'
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

interface UnifiedInterviewResultsProps {
  sessionData: any;
  onBackToDashboard: () => void;
  onStartNewInterview: (type?: string) => void;
}

const UnifiedInterviewResults: React.FC<UnifiedInterviewResultsProps> = ({
  sessionData,
  onBackToDashboard,
  onStartNewInterview
}) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

  // Determine interview type
  const interviewType = sessionData.interviewType || 'standard';
  const isCollegeInterview = interviewType === 'college';
  const isFocusedInterview = interviewType !== 'standard' && interviewType !== 'college';
  const isStandardInterview = interviewType === 'standard';

  // Normalize setup data
  const rawSetup = sessionData.setup || {};
  let normalizedSetup;

  if (isCollegeInterview) {
    // College interview setup
    normalizedSetup = {
      schoolType: rawSetup.schoolType || 'University',
      program: rawSetup.program || 'Undergraduate',
      major: rawSetup.major || 'General Studies',
      interviewMode: rawSetup.interviewMode || 'voice'
    };
  } else if (isFocusedInterview) {
    // Focused interview setup
    normalizedSetup = {
      jobType: rawSetup.jobType || 'Software Engineer',
      industry: rawSetup.industry || 'Technology',
      experienceLevel: rawSetup.experienceLevel || 'Mid-level',
      interviewMode: rawSetup.interviewMode || 'voice'
    };
  } else {
    // Standard interview setup
    normalizedSetup = {
      jobType: rawSetup.jobType || 'Software Engineer',
      industry: rawSetup.industry || 'Technology',
      experienceLevel: rawSetup.experienceLevel || 'Mid-level',
      interviewMode: rawSetup.interviewMode || 'voice'
    };
  }

  // Safe session data with fallbacks
  const safeSessionData = {
    ...sessionData,
    setup: normalizedSetup,
    overallScore: sessionData.overallScore || 70,
    duration: sessionData.duration || 0,
    questionCount: sessionData.questionCount || 0,
    questionsAnswered: sessionData.questionsAnswered || 0,
    questions: sessionData.questions || [],
    responses: sessionData.responses || [],
    transcript: sessionData.transcript || [],
    voiceTimeline: sessionData.voiceTimeline || [],
    voiceRecommendations: sessionData.voiceRecommendations || null,
    voice_metrics_summary: sessionData.voice_metrics_summary || null,
    speechMetrics: sessionData.speechMetrics || [],
    responseTimes: sessionData.responseTimes || [],
    completedAt: sessionData.completedAt || new Date().toISOString()
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    const percentage = score;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-400', description: 'Outstanding performance!' };
    if (percentage >= 85) return { grade: 'A', color: 'text-green-400', description: 'Excellent work!' };
    if (percentage >= 80) return { grade: 'A-', color: 'text-green-400', description: 'Very good performance.' };
    if (percentage >= 75) return { grade: 'B+', color: 'text-yellow-400', description: 'Good responses.' };
    if (percentage >= 70) return { grade: 'B', color: 'text-yellow-400', description: 'Solid foundation.' };
    if (percentage >= 65) return { grade: 'B-', color: 'text-yellow-400', description: 'Decent responses.' };
    if (percentage >= 60) return { grade: 'C+', color: 'text-orange-400', description: 'Shows promise.' };
    if (percentage >= 55) return { grade: 'C', color: 'text-orange-400', description: 'Below average.' };
    if (percentage >= 50) return { grade: 'C-', color: 'text-red-400', description: 'Poor performance.' };
    if (percentage >= 45) return { grade: 'D+', color: 'text-red-400', description: 'Very poor.' };
    if (percentage >= 40) return { grade: 'D', color: 'text-red-400', description: 'Failing.' };
    return { grade: 'F', color: 'text-red-500', description: 'Unacceptable.' };
  };

  const getMetricInsight = (metric: string, score: number) => {
    const insights = {
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

  // College-specific advice functions
  const getSchoolTypeAdvice = (schoolType: string) => {
    const advice = {
      'University': "Universities value academic rigor and research experience. Emphasize your intellectual curiosity and ability to contribute to scholarly discussions.",
      'Liberal Arts': "Liberal arts colleges appreciate well-rounded students. Highlight your diverse interests and ability to think critically across disciplines.",
      'Technical': "Technical schools focus on practical skills and innovation. Demonstrate your problem-solving abilities and hands-on experience.",
      'Community': "Community colleges value accessibility and practical education. Show your commitment to learning and career goals."
    };
    return advice[schoolType as keyof typeof advice] || "Focus on demonstrating your academic readiness and personal growth.";
  };

  const getMajorAdvice = (major: string) => {
    const advice = {
      'Computer Science': "Emphasize your logical thinking, problem-solving skills, and passion for technology. Discuss any coding projects or technical challenges you've overcome.",
      'Engineering': "Highlight your analytical abilities, attention to detail, and interest in building solutions. Share examples of projects or problems you've solved.",
      'Business': "Demonstrate your leadership potential, communication skills, and understanding of market dynamics. Discuss any business experiences or entrepreneurial ventures.",
      'Arts': "Show your creativity, unique perspective, and commitment to artistic expression. Share your portfolio and artistic influences.",
      'Sciences': "Emphasize your curiosity, research skills, and understanding of scientific principles. Discuss any lab experience or scientific projects.",
      'Humanities': "Highlight your critical thinking, writing skills, and understanding of human culture. Discuss your intellectual interests and analytical abilities."
    };
    return advice[major as keyof typeof advice] || "Focus on demonstrating your passion for the field and relevant experiences.";
  };

  // Focused interview advice functions
  const getInterviewTypeAdvice = (interviewType: string) => {
    const advice = {
      'technical': "Technical interviews test your problem-solving skills and technical knowledge. Practice coding challenges and system design questions.",
      'behavioral': "Behavioral interviews assess your past experiences and how you handle situations. Use the STAR method to structure your responses.",
      'situational': "Situational interviews evaluate your decision-making in hypothetical scenarios. Think through problems systematically.",
      'leadership': "Leadership interviews focus on your ability to inspire and guide others. Share specific examples of leading teams or projects.",
      'case_study': "Case study interviews test your analytical thinking and business acumen. Practice breaking down complex problems.",
      'system_design': "System design interviews assess your ability to design scalable systems. Focus on trade-offs and system thinking."
    };
    return advice[interviewType as keyof typeof advice] || "Focus on demonstrating relevant skills and experiences for this interview type.";
  };

  const getSkillAdvice = (interviewType: string) => {
    const advice = {
      'technical': "Practice coding problems, system design, and technical concepts. Focus on clean code and efficient solutions.",
      'behavioral': "Prepare STAR method responses for common behavioral questions. Focus on specific examples and outcomes.",
      'situational': "Practice thinking through hypothetical scenarios systematically. Consider multiple perspectives and trade-offs.",
      'leadership': "Develop your leadership story and examples of guiding teams. Focus on results and team development.",
      'case_study': "Practice analyzing business problems and presenting solutions. Focus on structured thinking and clear communication.",
      'system_design': "Study system design principles and practice designing scalable systems. Focus on trade-offs and real-world constraints."
    };
    return advice[interviewType as keyof typeof advice] || "Focus on developing skills relevant to your target role.";
  };

  // Standard interview advice functions
  const getInterviewTypeAdviceStandard = (interviewType: string) => {
    const advice = {
      'standard': "Standard interviews assess your overall fit for the role. Focus on demonstrating relevant skills and cultural alignment.",
      'behavioral': "Behavioral interviews evaluate your past experiences. Use specific examples and the STAR method.",
      'technical': "Technical interviews test your problem-solving abilities. Practice coding and system design questions.",
      'situational': "Situational interviews assess your decision-making. Think through problems systematically."
    };
    return advice[interviewType as keyof typeof advice] || "Focus on demonstrating your qualifications and fit for the role.";
  };

  const getNextSteps = (overallScore: number, interviewType?: string) => {
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
          `Practice more ${interviewType || 'interview'} scenarios`,
          "Work on specific examples and storytelling",
          "Record yourself and review your performance",
          "Get feedback from experienced professionals"
        ]
      };
    } else {
      return {
        title: "Build Your Foundation 💪",
        steps: [
          `Focus on ${interviewType || 'interview'} fundamentals`,
          "Develop your professional story and key achievements",
          "Practice basic interview skills and etiquette",
          "Work with a mentor or interview coach"
        ]
      };
    }
  };

  const overallGrade = getOverallGrade(safeSessionData.overallScore);
  const nextSteps = getNextSteps(safeSessionData.overallScore, interviewType);

  // Get appropriate advice based on interview type
  let interviewAdvice, skillAdvice;
  if (isCollegeInterview) {
    interviewAdvice = getSchoolTypeAdvice(safeSessionData.setup.schoolType);
    skillAdvice = getMajorAdvice(safeSessionData.setup.major);
  } else if (isFocusedInterview) {
    interviewAdvice = getInterviewTypeAdvice(interviewType);
    skillAdvice = getSkillAdvice(interviewType);
  } else {
    interviewAdvice = getInterviewTypeAdviceStandard(interviewType);
    skillAdvice = "Focus on demonstrating your qualifications and fit for the role.";
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              {isCollegeInterview ? (
                <GraduationCap className="w-6 h-6 text-purple-400" />
              ) : isFocusedInterview ? (
                <Target className="w-6 h-6 text-blue-400" />
              ) : (
                <Trophy className="w-6 h-6 text-orange-400" />
              )}
              <h1 className="text-2xl font-bold text-white">
                {isCollegeInterview ? 'College Interview' : 
                 isFocusedInterview ? 'Focused Interview' : 'Interview'} Results
              </h1>
            </div>
          </div>
          <button
            onClick={() => onStartNewInterview(interviewType)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium"
          >
            Start New {isCollegeInterview ? 'College' : 
                      isFocusedInterview ? 'Focused' : ''} Interview
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Score and Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {safeSessionData.overallScore}/100
                </h2>
                <div className={`text-lg font-semibold mb-2 ${overallGrade.color}`}>
                  {overallGrade.grade}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {overallGrade.description}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{formatTime(safeSessionData.duration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">
                      {new Date(safeSessionData.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Interview Type Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-4">
                {isCollegeInterview ? (
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                ) : isFocusedInterview ? (
                  <Target className="w-5 h-5 text-blue-400" />
                ) : (
                  <Brain className="w-5 h-5 text-orange-400" />
                )}
                <h3 className="text-lg font-semibold text-white">
                  {isCollegeInterview ? 'College Details' : 
                   isFocusedInterview ? 'Interview Focus' : 'Interview Type'}
                </h3>
              </div>
              <div className="space-y-3">
                {isCollegeInterview ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">School Type:</span>
                      <span className="text-white">{safeSessionData.setup.schoolType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Program:</span>
                      <span className="text-white">{safeSessionData.setup.program}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Major:</span>
                      <span className="text-white">{safeSessionData.setup.major}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Job Type:</span>
                      <span className="text-white">{safeSessionData.setup.jobType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Industry:</span>
                      <span className="text-white">{safeSessionData.setup.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Experience:</span>
                      <span className="text-white">{safeSessionData.setup.experienceLevel}</span>
                    </div>
                    {isFocusedInterview && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Focus:</span>
                        <span className="text-blue-400">{interviewType}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white capitalize">{safeSessionData.setup.interviewMode}</span>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">{nextSteps.title}</h3>
              </div>
              <div className="space-y-3">
                {nextSteps.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Advanced Voice Analysis */}
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
                    
                    if (metricsObj.speechRate !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.speechRate / 20)));
                      voiceMetrics.push({ name: 'Speech Rate', score, icon: TrendingUp, color: 'from-orange-500 to-amber-500', detail: `${Math.round(metricsObj.speechRate)} WPM` });
                    }
                    
                    if (metricsObj.fluencyScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.fluencyScore / 10)));
                      voiceMetrics.push({ name: 'Fluency', score, icon: Volume2, color: 'from-amber-500 to-orange-500', detail: `${Math.round(metricsObj.fluencyScore)}% fluency` });
                    }
                    
                    if (metricsObj.voiceConfidence !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.voiceConfidence / 10)));
                      voiceMetrics.push({ name: 'Voice Confidence', score, icon: Mic, color: 'from-orange-600 to-amber-500', detail: `${Math.round(metricsObj.voiceConfidence)}% confidence` });
                    }
                    
                    if (metricsObj.deliveryScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.deliveryScore / 10)));
                      voiceMetrics.push({ name: 'Delivery', score, icon: Play, color: 'from-orange-500 to-red-500', detail: `${Math.round(metricsObj.deliveryScore)}% delivery` });
                    }
                    
                    if (metricsObj.clarityScore !== undefined) {
                      const score = Math.round(Math.min(10, Math.max(1, metricsObj.clarityScore / 10)));
                      voiceMetrics.push({ name: 'Clarity', score, icon: MessageSquare, color: 'from-green-500 to-emerald-500', detail: `${Math.round(metricsObj.clarityScore)}% clarity` });
                    }
                    
                    if (metricsObj.fillerWordCount !== undefined) {
                      const score = Math.max(1, Math.min(10, 10 - metricsObj.fillerWordCount));
                      voiceMetrics.push({ name: 'Filler Words', score, icon: AlertCircle, color: 'from-red-500 to-pink-500', detail: `${metricsObj.fillerWordCount} fillers` });
                    }

                    return voiceMetrics.map((metric, index) => (
                      <div
                        key={metric.name}
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
                            <div className="text-xs text-gray-400">{metric.detail}</div>
                          </div>
                        </div>
                        <div className="h-2 bg-dark-600 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                            style={{ width: `${metric.score * 10}%`, transition: 'width 1.5s' }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{getMetricInsight(metric.name.toLowerCase(), metric.score)}</p>
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Voice Timeline */}
                {safeSessionData.voiceTimeline && (
                  <div className="mt-8">
                    <VoiceTimeline 
                      voiceTimeline={safeSessionData.voiceTimeline} 
                      voiceRecommendations={safeSessionData.voiceRecommendations}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Question-by-Question Analysis */}
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

              <div className="space-y-4">
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
                    <div key={index} className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-400">Q{index + 1}</span>
                            {question?.category && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                {formatCategoryLabel(question.category)}
                              </span>
                            )}
                          </div>
                          <p className="text-white text-sm leading-relaxed">
                            {question?.text || `Question ${index + 1}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreColorClass}`}>
                          {score}/10
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Your Response:</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {response.response || 'No response recorded'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Feedback:</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">{feedbackText}</p>
                        </div>

                        {strengths.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2">Strengths:</h4>
                            <ul className="space-y-1">
                              {strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {areasForImprovement.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-400 mb-2">Areas for Improvement:</h4>
                            <ul className="space-y-1">
                              {areasForImprovement.map((area: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                  <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {responseTime && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Response time: {responseTime.toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Interview Advice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Interview Advice</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">For This Type:</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{interviewAdvice}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Skill Development:</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{skillAdvice}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInterviewResults; 
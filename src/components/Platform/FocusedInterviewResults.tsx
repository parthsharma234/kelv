import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Play,
  BarChart3,
  Star,
  Zap
} from 'lucide-react';

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

  const getCategoryInsights = (interviewType: string, score: number) => {
    const insights = {
      technical: {
        strong: ['Solid technical foundation', 'Good problem-solving approach', 'Clear communication of technical concepts'],
        improve: ['Practice more complex scenarios', 'Work on system design questions', 'Improve code optimization skills'],
        tips: ['Practice coding problems regularly', 'Study system design patterns', 'Review fundamental algorithms']
      },
      behavioral: {
        strong: ['Good use of STAR method', 'Clear examples provided', 'Strong communication skills'],
        improve: ['Add more quantifiable results', 'Provide more specific details', 'Practice leadership scenarios'],
        tips: ['Prepare more STAR stories', 'Quantify your achievements', 'Practice leadership examples']
      },
      situational: {
        strong: ['Good problem-solving approach', 'Logical thinking process', 'Consideration of multiple perspectives'],
        improve: ['Think more strategically', 'Consider long-term implications', 'Practice conflict resolution'],
        tips: ['Practice decision-making frameworks', 'Study conflict resolution techniques', 'Think about stakeholder impact']
      },
      resume: {
        strong: ['Clear articulation of experience', 'Good career narrative', 'Relevant background presentation'],
        improve: ['Quantify more achievements', 'Connect experience to role', 'Highlight transferable skills'],
        tips: ['Quantify all achievements', 'Connect past experience to target role', 'Practice elevator pitch']
      },
      leadership: {
        strong: ['Good leadership philosophy', 'Team management understanding', 'Strategic thinking approach'],
        improve: ['Practice complex scenarios', 'Develop influence strategies', 'Work on organizational impact'],
        tips: ['Study leadership frameworks', 'Practice influence scenarios', 'Focus on organizational impact']
      },
      caseStudy: {
        strong: ['Strong analytical thinking', 'Good framework application', 'Clear problem breakdown'],
        improve: ['Practice more complex cases', 'Work on quantitative analysis', 'Improve recommendation clarity'],
        tips: ['Study case frameworks (Porter, McKinsey)', 'Practice market sizing', 'Work on recommendation structure']
      },
      systemDesign: {
        strong: ['Good architectural thinking', 'Clear system breakdown', 'Consideration of trade-offs'],
        improve: ['Practice scalability discussions', 'Work on detailed design', 'Improve technical depth'],
        tips: ['Study system design patterns', 'Practice scalability scenarios', 'Focus on trade-off analysis']
      },
      leadershipAssessment: {
        strong: ['Strong executive presence', 'Good strategic thinking', 'Clear decision-making process'],
        improve: ['Practice complex scenarios', 'Work on influence strategies', 'Improve organizational impact'],
        tips: ['Study executive frameworks', 'Practice high-stakes decisions', 'Focus on organizational leadership']
      }
    };

    return insights[interviewType as keyof typeof insights] || insights.behavioral;
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
  const insights = getCategoryInsights(sessionData.interviewType, sessionData.overallScore);
  const nextPractice = getNextPracticeRecommendations(sessionData.interviewType, sessionData.overallScore);

  const interviewTypeConfig = {
    technical: { icon: '💻', title: 'Technical Questions', color: 'from-blue-500 to-cyan-500' },
    behavioral: { icon: '🎯', title: 'Behavioral Questions', color: 'from-green-500 to-emerald-500' },
    situational: { icon: '🧩', title: 'Situational Questions', color: 'from-purple-500 to-pink-500' },
    resume: { icon: '📄', title: 'Resume Questions', color: 'from-orange-500 to-red-500' },
    leadership: { icon: '👑', title: 'Leadership Questions', color: 'from-yellow-500 to-orange-500' },
    caseStudy: { icon: '📊', title: 'Case Study Interviews', color: 'from-indigo-500 to-purple-500' },
    systemDesign: { icon: '🏗️', title: 'System Design Interviews', color: 'from-teal-500 to-cyan-500' },
    leadershipAssessment: { icon: '⚡', title: 'Leadership Assessment', color: 'from-red-500 to-pink-500' }
  };

  const config = interviewTypeConfig[sessionData.interviewType as keyof typeof interviewTypeConfig];

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBackToDashboard}
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
            {/* Strengths */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Your Strengths
              </h3>
              <div className="space-y-3">
                {insights.strong.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Areas for Improvement
              </h3>
              <div className="space-y-3">
                {insights.improve.map((area, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">{area}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Tips */}
            <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Practice Tips
              </h3>
              <div className="space-y-3">
                {insights.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
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
                  onClick={() => onStartNewFocusedInterview(sessionData.interviewType)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg hover:from-orange-400 hover:to-orange-300 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Practice Again
                </button>
                
                <button
                  onClick={() => onStartNewFocusedInterview('behavioral')}
                  className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                >
                  Try Behavioral
                </button>
                
                <button
                  onClick={() => onStartNewFocusedInterview('technical')}
                  className="w-full px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium"
                >
                  Try Technical
                </button>
                
                <button
                  onClick={() => onStartNewFocusedInterview('situational')}
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
                  <span className="text-white">{sessionData.questionsAnswered}/{sessionData.config.maxQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Session Type:</span>
                  <span className="text-white capitalize">{sessionData.interviewType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white capitalize">{sessionData.setup.interviewMode}</span>
                </div>
              </div>
            </div>

            {/* Back to Dashboard */}
            <button
              onClick={onBackToDashboard}
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

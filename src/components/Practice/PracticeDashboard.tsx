import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Brain,
  Target,
  Sparkles,
  ArrowRight,
  Mic,
  Video,
  Users,
  MessageSquare,
  Volume2,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PracticeDashboard: React.FC = () => {
  const practiceTypes = [
    {
      id: 'mock',
      title: 'Mock Interview',
      description: 'Full interview simulation with comprehensive AI feedback and real-time analysis',
      icon: Video,
      color: 'from-orange-500/20 to-orange-400/5',
      iconColor: 'text-orange-400',
      difficulty: 'Complete Experience',
      duration: '45-60 min'
    }
  ];

  const skillPractice = [
    {
      id: 'posture',
      title: 'Posture & Body Language',
      description: 'Practice maintaining confident posture and professional body language',
      icon: Users,
      color: 'from-blue-500/20 to-blue-400/5',
      iconColor: 'text-blue-400',
      focus: 'Visual Analysis'
    },
    {
      id: 'voice',
      title: 'Voice & Speech',
      description: 'Improve your speaking pace, clarity, and vocal confidence',
      icon: Volume2,
      color: 'from-green-500/20 to-green-400/5',
      iconColor: 'text-green-400',
      focus: 'Audio Analysis'
    },
    {
      id: 'eye-contact',
      title: 'Eye Contact',
      description: 'Practice maintaining appropriate eye contact during interviews',
      icon: Eye,
      color: 'from-purple-500/20 to-purple-400/5',
      iconColor: 'text-purple-400',
      focus: 'Gaze Tracking'
    },
    {
      id: 'behavioral',
      title: 'Behavioral Questions',
      description: 'Master the STAR method and common behavioral interview questions',
      icon: MessageSquare,
      color: 'from-pink-500/20 to-pink-400/5',
      iconColor: 'text-pink-400',
      focus: 'Content Analysis'
    },
    {
      id: 'technical',
      title: 'Technical Questions',
      description: 'Practice explaining complex technical concepts clearly and concisely',
      icon: Brain,
      color: 'from-indigo-500/20 to-indigo-400/5',
      iconColor: 'text-indigo-400',
      focus: 'Knowledge Assessment'
    },
    {
      id: 'communication',
      title: 'Communication Skills',
      description: 'Enhance your overall communication effectiveness and clarity',
      icon: Target,
      color: 'from-teal-500/20 to-teal-400/5',
      iconColor: 'text-teal-400',
      focus: 'Comprehensive Review'
    }
  ];

  const MockInterviewIcon = practiceTypes[0].icon;

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Practice Dashboard</h1>
          <p className="text-gray-400 text-lg">Choose between full mock interviews or focused skill practice</p>
        </motion.div>

        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-orange-500/10 to-orange-400/5 rounded-2xl p-8 mb-12 border border-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to practice?</h2>
              <p className="text-gray-300">Start with a full mock interview or focus on specific skills that need improvement.</p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mock Interview Section */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-6"
          >
            Full Interview Experience
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <Link to="/practice/session" className="block">
              <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group-hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${practiceTypes[0].color}`}>
                        <MockInterviewIcon className={`w-8 h-8 ${practiceTypes[0].iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{practiceTypes[0].title}</h3>
                        <p className="text-gray-400">{practiceTypes[0].description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {practiceTypes[0].difficulty}
                      </span>
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {practiceTypes[0].duration}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-orange-400 group-hover:text-orange-300 transition-colors">
                      <Play className="w-5 h-5" />
                      <span className="font-medium text-lg">Start Mock Interview</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Skill Practice Section */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-6"
          >
            Practice Specific Skills
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillPractice.map((skill, index) => {
              const SkillIcon = skill.icon;
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group"
                >
                  <Link to="/practice/session" className="block">
                    <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group-hover:scale-105 h-full">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${skill.color} mb-4 w-fit`}>
                        <SkillIcon className={`w-6 h-6 ${skill.iconColor}`} />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-3">{skill.title}</h3>
                      <p className="text-gray-400 mb-4 text-sm leading-relaxed">{skill.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-xs text-gray-500 bg-dark-700 px-2 py-1 rounded">
                          {skill.focus}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-orange-400 group-hover:text-orange-300 transition-colors">
                        <Play className="w-4 h-4" />
                        <span className="font-medium">Practice</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Practice Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 bg-dark-800 rounded-2xl p-8 border border-dark-700"
        >
          <h3 className="text-xl font-bold text-white mb-6">Practice Tips for Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Start with Skills</h4>
                  <p className="text-gray-400 text-sm">Focus on individual skills before attempting full mock interviews</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Practice Regularly</h4>
                  <p className="text-gray-400 text-sm">Consistent daily practice yields better results than intensive sessions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Use AI Feedback</h4>
                  <p className="text-gray-400 text-sm">Review detailed AI analysis to identify areas for improvement</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Record Everything</h4>
                  <p className="text-gray-400 text-sm">Enable camera and microphone for comprehensive analysis</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Stay Natural</h4>
                  <p className="text-gray-400 text-sm">Practice as if it's a real interview for authentic feedback</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Track Progress</h4>
                  <p className="text-gray-400 text-sm">Monitor your improvement over time and celebrate milestones</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PracticeDashboard;
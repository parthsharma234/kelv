import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Play, 
  Clock, 
  Target, 
  ArrowLeft, 
  Zap,
  Code,
  Users,
  Puzzle,
  FileText,
  Crown,
  BarChart3,
  Building2
} from 'lucide-react';
import { InterviewSetup } from '../../types/interview';

interface FocusedInterviewSelectionProps {
  setup: InterviewSetup;
  onSelectType: (type: string) => void;
  onBack: () => void;
}

const FocusedInterviewSelection: React.FC<FocusedInterviewSelectionProps> = ({
  setup,
  onSelectType,
  onBack
}) => {
  const interviewTypes = [
    {
      id: 'technical',
      title: 'Technical Questions',
      description: 'Practice coding, system design, and technical concepts',
      icon: '💻',
      duration: '5 min',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/20',
      iconComponent: Code,
      features: ['Coding problems', 'System design', 'Technical concepts', 'Role-specific knowledge']
    },
    {
      id: 'behavioral',
      title: 'Behavioral Questions',
      description: 'Master the STAR method and leadership scenarios',
      icon: '🎯',
      duration: '4 min',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/5',
      borderColor: 'border-green-500/20',
      iconComponent: Target,
      features: ['STAR method', 'Leadership scenarios', 'Past experiences', 'Team collaboration']
    },
    {
      id: 'situational',
      title: 'Situational Questions',
      description: 'Handle workplace challenges and problem-solving',
      icon: '🧩',
      duration: '4 min',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/5',
      borderColor: 'border-purple-500/20',
      iconComponent: Puzzle,
      features: ['Problem-solving', 'Workplace scenarios', 'Decision making', 'Conflict resolution']
    },
    {
      id: 'resume',
      title: 'Resume Questions',
      description: 'Articulate your background and experience effectively',
      icon: '📄',
      duration: '3 min',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/10 to-red-500/5',
      borderColor: 'border-orange-500/20',
      iconComponent: FileText,
      features: ['Experience articulation', 'Background discussion', 'Achievement highlights', 'Career progression']
    },
    {
      id: 'leadership',
      title: 'Leadership Questions',
      description: 'Demonstrate leadership and management skills',
      icon: '👑',
      duration: '5 min',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/5',
      borderColor: 'border-yellow-500/20',
      iconComponent: Crown,
      features: ['Team management', 'Strategic thinking', 'Influence skills', 'Decision making']
    },
    {
      id: 'caseStudy',
      title: 'Case Study Interviews',
      description: 'Practice business and technical case scenarios',
      icon: '📊',
      duration: '8 min',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/10 to-purple-500/5',
      borderColor: 'border-indigo-500/20',
      iconComponent: BarChart3,
      features: ['Business case scenarios', 'Technical case studies', 'Market analysis', 'Strategy development']
    },
    {
      id: 'systemDesign',
      title: 'System Design Interviews',
      description: 'Master architecture and scalability discussions',
      icon: '🏗️',
      duration: '10 min',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'from-teal-500/10 to-cyan-500/5',
      borderColor: 'border-teal-500/20',
      iconComponent: Building2,
      features: ['Architecture design', 'Scalability discussions', 'Technical whiteboarding', 'Real-time feedback']
    },
    {
      id: 'leadershipAssessment',
      title: 'Leadership Assessment',
      description: 'Advanced management and executive scenarios',
      icon: '⚡',
      duration: '8 min',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'from-violet-500/10 to-purple-500/5',
      borderColor: 'border-violet-500/20',
      iconComponent: Zap,
      features: ['Management scenarios', 'Team conflict resolution', 'Strategic decision-making', 'Executive presence']
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Focused Practice Sessions</h1>
              <p className="text-gray-400 text-lg">
                Choose a specific interview type for targeted practice. Perfect for quick, focused improvement.
              </p>
            </div>
          </div>

          {/* Setup Summary */}
          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Session Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Role:</span>
                <p className="text-white font-medium">{setup.jobType}</p>
              </div>
              <div>
                <span className="text-gray-400">Industry:</span>
                <p className="text-white font-medium">{setup.industry}</p>
              </div>
              <div>
                <span className="text-gray-400">Level:</span>
                <p className="text-white font-medium">{setup.experienceLevel}</p>
              </div>
              <div>
                <span className="text-gray-400">Mode:</span>
                <p className="text-white font-medium capitalize">{setup.interviewMode}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interview Type Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {interviewTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`bg-gradient-to-br ${type.bgColor} rounded-2xl p-6 border ${type.borderColor} hover:scale-105 transition-all duration-300 cursor-pointer group`}
              onClick={() => onSelectType(type.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{type.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{type.title}</h3>
                    <p className="text-gray-400 text-sm">{type.description}</p>
                  </div>
                </div>
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <type.iconComponent className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{type.duration}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {type.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                className={`w-full px-4 py-3 bg-gradient-to-r ${type.color} text-white rounded-lg hover:shadow-lg hover:shadow-${type.color.split('-')[1]}-500/25 transition-all font-medium flex items-center justify-center gap-2 group-hover:scale-105`}
              >
                <Play className="w-4 h-4" />
                Start Practice
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Why Focused Practice?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Targeted practice sessions help you improve specific skills quickly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick & Efficient</h3>
              <p className="text-gray-400 text-sm">
                3-5 minute sessions that fit into your busy schedule
              </p>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Targeted Improvement</h3>
              <p className="text-gray-400 text-sm">
                Focus on specific skill areas you want to strengthen
              </p>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Adaptation</h3>
              <p className="text-gray-400 text-sm">
                Questions adapt to your performance and experience level
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FocusedInterviewSelection; 
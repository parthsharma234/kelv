import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Brain, 
  MessageSquare, 
  Target, 
  ChevronLeft,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Volume2,
  Mic,
  Gauge,
  X,
  User
} from 'lucide-react';

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const voiceMetrics = [
  {
    name: "Communication Clarity",
    score: 85,
    icon: MessageSquare,
    color: "from-blue-500 to-blue-400",
    improvement: "+12%",
    description: "How clear and concise your language was."
  },
  {
    name: "Confidence Level",
    score: 88,
    icon: Zap,
    color: "from-purple-500 to-purple-400",
    improvement: "+7%",
    description: "Measured through voice stability and assertiveness."
  },
  {
    name: "Vocal Variety",
    score: 80,
    icon: Volume2,
    color: "from-pink-500 to-pink-400",
    improvement: "+10%",
    description: "Variation in pitch and tone to maintain engagement."
  },
  {
    name: "Pacing and Flow",
    score: 78,
    icon: Clock,
    color: "from-orange-500 to-orange-400",
    improvement: "+9%",
    description: "Smoothness and speed of your delivery."
  },
  {
    name: "Filler Word Usage",
    score: 90,
    icon: Mic,
    color: "from-red-500 to-red-400",
    improvement: "-5%",
    description: "Minimizing 'umms' and 'uhhs'."
  }
];

const contentMetrics = [
  {
    name: "Technical Depth",
    score: 92,
    icon: Brain,
    color: "from-purple-500 to-purple-400",
    improvement: "+8%",
    description: "Understanding and explanation of technical concepts."
  },
  {
    name: "Story Structure",
    score: 85,
    icon: MessageSquare,
    color: "from-teal-500 to-teal-400",
    improvement: "+11%",
    description: "Organization and clarity of your examples and stories."
  },
  {
    name: "Critical Thinking",
    score: 86,
    icon: Brain,
    color: "from-violet-500 to-violet-400",
    improvement: "+8%",
    description: "Analysis and evaluation of complex situations."
  },
  {
    name: "Relevance to Question",
    score: 91,
    icon: Target,
    color: "from-green-500 to-green-400",
    improvement: "+6%",
    description: "How well your answer addressed the interviewer's question."
  },
  {
    name: "Behavioral Insight",
    score: 88,
    icon: User,
    color: "from-blue-500 to-blue-400",
    improvement: "+10%",
    description: "Ability to articulate experiences and lessons learned."
  },
  {
    name: "Problem-Solving Approach",
    score: 89,
    icon: Zap,
    color: "from-yellow-500 to-yellow-400",
    improvement: "+7%",
    description: "Clarity and effectiveness of your problem-solving steps."
  }
];

const PerformanceAnalytics: React.FC<AnalyticsProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ 
            type: "spring", 
            damping: 30, 
            stiffness: 300,
            opacity: { duration: 0.2 }
          }}
          className="w-full bg-dark-800 border-l border-dark-700 shadow-2xl relative overflow-hidden"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5"></div>
          
          <div className="h-full flex flex-col relative z-10">
            {/* Header */}
            <motion.div 
              className="p-4 lg:p-6 border-b border-dark-700 flex items-center justify-between bg-dark-800/90 backdrop-blur-sm"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold gradient-text">Performance Analysis</h2>
                  <p className="text-xs text-gray-400">Comprehensive AI insights</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto analytics-scroll">
              {/* Overall Score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative py-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Overall Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold gradient-text">87%</span>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+5%</span>
                  </div>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Detailed Metrics - Two Column Layout */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Skill Breakdown</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voice Metrics Column */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Voice Metrics</h4>
                    <div className="space-y-3">
                      {voiceMetrics.map((metric, index) => (
                        <motion.div
                          key={metric.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="bg-dark-700/30 rounded-lg p-3 border border-dark-600/30 hover:border-orange-500/30 transition-all group"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${metric.color} group-hover:scale-110 transition-transform`}>
                              <metric.icon className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white truncate">{metric.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{metric.score}%</span>
                                  <span className="text-xs text-green-400">{metric.improvement}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.score}%` }}
                              transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                              className={`h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Content Metrics Column */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Content Metrics</h4>
                    <div className="space-y-3">
                      {contentMetrics.map((metric, index) => (
                        <motion.div
                          key={metric.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (index * 0.1) + (voiceMetrics.length * 0.1) }}
                          className="bg-dark-700/30 rounded-lg p-3 border border-dark-600/30 hover:border-orange-500/30 transition-all group"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${metric.color} group-hover:scale-110 transition-transform`}>
                              <metric.icon className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white truncate">{metric.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{metric.score}%</span>
                                  <span className="text-xs text-green-400">{metric.improvement}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.score}%` }}
                              transition={{ duration: 1, delay: 0.6 + (index * 0.1) + (voiceMetrics.length * 0.1) }}
                              className={`h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Insights - Updated with speech specifics */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-xl p-4 border border-orange-500/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-orange-400">AI Insights & Recommendations</h3>
                </div>
                <div className="space-y-2 text-xs text-gray-300">
                  <p>• <strong>Strength:</strong> Excellent problem-solving approach using structured thinking</p>
                  <p>• <strong>Improvement:</strong> Consider adding more specific examples to responses and vary your vocal pitch more.</p>
                  <p>• <strong>Speech Focus:</strong> Practice reducing filler words and maintain a consistent, clear pacing (aim for 130-140 WPM).</p>
                  <p>• <strong>Next Focus:</strong> Practice technical explanations with simpler language and improve vocal projection.</p>
                </div>
              </motion.div>

              {/* Mobile-specific adjustments */}
              <div className="lg:hidden">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg font-medium hover:from-orange-400 hover:to-orange-300 transition-all"
                >
                  Close Analysis
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PerformanceAnalytics;
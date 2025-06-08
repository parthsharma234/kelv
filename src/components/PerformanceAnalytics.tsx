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
  Zap
} from 'lucide-react';

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const metrics = [
  {
    name: "Communication Clarity",
    score: 85,
    icon: MessageSquare,
    color: "from-blue-500 to-blue-400",
    improvement: "+12%"
  },
  {
    name: "Technical Depth",
    score: 92,
    icon: Brain,
    color: "from-purple-500 to-purple-400",
    improvement: "+8%"
  },
  {
    name: "Response Time",
    score: 78,
    icon: Clock,
    color: "from-green-500 to-green-400",
    improvement: "+15%"
  },
  {
    name: "Problem Solving",
    score: 88,
    icon: Target,
    color: "from-orange-500 to-orange-400",
    improvement: "+6%"
  }
];

const chartData = [
  { label: 'Week 1', value: 65 },
  { label: 'Week 2', value: 72 },
  { label: 'Week 3', value: 78 },
  { label: 'Week 4', value: 87 }
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
          className="w-1/2 bg-dark-800 border-l border-dark-700 shadow-2xl relative overflow-hidden"
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
                  <p className="text-xs text-gray-400">Real-time AI insights</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">
              {/* Overall Score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
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
              
              {/* Progress Chart */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/50"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Progress Trend</h3>
                </div>
                <div className="flex items-end justify-between h-20 gap-2">
                  {chartData.map((item, index) => (
                    <div key={item.label} className="flex flex-col items-center flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.4 + index * 0.1 }}
                        className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm relative overflow-hidden"
                        style={{ maxHeight: '60px' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20"></div>
                      </motion.div>
                      <span className="text-xs text-gray-400 mt-2">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Detailed Metrics */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Skill Breakdown</h3>
                </div>
                {metrics.map((metric, index) => (
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
              </motion.div>

              {/* AI Insights */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-xl p-4 border border-orange-500/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-orange-400">AI Insights</h3>
                </div>
                <div className="space-y-2 text-xs text-gray-300">
                  <p>• <strong>Strength:</strong> Excellent problem-solving approach using structured thinking</p>
                  <p>• <strong>Improvement:</strong> Consider adding more specific examples to responses</p>
                  <p>• <strong>Next Focus:</strong> Practice technical explanations with simpler language</p>
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
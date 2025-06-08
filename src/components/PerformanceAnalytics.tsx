import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, Brain, MessageSquare, Zap, Target, ChevronLeft } from 'lucide-react';

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const metrics = [
  {
    name: "Communication Clarity",
    score: 85,
    icon: MessageSquare,
    color: "from-blue-500 to-blue-400"
  },
  {
    name: "Technical Depth",
    score: 92,
    icon: Brain,
    color: "from-purple-500 to-purple-400"
  },
  {
    name: "Response Time",
    score: 78,
    icon: Clock,
    color: "from-green-500 to-green-400"
  },
  {
    name: "Problem Solving",
    score: 88,
    icon: Target,
    color: "from-orange-500 to-orange-400"
  },
  {
    name: "Industry Knowledge",
    score: 90,
    icon: TrendingUp,
    color: "from-pink-500 to-pink-400"
  }
];

const PerformanceAnalytics: React.FC<AnalyticsProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 shadow-xl"
        >
          <div className="h-full flex flex-col">
            {/* Header with close button */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold gradient-text">Analysis</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Overall Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Overall Score</span>
                  <span className="text-xl font-bold gradient-text">87%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                  />
                </div>
              </div>
              
              {/* Metrics */}
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${metric.color}`}>
                      <metric.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm font-semibold">{metric.score}%</span>
                      </div>
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${metric.color}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PerformanceAnalytics;
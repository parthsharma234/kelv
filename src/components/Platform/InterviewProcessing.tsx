import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mic, BarChart3, FileText, CheckCircle, Loader2 } from 'lucide-react';
import RedPandaLogo from '../RedPandaLogo';

interface InterviewProcessingProps {
  onComplete: () => void;
  processingTimeMs?: number;
}

const InterviewProcessing: React.FC<InterviewProcessingProps> = ({ 
  onComplete, 
  processingTimeMs = 2000 // Optimized for voice analytics processing
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const processingSteps = [
    {
      icon: FileText,
      title: 'Analyzing Transcript',
      description: 'Processing your responses and conversation flow'
    },
    {
      icon: Mic,
      title: 'Evaluating Voice Metrics',
      description: 'Analyzing speech patterns, pace, and delivery'
    },
    {
      icon: Brain,
      title: 'Generating Insights',
      description: 'Creating personalized feedback and recommendations'
    },
    {
      icon: BarChart3,
      title: 'Calculating Scores',
      description: 'Compiling your performance metrics and results'
    }
  ];

  useEffect(() => {
    const stepDuration = processingTimeMs / processingSteps.length;
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    const updateProgress = () => {
      setProgress(prev => {
        if (prev >= 100) {
          setTimeout(onComplete, 500); // Small delay before showing results
          return 100;
        }
        return prev + (100 / (processingTimeMs / 50)); // Update every 50ms
      });
    };

    const updateStep = () => {
      setCurrentStep(prev => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    };

    // Start progress animation
    progressTimer = setInterval(updateProgress, 50);

    // Update steps
    stepTimer = setInterval(updateStep, stepDuration);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete, processingTimeMs, processingSteps.length]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <RedPandaLogo className="w-16 h-16" />
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Processing Your Interview
        </motion.h1>

        <motion.p 
          className="text-xl text-gray-400 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          We're analyzing your performance and generating personalized feedback
        </motion.p>

        {/* Progress Bar */}
        <motion.div 
          className="w-full bg-dark-700 rounded-full h-3 mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </motion.div>

        {/* Processing Steps */}
        <div className="space-y-6">
          {processingSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <motion.div
                key={index}
                className={`flex items-center p-6 rounded-xl border transition-all duration-500 ${
                  isActive 
                    ? 'bg-orange-500/10 border-orange-500/30 text-white' 
                    : isCompleted
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-dark-800 border-dark-600 text-gray-500'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + (index * 0.1) }}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  isActive 
                    ? 'bg-orange-500/20' 
                    : isCompleted
                    ? 'bg-green-500/20'
                    : 'bg-dark-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                <div className="text-left">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${
                    isActive ? 'text-gray-300' : isCompleted ? 'text-green-300' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Loading Animation */}
        <motion.div 
          className="mt-12 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-orange-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Progress Percentage */}
        <motion.p 
          className="text-gray-400 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          {Math.round(progress)}% Complete
        </motion.p>

        {/* Timeout Warning */}
        {progress > 80 && (
          <motion.p 
            className="text-orange-400 text-xs mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Processing voice analytics... This may take a few moments
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default InterviewProcessing;
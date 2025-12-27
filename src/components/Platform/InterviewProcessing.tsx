import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mic, BarChart3, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import RedPandaLogo from '../RedPandaLogo';
import { HumeBatchClient } from '../../utils/humeBatchClient';
import { AnalyticsEngine } from '../../utils/analyticsEngine';

interface InterviewProcessingProps {
  sessionData: any; // Contains { transcript, duration, recordingBlob }
  onComplete: (results: any) => void;
}

const InterviewProcessing: React.FC<InterviewProcessingProps> = ({
  sessionData,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent double-firing
  const joyRef = useRef(false);

  // Processing Steps (Visuals)
  const processingSteps = [
    { icon: FileText, title: 'Uploading Interview', description: 'Securely sending data to analytics engine' },
    { icon: Brain, title: 'Analyzing Biometrics', description: 'Processing facial expressions and prosody' },
    { icon: Mic, title: 'Evaluating Content', description: 'Generating detailed feedback and scores' },
    { icon: BarChart3, title: 'Finalizing Report', description: 'Compiling your personal dashboard' }
  ];

  useEffect(() => {
    if (joyRef.current) return;
    joyRef.current = true;

    const processInterview = async () => {
      try {
        console.log('[Processing] Starting analysis pipeline...');

        // 1. Upload & Start Job
        setCurrentStep(0);
        setProgress(10);

        const apiKey = import.meta.env.VITE_HUME_API_KEY;
        if (!apiKey) throw new Error('Missing Hume API Key');

        const client = new HumeBatchClient(apiKey);

        if (!sessionData?.recordingBlob) {
          // STRICT MODE: No recording = No Analysis.
          console.error('[Processing] Critical: No recording blob found.');
          throw new Error('No recording data captured. Cannot generate real metrics.');
        }

        const jobId = await client.startJob(sessionData.recordingBlob);
        console.log('[Processing] Job started:', jobId);

        // 2. Poll for Results
        setCurrentStep(1);
        setProgress(30);

        // Poll with progress simulation
        const pollInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 1, 80));
        }, 500);

        const predictions = await client.waitForCompletion(jobId);
        clearInterval(pollInterval);

        // 3. Evaluation & Metrics
        setCurrentStep(2);
        setProgress(90);

        const metrics = AnalyticsEngine.process(
          predictions,
          sessionData.duration || 60,
          sessionData.transcript || []
        );

        // 4. Finalizing
        setCurrentStep(3);
        setProgress(100);

        setTimeout(() => {
          onComplete({
            metrics,
            transcript: sessionData.transcript,
            duration: sessionData.duration,
            postureData: sessionData.postureData  // Pass through posture data
          });
        }, 800);

      } catch (err) {
        console.error('[Processing] Error:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    };

    processInterview();
  }, [sessionData, onComplete]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-dark-800 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Processing Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
              Retry Session
            </button>
            <button onClick={() => onComplete(null)} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          Analyzing Your Performance
        </motion.h1>

        <motion.p
          className="text-xl text-gray-400 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Extracting emotional intelligence and vocal prosody...
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-full bg-dark-700 rounded-full h-3 mb-12 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300 ease-out"
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
                className={`flex items-center p-6 rounded-xl border transition-all duration-500 ${isActive
                  ? 'bg-orange-500/10 border-orange-500/30 text-white scale-105 shadow-xl shadow-orange-500/10'
                  : isCompleted
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-dark-800 border-dark-600 text-gray-600 opacity-60'
                  }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + (index * 0.1) }}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all duration-500 ${isActive
                  ? 'bg-orange-500/20 text-orange-400'
                  : isCompleted
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-dark-700 text-gray-500'
                  }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                <div className="text-left">
                  <h3 className={`text-lg font-semibold mb-1 ${isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${isActive ? 'text-gray-300' : isCompleted ? 'text-green-300' : 'text-gray-600'
                    }`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InterviewProcessing;
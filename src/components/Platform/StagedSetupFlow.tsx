import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InterviewSetup } from '../../types/interview';
import ResumeJobDescriptionUpload, { ParsedInterviewData } from './ResumeJobDescriptionUpload';
import InteractiveWarmUp from './InteractiveWarmUp';
import { SetupFlow } from './SetupFlow';

type Stage = 'document-upload' | 'warm-up' | 'manual-setup';

interface StagedSetupFlowProps {
  onComplete: (setup: InterviewSetup) => void;
  onBack: () => void;
}

const StagedSetupFlow: React.FC<StagedSetupFlowProps> = ({ onComplete, onBack }) => {
  const [currentStage, setCurrentStage] = useState<Stage>('document-upload');
  const [parsedData, setParsedData] = useState<ParsedInterviewData | null>(null);
  const [finalSetup, setFinalSetup] = useState<InterviewSetup | null>(null);

  const handleDocumentsParsed = (data: ParsedInterviewData) => {
    setParsedData(data);
    setCurrentStage('warm-up');
  };

  const handleWarmUpComplete = () => {
    setCurrentStage('manual-setup');
  };

  const handleSkipWarmUp = () => {
    setCurrentStage('manual-setup');
  };

  const handleManualSetupComplete = (setup: InterviewSetup) => {
    setFinalSetup(setup);
    onComplete(setup);
  };

  // Pre-fill setup if we have parsed data
  const getPrefilledSetup = (): Partial<InterviewSetup> | undefined => {
    if (!parsedData) return undefined;

    return {
      jobType: parsedData.role,
      industry: parsedData.industry,
      experienceLevel: parsedData.experienceLevel,
      interviewMode: 'voice' // Default to voice
    };
  };

  return (
    <div className="min-h-screen bg-[#010103]">
      <AnimatePresence mode="wait">
        {currentStage === 'document-upload' && (
          <motion.div
            key="document-upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResumeJobDescriptionUpload
              onParsed={handleDocumentsParsed}
            />
          </motion.div>
        )}

        {currentStage === 'warm-up' && (
          <motion.div
            key="warm-up"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InteractiveWarmUp
              onComplete={handleWarmUpComplete}
              onSkip={handleSkipWarmUp}
            />
          </motion.div>
        )}

        {currentStage === 'manual-setup' && (
          <motion.div
            key="manual-setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SetupFlowWithPrefill
              prefilledData={getPrefilledSetup()}
              parsedContext={parsedData}
              onComplete={handleManualSetupComplete}
              onBack={onBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper component to show context from parsed documents
const SetupFlowWithPrefill: React.FC<{
  prefilledData?: Partial<InterviewSetup>;
  parsedContext: ParsedInterviewData | null;
  onComplete: (setup: InterviewSetup) => void;
  onBack: () => void;
}> = ({ prefilledData, parsedContext, onComplete, onBack }) => {
  return (
    <div className="relative">
      {/* Show parsed context banner if available */}
      {parsedContext && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl w-full px-4">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-400 mb-1">Documents Analyzed Successfully</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Role: </span>
                    <span className="text-white font-medium">{parsedContext.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Industry: </span>
                    <span className="text-white font-medium">{parsedContext.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Level: </span>
                    <span className="text-white font-medium">{parsedContext.experienceLevel.split('(')[0].trim()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Skills: </span>
                    <span className="text-white font-medium">{parsedContext.skills.length} detected</span>
                  </div>
                </div>
                {parsedContext.targetCompany && (
                  <p className="text-xs text-gray-400 mt-2">
                    Target: <span className="text-white">{parsedContext.targetCompany}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Regular setup flow with prefilled data */}
      <SetupFlow
        onComplete={onComplete}
        onBack={onBack}
        initialSetup={prefilledData}
      />
    </div>
  );
};

export default StagedSetupFlow;

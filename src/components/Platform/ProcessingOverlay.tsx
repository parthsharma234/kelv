import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { InterviewProcessingStatus } from '../../types/processing';
import { checkInterviewProcessingStatus } from '../../utils/processing';

interface ProcessingOverlayProps {
  sessionId: string;
  onProcessingComplete?: () => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  sessionId,
  onProcessingComplete
}) => {
  const [status, setStatus] = useState<InterviewProcessingStatus>('processing');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkInterviewProcessingStatus(sessionId);
        setStatus(result.status);
        if (result.progress !== undefined) {
          setProgress(result.progress);
        }
        setError(result.error);

        if (result.status === 'completed') {
          onProcessingComplete?.();
        } else if (result.status === 'processing') {
          // Continue checking status
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error checking status');
        setStatus('failed');
      }
    };

    checkStatus();
  }, [sessionId, onProcessingComplete]);

  if (status === 'completed') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {status === 'failed' ? (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Failed</h3>
            <p className="text-gray-600 mb-4">{error || 'An error occurred while processing your interview.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="text-center">
            {progress === 100 ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            ) : (
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Your Interview
            </h3>
            <p className="text-gray-600 mb-4">
              Please wait while we analyze your interview data. This may take a few moments.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {progress}% complete
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProcessingOverlay;

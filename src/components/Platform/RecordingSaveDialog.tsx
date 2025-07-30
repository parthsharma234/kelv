import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Save, X, Upload, AlertCircle, CheckCircle, Camera } from 'lucide-react';

interface RecordingSaveDialogProps {
  isOpen: boolean;
  onSave: () => Promise<void>;
  onSkip: () => void;
  isUploading: boolean;
  uploadError?: string;
  uploadSuccess?: boolean;
  sessionData?: any;
}

const RecordingSaveDialog: React.FC<RecordingSaveDialogProps> = ({
  isOpen,
  onSave,
  onSkip,
  isUploading,
  uploadError,
  uploadSuccess,
  sessionData
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          {/* Header */}
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-full flex items-center justify-center">
            {uploadSuccess ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : uploadError ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Video className="w-8 h-8 text-[#FF5722]" />
            )}
          </div>

          {/* Content based on state */}
          {uploadSuccess ? (
            <>
              <h3 className="text-2xl font-bold text-white mb-4">Recording Saved!</h3>
              <p className="text-gray-400 mb-6">
                Your interview recording has been successfully saved. You can view it on your results page.
              </p>
              <button
                onClick={onSkip}
                className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
              >
                Continue to Results
              </button>
            </>
          ) : uploadError ? (
            <>
              <h3 className="text-2xl font-bold text-white mb-4">Upload Failed</h3>
              <p className="text-red-400 mb-2">Failed to save recording</p>
              <p className="text-gray-400 text-sm mb-6">{uploadError}</p>
              <div className="flex gap-3">
                <button
                  onClick={onSave}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Retry Upload
                </button>
                <button
                  onClick={onSkip}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Skip for Now
                </button>
              </div>
            </>
          ) : isUploading ? (
            <>
              <h3 className="text-2xl font-bold text-white mb-4">Saving Recording...</h3>
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-[#FF7043] rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-[#D84315] rounded-full animate-bounce delay-200"></div>
              </div>
              <p className="text-gray-400 mb-4">
                Uploading your interview recording to secure storage...
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div className="bg-[#FF5722] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-white mb-4">Save Interview Recording?</h3>
              <p className="text-gray-400 mb-6">
                Would you like to save your interview recording? You can review your performance and body language analysis later.
              </p>
              
              {/* Session info */}
              {sessionData && (
                <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#FF5722]" />
                      <span className="text-gray-300">Duration:</span>
                    </div>
                    <span className="text-white font-medium">
                      {formatTime(sessionData.duration || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-300">Questions Answered:</span>
                    <span className="text-white font-medium">
                      {sessionData.questionsAnswered || sessionData.responses?.length || 0}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onSave}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Recording
                </button>
                
                <button
                  onClick={onSkip}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Skip
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Recordings are stored securely and can be deleted at any time from your profile.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RecordingSaveDialog;
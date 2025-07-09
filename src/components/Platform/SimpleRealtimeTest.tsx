import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SimpleRealtimeTestProps {
  setup: any;
  interviewType?: string;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

const SimpleRealtimeTest: React.FC<SimpleRealtimeTestProps> = ({
  setup,
  interviewType,
  onComplete,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pt-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-white font-medium">
            🧪 Realtime Interview Test - Type: {interviewType}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Realtime Interview Working! 🎉
          </h1>
          <p className="text-gray-400 mb-6">
            Interview Type: {interviewType}
          </p>
          <p className="text-gray-400 mb-6">
            Setup: {JSON.stringify(setup, null, 2)}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => onComplete({ test: 'data' })}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Complete Test
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors ml-4"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRealtimeTest;

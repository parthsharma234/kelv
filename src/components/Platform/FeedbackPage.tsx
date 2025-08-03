import React from 'react';
import { Award, Clock, MessageSquare, Mic, Eye, UserCheck } from 'lucide-react';

const FeedbackPage = ({ sessionData, onBackToDashboard }: { sessionData: any, onBackToDashboard: () => void }) => {
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feedback...</p>
        </div>
      </div>
    );
  }

  const { overallScore, duration, responses, assemblyai_data, gaze, headPose, posture } = sessionData;

  return (
    <div className="min-h-screen bg-dark-900 text-white pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">Interview Feedback</h1>
          <button
            onClick={onBackToDashboard}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Overall Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Overall Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{overallScore}%</div>
          </div>
          <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Duration</span>
            </div>
            <div className="text-3xl font-bold text-white">{Math.floor(duration / 60)}m {duration % 60}s</div>
          </div>
        </div>

        {/* Answer-by-Answer Feedback */}
        <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-orange-400" />
            Answer-by-Answer Feedback
          </h2>
          <div className="space-y-4">
            {responses.map((res: any, index: number) => (
              <div key={index} className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30">
                <p className="text-gray-400 mb-2">Q: {res.questionText}</p>
                <p className="text-white">{res.response}</p>
                <div className="mt-2 text-sm text-green-400">{res.analysis?.feedback}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Analytics */}
        <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
            <Mic className="w-6 h-6 text-blue-400" />
            Voice Analytics
          </h2>
          {assemblyai_data ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Sentiment:</p>
                <p className="text-2xl font-bold">{assemblyai_data.sentiment}</p>
              </div>
              <div>
                <p className="text-gray-400">Words Per Minute:</p>
                <p className="text-2xl font-bold">{/* Placeholder for WPM */}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Voice analytics not available for this session.</p>
          )}
        </div>

        {/* Computer Vision Feedback */}
        <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
            <Eye className="w-6 h-6 text-purple-400" />
            Body Language
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Gaze:</p>
              <p className="text-2xl font-bold">{gaze?.isLookingAtCamera ? 'Good' : 'Look at camera'}</p>
            </div>
            <div>
              <p className="text-gray-400">Head Pose:</p>
              <p className="text-2xl font-bold">{headPose?.isFacingForward ? 'Good' : 'Face forward'}</p>
            </div>
            <div>
              <p className="text-gray-400">Posture:</p>
              <p className="text-2xl font-bold">{posture?.isSlouching ? 'Sit up straight' : 'Good'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;

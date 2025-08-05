import React from 'react';
import type { CameraPresence, PostureScore } from '../../types/analytics';

interface SophisticatedResultsViewProps {
  analyticsReport: unknown;
}

/**
 * Displays computer vision analytics such as camera presence and posture.
 * Falls back to rendering raw JSON if structured metrics are unavailable.
 */
const SophisticatedResultsView: React.FC<SophisticatedResultsViewProps> = ({ analyticsReport }) => {
  if (!analyticsReport) return null;
  const report = analyticsReport as Record<string, unknown>;
  const cameraPresence = report.cameraPresence as CameraPresence | undefined;
  const posture = report.posture as PostureScore | undefined;

  if (!cameraPresence && !posture) {
    return (
      <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mt-8">
        <h3 className="text-xl font-semibold text-white mb-4">Analytics Report</h3>
        <pre className="text-xs text-gray-300 overflow-x-auto">
          {JSON.stringify(analyticsReport, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mt-8 space-y-6">
      <h3 className="text-xl font-semibold text-white">Analytics Report</h3>
      {cameraPresence && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Camera Presence</h4>
          <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
            <li>Lighting: {Math.round(cameraPresence.lighting * 100)}%</li>
            <li>Eye Contact: {Math.round(cameraPresence.eyeContact * 100)}%</li>
          </ul>
          <p className="text-sm text-gray-400">{cameraPresence.suggestions.join(' ')}</p>
        </div>
      )}
      {posture && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Posture</h4>
          <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
            <li>Confidence: {Math.round(posture.confidence * 100)}%</li>
          </ul>
          <p className="text-sm text-gray-400">{posture.suggestions.join(' ')}</p>
        </div>
      )}
    </div>
  );
};

export default SophisticatedResultsView;


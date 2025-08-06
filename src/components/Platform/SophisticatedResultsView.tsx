import React from 'react';
import type { CameraPresence, PostureScore, CameraTimelinePoint } from '../../types/analytics';

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
  const recordingUrl = report.recordingUrl as string | undefined;
  const timeline = report.analysisTimeline as CameraTimelinePoint[] | undefined;

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
      {recordingUrl && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Session Replay</h4>
          <video src={recordingUrl} controls className="w-full rounded-lg mb-4" />
        </div>
      )}
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
      {timeline && timeline.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Camera Metrics Timeline</h4>
          <ul className="text-sm text-gray-300 space-y-1 max-h-64 overflow-y-auto pr-2">
            {timeline.map(point => (
              <li key={point.timestamp} className="flex justify-between">
                <span className="text-gray-400">
                  {new Date(point.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                </span>
                <span>
                  Eye {Math.round(point.cameraPresence.eyeContact * 100)}% · Smile {Math.round(point.cameraPresence.smile * 100)}% ·
                  Conf {Math.round(point.posture.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SophisticatedResultsView;


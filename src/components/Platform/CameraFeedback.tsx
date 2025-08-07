import React from 'react';
import { Sun, Eye, Smile, Move, Square, Activity, UserCheck, Video, Maximize, XCircle } from 'lucide-react';
import type { CameraPresence, PostureScore, CameraTimelinePoint } from '../../types/analytics';

interface Props {
  cameraPresence?: CameraPresence;
  posture?: PostureScore;
  recordingUrl?: string;
  timeline?: CameraTimelinePoint[];
}

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  lighting: Sun,
  eyeContact: Eye,
  facialExpressiveness: Smile,
  headPositionStability: Move,
  framing: Square,
  blinkRate: Activity,
  confidence: UserCheck,
  distance: Maximize,
  offFrame: XCircle,
};

const metricLabels: Record<string, string> = {
  lighting: 'Lighting',
  eyeContact: 'Eye Contact',
  facialExpressiveness: 'Facial Expressiveness',
  headPositionStability: 'Head Position Stability',
  framing: 'Framing',
  blinkRate: 'Blink Rate',
  confidence: 'Posture Confidence',
  distance: 'Distance to Camera',
  offFrame: 'Off-Frame Time',
};

const CameraFeedback: React.FC<Props> = ({ cameraPresence, posture, recordingUrl, timeline }) => {
  if (!cameraPresence && !posture) {
    return <p className="text-sm text-gray-400">No camera data collected.</p>;
  }

  const metrics: { key: string; value: number; suggestions?: string[] }[] = [];
  if (cameraPresence) {
    Object.keys(metricLabels).forEach((key) => {
      const value = (cameraPresence as Record<string, number | undefined>)[key];
      if (value !== undefined) {
        metrics.push({ key, value, suggestions: cameraPresence.suggestions });
      }
    });
  }
  if (posture) {
    metrics.push({ key: 'confidence', value: posture.confidence, suggestions: posture.suggestions });
  }

  const startTime = timeline?.[0]?.timestamp ?? 0;

  return (
    <div className="space-y-6">
      {recordingUrl && (
        <div>
          <video src={recordingUrl} controls className="w-full rounded-lg" />
        </div>
      )}

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => {
            const Icon = metricIcons[m.key];
            return (
              <div
                key={m.key}
                className="bg-dark-700/30 rounded-lg p-4 border border-dark-600/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-orange-400" />}
                    <span className="text-sm font-medium text-white">
                      {metricLabels[m.key]}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {Math.round(m.value * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                    style={{ width: `${m.value * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cameraPresence?.suggestions && cameraPresence.suggestions.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Video className="w-4 h-4 text-orange-400" />
            Suggestions
          </h5>
          <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
            {cameraPresence.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {posture?.suggestions && posture.suggestions.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2">Posture Tips</h5>
          <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
            {posture.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {timeline && timeline.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2">Timeline Flags</h5>
          <ul className="text-xs text-gray-300 space-y-2 max-h-48 overflow-y-auto pr-2">
            {timeline.map((point) => {
              const offset = (point.timestamp - startTime) / 1000;
              return (
                <li key={point.timestamp}>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {new Date(offset * 1000).toISOString().substr(14, 5)}
                    </span>
                    <span>
                      Eye {Math.round(point.cameraPresence.eyeContact * 100)}% · Light {Math.round(point.cameraPresence.lighting * 100)}% · Conf {Math.round(point.posture.confidence * 100)}%
                    </span>
                  </div>
                  {point.triggers && point.triggers.length > 0 && (
                    <div className="text-orange-400">
                      {point.triggers.join(' | ')}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CameraFeedback;

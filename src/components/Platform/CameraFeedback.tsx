import React from 'react';
import type { CameraPresence, PostureScore } from '../../types/analytics';

interface Props {
  cameraPresence?: CameraPresence;
  posture?: PostureScore;
}

const metricLabels: Record<string, string> = {
  lighting: 'Lighting',
  eyeContact: 'Eye Contact',
  facialExpressiveness: 'Facial Expressiveness',
  headPositionStability: 'Head Position Stability',
  framing: 'Framing',
  blinkRate: 'Blink Rate'
};

const CameraFeedback: React.FC<Props> = ({ cameraPresence, posture }) => {
  if (!cameraPresence && !posture) {
    return <p className="text-sm text-gray-400">No camera data collected.</p>;
  }

  return (
    <>
      {cameraPresence && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white mb-2">Presence</h4>
          <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
            {Object.entries(metricLabels).map(([key, label]) => {
              const value = (cameraPresence as Record<string, number | undefined>)[key];
              if (value === undefined) return null;
              return <li key={key}>{label}: {Math.round(value * 100)}%</li>;
            })}
          </ul>
          {cameraPresence.suggestions && cameraPresence.suggestions.length > 0 && (
            <ul className="text-xs text-gray-400 list-disc list-inside">
              {cameraPresence.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {posture && (
        <div>
          <h4 className="text-sm font-medium text-white mb-2">Posture</h4>
          <ul className="text-sm text-gray-300 mb-2 list-disc list-inside">
            <li>Confidence: {Math.round(posture.confidence * 100)}%</li>
          </ul>
          {posture.suggestions && posture.suggestions.length > 0 && (
            <ul className="text-xs text-gray-400 list-disc list-inside">
              {posture.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default CameraFeedback;

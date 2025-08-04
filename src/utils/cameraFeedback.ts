import type { CameraPresence, PostureScore } from '../types/analytics';

/**
 * Basic camera presence analysis using Canvas API.
 * Evaluates lighting by averaging pixel brightness and
 * estimates eye contact based on face position if the
 * browser FaceDetector API is available.
 */
export async function analyzeCameraPresence(video: HTMLVideoElement): Promise<CameraPresence> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
  let lighting = 0;
  if (data) {
    for (let i = 0; i < data.length; i += 4) {
      lighting += data[i] + data[i + 1] + data[i + 2];
    }
    lighting = lighting / (data.length / 4) / 255; // 0..1
  }

  // Very naive eye contact detection – if FaceDetector is available we
  // assume eye contact when a face is found near the center of the frame.
  let eyeContact = 0.5;
  if ('FaceDetector' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(canvas);
      if (faces.length > 0) {
        const { boundingBox } = faces[0];
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = boundingBox.y + boundingBox.height / 2;
        const distX = Math.abs(centerX - canvas.width / 2) / (canvas.width / 2);
        const distY = Math.abs(centerY - canvas.height / 2) / (canvas.height / 2);
        eyeContact = Math.max(0, 1 - (distX + distY) / 2);
      } else {
        eyeContact = 0;
      }
    } catch {
      /* FaceDetector not available */
    }
  }

  const suggestions: string[] = [];
  if (lighting < 0.4) suggestions.push('Increase lighting in front of you.');
  if (eyeContact < 0.5) suggestions.push('Try to look toward the camera lens.');
  if (suggestions.length === 0) suggestions.push('Great camera presence.');

  return {
    lighting: Number(lighting.toFixed(2)),
    eyeContact: Number(eyeContact.toFixed(2)),
    smile: 0, // Placeholder – real model would be required
    attentiveness: 0.5,
    suggestions,
  };
}

/**
 * Approximate posture score by checking if the detected face is vertically
 * centered. Returns 1 when the face is near the vertical center.
 */
export async function analyzePosture(video: HTMLVideoElement): Promise<PostureScore> {
  if ('FaceDetector' in window) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(canvas);
      if (faces.length > 0) {
        const { boundingBox } = faces[0];
        const centerY = boundingBox.y + boundingBox.height / 2;
        const distY = Math.abs(centerY - canvas.height / 2) / (canvas.height / 2);
        const confidence = Number(Math.max(0, 1 - distY).toFixed(2));
        return {
          confidence,
          suggestions: confidence < 0.7
            ? ['Sit upright and center yourself in the frame.']
            : ['Good posture maintained.']
        };
      }
    } catch {
      /* ignore */
    }
  }
  return {
    confidence: 0.5,
    suggestions: ['Ensure your face is visible and centered in the frame.']
  };
}


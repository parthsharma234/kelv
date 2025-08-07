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
    // Average RGB brightness and normalise to 0..1 range
    lighting = lighting / (data.length / 4) / (255 * 3);
    lighting = Math.min(Math.max(lighting, 0), 1);
  }

  // Very naive eye contact detection – if FaceDetector is available we
  // assume eye contact when a face is found near the center of the frame.
  let eyeContact = 0.5;
  let framing = 0.5;
  let headPositionStability = 0.5;
  let facialExpressiveness = 0.5;
  let blinkRate = 0.5;
  let distance = 0.5;
  let offFrame = 0;
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
        framing = Math.max(0, 1 - Math.max(distX, distY));
        // Face size relative to frame as a proxy for distance
        const faceArea = boundingBox.width * boundingBox.height;
        const frameArea = canvas.width * canvas.height;
        const faceRatio = faceArea / frameArea;
        const idealRatio = 0.1; // ~10% of frame
        distance = Math.max(0, 1 - Math.abs(faceRatio - idealRatio) / idealRatio);
        // Determine if face is mostly within central 70% of frame
        const withinX =
          boundingBox.x > canvas.width * 0.15 &&
          boundingBox.x + boundingBox.width < canvas.width * 0.85;
        const withinY =
          boundingBox.y > canvas.height * 0.15 &&
          boundingBox.y + boundingBox.height < canvas.height * 0.85;
        offFrame = withinX && withinY ? 0 : 1;
        // Placeholders – real implementations would require temporal analysis
        headPositionStability = 0.5;
        facialExpressiveness = 0.5;
        blinkRate = 0.5;
      } else {
        eyeContact = 0;
        framing = 0;
        distance = 0;
        offFrame = 1;
      }
    } catch {
      /* FaceDetector not available */
    }
  }

  const suggestions: string[] = [];
  if (lighting < 0.4)
    suggestions.push('Add a front-facing light source like a lamp or sit facing a window.');
  if (eyeContact < 0.5)
    suggestions.push('Look more directly into your webcam, not at your screen.');
  if (headPositionStability < 0.6)
    suggestions.push('Keep your head steady and minimize unnecessary movement.');
  if (framing < 0.6)
    suggestions.push('Center your face within the webcam view with appropriate headroom.');
  if (facialExpressiveness < 0.4)
    suggestions.push('Use more varied facial expressions to appear engaged.');
  if (blinkRate < 0.4)
    suggestions.push('Maintain focus on the camera and avoid distractions.');
  if (distance < 0.4)
    suggestions.push('Move closer or further so your face fills about 10% of the frame.');
  if (offFrame > 0)
    suggestions.push('Keep your face within the camera frame.');
  if (suggestions.length === 0) suggestions.push('Great camera presence.');

  const result: CameraPresence = {
    lighting: Number(lighting.toFixed(2)),
    eyeContact: Number(eyeContact.toFixed(2)),
    smile: 0, // Placeholder – real model would be required
    attentiveness: 0.5,
    facialExpressiveness,
    headPositionStability,
    framing,
    blinkRate,
    distance: Number(distance.toFixed(2)),
    offFrame,
    suggestions,
  };

  console.debug('Camera analysis result', result);
  return result;
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
        const posture: PostureScore = {
          confidence,
          suggestions: confidence < 0.7
            ? ['Sit upright, center your face, and avoid leaning.']
            : ['Good posture maintained.']
        };
        console.debug('Posture analysis result', posture);
        return posture;
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


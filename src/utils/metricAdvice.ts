export type CameraMetricKey =
  | 'lighting'
  | 'eyeContact'
  | 'facialExpressiveness'
  | 'headPositionStability'
  | 'framing'
  | 'blinkRate'
  | 'distance'
  | 'offFrame'
  | 'confidence';

export function getCameraMetricAdvice(key: CameraMetricKey, value: number): string {
  switch (key) {
    case 'lighting':
      if (value < 0.4) return 'Place a light source in front of you (lamp/window) and reduce backlighting.';
      if (value < 0.7) return 'Angle your screen and move slightly to avoid shadows on your face.';
      return 'Lighting looks good. Keep the light in front and slightly above eye level.';
    case 'eyeContact':
      if (value < 0.4) return 'Move notes near the webcam and end sentences by glancing at the camera.';
      if (value < 0.7) return 'Raise your webcam to eye level and look at it while listening.';
      return 'Strong eye contact. Maintain brief glances to the camera during key points.';
    case 'facialExpressiveness':
      if (value < 0.4) return 'Add more facial variety—occasional smiles and eyebrow movement signal engagement.';
      if (value < 0.7) return 'React visibly to your points—small smiles and nods help.';
      return 'Good expressiveness. Keep it natural and context-appropriate.';
    case 'headPositionStability':
      if (value < 0.4) return 'Stabilize your setup—rest forearms and avoid fidgeting or frequent head shifts.';
      if (value < 0.7) return 'Sit back against the chair and keep movements smooth and minimal.';
      return 'Stable posture. Maintain smooth, intentional movements.';
    case 'framing':
      if (value < 0.4) return 'Center your face and leave a little headroom. Avoid cutting off the top of your head.';
      if (value < 0.7) return 'Reposition camera so your face sits near the middle of the frame.';
      return 'Good framing. Stay centered with consistent headroom.';
    case 'blinkRate':
      if (value < 0.3) return 'Blink naturally—soften your gaze and relax facial tension to avoid staring.';
      if (value > 0.85) return 'Reduce rapid blinking—slow your pace and steady your breathing.';
      return 'Blinking looks natural. Keep a relaxed gaze.';
    case 'distance':
      if (value < 0.4) return 'Move closer so your face fills roughly 10% of the frame.';
      if (value < 0.7) return 'Slightly adjust distance for a balanced head-and-shoulders view.';
      return 'Good distance from the camera. Maintain this spacing.';
    case 'offFrame':
      if (value > 0.3) return 'Stay centered—avoid leaning out of frame and keep your face fully visible.';
      if (value > 0.1) return 'Minimize side leans and keep both eyes within frame.';
      return 'You’re staying in frame consistently. Nice job.';
    case 'confidence':
      if (value < 0.6) return 'Sit upright with squared shoulders; keep the camera at eye level for presence.';
      if (value < 0.8) return 'Maintain an open chest and steady head position to project confidence.';
      return 'Confident posture. Keep shoulders open and chin level.';
    default:
      return '';
  }
}

export function getCameraMetricTips(key: CameraMetricKey, value: number): string[] {
  const tips: string[] = [];
  switch (key) {
    case 'lighting':
      if (value < 0.4) tips.push('Face a window or lamp; avoid strong backlight.');
      tips.push('Position light slightly above eye level to reduce shadows.');
      tips.push('If overexposed, move light farther or diffuse it with a shade.');
      break;
    case 'eyeContact':
      if (value < 0.5) tips.push('Place notes near the webcam to reduce eye shifts.');
      tips.push('End key sentences by glancing at the camera.');
      tips.push('Raise laptop/webcam to eye level.');
      break;
    case 'facialExpressiveness':
      tips.push('Smile lightly when greeting and acknowledging.');
      tips.push('Nod subtly to show active listening.');
      tips.push('Vary eyebrows and mouth corners to add warmth.');
      break;
    case 'headPositionStability':
      tips.push('Rest forearms on desk or armrests.');
      tips.push('Keep feet planted to reduce sway.');
      tips.push('Use a stable chair; avoid leaning in and out.');
      break;
    case 'framing':
      tips.push('Center your face with a small amount of headroom.');
      tips.push('Avoid cutting off the top of your head.');
      tips.push('Align camera horizontally to your face.');
      break;
    case 'blinkRate':
      if (value < 0.3) tips.push('Relax face muscles to avoid staring.');
      if (value > 0.85) tips.push('Slow your breathing to reduce rapid blinking.');
      tips.push('Take micro-pauses between sentences.');
      break;
    case 'distance':
      tips.push('Aim for head-and-shoulders framing (~10% face area).');
      tips.push('Adjust chair distance or zoom level to fit.');
      break;
    case 'offFrame':
      tips.push('Stay centered; avoid leaning out of frame.');
      tips.push('Reposition chair and camera so normal movement stays inside view.');
      break;
    case 'confidence':
      tips.push('Square shoulders and keep chin level.');
      tips.push('Sit upright with back supported.');
      tips.push('Keep movements smooth and intentional.');
      break;
  }
  return tips;
}


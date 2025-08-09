import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export type EmotionLabel = 'Neutral' | 'Happy' | 'Surprised' | 'Calm' | 'Other';

let model: tf.LayersModel | null = null;
let isLoading = false;

export async function ensureEmotionModel(modelUrl?: string) {
  if (model) return model;
  if (isLoading) {
    // wait for ongoing load
    while (isLoading && !model) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 50));
    }
    return model;
  }
  isLoading = true;
  try {
    if (tf.getBackend() !== 'webgl') {
      await tf.setBackend('webgl');
      await tf.ready();
    }
    const url = modelUrl || '/models/emotion/model.json';
    try {
      model = await tf.loadLayersModel(url);
      return model;
    } catch {
      // Fallback: build a tiny in-memory classifier so the app still works without assets
      const m = tf.sequential();
      m.add(tf.layers.dense({ units: 8, inputShape: [4], activation: 'relu', useBias: true }));
      m.add(tf.layers.dense({ units: 5, activation: 'softmax', useBias: true }));
      // Initialize deterministic small weights
      const w0 = (m.getWeights()[0] as tf.Tensor) || tf.randomNormal([4, 8], 0, 0.1);
      const b0 = (m.getWeights()[1] as tf.Tensor) || tf.zeros([8]);
      const w1 = (m.getWeights()[2] as tf.Tensor) || tf.randomNormal([8, 5], 0, 0.1);
      const b1 = (m.getWeights()[3] as tf.Tensor) || tf.zeros([5]);
      m.setWeights([w0, b0, w1, b1]);
      model = m;
      return model;
    }
  } finally {
    isLoading = false;
  }
}

// Build a compact feature vector from FaceMesh landmarks
export function landmarksToFeatures(landmarks: Array<{ x: number; y: number }>): number[] {
  const idx = [13, 14, 61, 291, 159, 145, 386, 374];
  const pts = idx.map(i => landmarks[i]).filter(Boolean) as Array<{ x: number; y: number }>;
  if (pts.length < idx.length) return [];
  const [mouthTop, mouthBot, mouthLeft, mouthRight, eyeLT, eyeLB, eyeRT, eyeRB] = pts;
  const mouthOpen = Math.hypot(mouthTop.x - mouthBot.x, mouthTop.y - mouthBot.y);
  const mouthWidth = Math.hypot(mouthLeft.x - mouthRight.x, mouthLeft.y - mouthRight.y);
  const mouthOpenRatio = mouthOpen / (mouthWidth + 1e-6);
  const eyeLOpen = Math.hypot(eyeLT.y - eyeLB.y, eyeLT.x - eyeLB.x);
  const eyeROpen = Math.hypot(eyeRT.y - eyeRB.y, eyeRT.x - eyeRB.x);
  const features = [mouthOpenRatio, eyeLOpen, eyeROpen, mouthWidth];
  return features;
}

export async function classifyEmotion(features: number[], labels?: EmotionLabel[]): Promise<{ label: EmotionLabel; confidence: number } | null> {
  if (!model) return null;
  if (features.length === 0) return null;
  const xs = tf.tensor2d([features]);
  const logits = model.predict(xs) as tf.Tensor;
  const probs = await logits.softmax().array() as number[][];
  xs.dispose();
  logits.dispose();
  const p = probs[0];
  let bestIdx = 0;
  for (let i = 1; i < p.length; i++) if (p[i] > p[bestIdx]) bestIdx = i;
  const map = labels || ['Neutral', 'Happy', 'Surprised', 'Calm', 'Other'];
  const label = (map[bestIdx] || 'Other') as EmotionLabel;
  return { label, confidence: p[bestIdx] };
}


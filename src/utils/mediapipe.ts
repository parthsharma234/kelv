import { FaceLandmarker, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

let faceLandmarker: FaceLandmarker;
let poseLandmarker: PoseLandmarker;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

const createFaceLandmarker = async () => {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
};

const createPoseLandmarker = async () => {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
      delegate: "GPU"
    },
    runningMode,
    numPoses: 1
  });
};

export const initializeMediaPipe = async () => {
  await Promise.all([createFaceLandmarker(), createPoseLandmarker()]);
};

export const processVideo = (video: HTMLVideoElement, time: number) => {
  if (!faceLandmarker || !poseLandmarker) {
    return null;
  }

  const faceResults = faceLandmarker.detectForVideo(video, time);
  const poseResults = poseLandmarker.detectForVideo(video, time);

  return { faceResults, poseResults };
};

export const drawResults = (canvas: HTMLCanvasElement, video: HTMLVideoElement, faceResults: any, poseResults: any) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (faceResults && faceResults.faceLandmarks) {
    for (const landmarks of faceResults.faceLandmarks) {
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
        color: "#C0C0C070",
        lineWidth: 1
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
        color: "#FF3030"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
        color: "#FF3030"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
        color: "#30FF30"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
        color: "#30FF30"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
        color: "#E0E0E0"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
        color: "#E0E0E0"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
        color: "#FF3030"
      });
      drawConnectors(ctx, landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
        color: "#30FF30"
      });
    }
  }

  if (poseResults && poseResults.landmarks) {
    for (const landmark of poseResults.landmarks) {
      drawLandmarks(ctx, landmark, { color: "#FF0000", lineWidth: 2 });
      drawConnectors(ctx, landmark, PoseLandmarker.POSE_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 3
      });
    }
  }
};

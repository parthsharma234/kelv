import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, CheckCircle, Camera, Wind, Mic2, Volume2, User, AlertTriangle } from 'lucide-react';
import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

type WarmUpStage = 'posture' | 'breathing' | 'voice';

interface PostureAnalysis {
  isUpright: boolean;
  shoulderAlignment: number; // 0-100, 100 = perfect
  headPosition: string; // 'forward', 'centered', 'tilted'
  confidence: number;
}

interface WarmUpExercise {
  id: string;
  stage: WarmUpStage;
  title: string;
  instruction: string;
  duration: number; // seconds
  successCriteria: string;
  icon: React.FC<{ className?: string }>;
}

const WARM_UP_EXERCISES: WarmUpExercise[] = [
  // POSTURE STAGE
  {
    id: 'posture-check',
    stage: 'posture',
    title: 'Posture Check',
    instruction: 'Sit up straight with your shoulders back. Your head should be centered over your shoulders, not leaning forward. Look directly at the camera.',
    duration: 15,
    successCriteria: 'Maintain upright posture for 10 seconds',
    icon: User
  },

  // BREATHING STAGE
  {
    id: 'deep-breathing',
    stage: 'breathing',
    title: 'Deep Breathing',
    instruction: 'Breathe in slowly through your nose for 4 counts. Hold for 2 counts. Exhale through your mouth for 6 counts. This calms your nervous system.',
    duration: 30,
    successCriteria: 'Complete 3 breath cycles',
    icon: Wind
  },
  {
    id: 'box-breathing',
    stage: 'breathing',
    title: 'Box Breathing',
    instruction: 'Breathe in for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat. Used by Navy SEALs to stay calm under pressure.',
    duration: 30,
    successCriteria: 'Complete 2 full boxes',
    icon: Wind
  },

  // VOICE STAGE
  {
    id: 'vocal-warmup',
    stage: 'voice',
    title: 'Lip Warm-Up',
    instruction: 'Say "Ba, Ba, Ba, Ba, Ba" with exaggerated lip movement. This warms up your articulation muscles.',
    duration: 10,
    successCriteria: 'Clear pronunciation detected',
    icon: Mic2
  },
  {
    id: 'vocal-siren',
    stage: 'voice',
    title: 'Vocal Siren',
    instruction: 'Start high with "Weee" and slide down to "Aww". Then reverse. This expands your vocal range and prevents monotone delivery.',
    duration: 15,
    successCriteria: 'Pitch variation detected',
    icon: Volume2
  }
];

interface InteractiveWarmUpProps {
  onComplete: () => void;
  onSkip: () => void;
}

const InteractiveWarmUp: React.FC<InteractiveWarmUpProps> = ({ onComplete, onSkip }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARM_UP_EXERCISES[0].duration);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Posture Detection State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [postureAnalysis, setPostureAnalysis] = useState<PostureAnalysis | null>(null);
  const [postureGood, setPostureGood] = useState(false);
  const [postureGoodDuration, setPostureGoodDuration] = useState(0);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  // Breathing Exercise State
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);

  const exercise = WARM_UP_EXERCISES[currentExercise];
  const progress = ((currentExercise + 1) / WARM_UP_EXERCISES.length) * 100;

  // Initialize MediaPipe Pose for posture detection
  useEffect(() => {
    if (exercise.stage === 'posture' && !poseRef.current) {
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onPoseResults);
      poseRef.current = pose;
    }
  }, [exercise.stage]);

  // Start camera for posture check
  useEffect(() => {
    if (exercise.stage === 'posture' && isActive && videoRef.current && poseRef.current) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [exercise.stage, isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);

        // Start MediaPipe Camera
        if (poseRef.current && videoRef.current) {
          const camera = new MediaPipeCamera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
          cameraRef.current = camera;
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
  };

  const onPoseResults = (results: PoseResults) => {
    if (!results.poseLandmarks) {
      setPostureAnalysis(null);
      return;
    }

    const landmarks = results.poseLandmarks;

    // Key landmarks for posture
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    // Calculate shoulder alignment (should be horizontal)
    const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = Math.max(0, 100 - (shoulderSlope * 500)); // Convert to 0-100 scale

    // Check if head is centered (not leaning forward)
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgEarY = (leftEar.y + rightEar.y) / 2;
    const headForwardOffset = avgEarY - avgShoulderY;

    let headPosition: string;
    if (headForwardOffset > 0.15) headPosition = 'forward';
    else if (Math.abs(headForwardOffset) < 0.15) headPosition = 'centered';
    else headPosition = 'tilted';

    const isUpright = shoulderAlignment > 70 && headPosition === 'centered';

    setPostureAnalysis({
      isUpright,
      shoulderAlignment: Math.round(shoulderAlignment),
      headPosition,
      confidence: results.poseLandmarks ? 95 : 0
    });

    // Track good posture duration
    if (isUpright) {
      setPostureGood(true);
      setPostureGoodDuration(prev => prev + 0.1); // ~10Hz update rate
    } else {
      setPostureGood(false);
      setPostureGoodDuration(0);
    }

    // Draw skeleton on canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw pose landmarks
        ctx.fillStyle = postureGood ? 'rgb(16 185 129)' : 'rgb(239 68 68)';
        landmarks.forEach(landmark => {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvasRef.current!.width,
            landmark.y * canvasRef.current!.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        });
      }
    }
  };

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            handleCompleteExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeRemaining]);

  // Breathing animation timer
  useEffect(() => {
    if (exercise.stage === 'breathing' && isActive) {
      const phaseDurations: Record<typeof breathingPhase, number> = {
        inhale: 4,
        hold: exercise.id === 'box-breathing' ? 4 : 2,
        exhale: exercise.id === 'box-breathing' ? 4 : 6,
        hold2: exercise.id === 'box-breathing' ? 4 : 0
      };

      const timer = setInterval(() => {
        setBreathCount(prev => {
          const nextCount = prev + 1;
          const currentDuration = phaseDurations[breathingPhase];

          if (nextCount >= currentDuration) {
            // Move to next phase
            if (breathingPhase === 'inhale') setBreathingPhase('hold');
            else if (breathingPhase === 'hold') setBreathingPhase('exhale');
            else if (breathingPhase === 'exhale') {
              if (exercise.id === 'box-breathing') {
                setBreathingPhase('hold2');
              } else {
                setBreathingPhase('inhale');
                setBreathCycles(prev => prev + 1);
              }
            } else if (breathingPhase === 'hold2') {
              setBreathingPhase('inhale');
              setBreathCycles(prev => prev + 1);
            }
            return 0;
          }
          return nextCount;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exercise.stage, exercise.id, isActive, breathingPhase]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleCompleteExercise = () => {
    setCompletedExercises(prev => new Set([...prev, exercise.id]));
    if (currentExercise < WARM_UP_EXERCISES.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(WARM_UP_EXERCISES[currentExercise + 1].duration);
      setIsActive(false);
      setBreathingPhase('inhale');
      setBreathCount(0);
      setBreathCycles(0);
      setPostureGoodDuration(0);
    } else {
      onComplete();
    }
  };

  const handleSkipExercise = () => {
    if (currentExercise < WARM_UP_EXERCISES.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(WARM_UP_EXERCISES[currentExercise + 1].duration);
      setIsActive(false);
      setBreathingPhase('inhale');
      setBreathCount(0);
      setBreathCycles(0);
      setPostureGoodDuration(0);
    } else {
      onComplete();
    }
  };

  const renderExerciseContent = () => {
    if (exercise.stage === 'posture') {
      return (
        <div className="space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              width={640}
              height={480}
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-400">Camera will start when you begin</p>
                </div>
              </div>
            )}
          </div>

          {postureAnalysis && (
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${postureAnalysis.isUpright
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
                }`}>
                <p className="text-xs text-gray-500">Status</p>
                <p className={`text-sm font-bold ${postureAnalysis.isUpright ? 'text-green-400' : 'text-red-400'}`}>
                  {postureAnalysis.isUpright ? 'Good Posture' : 'Needs Adjustment'}
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-500">Shoulder Alignment</p>
                <p className="text-sm font-bold text-white">{postureAnalysis.shoulderAlignment}%</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-500">Head Position</p>
                <p className="text-sm font-bold text-white capitalize">{postureAnalysis.headPosition}</p>
              </div>
            </div>
          )}

          {postureGoodDuration >= 10 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-400 font-medium">Perfect! Held good posture for 10 seconds</p>
            </div>
          )}
        </div>
      );
    }

    if (exercise.stage === 'breathing') {
      const getBreathingScale = () => {
        if (breathingPhase === 'inhale') return 1 + (breathCount / 4) * 0.5;
        if (breathingPhase === 'exhale') return 1.5 - (breathCount / 6) * 0.5;
        return breathingPhase === 'hold' || breathingPhase === 'hold2' ? 1.5 : 1;
      };

      const getBreathingColor = () => {
        if (breathingPhase === 'inhale') return 'from-blue-500 to-blue-600';
        if (breathingPhase === 'exhale') return 'from-orange-500 to-orange-600';
        return 'from-purple-500 to-purple-600';
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ scale: getBreathingScale() }}
              transition={{ duration: 1 }}
              className={`w-48 h-48 rounded-full bg-gradient-to-br ${getBreathingColor()} opacity-50 blur-xl`}
            />
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold capitalize mb-2">{breathingPhase.replace('hold2', 'Hold')}</p>
            <p className="text-lg text-gray-400">
              {breathingPhase === 'inhale' && 'Breathe in slowly through your nose'}
              {breathingPhase === 'hold' && 'Hold your breath'}
              {breathingPhase === 'exhale' && 'Breathe out slowly through your mouth'}
              {breathingPhase === 'hold2' && 'Hold your breath'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Breath Cycles Completed</p>
            <p className="text-2xl font-bold text-orange-400">{breathCycles} / {exercise.id === 'box-breathing' ? '2' : '3'}</p>
          </div>
        </div>
      );
    }

    // Voice stage
    return (
      <div className="space-y-6">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-3 text-orange-400" />
          <p className="text-lg font-medium text-gray-300">{exercise.instruction}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Speak clearly and with energy</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Interactive Warm-Up</h1>
          <p className="text-gray-400">Get physically and mentally ready for your interview</p>
          <button
            onClick={onSkip}
            className="mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip Warm-Up
          </button>
        </div>

        {/* Stage Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`px-4 py-2 rounded-full border ${exercise.stage === 'posture'
            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
            : 'bg-white/5 border-white/10 text-gray-500'
            }`}>
            Posture
          </div>
          <div className={`px-4 py-2 rounded-full border ${exercise.stage === 'breathing'
            ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
            : 'bg-white/5 border-white/10 text-gray-500'
            }`}>
            Breathing
          </div>
          <div className={`px-4 py-2 rounded-full border ${exercise.stage === 'voice'
            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
            : 'bg-white/5 border-white/10 text-gray-500'
            }`}>
            Voice
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Exercise {currentExercise + 1} of {WARM_UP_EXERCISES.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Exercise Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <exercise.icon className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{exercise.title}</h2>
                  <p className="text-sm text-gray-500">{exercise.successCriteria}</p>
                </div>
              </div>
              {completedExercises.has(exercise.id) && (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-300 leading-relaxed">{exercise.instruction}</p>
            </div>

            {/* Exercise Content */}
            {renderExerciseContent()}

            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20">
                <span className="text-3xl font-bold">{timeRemaining}s</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!isActive ? (
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-medium transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Exercise
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}
              <button
                onClick={handleSkipExercise}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <SkipForward className="w-5 h-5" />
                Skip
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {WARM_UP_EXERCISES.map((ex, idx) => (
            <div
              key={ex.id}
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentExercise
                ? 'bg-orange-500'
                : completedExercises.has(ex.id)
                  ? 'bg-green-500'
                  : 'bg-white/20'
                }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveWarmUp;

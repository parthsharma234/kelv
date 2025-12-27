import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, CheckCircle, X, Wind, Mic2, Volume2 } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  instruction: string;
  soundGuide: string; // The sound to make
  duration: number; // in seconds
  benefits: string;
  icon: React.FC<{ className?: string }>;
}

const WARMUP_EXERCISES: Exercise[] = [
  {
    id: 'breathing',
    title: 'Deep Breathing',
    instruction: 'Stand tall. Raise your arms above your head as you breathe in deeply through your nose. Hold for 2 seconds, then lower your arms while sighing out "Ahhhhh" through your mouth.',
    soundGuide: 'Ahhhhh (low and sustained)',
    duration: 20,
    benefits: 'Relaxes vocal cords, reduces anxiety, centers your energy',
    icon: Wind
  },
  {
    id: 'lip-warmup',
    title: 'Lip Warm-Up',
    instruction: 'Relax your lips and repeat "Ba, Ba, Ba, Ba, Ba" with exaggerated lip movement. Focus on crisp articulation.',
    soundGuide: 'Ba, Ba, Ba, Ba, Ba',
    duration: 15,
    benefits: 'Warms up lip muscles for clear pronunciation',
    icon: Mic2
  },
  {
    id: 'lip-trill',
    title: 'Lip Trill (Motorboat)',
    instruction: 'Keep your lips loose and blow air through them to create a motorboat sound: "Brrrrrr". Let your lips vibrate freely.',
    soundGuide: 'Brrrrrr (like a motorboat)',
    duration: 15,
    benefits: 'Releases tension in lips and facial muscles',
    icon: Volume2
  },
  {
    id: 'tongue-warmup',
    title: 'Tongue Warm-Up',
    instruction: 'Open your mouth wide and repeat "La, la, la, la, la" with exaggerated tongue movement. Touch your tongue to the roof of your mouth each time.',
    soundGuide: 'La, la, la, la, la',
    duration: 15,
    benefits: 'Loosens tongue for clear enunciation',
    icon: Mic2
  },
  {
    id: 'rolled-r',
    title: 'Rolled R',
    instruction: 'Try to roll your Rs: "Rrrrrrr". If you can\'t roll Rs, substitute with a purring sound or vibrating "Ruh-ruh-ruh".',
    soundGuide: 'Rrrrrrr (champagne for the tongue)',
    duration: 15,
    benefits: 'Ultimate tongue exercise, increases flexibility',
    icon: Volume2
  },
  {
    id: 'siren',
    title: 'The Siren',
    instruction: 'Start high with "Weee" and slide your pitch down to "Aww" as low as you can go. Then reverse: start low and slide up high. Like a siren.',
    soundGuide: 'Weeeaawww (high to low)',
    duration: 20,
    benefits: 'Expands your vocal range, warms up pitch control',
    icon: Volume2
  }
];

interface VocalWarmUpProps {
  onComplete: () => void;
  onSkip: () => void;
}

const VocalWarmUp: React.FC<VocalWarmUpProps> = ({ onComplete, onSkip }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARMUP_EXERCISES[0].duration);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const exercise = WARMUP_EXERCISES[currentExercise];
  const progress = ((currentExercise + 1) / WARMUP_EXERCISES.length) * 100;

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            handleCompleteExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining]);

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleCompleteExercise = () => {
    setCompletedExercises(prev => new Set([...prev, exercise.id]));
    if (currentExercise < WARMUP_EXERCISES.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(WARMUP_EXERCISES[currentExercise + 1].duration);
      setIsPlaying(false);
    } else {
      // All exercises complete
      onComplete();
    }
  };

  const handleSkipExercise = () => {
    if (currentExercise < WARMUP_EXERCISES.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(WARMUP_EXERCISES[currentExercise + 1].duration);
      setIsPlaying(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Vocal Warm-Up</h1>
          <p className="text-gray-400">Prepare your voice for interview success</p>
          <button
            onClick={onSkip}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 mx-auto"
          >
            <X className="w-4 h-4" /> Skip Warm-Up
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Exercise {currentExercise + 1} of {WARMUP_EXERCISES.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Exercise Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-[#0f0f12] border border-white/5 rounded-2xl p-8 space-y-6"
          >
            {/* Exercise Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <exercise.icon className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{exercise.title}</h2>
                <p className="text-gray-400 text-sm">{exercise.benefits}</p>
              </div>
              {completedExercises.has(exercise.id) && (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {exercise.instruction}
              </p>
              <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-4 py-2 rounded-lg">
                <Volume2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">{exercise.soundGuide}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20 mb-4">
                <span className="text-4xl font-bold">
                  {isPlaying ? timeRemaining : exercise.duration}s
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!isPlaying ? (
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

        {/* Exercise Progress Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {WARMUP_EXERCISES.map((ex, idx) => (
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

export default VocalWarmUp;

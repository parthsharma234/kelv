import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, HelpCircle, Lightbulb, Zap, Target } from 'lucide-react';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type GuidanceLevel = 0 | 1 | 2 | 3; // 0 = No hints, 3 = Heavy guidance

export interface InterviewSettings {
  difficulty: DifficultyLevel;
  guidance: GuidanceLevel;
}

interface DifficultyOption {
  id: DifficultyLevel;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Gentle questions to build confidence',
    icon: Target,
    color: 'green'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Standard interview difficulty',
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Challenging questions for senior roles',
    icon: Zap,
    color: 'orange'
  },
  {
    id: 'expert',
    label: 'Expert',
    description: 'Executive-level probing questions',
    icon: Lightbulb,
    color: 'purple'
  }
];

const GUIDANCE_LABELS = [
  'No Hints',
  'Light Guidance',
  'Moderate Help',
  'Heavy Guidance'
];

interface DifficultyGuidanceControlsProps {
  settings: InterviewSettings;
  onChange: (settings: InterviewSettings) => void;
}

const DifficultyGuidanceControls: React.FC<DifficultyGuidanceControlsProps> = ({
  settings,
  onChange
}) => {
  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    onChange({ ...settings, difficulty });
  };

  const handleGuidanceChange = (guidance: GuidanceLevel) => {
    onChange({ ...settings, guidance });
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      green: {
        bg: isActive ? 'bg-green-500/10' : 'bg-white/5',
        border: isActive ? 'border-green-500/50' : 'border-white/10',
        text: isActive ? 'text-green-400' : 'text-gray-400',
        icon: isActive ? 'text-green-400' : 'text-gray-500'
      },
      blue: {
        bg: isActive ? 'bg-blue-500/10' : 'bg-white/5',
        border: isActive ? 'border-blue-500/50' : 'border-white/10',
        text: isActive ? 'text-blue-400' : 'text-gray-400',
        icon: isActive ? 'text-blue-400' : 'text-gray-500'
      },
      orange: {
        bg: isActive ? 'bg-orange-500/10' : 'bg-white/5',
        border: isActive ? 'border-orange-500/50' : 'border-white/10',
        text: isActive ? 'text-orange-400' : 'text-gray-400',
        icon: isActive ? 'text-orange-400' : 'text-gray-500'
      },
      purple: {
        bg: isActive ? 'bg-purple-500/10' : 'bg-white/5',
        border: isActive ? 'border-purple-500/50' : 'border-white/10',
        text: isActive ? 'text-purple-400' : 'text-gray-400',
        icon: isActive ? 'text-purple-400' : 'text-gray-500'
      }
    };
    return colorMap[color];
  };

  return (
    <div className="space-y-8">
      {/* Difficulty Selection */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Interview Difficulty
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIFFICULTY_OPTIONS.map((option) => {
            const isActive = settings.difficulty === option.id;
            const colors = getColorClasses(option.color, isActive);
            const Icon = option.icon;

            return (
              <motion.button
                key={option.id}
                onClick={() => handleDifficultyChange(option.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 text-left transition-all relative overflow-hidden group`}
              >
                {isActive && (
                  <motion.div
                    layoutId="difficulty-active"
                    className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon className={`w-5 h-5 mb-2 ${colors.icon}`} />
                  <h4 className={`font-bold text-sm mb-1 ${colors.text}`}>
                    {option.label}
                  </h4>
                  <p className="text-xs text-gray-500 leading-tight">
                    {option.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Guidance Level Slider */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            AI Guidance Level
          </h3>
        </div>

        <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Current Setting:</span>
              <span className="text-sm font-bold text-orange-400">
                {GUIDANCE_LABELS[settings.guidance]}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {settings.guidance === 0 && "AI will not provide hints. You're on your own!"}
              {settings.guidance === 1 && "AI will give subtle nudges if you get stuck."}
              {settings.guidance === 2 && "AI will provide helpful hints and rephrase questions."}
              {settings.guidance === 3 && "AI will actively guide you with examples and frameworks."}
            </p>
          </div>

          {/* Custom Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={settings.guidance}
              onChange={(e) => handleGuidanceChange(parseInt(e.target.value) as GuidanceLevel)}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${(settings.guidance / 3) * 100}%, rgba(255,255,255,0.1) ${(settings.guidance / 3) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="flex justify-between mt-2 px-1">
              {GUIDANCE_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGuidanceChange(idx as GuidanceLevel)}
                  className={`text-xs transition-colors ${settings.guidance === idx
                    ? 'text-orange-400 font-bold'
                    : 'text-gray-600 hover:text-gray-400'
                    }`}
                >
                  {label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Settings Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-400 mb-1">Recommendation</h4>
            <p className="text-xs text-gray-300">
              {settings.difficulty === 'beginner' && "Start with Moderate Help to build confidence, then reduce guidance as you improve."}
              {settings.difficulty === 'intermediate' && "Light Guidance works well for most users preparing for real interviews."}
              {settings.difficulty === 'advanced' && "Try No Hints to simulate the pressure of actual senior-level interviews."}
              {settings.difficulty === 'expert' && "No Hints recommended - executive interviews rarely offer second chances."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifficultyGuidanceControls;

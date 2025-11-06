import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Briefcase, Building, GraduationCap, Edit3, Star, Clock, Plus,
  Trash2, Heart, Wand2, Mic, Type, AlertTriangle, Sparkles, Zap, Target,
  TrendingUp, Award, ArrowRight, Check, Brain
} from 'lucide-react';
import { InterviewSetup } from '../../types/interview';
import {
  getUserInterviewSetups,
  saveInterviewSetup,
  updateSetupUsage,
  toggleSetupFavorite,
  deleteInterviewSetup,
  SavedInterviewSetup
} from '../../utils/supabase-interview';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupFlowProps {
  onComplete: (setup: InterviewSetup) => void;
  onBack: () => void;
}

// Industry data with icons and simple colors
const industries = [
  { id: 'Technology', label: 'Technology', icon: Brain, color: 'blue' },
  { id: 'Healthcare', label: 'Healthcare', icon: Heart, color: 'red' },
  { id: 'Finance', label: 'Finance', icon: TrendingUp, color: 'green' },
  { id: 'Marketing', label: 'Marketing', icon: Sparkles, color: 'purple' },
  { id: 'Sales', label: 'Sales', icon: Target, color: 'orange' },
  { id: 'Education', label: 'Education', icon: GraduationCap, color: 'indigo' },
  { id: 'Consulting', label: 'Consulting', icon: Award, color: 'yellow' },
  { id: 'Retail', label: 'Retail', icon: Building, color: 'pink' },
  { id: 'Manufacturing', label: 'Manufacturing', icon: Zap, color: 'gray' },
  { id: 'Non-profit', label: 'Non-profit', icon: Heart, color: 'teal' },
  { id: 'Government', label: 'Government', icon: Building, color: 'blue' },
  { id: 'Other', label: 'Other', icon: Sparkles, color: 'gray' }
];

const jobTypes = [
  { id: 'Software Engineer', label: 'Software Engineer', icon: Brain },
  { id: 'Product Manager', label: 'Product Manager', icon: Target },
  { id: 'Data Scientist', label: 'Data Scientist', icon: TrendingUp },
  { id: 'UX/UI Designer', label: 'UX/UI Designer', icon: Sparkles },
  { id: 'Marketing Manager', label: 'Marketing Manager', icon: Sparkles },
  { id: 'Sales Representative', label: 'Sales Representative', icon: Target },
  { id: 'Business Analyst', label: 'Business Analyst', icon: TrendingUp },
  { id: 'DevOps Engineer', label: 'DevOps Engineer', icon: Zap },
  { id: 'Customer Success', label: 'Customer Success', icon: Heart },
  { id: 'Project Manager', label: 'Project Manager', icon: Award },
  { id: 'HR Specialist', label: 'HR Specialist', icon: Heart },
  { id: 'Other', label: 'Other', icon: Sparkles }
];

const experienceLevels = [
  { id: 'Entry Level (0-2 years)', label: 'Entry Level', sublabel: '0-2 years', icon: GraduationCap },
  { id: 'Mid Level (3-5 years)', label: 'Mid Level', sublabel: '3-5 years', icon: Briefcase },
  { id: 'Senior Level (6-10 years)', label: 'Senior Level', sublabel: '6-10 years', icon: Award },
  { id: 'Executive Level (10+ years)', label: 'Executive Level', sublabel: '10+ years', icon: Star }
];

const interviewModes = [
  {
    id: 'voice',
    title: 'Voice Interview',
    description: 'Advanced voice interaction with AI interviewer',
    icon: Mic,
    features: ['Real-time voice conversation', 'Instant AI responses', 'Live transcript display', 'Natural speech analysis'],
    recommended: true
  },
  {
    id: 'text',
    title: 'Text Interview',
    description: 'Text-based interview experience',
    icon: Type,
    features: ['Written responses only', 'Focus on content analysis', 'No voice metrics', 'Silent mode'],
    warning: 'You\'ll miss out on voice confidence, speech pace, and communication delivery metrics that employers often evaluate.'
  }
];

// Function to generate setup name based on choices
const generateSetupName = (setup: Partial<InterviewSetup>): string => {
  if (!setup.industry || !setup.jobType || !setup.experienceLevel) {
    return '';
  }

  const experienceMap: Record<string, string> = {
    'Entry Level (0-2 years)': 'Entry',
    'Mid Level (3-5 years)': 'Mid-Level',
    'Senior Level (6-10 years)': 'Senior',
    'Executive Level (10+ years)': 'Executive'
  };

  const experiencePrefix = experienceMap[setup.experienceLevel] || 'Mid-Level';

  const jobTitleMap: Record<string, string> = {
    'Software Engineer': 'SWE',
    'Product Manager': 'PM',
    'Data Scientist': 'Data Scientist',
    'UX/UI Designer': 'UX Designer',
    'Marketing Manager': 'Marketing',
    'Sales Representative': 'Sales',
    'Business Analyst': 'BA',
    'DevOps Engineer': 'DevOps',
    'Customer Success': 'CS',
    'Project Manager': 'PM',
    'HR Specialist': 'HR'
  };

  const jobTitle = jobTitleMap[setup.jobType] || setup.jobType;

  const industryMap: Record<string, string> = {
    'Technology': 'Tech',
    'Healthcare': 'Healthcare',
    'Finance': 'Finance',
    'Marketing': 'Marketing',
    'Sales': 'Sales',
    'Education': 'Education',
    'Consulting': 'Consulting',
    'Retail': 'Retail',
    'Manufacturing': 'Manufacturing',
    'Non-profit': 'Non-profit',
    'Government': 'Government'
  };

  const industry = industryMap[setup.industry] || setup.industry;
  const modePrefix = setup.interviewMode === 'voice' ? 'Voice' : 'Text';

  return `${modePrefix} ${experiencePrefix} ${jobTitle} - ${industry}`;
};

export const SetupFlow: React.FC<SetupFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<Partial<InterviewSetup>>({
    interviewMode: 'voice'
  });
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [savedSetups, setSavedSetups] = useState<SavedInterviewSetup[]>([]);
  const [showSavedSetups, setShowSavedSetups] = useState(true);
  const [isLoadingSetups, setIsLoadingSetups] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [useAutoName, setUseAutoName] = useState(true);

  const hasAPIKey = import.meta.env.VITE_OPENAI_API_KEY &&
                    import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';

  useEffect(() => {
    loadSavedSetups();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (useAutoName && setup.industry && setup.jobType && setup.experienceLevel && setup.interviewMode) {
      const autoName = generateSetupName(setup);
      setSetupName(autoName);
    }
  }, [setup, useAutoName]);

  const loadSavedSetups = async () => {
    setIsLoadingSetups(true);
    try {
      const setups = await getUserInterviewSetups();
      setSavedSetups(setups);
    } catch (error) {
      console.error('Error loading saved setups:', error);
    } finally {
      setIsLoadingSetups(false);
    }
  };

  const handleUseSavedSetup = async (savedSetup: SavedInterviewSetup) => {
    try {
      await updateSetupUsage(savedSetup.id);
      onComplete(savedSetup.setup);
    } catch (error) {
      console.error('Error using saved setup:', error);
      onComplete(savedSetup.setup);
    }
  };

  const handleToggleFavorite = async (setupId: string, currentFavorite: boolean) => {
    try {
      await toggleSetupFavorite(setupId, !currentFavorite);
      await loadSavedSetups();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteSetup = async (setupId: string) => {
    try {
      await deleteInterviewSetup(setupId);
      await loadSavedSetups();
    } catch (error) {
      console.error('Error deleting setup:', error);
    }
  };

  const handleSaveSetup = async () => {
    if (!setupName.trim() || !isSetupComplete()) return;

    try {
      await saveInterviewSetup(setupName.trim(), setup as InterviewSetup, saveAsFavorite);
      setShowSaveDialog(false);
      setSetupName('');
      setSaveAsFavorite(false);
      setUseAutoName(true);
      await loadSavedSetups();
      onComplete(setup as InterviewSetup);
    } catch (error) {
      console.error('Error saving setup:', error);
      onComplete(setup as InterviewSetup);
    }
  };

  const isSetupComplete = () => {
    return setup.industry && setup.jobType && setup.experienceLevel && setup.interviewMode;
  };

  const steps = [
    {
      title: 'Choose Interview Mode',
      subtitle: 'Select how you want to practice',
      icon: Mic,
      key: 'interviewMode' as keyof InterviewSetup
    },
    {
      title: 'Select Your Industry',
      subtitle: 'What field are you targeting?',
      icon: Building,
      key: 'industry' as keyof InterviewSetup
    },
    {
      title: 'Choose Your Role',
      subtitle: 'What position are you applying for?',
      icon: Briefcase,
      key: 'jobType' as keyof InterviewSetup
    },
    {
      title: 'Experience Level',
      subtitle: 'How many years of experience?',
      icon: GraduationCap,
      key: 'experienceLevel' as keyof InterviewSetup
    }
  ];

  const handleSelection = (value: string) => {
    if (value === 'Other') {
      setShowOtherInput(true);
      return;
    }

    setIsAnimating(true);
    const updatedSetup = { ...setup, [steps[currentStep].key]: value };
    setSetup(updatedSetup);

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowSaveDialog(true);
      }
      setIsAnimating(false);
    }, 400);
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      setIsAnimating(true);
      const updatedSetup = { ...setup, [steps[currentStep].key]: otherValue.trim() };
      setSetup(updatedSetup);

      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setShowSaveDialog(true);
        }
        setIsAnimating(false);
        setShowOtherInput(false);
        setOtherValue('');
      }, 400);
    }
  };

  const currentStepData = steps[currentStep];

  // Saved setups screen
  if (showSavedSetups && savedSetups.length > 0) {
    return (
      <div className="min-h-screen bg-dark-900 pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl"></div>

        <div className="container max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
              Choose Your Setup
            </h1>
            <p className="text-gray-400 text-lg">Use a saved configuration or create a new one</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Saved Setups - 2 columns */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-dark-800/40 backdrop-blur-xl rounded-3xl p-6 border border-dark-700/50 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Star className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Your Saved Setups</h2>
              </div>

              {isLoadingSetups ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading setups...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {savedSetups.map((savedSetup, index) => (
                    <motion.div
                      key={savedSetup.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleUseSavedSetup(savedSetup)}
                      className="group/card relative p-5 bg-dark-700/30 backdrop-blur-sm rounded-2xl border border-dark-600/50 hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden"
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white group-hover/card:text-orange-400 transition-colors line-clamp-1">
                                {savedSetup.name}
                              </h3>
                              {savedSetup.is_favorite && (
                                <Heart className="w-3.5 h-3.5 text-red-400 fill-current flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              {savedSetup.setup.interviewMode === 'voice' ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                                  <Mic className="w-3 h-3 text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">Voice</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                  <Type className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs text-blue-400 font-medium">Text</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-1">{savedSetup.setup.jobType}</p>
                            <p className="text-xs text-gray-500">{savedSetup.setup.industry} • {savedSetup.setup.experienceLevel}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(savedSetup.id, savedSetup.is_favorite);
                              }}
                              className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                              <Heart className={`w-3.5 h-3.5 ${savedSetup.is_favorite ? 'text-red-400 fill-current' : 'text-gray-500'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSetup(savedSetup.id);
                              }}
                              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-dark-600/50">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Used {savedSetup.usage_count}x</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover/card:text-orange-400 group-hover/card:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Create New - 1 column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-800/40 backdrop-blur-xl rounded-3xl p-6 border border-dark-700/50 relative overflow-hidden group flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Plus className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Create New</h2>
              </div>

              <div className="flex-1 flex items-center justify-center relative z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSavedSetups(false);
                  }}
                  className="w-full p-8 border-2 border-dashed border-dark-600 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group/btn"
                >
                  <Plus className="w-12 h-12 text-gray-500 group-hover/btn:text-orange-400 mx-auto mb-4 transition-colors" />
                  <h3 className="text-lg font-semibold text-white group-hover/btn:text-orange-400 transition-colors mb-2">
                    Custom Setup
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure mode, industry, role, and experience level
                  </p>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="text-center">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-orange-500 transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container max-w-4xl mx-auto relative z-10">
        {/* Animated Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={index}>
                  <motion.div
                    className="flex flex-col items-center gap-2 relative"
                    animate={{ scale: isActive ? 1 : 0.9 }}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                          : isActive
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                          : 'bg-dark-700'
                      }`}
                      animate={{
                        boxShadow: isActive
                          ? ['0 0 0 0 rgba(249, 115, 22, 0)', '0 0 0 10px rgba(249, 115, 22, 0)']
                          : 'none'
                      }}
                      transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      isActive ? 'text-orange-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      Step {index + 1}
                    </span>
                  </motion.div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 bg-dark-700 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-dark-800/40 backdrop-blur-xl rounded-3xl p-8 border border-dark-700/50 relative overflow-hidden"
          >
            {/* Card glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent"></div>

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl mb-6 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-orange-600/30 rounded-2xl blur-xl"></div>
                {currentStepData && <currentStepData.icon className="w-10 h-10 text-orange-400 relative z-10" />}
              </motion.div>

              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
                {currentStepData?.title}
              </h2>
              <p className="text-gray-400 text-lg">{currentStepData?.subtitle}</p>
            </div>

            {/* Other Input */}
            {showOtherInput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-dark-700/30 rounded-2xl p-6 border border-dark-600/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Edit3 className="w-5 h-5 text-orange-400" />
                    <h3 className="text-white font-medium">Specify your {currentStepData?.title.toLowerCase()}</h3>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={otherValue}
                      onChange={(e) => setOtherValue(e.target.value)}
                      placeholder={`Enter your ${currentStepData?.title.toLowerCase()}...`}
                      className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
                    />
                    <button
                      onClick={handleOtherSubmit}
                      disabled={!otherValue.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      Continue
                    </button>
                  </div>
                  <button
                    onClick={() => setShowOtherInput(false)}
                    className="mt-3 text-gray-400 hover:text-orange-400 transition-colors text-sm"
                  >
                    ← Back to options
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 0: Interview Mode */}
            {!showOtherInput && currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviewModes.map((mode, index) => {
                  const Icon = mode.icon;
                  const isSelected = setup.interviewMode === mode.id;
                  const isDisabled = mode.id === 'voice' && !hasAPIKey;

                  return (
                    <motion.button
                      key={mode.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !isDisabled && handleSelection(mode.id)}
                      disabled={isDisabled}
                      onMouseEnter={() => setHoveredOption(mode.id)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className={`group relative p-6 border-2 rounded-2xl text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
                          : isDisabled
                          ? 'border-dark-600 bg-dark-700/20 opacity-50 cursor-not-allowed'
                          : 'border-dark-600 hover:border-orange-500/50 hover:bg-gradient-to-br hover:from-orange-500/5 hover:to-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                            : isDisabled
                            ? 'bg-dark-600 text-gray-500'
                            : 'bg-dark-600 text-gray-400 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-xl font-semibold transition-colors ${
                              isSelected ? 'text-orange-400' : isDisabled ? 'text-gray-500' : 'text-white'
                            }`}>
                              {mode.title}
                            </h3>
                            {mode.recommended && !isDisabled && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-400'}`}>
                            {mode.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {mode.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-gray-600' : 'bg-orange-400'}`}></div>
                            <span className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-300'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {mode.warning && !isDisabled && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-400">{mode.warning}</p>
                        </div>
                      )}

                      {isDisabled && (
                        <div className="flex items-start gap-2 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-400">
                            Voice mode requires API key configuration.
                          </p>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 1: Industry */}
            {!showOtherInput && currentStep === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {industries.map((industry, index) => {
                  const Icon = industry.icon;
                  const isSelected = setup.industry === industry.id;

                  return (
                    <motion.button
                      key={industry.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelection(industry.id)}
                      onMouseEnter={() => setHoveredOption(industry.id)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className={`group relative p-5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
                          : 'border-dark-600 hover:border-orange-500/50 hover:bg-dark-700/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${industry.color} ${
                        isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className={`font-medium text-sm ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                        {industry.label}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Job Type */}
            {!showOtherInput && currentStep === 2 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {jobTypes.map((job, index) => {
                  const Icon = job.icon;
                  const isSelected = setup.jobType === job.id;

                  return (
                    <motion.button
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelection(job.id)}
                      className={`group relative p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
                          : 'border-dark-600 hover:border-orange-500/50 hover:bg-dark-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : 'bg-dark-600 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-orange-600'
                        }`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <p className={`font-medium text-sm ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                          {job.label}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Experience Level */}
            {!showOtherInput && currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {experienceLevels.map((level, index) => {
                  const Icon = level.icon;
                  const isSelected = setup.experienceLevel === level.id;

                  return (
                    <motion.button
                      key={level.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelection(level.id)}
                      className={`group relative p-6 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
                          : 'border-dark-600 hover:border-orange-500/50 hover:bg-dark-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : 'bg-dark-600 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-orange-600'
                        }`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-1 ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                            {level.label}
                          </h3>
                          <p className="text-sm text-gray-400">{level.sublabel}</p>
                        </div>
                        <ArrowRight className={`w-5 h-5 transition-all ${
                          isSelected
                            ? 'text-orange-400 translate-x-1'
                            : 'text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1'
                        }`} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-dark-700/50">
              {currentStep > 0 && !showOtherInput ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Back</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSavedSetups(true)}
                  className="px-6 py-3 text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Back to Setups</span>
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-800/90 backdrop-blur-xl rounded-3xl p-8 border border-dark-700/50 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl">
                    <Star className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Save Setup?</h3>
                </div>

                <p className="text-gray-400 mb-6">
                  Save this configuration to quickly reuse it for future interviews.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Setup Name</label>
                      <button
                        onClick={() => setUseAutoName(!useAutoName)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          useAutoName
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-dark-700 text-gray-400 border border-dark-600'
                        }`}
                      >
                        <Wand2 className="w-3 h-3" />
                        Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={setupName}
                      onChange={(e) => {
                        setSetupName(e.target.value);
                        setUseAutoName(false);
                      }}
                      placeholder="e.g., Voice Senior SWE - Tech"
                      className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                    {useAutoName && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Auto-generated from your selections
                      </p>
                    )}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={saveAsFavorite}
                      onChange={(e) => setSaveAsFavorite(e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-dark-700 border-dark-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300 flex items-center gap-2 group-hover:text-white transition-colors">
                      <Heart className="w-4 h-4" />
                      Mark as favorite
                    </span>
                  </label>

                  <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/50">
                    <h4 className="text-sm font-semibold text-white mb-3">Summary</h4>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span>Mode: {setup.interviewMode === 'voice' ? 'Voice Interview' : 'Text Interview'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span>Industry: {setup.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span>Role: {setup.jobType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span>Experience: {setup.experienceLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      onComplete(setup as InterviewSetup);
                    }}
                    className="flex-1 px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSaveSetup}
                    disabled={!setupName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Save & Start
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SetupFlow;

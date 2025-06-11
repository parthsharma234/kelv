import React, { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, Building, GraduationCap, Edit3, Star, Clock, Plus, Trash2, Heart } from 'lucide-react';
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

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Marketing', 'Sales', 'Education',
  'Consulting', 'Retail', 'Manufacturing', 'Non-profit', 'Government', 'Other'
];

const jobTypes = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX/UI Designer',
  'Marketing Manager', 'Sales Representative', 'Business Analyst', 'DevOps Engineer',
  'Customer Success', 'Project Manager', 'HR Specialist', 'Other'
];

const experienceLevels = [
  'Entry Level (0-2 years)', 'Mid Level (3-5 years)', 
  'Senior Level (6-10 years)', 'Executive Level (10+ years)'
];

export const SetupFlow: React.FC<SetupFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<Partial<InterviewSetup>>({});
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

  useEffect(() => {
    loadSavedSetups();
  }, []);

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
      // Still proceed with the setup even if usage update fails
      onComplete(savedSetup.setup);
    }
  };

  const handleToggleFavorite = async (setupId: string, currentFavorite: boolean) => {
    try {
      await toggleSetupFavorite(setupId, !currentFavorite);
      await loadSavedSetups(); // Refresh the list
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteSetup = async (setupId: string) => {
    try {
      await deleteInterviewSetup(setupId);
      await loadSavedSetups(); // Refresh the list
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
      await loadSavedSetups(); // Refresh the list
      onComplete(setup as InterviewSetup);
    } catch (error) {
      console.error('Error saving setup:', error);
      // Still proceed with the interview even if save fails
      onComplete(setup as InterviewSetup);
    }
  };

  const isSetupComplete = () => {
    return setup.industry && setup.jobType && setup.experienceLevel;
  };

  const steps = [
    {
      title: 'Select Industry',
      icon: Building,
      options: industries,
      key: 'industry' as keyof InterviewSetup
    },
    {
      title: 'Choose Job Type',
      icon: Briefcase,
      options: jobTypes,
      key: 'jobType' as keyof InterviewSetup
    },
    {
      title: 'Experience Level',
      icon: GraduationCap,
      options: experienceLevels,
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
        // Setup is complete, show save dialog
        setShowSaveDialog(true);
      }
      setIsAnimating(false);
    }, 300);
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
      }, 300);
    }
  };

  const handleBackFromOther = () => {
    setShowOtherInput(false);
    setOtherValue('');
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData?.icon;

  // Show saved setups first
  if (showSavedSetups && savedSetups.length > 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden pt-24">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FF5722]/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FF7043]/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-full max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Choose Interview Setup
            </h2>
            <p className="text-gray-400 text-lg">Use a saved setup or create a new one</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Saved Setups */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50"
            >
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-orange-400" />
                Saved Setups
              </h3>
              
              {isLoadingSetups ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your setups...</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {savedSetups.map((savedSetup) => (
                    <motion.div
                      key={savedSetup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-4 bg-dark-700/30 rounded-xl border border-dark-600/50 hover:border-orange-500/50 transition-all cursor-pointer"
                      onClick={() => handleUseSavedSetup(savedSetup)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                              {savedSetup.name}
                            </h4>
                            {savedSetup.is_favorite && (
                              <Heart className="w-4 h-4 text-red-400 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {savedSetup.setup.jobType} • {savedSetup.setup.industry}
                          </p>
                          <p className="text-xs text-gray-500">
                            {savedSetup.setup.experienceLevel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(savedSetup.id, savedSetup.is_favorite);
                            }}
                            className="p-1 hover:bg-dark-600 rounded transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${savedSetup.is_favorite ? 'text-red-400 fill-current' : 'text-gray-500'}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSetup(savedSetup.id);
                            }}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Used {savedSetup.usage_count} times</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Create New Setup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50"
            >
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-orange-400" />
                Create New Setup
              </h3>
              
              <div className="space-y-4">
                <p className="text-gray-400 mb-6">
                  Create a custom interview setup tailored to your specific needs and save it for future use.
                </p>
                
                <button
                  onClick={() => setShowSavedSetups(false)}
                  className="w-full p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-500 group-hover:text-orange-400 mx-auto mb-3 transition-colors" />
                    <h4 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                      Start Custom Setup
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Configure industry, role, and experience level
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-400 hover:text-[#FF5722] transition-all duration-500 group flex items-center space-x-3 hover:bg-[#FF5722]/5 rounded-xl mx-auto"
            >
              <span className="transform group-hover:-translate-x-2 transition-transform duration-500 text-xl">←</span>
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden pt-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FF5722]/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FF7043]/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#FF5722]/2 to-[#FF7043]/2 rounded-full blur-3xl animate-spin-slow"></div>
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#FF5722]/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-400">Setup Progress</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#FF5722] rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-[#FF5722] bg-[#FF5722]/10 px-4 py-2 rounded-full border border-[#FF5722]/20">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-2 shadow-inner border border-gray-800">
            <div 
              className="bg-gradient-to-r from-[#FF5722] to-[#FF7043] h-2 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className={`bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-800/50 relative overflow-hidden transition-all duration-500 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5722]/5 via-transparent to-[#FF7043]/5 rounded-3xl"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl mb-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5722]/30 to-[#FF7043]/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5722]/10 to-[#FF7043]/10 rounded-3xl animate-pulse"></div>
              {StepIcon && <StepIcon className="w-12 h-12 text-[#FF5722] relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />}
            </div>
            <h2 className="text-5xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {currentStepData?.title}
            </h2>
            <p className="text-gray-400 text-lg">Choose the option that best describes your target role</p>
          </div>

          {/* Other input form */}
          {showOtherInput && (
            <div className="relative z-10 mb-8">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Edit3 className="w-5 h-5 text-[#FF5722]" />
                  <h3 className="text-white font-medium">Please specify your {currentStepData?.title.toLowerCase()}</h3>
                </div>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={otherValue}
                    onChange={(e) => setOtherValue(e.target.value)}
                    placeholder={`Enter your ${currentStepData?.title.toLowerCase()}...`}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-[#FF5722] focus:outline-none transition-colors"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
                  />
                  <button
                    onClick={handleOtherSubmit}
                    disabled={!otherValue.trim()}
                    className="px-6 py-3 bg-[#FF5722] text-white rounded-xl hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Continue
                  </button>
                </div>
                <button
                  onClick={handleBackFromOther}
                  className="mt-4 text-gray-400 hover:text-[#FF5722] transition-colors text-sm"
                >
                  ← Back to options
                </button>
              </div>
            </div>
          )}

          {/* Grid layout for options */}
          {!showOtherInput && currentStepData && (
            <div className="relative z-10">
              {currentStepData.options.length <= 4 ? (
                // 2x2 grid for 4 or fewer items
                <div className="grid grid-cols-2 gap-4">
                  {currentStepData.options.map((option, index) => (
                    <button
                      key={option}
                      onClick={() => handleSelection(option)}
                      onMouseEnter={() => setHoveredOption(option)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className="group flex items-center justify-between p-6 border border-gray-800/50 rounded-2xl hover:border-[#FF5722]/50 hover:bg-gradient-to-r hover:from-[#FF5722]/5 hover:to-[#FF7043]/5 transition-all duration-500 text-left relative overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#FF5722]/10"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-[#FF5722]/10 to-[#FF7043]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${hoveredOption === option ? 'opacity-100' : ''}`}></div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF5722]/20 to-[#FF7043]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                      
                      <span className="font-medium text-gray-100 group-hover:text-[#FF7043] transition-all duration-500 relative z-10 text-lg">
                        {option}
                      </span>
                      <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-[#FF5722] transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110 relative z-10" />
                      
                      <div className="absolute inset-0 rounded-2xl bg-[#FF5722]/20 scale-0 group-active:scale-100 transition-transform duration-300 opacity-50"></div>
                    </button>
                  ))}
                </div>
              ) : (
                // 3x4 grid for more items
                <div className="grid grid-cols-3 gap-4">
                  {currentStepData.options.map((option, index) => (
                    <button
                      key={option}
                      onClick={() => handleSelection(option)}
                      onMouseEnter={() => setHoveredOption(option)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className="group flex items-center justify-between p-4 border border-gray-800/50 rounded-2xl hover:border-[#FF5722]/50 hover:bg-gradient-to-r hover:from-[#FF5722]/5 hover:to-[#FF7043]/5 transition-all duration-500 text-left relative overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#FF5722]/10"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-[#FF5722]/10 to-[#FF7043]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${hoveredOption === option ? 'opacity-100' : ''}`}></div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF5722]/20 to-[#FF7043]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                      
                      <span className="font-medium text-gray-100 group-hover:text-[#FF7043] transition-all duration-500 relative z-10 text-base">
                        {option}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FF5722] transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110 relative z-10" />
                      
                      <div className="absolute inset-0 rounded-2xl bg-[#FF5722]/20 scale-0 group-active:scale-100 transition-transform duration-300 opacity-50"></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Back button */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && !showOtherInput ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 text-gray-400 hover:text-[#FF5722] transition-all duration-500 relative z-10 group flex items-center space-x-3 hover:bg-[#FF5722]/5 rounded-xl"
              >
                <span className="transform group-hover:-translate-x-2 transition-transform duration-500 text-xl">←</span>
                <span className="font-medium">Back</span>
              </button>
            ) : (
              <button
                onClick={() => setShowSavedSetups(true)}
                className="px-6 py-3 text-gray-400 hover:text-[#FF5722] transition-all duration-500 relative z-10 group flex items-center space-x-3 hover:bg-[#FF5722]/5 rounded-xl"
              >
                <span className="transform group-hover:-translate-x-2 transition-transform duration-500 text-xl">←</span>
                <span className="font-medium">Back to Setups</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Setup Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-800 rounded-2xl p-8 border border-dark-700 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Save Interview Setup</h3>
              <p className="text-gray-400 mb-6">
                Save this setup to quickly reuse it for future interviews.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Setup Name
                  </label>
                  <input
                    type="text"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="e.g., Senior Software Engineer - Tech"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="favorite"
                    checked={saveAsFavorite}
                    onChange={(e) => setSaveAsFavorite(e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-dark-700 border-dark-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="favorite" className="text-sm text-gray-300 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Mark as favorite
                  </label>
                </div>
                
                <div className="bg-dark-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-2">Setup Summary:</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• Industry: {setup.industry}</p>
                    <p>• Role: {setup.jobType}</p>
                    <p>• Experience: {setup.experienceLevel}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    onComplete(setup as InterviewSetup);
                  }}
                  className="flex-1 px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                >
                  Skip & Continue
                </button>
                <button
                  onClick={handleSaveSetup}
                  disabled={!setupName.trim()}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SetupFlow;
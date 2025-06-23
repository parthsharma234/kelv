import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap,
  ArrowLeft,
  ChevronRight,
  Book,
  Building,
  Target,
  Award,
  Briefcase,  Mic,
  Type,
  Save,
  Heart
} from 'lucide-react';
import { saveCollegeInterviewSetup, getUserCollegeInterviewSetups, updateCollegeSetupUsage, deleteCollegeInterviewSetup, SavedCollegeInterviewSetup } from '../../utils/supabase-interview';

interface CollegeInterviewSetup {
  schoolType: string;
  program: string;
  major: string;
  interviewMode: 'voice' | 'text';
}

interface CollegeSetupFlowProps {
  onComplete: (setup: CollegeInterviewSetup) => void;
  onBack: () => void;
}

export const CollegeSetupFlow: React.FC<CollegeSetupFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<CollegeInterviewSetup>({
    schoolType: '',
    program: '',
    major: '',
    interviewMode: 'text'
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Save setup state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [useAutoName, setUseAutoName] = useState(true);  const [savedSetups, setSavedSetups] = useState<SavedCollegeInterviewSetup[]>([]);
  const [showSavedSetups, setShowSavedSetups] = useState(true);
  const [isLoadingSetups, setIsLoadingSetups] = useState(true);
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Load saved setups
    loadSavedSetups();
  }, []);
  const loadSavedSetups = async () => {
    setIsLoadingSetups(true);
    try {
      const setups = await getUserCollegeInterviewSetups();
      setSavedSetups(setups);
    } catch (error) {
      console.error('Error loading saved college setups:', error);
    } finally {
      setIsLoadingSetups(false);
    }  };

  const handleSaveSetup = async () => {
    if (!setupName.trim() || !isSetupComplete()) return;

    try {
      await saveCollegeInterviewSetup(setupName.trim(), setup, saveAsFavorite);
      setShowSaveDialog(false);
      setSetupName('');
      setSaveAsFavorite(false);
      setUseAutoName(true);
      await loadSavedSetups();
      onComplete(setup);
    } catch (error) {
      console.error('Error saving college setup:', error);
      // Still proceed with the interview even if save fails
      onComplete(setup);
    }
  };

  const isSetupComplete = () => {
    return setup.schoolType && setup.program && setup.major && setup.interviewMode;
  };

  const generateAutoName = () => {
    if (!isSetupComplete()) return '';
    
    const schoolTypeMap: { [key: string]: string } = {
      'public': 'Public Univ',
      'private': 'Private Univ',
      'liberal-arts': 'Liberal Arts',
      'community': 'Community College',
      'ivy-league': 'Elite'
    };
    
    const programMap: { [key: string]: string } = {
      'stem': 'STEM',
      'business': 'Business',
      'liberal-arts': 'Liberal Arts',
      'pre-med': 'Pre-Med',
      'pre-law': 'Pre-Law',
      'arts': 'Arts',
      'undecided': 'Undecided'
    };
    
    return `${schoolTypeMap[setup.schoolType] || setup.schoolType} - ${programMap[setup.program] || setup.program}`;
  };

  const handleLoadSetup = async (savedSetup: SavedCollegeInterviewSetup) => {
    try {
      await updateCollegeSetupUsage(savedSetup.id);
      setSetup(savedSetup.setup);
      setShowSavedSetups(false);
      onComplete(savedSetup.setup);
    } catch (error) {
      console.error('Error loading saved setup:', error);
    }
  };

  const handleDeleteSetup = async (setupId: string) => {
    try {
      await deleteCollegeInterviewSetup(setupId);
      await loadSavedSetups();
    } catch (error) {
      console.error('Error deleting setup:', error);
    }
  };

  const schoolTypes = [
    { id: 'public', label: 'Public University', icon: Building },
    { id: 'private', label: 'Private University', icon: Building },
    { id: 'liberal-arts', label: 'Liberal Arts College', icon: Book },
    { id: 'community', label: 'Community College', icon: Building },
    { id: 'ivy-league', label: 'Ivy League/Elite', icon: Award }
  ];

  const programs = [
    { id: 'stem', label: 'STEM Fields', icon: Target },
    { id: 'business', label: 'Business/Economics', icon: Briefcase },
    { id: 'liberal-arts', label: 'Liberal Arts', icon: Book },
    { id: 'pre-med', label: 'Pre-Medical', icon: Target },
    { id: 'pre-law', label: 'Pre-Law', icon: Award },
    { id: 'arts', label: 'Arts/Creative', icon: Book },
    { id: 'undecided', label: 'Undecided', icon: GraduationCap }
  ];
  const majors = {
    stem: [
      { id: 'computer-science', label: 'Computer Science', icon: Target },
      { id: 'engineering', label: 'Engineering', icon: Target },
      { id: 'mathematics', label: 'Mathematics', icon: Target },
      { id: 'physics', label: 'Physics', icon: Target },
      { id: 'chemistry', label: 'Chemistry', icon: Target },
      { id: 'biology', label: 'Biology', icon: Target },
      { id: 'data-science', label: 'Data Science', icon: Target }
    ],
    business: [
      { id: 'business-admin', label: 'Business Administration', icon: Briefcase },
      { id: 'economics', label: 'Economics', icon: Briefcase },
      { id: 'finance', label: 'Finance', icon: Briefcase },
      { id: 'marketing', label: 'Marketing', icon: Briefcase },
      { id: 'accounting', label: 'Accounting', icon: Briefcase },
      { id: 'entrepreneurship', label: 'Entrepreneurship', icon: Briefcase }
    ],
    'liberal-arts': [
      { id: 'english', label: 'English Literature', icon: Book },
      { id: 'history', label: 'History', icon: Book },
      { id: 'philosophy', label: 'Philosophy', icon: Book },
      { id: 'psychology', label: 'Psychology', icon: Book },
      { id: 'sociology', label: 'Sociology', icon: Book },
      { id: 'political-science', label: 'Political Science', icon: Book }
    ],
    'pre-med': [
      { id: 'biology-premed', label: 'Biology (Pre-Med)', icon: Target },
      { id: 'chemistry-premed', label: 'Chemistry (Pre-Med)', icon: Target },
      { id: 'neuroscience', label: 'Neuroscience', icon: Target },
      { id: 'biochemistry', label: 'Biochemistry', icon: Target },
      { id: 'public-health', label: 'Public Health', icon: Target }
    ],
    'pre-law': [
      { id: 'political-science-prelaw', label: 'Political Science (Pre-Law)', icon: Award },
      { id: 'criminal-justice', label: 'Criminal Justice', icon: Award },
      { id: 'international-relations', label: 'International Relations', icon: Award },
      { id: 'philosophy-prelaw', label: 'Philosophy (Pre-Law)', icon: Award }
    ],
    arts: [
      { id: 'fine-arts', label: 'Fine Arts', icon: Book },
      { id: 'graphic-design', label: 'Graphic Design', icon: Book },
      { id: 'music', label: 'Music', icon: Book },
      { id: 'theater', label: 'Theater', icon: Book },
      { id: 'film', label: 'Film Studies', icon: Book },
      { id: 'creative-writing', label: 'Creative Writing', icon: Book }
    ],
    undecided: [
      { id: 'exploratory', label: 'Exploratory Program', icon: GraduationCap },
      { id: 'general-studies', label: 'General Studies', icon: GraduationCap },
      { id: 'interdisciplinary', label: 'Interdisciplinary Studies', icon: GraduationCap }
    ]
  };
  const interviewModes = [
    { 
      id: 'text', 
      label: 'Text Interview', 
      icon: Type,
      description: 'Type your responses for detailed, thoughtful answers'
    },
    { 
      id: 'voice', 
      label: 'Voice Interview', 
      icon: Mic,
      description: 'Speak your responses for realistic interview practice'
    }
  ];

  const steps = [
    {
      title: 'School Type',
      icon: Building,
      options: schoolTypes,
      key: 'schoolType' as keyof CollegeInterviewSetup
    },
    {
      title: 'Program/Field',
      icon: Book,
      options: programs,
      key: 'program' as keyof CollegeInterviewSetup
    },
    {
      title: 'Specific Major',
      icon: Target,
      options: setup.program ? majors[setup.program as keyof typeof majors] || [] : [],
      key: 'major' as keyof CollegeInterviewSetup
    },
    {
      title: 'Interview Mode',
      icon: Mic,
      options: interviewModes,
      key: 'interviewMode' as keyof CollegeInterviewSetup
    }
  ];  const handleSelection = (value: string) => {
    setIsAnimating(true);
    const updatedSetup = { ...setup, [steps[currentStep].key]: value };
    setSetup(updatedSetup);

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Setup is complete - show save dialog
        const autoName = generateAutoName();
        setSetupName(autoName);
        setShowSaveDialog(true);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };
  const currentStepData = steps[currentStep];

  // Show saved setups first
  if (showSavedSetups && savedSetups.length > 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden pt-24">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-full max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Choose College Interview Setup
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
                <GraduationCap className="w-6 h-6 text-purple-400" />
                Saved College Setups
              </h3>
              
              {isLoadingSetups ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading saved setups...</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {savedSetups.map((savedSetup) => (
                    <div key={savedSetup.id} className="group bg-dark-800/50 rounded-xl p-4 border border-dark-700/50 hover:border-purple-500/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                          {savedSetup.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          {savedSetup.is_favorite && (
                            <Heart className="w-4 h-4 text-red-400 fill-current" />
                          )}
                          <span className="text-xs text-gray-500">
                            Used {savedSetup.usage_count} times
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-3">
                        {savedSetup.setup.schoolType.replace('-', ' ')} • {savedSetup.setup.program} • {savedSetup.setup.major}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadSetup(savedSetup)}
                          className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-medium transition-colors"
                        >
                          Use This Setup
                        </button>
                        <button
                          onClick={() => handleDeleteSetup(savedSetup.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
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
                <Target className="w-6 h-6 text-purple-400" />
                Create New Setup
              </h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-dark-800/30 rounded-xl border border-dark-700/30">
                  <h4 className="font-medium text-white mb-3">Customize Your Experience</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Choose your target institution type
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Select your program and major
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      Pick your interview format
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => setShowSavedSetups(false)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    <Building className="w-5 h-5" />
                  </div>
                  Start Custom Setup
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            {savedSetups.length > 0 && (
              <button
                onClick={() => setShowSavedSetups(true)}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                View Saved Setups
              </button>
            )}
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">College Interview Setup</h1>
              <p className="text-gray-400 text-lg">Let's customize your college interview experience</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  index < currentStep 
                    ? 'bg-purple-500 text-white' 
                    : index === currentStep 
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                    : 'bg-dark-700 text-gray-500'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-all ${
                    index < currentStep ? 'bg-purple-500' : 'bg-dark-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Current Step */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: isAnimating ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isAnimating ? 50 : -50 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-800/50 rounded-2xl p-8 border border-dark-700"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <currentStepData.icon className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>            <p className="text-gray-400">
              {currentStep === 0 && "What type of institution are you applying to?"}
              {currentStep === 1 && "What's your intended program or field of study?"}
              {currentStep === 2 && "Choose your specific major or area of focus"}
              {currentStep === 3 && "How would you like to practice your interview?"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {currentStepData.options.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => handleSelection(option.id)}
                className="p-6 bg-dark-700/50 hover:bg-purple-500/10 border border-dark-600 hover:border-purple-500/50 rounded-xl transition-all text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <option.icon className="w-6 h-6 text-purple-400" />
                  </div>                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{option.label}</h3>
                    {(option as any).description && (
                      <p className="text-sm text-gray-400">{(option as any).description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Testing Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center"
        >          <div className="flex items-center justify-center gap-3 mb-3">
            <GraduationCap className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Testing - FBLA</h3>
          </div>          <p className="text-gray-300 text-sm">
            College admission interviews are currently in development for FBLA testing. This comprehensive setup captures:
            <br />• Your target institution type and academic program
            <br />• Specific major focus for personalized questions
            <br />• Interview format preferences for optimal practice
            <br />• Integration with prestigious university admission standards
            <br /><br />
            Coming soon: AI-powered admission interview practice with university-specific scenarios!
          </p>        </motion.div>
      </div>

      {/* Save Setup Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-2xl p-6 w-full max-w-md border border-dark-700"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Save className="w-6 h-6 text-purple-400" />
              Save College Setup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Setup Name
                </label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => {
                    setSetupName(e.target.value);
                    setUseAutoName(false);
                  }}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter setup name..."
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={saveAsFavorite}
                  onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  className="w-4 h-4 text-purple-500 bg-dark-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="favorite" className="text-sm text-gray-300 flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${saveAsFavorite ? 'text-red-400' : 'text-gray-400'}`} />
                  Mark as favorite
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  onComplete(setup);
                }}
                className="flex-1 px-4 py-3 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Skip & Continue
              </button>
              <button
                onClick={handleSaveSetup}
                disabled={!setupName.trim()}
                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save & Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CollegeSetupFlow;

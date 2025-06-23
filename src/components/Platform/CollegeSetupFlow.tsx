import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap,
  ArrowLeft,
  ChevronRight,
  Book,
  Building,
  Target,
  Award,
  Briefcase,
  Mic,
  Type
} from 'lucide-react';

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
  ];
  const handleSelection = (value: string) => {
    setIsAnimating(true);
    const updatedSetup = { ...setup, [steps[currentStep].key]: value };
    setSetup(updatedSetup);

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Setup is complete - pass the comprehensive setup to parent
        console.log('College Interview Setup Complete:', updatedSetup);
        onComplete(updatedSetup);
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

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">College Interview Setup</h1>
              <p className="text-gray-400 text-lg">Let's customize your college interview experience</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {steps.map((step, index) => (
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
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CollegeSetupFlow;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, Trash2, Check, Shield, Sparkles } from 'lucide-react';
import { InterviewSetup } from '../../types/interview';
import {
  getUserInterviewSetups,
  saveInterviewSetup,
  updateSetupUsage,
  toggleSetupFavorite,
  deleteInterviewSetup,
  SavedInterviewSetup
} from '../../utils/supabase-interview';

interface SetupFlowProps {
  onComplete: (setup: InterviewSetup) => void;
  onBack: () => void;
}

type StepId = 'industry' | 'jobType' | 'experienceLevel' | 'interviewMode';

const industries = [
  { id: 'Technology', label: 'Technology' },
  { id: 'Finance', label: 'Finance' },
  { id: 'Healthcare', label: 'Healthcare' },
  { id: 'Marketing', label: 'Marketing' },
  { id: 'Sales', label: 'Sales' },
  { id: 'Education', label: 'Education' },
  { id: 'Consulting', label: 'Consulting' },
  { id: 'Retail', label: 'Retail' },
  { id: 'Manufacturing', label: 'Manufacturing' },
  { id: 'Government', label: 'Government' },
  { id: 'Non-profit', label: 'Non-profit' },
  { id: 'Other', label: 'Other' }
];

const jobTypes = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX/UI Designer',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'DevOps Engineer',
  'Customer Success',
  'Project Manager',
  'HR Specialist',
  'Other'
];

const experienceLevels = [
  { id: 'Entry Level (0-2 years)', label: 'Entry', helper: '0-2 years' },
  { id: 'Mid Level (3-5 years)', label: 'Mid', helper: '3-5 years' },
  { id: 'Senior Level (6-10 years)', label: 'Senior', helper: '6-10 years' },
  { id: 'Executive Level (10+ years)', label: 'Executive', helper: '10+ years' }
];

const interviewModes = [
  {
    id: 'voice',
    title: 'Voice interview',
    description: 'Live audio prompts, filler tracking, confidence scoring.',
    badge: 'Best results'
  },
  {
    id: 'text',
    title: 'Text interview',
    description: 'Quiet mode for content-only rehearsals.',
    badge: 'Silent option'
  }
];

const wizardSteps: { id: StepId; label: string; description: string }[] = [
  { id: 'jobType', label: 'Role', description: 'What title are you targeting?' },
  { id: 'industry', label: 'Industry', description: 'Where are you interviewing?' },
  { id: 'experienceLevel', label: 'Experience', description: 'How seasoned are you?' },
  { id: 'interviewMode', label: 'Format', description: 'Choose how Kelv drills you' }
];

const stepTips: Record<StepId, string> = {
  industry:
    'Pick the field you actually want feedback in - Kelv swaps follow-ups using real recruiter scripts from that industry.',
  jobType:
    'We tailor prompts and rubrics to the title you choose. Go specific if you already have a target offer.',
  experienceLevel:
    'Experience level nudges question depth and how hard we push on leadership versus execution.',
  interviewMode:
    'Voice captures confidence and filler words, text helps you sandbox messaging. Choose what you need today.'
};

const buildSetupNarrative = (setup: Partial<InterviewSetup>) => {
  const role = setup.jobType || 'your next role';
  const industry = setup.industry || 'the companies you care about';
  const experience =
    setup.experienceLevel ? setup.experienceLevel.split('(')[0].trim().toLowerCase() : 'growing';
  const mode = setup.interviewMode === 'text' ? 'text drills' : 'voice reps';
  const emphasis =
    setup.interviewMode === 'text' ? 'precision and structure' : 'confidence, pacing, and receipts';

  return `Kelv is lining up ${mode} for a ${experience} ${role} interview in ${industry}. Expect follow-ups that stress ${emphasis}.`;
};

const SummaryRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-white font-medium">{value || '-'}</span>
  </div>
);

export const SetupFlow: React.FC<SetupFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<Partial<InterviewSetup>>({ interviewMode: 'voice' });
  const [savedSetups, setSavedSetups] = useState<SavedInterviewSetup[]>([]);
  const [isLoadingSetups, setIsLoadingSetups] = useState(true);
  const [setupName, setSetupName] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [useAutoName, setUseAutoName] = useState(true);
  const [showOtherField, setShowOtherField] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const hasAPIKey = Boolean(
    import.meta.env.VITE_OPENAI_API_KEY &&
    import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here'
  );
  const dynamicNarrative = buildSetupNarrative(setup);

  useEffect(() => {
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

    loadSavedSetups();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (
      useAutoName &&
      setup.industry &&
      setup.jobType &&
      setup.experienceLevel &&
      setup.interviewMode
    ) {
      const mode = setup.interviewMode === 'voice' ? 'Voice' : 'Text';
      const role = setup.jobType.split(' ')[0];
      const industry = setup.industry;
      setSetupName(`${mode} · ${role} · ${industry}`);
    }
  }, [setup, useAutoName]);

  const isStepComplete = (stepId: StepId) => Boolean(setup[stepId]);
  const isSetupComplete = () => wizardSteps.every((step) => isStepComplete(step.id));

  const handleSelect = (field: StepId, value: string) => {
    if (value === 'Other') {
      setShowOtherField(true);
      return;
    }
    setSetup((prev) => ({ ...prev, [field]: value }));
    setShowOtherField(false);
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleOtherSubmit = () => {
    if (!otherValue.trim()) return;
    const field = wizardSteps[currentStep].id;
    setSetup((prev) => ({ ...prev, [field]: otherValue.trim() }));
    setOtherValue('');
    setShowOtherField(false);
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSaveSetup = async () => {
    if (!isSetupComplete() || !setupName.trim()) return;
    try {
      await saveInterviewSetup(setupName.trim(), setup as InterviewSetup, saveAsFavorite);
      const setups = await getUserInterviewSetups();
      setSavedSetups(setups);
      onComplete(setup as InterviewSetup);
    } catch (error) {
      console.error('Error saving setup:', error);
      onComplete(setup as InterviewSetup);
    } finally {
      setSaveAsFavorite(false);
      setUseAutoName(true);
    }
  };

  const handleStartInterview = () => {
    if (isSetupComplete()) {
      onComplete(setup as InterviewSetup);
    }
  };

  const handleUseSavedSetup = async (savedSetup: SavedInterviewSetup) => {
    try {
      await updateSetupUsage(savedSetup.id);
    } catch (error) {
      console.error('Error updating usage:', error);
    } finally {
      onComplete(savedSetup.setup);
    }
  };

  const handleToggleFavorite = async (setupId: string, isFavorite: boolean) => {
    try {
      await toggleSetupFavorite(setupId, !isFavorite);
      const setups = await getUserInterviewSetups();
      setSavedSetups(setups);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteSetup = async (setupId: string) => {
    try {
      await deleteInterviewSetup(setupId);
      const setups = await getUserInterviewSetups();
      setSavedSetups(setups);
    } catch (error) {
      console.error('Error deleting setup:', error);
    }
  };

  const renderOptions = () => {
    const stepId = wizardSteps[currentStep].id;

    if (stepId === 'jobType') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {jobTypes.map((role) => {
            const isActive = setup.jobType === role;
            return (
              <button
                key={role}
                onClick={() => handleSelect('jobType', role)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-white/10 text-gray-300 hover:border-orange-500/50'
                }`}
              >
                <p className="font-semibold">{role}</p>
              </button>
            );
          })}
        </div>
      );
    }

    if (stepId === 'industry') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {industries.map((industry) => {
            const isActive = setup.industry === industry.id;
            return (
              <button
                key={industry.id}
                onClick={() => handleSelect('industry', industry.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-white/10 text-gray-300 hover:border-orange-500/50'
                }`}
              >
                <p className="text-base font-semibold">{industry.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {industry.label === 'Other' ? 'Add your own' : 'Common in mocks'}
                </p>
              </button>
            );
          })}
        </div>
      );
    }

    if (stepId === 'experienceLevel') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {experienceLevels.map((level) => {
            const isActive = setup.experienceLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => handleSelect('experienceLevel', level.id)}
                className={`rounded-2xl border px-4 py-5 text-left transition-all ${
                  isActive
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-white/10 text-gray-300 hover:border-orange-500/50'
                }`}
              >
                <p className="text-lg font-semibold">{level.label}</p>
                <p className="text-xs text-gray-500">{level.helper}</p>
              </button>
            );
          })}
        </div>
      );
    }

    const voiceDisabled = !hasAPIKey;
    return (
      <div className="space-y-4">
        {interviewModes.map((mode) => {
          const isActive = setup.interviewMode === mode.id;
          const isDisabled = mode.id === 'voice' && voiceDisabled;
          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && handleSelect('interviewMode', mode.id)}
              className={`w-full rounded-2xl border p-5 text-left transition-all ${
                isDisabled
                  ? 'border-white/5 text-gray-500 cursor-not-allowed'
                  : isActive
                  ? 'border-orange-500 bg-orange-500/10 text-white'
                  : 'border-white/10 text-gray-300 hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    {mode.title}
                    {mode.badge && (
                      <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">
                        {mode.badge}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
                </div>
                {isActive && <Check className="w-5 h-5 text-orange-400" />}
              </div>
              {mode.id === 'voice' && voiceDisabled && (
                <p className="text-xs text-red-400 mt-3">Add your OpenAI API key to unlock voice mode.</p>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const progressPercent =
    wizardSteps.length > 1 ? (currentStep / (wizardSteps.length - 1)) * 100 : 100;

  const isLastStep = currentStep === wizardSteps.length - 1;

  return (
    <div className="min-h-screen bg-[#010103] text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Setup</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Build your next interview run</h1>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#080808] via-[#050505] to-[#020203] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-10 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
        >
          <div className="flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-orange-200/70">Kelv ritual</p>
            <h2 className="text-2xl font-semibold leading-tight">
              Set the intention before Kelv starts rolling.
            </h2>
            <p className="text-gray-400">
              Every choice below tunes the interviewer's tone, pacing, and rubric. Pick the lane you are aiming for today.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 flex-shrink-0 min-w-[240px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="uppercase text-[10px] tracking-[0.4em] text-white/60">Industry</p>
              <p className="text-white text-lg font-semibold mt-2">{setup.industry || 'Not chosen'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="uppercase text-[10px] tracking-[0.4em] text-white/60">Role</p>
              <p className="text-white text-lg font-semibold mt-2">{setup.jobType || 'None yet'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="uppercase text-[10px] tracking-[0.4em] text-white/60">Experience</p>
              <p className="text-white text-lg font-semibold mt-2">
                {setup.experienceLevel ? setup.experienceLevel.split('(')[0].trim() : 'TBD'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="uppercase text-[10px] tracking-[0.4em] text-white/60">Format</p>
              <p className="text-white text-lg font-semibold mt-2">
                {setup.interviewMode === 'text' ? 'Text' : 'Voice'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)] items-start mt-10">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[32px] border border-white/5 bg-[#050506] p-6"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                <span>Flow</span>
                <span>
                  {currentStep + 1}/{wizardSteps.length}
                </span>
              </div>
              <div className="mt-3 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-200 to-yellow-200"
                  animate={{ width: `${progressPercent}%` }}
                  initial={false}
                  transition={{ duration: 0.4 }}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-6 space-y-4">
                {wizardSteps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;
                  const isUnlocked =
                    index <= currentStep ||
                    wizardSteps.slice(0, index).every((s) => isStepComplete(s.id));
                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      whileHover={{ scale: isUnlocked ? 1.01 : 1 }}
                      whileTap={{ scale: isUnlocked ? 0.99 : 1 }}
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && setCurrentStep(index)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-orange-400/70 bg-orange-400/10 text-white shadow-[0_0_30px_rgba(251,146,60,0.2)]'
                          : isDone
                          ? 'border-white/20 bg-white/5 text-white'
                          : 'border-white/10 text-white/60'
                      } ${!isUnlocked ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-base ${
                              isDone || isActive
                                ? 'border-orange-400 bg-orange-400/15 text-orange-200'
                                : 'border-white/20 text-white/70'
                            }`}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : index + 1}
                          </span>
                          {step.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-white/50" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{step.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#140a04] to-[#050505] p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Kelv briefing</p>
                  <p className="text-sm text-gray-400">Auto-updates as you tweak each step.</p>
                </div>
              </div>
              <p className="text-lg leading-relaxed text-white">{dynamicNarrative}</p>
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-[32px] border border-white/5 bg-[#050506] p-6 space-y-4 text-center"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Templates</p>
                <h3 className="text-xl font-semibold">Saved runs</h3>
                <p className="text-sm text-gray-500">
                  Side stash of rituals. Click a card to load it instantly.
                </p>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {isLoadingSetups && (
                  <p className="text-sm text-gray-500 text-center">Loading templates...</p>
                )}
                {!isLoadingSetups && savedSetups.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Save any configuration once and it will live here for one-tap relaunches.
                  </p>
                )}
                {!isLoadingSetups &&
                  savedSetups.map((saved) => (
                    <div
                      key={saved.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleUseSavedSetup(saved)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleUseSavedSetup(saved);
                        }
                      }}
                      className="border border-white/10 bg-white/5 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-orange-500/40 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    >
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-2">
                          {saved.name}
                          {saved.is_favorite && <Heart className="w-3.5 h-3.5 text-red-400" />}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {saved.setup.jobType} · {saved.setup.industry}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFavorite(saved.id, saved.is_favorite);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 ${
                              saved.is_favorite
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <Heart className="w-3 h-3" />{' '}
                            {saved.is_favorite ? 'Favorited' : 'Favorite'}
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteSetup(saved.id);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs text-red-300 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <p>Last used</p>
                        <p className="font-semibold text-white mt-1">
                          {new Date(saved.updated_at || saved.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={wizardSteps[currentStep].id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.35 }}
                className="rounded-[32px] border border-white/5 bg-[#050506] p-6 lg:p-8 space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Step {currentStep + 1}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-3">
                      <h2 className="text-3xl font-semibold">
                        {wizardSteps[currentStep].label}
                      </h2>
                      <span className="text-sm text-gray-400">
                        {wizardSteps[currentStep].description}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs tracking-[0.25em] border border-white/15 text-white/70">
                    {currentStep + 1}/{wizardSteps.length}
                  </span>
                </div>

                <div className="space-y-6">
                  {renderOptions()}

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-orange-300 mt-0.5" />
                    <p>{stepTips[wizardSteps[currentStep].id]}</p>
                  </div>

                  <AnimatePresence>
                    {showOtherField && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-wrap gap-2"
                      >
                        <input
                          value={otherValue}
                          onChange={(e) => setOtherValue(e.target.value)}
                          placeholder="Type your custom option"
                          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={handleOtherSubmit}
                          className="px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
                        >
                          Add
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white disabled:opacity-40"
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={() => {
                      if (isLastStep) {
                        handleStartInterview();
                      } else {
                        setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1));
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/80 hover:bg-orange-500 text-sm font-semibold disabled:bg-white/10 disabled:text-gray-500"
                    disabled={!isStepComplete(wizardSteps[currentStep].id)}
                  >
                    {isLastStep ? 'Launch interview' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[32px] border border-white/5 bg-[#050506] p-6 lg:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Summary</p>
                  <h3 className="text-xl font-semibold mt-2">Blueprint</h3>
                </div>
                <button
                  onClick={() => setUseAutoName(true)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Reset auto naming
                </button>
              </div>

              <div className="space-y-3">
                <SummaryRow label="Industry" value={setup.industry} />
                <SummaryRow label="Role" value={setup.jobType} />
                <SummaryRow label="Experience" value={setup.experienceLevel} />
                <SummaryRow
                  label="Mode"
                  value={
                    setup.interviewMode === 'voice'
                      ? 'Voice interview'
                      : setup.interviewMode === 'text'
                      ? 'Text interview'
                      : undefined
                  }
                />
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="text-xs text-gray-500 uppercase tracking-[0.3em]">Setup name</label>
                <input
                  value={setupName}
                  onChange={(e) => {
                    setSetupName(e.target.value);
                    setUseAutoName(false);
                  }}
                  placeholder="Voice · SWE · Tech"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={saveAsFavorite}
                    onChange={(e) => setSaveAsFavorite(e.target.checked)}
                    className="accent-orange-500"
                  />
                  Mark as favorite
                </label>
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <button
                    onClick={handleSaveSetup}
                    disabled={!isSetupComplete() || !setupName.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-orange-500 text-white font-semibold disabled:bg-white/10 disabled:text-gray-500"
                  >
                    Save & launch <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStartInterview}
                    disabled={!isSetupComplete()}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-white/10 text-sm font-semibold text-white disabled:text-gray-500"
                  >
                    Launch without saving
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

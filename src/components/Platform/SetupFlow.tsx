import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, Trash2, Check } from 'lucide-react';
import { InterviewSetup } from '../../types/interview';
import {
  getUserInterviewSetups,
  saveInterviewSetup,
  updateSetupUsage,
  toggleSetupFavorite,
  deleteInterviewSetup,
  SavedInterviewSetup
} from '../../utils/local-interview';

interface SetupFlowProps {
  onComplete: (setup: InterviewSetup) => void;
  onBack: () => void;
  initialSetup?: Partial<InterviewSetup>;
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
  { id: 'Entry Level (0-2 years)', label: 'Entry', helper: '0–2 years' },
  { id: 'Mid Level (3-5 years)', label: 'Mid', helper: '3–5 years' },
  { id: 'Senior Level (6-10 years)', label: 'Senior', helper: '6–10 years' },
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
  industry: 'Kelv swaps follow-ups using real recruiter scripts from that industry.',
  jobType: 'We tailor prompts and rubrics to the title you choose. Go specific if you already have a target offer.',
  experienceLevel: 'Experience level nudges question depth and how hard we push on leadership versus execution.',
  interviewMode: 'Voice captures confidence and filler words. Text helps you sandbox messaging.'
};

const buildSetupNarrative = (setup: Partial<InterviewSetup>) => {
  const role = setup.jobType || 'your target role';
  const industry = setup.industry || 'your industry';
  const experience = setup.experienceLevel ? setup.experienceLevel.split('(')[0].trim().toLowerCase() : '';
  const mode = setup.interviewMode === 'text' ? 'a text-based session' : 'a live voice interview';
  const emphasis = setup.interviewMode === 'text' ? 'structure and content quality' : 'confidence, delivery, and how your answers actually land';
  const expStr = experience ? `${experience} ` : '';
  return `Kelv will run ${mode} tailored for a ${expStr}${role} in ${industry}. It will focus feedback on ${emphasis}.`;
};

export const SetupFlow: React.FC<SetupFlowProps> = ({ onComplete, onBack, initialSetup }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<Partial<InterviewSetup>>(initialSetup || { interviewMode: 'voice' });
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
    if (useAutoName && setup.industry && setup.jobType && setup.experienceLevel && setup.interviewMode) {
      const mode = setup.interviewMode === 'voice' ? 'Voice' : 'Text';
      const role = setup.jobType.split(' ')[0];
      setSetupName(`${mode} · ${role} · ${setup.industry}`);
    }
  }, [setup, useAutoName]);

  const isStepComplete = (stepId: StepId) => Boolean(setup[stepId]);
  const isSetupComplete = () => wizardSteps.every((step) => isStepComplete(step.id));

  const handleSelect = (field: StepId, value: string) => {
    if (value === 'Other') { setShowOtherField(true); return; }
    setSetup((prev) => ({ ...prev, [field]: value }));
    setShowOtherField(false);
    if (currentStep < wizardSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleOtherSubmit = () => {
    if (!otherValue.trim()) return;
    const field = wizardSteps[currentStep].id;
    setSetup((prev) => ({ ...prev, [field]: otherValue.trim() }));
    setOtherValue('');
    setShowOtherField(false);
    if (currentStep < wizardSteps.length - 1) setCurrentStep(currentStep + 1);
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

  const handleStartInterview = () => { if (isSetupComplete()) onComplete(setup as InterviewSetup); };

  const handleUseSavedSetup = async (savedSetup: SavedInterviewSetup) => {
    try { await updateSetupUsage(savedSetup.id); } catch {}
    onComplete(savedSetup.setup);
  };

  const handleToggleFavorite = async (setupId: string, isFavorite: boolean) => {
    try {
      await toggleSetupFavorite(setupId, !isFavorite);
      setSavedSetups(await getUserInterviewSetups());
    } catch {}
  };

  const handleDeleteSetup = async (setupId: string) => {
    try {
      await deleteInterviewSetup(setupId);
      setSavedSetups(await getUserInterviewSetups());
    } catch {}
  };

  const optionCardStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    background: active ? 'rgba(232,101,26,0.06)' : 'var(--surface-2)',
    border: `1px solid ${active ? 'rgba(232,101,26,0.4)' : 'var(--border)'}`,
    borderRadius: '6px',
    padding: '14px 16px',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'border-color 0.15s',
    width: '100%',
  });

  const renderOptions = () => {
    const stepId = wizardSteps[currentStep].id;

    if (stepId === 'jobType') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {jobTypes.map((role) => {
            const isActive = setup.jobType === role;
            return (
              <button key={role} onClick={() => handleSelect('jobType', role)} style={optionCardStyle(isActive)}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: isActive ? 'var(--text)' : 'var(--text-3)' }}>{role}</p>
              </button>
            );
          })}
        </div>
      );
    }

    if (stepId === 'industry') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {industries.map((industry) => {
            const isActive = setup.industry === industry.id;
            return (
              <button key={industry.id} onClick={() => handleSelect('industry', industry.id)} style={optionCardStyle(isActive)}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: isActive ? 'var(--text)' : 'var(--text-3)' }}>{industry.label}</p>
              </button>
            );
          })}
        </div>
      );
    }

    if (stepId === 'experienceLevel') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {experienceLevels.map((level) => {
            const isActive = setup.experienceLevel === level.id;
            return (
              <button key={level.id} onClick={() => handleSelect('experienceLevel', level.id)} style={optionCardStyle(isActive)}>
                <p style={{ fontSize: '15px', fontWeight: 510, color: isActive ? 'var(--text)' : 'var(--text-2)', marginBottom: '2px' }}>{level.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{level.helper}</p>
              </button>
            );
          })}
        </div>
      );
    }

    const voiceDisabled = !hasAPIKey;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {interviewModes.map((mode) => {
          const isActive = setup.interviewMode === mode.id;
          const isDisabled = mode.id === 'voice' && voiceDisabled;
          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && handleSelect('interviewMode', mode.id)}
              style={optionCardStyle(isActive, isDisabled)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 510, color: isActive ? 'var(--text)' : 'var(--text-2)' }}>{mode.title}</p>
                    {mode.badge && (
                      <span style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(232,101,26,0.1)', border: '1px solid rgba(232,101,26,0.2)', borderRadius: '3px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {mode.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{mode.description}</p>
                  {mode.id === 'voice' && voiceDisabled && (
                    <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>Add your OpenAI API key to unlock voice mode.</p>
                  )}
                </div>
                {isActive && <Check style={{ width: '14px', height: '14px', color: 'var(--orange)', flexShrink: 0 }} />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const progressPercent = wizardSteps.length > 1 ? (currentStep / (wizardSteps.length - 1)) * 100 : 100;
  const isLastStep = currentStep === wizardSteps.length - 1;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, -apple-system, sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '48px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Setup</p>
            <h1 style={{ fontSize: '28px', fontWeight: 510, letterSpacing: '-0.018em', color: 'var(--text)' }}>Set up your interview</h1>
          </div>
          <button
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft style={{ width: '13px', height: '13px' }} />
            Back to dashboard
          </button>
        </div>

        {/* Summary bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '32px', overflow: 'hidden' }}>
          {[
            { label: 'Role', value: setup.jobType || '—' },
            { label: 'Industry', value: setup.industry || '—' },
            { label: 'Experience', value: setup.experienceLevel ? setup.experienceLevel.split('(')[0].trim() : '—' },
            { label: 'Format', value: setup.interviewMode === 'text' ? 'Text' : 'Voice' },
          ].map((item, i) => (
            <div key={item.label} style={{ padding: i > 0 ? '0 0 0 20px' : '0', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>

          {/* Left: wizard steps + briefing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Progress steps */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</p>
                <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{currentStep + 1}/{wizardSteps.length}</p>
              </div>
              <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden', marginBottom: '16px' }}>
                <motion.div
                  animate={{ width: `${progressPercent}%` }}
                  initial={false}
                  transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: 'var(--orange)', borderRadius: '1px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {wizardSteps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;
                  const isUnlocked = index <= currentStep || wizardSteps.slice(0, index).every((s) => isStepComplete(s.id));
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && setCurrentStep(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: isActive ? 'rgba(232,101,26,0.06)' : 'transparent',
                        border: `1px solid ${isActive ? 'rgba(232,101,26,0.3)' : 'transparent'}`,
                        borderRadius: '5px',
                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                        opacity: isUnlocked ? 1 : 0.35,
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `1px solid ${isDone || isActive ? 'var(--orange)' : 'var(--border)'}`,
                        background: isDone ? 'var(--orange)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isDone
                          ? <Check style={{ width: '10px', height: '10px', color: '#fff' }} />
                          : <span style={{ fontSize: '9px', color: isActive ? 'var(--orange)' : 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{index + 1}</span>
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: isActive ? 'var(--text)' : 'var(--text-3)' }}>{step.label}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)' }}>{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kelv briefing */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>What Kelv will do</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.65' }}>{dynamicNarrative}</p>
            </div>

            {/* Saved setups */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Saved setups</p>
              {isLoadingSetups && (
                <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>Loading...</p>
              )}
              {!isLoadingSetups && savedSetups.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.6' }}>Save a config to relaunch it here with one click.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {!isLoadingSetups && savedSetups.map((saved) => (
                  <div
                    key={saved.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleUseSavedSetup(saved)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUseSavedSetup(saved); } }}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {saved.name}
                          {saved.is_favorite && <Heart style={{ width: '10px', height: '10px', color: '#f87171' }} />}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>{saved.setup.jobType} · {saved.setup.industry}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(saved.id, saved.is_favorite); }}
                          style={{ padding: '3px', color: saved.is_favorite ? '#f87171' : 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Heart style={{ width: '11px', height: '11px' }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSetup(saved.id); }}
                          style={{ padding: '3px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 style={{ width: '11px', height: '11px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: step options + summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Step panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={wizardSteps[currentStep].id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '28px' }}
              >
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Step {currentStep + 1} of {wizardSteps.length}
                  </p>
                  <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '4px' }}>
                    {wizardSteps[currentStep].label}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>{wizardSteps[currentStep].description}</p>
                </div>

                {renderOptions()}

                {/* Tip */}
                <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '5px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.6' }}>{stepTips[wizardSteps[currentStep].id]}</p>
                </div>

                {/* Custom input */}
                <AnimatePresence>
                  {showOtherField && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: '8px', marginTop: '12px' }}
                    >
                      <input
                        value={otherValue}
                        onChange={(e) => setOtherValue(e.target.value)}
                        placeholder="Type your custom option"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                      />
                      <button
                        onClick={handleOtherSubmit}
                        style={{ padding: '10px 16px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.4 : 1, padding: 0 }}
                  >
                    <ArrowLeft style={{ width: '13px', height: '13px' }} />
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      if (isLastStep) handleStartInterview();
                      else setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1));
                    }}
                    disabled={!isStepComplete(wizardSteps[currentStep].id)}
                    className="btn-primary"
                    style={{ opacity: isStepComplete(wizardSteps[currentStep].id) ? 1 : 0.4, cursor: isStepComplete(wizardSteps[currentStep].id) ? 'pointer' : 'not-allowed' }}
                  >
                    {isLastStep ? 'Launch interview' : 'Continue'}
                    <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Summary + save */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Summary</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                {[
                  { label: 'Industry', value: setup.industry },
                  { label: 'Role', value: setup.jobType },
                  { label: 'Experience', value: setup.experienceLevel },
                  { label: 'Mode', value: setup.interviewMode === 'voice' ? 'Voice interview' : setup.interviewMode === 'text' ? 'Text interview' : undefined },
                ].map((row) => (
                  <div key={row.label} style={{ background: 'var(--surface-2)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: row.value ? 'var(--text)' : 'var(--text-4)' }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Setup name</label>
                  <input
                    value={setupName}
                    onChange={(e) => { setSetupName(e.target.value); setUseAutoName(false); }}
                    placeholder="Voice · SWE · Tech"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-4)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={saveAsFavorite} onChange={(e) => setSaveAsFavorite(e.target.checked)} style={{ accentColor: 'var(--orange)' }} />
                  Mark as favorite
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={handleSaveSetup}
                    disabled={!isSetupComplete() || !setupName.trim()}
                    className="btn-primary"
                    style={{ justifyContent: 'center', opacity: isSetupComplete() && setupName.trim() ? 1 : 0.4 }}
                  >
                    Save & launch
                    <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </button>
                  <button
                    onClick={handleStartInterview}
                    disabled={!isSetupComplete()}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', cursor: isSetupComplete() ? 'pointer' : 'not-allowed', opacity: isSetupComplete() ? 1 : 0.4 }}
                  >
                    Skip save
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';
import { AnalyticsEngine } from '../../utils/analyticsEngine';
import { PerQuestionAnalytics } from '../../utils/perQuestionAnalytics';
import { buildSessionResultV2 } from '../../utils/sessionResultAdapter';
import { analyzeEnhancedVoiceMetrics } from '../../utils/enhancedSpeech';

interface InterviewProcessingProps {
  sessionData: any;
  onComplete: (results: any) => void;
}

const steps = [
  { label: 'Normalizing session', detail: 'Transcript, timing, context' },
  { label: 'Scoring answer quality', detail: 'Structure, specificity, STAR coverage' },
  { label: 'Building delivery signals', detail: 'Cadence, hesitation, filler load' },
  { label: 'Finalizing report', detail: 'Compiling results and practice targets' },
];

const InterviewProcessing: React.FC<InterviewProcessingProps> = ({ sessionData, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      try {
        setCurrentStep(0); setProgress(10);
        const transcript = Array.isArray(sessionData?.transcript)
          ? sessionData.transcript.filter((e: any) => e && !e.isPartial)
          : [];
        if (transcript.length === 0) throw new Error('No completed transcript captured for this session.');
        await delay(320);

        setCurrentStep(1); setProgress(35);
        const metrics = AnalyticsEngine.process({
          durationSecs: sessionData?.duration || 60,
          transcript,
          role: sessionData?.jobContext?.role,
          postureData: sessionData?.postureData,
        });
        await delay(320);

        setCurrentStep(2); setProgress(72);
        const perQuestionAnalysis = PerQuestionAnalytics.process(transcript, {
          postureData: sessionData?.postureData,
          overallMetrics: metrics,
        });
        const userTranscript = transcript
          .filter((e: any) => e.role === 'user')
          .map((e: any) => e.content)
          .join(' ');
        const voiceMetrics = sessionData?.recordingBlob
          ? await analyzeEnhancedVoiceMetrics(sessionData.recordingBlob, userTranscript, sessionData?.duration || 0)
          : undefined;
        const sessionResultV2 = buildSessionResultV2({
          id: sessionData?.id,
          transcript,
          duration: sessionData?.duration || 0,
          metrics,
          voiceMetrics,
          perQuestionAnalysis,
          postureData: sessionData?.postureData,
          jobContext: sessionData?.jobContext,
          processingSource: 'transcript-and-posture',
          transcriptVendor: sessionData?.voiceProvider || 'elevenlabs',
        });

        setCurrentStep(3); setProgress(100);
        await delay(900);

        onComplete({
          metrics,
          transcript,
          duration: sessionData?.duration,
          postureData: sessionData?.postureData,
          recordingBlob: sessionData?.recordingBlob,
          voiceMetrics,
          jobContext: sessionData?.jobContext,
          voiceProvider: sessionData?.voiceProvider || 'elevenlabs',
          whiteboardRequests: sessionData?.whiteboardRequests || [],
          perQuestionAnalysis,
          practicePlan: sessionResultV2.recommended_drills,
          signalReliability: sessionResultV2.signal_reliability,
          signalFusion: sessionResultV2.signal_fusion,
          sessionResultV2,
          processingSource: 'transcript-and-posture',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed.');
      }
    };

    run();
  }, [sessionData, onComplete]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: '#f87171', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Processing failed</p>
          <p style={{ fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.6', marginBottom: '28px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              onClick={() => onComplete(null)}
              style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Animated orb */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px' }}>
            {/* Outer rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '1px solid var(--orange)',
                  opacity: 0,
                }}
                animate={{ scale: [1, 2.2 + i * 0.4], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              />
            ))}
            {/* Core */}
            <motion.div
              style={{
                position: 'absolute', inset: '12px', borderRadius: '50%',
                background: 'var(--orange)',
              }}
              animate={{ scale: [0.92, 1.04, 0.92] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <p style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
            Kelv · Analysis running
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.018em', color: 'var(--text)', marginBottom: '6px' }}>
            Building your coaching report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.55' }}>
            Transcript, timing, and posture signals are being fused into actionable feedback.
          </p>
        </motion.div>

        {/* Progress bar */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--orange)', borderRadius: '1px' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {steps[Math.min(currentStep, steps.length - 1)].label.toLowerCase()}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={index}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                  background: isActive ? 'rgba(232,101,26,0.06)' : 'var(--surface)',
                  transition: 'background 0.3s',
                }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                {/* Status indicator */}
                <div style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div
                        key="done"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check style={{ width: '9px', height: '9px', color: 'rgba(74,222,128,0.9)' }} />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="active"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      >
                        <motion.div
                          style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--orange)' }}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pending"
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border)' }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    color: isDone ? 'rgba(74,222,128,0.8)' : isActive ? 'var(--text)' : 'var(--text-4)',
                    marginBottom: '1px',
                    transition: 'color 0.3s',
                  }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {step.detail}
                  </p>
                </div>

                {isDone && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: '10px', color: 'rgba(74,222,128,0.6)', fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    done
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export default InterviewProcessing;

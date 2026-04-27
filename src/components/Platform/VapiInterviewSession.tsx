import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff,
    FileText, ArrowLeft, Upload,
    PanelLeftClose, PanelLeftOpen,
    Sparkles, Loader2, Dumbbell, Check, Square
} from 'lucide-react';
import { useVapiInterview } from '../../hooks/useVapiInterview';
import { useInterviewRecorder } from '../../hooks/useInterviewRecorder';
import { usePoseTracking } from '../../hooks/usePoseTracking';
import AIInterviewer from './AIInterviewer';
import InteractiveWarmUp from './InteractiveWarmUp';
import { extractTextFromPDF, isPDF, isTextFile } from '../../utils/pdfUtils';
import { buildVapiInterviewContext } from '../../utils/interviewContext';

interface VapiInterviewSessionProps {
    onComplete: (sessionData: any) => void;
    onBack: () => void;
}

const VapiInterviewSession: React.FC<VapiInterviewSessionProps> = ({ onComplete, onBack }) => {
    const [previewPhase, setPreviewPhase] = useState(true);
    const [showWarmUp, setShowWarmUp] = useState(false);
    const [completedWarmUp, setCompletedWarmUp] = useState(false);
    const [tempJD, setTempJD] = useState('');
    const [tempResume, setTempResume] = useState('');
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isInjectingContext, setIsInjectingContext] = useState(false);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [resumeError, setResumeError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [showTranscript, setShowTranscript] = useState(true);

    const { status, isAISpeaking, isUserSpeaking, transcript, duration, startInterview, endInterview } = useVapiInterview({
        onError: (err) => setCameraError(err),
    });

    const { startRecording, stopRecording, recordedBlob } = useInterviewRecorder({ stream });
    const { aggregatedData: postureData, currentPosture, isInitialized: poseReady } = usePoseTracking({
        videoRef,
        enabled: status === 'interviewing' && !isVideoOff,
        sampleIntervalMs: 10000
    });

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const stopMedia = useCallback(() => {
        const currentStream = streamRef.current;
        if (currentStream) {
            currentStream.getTracks().forEach(track => { track.stop(); track.enabled = false; });
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const setupMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: true
                });
                if (mounted) { streamRef.current = mediaStream; setStream(mediaStream); setCameraError(null); }
                else mediaStream.getTracks().forEach(t => t.stop());
            } catch {
                if (mounted) setCameraError('Please enable camera and microphone access.');
            }
        };
        setupMedia();
        return () => { mounted = false; stopMedia(); };
    }, [stopMedia]);

    useEffect(() => { if (status === 'completed') stopMedia(); }, [status, stopMedia]);

    useEffect(() => {
        const currentStream = streamRef.current || stream;
        if (!currentStream) return;
        if (previewPhase && previewVideoRef.current) previewVideoRef.current.srcObject = currentStream;
        else if (!previewPhase && videoRef.current) videoRef.current.srcObject = currentStream;
    }, [stream, previewPhase]);

    useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

    const toggleMute = useCallback(() => {
        const s = streamRef.current;
        if (s) { s.getAudioTracks().forEach(t => t.enabled = isMuted); setIsMuted(!isMuted); }
    }, [isMuted]);

    const toggleVideo = useCallback(() => {
        const s = streamRef.current;
        if (s) { s.getVideoTracks().forEach(t => t.enabled = isVideoOff); setIsVideoOff(!isVideoOff); }
    }, [isVideoOff]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleResumeFile(file);
    }, []);

    const handleResumeFile = async (file: File) => {
        setResumeFileName(file.name); setResumeError(null); setTempResume('');
        try {
            if (isPDF(file)) {
                setIsParsingResume(true);
                const extractedText = await extractTextFromPDF(file);
                setTempResume(extractedText);
            } else if (isTextFile(file)) {
                setTempResume(await file.text());
            } else {
                const text = await file.text();
                if (text && text.length > 10) setTempResume(text);
                else throw new Error('Could not extract text. Please use PDF or TXT.');
            }
        } catch (error) {
            setResumeError(error instanceof Error ? error.message : 'Failed to process resume');
            setResumeFileName(null);
        } finally {
            setIsParsingResume(false);
        }
    };

    useEffect(() => { if (status === 'interviewing') startRecording(); }, [status, startRecording]);

    useEffect(() => {
        if (status === 'completed' && recordedBlob) {
            const interviewContext = buildVapiInterviewContext({ jobDescription: tempJD, resumeText: tempResume, sessionPhase: 'close' });
            onComplete({
                transcript, duration, recordingBlob: recordedBlob,
                jobContext: { role: interviewContext.role, industry: interviewContext.industry, experienceLevel: interviewContext.experienceLevel, category: interviewContext.category, jobDescription: tempJD, resumeSummary: interviewContext.promptContext.resume_summary, jdSummary: interviewContext.promptContext.jd_summary, promptContext: interviewContext.promptContext },
                postureData: postureData ? { shoulderAlignment: postureData.shoulderAlignment, headPosition: postureData.headPosition, overallScore: postureData.overallScore, timeInGoodPosture: postureData.timeInGoodPosture, sampleCount: postureData.sampleCount, samples: postureData.samples } : undefined
            });
        } else if (status === 'completed' && !recordedBlob) {
            stopRecording();
        }
    }, [status, recordedBlob, transcript, duration, postureData, onComplete, stopRecording, tempJD, tempResume]);

    const handleStartInterview = async () => {
        if (!tempJD.trim() || !tempResume.trim()) return;
        setIsInjectingContext(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setPreviewPhase(false);
        await startInterview(tempJD.trim(), tempResume.trim());
        setIsInjectingContext(false);
    };

    const handleEndInterview = () => { stopMedia(); stopRecording(); endInterview(); };
    const isReady = tempJD.trim().length > 0 && tempResume.trim().length > 0 && stream;

    if (showWarmUp) {
        return <InteractiveWarmUp onComplete={() => { setShowWarmUp(false); setCompletedWarmUp(true); }} onSkip={() => setShowWarmUp(false)} />;
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--text)',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, sans-serif',
        transition: 'border-color 0.15s',
    };

    if (previewPhase) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
                {/* Header */}
                <header style={{ height: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => { stopMedia(); onBack(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft style={{ width: '13px', height: '13px' }} />
                            Back
                        </button>
                        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                        <div>
                            <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pre-session check</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System check</span>
                        {completedWarmUp && (
                            <span style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', padding: '4px 10px', background: 'rgba(232,101,26,0.08)', border: '1px solid rgba(232,101,26,0.25)', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Warm-up done</span>
                        )}
                    </div>
                </header>

                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '256px 1fr 360px', gap: '24px' }}>
                    {/* Left column: steps + warm-up */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Steps */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Checklist</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                {[
                                    { label: 'Devices', done: true },
                                    { label: 'Warm-up', done: completedWarmUp },
                                    { label: 'Context', done: !!tempJD.trim() && !!tempResume.trim() }
                                ].map((step) => (
                                    <div key={step.label} style={{ background: 'var(--surface-2)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', color: step.done ? 'var(--text)' : 'var(--text-4)' }}>{step.label}</span>
                                        {step.done
                                            ? <Check style={{ width: '12px', height: '12px', color: 'rgba(74,222,128,0.8)' }} />
                                            : <span style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>Pending</span>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warm-up */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Warm-up</p>
                                <span style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>2 min</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                                {[
                                    { label: 'Posture alignment', time: '40s' },
                                    { label: 'Breath pacing', time: '35s' },
                                    { label: 'Voice warm-up', time: '45s' }
                                ].map((item, i) => (
                                    <div key={item.label} style={{ background: 'var(--surface-2)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>0{i + 1}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{item.label}</span>
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{item.time}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowWarmUp(true)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: completedWarmUp ? 'var(--surface-2)' : 'var(--orange)',
                                    border: completedWarmUp ? '1px solid var(--border)' : 'none',
                                    borderRadius: '5px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: completedWarmUp ? 'var(--text-3)' : '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                {completedWarmUp ? 'Redo warm-up' : 'Start warm-up'}
                            </button>
                        </div>
                    </div>

                    {/* Center column: camera preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div>
                                <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Camera preview</p>
                                <h2 style={{ fontSize: '20px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)' }}>Check your setup</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', padding: '3px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }}>1280×720</span>
                                <span style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', padding: '3px 8px', border: '1px solid', borderRadius: '3px', ...(cameraError ? { color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' } : { color: 'rgba(74,222,128,0.8)', borderColor: 'rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.06)' }) }}>
                                    {cameraError ? 'Blocked' : 'Live'}
                                </span>
                            </div>
                        </div>

                        {/* Video container */}
                        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                            {stream && !isVideoOff
                                ? <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                                    <VideoOff style={{ width: '32px', height: '32px', color: 'var(--text-4)' }} />
                                  </div>
                            }
                            {cameraError && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', zIndex: 20 }}>
                                    <p style={{ fontSize: '13px', color: '#f87171' }}>{cameraError}</p>
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', gap: '6px' }}>
                                {['Center your face', 'Eye level'].map(tip => (
                                    <span key={tip} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', padding: '3px 8px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', backdropFilter: 'blur(4px)' }}>{tip}</span>
                                ))}
                            </div>
                            <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backdropFilter: 'blur(8px)' }}>
                                <button onClick={toggleMute} style={{ width: '32px', height: '32px', borderRadius: '5px', background: isMuted ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    {isMuted ? <MicOff style={{ width: '14px', height: '14px' }} /> : <Mic style={{ width: '14px', height: '14px' }} />}
                                </button>
                                <button onClick={toggleVideo} style={{ width: '32px', height: '32px', borderRadius: '5px', background: isVideoOff ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    {isVideoOff ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                                </button>
                            </div>
                        </div>

                        {/* Device status row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[
                                { label: 'Mic', value: isMuted ? 'Muted' : 'Active' },
                                { label: 'Camera', value: isVideoOff ? 'Off' : 'Active' },
                                { label: 'Environment', value: 'Quiet' }
                            ].map(item => (
                                <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', padding: '12px 14px' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{item.label}</p>
                                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column: context */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <p style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Session context</p>
                                <h2 style={{ fontSize: '16px', fontWeight: 510, color: 'var(--text)', marginBottom: '4px' }}>Give Kelv your details</h2>
                                <p style={{ fontSize: '12px', color: 'var(--text-4)', lineHeight: '1.6' }}>Sharper context means sharper feedback.</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Job description</label>
                                <textarea
                                    value={tempJD}
                                    onChange={(e) => setTempJD(e.target.value)}
                                    placeholder="Paste the target job description..."
                                    style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
                                    onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Resume</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `1px dashed ${isDragging ? 'var(--orange)' : resumeFileName ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
                                        borderRadius: '6px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                        background: isDragging ? 'rgba(232,101,26,0.04)' : resumeFileName ? 'rgba(74,222,128,0.04)' : 'var(--surface-2)',
                                        transition: 'border-color 0.15s',
                                        textAlign: 'center',
                                    }}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={(e) => e.target.files?.[0] && handleResumeFile(e.target.files[0])} style={{ display: 'none' }} />
                                    {isParsingResume ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Loader2 style={{ width: '16px', height: '16px', color: 'var(--orange)', animation: 'spin 0.6s linear infinite' }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Extracting text...</span>
                                        </div>
                                    ) : resumeError ? (
                                        <div>
                                            <FileText style={{ width: '18px', height: '18px', color: '#f87171', margin: '0 auto 6px' }} />
                                            <p style={{ fontSize: '12px', color: '#f87171' }}>{resumeError}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>Click to retry</p>
                                        </div>
                                    ) : resumeFileName ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <FileText style={{ width: '16px', height: '16px', color: 'rgba(74,222,128,0.8)' }} />
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{resumeFileName}</p>
                                                <p style={{ fontSize: '10px', color: 'var(--text-4)' }}>{tempResume.length} chars extracted</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload style={{ width: '18px', height: '18px', color: 'var(--text-4)', margin: '0 auto 6px' }} />
                                            <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>Upload resume <span style={{ color: 'var(--text-4)', opacity: 0.6 }}>(PDF, TXT)</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: '12px 14px', background: 'rgba(232,101,26,0.05)', border: '1px solid rgba(232,101,26,0.15)', borderRadius: '5px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.6' }}>Strong context makes feedback sharper. You can paste an abbreviated role summary too.</p>
                            </div>

                            <button
                                onClick={handleStartInterview}
                                disabled={!isReady || isInjectingContext}
                                className="btn-primary"
                                style={{ justifyContent: 'center', opacity: isReady && !isInjectingContext ? 1 : 0.4, cursor: isReady && !isInjectingContext ? 'pointer' : 'not-allowed' }}
                            >
                                {isInjectingContext ? (
                                    <>
                                        <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                        Initializing...
                                    </>
                                ) : !stream ? 'Waiting for media...' : !isReady ? 'Complete setup above' : 'Launch session'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Live interview screen
    return (
        <div style={{ height: '100vh', background: '#000', color: '#fff', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            {/* Transcript sidebar */}
            <AnimatePresence>
                {showTranscript && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 360, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        style={{ height: '100%', borderRight: '1px solid rgba(255,255,255,0.08)', background: '#0a0b0c', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}
                    >
                        <div style={{ height: '52px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live transcript</p>
                            <button onClick={() => setShowTranscript(false)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                <PanelLeftClose style={{ width: '14px', height: '14px' }} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {transcript.map((msg, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: msg.role === 'assistant' ? '#E8651A' : msg.role === 'system' ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.4)' }}>
                                            {msg.role === 'system' ? 'System' : msg.role === 'assistant' ? 'Kelv' : 'You'}
                                        </span>
                                        {msg.timestamp && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'IBM Plex Mono, monospace' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: msg.role === 'assistant' ? 'rgba(255,255,255,0.85)' : msg.role === 'system' ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.5)' }}>
                                        {msg.content}
                                    </p>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#000' }}>
                {/* Floating header */}
                <header style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        {!showTranscript && (
                            <button onClick={() => setShowTranscript(true)} style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
                                <PanelLeftOpen style={{ width: '14px', height: '14px' }} />
                            </button>
                        )}
                    </div>
                    <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', backdropFilter: 'blur(8px)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status === 'interviewing' ? '#ef4444' : 'rgba(255,255,255,0.2)', animation: status === 'interviewing' ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'IBM Plex Mono, monospace' }}>{formatTime(duration)}</span>
                        <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '10px', color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live session</span>
                    </div>
                </header>

                {/* AI + user video */}
                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', position: 'relative' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AIInterviewer isActive={true} isSpeaking={isAISpeaking} isListening={isUserSpeaking} isProcessing={status === 'connecting'} size="full" />
                        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#E8651A', letterSpacing: '-0.01em' }}>Kelv</h2>
                            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>AI Interviewer</p>
                        </div>
                    </div>

                    {/* Self-cam pip */}
                    <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '360px', aspectRatio: '16/9', background: '#0a0b0c', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', zIndex: 30 }}>
                        {isVideoOff
                            ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Camera off</span>
                              </div>
                            : <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        }
                        <div style={{ position: 'absolute', bottom: '8px', left: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 7px', background: 'rgba(0,0,0,0.7)', borderRadius: '3px' }}>You</div>
                        {poseReady && currentPosture && (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 7px', borderRadius: '3px', border: '1px solid', ...(currentPosture.isGoodPosture ? { color: 'rgba(74,222,128,0.8)', borderColor: 'rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)' } : { color: 'rgba(251,191,36,0.8)', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)' }) }}>
                                {currentPosture.isGoodPosture ? 'Good posture' : 'Adjust posture'}
                            </div>
                        )}
                    </div>
                </main>

                {/* Controls footer */}
                <footer style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0b0c', flexShrink: 0, zIndex: 30 }}>
                    <button onClick={toggleMute} style={{ width: '36px', height: '36px', borderRadius: '6px', background: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMuted ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                        {isMuted ? <MicOff style={{ width: '14px', height: '14px' }} /> : <Mic style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <button onClick={toggleVideo} style={{ width: '36px', height: '36px', borderRadius: '6px', background: isVideoOff ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isVideoOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isVideoOff ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                        {isVideoOff ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
                    <button
                        onClick={handleEndInterview}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', fontSize: '12px', color: '#f87171', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                        <Square style={{ width: '10px', height: '10px' }} />
                        End session
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VapiInterviewSession;

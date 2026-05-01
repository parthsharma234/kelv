import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff,
    ArrowLeft, Upload,
    PanelLeftClose, PanelLeftOpen,
    Loader2, Check, Square
} from 'lucide-react';
import { useElevenLabsInterview } from '../../hooks/useElevenLabsInterview';
import { usePoseTracking } from '../../hooks/usePoseTracking';
import AIInterviewer from './AIInterviewer';
import { extractTextFromPDF, isPDF, isTextFile } from '../../utils/pdfUtils';
import { buildVoiceInterviewContext } from '../../utils/interviewContext';

interface VoiceInterviewSessionProps {
    onComplete: (sessionData: any) => void;
    onBack: () => void;
}

const VoiceInterviewSession: React.FC<VoiceInterviewSessionProps> = ({ onComplete, onBack }) => {
    const [previewPhase, setPreviewPhase] = useState(true);
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
    const micAudioContextRef = useRef<AudioContext | null>(null);
    const micAnimationRef = useRef<number | null>(null);
    const didCompleteRef = useRef(false);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const recorderChunksRef = useRef<Blob[]>([]);
    const recorderStreamRef = useRef<MediaStream | null>(null);
    const recordingBlobRef = useRef<Blob | null>(null);
    const [recordingReadyVersion, setRecordingReadyVersion] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [showTranscript, setShowTranscript] = useState(true);
    const [localMicVolume, setLocalMicVolume] = useState(0);

    const { status, isAISpeaking, isUserSpeaking, transcript, duration, inputVolume, connectionTransport, debugMessages, speechFallbackActive, whiteboardRequests, startInterview, endInterview, setMicMuted } = useElevenLabsInterview({
        onError: (err) => setCameraError(err),
    });

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

    const releasePreviewMicrophone = useCallback(() => {
        const currentStream = streamRef.current;
        if (!currentStream) return undefined;

        const inputDeviceId = currentStream.getAudioTracks()[0]?.getSettings().deviceId;
        if (micAnimationRef.current) {
            window.cancelAnimationFrame(micAnimationRef.current);
            micAnimationRef.current = null;
        }
        micAudioContextRef.current?.close().catch(() => undefined);
        micAudioContextRef.current = null;
        setLocalMicVolume(0);

        currentStream.getAudioTracks().forEach(track => {
            track.stop();
            currentStream.removeTrack(track);
        });

        const videoOnlyStream = new MediaStream(currentStream.getVideoTracks());
        streamRef.current = videoOnlyStream;
        setStream(videoOnlyStream);
        return inputDeviceId;
    }, []);

    const stopLocalRecording = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
            return;
        }

        recorderStreamRef.current?.getTracks().forEach(track => track.stop());
        recorderStreamRef.current = null;
        recorderRef.current = null;
    }, []);

    const startLocalRecording = useCallback(async (inputDeviceId?: string) => {
        if (!streamRef.current || recorderRef.current?.state === 'recording') return;

        try {
            const recordingStream = new MediaStream();
            streamRef.current.getVideoTracks().forEach(track => recordingStream.addTrack(track.clone()));

            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true,
                    video: false
                });
                audioStream.getAudioTracks().forEach(track => recordingStream.addTrack(track));
            } catch (error) {
                console.warn('[Recorder] Audio capture unavailable; saving video-only replay.', error);
            }

            if (recordingStream.getTracks().length === 0) return;

            const mimeType = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm'
            ].find(type => MediaRecorder.isTypeSupported(type)) || '';

            recorderChunksRef.current = [];
            recordingBlobRef.current = null;
            const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
            recorder.ondataavailable = (event) => {
                if (event.data?.size) recorderChunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                const blob = recorderChunksRef.current.length
                    ? new Blob(recorderChunksRef.current, { type: mimeType || 'video/webm' })
                    : null;
                recordingBlobRef.current = blob;
                recorderStreamRef.current?.getTracks().forEach(track => track.stop());
                recorderStreamRef.current = null;
                recorderRef.current = null;
                setRecordingReadyVersion(version => version + 1);
            };

            recorderStreamRef.current = recordingStream;
            recorderRef.current = recorder;
            recorder.start(1000);
        } catch (error) {
            console.warn('[Recorder] Replay recording failed to start.', error);
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

    useEffect(() => {
        return () => {
            stopLocalRecording();
        };
    }, [stopLocalRecording]);

    useEffect(() => { if (status === 'completed') stopMedia(); }, [status, stopMedia]);

    useEffect(() => {
        const currentStream = streamRef.current || stream;
        if (!currentStream) return;
        if (previewPhase && previewVideoRef.current) previewVideoRef.current.srcObject = currentStream;
        else if (!previewPhase && videoRef.current) videoRef.current.srcObject = currentStream;
    }, [stream, previewPhase]);

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) {
            setLocalMicVolume(0);
            return;
        }

        const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return;

        let disposed = false;
        const audioContext = new AudioContextConstructor();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        micAudioContextRef.current = audioContext;
        analyser.fftSize = 512;
        const samples = new Uint8Array(analyser.fftSize);
        source.connect(analyser);

        const tick = () => {
            if (disposed) return;
            analyser.getByteTimeDomainData(samples);
            let sum = 0;
            for (const sample of samples) {
                const centered = (sample - 128) / 128;
                sum += centered * centered;
            }
            setLocalMicVolume(Math.min(1, Math.sqrt(sum / samples.length) * 3));
            micAnimationRef.current = window.requestAnimationFrame(tick);
        };

        tick();

        return () => {
            disposed = true;
            if (micAnimationRef.current) window.cancelAnimationFrame(micAnimationRef.current);
            source.disconnect();
            audioContext.close().catch(() => undefined);
            if (micAudioContextRef.current === audioContext) micAudioContextRef.current = null;
            setLocalMicVolume(0);
        };
    }, [stream]);

    useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

    useEffect(() => {
        const writeDiagnostics = (event: string, detail?: unknown) => {
            try {
                window.localStorage.setItem('kelv.lastInterviewRuntime', JSON.stringify({
                    event,
                    detail: detail instanceof Error ? detail.message : detail,
                    timestamp: new Date().toISOString(),
                    status,
                    duration,
                    transcriptCount: transcript.length,
                    userMessageCount: transcript.filter((entry) => entry.role === 'user').length,
                    assistantMessageCount: transcript.filter((entry) => entry.role === 'assistant').length,
                    inputVolume,
                    connectionTransport,
                    speechFallbackActive,
                    isAISpeaking,
                    isUserSpeaking,
                    cameraError,
                    debugMessages,
                    postureSamples: postureData?.sampleCount || 0
                }));
            } catch {
                // Diagnostics should never interfere with the interview.
            }
        };

        const handleError = (event: ErrorEvent) => writeDiagnostics('window_error', event.message);
        const handleRejection = (event: PromiseRejectionEvent) => writeDiagnostics('unhandled_rejection', String(event.reason));
        const handlePageHide = () => writeDiagnostics('page_hide');

        writeDiagnostics('state_update');
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [cameraError, connectionTransport, debugMessages, duration, inputVolume, isAISpeaking, isUserSpeaking, postureData?.sampleCount, speechFallbackActive, status, transcript]);

    const toggleMute = useCallback(() => {
        const s = streamRef.current;
        const nextMuted = !isMuted;
        if (s) s.getAudioTracks().forEach(t => { t.enabled = !nextMuted; });
        setMicMuted(nextMuted);
        setIsMuted(nextMuted);
    }, [isMuted, setMicMuted]);

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

    useEffect(() => {
        if (status === 'completed' && !didCompleteRef.current) {
            if (recorderRef.current) {
                stopLocalRecording();
                return;
            }

            didCompleteRef.current = true;
            const interviewContext = buildVoiceInterviewContext({ jobDescription: tempJD, resumeText: tempResume, sessionPhase: 'close' });
            onComplete({
                transcript, duration,
                jobContext: { role: interviewContext.role, industry: interviewContext.industry, experienceLevel: interviewContext.experienceLevel, category: interviewContext.category, jobDescription: tempJD, resumeSummary: interviewContext.promptContext.resume_summary, jdSummary: interviewContext.promptContext.jd_summary, promptContext: interviewContext.promptContext, blueprint: interviewContext.blueprint },
                voiceProvider: 'elevenlabs',
                whiteboardRequests,
                recordingBlob: recordingBlobRef.current || undefined,
                postureData: postureData ? { shoulderAlignment: postureData.shoulderAlignment, headPosition: postureData.headPosition, overallScore: postureData.overallScore, timeInGoodPosture: postureData.timeInGoodPosture, sampleCount: postureData.sampleCount, samples: postureData.samples } : undefined
            });
        }
    }, [status, transcript, duration, postureData, onComplete, tempJD, tempResume, whiteboardRequests, stopLocalRecording, recordingReadyVersion]);

    const handleStartInterview = async () => {
        if (!tempJD.trim() || !tempResume.trim()) return;
        didCompleteRef.current = false;
        setIsInjectingContext(true);
        const inputDeviceId = releasePreviewMicrophone();
        setIsMuted(false);
        setPreviewPhase(false);
        try {
            await startInterview(tempJD.trim(), tempResume.trim(), inputDeviceId);
            await startLocalRecording(inputDeviceId);
        } finally {
            setIsInjectingContext(false);
        }
    };

    const handleEndInterview = () => { stopLocalRecording(); stopMedia(); endInterview(); };
    const isReady = tempJD.trim().length > 0 && tempResume.trim().length > 0 && stream;
    const latestOpenWhiteboard = whiteboardRequests.filter((request) => request.tool_name === 'openWhiteboard').slice(-1)[0];
    const latestCloseWhiteboard = whiteboardRequests.filter((request) => request.tool_name === 'closeWhiteboard').slice(-1)[0];
    const activeWhiteboard = latestOpenWhiteboard && (!latestCloseWhiteboard || latestCloseWhiteboard.timestamp < latestOpenWhiteboard.timestamp)
      ? latestOpenWhiteboard
      : null;
    const hasMicActivity = isUserSpeaking || inputVolume > 0.01 || localMicVolume > 0.01;
    const micStatusLabel = isMuted ? 'Mic muted' : isUserSpeaking ? 'Listening' : hasMicActivity ? 'Mic active' : 'Mic ready';
    const micStatusColor = isMuted ? '#f87171' : hasMicActivity ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.48)';
    const sessionStatusLabel = status === 'connecting' ? 'Connecting' : status === 'error' ? 'Needs attention' : 'Live session';
    const showDebugPanel = import.meta.env.DEV && window.localStorage.getItem('kelv.showDebug') === 'true';

    const fieldStyle: React.CSSProperties = {
        width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--text)',
        outline: 'none', boxSizing: 'border-box', resize: 'vertical' as const, transition: 'border-color 0.15s',
    };

    if (previewPhase) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
                {/* Header */}
                <header style={{ height: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => { stopMedia(); onBack(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft style={{ width: '14px', height: '14px' }} />
                            Back
                        </button>
                        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pre-session</span>
                    </div>
                    <span style={{
                        fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', padding: '4px 10px',
                        border: '1px solid', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
                        ...(cameraError
                            ? { color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }
                            : { color: 'rgba(74,222,128,0.8)', borderColor: 'rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.06)' })
                    }}>
                        {cameraError ? 'Camera blocked' : `Camera live / ${localMicVolume > 0.01 ? 'Mic active' : 'Mic ready'}`}
                    </span>
                </header>

                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>

                    {/* Left: camera */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Camera preview</p>
                            <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.018em', color: 'var(--text)' }}>Look interview-ready</h2>
                        </div>

                        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                            {stream && !isVideoOff
                                ? <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                                    <VideoOff style={{ width: '32px', height: '32px', color: 'var(--text-4)' }} />
                                  </div>
                            }
                            {cameraError && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,3,5,0.9)', zIndex: 20 }}>
                                    <p style={{ fontSize: '13px', color: '#f87171' }}>{cameraError}</p>
                                </div>
                            )}
                            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                                <button onClick={toggleMute} style={{ width: '36px', height: '36px', borderRadius: '6px', background: isMuted ? 'rgba(239,68,68,0.85)' : 'rgba(3,3,5,0.7)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}>
                                    {isMuted ? <MicOff style={{ width: '14px', height: '14px' }} /> : <Mic style={{ width: '14px', height: '14px' }} />}
                                </button>
                                <button onClick={toggleVideo} style={{ width: '36px', height: '36px', borderRadius: '6px', background: isVideoOff ? 'rgba(239,68,68,0.85)' : 'rgba(3,3,5,0.7)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}>
                                    {isVideoOff ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: context form */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '4px' }}>Session context</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.5' }}>Give Kelv the job details and your background.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Job description</label>
                                <textarea
                                    value={tempJD}
                                    onChange={(e) => setTempJD(e.target.value)}
                                    placeholder="Paste target job description..."
                                    rows={5}
                                    style={fieldStyle}
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
                                        borderRadius: '6px', padding: '20px', cursor: 'pointer', textAlign: 'center',
                                        background: isDragging ? 'rgba(232,101,26,0.04)' : resumeFileName ? 'rgba(74,222,128,0.04)' : 'var(--surface-2)',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={(e) => e.target.files?.[0] && handleResumeFile(e.target.files[0])} style={{ display: 'none' }} />
                                    {isParsingResume ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Loader2 style={{ width: '14px', height: '14px', color: 'var(--orange)', animation: 'spin 0.6s linear infinite' }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Extracting text...</span>
                                        </div>
                                    ) : resumeError ? (
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#f87171' }}>{resumeError}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>Click to retry</p>
                                        </div>
                                    ) : resumeFileName ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Check style={{ width: '13px', height: '13px', color: 'rgba(74,222,128,0.8)' }} />
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{resumeFileName}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>{tempResume.length} chars extracted</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Upload style={{ width: '14px', height: '14px', color: 'var(--text-4)' }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Upload resume <span style={{ opacity: 0.5 }}>(PDF or TXT)</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStartInterview}
                            disabled={!isReady || isInjectingContext}
                            className="btn-primary"
                            style={{ justifyContent: 'center', opacity: isReady && !isInjectingContext ? 1 : 0.35, cursor: isReady && !isInjectingContext ? 'pointer' : 'not-allowed' }}
                        >
                            {isInjectingContext ? (
                                <>
                                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                    Initializing...
                                </>
                            ) : !stream ? 'Waiting for camera...' : !isReady ? 'Add JD and resume' : 'Launch session'}
                        </button>
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

            {activeWhiteboard && (
                <div style={{ position: 'absolute', top: '76px', right: '24px', zIndex: 45, width: '320px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(232,101,26,0.25)', background: 'rgba(10,11,12,0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
                    <p style={{ fontSize: '10px', color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Whiteboard requested</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: '1.5' }}>
                        {activeWhiteboard.prompt || 'Use the whiteboard to structure your thinking.'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.5', marginTop: '10px' }}>
                        Use this space to organize your answer{activeWhiteboard.mode ? ` for ${activeWhiteboard.mode}` : ''}.
                    </p>
                </div>
            )}

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
                        <span style={{ fontSize: '10px', color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sessionStatusLabel}</span>
                        <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '10px', color: micStatusColor, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {micStatusLabel}
                        </span>
                    </div>
                </header>

                {/* AI + user video */}
                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', position: 'relative' }}>
                    {status === 'error' && cameraError && (
                        <div style={{ position: 'absolute', top: '86px', left: '50%', transform: 'translateX(-50%)', zIndex: 60, width: 'min(560px, calc(100% - 48px))', padding: '16px 18px', background: 'rgba(127,29,29,0.92)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '8px', boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}>
                            <p style={{ fontSize: '12px', color: '#fecaca', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>ElevenLabs session error</p>
                            <p style={{ fontSize: '13px', lineHeight: '1.55', color: '#fee2e2' }}>{cameraError}</p>
                            <button
                                onClick={() => { setPreviewPhase(true); setCameraError(null); }}
                                style={{ marginTop: '12px', padding: '7px 12px', borderRadius: '5px', border: '1px solid rgba(254,202,202,0.35)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                            >
                                Back to setup
                            </button>
                        </div>
                    )}
                    {showDebugPanel && debugMessages.length > 0 && (
                        <div style={{ position: 'absolute', left: '24px', bottom: '96px', zIndex: 50, width: 'min(420px, calc(100% - 48px))', padding: '12px 14px', background: 'rgba(10,11,12,0.86)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.38)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Debug</p>
                            {debugMessages.map((message, index) => (
                                <p key={`${message}_${index}`} style={{ fontSize: '10px', lineHeight: '1.45', color: 'rgba(255,255,255,0.48)', fontFamily: 'IBM Plex Mono, monospace' }}>{message}</p>
                            ))}
                        </div>
                    )}
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

export default VoiceInterviewSession;

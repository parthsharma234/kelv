import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff,
    FileText, ArrowLeft, Upload,
    PanelLeftClose, PanelLeftOpen,
    Sparkles, Loader2, Dumbbell
} from 'lucide-react';
import { useVapiInterview } from '../../hooks/useVapiInterview';
import { useInterviewRecorder } from '../../hooks/useInterviewRecorder';
import { usePoseTracking } from '../../hooks/usePoseTracking';
import AIInterviewer from './AIInterviewer';
import InteractiveWarmUp from './InteractiveWarmUp';
import { extractTextFromPDF, isPDF, isTextFile } from '../../utils/pdfUtils';

interface VapiInterviewSessionProps {
    onComplete: (sessionData: any) => void;
    onBack: () => void;
}

const VapiInterviewSession: React.FC<VapiInterviewSessionProps> = ({
    onComplete,
    onBack
}) => {
    // Pre-interview state
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

    // Refs - must be declared before hooks that use them
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Media state
    // REF ensures cleanup functions always interpret the latest stream, avoiding stale closures
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // UI state
    const [showTranscript, setShowTranscript] = useState(true);

    // Initialize Vapi Interview hook first (provides status needed by other hooks)
    const {
        status,
        isAISpeaking,
        isUserSpeaking,
        transcript,
        duration,
        startInterview,
        endInterview,
    } = useVapiInterview({
        onComplete,
        onError: (err) => setCameraError(err),
    });

    // Initialize Recorder
    const { startRecording, stopRecording, recordedBlob } = useInterviewRecorder({ stream });

    // Initialize Posture Tracking (samples every 10 seconds during interview)
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

    // Centralized media cleanup
    const stopMedia = useCallback(() => {
        const currentStream = streamRef.current;
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    // Initial Media Setup and Cleanup
    useEffect(() => {
        let mounted = true;

        const setupMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: true
                });

                if (mounted) {
                    streamRef.current = mediaStream;
                    setStream(mediaStream);
                    setCameraError(null);
                } else {
                    // If unmounted before promise resolved, clean up immediately
                    mediaStream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                if (mounted) {
                    setCameraError('Please enable camera and microphone access.');
                }
            }
        };

        setupMedia();

        // Cleanup on unmount
        return () => {
            mounted = false;
            stopMedia();
        };
    }, [stopMedia]);

    // Handle status completion cleanup
    useEffect(() => {
        if (status === 'completed') {
            stopMedia();
        }
    }, [status, stopMedia]);

    // Attach stream to video elements
    useEffect(() => {
        const currentStream = streamRef.current || stream;
        if (!currentStream) return;

        if (previewPhase && previewVideoRef.current) {
            previewVideoRef.current.srcObject = currentStream;
        } else if (!previewPhase && videoRef.current) {
            videoRef.current.srcObject = currentStream;
        }
    }, [stream, previewPhase]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const toggleMute = useCallback(() => {
        const s = streamRef.current;
        if (s) {
            s.getAudioTracks().forEach(t => t.enabled = isMuted); // logic inverted in previous toggle, fixing here:
            // wait, logic is: clicking button TOGGLES state. State `isMuted` represents CURRENT state? No, usually represents DESIRED state.
            // logic: `t.enabled = !isMuted` (if isMuted is TRUE, enabled should be FALSE).
            // Logic was `t.enabled = isMuted` vs `setIsMuted(!isMuted)`.
            // If `isMuted` is false (mic on), clicking sets `isMuted` to true. `t.enabled` should become false.
            // So `t.enabled = !(!isMuted)` -> `t.enabled = isMuted`? No.
            // Let's stick to standard behavior:
            // If we are about to mute, enabled = false.
            // New state will be !isMuted.
            // So enabled = !(!isMuted) = isMuted?
            // Wait. If `isMuted` is false. We want to MUTE. `setIsMuted(true)`. `enabled = false`.
            // If `isMuted` is true. We want to UNMUTE. `setIsMuted(false)`. `enabled = true`.
            s.getAudioTracks().forEach(t => t.enabled = isMuted); // Existing logic seems to toggle based on *current* state before update?
            // Actually let's trust the logic that was working:
            // `t.enabled = isMuted` means if currently Muted (true), enable it (true).
            // Then set `isMuted(!isMuted)` -> false.
            // Correct.
            s.getAudioTracks().forEach(t => t.enabled = isMuted);
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    const toggleVideo = useCallback(() => {
        const s = streamRef.current;
        if (s) {
            s.getVideoTracks().forEach(t => t.enabled = isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    }, [isVideoOff]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleResumeFile(file);
    }, []);

    const handleResumeFile = async (file: File) => {
        setResumeFileName(file.name);
        setResumeError(null);
        setTempResume('');

        try {
            if (isPDF(file)) {
                // Extract text from PDF
                setIsParsingResume(true);
                console.log('[Resume] Extracting text from PDF:', file.name);
                const extractedText = await extractTextFromPDF(file);
                setTempResume(extractedText);
                console.log('[Resume] Successfully extracted', extractedText.length, 'characters');
            } else if (isTextFile(file)) {
                // Read text file directly
                const text = await file.text();
                setTempResume(text);
            } else {
                // Unsupported file type - try to read as text anyway
                console.warn('[Resume] Unsupported file type, attempting text read:', file.type);
                const text = await file.text();
                if (text && text.length > 10) {
                    setTempResume(text);
                } else {
                    throw new Error('Could not extract text from this file format. Please use PDF or TXT.');
                }
            }
        } catch (error) {
            console.error('[Resume] Error processing file:', error);
            setResumeError(error instanceof Error ? error.message : 'Failed to process resume');
            setResumeFileName(null);
        } finally {
            setIsParsingResume(false);
        }
    };

    // Start recording when interview starts
    useEffect(() => {
        if (status === 'interviewing') {
            startRecording();
        }
    }, [status, startRecording]);

    // Handle call end and pass data to completion handler
    useEffect(() => {
        // Condition: Interview is marked completed AND we have the recording blob ready
        if (status === 'completed' && recordedBlob) {

            if (recordedBlob.size === 0) {
                console.error('[Session] ❌ Recorded blob is empty (0 bytes).');
                // We might want to handle this as an error, or retry?
                // For now, let's log it. Processing will fail with "Critical: No recording blob" if null, but 0 bytes passes check.
                // Processing should check size.
            } else {
                console.log('[Session] ✅ Completing with blob size:', recordedBlob.size);
            }

            const sessionData = {
                transcript,
                duration,
                recordingBlob: recordedBlob,
                postureData: postureData ? {
                    shoulderAlignment: postureData.shoulderAlignment,
                    headPosition: postureData.headPosition,
                    overallScore: postureData.overallScore,
                    timeInGoodPosture: postureData.timeInGoodPosture
                } : undefined
            };
            onComplete(sessionData);
        } else if (status === 'completed' && !recordedBlob) {
            // If completed but no blob yet, ensure we stopped recording to trigger blob generation
            console.log('[Session] Status completed, waiting for blob...');
            stopRecording();
        }
    }, [status, recordedBlob, transcript, duration, postureData, onComplete, stopRecording]);

    const handleStartInterview = async () => {
        if (!tempJD.trim() || !tempResume.trim()) return;
        setIsInjectingContext(true);

        // Slight artificial delay to show state transition
        await new Promise(resolve => setTimeout(resolve, 800));

        setPreviewPhase(false);
        await startInterview(tempJD.trim(), tempResume.trim());
        setIsInjectingContext(false);
    };

    const handleEndInterview = () => {
        stopMedia();
        stopRecording();
        endInterview();
    };

    const isReady = tempJD.trim().length > 0 && tempResume.trim().length > 0 && stream;

    // Warm-up handlers
    const handleStartWarmUp = () => {
        setShowWarmUp(true);
    };

    const handleWarmUpComplete = () => {
        setShowWarmUp(false);
        setCompletedWarmUp(true);
    };

    const handleWarmUpSkip = () => {
        setShowWarmUp(false);
    };

    // ===================
    // WARM-UP SCREEN
    // ===================
    if (showWarmUp) {
        return (
            <InteractiveWarmUp
                onComplete={handleWarmUpComplete}
                onSkip={handleWarmUpSkip}
            />
        );
    }

    // ===================
    // PRE-INTERVIEW LOBBY
    // ===================
    if (previewPhase) {
        return (
            <div className="min-h-screen bg-[#030305] text-white font-sans">
                <header className="fixed top-0 inset-x-0 z-50 h-20 border-b border-white/5 bg-[#030305]/80 backdrop-blur-xl flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { stopMedia(); onBack(); }} className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em]">Setup</h1>
                            <p className="text-lg font-semibold">Initial Configuration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium rounded-full uppercase tracking-wider">
                            System Check
                        </div>
                    </div>
                </header>

                <main className="pt-32 pb-12 px-8 max-w-[1600px] mx-auto">
                    <div className="grid lg:grid-cols-[1fr,400px] gap-8">
                        {/* Left Col: Preview & Checks */}
                        <div className="space-y-6">
                            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/10 overflow-hidden group">
                                {stream && !isVideoOff ? (
                                    <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#080a0f]">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                            <VideoOff className="w-8 h-8 text-gray-500" />
                                        </div>
                                    </div>
                                )}

                                {cameraError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                                        <p className="text-red-400 font-medium">{cameraError}</p>
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                                    <button onClick={toggleMute} className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <button onClick={toggleVideo} className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Warm-Up Section */}
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${completedWarmUp ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                                            <Dumbbell className={`w-5 h-5 ${completedWarmUp ? 'text-green-400' : 'text-orange-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium">Pre-Interview Warm-Up</h3>
                                            <p className="text-xs text-gray-500">
                                                {completedWarmUp
                                                    ? 'Completed - You\'re ready!'
                                                    : 'Posture, breathing & voice exercises'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleStartWarmUp}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${completedWarmUp
                                                ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                                            }`}
                                    >
                                        {completedWarmUp ? 'Redo' : 'Start Warm-Up'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Configuration */}
                        <div className="space-y-6">
                            <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Session Context</h2>
                                    <p className="text-sm text-gray-400">Configure parameters for your interview simulation.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Job Description</label>
                                        <textarea
                                            value={tempJD}
                                            onChange={(e) => setTempJD(e.target.value)}
                                            className="w-full h-32 bg-[#080a0f] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                                            placeholder="Paste target job description..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Resume Data</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            className={`border border-dashed rounded-xl p-6 transition-all cursor-pointer ${isDragging ? 'border-orange-500 bg-orange-500/5' : resumeFileName ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-white/20 bg-[#080a0f]'
                                                }`}
                                        >
                                            <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={(e) => e.target.files?.[0] && handleResumeFile(e.target.files[0])} className="hidden" />
                                            {isParsingResume ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                                    <span className="text-sm font-medium text-gray-400">Extracting text from PDF...</span>
                                                </div>
                                            ) : resumeError ? (
                                                <div className="text-center">
                                                    <FileText className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                                    <p className="text-sm text-red-400">{resumeError}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Click to try again</p>
                                                </div>
                                            ) : resumeFileName ? (
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-green-400" />
                                                    <div>
                                                        <span className="text-sm font-medium">{resumeFileName}</span>
                                                        <p className="text-xs text-gray-500">{tempResume.length} characters extracted</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-400">Upload Resume <span className="text-gray-600">(PDF, TXT)</span></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartInterview}
                                    disabled={!isReady || isInjectingContext}
                                    className={`w-full py-4 rounded-xl font-medium text-sm transition-all ${isReady
                                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                        }`}
                                >
                                    {isInjectingContext ? 'Initializing Session...' : !stream ? 'Waiting for Media...' : !isReady ? 'Complete Requirements' : 'Launch Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ===================
    // ACTIVE SESSION
    // ===================
    return (
        <div className="h-screen bg-black text-white flex overflow-hidden font-sans">

            <AnimatePresence>
                {showTranscript && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 380, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full border-r border-gray-800 bg-[#0f0f12] flex flex-col"
                    >
                        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800/50">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-semibold text-gray-200">Transcript</span>
                            </div>
                            <button onClick={() => setShowTranscript(false)} className="text-gray-500 hover:text-white">
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {transcript.map((msg, idx) => (
                                <div key={idx} className="flex flex-col gap-2 animate-fadeIn">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${msg.role === 'system' ? 'text-green-400' : msg.role === 'assistant' ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {msg.role === 'system' ? 'System' : msg.role === 'assistant' ? 'Kelv' : 'You'}
                                        </span>
                                        <span className="text-[10px] text-gray-600">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${msg.role === 'system' ? 'text-green-200 italic' : msg.role === 'assistant' ? 'text-gray-100' : 'text-gray-400'}`}>
                                        {msg.content}
                                    </p>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative bg-black">
                <header className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2">
                        {!showTranscript && (
                            <button onClick={() => setShowTranscript(true)} className="p-3 bg-white/5 backdrop-blur border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="pointer-events-auto">
                        <div className="px-4 py-2 bg-white/5 backdrop-blur border border-white/10 rounded-full flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${status === 'interviewing' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                            <span className="text-xs font-mono text-gray-300">{formatTime(duration)}</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-xs text-orange-500 font-semibold tracking-wider">LIVE SESSION</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center p-8 relative">
                    <div className="relative w-full max-w-5xl aspect-video flex flex-col items-center justify-center">
                        <AIInterviewer
                            isActive={true}
                            isSpeaking={isAISpeaking}
                            isListening={isUserSpeaking}
                            isProcessing={status === 'connecting'}
                            size="full"
                        />

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center space-y-1">
                            <h2 className="text-3xl font-bold text-orange-500 tracking-tight glow-text-orange">Kelv</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-[0.3em]">AI Interviewer</p>
                        </div>
                    </div>

                    <div className="absolute bottom-8 right-8 w-[400px] aspect-video bg-[#0f0f12] rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-30">
                        {isVideoOff ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 text-gray-500 flex items-center justify-center text-2xl font-medium">You</div>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-medium text-white/80 backdrop-blur-sm border border-white/5">
                            Candidate Feed
                        </div>
                        {poseReady && currentPosture && (
                            <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm border ${currentPosture.isGoodPosture
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                    : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                                }`}>
                                {currentPosture.isGoodPosture ? 'Good Posture' : 'Adjust Posture'}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="h-24 flex items-center justify-center gap-6 relative z-30">
                    <div className="flex items-center gap-2 p-2 bg-[#0f0f12] border border-white/10 rounded-2xl shadow-xl">
                        <button onClick={toggleMute} className={`p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleVideo} className={`p-4 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <button onClick={handleEndInterview} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-red-600/20">
                            End Session
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default VapiInterviewSession;

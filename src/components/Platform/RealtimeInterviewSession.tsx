import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, Phone, Mic, MicOff, Volume2, VolumeX, MessageSquare, Send, Brain, MessageCircle, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { InterviewSetup } from '../../types/interview';
import { useRealtimeInterview } from '../../hooks/useRealtimeInterview';
import RealtimeTranscript from './RealtimeTranscript';
import AIInterviewer from './AIInterviewer';

interface RealtimeInterviewSessionProps {
  setup: InterviewSetup;
  interviewType?: string;
  sessionId?: string;
  onComplete: (sessionData: any) => void;
  onProcessingStart?: () => void;
  onBack: () => void;
}

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-semibold text-right max-w-[60%]">
      {value || '—'}
    </span>
  </div>
);

function extractVoiceMetrics(sessionData: any) {
  if (!sessionData) return null;
  // Prefer summary if available
  const metricsObj = sessionData.voice_metrics_summary || (Array.isArray(sessionData.speechMetrics) && sessionData.speechMetrics[0]?.metrics) || sessionData.speechMetrics?.[0] || null;
  if (!metricsObj) return null;
  // Build metrics array for display (same as before)
  const voiceMetrics = [];
  if (metricsObj.speechRate !== undefined) {
    const clampedSpeechRate = Math.max(80, Math.min(180, metricsObj.speechRate));
    const speechRateScore = Math.min(10, Math.max(0,
      clampedSpeechRate >= 140 && clampedSpeechRate <= 170
        ? Math.round(8 + (clampedSpeechRate - 140) / 30 * 2)
        : Math.round((clampedSpeechRate / 150) * 8)
    ));
    voiceMetrics.push({
      name: 'Speech Rate',
      score: speechRateScore,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      detail: `${Math.round(clampedSpeechRate)} WPM`
    });
  }
  if (metricsObj.fluencyScore !== undefined) {
    const clampedFluencyScore = Math.max(0, Math.min(100, metricsObj.fluencyScore));
    const fluencyScore = Math.round((clampedFluencyScore / 100) * 10);
    voiceMetrics.push({
      name: 'Fluency',
      score: fluencyScore,
      icon: Volume2,
      color: 'from-cyan-500 to-blue-500',
      detail: `${clampedFluencyScore}% fluency`
    });
  }
  if (metricsObj.voiceConfidence !== undefined) {
    const clampedConfidence = Math.max(0, Math.min(100, metricsObj.voiceConfidence));
    const confidenceScore = Math.round((clampedConfidence / 100) * 10);
    voiceMetrics.push({
      name: 'Voice Confidence',
      score: confidenceScore,
      icon: Mic,
      color: 'from-blue-600 to-indigo-500',
      detail: `${clampedConfidence}% confidence`
    });
  }
  if (metricsObj.deliveryScore !== undefined) {
    const clampedDeliveryScore = Math.max(0, Math.min(100, metricsObj.deliveryScore));
    const deliveryScore = Math.round((clampedDeliveryScore / 100) * 10);
    voiceMetrics.push({
      name: 'Delivery',
      score: deliveryScore,
      icon: CheckCircle,
      color: 'from-indigo-500 to-blue-600',
      detail: `${clampedDeliveryScore}% delivery`
    });
  }
  if (metricsObj.clarityScore !== undefined) {
    const clampedClarityScore = Math.max(0, Math.min(100, metricsObj.clarityScore));
    const clarityScore = Math.round((clampedClarityScore / 100) * 10);
    voiceMetrics.push({
      name: 'Clarity',
      score: clarityScore,
      icon: MessageCircle,
      color: 'from-blue-400 to-cyan-400',
      detail: `${clampedClarityScore}% clarity`
    });
  }
  if (metricsObj.fillerWordCount !== undefined) {
    const clampedFillerCount = Math.max(0, Math.min(50, metricsObj.fillerWordCount));
    const fillerScore = Math.max(0, Math.min(10, 10 - Math.floor(clampedFillerCount / 2)));
    voiceMetrics.push({
      name: 'Filler Words',
      score: fillerScore,
      icon: AlertCircle,
      color: 'from-blue-300 to-cyan-300',
      detail: `${clampedFillerCount} filler words`
    });
  }
  return voiceMetrics;
}

const getMetricInsight = (metric: string, score: number) => {
  const insights = {
    'speech rate': {
      high: "Perfect speaking pace - you speak at an ideal rhythm for interviews.",
      medium: "Good speaking pace, try to maintain consistency throughout.",
      low: "Adjust your speaking pace - aim for 140-170 words per minute."
    },
    fluency: {
      high: "Outstanding fluency - you speak smoothly with excellent flow.",
      medium: "Good fluency, work on reducing minor hesitations.",
      low: "Focus on speaking more smoothly and reducing filler words."
    },
    'voice confidence': {
      high: "Excellent vocal confidence - you sound authoritative and engaging.",
      medium: "Good voice confidence, project more conviction in your tone.",
      low: "Work on speaking with more confidence and stronger vocal presence."
    },
    delivery: {
      high: "Outstanding delivery - your pacing and rhythm are perfect for interviews.",
      medium: "Good delivery, focus on maintaining consistent energy levels.",
      low: "Work on your vocal delivery and speaking rhythm."
    },
    'vocal clarity': {
      high: "Excellent vocal clarity - you articulate words clearly and precisely.",
      medium: "Good clarity, focus on enunciating key words more clearly.",
      low: "Practice speaking more clearly and improving your articulation."
    },
    'clarity': {
      high: "Excellent vocal clarity - you articulate words clearly and precisely.",
      medium: "Good clarity, focus on enunciating key words more clearly.",
      low: "Practice speaking more clearly and improving your articulation."
    },
    'filler words': {
      high: "Excellent - you avoid filler words and speak with precision.",
      medium: "Good control of filler words, continue reducing 'um' and 'uh'.",
      low: "Focus on reducing filler words like 'um', 'uh', and 'like'."
    }
  };
  const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
  return insights[metric.toLowerCase() as keyof typeof insights]?.[level] || "Keep practicing to improve this area.";
};

const RealtimeInterviewSession: React.FC<RealtimeInterviewSessionProps> = ({
  setup,
  interviewType,
  onComplete,
  onProcessingStart,
  onBack
}) => {

  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null); // Store final session data after completion

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const hasHumeKeys = Boolean(import.meta.env.VITE_HUME_API_KEY && import.meta.env.VITE_HUME_CONFIG_ID);

  // Determine if this is a focused interview and what type
  const isFocusedInterview = interviewType && !['standard', 'college'].includes(interviewType);
  const focusedType = isFocusedInterview ? interviewType : undefined;
  const actualInterviewType = isFocusedInterview ? 'focused' : interviewType;

  // Memoize the completion handler
  const handleComplete = useCallback((data: any) => {
    if (!data) {
      console.error('❌ RealtimeInterviewSession: Received null/undefined data');
      return;
    }
    setSessionData(data);
    onComplete(data);
  }, [onComplete]);

  const hookOptions = useMemo(() => {
    return {
      setup,
      mediaStream: stream,
      onComplete: handleComplete,
      onError: (error: string) => {
        console.error('Realtime interview error:', error);
        setCameraError(error);
      }
    };
  }, [setup, stream, handleComplete]);

  const {
    state,
    client,
    maxDuration,
    startInterview,
    endInterview,
    sendTextMessage
  } = useRealtimeInterview(hookOptions);

  const isVoiceMode = setup.interviewMode === 'voice';
  const hasStarted = state.status === 'interviewing' || state.status === 'paused';

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera setup - only initialize once
  useEffect(() => {
    let mounted = true;

    const setupCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: isVoiceMode
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        setStream(mediaStream);
        setCameraError(null);
      } catch (error) {
        console.error('Camera setup error:', error);
        if (mounted) {
          setCameraError('Camera access denied. Please enable camera permissions.');
        }
      }
    };

    setupCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVoiceMode]); // Only depend on isVoiceMode, not hasStarted

  // Handle video element assignment separately
  useEffect(() => {
    if (stream) {
      if (!hasStarted && previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      } else if (hasStarted && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [hasStarted, stream]);

  // Handle microphone toggle
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Handle audio output toggle
  const toggleAudio = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    if (newAudioEnabled) {
      client?.unmuteOutput();
    } else {
      client?.muteOutput();
    }
  };

  // Start interview
  const handleStartInterview = useCallback(async () => {
    await startInterview();
  }, [startInterview]);

  // End interview
  const handleEndInterview = useCallback(async () => {
    if (typeof onProcessingStart === 'function') {
      onProcessingStart();
    }

    // Stop camera and microphone immediately
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('[Interview] Stopped track:', track.kind, track.label);
      });
      setStream(null);
    }

    await endInterview();
  }, [endInterview, onProcessingStart, stream]);

  // Send text message
  const handleSendMessage = useCallback(() => {
    if (userMessage.trim()) {
      sendTextMessage(userMessage.trim());
      setUserMessage('');
    }
  }, [userMessage, sendTextMessage]);

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Error states
  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-gray-400 mb-6">{state.error}</p>
          <div className="space-y-3">
            <button
              onClick={handleStartInterview}
              className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
            >
              Retry Connection
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen start overlay
  if (!hasStarted) {
    const readableExperience =
      'experienceLevel' in setup && setup.experienceLevel
        ? setup.experienceLevel.split('(')[0].trim()
        : undefined;

    return (
      <div className="min-h-screen bg-[#03040a] text-white flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-300">
                {setup.jobType || 'Interview Room'}
              </span>
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.35em] text-gray-400">
            {isVoiceMode ? 'Voice mock' : 'Text mock'}
          </div>
        </header>

        <div className="flex-1 w-full px-6 py-8 flex flex-col xl:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col items-center gap-6 w-full">
            <div className="relative w-full max-w-4xl aspect-video rounded-[32px] overflow-hidden border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${cameraError ? 'opacity-0' : 'opacity-100'}`}
              />
              {!cameraError && (
                <div className="absolute bottom-4 right-4 px-4 py-2 rounded-full backdrop-blur bg-black/50 text-sm text-gray-200">
                  Preview • {setup.jobType || 'Candidate'}
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                  <MessageSquare className="w-8 h-8 text-orange-400" />
                  <p className="text-sm text-gray-300 text-center px-6">
                    {cameraError}
                  </p>
                  <p className="text-xs text-gray-500">
                    Check your browser permissions and reload.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center">
              <button
                onClick={toggleMute}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition ${isMuted
                  ? 'border-red-500/50 bg-red-500/10 text-red-200 shadow-lg shadow-red-500/25'
                  : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                  }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="text-sm">
                  {isMuted ? 'Unmute microphone' : 'Mute microphone'}
                </span>
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                Interview details
              </p>
              <div className="space-y-3">
                <DetailRow label="Format" value={isVoiceMode ? 'Voice (live audio)' : 'Text chat'} />
                <DetailRow label="Role" value={setup.jobType} />
                <DetailRow label="Industry" value={setup.industry} />
                <DetailRow label="Experience" value={readableExperience} />
                <DetailRow label="Duration" value={`${maxDuration} min`} />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-4">
                Before you join
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                  Check your mic levels and sit centered in frame like a real call.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                  Keep your notes nearby - Kelv may interrupt or ask for receipts.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                  Join when you're ready; the timer starts only after you hit "Join interview".
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              {hasHumeKeys ? (
                <button
                  onClick={handleStartInterview}
                  disabled={state.status === 'connecting'}
                  className="w-full px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
                >
                  {state.status === 'connecting' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Join interview'
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                  <p className="font-semibold mb-1">Configuration Error</p>
                  <p>Missing Hume AI API keys. Please check your environment variables.</p>
                </div>
              )}
              <button
                onClick={onBack}
                disabled={state.status === 'connecting'}
                className="w-full px-6 py-4 rounded-2xl border border-white/10 text-sm text-gray-300 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-dark-900 flex flex-col relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/3 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-dark-800/40 backdrop-blur-xl border-b border-dark-700/50 relative z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700/50 rounded-xl transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
          </button>
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></div>
          </div>
          <span className="text-white font-semibold">
            {isVoiceMode ? 'Voice' : 'Text'} Interview
          </span>
          {hasStarted && (
            <div className="px-3 py-1 bg-orange-500/10 rounded-full text-orange-400 text-xs font-medium border border-orange-500/20">
              Live
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {hasStarted && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/30 rounded-full border border-dark-600/50">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-white font-mono font-medium text-sm">
                  {formatTime(state.duration)} <span className="text-gray-500">/</span> {formatTime(maxDuration * 60)}
                </span>
              </div>
              {isVoiceMode && (
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-xl transition-all ${audioEnabled ? 'bg-dark-700/50 hover:bg-dark-700' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left side - Realtime transcript (replaces the question panel) */}
        <RealtimeTranscript
          transcript={state.transcript}
          isCollapsed={isTranscriptCollapsed}
          onToggleCollapse={() => setIsTranscriptCollapsed(!isTranscriptCollapsed)}
          isAISpeaking={state.isAISpeaking}
          isUserSpeaking={state.isUserSpeaking}
        />

        {/* Right side - Video area with current question overlay */}
        <div className="flex-1 relative bg-gray-900">
          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Media Access Error</h3>
                <p className="text-gray-400 mb-6">{cameraError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

          {/* Current question overlay - top right */}
          {state.currentQuestion && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="absolute top-6 right-6 max-w-md bg-dark-800/60 backdrop-blur-xl rounded-2xl p-5 border border-dark-700/50 shadow-2xl z-20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl blur-md opacity-50"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm mb-2">Current Question</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{state.currentQuestion}</p>
                    {state.questionCount > 0 && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                          Question {state.questionCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main video area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer
              isActive={hasStarted}
              isSpeaking={state.isAISpeaking}
              isListening={state.isUserSpeaking}
              isProcessing={state.status === 'connecting'}
              size="full"
              showStatus={true}
            />
          </div>

          {/* Voice mode recording indicator - bottom center */}
          {/* Removed obstructive floating mic indicator */}

          {/* Text mode input - bottom overlay */}
          {!isVoiceMode && hasStarted && (
            <div className="absolute bottom-6 left-6 right-6 bg-dark-800/60 backdrop-blur-xl rounded-2xl p-4 border border-dark-700/50 shadow-2xl z-20">
              <div className="flex gap-3">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response here..."
                  className="flex-1 px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-dark-800 rounded-2xl overflow-hidden shadow-2xl border border-dark-700/50 z-10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-dark-900/80 backdrop-blur-sm rounded-lg border border-dark-700/50">
              <span className="text-xs text-gray-400 font-medium">You</span>
            </div>
          </div>

          {/* Camera controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-dark-800/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-dark-700/50 shadow-2xl z-20">
            {isVoiceMode && (
              <button
                onClick={toggleMute}
                className={`group p-3 rounded-xl transition-all ${isMuted
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                  : 'bg-dark-700/50 hover:bg-dark-700'
                  }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-400 group-hover:text-white" />
                )}
              </button>
            )}

            <div className="w-px h-8 bg-dark-600"></div>

            <button
              onClick={handleEndInterview}
              className="group p-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 hover:scale-105 active:scale-95"
              title="End Interview"
            >
              <Phone className="w-5 h-5 text-white transform rotate-135 group-hover:rotate-180 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      {sessionData && sessionData.setup && sessionData.setup.interviewMode === 'voice' && !!extractVoiceMetrics(sessionData) && (
        <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 mt-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-400" />
            Advanced Voice Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {extractVoiceMetrics(sessionData)!.map((metric: any, index: number) => (
              <div
                key={metric.name}
                className="bg-dark-700/30 rounded-xl p-4 border border-dark-600/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                    <metric.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{metric.name}</span>
                      <span className="text-lg font-semibold text-white">{metric.score}/10</span>
                    </div>
                    <div className="text-xs text-gray-400">{metric.detail}</div>
                  </div>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                    style={{ width: `${metric.score * 10}%`, transition: 'width 1.5s' }}
                  />
                </div>
                <p className="text-xs text-gray-400">{getMetricInsight(metric.name.toLowerCase(), metric.score)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeInterviewSession;

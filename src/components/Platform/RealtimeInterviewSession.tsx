import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Clock, ArrowLeft, Phone, Mic, MicOff, Volume2, VolumeX, MessageSquare, Send, Brain, MessageCircle, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { InterviewSetup, CollegeInterviewSetup } from '../../types/interview';
import { useRealtimeInterview } from '../../hooks/useRealtimeInterview';
import RealtimeTranscript from './RealtimeTranscript';
import AIInterviewer from '../AIInterviewer';
import { processVideo } from '../../utils/computerVision';
import { analyzeGaze, analyzeHeadPose, analyzePosture } from '../../utils/computerVision';

interface RealtimeInterviewSessionProps {
  setup: InterviewSetup | CollegeInterviewSetup;
  interviewType?: string;
  sessionId?: string;
  onComplete: (sessionData: any) => void;
  onProcessingStart?: () => void;
  onBack: () => void;
}

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
      high: {
        explanation: "Your speech rate is ideal. You're speaking at a pace that is easy for listeners to follow and understand.",
        tip: "Maintain this pace. It shows confidence and allows you to articulate your thoughts clearly."
      },
      medium: {
        explanation: "Your speech rate is good, but could be slightly more consistent.",
        tip: "Practice speaking at a consistent pace. You can use a metronome or practice with a friend to get feedback."
      },
      low: {
        explanation: "Your speech rate is a bit slow. This can sometimes be perceived as a lack of confidence or knowledge.",
        tip: "Aim for a speech rate of 140-170 words per minute. Practice reading aloud to improve your pace."
      }
    },
    fluency: {
      high: {
        explanation: "Your fluency is excellent. You speak smoothly and naturally, with very few hesitations.",
        tip: "Your natural flow is a great asset. Continue to speak with this level of confidence."
      },
      medium: {
        explanation: "You have good fluency, but there are some minor hesitations in your speech.",
        tip: "Work on reducing hesitations by practicing your answers and speaking more deliberately."
      },
      low: {
        explanation: "Your speech has noticeable hesitations and choppiness, which affects your fluency.",
        tip: "Focus on speaking more smoothly. Try to connect your words and phrases to create a better flow."
      }
    },
    'voice confidence': {
      high: {
        explanation: "You sound very confident. Your voice is strong and engaging.",
        tip: "Your vocal confidence is a major strength. Keep it up!"
      },
      medium: {
        explanation: "You sound reasonably confident, but there's room for improvement.",
        tip: "Project your voice more and speak with more conviction. This will make you sound more authoritative."
      },
      low: {
        explanation: "Your voice sounds hesitant and lacks confidence.",
        tip: "Work on speaking with a stronger, more assertive voice. Practice power posing before you speak to boost your confidence."
      }
    },
    delivery: {
      high: {
        explanation: "Your delivery is outstanding. Your pacing, rhythm, and tone are all well-suited for an interview setting.",
        tip: "Your delivery is a key strength. Continue to use your voice to engage your listener."
      },
      medium: {
        explanation: "Your delivery is good, but could be more consistent.",
        tip: "Focus on maintaining a consistent energy level and tone throughout your responses."
      },
      low: {
        explanation: "Your delivery is a bit flat and could be more engaging.",
        tip: "Work on your vocal variety. Vary your pitch, pace, and volume to make your delivery more dynamic."
      }
    },
    'vocal clarity': {
      high: {
        explanation: "You have excellent vocal clarity. You articulate your words clearly and precisely.",
        tip: "Your clear articulation is a great asset. It ensures that your message is easily understood."
      },
      medium: {
        explanation: "You have good clarity, but some words could be more clearly enunciated.",
        tip: "Focus on enunciating key words and phrases to improve your overall clarity."
      },
      low: {
        explanation: "Your speech lacks clarity, which can make it difficult for listeners to understand you.",
        tip: "Practice tongue twisters and other articulation exercises to improve your vocal clarity."
      }
    },
    'clarity': {
        high: {
            explanation: "You have excellent vocal clarity. You articulate your words clearly and precisely.",
            tip: "Your clear articulation is a great asset. It ensures that your message is easily understood."
        },
        medium: {
            explanation: "You have good clarity, but some words could be more clearly enunciated.",
            tip: "Focus on enunciating key words and phrases to improve your overall clarity."
        },
        low: {
            explanation: "Your speech lacks clarity, which can make it difficult for listeners to understand you.",
            tip: "Practice tongue twisters and other articulation exercises to improve your vocal clarity."
        }
    },
    'filler words': {
      high: {
        explanation: "You did a great job of avoiding filler words. Your speech is precise and to the point.",
        tip: "This is a great habit to have. Continue to be mindful of using filler words."
      },
      medium: {
        explanation: "You used a few filler words, but it wasn't excessive.",
        tip: "Continue to work on reducing your use of filler words like 'um', 'uh', and 'like'."
      },
      low: {
        explanation: "You used a noticeable number of filler words. This can be distracting for the listener.",
        tip: "Focus on pausing instead of using filler words. It will make you sound more thoughtful and confident."
      }
    }
  };
  const level = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
  const metricData = insights[metric.toLowerCase() as keyof typeof insights];
  return metricData ? metricData[level] : { explanation: "Keep practicing to improve this area.", tip: "" };
};

const RealtimeInterviewSession: React.FC<RealtimeInterviewSessionProps> = ({
  setup,
  interviewType,
  onComplete,
  onProcessingStart,
  onBack
}) => {
  
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null); // Store final session data after completion
  const [gazeTimeline, setGazeTimeline] = useState<any[]>([]);
  const [headPoseTimeline, setHeadPoseTimeline] = useState<any[]>([]);
  const [postureTimeline, setPostureTimeline] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Determine if this is a focused interview and what type
  const isFocusedInterview = interviewType && !['standard', 'college'].includes(interviewType);
  const focusedType = isFocusedInterview ? interviewType : undefined;
  const actualInterviewType = isFocusedInterview ? 'focused' : interviewType;

  // Memoize the hook options to prevent recreation on each render
  const handleComplete = useCallback((data: any) => {
    setSessionData(data);
    onComplete(data);
  }, [onComplete]);

  const hookOptions = useMemo(() => ({
    setup,
    interviewType: actualInterviewType,
    focusedType,
    mediaStream: stream, // Pass the media stream to avoid duplicate audio streams
    onComplete: handleComplete,
    onError: (error: string) => {
      console.error('Realtime interview error:', error);
      setCameraError(error);
    }
  }), [setup, actualInterviewType, focusedType, stream, handleComplete]);

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

  useEffect(() => {
    let animationFrameId: number;
    const processVideoFrame = () => {
      if (videoRef.current) {
        const results = processVideo(videoRef.current, performance.now());
        if (results) {
          const { faceResults, poseResults } = results;
          const now = Date.now();
          if (faceResults) {
            const newGaze = analyzeGaze(faceResults.faceLandmarks);
            const newHeadPose = analyzeHeadPose(faceResults.faceLandmarks);
            setGazeTimeline(prev => [...prev, { timestamp: now, value: newGaze.isLookingAtCamera ? 1 : 0 }]);
            setHeadPoseTimeline(prev => [...prev, { timestamp: now, value: newHeadPose.isFacingForward ? 1 : 0 }]);
          }
          if (poseResults) {
            const newPosture = analyzePosture(poseResults.landmarks);
            setPostureTimeline(prev => [...prev, { timestamp: now, value: newPosture.isSlouching ? 0 : 1 }]);
          }
        }
      }
      animationFrameId = requestAnimationFrame(processVideoFrame);
    };

    if (hasStarted) {
      processVideoFrame();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasStarted]);

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
    const sessionData = await endInterview();
    onComplete({ ...sessionData, gaze: gazeTimeline, headPose: headPoseTimeline, posture: postureTimeline });
  }, [endInterview, onProcessingStart, onComplete, gazeTimeline, headPoseTimeline, postureTimeline]);

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
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 relative z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              Realtime {isVoiceMode ? 'Voice' : 'Text'} Interview
            </span>
          </div>
        </div>

        {/* Background content - blurred */}
        <div className="flex-1 flex relative">
          {/* Blurred background */}
          <div className="absolute inset-0 filter blur-sm opacity-50">
            {/* Left side - Empty transcript area */}
            <div className="w-[28rem] bg-gray-900/95 backdrop-blur-sm border-r border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-[#FF5722]" />
                  <h3 className="text-white font-medium">Live Transcript</h3>
                </div>
              </div>
              <div className="p-4 text-center text-gray-500 mt-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Transcript will appear here</p>
              </div>
            </div>

            {/* Right side - Video area */}
            <div className="flex-1 relative bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <AIInterviewer 
                  isActive={false}
                  isSpeaking={false}
                  isListening={false}
                  isProcessing={false}
                  size="xl"
                  showStatus={false}
                />
              </div>

              {/* User video preview */}
              <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Full-screen start overlay */}
          <div className="absolute inset-0 bg-dark-900/85 backdrop-blur-lg flex items-center justify-center z-10">
            <div className="bg-gray-900/95 rounded-2xl p-8 max-w-md w-full mx-6 border border-gray-800 shadow-2xl backdrop-blur-sm">
              {/* Icon and Title */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF5722] to-[#D84315] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Start</h2>
                <p className="text-gray-400 leading-relaxed">
                  Your personalized realtime interview with adaptive conversation flow is ready to begin.
                </p>
              </div>

              {/* Features list - more compact */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3 text-sm">What to expect:</h3>
                <ul className="space-y-1.5 text-sm text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[#FF5722] rounded-full"></div>
                    <span>Live conversation with AI interviewer</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[#FF5722] rounded-full"></div>
                    <span>Real-time transcript and question flow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[#FF5722] rounded-full"></div>
                    <span>{isVoiceMode ? 'Natural voice interaction' : 'Dynamic text conversation'}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[#FF5722] rounded-full"></div>
                    <span>Adaptive questions based on responses</span>
                  </li>
                </ul>
              </div>

              {/* Start button */}
              <button
                onClick={handleStartInterview}
                disabled={state.status === 'connecting' || !!cameraError}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#FF5722] to-[#D84315] text-white rounded-xl hover:from-[#D84315] hover:to-[#BF360C] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-semibold flex items-center justify-center space-x-3 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {state.status === 'connecting' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-6 h-6" />
                    <span>Start Interview</span>
                  </>
                )}
              </button>

              {/* Error message if any */}
              {cameraError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{cameraError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            Realtime {isVoiceMode ? 'Voice' : 'Text'} Interview
          </span>
          {hasStarted && (
            <div className="px-2 py-1 bg-[#FF5722]/20 rounded text-[#FF5722] text-xs font-medium border border-[#FF5722]/30">
              Live Session
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {hasStarted && (
            <>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#FF5722]" />
                <span className="text-white font-medium">
                  {formatTime(state.duration)} / {formatTime(maxDuration * 60)}
                </span>
              </div>
              {isVoiceMode && (
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'
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
            <div className="absolute top-6 right-6 max-w-md bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-[#FF5722]/20 z-20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm mb-2">Current Question</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{state.currentQuestion}</p>
                  {state.questionCount > 0 && (
                    <div className="mt-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30">
                        Question {state.questionCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main video area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer 
              isActive={hasStarted}
              isSpeaking={state.isAISpeaking}
              isListening={state.isUserSpeaking}
              isProcessing={state.status === 'connecting'}
              size="xl"
              showStatus={true}
            />
          </div>

          {/* Voice mode recording indicator - bottom center */}
          {/* Removed obstructive floating mic indicator */}

          {/* Text mode input - bottom overlay */}
          {!isVoiceMode && hasStarted && (
            <div className="absolute bottom-6 left-6 right-6 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-gray-800 z-20">
              <div className="flex space-x-3">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response here..."
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-[#FF5722] focus:outline-none transition-colors resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim()}
                  className="px-4 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Camera controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
            {isVoiceMode && (
              <button
                onClick={toggleMute}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
            
            <button
              onClick={handleEndInterview}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-white transform rotate-135" />
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
                <div className="text-xs text-gray-400">
                  <p className="font-semibold text-gray-300">{getMetricInsight(metric.name.toLowerCase(), metric.score).explanation}</p>
                  <p className="mt-1">{getMetricInsight(metric.name.toLowerCase(), metric.score).tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeInterviewSession;
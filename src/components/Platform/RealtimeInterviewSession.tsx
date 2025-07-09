import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Clock, ArrowLeft, Phone, Mic, MicOff, Volume2, VolumeX, MessageSquare, Send, Brain } from 'lucide-react';
import { InterviewSetup, CollegeInterviewSetup } from '../../types/interview';
import { useRealtimeInterview } from '../../hooks/useRealtimeInterview';
import RealtimeTranscript from './RealtimeTranscript';
import AIInterviewer from '../AIInterviewer';

interface RealtimeInterviewSessionProps {
  setup: InterviewSetup | CollegeInterviewSetup;
  interviewType?: string;
  sessionId?: string;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

const RealtimeInterviewSession: React.FC<RealtimeInterviewSessionProps> = ({
  setup,
  interviewType,
  onComplete,
  onBack
}) => {
  
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Determine if this is a focused interview and what type
  const isFocusedInterview = interviewType && !['standard', 'college'].includes(interviewType);
  const focusedType = isFocusedInterview ? interviewType : undefined;
  const actualInterviewType = isFocusedInterview ? 'focused' : interviewType;

  // Memoize the hook options to prevent recreation on each render
  const hookOptions = useMemo(() => ({
    setup,
    interviewType: actualInterviewType,
    focusedType,
    mediaStream: stream, // Pass the media stream to avoid duplicate audio streams
    onComplete,
    onError: (error: string) => {
      console.error('Realtime interview error:', error);
      setCameraError(error);
    }
  }), [setup, actualInterviewType, focusedType, stream, onComplete]);

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
    await endInterview();
  }, [endInterview]);

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
    </div>
  );
};

export default RealtimeInterviewSession;
// src/components/Platform/RealtimeInterviewSession.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Phone, 
  AlertCircle, 
  ArrowLeft,
  Timer,
  FileText,
  ChevronLeft,
  ChevronRight,
  Brain,
  Play
} from 'lucide-react';
import { useRealtimeInterview } from '../../hooks/useRealtimeInterview';
import RealtimeTranscript from '../RealtimeTranscript';
import { InterviewSetup } from '../../types/interview';
import AIInterviewer from '../AIInterviewer';

interface RealtimeInterviewSessionProps {
  interviewType?: string;
  focusedSubtype?: string; // Add focused subtype for specific focused interview types
  setup: InterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

const RealtimeInterviewSession: React.FC<RealtimeInterviewSessionProps> = ({ 
  interviewType, 
  focusedSubtype,
  setup, 
  onComplete, 
  onBack 
}) => {
  // Map interviewType to our hook's expected format
  const mappedInterviewType = (() => {
    if (interviewType === 'college') return 'college';
    if (interviewType === 'focused' || interviewType === 'technical') return 'focused';
    return 'standard';
  })();

  const { 
    isConnected, 
    isProcessing,
    isSpeaking,
    isListening,
    transcript, 
    error, 
    interviewState,
    timeRemaining,
    timeLimit,
    clearError,
    isConnecting,
    startInterview,
    endInterview
  } = useRealtimeInterview(mappedInterviewType, setup, focusedSubtype);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const isVoiceMode = setup.interviewMode === 'voice';

  // Get interview configuration based on type and subtype
  const getInterviewConfig = () => {
    // For focused interviews, use the subtype configuration
    if (mappedInterviewType === 'focused' && focusedSubtype) {
      const focusedConfigs = {
        technical: {
          title: 'Technical Questions',
          description: 'Real-time technical coding and system design practice',
          icon: '💻',
          duration: 5,
        },
        behavioral: {
          title: 'Behavioral Questions',
          description: 'Real-time behavioral interview practice with STAR method',
          icon: '🎯',
          duration: 4,
        },
        situational: {
          title: 'Situational Questions',
          description: 'Real-time workplace challenge scenarios',
          icon: '🧩',
          duration: 4,
        },
        resume: {
          title: 'Resume Questions',
          description: 'Real-time discussion of your background and experience',
          icon: '📄',
          duration: 3,
        },
        leadership: {
          title: 'Leadership Questions',
          description: 'Real-time leadership and management scenarios',
          icon: '👑',
          duration: 5,
        },
        caseStudy: {
          title: 'Case Study Interviews',
          description: 'Real-time business and technical case practice',
          icon: '📊',
          duration: 8,
        },
        systemDesign: {
          title: 'System Design Interviews',
          description: 'Real-time architecture and scalability discussions',
          icon: '🏗️',
          duration: 10,
        },
        leadershipAssessment: {
          title: 'Leadership Assessment',
          description: 'Real-time advanced management scenarios',
          icon: '⚡',
          duration: 8,
        },
        culturalFit: {
          title: 'Cultural Fit',
          description: 'Real-time values and team alignment assessment',
          icon: '🤝',
          duration: 4,
        },
        communication: {
          title: 'Communication',
          description: 'Real-time presentation and explanation practice',
          icon: '💬',
          duration: 4,
        },
        problemSolving: {
          title: 'Problem Solving',
          description: 'Real-time logic puzzles and structured thinking',
          icon: '🧠',
          duration: 4,
        },
        salaryNegotiation: {
          title: 'Salary Negotiation',
          description: 'Real-time compensation discussion practice',
          icon: '💰',
          duration: 3,
        },
        closing: {
          title: 'Closing/Wrap-up',
          description: 'Real-time interview conclusion and question practice',
          icon: '🎤',
          duration: 2,
        }
      };
      
      return focusedConfigs[focusedSubtype as keyof typeof focusedConfigs] || {
        title: 'Focused Interview',
        description: 'Real-time focused interview practice',
        icon: '🎯',
        duration: 5,
      };
    }

    // Standard interview type configurations
    const standardConfigs = {
      standard: {
        title: 'Interview Practice',
        description: 'Real-time comprehensive interview practice',
        icon: '🎯',
        duration: 30,
      },
      college: {
        title: 'College Interview',
        description: 'Real-time college admission interview practice',
        icon: '🎓',
        duration: 10,
      }
    };

    return standardConfigs[mappedInterviewType as keyof typeof standardConfigs] || standardConfigs.standard;
  };

  const config = getInterviewConfig();

  // Initialize camera when component mounts  
  useEffect(() => {
    initializeInterview();
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(mediaStream);
      setCameraError(null);
    } catch (error) {
      console.error('Error accessing media:', error);
      setCameraError(`Camera${isVoiceMode ? ' and microphone' : ''} access denied. Please enable permissions.`);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Toggle the current state
      });
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    const sessionData = {
      id: `realtime_${Date.now()}`,
      interviewType,
      setup,
      transcript,
      responses: [],
      overallScore: 0,
      duration: (timeLimit - timeRemaining) * 60, // Convert from minutes to seconds
    };
    onComplete(sessionData);
  };

  const retryCamera = () => {
    setCameraError(null);
    initializeInterview();
  };

  // Set video stream when available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-dark-900 text-white flex flex-col z-50">
      {/* Header */}
      <div className="border-b border-[#FF5722]/20 bg-gray-900/50">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  {config.title}
                </h1>
                <p className="text-gray-400 text-sm">{config.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Timer className="w-4 h-4" />
                <span className="font-medium">
                  {formatTime((timeLimit - timeRemaining) * 60)} / {formatTime(timeLimit * 60)}
                </span>
                {timeRemaining <= 1 && (
                  <span className="text-orange-400 animate-pulse text-xs">
                    (Time almost up!)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${
                  interviewState === 'in-progress' ? 'bg-orange-500' : 
                  interviewState === 'ended' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className={`font-medium ${
                  interviewState === 'in-progress' ? 'text-orange-400' : 
                  interviewState === 'ended' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {interviewState === 'not-started' ? 'Ready to Start' : 
                   interviewState === 'in-progress' ? 'In Progress' : 'Ended'}
                </span>
              </div>
              {error && (
                <div className="flex items-center gap-2">
                  <div className="text-red-400 text-sm font-medium">
                    Error: {error.message}
                  </div>
                  <button
                    onClick={clearError}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Interface */}
      <div className="flex-1 flex relative">
        {/* Animated Sidebar - Full Live Transcript */}
        <div className={`
          transition-all duration-300 ease-in-out border-r border-[#FF5722]/20 bg-gray-900/50 relative
          ${showSidebar ? 'w-[500px]' : 'w-0'}
        `}>
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute top-1/2 -right-6 transform -translate-y-1/2 z-50 w-12 h-12 bg-[#FF5722] hover:bg-[#D84315] rounded-r-lg flex items-center justify-center transition-colors shadow-lg"
          >
            {showSidebar ? (
              <ChevronLeft className="w-5 h-5 text-white" />
            ) : (
              <ChevronRight className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Sidebar Content - Full Live Transcript */}
          <div className={`h-full flex flex-col transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0'}`}>
            {showSidebar && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Live Transcript Header */}
                <div className="p-6 border-b border-[#FF5722]/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#FF5722]" />
                    <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                </div>
                
                {/* Transcript Content - Takes full height */}
                <div className="flex-1 min-h-0 p-6">
                  <RealtimeTranscript transcript={transcript} />
                  {transcript.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-base">Conversation will appear here...</p>
                      <p className="text-sm mt-2 opacity-75">Start speaking and your conversation will be transcribed live</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Video Area */}
        <div className="flex-1 relative bg-gray-900">
          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center max-w-md px-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Camera Error</h3>
                <p className="text-gray-400 mb-6">{cameraError}</p>
                <button
                  onClick={retryCamera}
                  className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Start Interview overlay */}
          {!cameraError && interviewState === 'not-started' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF5722] to-[#D84315] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Start?</h3>
                <p className="text-gray-400 mb-6">
                  Your {config.title.toLowerCase()} is ready to begin. Click the button below when you're prepared to start.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={startInterview}
                    disabled={!isConnected}
                    className="w-full px-8 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold flex items-center justify-center gap-3"
                  >
                    <Play className="w-6 h-6" />
                    Start Interview
                  </button>
                  <div className="bg-dark-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">Session Details:</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Duration: {timeLimit} minute{timeLimit !== 1 ? 's' : ''}</li>
                      <li>• Type: {config.title}</li>
                      <li>• Mode: Voice</li>
                      <li>• Real-time feedback and transcript</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interview ended overlay */}
          {interviewState === 'ended' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Interview Complete!</h3>
                <p className="text-gray-400 mb-6">
                  Great job! Your interview session has ended. Review the transcript to see how you did.
                </p>
                <button
                  onClick={handleEndCall}
                  className="px-8 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
                >
                  View Results
                </button>
              </div>
            </div>
          )}

          {/* AI Interviewer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer 
              isActive={isConnected}
              isSpeaking={isSpeaking}
              isListening={isListening}
              isProcessing={isProcessing}
              size="xl"
              showStatus={true}
            />
          </div>

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

          {/* Camera controls - only show during interview */}
          {interviewState === 'in-progress' && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
              {isVoiceMode && (
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
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
                onClick={endInterview}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              >
                <Phone className="w-5 h-5 text-white transform rotate-135" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeInterviewSession;

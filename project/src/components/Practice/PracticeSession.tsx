import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Clock,
  Brain,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PracticeSession: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive]);

  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: cameraEnabled, 
          audio: micEnabled 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled, micEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setIsSessionActive(true);
    setSessionTime(0);
  };

  const endSession = () => {
    setIsSessionActive(false);
    setIsRecording(false);
    setSessionTime(0);
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/practice"
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Practice Session</h1>
              <p className="text-gray-400 mt-1">AI-powered interview practice</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="font-mono text-lg">{formatTime(sessionTime)}</span>
            </div>
            
            {!isSessionActive ? (
              <button
                onClick={startSession}
                className="btn btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Session
              </button>
            ) : (
              <button
                onClick={endSession}
                className="btn bg-red-500 hover:bg-red-400 text-white flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                End Session
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 rounded-2xl p-6 border border-dark-700"
            >
              <div className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Recording indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">Recording</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      micEnabled ? 'bg-dark-600 hover:bg-dark-500' : 'bg-red-500 hover:bg-red-400'
                    }`}
                  >
                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      cameraEnabled ? 'bg-dark-600 hover:bg-dark-500' : 'bg-red-500 hover:bg-red-400'
                    }`}
                  >
                    {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  </button>
                  
                  {isSessionActive && (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-4 rounded-full transition-colors ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-400' 
                          : 'bg-orange-500 hover:bg-orange-400'
                      }`}
                    >
                      {isRecording ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Response area */}
              {isSessionActive && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Response</h3>
                  <textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder="Type your response here or use voice recording..."
                    className="w-full h-32 bg-dark-700 border border-dark-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Session Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold mb-4">Session Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold ${isSessionActive ? 'text-green-400' : 'text-gray-400'}`}>
                    {isSessionActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Recording</span>
                  <span className={`font-semibold ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
                    {isRecording ? 'On' : 'Off'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-semibold">{formatTime(sessionTime)}</span>
                </div>
              </div>
            </motion.div>

            {/* Practice Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold mb-4">Practice Question</h3>
              
              <div className="mb-4">
                <span className="text-sm text-gray-400 bg-dark-700 px-2 py-1 rounded">
                  Behavioral
                </span>
              </div>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                Tell me about a time when you had to work with a difficult team member. How did you handle the situation and what was the outcome?
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium text-white">Tips for this question:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                  <li>• Focus on your actions and problem-solving skills</li>
                  <li>• Highlight positive outcomes and lessons learned</li>
                </ul>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800 rounded-2xl p-6 border border-dark-700"
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
                  <Brain className="w-5 h-5 text-orange-500" />
                  <span>Get AI Feedback</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
                  <RotateCcw className="w-5 h-5 text-orange-500" />
                  <span>New Question</span>
                </button>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500/10 to-orange-400/5 rounded-2xl p-6 border border-orange-500/20"
            >
              <h3 className="text-lg font-semibold mb-4 text-orange-400">How to Practice</h3>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span>Start your session and read the question carefully</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span>Take a moment to structure your response</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span>Record your answer speaking naturally</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <span>Review AI feedback to improve</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap,
  ArrowLeft,
  Clock,
  Mic,
  Send,
  AlertCircle,
  Phone,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';
import AIInterviewer from '../AIInterviewer';

interface CollegeInterviewSetup {
  schoolType: string;
  program: string;
  major: string;
  interviewMode: 'voice' | 'text';
}

interface CollegeQuestion {
  id: string;
  text: string;
  type: 'personal' | 'academic' | 'extracurricular' | 'goals' | 'fit' | 'challenge' | 'leadership' | 'diversity';
  category: string;
  followUpPotential: boolean;
}

interface CollegeResponse {
  questionId: string;
  response: string;
  timestamp: Date;
  analysis?: {
    score: number;
    feedback: string;
    strengths: string[];
    areasForImprovement: string[];
    authenticity: number;
    passion: number;
    clarity: number;
    specificity: number;
  };
  audioBlob?: Blob | string;
}

interface CollegeInterviewProps {
  setup: CollegeInterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

const CollegeInterview: React.FC<CollegeInterviewProps> = ({ 
  setup, 
  onComplete, 
  onBack 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CollegeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<CollegeResponse[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  // Voice mode specific states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [canUserRespond, setCanUserRespond] = useState(false);
  const [isAISpeaking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const isVoiceMode = setup.interviewMode === 'voice';
  // Generate college-specific questions using AI
  const generateCollegeQuestions = async (): Promise<CollegeQuestion[]> => {
    try {
      const prompt = `Generate 3-4 college admission interview questions for a student applying to a ${setup.schoolType.replace('-', ' ')} institution for ${setup.major} in the ${setup.program} program. 

Each question should be:
- Authentic and commonly asked in college interviews
- Tailored to the specific major and institution type
- Designed to assess fit, motivation, and personal qualities
- Progressive in nature (starting broad, getting more specific)

Return the questions in this exact JSON format:
[
  {
    "id": "1",
    "text": "question text here",
    "type": "personal|academic|extracurricular|goals|fit|challenge|leadership|diversity",
    "category": "brief category name",
    "followUpPotential": true|false
  }
]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert college admissions interviewer. Generate authentic, thoughtful interview questions that help assess student fit and motivation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      const questionsText = data.choices[0].message.content;
      
      // Parse the JSON response
      let questions: CollegeQuestion[];
      try {
        questions = JSON.parse(questionsText);
      } catch (parseError) {
        console.error('Error parsing questions JSON:', parseError);
        // Fallback to default questions
        questions = getDefaultCollegeQuestions();
      }

      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to default questions
      return getDefaultCollegeQuestions();
    }
  };

  // Fallback default questions
  const getDefaultCollegeQuestions = (): CollegeQuestion[] => {
    return [
      {
        id: '1',
        text: "Tell me about yourself and what draws you to our institution.",
        type: 'personal',
        category: 'Introduction',
        followUpPotential: true
      },
      {
        id: '2', 
        text: `Why are you interested in studying ${setup.major}?`,
        type: 'academic',
        category: 'Academic Interest',
        followUpPotential: true
      },
      {
        id: '3',
        text: "Describe a challenge you've overcome and what you learned from it.",
        type: 'challenge',
        category: 'Personal Growth',
        followUpPotential: true
      },
      {
        id: '4',
        text: "Where do you see yourself in 10 years, and how will your education help you achieve those goals?",
        type: 'goals',
        category: 'Future Vision',
        followUpPotential: false
      }
    ];  };

  // AI-powered response analysis
  const analyzeCollegeResponse = async (question: CollegeQuestion, response: string): Promise<any> => {
    try {
      const prompt = `Analyze this college interview response and provide detailed feedback.

Question: "${question.text}"
Question Type: ${question.type}
Student Response: "${response}"

Provide analysis in this JSON format:
{
  "score": number (1-10),
  "feedback": "detailed constructive feedback",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "authenticity": number (1-10),
  "passion": number (1-10), 
  "clarity": number (1-10),
  "specificity": number (1-10)
}

Focus on college admission criteria: authenticity, passion for subject, personal growth, leadership potential, and fit with institution.`;

      const response_api = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert college admissions officer providing detailed, constructive feedback on interview responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response_api.ok) {
        throw new Error('Failed to analyze response');
      }

      const data = await response_api.json();
      const analysisText = data.choices[0].message.content;
      
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Error parsing analysis JSON:', parseError);
        return getDefaultAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      return getDefaultAnalysis();
    }
  };

  const getDefaultAnalysis = () => ({
    score: 7,
    feedback: "Thank you for sharing your thoughts. Consider adding more specific examples to strengthen your response.",
    strengths: ["Good communication", "Clear thinking"],
    areasForImprovement: ["Add specific examples", "Show more passion"],
    authenticity: 7,
    passion: 6,
    clarity: 7,
    specificity: 5
  });

  // Generate follow-up questions dynamically
  const generateFollowUpQuestion = async (previousQuestion: CollegeQuestion, response: string): Promise<CollegeQuestion | null> => {
    if (!previousQuestion.followUpPotential || response.length < 20) {
      return null;
    }

    try {
      const prompt = `Based on this college interview exchange, generate a natural follow-up question:

Previous Question: "${previousQuestion.text}"
Student Response: "${response}"

Generate a thoughtful follow-up question that digs deeper into their response. Return just the question text, nothing else.`;

      const response_api = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a college admissions interviewer asking natural follow-up questions to better understand the student.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response_api.ok) {
        return null;
      }

      const data = await response_api.json();
      const questionText = data.choices[0].message.content.trim();
      
      return {
        id: `followup_${Date.now()}`,
        text: questionText,
        type: previousQuestion.type,
        category: 'Follow-up',
        followUpPotential: false
      };
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      return null;
    }
  };

  // Determine if interview should naturally conclude
  const shouldConcludeInterview = (responses: CollegeResponse[], timeElapsed: number): boolean => {
    // End after 5 minutes (300 seconds)
    if (timeElapsed >= 300) {
      return true;
    }
    
    // Or if we have good coverage of different question types
    if (responses.length >= 4) {
      const questionTypes = new Set(responses.map(r => {
        const q = questions.find(question => question.id === r.questionId);
        return q?.type;
      }));
      
      // If we've covered at least 3 different types of questions
      if (questionTypes.size >= 3) {
        return true;
      }
    }

    return false;
  };

  const getCollegeFeedback = (type: string, _response: string) => {
    const feedbackMap: { [key: string]: string[] } = {
      personal: [
        "Great job sharing personal details that help us understand who you are.",
        "Your response shows good self-reflection and awareness.",
        "Consider adding more specific examples to illustrate your points."
      ],
      academic: [
        "You demonstrate genuine interest in your field of study.",
        "Strong connection between your academic interests and career goals.",
        "Consider elaborating on specific aspects of the program that excite you."
      ],
      challenge: [
        "Excellent example of resilience and growth mindset.",
        "You clearly articulated the lessons learned from your experience.",
        "Strong evidence of problem-solving and perseverance."
      ],
      extracurricular: [
        "Great examples of leadership and community involvement.",
        "You effectively connected your activities to personal growth.",
        "Consider highlighting the impact you made in these roles."
      ],
      goals: [
        "Clear vision for your future with realistic and ambitious goals.",
        "Good connection between your education and career aspirations.",
        "Shows thoughtful planning and long-term thinking."
      ]
    };

    const feedback = feedbackMap[type] || ["Thoughtful response that addresses the question well."];
    return feedback[Math.floor(Math.random() * feedback.length)];
  };

  const getCollegeStrengths = (type: string): string[] => {
    const strengthsMap: { [key: string]: string[] } = {
      personal: ["Authentic self-presentation", "Clear communication", "Self-awareness"],
      academic: ["Academic passion", "Research interest", "Goal alignment"],
      challenge: ["Resilience", "Growth mindset", "Problem-solving"],
      extracurricular: ["Leadership skills", "Community involvement", "Initiative"],
      goals: ["Clear vision", "Realistic planning", "Ambition"]
    };

    return strengthsMap[type] || ["Strong communication", "Thoughtful reflection"];
  };

  const getCollegeImprovements = (type: string): string[] => {
    const improvementsMap: { [key: string]: string[] } = {
      personal: ["Add more specific examples", "Show vulnerability", "Connect to values"],
      academic: ["Research faculty/programs", "Discuss specific interests", "Show intellectual curiosity"],
      challenge: ["Quantify impact", "Show continued growth", "Connect to future goals"],
      extracurricular: ["Highlight leadership roles", "Discuss impact made", "Show sustained commitment"],
      goals: ["Be more specific about timeline", "Connect to alumni outcomes", "Show research into career paths"]
    };

    return improvementsMap[type] || ["Add more detail", "Show enthusiasm"];
  };

  // Initialize interview session
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        const generatedQuestions = await generateCollegeQuestions();
        setQuestions(generatedQuestions);
        setSessionId(crypto.randomUUID());
        
        if (isVoiceMode) {
          await requestPermissions();
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize interview session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [isVoiceMode]);

  // Timer effect
  useEffect(() => {
    if (hasStartedInterview && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);
        
        // End interview after 20 minutes max
        if (elapsed >= 1200) {
          completeInterview(responses);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [hasStartedInterview, startTime, responses]);

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setPreviewStream(mediaStream);
      setPermissionGranted(true);
      setCameraError(null);
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera and microphone access denied. Please enable permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera or microphone found. Please connect a camera and microphone to continue.');
        } else {
          setCameraError('Unable to access camera and microphone. Please check your browser settings.');
        }
      }
    }
  };

  const startInterview = async () => {
    if (!permissionGranted && isVoiceMode) {
      await requestPermissions();
      return;
    }

    try {
      if (isVoiceMode && previewStream) {
        setStream(previewStream);
        if (videoRef.current) {
          videoRef.current.srcObject = previewStream;
        }
      }

      setHasStartedInterview(true);
      setStartTime(new Date());
      setCanUserRespond(true);
    } catch (error) {
      console.error('Error starting interview:', error);
      setCameraError('Failed to start interview. Please try again.');
    }
  };

  const startRecording = async () => {
    if (!stream) return;

    try {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        processVoiceResponse(audioBlob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
    }
  };

  const processVoiceResponse = async (audioBlob: Blob) => {
    try {
      // Simulate speech-to-text processing
      const mockText = "This is a simulated transcription of the student's response about their academic interests and goals.";
      setUserResponse(mockText);
      
      // Auto-submit after processing
      await submitResponse(mockText, audioBlob);
    } catch (error) {
      console.error('Error processing voice response:', error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const submitResponse = async (responseText?: string, audioBlob?: Blob) => {
    const finalResponse = responseText || userResponse;
    if (!finalResponse.trim()) return;

    setIsAnalyzing(true);
    setCanUserRespond(false);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response: CollegeResponse = {
        questionId: currentQuestion.id,
        response: finalResponse,
        timestamp: new Date(),
        audioBlob
      };

      // Analyze response
      const analysis = await analyzeCollegeResponse(currentQuestion, finalResponse);
      response.analysis = analysis;

      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);
      setUserResponse('');

      // Move to next question or complete interview
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCanUserRespond(true);
      } else {
        await completeInterview(updatedResponses);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const completeInterview = async (finalResponses: CollegeResponse[]) => {
    setIsInterviewComplete(true);
    
    // Calculate overall metrics
    const overallScore = Math.round(
      finalResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / finalResponses.length
    );

    const sessionData = {
      id: sessionId,
      type: 'college',
      setup,
      questions,
      responses: finalResponses,
      overallScore,
      startTime,
      endTime: new Date(),
      duration: timeElapsed,
      questionsAnswered: finalResponses.length,
      metrics: {
        authenticity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.authenticity || 0), 0) / finalResponses.length),
        passion: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.passion || 0), 0) / finalResponses.length),
        clarity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.clarity || 0), 0) / finalResponses.length),
        specificity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.specificity || 0), 0) / finalResponses.length)
      }
    };

    onComplete(sessionData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleEndInterview = () => {
    if (responses.length > 0) {
      completeInterview(responses);
    } else {
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-800 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Preparing your college interview...</p>
          <p className="text-gray-500 text-sm mt-2">
            Customizing questions for {setup.major} at {setup.schoolType.replace('-', ' ')} institutions
          </p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Setup Error</h2>
          <p className="text-red-400 mb-6">{loadingError}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">College Interview Complete!</h2>
          <p className="text-gray-400 mb-6">
            Analyzing your responses and preparing detailed feedback...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-16 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 z-30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">College Interview</span>
              {hasStartedInterview && (
                <div className="px-2 py-1 bg-purple-500/20 rounded text-purple-400 text-xs font-medium border border-purple-500/30">
                  Live Session
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {hasStartedInterview && (
                <>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-white font-medium">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-white font-medium">{responses.length + 1}/{questions.length}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex min-h-0">        {/* Left Panel - Question */}
        <div className="w-1/3 border-r border-purple-500/20 flex flex-col">
          <div className="flex-1 bg-gray-900/50 m-6 rounded-xl p-8 border border-purple-500/10 flex flex-col">
            <div className="flex items-start space-x-4 mb-8">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">
                  {hasStartedInterview ? "College Interview Question" : "Ready to Start"}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? currentQuestion?.text || "Loading question..."
                    : `Click 'Start Interview' to begin your college admission interview practice session.`}
                </p>
                {hasStartedInterview && currentQuestion && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {currentQuestion.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {currentQuestion.type}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            {hasStartedInterview && currentQuestion && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  {isVoiceMode ? (
                    <div className="text-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessingVoice || !canUserRespond || isAISpeaking}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : canUserRespond && !isAISpeaking
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <Mic className="w-8 h-8 text-white" />
                      </button>
                      <p className="text-gray-400 text-sm mt-4">
                        {isRecording
                          ? 'Recording... Click to stop'
                          : isProcessingVoice
                          ? 'Processing your response...'
                          : !canUserRespond
                          ? 'Please wait...'
                          : 'Click to start recording your response'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full h-40 p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500"
                        disabled={!canUserRespond || isAnalyzing}
                      />
                      <button
                        onClick={() => submitResponse()}
                        disabled={!userResponse.trim() || isAnalyzing || !canUserRespond}
                        className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Analyzing Response...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>Submit Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Start Interview Button */}
            {!hasStartedInterview && (
              <div className="mt-8 pt-6 border-t border-purple-500/20">
                <button
                  onClick={startInterview}
                  disabled={!!cameraError}
                  className="w-full px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-semibold flex items-center justify-center space-x-3"
                >
                  <GraduationCap className="w-6 h-6" />
                  <span>Start College Interview</span>
                </button>
              </div>
            )}
          </div>
        </div>        {/* Right Panel - Video */}
        <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 to-indigo-900/20 min-h-full">
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-dark-900/90">
              <div className="text-center max-w-md p-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">Camera Access Required</h3>
                <p className="text-red-400 mb-6">{cameraError}</p>
                <button
                  onClick={requestPermissions}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* AI Interviewer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer 
              isActive={hasStartedInterview}
              isSpeaking={isAISpeaking}
              isListening={isRecording}
              isProcessing={isProcessingVoice || isAnalyzing}
              size="xl"
              showStatus={true}
            />
          </div>

          {/* User Video */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            {!hasStartedInterview ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
            {isVoiceMode && (
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-full ${audioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
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

export default CollegeInterview;

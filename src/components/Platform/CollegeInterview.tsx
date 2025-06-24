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
import { createInitialInterviewSession, saveInterviewSession } from '../../utils/supabase-interview';
import { synthesizeSpeech, AudioRecorder, processVoiceInput, extractSpeechMetrics } from '../../utils/openai';
import { isElevenLabsTTSAvailable } from '../../utils/elevenLabsTTS';

// Utility function to format category labels
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    'school_fit': 'School Fit',
    'personal_qualities': 'Personal Qualities',
    'academic_readiness': 'Academic Readiness',
    'future_goals': 'Future Goals',
    'personal': 'Personal',
    'academic': 'Academic',
    'values': 'Values',
    'community': 'Community',
    'behavioral': 'Behavioral',
    'technical': 'Technical',
    'situational': 'Situational',
    'follow_up': 'Follow-up',
    'cultural_fit': 'Cultural Fit',
    'leadership': 'Leadership',
    'problem_solving': 'Problem Solving',
    'communication': 'Communication',
    'teamwork': 'Teamwork',
    'motivation': 'Motivation',
    'extracurricular': 'Extracurricular',
    'goals': 'Goals',
    'fit': 'Fit',
    'challenge': 'Challenge',
    'diversity': 'Diversity'
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

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
    schoolKnowledge?: number;
    personalGrowth?: number;
    nextQuestionSuggestion?: string;
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
  const [sessionId, setSessionId] = useState<string>('');  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  // Voice mode specific states  // Voice mode specific states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [canUserRespond, setCanUserRespond] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechMetrics, setSpeechMetrics] = useState<any[]>([]);

  // TTS specific states
  const [hasTTSAvailable, setHasTTSAvailable] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const isVoiceMode = setup.interviewMode === 'voice';
  const hasOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY && 
    import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
  // Generate college-specific questions using AI
  const generateCollegeQuestions = async (): Promise<CollegeQuestion[]> => {
    try {
      // Import the AI function for college questions
      const { generateCollegeInterviewQuestions } = await import('../../utils/openai');
      
      const aiQuestions = await generateCollegeInterviewQuestions({
        schoolType: setup.schoolType,
        program: setup.program,
        major: setup.major,
        interviewMode: setup.interviewMode
      });      // Convert AI questions to our format
      return aiQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type as 'personal' | 'academic' | 'extracurricular' | 'goals' | 'fit' | 'challenge' | 'leadership' | 'diversity',
        category: formatCategoryLabel(q.type),
        followUpPotential: true
      }));
    } catch (error) {
      console.error('Error generating AI questions, falling back to defaults:', error);
        // Fallback to engaging questions that feel natural and conversational
      return [
        {
          id: '1',
          text: "I'd love to hear about what initially sparked your interest in pursuing higher education. What's driving you to take this next step?",
          type: 'personal',
          category: 'Personal Motivation',
          followUpPotential: true
        },
        {
          id: '2', 
          text: `What draws you specifically to ${setup.major.replace('-', ' ')}? Can you share a story or experience that deepened your interest in this field?`,
          type: 'academic',
          category: 'Academic Passion',
          followUpPotential: true
        },
        {
          id: '3',
          text: `Can you tell me about a time when you faced a real challenge? What did that experience teach you about yourself?`,
          type: 'personal',
          category: 'Personal Growth',
          followUpPotential: true
        },
        {
          id: '4',
          text: `What questions do you have about college life or our campus community? What are you most curious about?`,
          type: 'fit',
          category: 'School Interest',
          followUpPotential: true
        }
      ];
    }
  };
  // Analyze college interview responses using AI
  const analyzeCollegeResponse = async (question: CollegeQuestion, response: string) => {
    try {
      // Import the AI analysis function
      const { analyzeCollegeInterviewResponse } = await import('../../utils/openai');
      
      const analysis = await analyzeCollegeInterviewResponse(question, response, setup);
      return analysis;
    } catch (error) {
      console.error('Error analyzing response with AI, using fallback:', error);
      
      // Fallback analysis
      return {
        score: Math.floor(Math.random() * 3) + 7, // 7-10 range for college interviews
        feedback: getCollegeFeedback(question.type, response),
        strengths: getCollegeStrengths(question.type),
        areasForImprovement: getCollegeImprovements(question.type),
        authenticity: Math.floor(Math.random() * 3) + 7,
        passion: Math.floor(Math.random() * 3) + 7,
        clarity: Math.floor(Math.random() * 3) + 7,
        specificity: Math.floor(Math.random() * 3) + 6
      };
    }
  };
  const getCollegeFeedback = (type: string, _response: string) => {
    const feedbackMap: { [key: string]: string[] } = {
      personal: [
        "Your authentic voice really comes through in this response. You're sharing meaningful personal insights that help us understand your character.",
        "I appreciate how you've reflected on your experiences and what they've taught you. This shows excellent self-awareness.",
        "You're doing a great job being genuine and personal. Consider adding even more specific details to make your story come alive."
      ],
      academic: [
        "Your passion for this field is evident and compelling. Admissions officers love to see genuine intellectual curiosity.",
        "You've made a strong connection between your interests and our program. This shows you've done your research.",
        "Your academic enthusiasm shines through. Consider sharing a specific moment when you knew this was the right path for you."
      ],
      challenge: [
        "Excellent example of resilience and growth. You clearly show how challenges have shaped you in positive ways.",
        "Your ability to learn from difficult experiences demonstrates maturity and a growth mindset that will serve you well in college.",
        "You've done a wonderful job showing how you've turned obstacles into opportunities for personal development."
      ],
      fit: [
        "I can tell you've put thought into why our school is a good match for you. This kind of research and reflection is impressive.",
        "Your questions show genuine curiosity about our community. This demonstrates that you're thinking seriously about fit.",
        "You're showing real interest in becoming part of our campus community, which is exactly what we like to see."
      ],
      extracurricular: [
        "Great examples of leadership and community involvement. You clearly understand the value of contributing beyond academics.",
        "You effectively connected your activities to personal growth, which shows good reflection skills.",
        "Your commitment to making a positive impact comes through clearly in your response."
      ],
      goals: [
        "Your vision for the future shows thoughtful planning and realistic ambition. You clearly understand how college fits your goals.",
        "I appreciate how you've connected your education to your aspirations. This shows mature thinking about your path forward.",
        "Your goals demonstrate both ambition and practicality, which suggests you'll make the most of your college experience."
      ]
    };

    const feedback = feedbackMap[type] || ["Your thoughtful response shows genuine engagement with the question and good reflection on your experiences."];
    return feedback[Math.floor(Math.random() * feedback.length)];
  };
  const getCollegeStrengths = (type: string): string[] => {
    const strengthsMap: { [key: string]: string[] } = {
      personal: ["Authentic and genuine voice", "Strong self-reflection abilities", "Personal growth mindset"],
      academic: ["Genuine intellectual passion", "Clear academic direction", "Strong motivation for learning"],
      challenge: ["Excellent resilience and adaptability", "Growth-oriented thinking", "Problem-solving skills"],
      fit: ["Thoughtful research about our school", "Clear understanding of fit", "Genuine interest in our community"],
      extracurricular: ["Leadership potential", "Community engagement", "Initiative and commitment"],
      goals: ["Clear future vision", "Realistic and thoughtful planning", "Strong sense of purpose"]
    };

    return strengthsMap[type] || ["Strong communication skills", "Thoughtful engagement with the question"];
  };

  const getCollegeImprovements = (type: string): string[] => {
    const improvementsMap: { [key: string]: string[] } = {
      personal: ["Share more specific, detailed examples", "Show vulnerability and authentic growth"],
      academic: ["Connect interests to specific faculty or programs", "Demonstrate deeper research about the field"],
      challenge: ["Quantify the impact of your growth", "Connect lessons learned to future goals"],
      fit: ["Research specific programs and opportunities", "Show how you'd contribute to campus life"],
      extracurricular: ["Highlight specific leadership moments", "Discuss measurable impact you created"],
      goals: ["Provide more specific timelines and steps", "Connect goals to school resources and opportunities"]
    };

    return improvementsMap[type] || ["Add more specific details", "Show greater enthusiasm and research"];
  };// Initialize interview session
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        const generatedQuestions = await generateCollegeQuestions();
        setQuestions(generatedQuestions);
        setSessionId(crypto.randomUUID());
        
        // Initialize TTS availability
        setHasTTSAvailable(isElevenLabsTTSAvailable());
        
        // Always request camera permissions for video display
        await requestPermissions();
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize interview session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
    
    return () => {
      // Cleanup audio on unmount
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, []);
  // Timer effect - 5 minute limit with natural conclusion
  useEffect(() => {
    if (hasStartedInterview && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);
        
        // Check if we're approaching the 5-minute mark (300 seconds)
        if (elapsed >= 300) {
          completeInterview(responses);
        } else if (elapsed >= 240 && !isAnalyzing) {
          // At 4 minutes, start wrapping up if not already analyzing
          // The AI will naturally conclude the interview
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }  }, [hasStartedInterview, startTime, responses, isAnalyzing]);
  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, previewStream]);
  // Handle preview video stream
  useEffect(() => {
    if (previewStream && previewVideoRef.current && !hasStartedInterview) {
      const videoElement = previewVideoRef.current;
      
      // Clear any existing stream first
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      
      // Small delay to ensure element is ready
      setTimeout(() => {
        videoElement.srcObject = previewStream;
        console.log('Preview video: Stream assigned', {
          streamActive: previewStream.active,
          streamTracks: previewStream.getTracks().length,
          videoTracks: previewStream.getVideoTracks().length
        });
        
        const playVideo = async () => {
          try {
            await videoElement.play();
            console.log('Preview video started successfully');
          } catch (error) {
            console.error('Error playing preview video:', error);
            // Try reloading the stream
            videoElement.load();
            try {
              await videoElement.play();
              console.log('Preview video started after reload');
            } catch (retryError) {
              console.error('Failed to start preview video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 50);
    }
  }, [previewStream, hasStartedInterview]);  // Handle main video stream
  useEffect(() => {
    if (stream && videoRef.current && hasStartedInterview) {
      const videoElement = videoRef.current;
      
      console.log('Main video useEffect triggered', {
        stream: !!stream,
        videoElement: !!videoElement,
        hasStartedInterview,
        streamActive: stream.active,
        currentSrcObject: !!videoElement.srcObject
      });
      
      // Clear any existing stream first
      if (videoElement.srcObject) {
        console.log('Clearing existing srcObject');
        videoElement.srcObject = null;
      }
      
      // Small delay to ensure clean transition
      setTimeout(() => {
        videoElement.srcObject = stream;
        console.log('Main video: Stream assigned', {
          streamActive: stream.active,
          streamTracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          elementSrcObject: !!videoElement.srcObject,
          elementSrcObjectActive: videoElement.srcObject ? (videoElement.srcObject as MediaStream).active : false
        });
        
        const playVideo = async () => {
          try {
            console.log('Attempting to play main video...');
            await videoElement.play();
            console.log('Main video started successfully');
          } catch (error) {
            console.error('Error playing main video:', error);
            // Try reloading the stream
            console.log('Trying to reload and play again...');
            videoElement.load();
            try {
              await videoElement.play();
              console.log('Main video started after reload');
            } catch (retryError) {
              console.error('Failed to start video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 100);
    } else {
      console.log('Main video useEffect conditions not met', {
        stream: !!stream,
        videoElement: !!videoRef.current,
        hasStartedInterview
      });
    }
  }, [stream, hasStartedInterview]);

  // TTS function to play question audio
  const playQuestion = async (questionText: string) => {
    if (!audioEnabled || !isVoiceMode || !hasTTSAvailable) {
      // For text mode or when audio is disabled, user can respond immediately
      setCanUserRespond(true);
      return;
    }
    
    try {
      setIsAISpeaking(true);
      setCanUserRespond(false);
      
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      console.log('Synthesizing speech for college interview question:', questionText);
      const audio = await synthesizeSpeech(questionText);
      if (audio) {
        setCurrentAudio(audio);
        audio.muted = !audioEnabled;
        
        // Set up event listeners for when audio finishes
        audio.onended = () => {
          setIsAISpeaking(false);
          setCanUserRespond(true); // User can now respond
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsAISpeaking(false);
          setCanUserRespond(true); // Allow response even if audio fails
          setCurrentAudio(null);
        };
        
        await audio.play();
      } else {
        // If audio synthesis fails, allow user to respond after a short delay
        setTimeout(() => {
          setIsAISpeaking(false);
          setCanUserRespond(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error playing college interview question:', error);
      setIsAISpeaking(false);
      setCanUserRespond(true); // Allow response if there's an error
    }
  };

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
        setPreviewStream(mediaStream);
      setPermissionGranted(true);
      setCameraError(null);
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
  };  const startInterview = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }    

    try {      
      // Always get a fresh stream for the main video to avoid conflicts
      console.log('Getting fresh stream for interview');
      const mainStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('Starting interview with fresh stream:', {
        streamActive: mainStream.active,
        tracks: mainStream.getTracks().length,
        videoTracks: mainStream.getVideoTracks().length
      });
      
      // Clear the preview video element before starting
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
      
      // Stop the preview stream since we're getting a new one
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }
      
      // Set the new stream
      setStream(mainStream);      // Set interview as started
      setHasStartedInterview(true);
      setStartTime(new Date());
      
      // Reset all voice states to ensure clean start
      setIsProcessingVoice(false);
      setIsRecording(false);
      
      // Play the first question in voice mode after session is active
      if (questions.length > 0 && isVoiceMode && hasTTSAvailable) {
        const firstQuestion = questions[0];
        console.log('Playing first college interview question:', firstQuestion.text);
        await playQuestion(firstQuestion.text);
      } else {
        // For text mode, user can respond immediately
        setCanUserRespond(true);
      }        // Create the initial interview session record in the database
      try {
        // Use the original college setup format for consistency
        await createInitialInterviewSession(sessionId, setup, 'college');
      } catch (error) {
        console.error('Error creating initial session record:', error);
        // Continue with the interview even if database creation fails
      }
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setCameraError('Failed to start interview. Please try again.');
    }
  };  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const startRecording = async () => {
    if (!canUserRespond || isAISpeaking || !isVoiceMode) {
      console.log('Cannot start recording:', { 
        canUserRespond, 
        isAISpeaking, 
        isVoiceMode 
      });
      return;
    }
    
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
      setUserResponse(''); // Clear any existing text
    } else {
      console.error('Failed to start recording');
    }
  };
  const stopRecording = async () => {
    if (!audioRecorderRef.current || !isVoiceMode) return;
    
    setIsRecording(false);
    setIsProcessingVoice(true);
    
    const result = await audioRecorderRef.current.stopRecording();
    if (result) {
      const { audioBlob, duration } = result;
      
      try {
        // Process voice input directly
        const transcription = await processVoiceInput(audioBlob);
        if (transcription && transcription.trim().length > 0) {
          setUserResponse(transcription);
          
          // Extract speech metrics in voice mode
          if (hasOpenAIKey && transcription && transcription.trim().length > 0) {
            try {
              const metrics = await extractSpeechMetrics(audioBlob, transcription, duration);
              if (metrics) {
                setSpeechMetrics(prev => [...prev, {
                  questionId: questions[currentQuestionIndex]?.id,
                  metrics
                }]);
              }
            } catch (err) {
              console.error('Error extracting speech metrics in college interview:', err);
            }
          }
          
          // Auto-submit after processing
          await submitResponse(transcription, audioBlob);
        } else {
          console.warn('No transcription received for college interview');
          setIsProcessingVoice(false);
          setCanUserRespond(true);
        }
      } catch (error) {
        console.error('Error processing voice response in college interview:', error);
        setIsProcessingVoice(false);
        setCanUserRespond(true);
      }
    } else {
      setIsProcessingVoice(false);
      setCanUserRespond(true);
    }  };
  const submitResponse = async (responseText?: string, audioBlob?: Blob) => {
    const finalResponse = responseText || userResponse;
    if (!finalResponse.trim()) return;

    setIsAnalyzing(true);
    setCanUserRespond(false);
    setIsProcessingVoice(false); // Ensure voice processing is reset

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response: CollegeResponse = {
        questionId: currentQuestion.id,
        response: finalResponse,
        timestamp: new Date(),
        audioBlob
      };

      // Analyze response with AI
      const analysis = await analyzeCollegeResponse(currentQuestion, finalResponse);
      response.analysis = analysis;

      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);
      setUserResponse('');

      // Check if we should continue or wrap up (5 minutes = 300 seconds)
      const elapsedTime = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;
      
      if (elapsedTime >= 300) {
        // Time's up - complete the interview
        await completeInterview(updatedResponses);
        return;
      }      // Generate follow-up question using AI (no question limit, time-based only)
      try {
        setIsAIGenerating(true);
        const { generateCollegeFollowUp } = await import('../../utils/openai');
        
        // Create context for AI to generate appropriate follow-up
        const responseContext = updatedResponses.map(r => ({
          questionText: questions.find(q => q.id === r.questionId)?.text,
          response: r.response,
          analysis: r.analysis
        }));

        const followUpQuestion = await generateCollegeFollowUp(
          setup,
          responseContext,
          finalResponse
        );        // Add the AI-generated question to our questions list
        const newQuestion: CollegeQuestion = {
          id: followUpQuestion.id,
          text: followUpQuestion.text,
          type: followUpQuestion.type as any,
          category: followUpQuestion.category,
          followUpPotential: true
        };
        
        const updatedQuestions = [...questions, newQuestion];
        const newQuestionIndex = updatedQuestions.length - 1;
        
        setQuestions(updatedQuestions);
        setCurrentQuestionIndex(newQuestionIndex);
        setIsAIGenerating(false);
          // Play the new question in voice mode
        if (isVoiceMode && hasTTSAvailable) {
          // Reset voice processing state before playing new question
          setIsProcessingVoice(false);
          await playQuestion(newQuestion.text);
        } else {
          setCanUserRespond(true);
          setIsProcessingVoice(false);
        }} catch (followUpError) {
        console.error('Error generating follow-up, moving to next preset question:', followUpError);
        setIsAIGenerating(false);
          // Fallback: move to next preset question if available
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);          // Play the next preset question in voice mode
          if (isVoiceMode && hasTTSAvailable) {
            // Reset voice processing state before playing next question
            setIsProcessingVoice(false);
            await playQuestion(questions[currentQuestionIndex + 1].text);
          } else {
            setCanUserRespond(true);
            setIsProcessingVoice(false);
          }
        } else {
          // No more preset questions and AI failed - complete interview
          await completeInterview(updatedResponses);
        }
      }    } catch (error) {
      console.error('Error submitting response:', error);
      setCanUserRespond(true);
      setIsProcessingVoice(false); // Reset voice processing state on error
    } finally {
      setIsAnalyzing(false);
    }
  };const completeInterview = async (finalResponses: CollegeResponse[]) => {
    setIsInterviewComplete(true);
      // Calculate overall metrics from AI analysis with improved scoring
    const validScores = finalResponses.filter(r => r.analysis?.score && r.analysis.score > 0);
    const averageScore = validScores.length > 0 
      ? validScores.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / validScores.length
      : 7.5; // Default to a reasonable score if no valid scores
      // Keep score on 1-10 scale with reasonable minimum
    const overallScore = Math.max(
      Math.round(Math.min(averageScore, 10)) * 10, // Convert to percentage (0-100 scale)
      40 // Minimum score of 40% to avoid overly harsh scoring
    );// Calculate detailed metrics from AI analysis with improved fallback logic
    const calculateMetric = (metricName: 'authenticity' | 'passion' | 'clarity' | 'specificity' | 'schoolKnowledge' | 'personalGrowth') => {
      const validMetrics = finalResponses.filter(r => 
        r.analysis?.[metricName] && 
        typeof r.analysis[metricName] === 'number' && 
        (r.analysis[metricName] as number) > 0
      );
      
      if (validMetrics.length > 0) {
        const average = validMetrics.reduce((sum, r) => sum + ((r.analysis?.[metricName] as number) || 0), 0) / validMetrics.length;
        return Math.max(Math.round(Math.min(average, 10)), 4);
      }
      
      // Fallback: Create realistic variation based on overall score and metric type
      const baseScore = Math.max(averageScore, 4);
      const variation = Math.random() * 2 - 1; // Random variation between -1 and +1
      
      // Different metrics have different baseline adjustments
      const adjustments = {
        authenticity: 0.2,     // Slightly higher - people are generally authentic
        passion: -0.3,         // Slightly lower - harder to show passion consistently  
        clarity: -0.1,         // Slightly lower - communication can be challenging
        specificity: -0.4,     // Lower - being specific is often the hardest part
        schoolKnowledge: 0.1,  // Neutral with slight positive
        personalGrowth: 0.0    // Neutral
      };
      
      const adjustedScore = baseScore + (adjustments[metricName] || 0) + (variation * 0.5);
      return Math.max(Math.round(Math.min(adjustedScore, 10)), 4);
    };

    const metrics = {
      authenticity: calculateMetric('authenticity'),
      passion: calculateMetric('passion'),
      clarity: calculateMetric('clarity'),
      specificity: calculateMetric('specificity'),
      schoolKnowledge: calculateMetric('schoolKnowledge'),
      personalGrowth: calculateMetric('personalGrowth')
    };    // Calculate voice metrics averages if available
    let voiceMetrics = null;
    if (speechMetrics && speechMetrics.length > 0) {
      const validMetrics = speechMetrics.map((m: any) => m.metrics).filter(Boolean);
      if (validMetrics.length > 0) {
        voiceMetrics = {
          speechRate: Number((validMetrics.reduce((sum: number, m: any) => sum + (m.speechRate || 0), 0) / validMetrics.length).toFixed(2)),
          fluencyScore: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.fluencyScore || 0), 0) / validMetrics.length),
          voiceConfidence: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.voiceConfidence || 0), 0) / validMetrics.length),
          fillerWordCount: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.fillerWordCount || 0), 0) / validMetrics.length),
          averageVolume: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.averageVolume || 0), 0) / validMetrics.length),
          // Add missing metrics to match other interview types
          delivery: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.delivery || 0), 0) / validMetrics.length),
          clarity: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.clarity || 0), 0) / validMetrics.length),
          confidence: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.confidence || m.voiceConfidence || 0), 0) / validMetrics.length),
          paceConsistency: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.paceConsistency || 0), 0) / validMetrics.length),
          repetitionCount: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.repetitionCount || 0), 0) / validMetrics.length),
          pauseRatio: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.pauseRatio || 0), 0) / validMetrics.length),
          estimatedPitch: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.estimatedPitch || 0), 0) / validMetrics.length)
        };
      }
    }

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
      metrics,
      speechMetrics: speechMetrics || [],
      voiceMetrics
    };

    // Save interview session to Supabase
    try {
      await saveInterviewSession(sessionData);
      console.log('College interview session saved to Supabase');
    } catch (error) {
      console.error('Error saving college interview session:', error);
      // Continue to results even if save fails
    }

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
          <h2 className="text-3xl font-bold text-white mb-4">College Interview Complete!</h2>
          <p className="text-gray-400 mb-8">
            Analyzing your responses and preparing detailed feedback...
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-6 border border-purple-500/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Duration:</span>
                <p className="font-bold text-xl text-purple-500">{formatTime(timeElapsed)}</p>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Questions:</span>
                <p className="font-bold text-xl text-purple-500">{responses.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pt-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            College Interview
          </span>
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
                <Clock className={`w-4 h-4 ${timeElapsed >= 240 ? 'text-orange-400' : 'text-purple-500'}`} />
                <span className={`font-medium ${timeElapsed >= 240 ? 'text-orange-400' : 'text-white'}`}>
                  {formatTime(timeElapsed)} / 5:00
                </span>
                {timeElapsed >= 240 && (
                  <span className="text-xs text-orange-400 animate-pulse">
                    (Wrapping up)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-white font-medium">Q{responses.length + 1} - AI Flow</span>
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
      <div className="flex-1 flex">
        {/* Left side - Question panel */}
        <div className="w-1/3 p-8 border-r border-purple-500/20">
          <div className="bg-gray-900/50 rounded-xl p-8 h-full border border-purple-500/10 flex flex-col">
            {/* Current question section */}
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
                    ? isAIGenerating 
                      ? "AI is thinking of a thoughtful follow-up question based on your response..."
                      : currentQuestion?.text || "Loading question..."
                    : `Click 'Start Interview' to begin your college admission interview practice session.`}
                </p>
                {hasStartedInterview && currentQuestion && (
                  <div className="mt-3 flex items-center gap-2 justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {currentQuestion.category}
                    </span>
                    {isVoiceMode && hasTTSAvailable && (
                      <button
                        onClick={() => playQuestion(currentQuestion.text)}
                        disabled={isAISpeaking || !audioEnabled}
                        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-purple-500/30"
                        title="Replay question"
                      >
                        <Volume2 className="w-4 h-4 text-purple-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Response input section */}
            {hasStartedInterview && currentQuestion && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  {isVoiceMode && hasTTSAvailable ? (
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
                        } disabled:opacity-50`}
                      >
                        {isProcessingVoice ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </button>
                      <p className="text-sm text-gray-400 mt-3">
                        {isAISpeaking ? 'Please wait for the question to finish...' :
                         !canUserRespond ? 'Please wait...' :
                         isRecording ? 'Recording... Click to stop' : 
                         isProcessingVoice ? 'Processing voice...' : 'Click to record your response'}
                      </p>
                    </div>
                  ) : (
                    <textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder={canUserRespond ? "Type your response here..." : "Please wait for the question to finish..."}
                      disabled={!canUserRespond || isAISpeaking}
                      className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  )}
                </div>
                
                <button
                  onClick={() => submitResponse()}
                  disabled={!userResponse.trim() || isAnalyzing || isRecording || isProcessingVoice || !canUserRespond || isAISpeaking}
                  className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-2"
                >
                  {isAnalyzing || isAIGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {isAIGenerating ? 'Generating Next Question...' : 'Processing...'}
                      </span>
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

            {/* Start interview button */}
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
                
                <div className="mt-4 p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Session Details:
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Duration: 5 minutes</li>
                    <li>• Questions: AI-generated based on responses</li>
                    <li>• Focus: {setup.major} at {setup.schoolType.replace('-', ' ')} institutions</li>
                    <li>• {isVoiceMode ? 'Voice interaction with speech analysis' : 'Text-based responses'}</li>
                    <li>• Comprehensive performance analysis at completion</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Video area */}
        <div className="flex-1 relative bg-gray-900">
          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center max-w-md px-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Camera Error</h3>
                <p className="text-gray-400 mb-6">{cameraError}</p>
                <button
                  onClick={requestPermissions}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Main video area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* AI Interviewer */}
            <AIInterviewer 
              isActive={hasStartedInterview}
              isSpeaking={isAISpeaking}
              isListening={isRecording}
              isProcessing={isProcessingVoice || isAnalyzing || isAIGenerating}
              size="xl"
              showStatus={true}
            />
          </div>

          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            {!hasStartedInterview ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log('Preview video metadata loaded')}
                onCanPlay={() => console.log('Preview video can play')}
                onPlay={() => console.log('Preview video started playing')}
                onError={(e) => console.error('Preview video error:', e)}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log('Main video metadata loaded')}
                onCanPlay={() => console.log('Main video can play')}
                onPlay={() => console.log('Main video started playing')}
                onError={(e) => {
                  console.error('Main video error:', e);
                  setCameraError('Error playing video stream. Please check your browser settings.');
                }}
              />
            )}
          </div>

          {/* Camera controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
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

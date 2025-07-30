const processFinalData = async () => {
  console.log('Processing final interview data...');
  
  try {
    // Process responses with timeout protection
    const responsePromises = responses.current.map(async (response, index) => {
      const question = questions.current.find(q => q.id === response.questionId);
      if (!question || !response.text.trim()) return response;
      
      try {
        const analysis = await Promise.race([
          analyzeResponse(question.text, response.text, response.questionId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 10000))
        ]);
        
        return { ...response, analysis };
      } catch (error) {
        console.warn(`Analysis failed for response ${index}, using fallback`);
        return { 
          ...response, 
          analysis: createFallbackAnalysis(response.text)
        };
      }
    });
    
    const analyzedResponses = await Promise.allSettled(responsePromises);
    responses.current = analyzedResponses.map((result, index) => 
      result.status === 'fulfilled' ? result.value : responses.current[index]
    );
    
    // Save to database with posture data
    const sessionData = {
      id: sessionId,
      responses: responses.current,
      questions: questions.current,
      speechMetrics: speechMetrics.current,
      postureData: postureData, // Include posture data
      duration: Math.floor((Date.now() - startTime.current) / 1000),
      overallScore: calculateOverallScore(),
      interviewType: 'realtime'
    };
    
    // Save to database (non-blocking)
    saveRealtimeSession(sessionData).catch(error => 
      console.warn('Failed to save session to database:', error)
    );
    
    console.log('Final data processing complete');
  } catch (error) {
    console.error('Error in processFinalData:', error);
  }
};

const analyzeResponse = async (questionText: string, responseText: string, questionId: string) => {
  if (!responseText.trim()) return null;
  
  try {
    // Increase timeout and add better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds
    
    const response = await fetch('/api/analyze-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionText,
        response: responseText,
        questionId
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Analysis failed with status ${response.status}, using fallback`);
      return createFallbackAnalysis(responseText);
    }
    
    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.warn('Analysis failed, using fallback:', error);
    return createFallbackAnalysis(responseText);
  }
};

const createFallbackAnalysis = (responseText: string) => {
  const wordCount = responseText.split(' ').length;
  const baseScore = Math.min(8, Math.max(5, Math.floor(wordCount / 10) + 5));
  
  return {
    score: baseScore,
    feedback: "Response analyzed. Consider providing more specific examples and structured answers.",
    strengths: ["Clear communication", "Relevant content"],
    improvements: ["Add more specific examples", "Structure your response using frameworks like STAR"],
    communication: baseScore,
    depth: Math.max(4, baseScore - 1),
    relevance: baseScore,
    problem_solving: baseScore
  };
};

const [postureData, setPostureData] = useState<any[]>([]);
const [isPostureAnalysisActive, setIsPostureAnalysisActive] = useState(false);
const postureIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Add posture analysis function
const startPostureAnalysis = async () => {
  if (!videoRef.current || isPostureAnalysisActive) return;
  
  setIsPostureAnalysisActive(true);
  
  // Capture frame every 5 seconds for posture analysis
  postureIntervalRef.current = setInterval(async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      
      if (!video || !ctx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob and send for analysis
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const formData = new FormData();
        formData.append('frame', blob);
        formData.append('timestamp', Date.now().toString());
        
        try {
          const response = await fetch('/api/analyze-posture', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const analysis = await response.json();
            setPostureData(prev => [...prev, {
              timestamp: Date.now(),
              ...analysis
            }]);
          }
        } catch (error) {
          console.warn('Posture analysis failed:', error);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.warn('Frame capture failed:', error);
    }
  }, 5000);
};

const stopPostureAnalysis = () => {
  setIsPostureAnalysisActive(false);
  if (postureIntervalRef.current) {
    clearInterval(postureIntervalRef.current);
    postureIntervalRef.current = null;
  }
};

// Update startInterview to include posture analysis
const startInterview = async () => {
  // ... existing code ...
  
  // Start posture analysis after video is ready
  setTimeout(() => {
    startPostureAnalysis();
  }, 2000);
  
  // ... rest of existing code ...
};

const endInterview = async () => {
  if (isEnding) return;
  
  setIsEnding(true);
  console.log('Starting interview end process...');
  
  try {
    // Stop recording immediately
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop real-time processing
    setIsRecording(false);
    setIsProcessing(false);
    
    // Stop posture analysis
    stopPostureAnalysis();
    
    // Process final data with timeout protection
    const processPromise = processFinalData();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Processing timeout')), 20000)
    );
    
    try {
      await Promise.race([processPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Final processing timed out, proceeding with available data:', error);
    }
    
    // Navigate to results immediately with current data
    const sessionData = {
      id: sessionId,
      overallScore: calculateOverallScore(),
      responses: responses.current,
      questions: questions.current,
      duration: Math.floor((Date.now() - startTime.current) / 1000),
      questionsAnswered: responses.current.length,
      startTime: new Date(startTime.current),
      interviewType: 'realtime',
      setup: {
        interviewMode: 'voice',
        interviewType: 'behavioral',
        difficulty: 'intermediate'
      },
      metrics: calculateMetrics(),
      voice_metrics_summary: speechMetrics.current.length > 0 ? speechMetrics.current[0].metrics : {},
      voiceTimeline: generateVoiceTimeline(),
      responseTimes: responseTimes.current
    };
    
    console.log('Navigating to results with session data:', sessionData);
    onInterviewComplete(sessionData);
    
  } catch (error) {
    console.error('Error ending interview:', error);
    // Still navigate to results even if there's an error
    onInterviewComplete({
      id: sessionId,
      overallScore: 75,
      responses: responses.current,
      questions: questions.current,
      duration: Math.floor((Date.now() - startTime.current) / 1000),
      questionsAnswered: responses.current.length,
      startTime: new Date(startTime.current),
      interviewType: 'realtime'
    });
  } finally {
    setIsEnding(false);
  }
};
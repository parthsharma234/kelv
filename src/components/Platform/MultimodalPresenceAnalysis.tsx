import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Play,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MultimodalPresenceAnalysisProps {
  sessionData: any;
}

const MultimodalPresenceAnalysis: React.FC<MultimodalPresenceAnalysisProps> = ({ sessionData }) => {
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Extract real multimodal data from session
  const extractMultimodalData = () => {
    const responses = sessionData.responses || [];
    const voiceMetrics = sessionData.voice_metrics_summary || {};
    const speechMetrics = sessionData.speechMetrics?.[0]?.metrics || {};
    const cameraPresence = sessionData.sophisticatedAnalytics?.cameraPresence || {};
    const timeline = sessionData.sophisticatedAnalytics?.timeline || [];
    const recordingUrl = sessionData.sophisticatedAnalytics?.recordingUrl || sessionData.recordingUrl;
    
    return {
      responses,
      voiceMetrics: { ...voiceMetrics, ...speechMetrics },
      cameraPresence,
      timeline,
      recordingUrl
    };
  };

  const { responses, voiceMetrics, cameraPresence, timeline, recordingUrl } = extractMultimodalData();

  // All data generation functions should be defined before they are called.


  // Generate timeline data from actual session timeline
  const generateTimelineData = () => {
    if (timeline && timeline.length > 0) {
      return timeline.map((point: any, index: number) => {
        const voiceConf = Math.round((point.voiceConfidence || 0.65) * 100);
        const eyeContactVal = Math.round((point.eyeContact || 0.65) * 100);
        const postureVal = Math.round((point.posture || 0.70) * 100);
        const combined = Math.round((voiceConf + eyeContactVal + postureVal) / 3);
        
        return {
          time: point.timestamp || index * 30,
          timeLabel: `${Math.floor((point.timestamp || index * 30) / 60)}:${((point.timestamp || index * 30) % 60).toString().padStart(2, '0')}`,
          voiceConfidence: voiceConf,
          eyeContact: eyeContactVal,
          posture: postureVal,
          combined: combined,
          question: point.question || responses[index]?.question || `Segment ${index + 1}`,
          isKeyMoment: combined > 75
        };
      });
    }
    
    // Fallback: generate from responses if no timeline data
    const duration = sessionData.duration || 300;
    const segments = Math.min(responses.length || 5, 10);
    
    return Array.from({ length: segments }, (_, i) => {
      const time = (duration / segments) * i;
      const voiceConf = Math.round((voiceMetrics.confidence?.overallConfidence || 65));
      const eyeContactVal = Math.round((cameraPresence.eyeContact || 0.65) * 100);
      const postureVal = Math.round((cameraPresence.attentiveness || 0.70) * 100);
      const combined = Math.round((voiceConf + eyeContactVal + postureVal) / 3);
      
      return {
        time: Math.round(time),
        timeLabel: `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`,
        voiceConfidence: voiceConf,
        eyeContact: eyeContactVal,
        posture: postureVal,
        combined: combined,
        question: responses[i]?.question || `Segment ${i + 1}`,
        isKeyMoment: combined > 75
      };
    });
  };

  // Calculate Hero Presence Index using real data
  const calculatePresenceIndex = () => {
    // Use actual voice confidence from session data
    const voiceConfidence = voiceMetrics.confidence?.overallConfidence || 
                           voiceMetrics.overallConfidence || 
                           (voiceMetrics.speechRate ? Math.min(100, (voiceMetrics.speechRate / 150) * 100) : 65);
    
    // Use actual eye contact data
    const eyeContact = (cameraPresence.eyeContact || 0.65) * 100;
    
    // Use actual posture/attentiveness data
    const posture = (cameraPresence.attentiveness || 0.70) * 100;
    
    // Calculate delivery score from speech metrics
    const delivery = voiceMetrics.fluency || 
                    (voiceMetrics.fillerWords ? Math.max(50, 100 - (voiceMetrics.fillerWords * 5)) : 70);
    
    const presenceScore = Math.round((voiceConfidence * 0.3 + eyeContact * 0.25 + posture * 0.2 + delivery * 0.25));
    
    let label = 'Developing';
    if (presenceScore >= 85) label = 'Strong Presence';
    else if (presenceScore >= 70) label = 'Good Presence';
    else if (presenceScore < 55) label = 'Needs Work';
    
    return { score: Math.min(100, Math.max(0, presenceScore)), label };
  };

  // Get a descriptive reason for a highlight
  const getHighlightReason = (point: any) => {
    const { voiceConfidence, eyeContact, posture, combined } = point;
    if (combined > 85) {
      if (voiceConfidence > 85 && eyeContact > 85) return 'Exceptional delivery: powerful voice and engaging eye contact.';
    } else if (posture > 85) {
      return 'Confident presence: strong posture and steady delivery.';
    } else if (combined > 75) {
      if (voiceConfidence > 80 && eyeContact < 70) return 'Strong voice, but work on maintaining eye contact.';
    } else {
      return 'Good moment: solid voice and visual cues.';
    }
    return 'A notable moment in your performance.';
  };

  // Generate highlight reel from real data
  const generateHighlightReel = () => {
    const timelineData = generateTimelineData();
    const highlights = timelineData
      .filter((point: any) => point.isKeyMoment && point.combined > 70)
      .sort((a: any, b: any) => b.combined - a.combined)
      .slice(0, 4)
      .map((point: any, i: any) => ({
        id: i,
        timestamp: point.timeLabel,
        duration: '12s',
        reason: getHighlightReason(point),
        confidence: `${point.combined}%`,
        metrics: {
          voice: point.voiceConfidence,
          eye: point.eyeContact,
          posture: point.posture
        },
        start: point.time
      }));
    
    return highlights.length > 0 ? highlights : [{
      id: 0,
      timestamp: '0:30',
      duration: '12s',
      reason: 'Strong moment: balanced voice and visual presence',
      confidence: `${calculatePresenceIndex().score}%`,
      metrics: {
        voice: Math.round(voiceMetrics.confidence?.overallConfidence || 65),
        eye: Math.round((cameraPresence.eyeContact || 0.65) * 100),
        posture: Math.round((cameraPresence.attentiveness || 0.70) * 100)
      },
      start: 30
    }];
  };

  const highlightReel = generateHighlightReel();

  React.useEffect(() => {
    const currentHighlight = highlightReel.find((h: any) => h.id === selectedHighlightId);
    if (videoRef.current && currentHighlight && recordingUrl) {
      videoRef.current.src = recordingUrl;
      videoRef.current.currentTime = currentHighlight.start;
      videoRef.current.play();
    }
  }, [selectedHighlightId, recordingUrl, highlightReel]);

  // Generate radar chart data from real metrics with proper bounds
  const generateRadarData = () => {
    // Safely extract voice confidence with proper bounds
    const voiceConfidence = Math.min(100, Math.max(0, 
      voiceMetrics.confidence?.overallConfidence || 
      voiceMetrics.overallConfidence || 
      (voiceMetrics.speechRate ? (voiceMetrics.speechRate / 150) * 100 : 65)
    ));
    
    // Safely extract eye contact (convert from 0-1 to 0-100 scale)
    const eyeContact = Math.min(100, Math.max(0, (cameraPresence.eyeContact || 0.65) * 100));
    
    // Safely extract facial expression
    const facialExpression = Math.min(100, Math.max(0, (cameraPresence.smile || 0.60) * 100));
    
    // Safely extract vocal energy
    const vocalEnergy = Math.min(100, Math.max(0, voiceMetrics.energy || 65));
    
    // Safely extract posture
    const posture = Math.min(100, Math.max(0, (cameraPresence.attentiveness || 0.70) * 100));
    
    // Safely extract fluency
    const fluency = Math.min(100, Math.max(0, voiceMetrics.fluency || 70));
    
    return [
      {
        axis: 'Confidence',
        value: Math.round(voiceConfidence),
        fullMark: 100
      },
      {
        axis: 'Engagement',
        value: Math.round((eyeContact + vocalEnergy) / 2),
        fullMark: 100
      },
      {
        axis: 'Approachability',
        value: Math.round((facialExpression + (vocalEnergy * 0.8)) / 2),
        fullMark: 100
      },
      {
        axis: 'Composure',
        value: Math.round((fluency + posture) / 2),
        fullMark: 100
      }
    ];
  };

  // Generate personalized insights from real data
  const generateInsights = () => {
    const presenceIndex = calculatePresenceIndex();
    const insights = [];
    
    // Voice-visual alignment insight
    const voiceConf = voiceMetrics.confidence?.overallConfidence || 65;
    const eyeContactScore = (cameraPresence.eyeContact || 0.65) * 100;
    
    if (Math.abs(voiceConf - eyeContactScore) < 15) {
      insights.push('Your multimodal presence shows good consistency between voice and visual cues.');
    } else if (voiceConf > eyeContactScore + 15) {
      insights.push('Your vocal confidence is strong - work on maintaining consistent eye contact to match.');
    } else {
      insights.push('Great eye contact - building vocal confidence will enhance your overall presence.');
    }
    
    // Posture and delivery insight
    const postureScore = (cameraPresence.attentiveness || 0.70) * 100;
    if (postureScore > 75) {
      insights.push('Excellent posture and body language throughout the interview.');
    } else {
      insights.push('Consider practicing synchronization between gestures and speech emphasis.');
    }
    
    // Overall alignment insight
    if (presenceIndex.score > 75) {
      insights.push('Your vocal confidence generally aligns well with your body language.');
    } else {
      insights.push('Focus on building consistency between your voice and visual presence.');
    }
    
    if ((cameraPresence.eyeContact || 0.7) < 0.6 && voiceMetrics.voiceConfidence > 70) {
      insights.push('Eye contact dropped when answering technical questions, even though voice remained confident.');
    }
    
    if (voiceMetrics.fluencyScore > 80) {
      insights.push('Your speech fluency and facial expressions work together to create an engaging presence.');
    }
    
    if (presenceIndex.score > 80) {
      insights.push('You successfully synchronized your vocal energy with positive body language throughout the interview.');
    }
    
    return insights.length > 0 ? insights : [
      'Your multimodal presence shows consistency between voice and visual cues.',
      'Consider practicing synchronization between gestures and speech emphasis.',
      'Your vocal confidence generally aligns well with your body language.'
    ];
  };

  // Generate personalized next steps based on actual data
  const generateNextSteps = () => {
    const steps = [];
    const voiceConf = voiceMetrics.confidence?.overallConfidence || voiceMetrics.voiceConfidence || 65;
    const eyeContactScore = (cameraPresence.eyeContact || 0.65) * 100;
    const postureScore = (cameraPresence.attentiveness || 0.70) * 100;
    
    // Voice-based recommendations
    if (voiceConf < 70) {
      steps.push('Practice vocal exercises to build confidence and projection.');
    } else if (voiceConf < 80) {
      steps.push('Continue building vocal authority through regular speaking practice.');
    }
    
    // Eye contact recommendations
    if (eyeContactScore < 70) {
      steps.push('Work on maintaining eye contact, especially during complex explanations.');
    } else if (eyeContactScore < 80) {
      steps.push('Practice sustaining eye contact for longer periods to build connection.');
    }
    
    // Posture recommendations
    if (postureScore < 75) {
      steps.push('Focus on maintaining confident posture throughout the conversation.');
    }
    
    // Fluency recommendations
    if (voiceMetrics.fluencyScore < 75) {
      steps.push('Synchronize gestures with speech to reinforce key points.');
    }
    
    // General improvement if no specific issues found
    if (steps.length < 2) {
      steps.push('Record yourself answering common questions to improve self-awareness.');
    }
    
    return steps.length > 0 ? steps.slice(0, 3) : [
      'Continue practicing to maintain consistency between voice and body language.',
      'Focus on matching vocal emphasis with moments of direct gaze.'
    ];
  };

  const presenceIndex = calculatePresenceIndex();
  const radarData = generateRadarData();
  const timelineData = generateTimelineData();
  const highlights = generateHighlightReel();
  const insights = generateInsights();
  const nextSteps = generateNextSteps();
  const selectedHighlight = highlights.find((h: any) => h.id === selectedHighlightId) || highlights[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50 text-center">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Presence Index
          </h2>
          <div className="text-5xl font-bold text-white">{presenceIndex.score}%</div>
          <div className={`text-md font-semibold mt-1 ${presenceIndex.score >= 85 ? 'text-green-400' : presenceIndex.score >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
            {presenceIndex.label}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Presence Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="80%">
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Radar name="Presence" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Multimodal Insights
          </h3>
          <ul className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{insight}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-orange-400" />
            Next Steps
          </h3>
          <ul className="space-y-3">
            {nextSteps.map((step, stepIndex) => (
              <li key={stepIndex} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{stepIndex + 1}</div>
                <p className="text-gray-300 text-sm">{step}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Highlight Reel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <div className="aspect-video bg-dark-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-dark-600">
                {recordingUrl ? (
                  <video ref={videoRef} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/50" />
                    <p className="ml-4 text-white/70">No video available</p>
                  </div>
                )}
                {selectedHighlight && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white font-semibold">{selectedHighlight.reason}</p>
                    <p className="text-sm text-gray-300">Timestamp: {selectedHighlight.timestamp}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{selectedHighlight.metrics.voice}%</div>
                  <div className="text-sm text-gray-400">Voice</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{selectedHighlight.metrics.eye}%</div>
                  <div className="text-sm text-gray-400">Eye Contact</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{selectedHighlight.metrics.posture}%</div>
                  <div className="text-sm text-gray-400">Posture</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3 h-96 overflow-y-auto pr-2">
              {highlights.map((h: any) => (
                <div key={h.id} onClick={() => setSelectedHighlightId(h.id)} className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedHighlightId === h.id ? 'bg-dark-700 border-blue-500' : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'}`}>
                  <p className="font-semibold text-white text-sm">{h.reason}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">{h.timestamp}</span>
                    <span className="text-xs font-bold text-yellow-400">{h.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Performance Timeline
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timeLabel" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="combined" name="Overall Presence" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                <Area type="monotone" dataKey="voiceConfidence" name="Voice" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                <Area type="monotone" dataKey="eyeContact" name="Eye Contact" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MultimodalPresenceAnalysis;
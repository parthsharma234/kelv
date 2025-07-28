import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useInView, useTransform, useSpring } from 'framer-motion';
import { 
  MicrophoneIcon, 
  EyeIcon, 
  BoltIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import WaitlistForm from './WaitlistForm';
import RedPandaLogo from './RedPandaLogo';

// Visual Analysis Components
const VoiceAnalysisVisuals: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Waveform visualization */}
    <div className="absolute bottom-4 left-4 right-4 h-16">
      <div className="flex items-end justify-center space-x-1 h-full">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-blue-500 w-2 rounded-t"
            initial={{ height: 4 }}
            animate={{
              height: [4, Math.random() * 40 + 10, 4],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
    
    {/* Speech metrics */}
    <motion.div
      className="absolute top-4 left-4 bg-blue-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center space-x-2">
        <MicrophoneIcon className="w-4 h-4" />
        <span>145 WPM</span>
      </div>
    </motion.div>
    
    <motion.div
      className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <span>Clarity: 92%</span>
    </motion.div>
  </div>
);

const EyeTrackingVisuals: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Gaze tracking lines */}
    <svg className="absolute inset-0 w-full h-full">
      <motion.circle
        cx="50%"
        cy="45%"
        r="8"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
      <motion.path
        d="M 30% 45% Q 50% 35% 70% 45%"
        fill="none"
        stroke="#10b981"
        strokeWidth="1"
        strokeDasharray="4,4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </svg>
    
    {/* Eye contact indicator */}
    <motion.div
      className="absolute top-4 left-4 bg-green-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center space-x-2">
        <EyeIcon className="w-4 h-4" />
        <span>Eye Contact: 78%</span>
      </div>
    </motion.div>
    
    <motion.div
      className="absolute bottom-4 right-4 bg-green-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span>Focus: Excellent</span>
    </motion.div>
  </div>
);

const PostureAnalysisVisuals: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Body outline/skeleton */}
    <svg className="absolute inset-0 w-full h-full">
      {/* Shoulder line */}
      <motion.line
        x1="35%"
        y1="40%"
        x2="65%"
        y2="40%"
        stroke="#8b5cf6"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      {/* Spine */}
      <motion.line
        x1="50%"
        y1="40%"
        x2="50%"
        y2="70%"
        stroke="#8b5cf6"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      {/* Head circle */}
      <motion.circle
        cx="50%"
        cy="30%"
        r="15"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />
    </svg>
    
    {/* Posture metrics */}
    <motion.div
      className="absolute top-4 left-4 bg-purple-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center space-x-2">
        <BoltIcon className="w-4 h-4" />
        <span>Posture: 94%</span>
      </div>
    </motion.div>
    
    <motion.div
      className="absolute bottom-4 left-4 bg-purple-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span>Gestures: Natural</span>
    </motion.div>
  </div>
);

const AnalyticsVisuals: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Analytics bars */}
    <div className="absolute bottom-4 left-4 right-4 h-20">
      <div className="flex items-end justify-center space-x-2 h-full">
        {[87, 92, 78, 94, 85].map((value, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              className="bg-orange-500 w-6 rounded-t"
              initial={{ height: 0 }}
              animate={{ height: `${value}%` }}
              transition={{ duration: 1, delay: i * 0.2 }}
            />
            <span className="text-orange-500 text-xs mt-1">{value}%</span>
          </div>
        ))}
      </div>
    </div>
    
    {/* Overall score */}
    <motion.div
      className="absolute top-4 right-4 bg-orange-500/20 backdrop-blur-sm rounded-lg p-3 text-white"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-500">87%</div>
        <div className="text-xs">Overall Score</div>
      </div>
    </motion.div>
    
    {/* Progress indicator */}
    <motion.div
      className="absolute top-4 left-4 bg-orange-500/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center space-x-2">
        <ChatBubbleLeftRightIcon className="w-4 h-4" />
        <span>Analysis Complete</span>
      </div>
    </motion.div>
  </div>
);

// Enhanced Wormhole/AI Portal Component with subtle effect
const WormholePortal: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    >
      <div className="relative w-full h-full">
        {/* Reduced number of rings for subtlety */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-orange-500/20 rounded-full"
            style={{
              width: `${15 + i * 8}%`,
              height: `${15 + i * 8}%`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderWidth: `${Math.max(0.5, 2 - i * 0.1)}px`,
            }}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ 
              scale: [2, 0.3, 0],
              opacity: [0, 0.6, 0],
              rotate: [0, -90, -180]
            }}
            transition={{
              duration: 4,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeIn"
            }}
          />
        ))}
        
        {/* Subtle central glow */}
        <motion.div
          className="absolute w-24 h-24 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 100%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Fewer, more subtle particles */}
        {[...Array(15)].map((_, i) => {
          const angle = (i / 15) * Math.PI * 2;
          const startRadius = 200 + Math.random() * 100;
          const startX = Math.cos(angle) * startRadius;
          const startY = Math.sin(angle) * startRadius;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-0.5 h-0.5 bg-orange-400/60 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              initial={{
                x: startX,
                y: startY,
                scale: 1,
                opacity: 0.6
              }}
              animate={{
                x: [startX, startX * 0.6, 0],
                y: [startY, startY * 0.6, 0],
                scale: [1, 0.5, 0],
                opacity: [0.6, 0.8, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 1.5,
                delay: Math.random() * 1,
                repeat: Infinity,
                ease: "easeIn"
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

// AI Features Section
const AIFeaturesSection: React.FC = () => {
  const features = [
    {
      icon: MicrophoneIcon,
      title: "Voice Analysis",
      description: "Advanced speech pattern recognition detects filler words, pace, and confidence levels during practice sessions."
    },
    {
      icon: EyeIcon,
      title: "Eye Contact Tracking",
      description: "Monitor eye contact patterns and engagement levels to maintain natural, confident gaze with the interviewer."
    },
    {
      icon: BoltIcon,
      title: "Body Language Analysis",
      description: "AI-powered posture and gesture analysis to optimize your professional presence and non-verbal communication."
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Answer Quality Assessment",
      description: "Evaluate response structure, relevance, and completeness to help you craft compelling interview answers."
    },
    {
      icon: MicrophoneIcon,
      title: "Speech Clarity & Pace",
      description: "Analyze speaking speed, articulation, and vocal clarity to ensure your message is delivered effectively."
    },
    {
      icon: EyeIcon,
      title: "Confidence Scoring",
      description: "Comprehensive confidence metrics based on multiple behavioral indicators to track your improvement."
    },
    {
      icon: BoltIcon,
      title: "Interview Performance Analytics",
      description: "Detailed post-interview reports with actionable insights and personalized improvement recommendations."
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Industry-Specific Practice",
      description: "Tailored interview scenarios and questions for different industries, roles, and experience levels."
    }
  ];

  return (
    <section id="features" className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            AI-Powered <span className="text-orange-500">Interview Mastery</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our advanced AI analyzes every aspect of your performance to give you the edge you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: (index % 4) * 0.1 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
            >
              <div className="bg-orange-500/20 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg shadow-orange-500/30"
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See How It Works
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// Interactive Mock Interview Demo - Improved with vertical transitions
const MockInterviewDemo: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const features = [
    {
      id: 'voice',
      title: 'Voice Analysis',
      description: 'Real-time speech pattern recognition analyzes your tone, pace, and filler words',
      icon: MicrophoneIcon,
      color: 'from-blue-500 to-blue-600',
      overlays: [
        { label: 'Speech Rate: 145 WPM', position: { top: '10%', left: '5%' } },
        { label: 'Filler Words: 2', position: { top: '10%', right: '5%' } },
        { label: 'Vocal Confidence: 85%', position: { bottom: '10%', left: '5%' } },
        { label: 'Clarity Score: 92%', position: { bottom: '10%', right: '5%' } }
      ],
      metrics: [
        { label: 'Words per minute', value: '145', good: true },
        { label: 'Filler words detected', value: '2', good: true },
        { label: 'Vocal confidence', value: '85%', good: true }
      ]
    },
    {
      id: 'eyes',
      title: 'Eye Contact Tracking',
      description: 'Advanced computer vision monitors your gaze patterns and engagement levels',
      icon: EyeIcon,
      color: 'from-green-500 to-green-600',
      overlays: [
        { label: 'Eye Contact: 78%', position: { top: '10%', right: '5%' } },
        { label: 'Focus Score: Excellent', position: { top: '10%', left: '5%' } },
        { label: 'Gaze Stability: Good', position: { bottom: '10%', right: '5%' } },
        { label: 'Natural Movement: 91%', position: { bottom: '10%', left: '5%' } }
      ],
      metrics: [
        { label: 'Direct eye contact', value: '78%', good: true },
        { label: 'Natural gaze movement', value: '91%', good: true },
        { label: 'Focus consistency', value: 'Excellent', good: true }
      ]
    },
    {
      id: 'posture',
      title: 'Body Language Analysis',
      description: 'AI evaluates your posture, gestures, and overall professional presence',
      icon: BoltIcon,
      color: 'from-purple-500 to-purple-600',
      overlays: [
        { label: 'Posture: Excellent', position: { top: '10%', left: '5%' } },
        { label: 'Hand Gestures: Natural', position: { bottom: '10%', left: '5%' } },
        { label: 'Professional Presence: Strong', position: { bottom: '10%', right: '5%' } },
        { label: 'Energy Level: High', position: { top: '10%', right: '5%' } }
      ],
      metrics: [
        { label: 'Posture score', value: '94%', good: true },
        { label: 'Gesture naturalness', value: 'High', good: true },
        { label: 'Professional presence', value: 'Strong', good: true }
      ]
    },
    {
      id: 'feedback',
      title: 'Performance Analytics',
      description: 'Comprehensive analysis and scoring with detailed feedback for continuous improvement',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-orange-500 to-orange-600',
      overlays: [
        { label: '✓ Strong opening statement', position: { top: '10%', left: '5%' } },
        { label: 'Communication Score: 87%', position: { top: '10%', right: '5%' } },
        { label: '✓ Confident delivery', position: { bottom: '10%', left: '5%' } },
        { label: 'Overall Score: 87%', position: { bottom: '10%', right: '5%' } }
      ],
      metrics: [
        { label: 'Overall performance', value: '87%', good: true },
        { label: 'Areas for improvement', value: '3', good: true },
        { label: 'Progress vs last session', value: '+12%', good: true }
      ]
    }
  ];

  // Update current feature based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      const progress = Math.max(0, Math.min(1, (latest - 0.1) / 0.8));
      const newFeature = Math.floor(progress * features.length);
      setCurrentFeature(Math.min(newFeature, features.length - 1));
    });
    return unsubscribe;
  }, [scrollYProgress, features.length]);

  const currentFeatureData = features[currentFeature];

  return (
    <section id="how-it-works" ref={containerRef} className="min-h-[500vh] relative bg-gradient-to-b from-dark-800 to-dark-900">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4">
          
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              How <span className="text-orange-500">Kelv AI</span> Works
            </h2>
            <p className="text-xl text-gray-300">Follow the analysis as it happens in real-time</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* AI Analysis Screen */}
            <div className="relative">
              <motion.div
                className="bg-dark-900 rounded-2xl p-6 border-2 transition-all duration-500"
                style={{
                  borderImage: `linear-gradient(135deg, ${currentFeatureData.color.replace('from-', '').replace('to-', ', ')}) 1`
                }}
                animate={{
                  borderColor: currentFeature === 0 ? '#3b82f6' : 
                              currentFeature === 1 ? '#10b981' :
                              currentFeature === 2 ? '#8b5cf6' : '#f97316'
                }}
              >
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative overflow-hidden">
                  
                  {/* Red Panda Logo with dynamic glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="relative"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <RedPandaLogo size="xl" animate={true} />
                      {/* Subtle glow around panda */}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-full blur-2xl" />
                    </motion.div>
                  </div>
                  
                  {/* Recording indicator */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <motion.div
                      className="w-3 h-3 bg-red-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white text-sm font-medium">ANALYZING: {currentFeatureData.title.toUpperCase()}</span>
                  </div>
                  
                  {/* Dynamic AI Analysis Overlays */}
                  {currentFeatureData.overlays.map((overlay, index) => (
                    <motion.div
                      key={`${currentFeature}-${index}`}
                      className="absolute"
                      style={overlay.position}
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: -20 }}
                      transition={{ 
                        delay: index * 0.3,
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100 
                      }}
                    >
                      <div className={`bg-gradient-to-r ${currentFeatureData.color} bg-opacity-90 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-2 text-white text-sm font-medium shadow-lg`}>
                        <currentFeatureData.icon className="w-4 h-4" />
                        <span>{overlay.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Feature Details with Metrics */}
            <div className="space-y-8">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4">
                  <div className={`bg-gradient-to-r ${currentFeatureData.color} w-16 h-16 rounded-lg flex items-center justify-center shadow-lg`}>
                    <currentFeatureData.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">{currentFeatureData.title}</h3>
                    <p className="text-gray-400">Analysis {currentFeature + 1} of {features.length}</p>
                  </div>
                </div>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  {currentFeatureData.description}
                </p>
                
                {/* Live Metrics */}
                <div className="bg-dark-800/50 rounded-lg p-6 border border-orange-500/20">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Live Metrics
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {currentFeatureData.metrics.map((metric, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300">{metric.label}:</span>
                        <span className={`font-bold ${metric.good ? 'text-green-400' : 'text-yellow-400'}`}>
                          {metric.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Vertical Progress indicator */}
              <div className="flex flex-col space-y-3">
                <span className="text-sm text-gray-400 mb-2">Analysis Progress</span>
                {features.map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index <= currentFeature 
                          ? 'bg-orange-500 scale-110' 
                          : 'bg-gray-600'
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        index < currentFeature 
                          ? 'bg-orange-500' 
                          : index === currentFeature
                          ? 'bg-orange-500/50'
                          : 'bg-gray-600'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
// Failing Interview Scene
const FailingInterviewScene: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const anxietyWords = [
    "NERVOUS", "ANXIOUS", "STUTTERING", "SWEATING", "PANIC", 
    "REJECTED", "FAILURE", "UNPREPARED", "LOST", "CONFUSED"
  ];

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-900/20 to-dark-900 relative overflow-hidden">
      {/* Floating anxiety words */}
      {anxietyWords.map((word, index) => (
        <motion.div
          key={word}
          className="absolute text-red-500/60 font-bold text-lg md:text-2xl"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={isInView ? {
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0.8],
            rotate: [0, 360, 720],
            y: [-50, 50, -100],
          } : {}}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: index * 0.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {word}
        </motion.div>
      ))}
      
      <div className="text-center z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-8"
        >
          <ExclamationTriangleIcon className="w-24 h-24 text-red-500 mx-auto mb-6" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Another Failed Interview
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.9 }}
          className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          You know your stuff. You're qualified. But when the pressure hits, 
          your mind goes blank and your confidence crumbles.
        </motion.p>
      </div>
    </div>
  );
};

// Kelv AI Salvation Scene
const KelvAISalvationScene: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-orange-900/20 relative overflow-hidden">
      {/* AI particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-500 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -60, -20],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      
      <div className="text-center z-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3, type: "spring" }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-orange-500/50">
            <BoltIcon className="w-16 h-16 text-white" />
          </div>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Then Kelv AI Appears
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
        >
          Your AI interview coach that reads your voice, tracks your eyes, 
          and gives you real-time feedback to build unshakeable confidence.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.0 }}
          className="flex flex-wrap justify-center gap-4 text-green-400"
        >
          {["CONFIDENT", "PREPARED", "SUCCESSFUL", "READY"].map((word, index) => (
            <motion.span
              key={word}
              className="text-lg font-bold"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                delay: index * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CheckIcon className="w-6 h-6 inline mr-1" />
              {word}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Sticky Showcase with Red Panda
const StickyShowcase: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const overlays = [
    { 
      icon: MicrophoneIcon, 
      label: "Voice Analysis", 
      position: { top: '20%', left: '10%' },
      delay: 0.2 
    },
    { 
      icon: EyeIcon, 
      label: "Eye Tracking", 
      position: { top: '15%', right: '15%' },
      delay: 0.4 
    },
    { 
      icon: ChatBubbleLeftRightIcon, 
      label: "Real-time Feedback", 
      position: { bottom: '20%', left: '15%' },
      delay: 0.6 
    },
    { 
      icon: BoltIcon, 
      label: "AI Analysis", 
      position: { bottom: '25%', right: '10%' },
      delay: 0.8 
    },
  ];

  return (
    <section className="min-h-[200vh] relative bg-gradient-to-b from-orange-900/20 to-dark-900">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Sticky 3D Webcam Mockup */}
            <div className="relative">
              <motion.div
                className="relative bg-gradient-to-br from-dark-800 to-dark-900 rounded-3xl p-8 shadow-2xl"
                style={{
                  transform: `perspective(1000px) rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
                }}
              >
                {/* Webcam Frame */}
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
                  {/* Simulated webcam feed background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full blur-3xl" />
                  </div>
                  
                  {/* Red Panda in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <RedPandaLogo size="xl" animate={true} />
                    </motion.div>
                  </div>
                  
                  {/* Recording indicator */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <motion.div
                      className="w-3 h-3 bg-red-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white text-sm font-medium">LIVE ANALYSIS</span>
                  </div>
                  
                  {/* AI Overlays */}
                  {overlays.map((overlay) => (
                    <motion.div
                      key={overlay.label}
                      className="absolute"
                      style={overlay.position}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: overlay.delay,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 100 
                      }}
                    >
                      <div className="bg-orange-500/90 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2 text-white text-sm font-medium">
                        <overlay.icon className="w-4 h-4" />
                        <span>{overlay.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-orange-500/50"
                  animate={{
                    borderColor: ["rgba(249, 115, 22, 0.3)", "rgba(249, 115, 22, 0.8)", "rgba(249, 115, 22, 0.3)"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </div>

            {/* Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="space-y-6"
              >
                <h2 className="text-4xl md:text-6xl font-bold text-white">
                  See Kelv AI <span className="text-orange-500">In Action</span>
                </h2>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  Watch as our AI analyzes every aspect of your interview performance in real-time, 
                  providing instant feedback to help you improve.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overlays.map((overlay, index) => (
                    <motion.div
                      key={overlay.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-dark-800/50 rounded-lg p-4 border border-orange-500/20"
                    >
                      <div className="flex items-center space-x-3">
                        <overlay.icon className="w-6 h-6 text-orange-500" />
                        <span className="text-white font-medium">{overlay.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ScrollNarrativeHomepage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  // Transform values for hero section - fade out very quickly when scrolling starts
  const heroOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);
  
  return (
    <div className="relative">
      {/* Hero Section - Fullscreen sticky intro */}
      <motion.section 
        style={{ opacity: heroOpacity }}
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 z-10"
      >
        <WormholePortal />
        
        <div className="text-center z-20 px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="text-orange-500">Kelv AI</span> - Master Any Interview
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-powered interview training that reads your voice, tracks your eyes, 
            and builds unshakeable confidence.
          </p>
          
          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg shadow-orange-500/30"
              onClick={() => {
                const waitlistSection = document.getElementById('waitlist');
                waitlistSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Your Journey
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Spacer for hero */}
      <div className="h-screen" />

      {/* Story sections */}
      <FailingInterviewScene />
      <KelvAISalvationScene />

      {/* Sticky Showcase with Red Panda */}
      <StickyShowcase />

      {/* AI Features Section */}
      <AIFeaturesSection />

      {/* Interactive Mock Interview Demo */}
      <MockInterviewDemo />

      {/* CTA Section with original WaitlistForm */}
      <section id="waitlist" className="min-h-screen bg-gradient-to-b from-dark-900 to-orange-900/10 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Ready to Transform Your Interviews?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Join thousands of professionals who've already elevated their interview game with Kelv AI.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
              <WaitlistForm />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ScrollNarrativeHomepage;


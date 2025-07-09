import React, { useEffect, useRef, useState } from 'react';
import { Brain, Eye, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIInterviewer from './AIInterviewer';

const KelvAIWorkDemo: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showOverlays, setShowOverlays] = useState(false);

  const features = [
    {
      title: "Real-time eye contact detection",
      description: "AI tracks your gaze and provides instant feedback",
      icon: <Eye className="w-6 h-6" />,
      color: "green"
    },
    {
      title: "Confidence analysis",
      description: "Measures vocal patterns and body language",
      icon: <Brain className="w-6 h-6" />,
      color: "orange"
    },
    {
      title: "Voice & tone scoring",
      description: "Analyzes pace, clarity, and emotional resonance",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "blue"
    },
    {
      title: "Posture & presence coaching",
      description: "Real-time guidance for professional presentation",
      icon: <Target className="w-6 h-6" />,
      color: "purple"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setTimeout(() => setShowOverlays(true), 1000);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showOverlays) {
      const interval = setInterval(() => {
        setCurrentFeature(prev => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showOverlays, features.length]);

  return (
    <section 
      id="magic"
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-b from-dark-800 via-dark-700 to-dark-800 flex items-center justify-center"
    >
      {/* Tech grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
          {[...Array(96)].map((_, i) => (
            <motion.div
              key={i}
              className="border border-orange-500/20"
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: [0, 0.3, 0] } : {}}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* 3D-ish Webcam Frame (AirPods style) */}
          <div className="relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, rotateY: 15, rotateX: 5 }}
              animate={isVisible ? { 
                opacity: 1, 
                rotateY: [15, 0, -5, 0],
                rotateX: [5, 0, 2, 0]
              } : {}}
              transition={{ duration: 2, ease: "easeOut" }}
              className="relative perspective-1000"
              style={{ 
                transform: "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Main webcam container with 3D effect */}
              <div className="relative bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                {/* Webcam frame */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border-2 border-gray-600/30">
                  
                  {/* AI Interviewer */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.02, 1],
                        rotate: [0, 0.5, -0.5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative"
                    >
                      <AIInterviewer 
                        isActive={showOverlays}
                        isSpeaking={currentFeature === 1} 
                        isListening={currentFeature === 0} 
                        isProcessing={currentFeature === 2} 
                        size="xl" 
                        showStatus={false}
                      />
                    </motion.div>
                  </div>

                  {/* Dynamic AI Overlays */}
                  <AnimatePresence mode="wait">
                    {showOverlays && (
                      <>
                        {/* Confidence Score */}
                        {currentFeature === 1 && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -30, scale: 0.8 }}
                            className="absolute top-4 left-4 bg-dark-800/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-orange-500/40 shadow-lg"
                          >
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Confidence</div>
                            <motion.div
                              initial={{ width: "45%" }}
                              animate={{ width: "89%" }}
                              transition={{ duration: 2, ease: "easeOut" }}
                              className="text-2xl font-bold text-orange-400 mt-1"
                            >
                              89%
                            </motion.div>
                            <div className="w-20 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                              <motion.div
                                initial={{ width: "45%" }}
                                animate={{ width: "89%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Eye Contact Detection */}
                        {currentFeature === 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute top-1/3 right-1/3"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-12 h-12 border-3 border-green-400 rounded-full flex items-center justify-center"
                            >
                              <div className="w-6 h-6 bg-green-400/30 rounded-full" />
                            </motion.div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 }}
                              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                            >
                              Eye Contact: Excellent
                            </motion.div>
                          </motion.div>
                        )}

                        {/* Voice Analysis Waveform */}
                        {currentFeature === 2 && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="absolute bottom-4 right-4 bg-dark-800/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-blue-500/40"
                          >
                            <div className="text-xs text-gray-400 mb-2">Voice Analysis</div>
                            <div className="flex items-end gap-1">
                              {[...Array(8)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 bg-blue-400 rounded-full"
                                  animate={{
                                    height: [8, 20 + Math.random() * 16, 8]
                                  }}
                                  transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay: i * 0.1
                                  }}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-blue-400 mt-1">Clarity: 94%</div>
                          </motion.div>
                        )}

                        {/* Posture Alignment */}
                        {currentFeature === 3 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-4"
                          >
                            <div className="relative h-full border-2 border-purple-400/40 rounded-xl">
                              {/* Alignment guides */}
                              <div className="absolute top-1/4 left-1/2 w-8 h-0.5 bg-purple-400 transform -translate-x-1/2" />
                              <div className="absolute top-1/2 left-1/4 w-0.5 h-8 bg-purple-400 transform -translate-y-1/2" />
                              <div className="absolute top-1/2 right-1/4 w-0.5 h-8 bg-purple-400 transform -translate-y-1/2" />
                              
                              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                Posture: Perfect
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Webcam status indicator */}
                  <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full">
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-full h-full bg-green-400 rounded-full"
                    />
                  </div>
                </div>

                {/* 3D depth effect */}
                <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-3xl blur-xl -z-10" />
              </div>
            </motion.div>
          </div>

          {/* Side Text Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="gradient-text">See Kelv AI</span>
                <br />
                <span className="text-white">Work in Real-Time</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-8">
                Experience AI-powered interview coaching like never before
              </p>
            </motion.div>

            {/* Dynamic feature list */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
                    currentFeature === index 
                      ? 'bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/30' 
                      : 'hover:bg-dark-800/50'
                  }`}
                >
                  <motion.div
                    animate={currentFeature === index ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`p-3 rounded-lg ${
                      feature.color === 'green' ? 'bg-green-500/20 text-green-400' :
                      feature.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                      feature.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                      currentFeature === index ? 'text-orange-400' : 'text-white'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 1.5 }}
              className="pt-6"
            >
              <motion.a
                href="#journey"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-full font-medium transition-all duration-300 group shadow-lg shadow-orange-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-3">See How It Works</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KelvAIWorkDemo;

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, User, ChevronRight, X, Mic, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PerformanceAnalytics from './PerformanceAnalytics';
import AIInterviewer from './AIInterviewer';
import RedPandaLogo from './RedPandaLogo';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(-1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAnalyticsButton, setShowAnalyticsButton] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const messages = [
    {
      role: 'kelv',
      text: "Alright, last question! Can you tell me about a time you failed and what you learned from it?",
      delay: 4000,
      state: 'speaking'
    },
    {
      role: 'user',
      text: "Certainly. There was a project where I misjudged the complexity of a task, leading to delays. I learned the importance of thorough planning and seeking input from team members early on.",
      delay: 4000,
      state: 'listening'
    },
    {
      role: 'kelv',
      text: "Great answer! Your comprehensive performance analysis is now ready to view.",
      delay: 3000,
      state: 'processing'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
            setIsActive(true);
            setTimeout(() => {
              setIsTyping(true);
              setCurrentMessage(0);
            }, 800);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTyping && currentMessage >= 0 && currentMessage < messages.length) {
      const currentMsg = messages[currentMessage];
      
      setIsListening(currentMsg.state === 'listening');
      setIsSpeaking(currentMsg.state === 'speaking');
      setIsProcessing(currentMsg.state === 'processing');
      
      if (currentMessage < messages.length - 1) {
        const timer = setTimeout(() => {
          setCurrentMessage(prev => prev + 1);
        }, currentMsg.delay);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setShowAnalyticsButton(true);
        }, currentMsg.delay);
        return () => clearTimeout(timer);
      }
    }
  }, [isTyping, currentMessage, messages]);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="container">
        <div 
          ref={heroRef}
          className="max-w-4xl mx-auto text-center space-y-8 opacity-0 translate-y-10 transition-all duration-1000"
        >
          <h1 className="gradient-text font-bold">
            Master Your Interviews with <br />
            <span className="text-white">AI-Powered Preparation</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Experience realistic interview simulations with Kelv AI. Our advanced AI analyzes your responses, provides personalized feedback, and helps you improve your interview skills.
          </p>
          
          <div className="button-container justify-center pt-4">
            <a href="#waitlist" className="btn btn-primary">
              Join Waitlist
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a href="#how-it-works" className="btn btn-secondary">
              How It Works
            </a>
          </div>
          
          <div className="pt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
              <span>Real-time AI Analysis</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
              <span>Adaptive Questions</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
              <span>Personalized Feedback</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-12">
          <div className="rounded-xl overflow-hidden border border-gray-700 group relative transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/30">
            <div className="bg-dark-800 relative z-10 flex min-h-[600px] md:min-h-[500px]"> 
              {/* Interview Demo Wrapper - conditionally hide/show */}
              <AnimatePresence>
                {!showAnalytics && (
                  <motion.div
                    key="interview-demo"
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-grow"
                  >
                    {/* Left Panel - Chat Interaction */}
                    <motion.div 
                      className={`w-1/2 p-6 flex flex-col justify-between`}
                      layout
                    >
                      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 flex-grow relative overflow-hidden">
                        {/* Interview Question Header (as seen in screenshot) */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-orange-600 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-white">Interview Question</h3>
                        </div>
                        <div className="flex gap-2 mb-6">
                          <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">Small talk</span>
                          <span className="px-3 py-1 bg-green-700 rounded-full text-xs text-green-300">easy</span>
                        </div>

                        {/* Chat Content Display with Icons */}
                        <div className="relative z-10 flex-grow space-y-4 overflow-y-auto mb-4"> 
                          <AnimatePresence mode="wait">
                            {currentMessage >= 0 && (
                              <motion.div
                                key={currentMessage} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.6 }}
                                className="flex items-start gap-4" 
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  messages[currentMessage].role === 'kelv' 
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg overflow-hidden'
                                    : 'bg-gray-600'
                                }`}>
                                  {messages[currentMessage].role === 'kelv' ? (
                                    <RedPandaLogo size="sm" animate={false} className="w-full h-full" />
                                  ) : (
                                    <User className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium mb-1 opacity-75">
                                    {messages[currentMessage].role === 'kelv' ? 'Kelv AI' : 'You'}
                                  </div>
                                  <p className="text-gray-300 text-lg">
                                    {messages[currentMessage].text}
                                    {isTyping && messages[currentMessage].role === 'kelv' && (
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ repeat: Infinity, duration: 0.5 }}
                                        className="inline-block w-2 h-4 bg-orange-500 ml-1 align-middle"
                                      />
                                    )}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Playing button */}
                        <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v10m4-10v10m4-10v10" />
                          </svg>
                          Playing
                        </button>
                      </div>
                    </motion.div>

                    {/* Right Panel - AI Video & User Cam */}
                    <motion.div 
                      className="w-1/2 p-6 flex flex-col items-center justify-center bg-dark-900 relative"
                      layout
                    >
                      {/* AI Interviewer Component */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        <AIInterviewer 
                          isActive={isActive}
                          isSpeaking={isSpeaking} 
                          isListening={isListening} 
                          isProcessing={isProcessing} 
                          size="xl" 
                          showStatus={true}
                        />

                        {/* User Camera Feed */}
                        <motion.div 
                          className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-24 h-24 md:w-32 md:h-32 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center"
                          animate={isListening ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <User className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analytics Panel (slides in) */}
              <AnimatePresence>
                {showAnalytics && (
                  <motion.div
                    key="analytics-panel"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-dark-800 p-6 flex flex-col"
                  >
                    <PerformanceAnalytics 
                      isOpen={showAnalytics} 
                      onClose={() => setShowAnalytics(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View Analytics Button (on the main demo interface) */}
              <AnimatePresence>
                {!showAnalytics && showAnalyticsButton && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => setShowAnalytics(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg hover:from-orange-400 hover:to-orange-300 transition-all shadow-lg shadow-orange-500/30 group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
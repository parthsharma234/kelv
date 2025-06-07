import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Bot, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PerformanceAnalytics from './PerformanceAnalytics';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(-1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAnalyticsButton, setShowAnalyticsButton] = useState(false);
  
  const messages = [
    {
      role: 'kelv',
      text: "Alright, just one final question. How do you typically handle conflict within a team setting?",
      delay: 1000
    },
    {
      role: 'user',
      text: "I usually approach conflict by first seeking to understand the other person's perspective. Then I try to find a collaborative solution that addresses everyone's concerns.",
      delay: 1000
    },
    {
      role: 'kelv',
      text: "Excellent response! Your detailed performance analysis is now ready to view.",
      delay: 1000
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
            // Start the conversation when the section is visible
            setTimeout(() => {
              setIsTyping(true);
              setCurrentMessage(0);
            }, 400);
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
    if (isTyping && currentMessage >= 0 && currentMessage < messages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMessage(prev => prev + 1);
      }, messages[currentMessage].delay);
      return () => clearTimeout(timer);
    } else if (currentMessage === messages.length - 1) {
      // Show analytics button after the last message
      const timer = setTimeout(() => {
        setShowAnalyticsButton(true);
      }, 500);
      return () => clearTimeout(timer);
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
            Kelv AI uses advanced artificial intelligence to analyze your performance, provide personalized feedback, and help you land your dream job with confidence.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
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
              <span>Personalized Feedback</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
              <span>Practice Like Real Interviews</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-12">
          <div className="rounded-xl overflow-hidden border border-gray-700 group relative transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/30">
            <div className="bg-dark-800 relative z-10 p-6">
              <div className="flex items-center justify-center">
                <div className="w-full max-w-xl bg-dark-800 relative p-5 rounded-lg">
                  <div className="relative z-10 space-y-4">
                    <AnimatePresence mode="popLayout">
                      {messages.slice(0, currentMessage + 1).map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-start gap-4 ${
                            message.role === 'kelv' ? 'group hover:bg-dark-700/50 p-2 rounded-lg transition-colors' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'kelv' 
                              ? 'bg-gradient-to-br from-orange-500 to-orange-400 text-white group-hover:scale-105 transition-transform shadow-lg'
                              : 'bg-gray-600'
                          }`}>
                            {message.role === 'kelv' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-1 text-gray-300">
                              {message.role === 'kelv' ? 'Kelv AI' : 'You'}
                            </div>
                            <div className="text-gray-300">
                              {message.text}
                              {index === currentMessage && isTyping && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ repeat: Infinity, duration: 0.5 }}
                                  className="inline-block w-2 h-4 bg-orange-500 ml-1"
                                />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showAnalyticsButton && !showAnalytics && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => setShowAnalytics(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-lg hover:from-orange-400 hover:to-orange-300 transition-all shadow-lg shadow-orange-500/30"
                  >
                    <ChevronLeft className="w-6 h-6 rotate-180" />
                  </motion.button>
                )}
              </AnimatePresence>

              <PerformanceAnalytics 
                isOpen={showAnalytics} 
                onClose={() => setShowAnalytics(false)} 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
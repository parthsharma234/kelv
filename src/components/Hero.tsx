import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(-1);
  
  const messages = [
    {
      role: 'sol',
      text: "Hi! I'm Sol AI, your personal interview preparation assistant. I'll help you master your interview skills. What role are you interviewing for?",
      delay: 1000
    },
    {
      role: 'user',
      text: "I'm interviewing for a Senior Software Engineer position at a tech company.",
      delay: 2000
    },
    {
      role: 'sol',
      text: "Excellent choice! As Sol AI, I specialize in technical interviews. Let's start with system design - can you walk me through your experience?",
      delay: 2000
    },
    {
      role: 'user',
      text: "I've designed several distributed systems, including a real-time analytics platform that processes millions of events daily.",
      delay: 2000
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
            }, 1000);
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
            Sol Interview uses advanced AI to analyze your performance, provide personalized feedback, and help you land your dream job with confidence.
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
        
        <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl shadow-orange-500/10 border border-dark-700 mt-12">
          <div className="aspect-video bg-dark-800 flex items-center justify-center">
            <div className="w-full max-w-3xl px-8 py-12 bg-dark-700 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent"></div>
              <div className="relative z-10 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.slice(0, currentMessage + 1).map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-4 ${
                        message.role === 'sol' ? 'group hover:bg-dark-600/50 p-2 rounded-lg transition-colors' : ''
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'sol' 
                          ? 'bg-orange-500 text-white group-hover:scale-110 transition-transform' 
                          : 'bg-gray-600'
                      }`}>
                        {message.role === 'sol' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1 text-gray-300">
                          {message.role === 'sol' ? 'Sol AI' : 'You'}
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
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-3xl bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-transparent rounded-full"></div>
        <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default Hero;
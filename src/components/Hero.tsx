import React, { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, Sparkles, Users, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
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

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="container">
        <div 
          ref={heroRef}
          className="max-w-4xl mx-auto text-center space-y-8 opacity-0 translate-y-10 transition-all duration-1000"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-orange-400 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Coming Soon - Join the Waitlist</span>
          </motion.div>
          
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
        
        {/* Waitlist stats preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 mt-16"
        >
          <div className="max-w-3xl mx-auto bg-dark-800/80 backdrop-blur-sm rounded-2xl p-8 border border-dark-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-400/5"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Join Thousands Preparing for Success</h3>
                <p className="text-gray-400">Be part of the AI interview revolution</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold gradient-text">2,847</span>
                  </div>
                  <p className="text-gray-400 text-sm">People on Waitlist</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold gradient-text">Q2 2025</span>
                  </div>
                  <p className="text-gray-400 text-sm">Expected Launch</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold gradient-text">50%</span>
                  </div>
                  <p className="text-gray-400 text-sm">Early Access Discount</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <a 
                  href="#waitlist" 
                  className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  <span>Secure your spot now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
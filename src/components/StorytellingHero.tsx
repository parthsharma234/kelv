import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RedPandaLogo from './RedPandaLogo';

const StorytellingHero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setTimeout(() => setShowScrollHint(true), 2000);
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

  // Floating particles animation
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
  }));

  return (
    <section 
      ref={heroRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-orange-500/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Logo Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex items-center justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                animate={isVisible ? { 
                  boxShadow: [
                    "0 0 0 0 rgba(255, 87, 34, 0)",
                    "0 0 0 20px rgba(255, 87, 34, 0.1)",
                    "0 0 0 40px rgba(255, 87, 34, 0)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-full"
              >
                <RedPandaLogo size="xl" animate={true} />
              </motion.div>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">Kelv AI</span>
              <br />
              <span className="text-white">is Here</span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
              AI-Powered Interview Coaching
            </p>
          </motion.div>

          {/* Minimal CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.9 }}
            className="pt-8"
          >
            <motion.a
              href="#problem"
              className="inline-flex items-center px-8 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-full text-orange-400 hover:text-orange-300 transition-all duration-300 group backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-3">Experience the Future</span>
              <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center text-gray-400"
            >
              <span className="text-sm mb-2 opacity-75">Scroll to discover</span>
              <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
                <motion.div
                  animate={{ y: [0, 12, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 h-3 bg-orange-500 rounded-full mt-2"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default StorytellingHero;

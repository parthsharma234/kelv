import React, { useEffect, useRef, useState } from 'react';
import { Heart, Droplets, TrendingDown, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProblemStatement: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(-1);
  const [showStats, setShowStats] = useState(false);

  const anxietyPhrases = [
    "Am I speaking too fast?",
    "Do I look confident?",
    "Was that answer good enough?",
    "They're judging everything I say...",
    "I'm forgetting what I rehearsed...",
    "My palms are sweating..."
  ];

  const floatingWords = [
    { text: "NERVOUS!", x: 10, y: 20, delay: 0, intensity: "high" },
    { text: "ANXIOUS!", x: 80, y: 15, delay: 0.5, intensity: "high" },
    { text: "WORRIED!", x: 15, y: 70, delay: 1, intensity: "medium" },
    { text: "SCARED!", x: 75, y: 80, delay: 1.5, intensity: "high" },
    { text: "STRESSED!", x: 45, y: 10, delay: 2, intensity: "high" },
    { text: "PANICKED!", x: 50, y: 85, delay: 2.5, intensity: "high" },
    { text: "FAILING!", x: 25, y: 50, delay: 3, intensity: "high" },
    { text: "JUDGED!", x: 70, y: 40, delay: 3.5, intensity: "medium" },
    { text: "REJECTED!", x: 35, y: 25, delay: 4, intensity: "high" },
    { text: "SWEATING!", x: 60, y: 65, delay: 4.5, intensity: "medium" },
    { text: "TREMBLING!", x: 20, y: 35, delay: 5, intensity: "medium" },
    { text: "CHOKING!", x: 85, y: 55, delay: 5.5, intensity: "high" }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setTimeout(() => setCurrentPhrase(0), 500);
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
    if (currentPhrase >= 0 && currentPhrase < anxietyPhrases.length) {
      const timer = setTimeout(() => {
        if (currentPhrase < anxietyPhrases.length - 1) {
          setCurrentPhrase(prev => prev + 1);
        } else {
          setShowStats(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPhrase, anxietyPhrases.length]);

  return (
    <section 
      id="problem"
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-b from-dark-900 via-gray-900 to-dark-800 flex items-center justify-center"
    >
      {/* Subtle red anxiety undertones */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 via-transparent to-red-900/10" />

      {/* Floating anxiety words that SCREAM */}
      <div className="absolute inset-0">
        {floatingWords.map((word, index) => (
          <motion.div
            key={index}
            className={`absolute font-bold select-none ${
              word.intensity === 'high' 
                ? 'text-red-400/60 text-xl md:text-2xl' 
                : 'text-red-400/40 text-lg'
            }`}
            style={{ left: `${word.x}%`, top: `${word.y}%` }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={isVisible ? { 
              opacity: word.intensity === 'high' ? [0.4, 0.8, 0.4] : [0.2, 0.6, 0.2], 
              y: [0, -40, -80],
              scale: word.intensity === 'high' ? [0.8, 1.2, 0.8] : [0.8, 1.1, 0.8],
              rotate: [0, Math.random() * 20 - 10, 0]
            } : {}}
            transition={{ 
              duration: word.intensity === 'high' ? 3 : 4, 
              repeat: Infinity, 
              delay: word.delay,
              ease: "easeInOut"
            }}
          >
            {word.text}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-red-400">Interviews are</span>
              <br />
              <span className="text-white">Terrifying</span>
            </h2>
          </motion.div>

          {/* Anxiety Phrases */}
          <div className="relative min-h-[200px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentPhrase >= 0 && currentPhrase < anxietyPhrases.length && (
                <motion.div
                  key={currentPhrase}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.8 }}
                  className="text-center"
                >
                  <p className="text-2xl md:text-3xl text-gray-300 italic">
                    "{anxietyPhrases[currentPhrase]}"
                  </p>
                  
                  {/* Anxiety indicators */}
                  <div className="flex justify-center gap-8 mt-8">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex items-center gap-2 text-red-400"
                    >
                      <Heart className="w-6 h-6" />
                      <span className="text-sm">Racing</span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-2 text-blue-400"
                    >
                      <Droplets className="w-6 h-6" />
                      <span className="text-sm">Sweating</span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-2 text-orange-400"
                    >
                      <TrendingDown className="w-6 h-6" />
                      <span className="text-sm">Confidence</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Statistics */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="space-y-8"
              >
                <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="text-center"
                  >
                    <div className="text-5xl md:text-6xl font-bold text-red-400 mb-4">87%</div>
                    <p className="text-xl text-gray-300">
                      of candidates fail due to <span className="text-red-400">nerves</span>, not skills
                    </p>
                  </motion.div>
                </div>

                {/* Understanding message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center"
                >
                  <p className="text-xl text-gray-400 mb-8">
                    You're not alone. Millions feel this way.
                    <br />
                    <span className="text-orange-400">But what if there was a better way?</span>
                  </p>
                  
                  <motion.a
                    href="#magic"
                    className="inline-flex items-center px-8 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-full text-orange-400 hover:text-orange-300 transition-all duration-300 group backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mr-3">See the Solution</span>
                    <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </motion.a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subtle screen shake effect when phrases appear */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={currentPhrase >= 0 ? {
          x: [0, -1, 1, -1, 0],
          y: [0, 1, -1, 1, 0]
        } : {}}
        transition={{ duration: 0.5 }}
      />
    </section>
  );
};

export default ProblemStatement;

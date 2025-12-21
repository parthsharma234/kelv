import React from 'react';
import { motion } from 'framer-motion';
import RedPandaLogo from '../RedPandaLogo';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-900 px-4 overflow-hidden">
      {/* Animated particle/star background */}
      <div className="absolute inset-0">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() > 0.7 ? '3px' : '2px',
              height: Math.random() > 0.7 ? '3px' : '2px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: Math.random() > 0.5 ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          style={{ top: '10%', left: '10%' }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{ bottom: '10%', right: '10%' }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center py-32 relative z-10">
        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <RedPandaLogo size="lg" animate={false} />
          <h1 className="text-5xl font-semibold gradient-text">Kelv AI</h1>
        </motion.div>

        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight"
        >
          Ace your interviews<br />with AI coaching
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto font-light"
        >
          Real-time voice analysis and feedback to help you sound confident, clear, and professional.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => {
              const waitlistSection = document.getElementById('waitlist');
              waitlistSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-lg shadow-orange-500/20"
          >
            Join waitlist →
          </motion.button>
          <motion.button
            onClick={() => {
              const featuresSection = document.getElementById('features');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-dark-800 hover:bg-dark-700 text-white px-8 py-4 rounded-lg text-base font-medium transition-colors duration-200 border border-dark-700"
          >
            Learn more
          </motion.button>
        </motion.div>

        {/* Launch Date */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-sm text-gray-500 mt-8"
        >
          Launching January 2026
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;

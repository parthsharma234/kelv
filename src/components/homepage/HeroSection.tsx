import React from 'react';
import { motion } from 'framer-motion';
import DeviceMockup from './DeviceMockup';
import MockupDashboard from './MockupDashboard';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-[#030305] overflow-hidden">
      {/* Stripe-style gradient mesh background */}
      <div className="absolute inset-0 stripe-gradient-mesh" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Animated gradient orb */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] animated-gradient-orb opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="min-h-screen grid lg:grid-cols-[1.1fr,0.9fr] items-center gap-12 py-24">

          {/* Left: Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                AI Interview Coach
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-6xl xl:text-7xl font-semibold text-white leading-[1.1] tracking-tight"
            >
              Stop guessing.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200">
                Start proving.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-lg leading-relaxed"
            >
              Kelv watches your mock interviews like a hiring manager and tells you,
              word-for-word, what landed and what didn't.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const waitlist = document.getElementById('waitlist');
                  waitlist?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                Join the waitlist →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const features = document.getElementById('features');
                  features?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 text-gray-400 hover:text-white font-medium transition-colors"
              >
                See how it works
              </motion.button>
            </motion.div>
          </div>

          {/* Right: Product Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ perspective: '1200px' }}
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-blue-500/10 blur-3xl scale-110" />

            <DeviceMockup variant="laptop" showChrome animate>
              <MockupDashboard />
            </DeviceMockup>

            {/* Floating stats cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -left-8 top-1/4 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 shadow-xl"
            >
              <p className="text-[9px] text-gray-500 uppercase">Confidence</p>
              <p className="text-lg font-bold text-green-400">+34%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -right-6 bottom-1/3 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 shadow-xl"
            >
              <p className="text-[9px] text-gray-500 uppercase">Filler Words</p>
              <p className="text-lg font-bold text-orange-400">-67%</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

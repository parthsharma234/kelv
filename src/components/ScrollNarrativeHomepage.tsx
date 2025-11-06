import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  MicrophoneIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import WaitlistForm from './WaitlistForm';
import RedPandaLogo from './RedPandaLogo';

// ============================================
// HERO SECTION - Ecology-Inspired with Particles
// ============================================
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

// ============================================
// PROBLEM SECTION - Rejection Letters (Email Opening Animation)
// ============================================
const ProblemSection: React.FC = () => {
  const [openedEmails, setOpenedEmails] = React.useState<Set<number>>(new Set());

  const rejectionLetters = [
    {
      company: "TechCorp Inc.",
      subject: "Application Status Update",
      message: "We've decided to move forward with other candidates who better fit our needs at this time."
    },
    {
      company: "StartupXYZ",
      subject: "Your Interview Feedback",
      message: "While your background is impressive, we're looking for someone with stronger communication skills."
    },
    {
      company: "Innovation Labs",
      subject: "Re: Software Engineer Position",
      message: "Thank you for your interest. Unfortunately, we will not be moving forward with your application."
    },
    {
      company: "Future Systems",
      subject: "Interview Decision",
      message: "We appreciate your time, but have selected a candidate whose interview performance was stronger."
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-dark-900 relative overflow-hidden">
      {/* Subtle floating sad emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-5"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, 20, 0],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          >
            {['😔', '📧', '❌', '😞', '📉', '💔'][i]}
          </motion.div>
        ))}
      </div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-semibold text-white mb-6">
            You know your stuff.
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 font-light">
            But interviews are <span className="text-red-400 font-medium">brutal</span>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {rejectionLetters.map((letter, index) => {
            const isOpened = openedEmails.has(index);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
                onViewportEnter={() => {
                  // Auto-open emails with staggered delay
                  setTimeout(() => {
                    setOpenedEmails(prev => new Set([...prev, index]));
                  }, 800 + index * 400);
                }}
                className="relative bg-dark-800 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors duration-200 overflow-hidden"
                style={{ perspective: '1000px' }}
              >
                {/* Email Header (Always visible - like inbox preview) */}
                <div className="p-4 border-b border-red-500/10 bg-dark-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <div className="text-sm text-gray-400 font-medium">{letter.company}</div>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{letter.subject}</div>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: isOpened ? 1 : 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="text-xs text-red-500 font-semibold border border-red-500/50 rounded px-2 py-1"
                    >
                      REJECTED
                    </motion.div>
                  </div>
                </div>

                {/* Email Body (Expands open like reading an email) */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: isOpened ? 'auto' : 0,
                    opacity: isOpened ? 1 : 0
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isOpened ? 1 : 0, y: isOpened ? 0 : 10 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-gray-300 text-sm leading-relaxed"
                    >
                      "{letter.message}"
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isOpened ? 1 : 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-red-500/10"
                    >
                      <div className="text-xs text-gray-500">
                        Sent via email • Automated response
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-400 font-light">
            Sound familiar? <span className="text-orange-500 font-medium">It doesn't have to be this way.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// FEATURES SECTION - Enhanced with Floating Elements
// ============================================
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: MicrophoneIcon,
      title: "Real-Time Voice Analysis",
      description: "Get instant feedback on your speech rate, clarity, and filler words as you practice.",
      metrics: ["Speech rate", "Clarity score", "Filler words"],
      color: "orange"
    },
    {
      icon: SparklesIcon,
      title: "Confidence Tracking",
      description: "Watch your confidence grow with detailed metrics on tone, delivery, and presence.",
      metrics: ["Voice confidence", "Delivery score", "Energy level"],
      color: "blue"
    },
    {
      icon: CheckCircleIcon,
      title: "Smart Feedback",
      description: "Receive actionable tips to improve structure, examples, and overall answer quality.",
      metrics: ["Answer structure", "Example quality", "Time management"],
      color: "green"
    }
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-dark-900 relative overflow-hidden">
      {/* Floating interview-themed elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-5"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {['💼', '🎤', '💡', '⭐', '📊', '🎯', '💬', '🚀'][i]}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Everything you need to ace interviews
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Kelv AI analyzes every aspect of your performance to help you improve faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group relative bg-dark-800 rounded-xl p-8 border border-dark-700 hover:border-orange-500/50 transition-all duration-300"
              >
                {/* Subtle glow on hover */}
                <div className={`absolute -inset-0.5 bg-${feature.color}-500/0 group-hover:bg-${feature.color}-500/10 rounded-xl blur transition-all duration-300`} />

                <div className="relative">
                  <motion.div
                    className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className="w-6 h-6 text-orange-500" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.metrics.map((metric, i) => (
                      <motion.span
                        key={i}
                        className="text-xs text-gray-500 bg-dark-700/50 px-3 py-1 rounded-full"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.15 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        {metric}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============================================
// HOW IT WORKS SECTION - Step-by-step
// ============================================
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Choose your interview type",
      description: "Select from behavioral, technical, or general interviews based on your needs."
    },
    {
      number: "02",
      title: "Practice with AI",
      description: "Answer questions while Kelv AI analyzes your voice, pace, and confidence in real-time."
    },
    {
      number: "03",
      title: "Review & improve",
      description: "Get detailed feedback with specific suggestions to strengthen your answers."
    },
    {
      number: "04",
      title: "Track progress",
      description: "See your improvement over time with comprehensive analytics and metrics."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-dark-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            How it works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Start practicing in minutes. No setup required.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="flex gap-8 mb-12 last:mb-0 group"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center group-hover:border-orange-500/60 transition-colors duration-200">
                  <span className="text-2xl font-semibold text-orange-500">{step.number}</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-lg text-gray-400 leading-relaxed font-light">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Visual Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="relative bg-dark-900 rounded-2xl border border-dark-700 overflow-hidden">
            {/* Mock Interview Interface */}
            <div className="relative bg-gradient-to-br from-dark-900 to-dark-800 aspect-video">
              {/* Top Bar - Interview Session Info */}
              <div className="absolute top-0 left-0 right-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RedPandaLogo size="sm" animate={false} />
                    <div>
                      <div className="text-sm font-medium text-white">Practice Interview</div>
                      <div className="text-xs text-gray-400">Behavioral Questions</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
                    <motion.div
                      className="w-2 h-2 bg-red-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white text-xs font-medium">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Center - AI Avatar & Transcript */}
              <div className="absolute inset-0 flex items-center justify-center pt-16 pb-32">
                <div className="text-center max-w-2xl px-8">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-6 flex justify-center"
                  >
                    <RedPandaLogo size="lg" animate={true} />
                  </motion.div>

                  {/* Simulated conversation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="space-y-3"
                  >
                    <div className="bg-dark-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-dark-700">
                      <div className="text-xs text-gray-500 mb-1">AI Interviewer</div>
                      <p className="text-sm text-gray-300">"Tell me about a time you overcame a challenge..."</p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2 }}
                      className="bg-orange-500/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-orange-500/30"
                    >
                      <div className="text-xs text-orange-400 mb-1">You're speaking...</div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="flex gap-1"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <div className="w-1 h-3 bg-orange-500 rounded-full" />
                          <div className="w-1 h-4 bg-orange-500 rounded-full" />
                          <div className="w-1 h-3 bg-orange-500 rounded-full" />
                        </motion.div>
                        <p className="text-sm text-gray-300">Analyzing your response in real-time...</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Bottom - Real-time Metrics Dashboard */}
              <div className="absolute bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700 px-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Speech Rate</div>
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-lg font-semibold text-white"
                    >
                      145 WPM
                    </motion.div>
                    <div className="text-xs text-green-400">Optimal</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.7 }}
                    className="text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Clarity</div>
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="text-lg font-semibold text-green-400"
                    >
                      92%
                    </motion.div>
                    <div className="text-xs text-green-400">Excellent</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.9 }}
                    className="text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Confidence</div>
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      className="text-lg font-semibold text-orange-400"
                    >
                      85%
                    </motion.div>
                    <div className="text-xs text-orange-400">Strong</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.1 }}
                    className="text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">Filler Words</div>
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                      className="text-lg font-semibold text-blue-400"
                    >
                      2/min
                    </motion.div>
                    <div className="text-xs text-blue-400">Great</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// TRANSFORMATION SECTION - Before/After with Animated Counters
// ============================================
const AnimatedCounter: React.FC<{ value: number; suffix?: string; duration?: number }> = ({
  value,
  suffix = '',
  duration = 2
}) => {
  const [count, setCount] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!counterRef.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const steps = 60;
          const increment = value / steps;
          const stepDuration = (duration * 1000) / steps;

          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
              setCount(Math.min(Math.round(increment * currentStep), value));
            } else {
              clearInterval(timer);
            }
          }, stepDuration);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <div ref={counterRef}>{count}{suffix}</div>;
};

const TransformationSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-dark-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-semibold text-white mb-6">
            The <span className="text-orange-500">Difference</span>
          </h2>
          <p className="text-xl text-gray-400 font-light">
            Just 4 weeks of practice with Kelv AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* BEFORE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-dark-800 rounded-2xl p-8 border border-red-500/20"
          >
            <div className="text-center mb-6">
              <span className="text-red-400 text-2xl font-semibold">BEFORE</span>
            </div>
            <div className="space-y-6">
              <p className="text-gray-400 text-lg font-light">"Um... so... I think... like..."</p>

              <div className="space-y-4">
                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Confidence</span>
                    <span className="text-red-400 font-semibold text-2xl">
                      <AnimatedCounter value={45} suffix="%" />
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-red-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: '45%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>

                {/* Filler Words */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Filler Words</span>
                    <span className="text-red-400 font-semibold text-2xl">
                      <AnimatedCounter value={23} suffix="/min" duration={1.5} />
                    </span>
                  </div>
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Speech Rate</span>
                    <span className="text-red-400 font-semibold text-2xl">
                      <AnimatedCounter value={95} suffix=" WPM" duration={1.5} />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Too slow - sounds unsure</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AFTER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-dark-800 rounded-2xl p-8 border border-green-500/20 relative"
          >
            <div className="absolute top-6 right-6">
              <SparklesIcon className="w-6 h-6 text-green-400" />
            </div>

            <div className="text-center mb-6">
              <span className="text-green-400 text-2xl font-semibold">AFTER</span>
            </div>
            <div className="space-y-6">
              <p className="text-gray-200 font-medium text-lg">"I led a team of 8 engineers..."</p>

              <div className="space-y-4">
                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Confidence</span>
                    <span className="text-green-400 font-semibold text-2xl">
                      <AnimatedCounter value={92} suffix="%" />
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: '92%' }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>

                {/* Filler Words */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Filler Words</span>
                    <span className="text-green-400 font-semibold text-2xl">
                      <AnimatedCounter value={2} suffix="/min" duration={1.5} />
                    </span>
                  </div>
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Speech Rate</span>
                    <span className="text-green-400 font-semibold text-2xl">
                      <AnimatedCounter value={145} suffix=" WPM" duration={1.5} />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Perfect - sounds confident</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA SECTION - Premium with Floating Effects
// ============================================
const CTASection: React.FC = () => {
  return (
    <section id="waitlist" className="py-24 md:py-32 bg-dark-800 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
        style={{ top: '20%', left: '5%' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        style={{ bottom: '10%', right: '5%' }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <RedPandaLogo size="lg" animate={true} className="mx-auto mb-6" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-semibold text-white mb-6"
          >
            Ready to ace your interviews?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light"
          >
            Join the waitlist and be among the first to experience AI-powered interview coaching.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <WaitlistForm />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500"
          >
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              <span>Beta launching January 2026</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ScrollNarrativeHomepage: React.FC = () => {
  return (
    <div className="relative bg-dark-900">
      {/* Sections - Stripe-inspired Clean Design */}
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TransformationSection />
      <CTASection />
    </div>
  );
};

export default ScrollNarrativeHomepage;

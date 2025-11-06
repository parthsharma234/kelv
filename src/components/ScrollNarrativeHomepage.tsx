import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
// PROBLEM SECTION - Empathy-First Narrative
// ============================================
const ProblemSection: React.FC = () => {
  const [activeEmail, setActiveEmail] = useState(0);
  const [pauseAutoPlay, setPauseAutoPlay] = useState(false);

  const rejectionLetters = [
    {
      company: "Recruiter DM",
      subject: "Final loop feedback",
      preview: "Panel loved your systems answer, delivery felt rehearsed...",
      body: "Panel loved your systems answer, they just wanted tighter stories and more energy when you get challenged.",
      status: "Follow up requested",
      timestamp: "10:14 AM",
      tag: "Needs polish",
      insights: ["Voice dipped at the end", "Missing metric in closer"]
    },
    {
      company: "Hiring Manager - Series B Startup",
      subject: "Debrief",
      preview: "Great resume, but the examples stayed safe...",
      body: "Great resume, but the examples stayed safe. We were hoping to hear bolder decisions and measurable impact.",
      status: "Paused",
      timestamp: "8:52 AM",
      tag: "Too safe",
      insights: ["Energy flat mid-answer", "No follow-up proof"]
    },
    {
      company: "Big Tech Final Round",
      subject: "Decision",
      preview: "You clearly know the work, confidence just didn't land...",
      body: "You clearly know the work. Confidence and structure just didn't land today once the VP jumped in.",
      status: "Regret",
      timestamp: "Yesterday",
      tag: "Confidence dip",
      insights: ["Monotone under pressure", "Story wandered"]
    },
    {
      company: "Referral Follow up",
      subject: "Quick update",
      preview: "Let's revisit once you've had more live practice...",
      body: "Let's revisit in six months once you've had more time practicing live interviews.",
      status: "Circle back",
      timestamp: "Monday",
      tag: "More reps",
      insights: ["Filler spikes", "Rushed ending"]
    }
  ];

  const painOutcomes = [
    {
      pain: "You freeze once the recorder turns on.",
      outcome: "Kelv drills real prompts so your brain reaches for proof, not panic."
    },
    {
      pain: "Friends are too nice; feedback stays vague.",
      outcome: "Our AI calls out filler words, pacing slips, and weak endings in real time."
    },
    {
      pain: "Every rejection email stings because you know you're qualified.",
      outcome: "We help you ship confident answers so the next email is an offer, not a 'maybe later.'"
    }
  ];

  const userQuotes = [
    "You're qualified. You know your stuff. But interviews make you freeze.",
    "You practice with friends, but they're too nice. You need real feedback."
  ];

  const totalLetters = rejectionLetters.length;

  useEffect(() => {
    if (pauseAutoPlay) {
      const resumeTimer = setTimeout(() => setPauseAutoPlay(false), 6000);
      return () => clearTimeout(resumeTimer);
    }
  }, [pauseAutoPlay]);

  useEffect(() => {
    if (pauseAutoPlay) return;
    const interval = setInterval(() => {
      setActiveEmail(prev => (prev + 1) % totalLetters);
    }, 4500);
    return () => clearInterval(interval);
  }, [pauseAutoPlay, totalLetters]);

  const activeLetter = rejectionLetters[activeEmail];

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-dark-900 via-dark-900 to-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,133,64,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,94,31,0.12),transparent_60%)]" />
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-16 bg-white/5"
            style={{
              left: `${i * 4}%`,
              top: `${(i % 3) * 30}%`,
            }}
            animate={{
              opacity: [0, 0.4, 0],
              scaleY: [0.8, 1.1, 0.9],
              y: [0, 12, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[0.95fr,1.2fr] items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-dark-800/80 border border-dark-700/70 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              <span>What's the pain?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
              Interviews shouldn't feel like roulette.
            </h2>
            <div className="space-y-4">
              {userQuotes.map((quote, index) => (
                <p key={index} className="text-lg text-gray-400 font-light">
                  {quote}
                </p>
              ))}
            </div>
            <div className="space-y-4">
              {painOutcomes.map((item, index) => (
                <div
                  key={index}
                  className="bg-dark-800/70 border border-dark-700/70 rounded-2xl p-4 backdrop-blur"
                >
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Pain</p>
                  <p className="text-white text-lg font-medium mb-2">{item.pain}</p>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Outcome</p>
                  <p className="text-gray-300 text-base">{item.outcome}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="relative max-w-4xl w-full mx-auto">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-dark-800/70 blur" />
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-3 w-12 rounded-full bg-dark-700" />
              <div className="bg-dark-800/70 border border-dark-700 rounded-[32px] p-8 shadow-[0_0_60px_rgba(249,115,22,0.25)]">
                <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide mb-4">
                  <span>Inbox - Reality check</span>
                  <span>{activeLetter.timestamp}</span>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-5/12 space-y-3">
                    {rejectionLetters.map((letter, index) => {
                      const isActive = activeEmail === index;
                      return (
                        <motion.button
                          key={letter.subject}
                          type="button"
                          layout
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                          onMouseEnter={() => setPauseAutoPlay(true)}
                          onFocus={() => setPauseAutoPlay(true)}
                          onClick={() => {
                            setActiveEmail(index);
                            setPauseAutoPlay(true);
                          }}
                          className={`w-full text-left rounded-2xl border px-4 py-3 transition-all duration-300 ${
                            isActive ? 'border-orange-500/70 bg-orange-500/10 shadow-lg shadow-orange-500/20' : 'border-dark-700/70 bg-dark-900/50 hover:border-orange-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500">
                            <span>{letter.company}</span>
                            <span className="text-orange-400">{letter.tag}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-dark-700 text-gray-400'}`}>
                              {letter.company.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white">{letter.subject}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{letter.preview}</p>
                            </div>
                            <div className="text-[10px] text-gray-500">{letter.timestamp}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex-1 lg:w-7/12 bg-dark-900/70 border border-dark-700/70 rounded-2xl p-6 md:p-8 backdrop-blur relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(14)].map((_, i) => (
                        <motion.div
                          key={`scan-${i}`}
                          className="absolute w-32 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
                          style={{
                            top: `${(i / 14) * 100}%`,
                            left: `${(i % 2) * 40}%`
                          }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            x: [0, 30, 0]
                          }}
                          transition={{
                            duration: 4 + i * 0.2,
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                      {[...Array(25)].map((_, i) => (
                        <motion.div
                          key={`spark-${i}`}
                          className="absolute w-1 h-1 rounded-full bg-orange-500/30"
                          style={{
                            left: `${(i * 17) % 100}%`,
                            top: `${(i * 29) % 100}%`
                          }}
                          animate={{
                            opacity: [0, 0.7, 0],
                            scale: [0.5, 1.2, 0.5]
                          }}
                          transition={{
                            duration: 3 + (i % 5) * 0.3,
                            repeat: Infinity,
                            delay: i * 0.12
                          }}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeLetter.subject}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="relative"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide mb-2">
                          <span>{activeLetter.company}</span>
                          <span>{activeLetter.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">{activeLetter.subject}</p>
                        <p className="text-2xl text-white font-semibold mt-4 leading-snug">
                          "{activeLetter.body}"
                        </p>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700/60">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Signal</p>
                            <p className="text-white text-lg font-semibold">Delivery</p>
                            <p className="text-gray-400 text-sm">Confidence dipped once follow-up hit.</p>
                          </div>
                          <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700/60">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Next rep</p>
                            <p className="text-white text-lg font-semibold">Rewrite closer</p>
                            <p className="text-gray-400 text-sm">Kelv rebuilds the ending with receipts.</p>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {activeLetter.insights.map((insight, index) => (
                            <span
                              key={index}
                              className="text-xs text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                            >
                              {insight}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="h-6 rounded-b-[32px] bg-dark-700/80 border border-dark-700 border-t-0" />
              <div className="w-32 h-2 rounded-full bg-dark-700/70 mx-auto mt-3" />
            </div>
          </motion.div>
        </div>
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
      title: "AI mock interviews",
      description: "Kelv listens like a hiring manager and tells you, word-for-word, what landed and what didn't.",
      pain: "You start strong, then ramble the second they interrupt or ask you to go deeper.",
      outcome: "Kelv calls out filler words, shaky tone, and missing receipts in real time so you reset before the next round.",
      proof: ["Live filler tracker", "Pace + clarity radar", "Follow-up prompts"],
      color: "orange"
    },
    {
      icon: SparklesIcon,
      title: "Confidence intelligence",
      description: "See the exact moment your voice drops, your eyes dart, or your story loses punch.",
      pain: "You can't tell if you sound confident or just hopeful.",
      outcome: "Energy, tone, and eye-contact insights show you what the recruiter actually hears.",
      proof: ["Tone timeline", "Energy scorecards", "Camera reminders"],
      color: "blue"
    },
    {
      icon: CheckCircleIcon,
      title: "Story coach",
      description: "Turn messy answers into tight, evidence-backed narratives.",
      pain: "Your stories wander, miss metrics, or never stick the landing.",
      outcome: "Kelv rebuilds your answer with STAR-style beats and receipts you can deliver on command.",
      proof: ["Auto STAR outline", "Impact prompts", "Next-question prep"],
      color: "orange"
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
            We fix the moments that cost you offers
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
            AI mock interviews that give you brutally honest feedback on what you're doing wrong and the proof when you finally nail it.
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
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pain</p>
                      <p className="text-white/90">{feature.pain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outcome</p>
                      <p className="text-gray-300">{feature.outcome}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-dark-700/70">
                    {feature.proof.map((item, i) => (
                      <motion.span
                        key={i}
                        className="text-xs text-gray-400 bg-dark-700/60 px-3 py-1 rounded-full"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        {item}
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
      title: "Pinpoint where you freeze",
      description: "Select your role, target company, and the question themes that trip you up.",
      outcome: "Kelv auto-loads real prompts, recruiter follow-ups, and rubrics from recent interviews.",
      statLabel: "Setup",
      statValue: "45s intake"
    },
    {
      number: "02",
      title: "Run a live mock interview",
      description: "Answer out loud while the AI interviewer challenges you, interrupts, and drills deeper.",
      outcome: "You hear exactly what you sounded like - pacing, tone, filler words, and missed receipts.",
      statLabel: "Session",
      statValue: "Real-time"
    },
    {
      number: "03",
      title: "Get receipts-backed feedback",
      description: "Kelv timestamps the wobbly parts, rewrites your story with metrics, and suggests stronger endings.",
      outcome: "You leave with a script you can actually deliver, not generic tips.",
      statLabel: "Report",
      statValue: "Instant"
    },
    {
      number: "04",
      title: "Prove the progress",
      description: "Track confidence, clarity, and filler words every session.",
      outcome: "Watch your scores climb and send proof to mentors, recruiters, or your own hype folder.",
      statLabel: "Evidence",
      statValue: "+27% avg confidence"
    }
  ];

  const totalSteps = steps.length;
  const [activeStep, setActiveStep] = useState(0);
  const [stepPaused, setStepPaused] = useState(false);
  const stepProgress = totalSteps > 1 ? (activeStep / (totalSteps - 1)) * 100 : 0;

  useEffect(() => {
    if (stepPaused) {
      const resumeTimer = setTimeout(() => setStepPaused(false), 7000);
      return () => clearTimeout(resumeTimer);
    }
  }, [stepPaused]);

  useEffect(() => {
    if (stepPaused) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % totalSteps);
    }, 5000);
    return () => clearInterval(interval);
  }, [stepPaused, totalSteps]);

  return (
    <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-dark-900 to-dark-800">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,120,60,0.12),transparent_60%)]" />
        <div className="absolute inset-x-0 top-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
            The Kelv challenge flow
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
            From panic to proof in under 15 minutes. Practice real interviews, get objective feedback, build evidence-based confidence.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute left-8 top-0 bottom-0 pointer-events-none">
            <div className="w-px h-full bg-gradient-to-b from-orange-500/40 via-orange-500/5 to-transparent relative overflow-visible">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, top: `${stepProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ top: `${stepProgress}%` }}
                className="absolute -left-[6px] w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
              />
            </div>
          </div>
          <div className="space-y-10">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => {
                    setActiveStep(index);
                    setStepPaused(true);
                  }}
                  className={`relative bg-dark-900/70 border rounded-3xl p-6 md:pl-20 shadow-[0_0_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${
                    isActive ? 'border-orange-500/60 bg-orange-500/5' : 'border-dark-700/60'
                  }`}
                >
                  <motion.div
                    layout
                    className={`hidden md:flex absolute left-6 top-8 z-10 w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-dark-900 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
                        : 'bg-dark-800 text-orange-300 border-orange-500/40'
                    }`}
                  >
                    {step.number}
                  </motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isActive ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-t-3xl"
                  />
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Step {step.number}</p>
                      <h3 className="text-2xl font-semibold text-white mt-2">{step.title}</h3>
                      <p className="text-lg text-gray-400 mt-2 leading-relaxed">{step.description}</p>
                    </div>
                    <div className="md:w-60">
                      <div className={`bg-dark-800/80 border rounded-2xl p-4 transition-colors ${
                        isActive ? 'border-orange-500/50' : 'border-dark-700'
                      }`}>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{step.statLabel}</p>
                        <p className="text-white text-xl font-semibold">{step.statValue}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-4">Outcome</p>
                        <p className="text-orange-400 text-sm mt-1 leading-relaxed">{step.outcome}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const waitlist = document.getElementById('waitlist');
              waitlist?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-full font-semibold shadow-lg shadow-orange-500/30"
          >
            Book a beta spot
          </motion.button>
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
            From shaky answers to receipts
          </h2>
          <p className="text-xl text-gray-400 font-light max-w-3xl mx-auto">
            Give us 4 weeks and we cut the filler words, double your confidence, and help you walk into interviews with proof.
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
            className="bg-dark-800 rounded-2xl p-8 border border-orange-500/30 relative"
          >
            <div className="absolute top-6 right-6">
              <SparklesIcon className="w-6 h-6 text-orange-400" />
            </div>

            <div className="text-center mb-6">
              <span className="text-orange-400 text-2xl font-semibold">AFTER</span>
            </div>
            <div className="space-y-6">
              <p className="text-gray-200 font-medium text-lg">"I led a team of 8 engineers..."</p>

              <div className="space-y-4">
                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Confidence</span>
                    <span className="text-orange-400 font-semibold text-2xl">
                      <AnimatedCounter value={92} suffix="%" />
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-orange-500 h-2 rounded-full"
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
                    <span className="text-orange-400 font-semibold text-2xl">
                      <AnimatedCounter value={2} suffix="/min" duration={1.5} />
                    </span>
                  </div>
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-light">Speech Rate</span>
                    <span className="text-orange-400 font-semibold text-2xl">
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
            className="text-4xl md:text-6xl font-semibold text-white mb-12"
          >
            See how you actually interview
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <WaitlistForm />
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

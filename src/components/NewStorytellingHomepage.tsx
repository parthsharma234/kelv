import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import StorytellingHero from './StorytellingHero';
import ProblemStatement from './ProblemStatement';
import KelvAIWorkDemo from './KelvAIWorkDemo';

const StorytellingHomepage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [currentChapter, setCurrentChapter] = useState(0);
  
  // Waitlist state
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [formData, setFormData] = useState({ email: '', name: '', role: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  
  const { signUp, isConfigured } = useAuth();

  // Transform values for parallax effects
  const storyY = useTransform(scrollYProgress, [0.2, 0.8], [50, -50]);
  const finalY = useTransform(scrollYProgress, [0.8, 1], [50, 0]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const chapterHeight = viewportHeight;
      
      const newChapter = Math.floor(scrollTop / chapterHeight);
      setCurrentChapter(Math.min(newChapter, 4));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch waitlist count from Supabase
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: totalUsers, error } = await supabase
            .rpc('get_user_count');
          
          if (!error && totalUsers) {
            setWaitlistCount(totalUsers);
          } else {
            // Fallback count if RPC fails
            setWaitlistCount(2847);
          }
        } catch (error) {
          console.error('Error fetching waitlist count:', error);
          setWaitlistCount(2847); // Fallback
        }
      } else {
        setWaitlistCount(2847); // Fallback when Supabase not configured
      }
      setIsLoadingCount(false);
    };

    fetchWaitlistCount();
  }, []);

  // Handle waitlist form submission
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    setFormError('');

    if (!formData.email || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address');
      setFormStatus('error');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Please enter your name');
      setFormStatus('error');
      return;
    }

    try {
      if (isConfigured) {
        // Use Supabase authentication for waitlist signup
        const tempPassword = Math.random().toString(36).slice(-12);
        const { error: authError } = await signUp(
          formData.email,
          tempPassword,
          formData.name
        );

        if (authError) {
          if (authError.message.includes('User already registered')) {
            setFormError('You\'re already on our waitlist!');
          } else {
            throw authError;
          }
        } else {
          setFormStatus('success');
          // Update waitlist count
          setWaitlistCount(prev => prev + 1);
          return;
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.');
      setFormStatus('error');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Chapter 1: Intro Hero - Kelv AI is Here */}
      <StorytellingHero />
      
      {/* Chapter 2: Problem Statement - Interviews are Terrifying */}
      <ProblemStatement />

      {/* Chapter 3: Sticky Visual Module - See Kelv AI Work (The Magic) */}
      <KelvAIWorkDemo />

      {/* Chapter 4: How It Works - Your 30-Day Journey */}
      <section id="journey" className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
        <motion.div 
          style={{ y: storyY }}
          className="container mx-auto text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-16"
          >
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-white">Your</span>{" "}
                <span className="gradient-text">30-Day Journey</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                From nervous candidate to confident interviewer in four simple steps
              </p>
            </div>

            {/* Timeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  step: 1,
                  title: "You Speak",
                  description: "Practice with our AI interviewer",
                  icon: "🎤",
                  color: "from-blue-500 to-blue-600"
                },
                {
                  step: 2,
                  title: "AI Analyzes",
                  description: "Real-time processing of your performance",
                  icon: "🧠",
                  color: "from-purple-500 to-purple-600"
                },
                {
                  step: 3,
                  title: "You Improve",
                  description: "Personalized feedback and coaching",
                  icon: "📈",
                  color: "from-orange-500 to-orange-600"
                },
                {
                  step: 4,
                  title: "You Master",
                  description: "Achieve interview confidence",
                  icon: "🏆",
                  color: "from-green-500 to-green-600"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-dark-800 rounded-2xl p-6 border border-gray-700 hover:border-orange-500/30 transition-all duration-300 h-full">
                    <motion.div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 text-2xl`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.icon}
                    </motion.div>
                    
                    <div className="text-sm text-orange-400 font-medium mb-2">
                      Step {item.step}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-400">
                      {item.description}
                    </p>

                    {/* Progress indicator */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                      className={`h-1 bg-gradient-to-r ${item.color} rounded-full mt-4`}
                    />
                  </div>

                  {/* Connection line (not for last item) */}
                  {index < 3 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.2 + 1 }}
                      className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 border-2 border-orange-500 rounded-full bg-dark-900 flex items-center justify-center z-10"
                    >
                      <ArrowRight className="w-4 h-4 text-orange-500" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Interactive Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="mt-12"
            >
              <motion.a
                href="#social-proof"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-full font-medium transition-all duration-300 group shadow-lg shadow-orange-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-3">Join the Journey</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Chapter 5: Social Proof - Join 2,847 Future Leaders */}
      <section id="social-proof" className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800">
        <motion.div 
          style={{ y: finalY }}
          className="container mx-auto text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-12"
          >
            {/* Title with real-time counter */}
            <div>
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="text-4xl md:text-6xl font-bold mb-6"
              >
                <span className="text-white">Join</span>{" "}
                <motion.span
                  className="gradient-text"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isLoadingCount ? '...' : waitlistCount.toLocaleString()}
                </motion.span>{" "}
                <span className="text-white">Future Leaders</span>
              </motion.h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                FOMO + Community + Exclusivity = Your competitive advantage
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { metric: "97%", label: "felt more prepared after 1 week", color: "text-green-400" },
                { metric: "73%", label: "average confidence increase", color: "text-orange-400" },
                { metric: `${waitlistCount.toLocaleString()}`, label: "candidates already waiting", color: "text-blue-400" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: index * 0.2 + 0.3 }}
                    className={`text-4xl md:text-5xl font-bold ${item.color} mb-2`}
                  >
                    {item.metric}
                  </motion.div>
                  <p className="text-gray-300">{item.label}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <motion.button
                onClick={() => {
                  window.scrollTo({
                    top: 5 * window.innerHeight,
                    behavior: 'smooth'
                  });
                }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-full font-medium transition-all duration-300 group shadow-lg shadow-orange-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-3">Secure Your Spot</span>
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Chapter 6: Enhanced Waitlist Section - Your Better Version */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-900 via-orange-900/10 to-dark-800">
        {/* Premium floating particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-orange-500/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div 
          style={{ y: finalY }}
          className="container mx-auto z-10 max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-3xl blur opacity-60 animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-dark-800/90 via-dark-700/90 to-dark-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-orange-500/20">
              {/* Premium badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  ✨ Early Access
                </div>
              </div>

              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl md:text-4xl font-bold text-white">
                    Secure Your Spot
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Limited early access. Join{' '}
                    <motion.span 
                      className="text-orange-500 font-semibold"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {isLoadingCount ? (
                        <span className="inline-flex items-center gap-1">
                          <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        waitlistCount.toLocaleString()
                      )}
                    </motion.span>{' '}
                    candidates already on the list.
                  </p>
                </div>

                {/* Enhanced Waitlist Form */}
                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  
                  {formStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-green-400 text-center"
                    >
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold">Welcome to the future!</p>
                      <p className="text-sm text-gray-300 mt-1">Redirecting you to your dashboard...</p>
                    </motion.div>
                  )}
                  
                  {formStatus !== 'success' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-4 bg-dark-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                            disabled={formStatus === 'loading'}
                          />
                        </div>
                        <div className="space-y-2">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-4 bg-dark-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                            disabled={formStatus === 'loading'}
                          />
                        </div>
                      </div>
                      
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-4 bg-dark-900/50 border border-gray-600 rounded-xl text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                        disabled={formStatus === 'loading'}
                      >
                        <option value="">What's your target role?</option>
                        <option value="software">Software Engineer</option>
                        <option value="product">Product Manager</option>
                        <option value="data">Data Scientist</option>
                        <option value="marketing">Marketing</option>
                        <option value="consulting">Consulting</option>
                        <option value="finance">Finance</option>
                        <option value="other">Other</option>
                      </select>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: formStatus === 'loading' ? 1 : 1.02, boxShadow: "0 10px 40px rgba(255,107,53,0.3)" }}
                        whileTap={{ scale: formStatus === 'loading' ? 1 : 0.98 }}
                        disabled={formStatus === 'loading'}
                        className={`w-full py-4 px-8 rounded-xl font-semibold text-lg shadow-xl transition-all duration-300 ${
                          formStatus === 'loading'
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50'
                        }`}
                      >
                        {formStatus === 'loading' ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Joining Waitlist...
                          </div>
                        ) : (
                          '🚀 Join the Waitlist'
                        )}
                      </motion.button>
                    </>
                  )}
                </form>

                {/* Benefits Grid */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-700">
                  {[
                    { icon: "⚡", text: "Early Access" },
                    { icon: "🎯", text: "Free Trial" },
                    { icon: "💎", text: "Premium Support" }
                  ].map((benefit, index) => (
                    <motion.div
                      key={benefit.text}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                      className="text-center space-y-2"
                    >
                      <div className="text-2xl">{benefit.icon}</div>
                      <p className="text-sm text-gray-400">{benefit.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm mt-8"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>
                  {isLoadingCount ? 'Loading...' : `${waitlistCount.toLocaleString()} candidates waiting`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span>Launch: Coming Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>100% Free Early Access</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {formStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-8 border border-gray-700 max-w-md mx-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Welcome to the Future!</h3>
              <p className="text-gray-400 mb-6">
                You're now on the Kelv AI waitlist. We'll notify you when we launch!
              </p>
              
              <button
                onClick={() => setFormStatus('idle')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-medium transition-colors"
              >
                Continue Exploring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Indicators */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((chapter) => (
          <motion.button
            key={chapter}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentChapter === chapter ? 'bg-orange-500 scale-125' : 'bg-gray-600'
            }`}
            whileHover={{ scale: 1.2 }}
            onClick={() => {
              window.scrollTo({
                top: chapter * window.innerHeight,
                behavior: 'smooth'
              });
            }}
          />
        ))}
      </div>

      {/* Final CTA Popup (appears at the very end) */}
      <AnimatePresence>
        {currentChapter >= 5 && formStatus !== 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-2xl shadow-orange-500/30 max-w-sm z-40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Ready to Transform?</h4>
                <p className="text-sm opacity-90">Join {waitlistCount.toLocaleString()} others</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.scrollTo({
                      top: 4 * window.innerHeight,
                      behavior: 'smooth'
                    });
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-400 hover:to-orange-500 transition-all duration-300 shadow-lg shadow-orange-500/30"
                >
                  Join Waitlist
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorytellingHomepage;

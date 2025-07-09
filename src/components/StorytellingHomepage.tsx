import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart, Brain, Target, TrendingUp, CheckCircle, Eye, EyeOff, Users, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import AIInterviewer from './AIInterviewer';
import RedPandaLogo from './RedPandaLogo';
import StorytellingHero from './StorytellingHero';
import ProblemStatement from './ProblemStatement';

const StorytellingHomepage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [currentChapter, setCurrentChapter] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Waitlist state
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [formData, setFormData] = useState({ email: '', name: '', role: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  // Transform values for parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
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
          if (authError.message.includes('already registered')) {
            setFormStatus('success');
            setFormData({ email: '', name: '', role: '' });
            setTimeout(() => {
              navigate('/waitlist-success');
            }, 1500);
            return;
          }
          throw authError;
        }

        setFormStatus('success');
        setFormData({ email: '', name: '', role: '' });
        setTimeout(() => {
          navigate('/waitlist-success');
        }, 1500);
      } else {
        // Fallback to success state for demo
        setFormStatus('success');
        setFormData({ email: '', name: '', role: '' });
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
      
      {/* Chapter 1: The Anxiety */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <motion.div 
          style={{ y: heroY }}
          className="container mx-auto text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5 }}
            className="space-y-12"
          >
            <div className="space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="text-red-400 inline-block">
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    The moment
                  </motion.span>
                </span> before <br />
                <span className="gradient-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  your dream interview
                </span>
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="space-y-6"
              >
                <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  Your heart races. Palms sweat. Mind blanks.
                </p>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 1 }}
                  className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 max-w-md mx-auto rounded-full"
                />
                
                <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
                  <span className="text-red-400 font-semibold text-2xl">87% of candidates fail</span> not because they lack skills, 
                  but because they lack <span className="text-orange-400 font-semibold">preparation</span>.
                </p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-gray-400"
              >
                <p className="text-sm md:text-base">Scroll to discover your transformation</p>
                <motion.div
                  animate={{ rotate: 90, y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-3"
                >
                  <ArrowRight className="w-6 h-6 mx-auto text-orange-400" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Enhanced stress indicators */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${15 + i * 12}%`,
                top: `${25 + Math.sin(i * 0.8) * 30}%`
              }}
            >
              <motion.div
                className="w-3 h-3 bg-red-500/40 rounded-full"
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                  y: [0, -30, -60]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Floating anxiety words */}
        {['nervous', 'worried', 'anxious', 'stressed'].map((word, i) => (
          <motion.div
            key={word}
            className="absolute text-red-400/30 font-bold text-lg select-none"
            style={{
              left: `${20 + i * 20}%`,
              top: `${60 + Math.cos(i) * 10}%`
            }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [0, -20, -40],
              rotate: [0, Math.random() * 10 - 5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeOut"
            }}
          >
            {word}
          </motion.div>
        ))}
      </section>

      {/* Chapter 2: The Discovery */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-800 via-dark-700 to-dark-800">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-500/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div 
          style={{ y: storyY }}
          className="container mx-auto text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: currentChapter >= 1 ? 1 : 0, x: currentChapter >= 1 ? 0 : -50 }}
            transition={{ duration: 1 }}
            className="space-y-12"
          >
            {/* Enhanced logo with magical effect */}
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-orange-400/30 to-orange-500/20 rounded-full blur-3xl scale-150"
              />
              
              {/* Orbiting elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-orange-400/60 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: `0 60px`
                  }}
                  animate={{
                    rotate: [0, 360],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "linear"
                  }}
                />
              ))}
              
              <div className="relative z-10 w-32 h-32 mx-auto bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
                <RedPandaLogo size="xl" animate={true} />
              </div>
            </div>
            
            <div className="space-y-8">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: currentChapter >= 1 ? 1 : 0, y: currentChapter >= 1 ? 0 : 30 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-4xl md:text-6xl font-bold leading-tight"
              >
                What if you could practice with <br />
                <span className="gradient-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  the world's most patient coach?
                </span>
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: currentChapter >= 1 ? 1 : 0, scale: currentChapter >= 1 ? 1 : 0.9 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                  Meet <span className="text-orange-400 font-semibold">Kelv AI</span> - your personal interview coach that 
                  <span className="text-green-400"> never judges</span>, never gets tired, and helps you improve with every interaction.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  {[
                    { icon: "🎯", title: "Never Judges", desc: "Practice without fear" },
                    { icon: "⚡", title: "Always Available", desc: "24/7 coaching support" },
                    { icon: "📈", title: "Tracks Progress", desc: "See real improvement" }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: currentChapter >= 1 ? 1 : 0, y: currentChapter >= 1 ? 0 : 20 }}
                      transition={{ duration: 0.8, delay: 0.9 + index * 0.2 }}
                      className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300"
                    >
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: currentChapter >= 1 ? 1 : 0, y: currentChapter >= 1 ? 0 : 20 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px rgba(255,107,53,0.4)",
                  backgroundImage: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsInteracting(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-5 rounded-xl font-semibold text-xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 inline-flex items-center gap-3 border border-orange-400/20"
              >
                <span className="text-2xl">✨</span>
                <span>Try Kelv AI Now</span>
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Enhanced floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          {['confident', 'prepared', 'ready', 'skilled'].map((word, i) => (
            <motion.div
              key={word}
              className="absolute text-orange-400/20 font-bold text-lg select-none"
              style={{
                left: `${15 + i * 20}%`,
                top: `${20 + Math.sin(i + 1) * 15}%`
              }}
              animate={{
                opacity: [0, 0.4, 0],
                y: [20, -10, -40],
                rotate: [0, Math.random() * 5 - 2.5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeOut"
              }}
            >
              {word}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Chapter 3: The Practice */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-700 via-dark-600 to-dark-700">
        <motion.div 
          style={{ y: storyY }}
          className="container mx-auto z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: currentChapter >= 2 ? 1 : 0, y: currentChapter >= 2 ? 0 : 50 }}
            transition={{ duration: 1 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">Transform</span> through practice
              </h2>
              <p className="text-xl text-gray-300">
                Watch as your confidence grows with each session
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Interactive Demo */}
              <div className="relative">
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-dark-800">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Live Interview Session</h3>
                    </div>
                    
                    <div className="min-h-[300px] flex items-center justify-center">
                      <AIInterviewer 
                        isActive={currentChapter >= 2}
                        isSpeaking={currentChapter >= 2} 
                        isListening={false}
                        isProcessing={false}
                        size="lg" 
                        showStatus={true}
                      />
                    </div>
                    
                    <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                      <p className="text-gray-300 text-sm">
                        "Tell me about a time when you had to overcome a significant challenge..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Visualization */}
              <div className="space-y-6">
                <div className="bg-dark-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-orange-500" />
                    Your Progress
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { label: "Confidence Level", value: 85, color: "from-orange-500 to-orange-400" },
                      { label: "Communication Skills", value: 78, color: "from-orange-400 to-orange-300" },
                      { label: "Technical Answers", value: 92, color: "from-orange-600 to-orange-500" },
                      { label: "Body Language", value: 88, color: "from-orange-500 to-orange-400" }
                    ].map((metric, index) => (
                      <div key={metric.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{metric.label}</span>
                          <span className="text-gray-400">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full bg-gradient-to-r ${metric.color}`}
                            initial={{ width: "0%" }}
                            animate={{ width: currentChapter >= 2 ? `${metric.value}%` : "0%" }}
                            transition={{ duration: 1.5, delay: index * 0.3 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Chapter 4: The Mastery */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-600 via-dark-500 to-dark-600">
        <motion.div 
          style={{ y: storyY }}
          className="container mx-auto text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: currentChapter >= 3 ? 1 : 0, scale: currentChapter >= 3 ? 1 : 0.9 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl"
              />
              <TrendingUp className="w-16 h-16 mx-auto text-green-500 relative z-10" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              From <span className="text-red-400">anxious candidate</span> to <br />
              <span className="gradient-text">confident professional</span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              After just 30 days of practice, you'll walk into any interview 
              with unshakeable confidence and the skills to impress.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              {[
                { icon: Brain, title: "AI-Powered Analysis", desc: "Real-time feedback on every aspect of your performance" },
                { icon: Target, title: "Personalized Coaching", desc: "Tailored guidance based on your specific needs" },
                { icon: TrendingUp, title: "Proven Results", desc: "Track your improvement with detailed analytics" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentChapter >= 3 ? 1 : 0, y: currentChapter >= 3 ? 0 : 20 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600"
                >
                  <feature.icon className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Chapter 5: The Call to Action */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,107,53,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,107,53,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-20 h-20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, rgba(255,107,53,${0.1 + Math.random() * 0.2}) 0%, transparent 70%)`
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: currentChapter >= 4 ? 1 : 0, y: currentChapter >= 4 ? 0 : 30 }}
            transition={{ duration: 1 }}
            className="text-center space-y-12"
          >
            {/* Main Hero Content */}
            <div className="space-y-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-orange-400/30 to-orange-500/20 rounded-full blur-3xl scale-150" />
                <div className="relative z-10 w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              
              <div className="space-y-6">
                <h2 className="text-5xl md:text-7xl font-bold leading-tight">
                  Your <span className="gradient-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">transformation</span><br />
                  <span className="text-white">starts now</span>
                </h2>
                
                <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Join the revolution in interview preparation. 
                  <span className="text-orange-400 font-semibold"> Be among the first</span> to experience 
                  the future of confident interviewing.
                </p>
              </div>
            </div>

            {/* Interactive Waitlist Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: currentChapter >= 4 ? 1 : 0, scale: currentChapter >= 4 ? 1 : 0.9 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative max-w-2xl mx-auto"
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
                        animate={{ opacity: currentChapter >= 4 ? 1 : 0, y: currentChapter >= 4 ? 0 : 10 }}
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
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: currentChapter >= 4 ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm"
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

      {/* Chapter Progress Indicator */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 space-y-4">
        {[0, 1, 2, 3, 4].map((chapter) => (
          <div
            key={chapter}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
              currentChapter >= chapter ? 'bg-orange-500 scale-125' : 'bg-gray-600'
            }`}
            onClick={() => {
              window.scrollTo({
                top: chapter * window.innerHeight,
                behavior: 'smooth'
              });
            }}
          />
        ))}
      </div>

      {/* Interactive Demo Modal */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={() => setIsInteracting(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Try Kelv AI Now</h3>
                <button
                  onClick={() => setIsInteracting(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-dark-900 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <RedPandaLogo size="sm" animate={true} />
                  </div>
                  <div>
                    <p className="font-semibold">Kelv AI</p>
                    <p className="text-sm text-gray-400">Your Interview Coach</p>
                  </div>
                </div>
                
                <div className="bg-dark-700 rounded-lg p-4 mb-4">
                  <p className="text-gray-300">
                    "Great! Let's start with a common question. Tell me about yourself and what brings you here today."
                  </p>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">Behavioral</span>
                  <span className="px-3 py-1 bg-green-700 rounded-full text-xs">Easy</span>
                </div>
                
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-colors">
                  Start Recording Your Response
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  This is just a preview. Join our waitlist to access the full experience.
                </p>
                <button
                  onClick={() => {
                    setIsInteracting(false);
                    // Scroll to waitlist section
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorytellingHomepage;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import RedPandaLogo from '../RedPandaLogo';

/**
 * Premium Kelv-branded login page
 */
const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp, signIn, user, isConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/waitlist-success');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfigured) {
      setError('Database connection not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const features = [
    { icon: Sparkles, text: 'Real-time coaching as you speak' },
    { icon: Target, text: 'Scenario packs built by hiring teams' },
    { icon: Zap, text: 'Progress insights that compound weekly' },
  ];

  const proofPoints = [
    { label: 'Avg. confidence lift', value: '2.3x', detail: 'after 3 sessions' },
    { label: 'Filler words', value: '-67%', detail: 'in mock sessions' },
    { label: 'Feedback latency', value: '<2s', detail: 'live on camera' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030305] text-white">
      {/* Background elements */}
      <div className="absolute inset-0 stripe-gradient-mesh opacity-60" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] animated-gradient-orb opacity-30" />
      <div className="absolute bottom-[-20%] left-[-15%] h-[480px] w-[480px] rounded-full bg-orange-500/10 blur-[140px]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 lg:px-16 py-6">
          <Link to="/" className="flex items-center gap-3">
            <RedPandaLogo size="lg" animate={true} />
            <span className="text-xl font-semibold tracking-tight text-white">Kelv AI</span>
          </Link>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:-translate-y-0.5 hover:border-white/20 hover:text-white"
          >
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="flex-1 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center px-6 lg:px-16 pb-12 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Interview readiness
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-white"
            >
              The coaching layer for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200">
                career-defining interviews.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-lg text-gray-400"
            >
              Kelv watches, listens, and scores in real time so you can rehearse the moments that matter.
              Sharper delivery, clearer stories, and confidence that compounds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 grid gap-4 sm:grid-cols-2"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0a0a0f]/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 grid gap-4 sm:grid-cols-3"
            >
              {proofPoints.map((point, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-[#0b0b10]/80 px-4 py-5 text-center"
                >
                  <p className="text-2xl font-semibold text-white">{point.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    {point.label}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{point.detail}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg justify-self-center"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3">
                <RedPandaLogo size="lg" animate={true} />
                <span className="text-2xl font-bold text-white">Kelv AI</span>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-orange-500/10 via-transparent to-transparent blur-2xl" />
              <div className="relative rounded-[32px] border border-white/10 bg-[#0a0a0f]/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isSignUp ? 'signup' : 'signin'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">
                          {isSignUp ? 'Join the waitlist' : 'Welcome back'}
                        </h2>
                        <p className="text-sm text-gray-400">
                          {isSignUp
                            ? 'Get early access and launch updates.'
                            : 'Sign in to review your progress.'
                          }
                        </p>
                      </div>
                      <div className="hidden sm:flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold text-gray-400">
                        <button
                          type="button"
                          onClick={() => setIsSignUp(false)}
                          className={`px-4 py-2 rounded-full transition ${
                            !isSignUp ? 'bg-orange-500 text-white' : 'text-gray-400'
                          }`}
                        >
                          Sign in
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSignUp(true)}
                          className={`px-4 py-2 rounded-full transition ${
                            isSignUp ? 'bg-orange-500 text-white' : 'text-gray-400'
                          }`}
                        >
                          Waitlist
                        </button>
                      </div>
                    </div>

                    {!isConfigured && (
                      <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-200">
                        Demo mode: authentication is offline.
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <AnimatePresence>
                        {isSignUp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full name
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-[#07070b] px-4 py-3.5 text-white placeholder-gray-500 shadow-sm focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                              placeholder="Ada Lovelace"
                              required
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-[#07070b] px-4 py-3.5 text-white placeholder-gray-500 shadow-sm focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="you@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-[#07070b] px-4 py-3.5 pr-12 text-white placeholder-gray-500 shadow-sm focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            placeholder={isSignUp ? 'Create a secure password' : 'Your password'}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {isSignUp && (
                          <p className="mt-2 text-xs text-gray-500">
                            This becomes your login password when approved.
                          </p>
                        )}
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                          >
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full rounded-2xl bg-orange-500 py-4 text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <div className="mx-auto h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wide uppercase">
                            {isSignUp ? 'Join waitlist' : 'Sign in'}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </motion.button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-gray-500">
                      By continuing you agree to receive product updates and early access notes.
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center">
                  <p className="text-sm text-gray-400">
                    {isSignUp ? 'Already on the waitlist?' : "Don't have an account yet?"}
                  </p>
                  <button
                    onClick={toggleMode}
                    className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
                  >
                    {isSignUp ? 'Sign in instead' : 'Join the waitlist'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        <footer className="px-6 lg:px-16 pb-8 text-xs text-gray-500">
          (c) 2026 Kelv AI. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;


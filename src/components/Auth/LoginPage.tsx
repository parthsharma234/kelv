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
    { icon: Sparkles, text: 'AI-powered feedback on every answer' },
    { icon: Target, text: 'Practice with real interview scenarios' },
    { icon: Zap, text: 'Track your progress over time' },
  ];

  return (
    <div className="min-h-screen bg-[#030305] flex relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-400/5 rounded-full blur-[120px]" />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <RedPandaLogo size="lg" animate={true} />
          <span className="text-2xl font-bold text-white">Kelv AI</span>
        </Link>

        {/* Main content */}
        <div className="max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-white leading-tight mb-6"
          >
            Interview prep that{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              actually works.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-400 mb-12"
          >
            Join thousands preparing smarter with AI that watches, listens, and coaches you to interview success.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-gray-300">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-sm">
          © 2024 Kelv AI. All rights reserved.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <RedPandaLogo size="lg" animate={true} />
              <span className="text-2xl font-bold text-white">Kelv AI</span>
            </Link>
          </div>

          {/* Form card */}
          <div className="bg-dark-800/60 backdrop-blur-xl rounded-3xl border border-dark-700/50 p-8 shadow-2xl shadow-black/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    {isSignUp ? 'Join the Waitlist' : 'Welcome back'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isSignUp
                      ? 'Get early access when we launch'
                      : 'Sign in to check your status'
                    }
                  </p>
                </div>

                {/* Configuration warning */}
                {!isConfigured && (
                  <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm text-center">
                    Demo mode
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name field (sign up only) */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3.5 bg-dark-900/80 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                          placeholder="Your name"
                          required
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-dark-900/80 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="you@email.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pr-12 bg-dark-900/80 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        placeholder={isSignUp ? 'Create a password' : 'Your password'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {isSignUp && (
                      <p className="mt-2 text-xs text-gray-500">
                        This will be your login password once approved.
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? 'Join Waitlist' : 'Sign In'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </AnimatePresence>

            {/* Toggle mode */}
            <div className="mt-8 pt-6 border-t border-dark-700/50 text-center">
              <p className="text-gray-400 text-sm">
                {isSignUp ? 'Already on the waitlist?' : "Don't have an account?"}
              </p>
              <button
                onClick={toggleMode}
                className="mt-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                {isSignUp ? 'Sign in instead' : 'Join the waitlist'}
              </button>
            </div>
          </div>

          {/* Mobile footer */}
          <p className="lg:hidden text-center text-gray-500 text-xs mt-6">
            © 2024 Kelv AI. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
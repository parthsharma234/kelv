import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Brain, Target, ArrowRight, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

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
        // User will be redirected by useEffect when user state updates
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // User will be redirected by useEffect when user state updates
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
    setFocusedField('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  // Floating particles for background animation
  const particles = Array.from({ length: 15 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-white/20 rounded-full"
      initial={{
        x: Math.random() * 400,
        y: Math.random() * 600,
      }}
      animate={{
        x: Math.random() * 400,
        y: Math.random() * 600,
      }}
      transition={{
        duration: Math.random() * 20 + 10,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Back to home link */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-all duration-300 z-10 group"
      >
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="relative"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 relative overflow-hidden group-hover:shadow-orange-500/50 transition-all">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute top-3 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute top-1.5 left-1.5 w-6 h-0.5 bg-white/30 rotate-45 origin-left"></div>
              <div className="absolute top-3.5 left-3 w-4 h-0.5 bg-white/30 -rotate-45 origin-left"></div>
            </div>
            <div className="relative z-10 w-5 h-5 border-2 border-white rounded-lg flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full"
          />
        </motion.div>
        <span className="text-xl font-bold group-hover:text-orange-400 transition-colors">Kelv AI</span>
      </Link>

      {/* Configuration warning */}
      {!isConfigured && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3 text-yellow-400 z-10">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Demo mode - Database not configured</span>
        </div>
      )}

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-dark-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden min-h-[650px] flex border border-dark-700/50"
      >
        {/* Form Panel */}
        <motion.div 
          className={`w-1/2 p-12 flex flex-col justify-center transition-all duration-700 ${isSignUp ? 'order-2' : 'order-1'}`}
          animate={{ x: isSignUp ? 0 : 0 }}
        >
          <motion.div
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-8">
              <motion.h1 
                className="text-4xl font-bold text-white mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isSignUp ? 'Join the Waitlist' : 'Welcome Back'}
              </motion.h1>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {isSignUp ? 'Get early access to AI-powered interview preparation' : 'Continue to your waitlist status'}
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="relative group">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-6 py-4 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                        placeholder="Full Name"
                        required
                      />
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                        animate={{ opacity: focusedField === 'fullName' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="w-full px-6 py-4 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                  placeholder="Email Address"
                  required
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                  animate={{ opacity: focusedField === 'email' ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="w-full px-6 py-4 pr-14 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                  placeholder="Password"
                  required
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                  animate={{ opacity: focusedField === 'password' ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>

              {!isSignUp && (
                <motion.div 
                  className="text-right"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <button type="button" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                    Forgot your password?
                  </button>
                </motion.div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-400 hover:to-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 relative overflow-hidden group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.div 
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {isSignUp ? 'Joining Waitlist...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'Join Waitlist' : 'Sign In'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        {/* Welcome Panel */}
        <motion.div 
          className={`w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden transition-all duration-700 ${isSignUp ? 'order-1' : 'order-2'}`}
          animate={{ x: 0 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {particles}
            <div className="absolute top-10 left-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border border-white/10 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/10 rounded-full animate-pulse delay-500"></div>
            
            {/* Neural network pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute top-32 right-32 w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full"></div>
              {/* Connection lines */}
              <div className="absolute top-20 left-20 w-32 h-0.5 bg-white/30 rotate-45 origin-left"></div>
              <div className="absolute top-32 left-32 w-24 h-0.5 bg-white/30 -rotate-45 origin-left"></div>
            </div>
          </div>

          <motion.div
            key={isSignUp ? 'welcome-signin' : 'welcome-signup'}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-center relative z-10"
          >
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                {isSignUp ? (
                  <Brain className="w-10 h-10 text-white" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white" />
                )}
              </div>
            </motion.div>

            <motion.h2 
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isSignUp ? 'Welcome Back!' : 'Join the Revolution!'}
            </motion.h2>
            
            <motion.p 
              className="text-lg mb-8 opacity-90 leading-relaxed max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {isSignUp 
                ? 'Ready to check your waitlist status and get the latest updates?'
                : 'Be among the first to experience the future of AI-powered interview preparation'
              }
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              className="mb-8 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3 text-sm opacity-80">
                <Target className="w-4 h-4" />
                <span>Early Access Benefits</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-80">
                <Zap className="w-4 h-4" />
                <span>Exclusive Member Pricing</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-80">
                <Brain className="w-4 h-4" />
                <span>Priority Support & Updates</span>
              </div>
            </motion.div>
            
            <motion.button
              onClick={toggleMode}
              className="px-8 py-3 border-2 border-white/80 text-white rounded-full font-semibold hover:bg-white hover:text-orange-600 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isSignUp ? 'SIGN IN' : 'JOIN WAITLIST'}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
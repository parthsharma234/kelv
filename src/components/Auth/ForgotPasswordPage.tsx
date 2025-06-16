import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Key, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import RedPandaLogo from '../RedPandaLogo';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const navigate = useNavigate();

  const { isConfigured } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setStatus('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    if (!isConfigured) {
      setMessage('Supabase is not configured. Password reset is unavailable.');
      setStatus('error');
      return;
    }

    try {
      // First, sign in with the email to verify the user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'temporary-password-for-verification', // This will fail, but that's okay
      });

      // If the error is about invalid credentials, that means the user exists
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        setMessage('Password has been successfully updated! Redirecting to login...');
        setStatus('success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('No account found with this email address.');
        setStatus('error');
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password. Please try again.');
      setStatus('error');
    }
  };

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
        <RedPandaLogo size="md" animate={true} className="group-hover:scale-110 transition-transform" />
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
        className="bg-dark-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden min-h-[650px] flex border border-dark-700/50 relative"
      >
        {/* Form Panel */}
        <motion.div 
          className="w-1/2 p-12 flex flex-col justify-center relative"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              <div className="mb-8">
                <motion.h1 
                  className="text-4xl font-bold text-white mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Reset Password
                </motion.h1>
                <motion.p 
                  className="text-gray-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Enter your email and new password below to reset your account.
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
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
                </motion.div>

                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className="w-full px-6 py-4 pr-14 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                    placeholder="New Password"
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
                </motion.div>

                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField('')}
                    className="w-full px-6 py-4 pr-14 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                    placeholder="Confirm New Password"
                    required
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                    animate={{ opacity: focusedField === 'confirmPassword' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                <AnimatePresence>
                  {status !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
                        status === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'
                      }`}
                    >
                      {status === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-400 hover:to-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 relative overflow-hidden group mt-8"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {status === 'loading' ? (
                      <>
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        Update Password
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex items-center justify-center"
              >
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Welcome Panel */}
        <motion.div
          className="w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {particles}
            <div className="absolute top-10 left-10 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border border-white/10 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/10 rounded-full animate-pulse delay-500"></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="welcome-reset"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="text-center relative z-10 w-full max-w-sm"
            >
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <motion.h2 
                className="text-4xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Secure Your Account
              </motion.h2>
              
              <motion.p 
                className="text-lg mb-8 opacity-90 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Reset your password to ensure your account remains secure and protected
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                className="mb-8 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <Key className="w-4 h-4" />
                  <span>Strong Password Protection</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <Shield className="w-4 h-4" />
                  <span>Secure Account Access</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <Lock className="w-4 h-4" />
                  <span>Protected Personal Data</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage; 
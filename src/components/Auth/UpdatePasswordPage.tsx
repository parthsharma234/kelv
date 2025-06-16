import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase'; // Directly import supabase client

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles session recovery if a reset link is clicked
    // We just need to check if a user is currently logged in after the redirect
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, it means the token might be invalid or expired,
        // or they haven't clicked the link correctly. Redirect to login.
        setMessage('Invalid or expired password reset link. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setStatus('error');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setMessage('Your password has been successfully updated! Redirecting to login...');
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles and blobs - similar to LoginPage */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-dark-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden min-h-[500px] flex border border-dark-700/50 relative max-w-md w-full"
      >
        <motion.div
          className="p-8 md:p-12 flex flex-col justify-center w-full"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <h1 className="text-4xl font-bold text-white mb-3 text-center">
            Set New Password
          </h1>
          <p className="text-gray-400 mb-8 text-center">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                placeholder="New Password"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                animate={{ opacity: password ? 1 : 0 }}
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

            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-4 bg-dark-700/50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-white placeholder-gray-500 transition-all duration-300"
                placeholder="Confirm New Password"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-400/20 opacity-0 pointer-events-none"
                animate={{ opacity: confirmPassword ? 1 : 0 }}
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

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
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

            <motion.button
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)"
              }}
              whileTap={{
                scale: 0.98,
                boxShadow: "0 0 10px rgba(249, 115, 22, 0.2)"
              }}
              type="submit"
              disabled={status === 'loading'}
              className={`py-4 px-6 rounded-lg font-medium text-white bg-orange-500 w-full
                ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-400'}
                transition-colors duration-200 shadow-lg shadow-orange-500/20`}
            >
              <motion.span
                animate={
                  status === 'loading'
                    ? { opacity: [1, 0.5, 1], transition: { repeat: Infinity, duration: 1.5 } }
                    : {}
                }
                className="px-2"
              >
                {status === 'loading' ? 'Updating...' : 'Update Password'}
              </motion.span>
            </motion.button>
          </form>

          {(status === 'success' || status === 'error') && (
            <Link
              to="/login"
              className="mt-8 text-center text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              Back to Login
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordPage; 
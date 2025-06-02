'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface FormData {
  email: string;
  name: string;
}

export default function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>({ email: '', name: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch('https://formspree.io/f/mwpbkloq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ email: '', name: '' });
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-dark-700/50 rounded-lg border border-dark-600 max-w-md mx-auto"
      >
        <CheckCircleIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2 text-white">You're on the list!</h3>
        <p className="text-gray-300">
          Thanks for joining our waitlist. We'll notify you when we launch.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 p-8 md:p-10 bg-dark-800/80 rounded-lg border border-dark-700 backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/30 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold mb-8 text-center text-white">Join the Waitlist</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white placeholder-gray-500"
            placeholder="Your name"
            required
          />
        </div>
        
        <div className="mb-8">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white placeholder-gray-500"
            placeholder="you@example.com"
            required
          />
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
          >
            {error}
          </motion.div>
        )}
        
        <div className="flex justify-center">
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
            className={`py-4 px-6 rounded-lg font-medium text-white bg-orange-500
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
              {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
            </motion.span>
          </motion.button>
        </div>
        
        <p className="text-sm text-gray-400 text-center pt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </motion.div>
  );
}

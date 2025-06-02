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

    // Basic validation
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setStatus('error');
      return;
    }

    try {
      // TODO: Replace with your actual API endpoint
      // const response = await fetch('/api/waitlist', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use Formspree endpoint
      const response = await fetch('https://formspree.io/f/mwpbkloq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ email: '', name: '' });
      } else {
        // Handle Formspree errors
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
        className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700"
      >
        <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
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
      className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 backdrop-blur-sm"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Join the Waitlist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm"
          >
            {error}
          </motion.p>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={status === 'loading'}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 
            ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-600 hover:to-purple-700'}
            transition-all duration-200`}
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </motion.button>
      </form>
    </motion.div>
  );
} 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Full waitlist form with name, email, password
 */
const CTASection: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { signUp, isConfigured } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.name || !formData.password) return;

        setIsLoading(true);
        setError('');

        try {
            if (isConfigured) {
                const { error: authError } = await signUp(formData.email, formData.password, formData.name);
                if (authError) {
                    if (authError.message.includes('already registered')) {
                        setIsSubmitted(true);
                        setTimeout(() => navigate('/waitlist-success'), 1500);
                        return;
                    }
                    throw authError;
                }
                setIsSubmitted(true);
                setTimeout(() => navigate('/waitlist-success'), 1500);
            } else {
                // Fallback
                await fetch('https://formspree.io/f/mwpbkloq', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                setIsSubmitted(true);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="waitlist" className="py-32 bg-[#030305] relative overflow-hidden">
            {/* Gradient mesh */}
            <div className="absolute inset-0 stripe-gradient-mesh opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animated-gradient-orb opacity-20" />

            <div className="relative z-10 max-w-xl mx-auto px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    {/* Headline */}
                    <div className="text-center">
                        <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
                            Stop guessing.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-amber-200">
                                Start interviewing with proof.
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400">
                            Join the waitlist and be first to practice with Kelv when we launch.
                        </p>
                    </div>

                    {/* Full waitlist form */}
                    {!isSubmitted ? (
                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            viewport={{ once: true }}
                            className="bg-dark-800/80 rounded-2xl p-8 border border-dark-700 space-y-5"
                        >
                            {/* Name */}
                            <div>
                                <label htmlFor="cta-name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="cta-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                    className="w-full px-4 py-3.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="cta-email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="cta-email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@email.com"
                                    required
                                    className="w-full px-4 py-3.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="cta-password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="cta-password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a password (min 6 characters)"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3.5 pr-12 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    This will be your login password once approved.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Join waitlist
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>

                            <p className="text-sm text-gray-500 text-center">
                                No spam. Unsubscribe anytime.
                            </p>
                        </motion.form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center p-8 bg-dark-800/80 rounded-2xl border border-dark-700"
                        >
                            <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 mb-4">
                                <Check className="w-5 h-5" />
                                <span>You're on the list!</span>
                            </div>
                            <p className="text-gray-400">Redirecting to your dashboard...</p>
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;

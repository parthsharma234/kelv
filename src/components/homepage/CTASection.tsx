import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-3)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  };

  return (
    <section
      id="waitlist"
      className="section-rule"
      style={{ background: 'var(--bg)' }}
    >
      <div className="feature-section page-outer">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '96px',
            alignItems: 'start',
          }}
        >
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-4)',
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              Early access
            </p>
            <h2 style={{ marginBottom: '20px' }}>
              Ready to see what's actually costing you the room?
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-3)', lineHeight: '1.65', marginBottom: '32px' }}>
              Join the waitlist. We'll send you access when your spot opens — no spam, no newsletter.
            </p>

            <div className="space-y-4">
              {[
                'Live voice + transcript capture',
                'Per-question STAR scoring',
                'Personalized drill queue after every session',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check style={{ width: '14px', height: '14px', color: 'var(--orange)', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-3)' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            {!isSubmitted ? (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '32px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="cta-name" style={labelStyle}>Full name</label>
                  <input
                    type="text"
                    id="cta-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="cta-email" style={labelStyle}>Email</label>
                  <input
                    type="email"
                    id="cta-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="cta-password" style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="cta-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '6px' }}>
                    This will be your login once approved.
                  </p>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '10px 14px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#f87171',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center"
                  style={{ padding: '11px 20px', fontSize: '14px' }}
                >
                  {isLoading ? (
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <>
                      Join waitlist
                      <ArrowRight style={{ width: '14px', height: '14px' }} />
                    </>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-4)', marginTop: '14px' }}>
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '48px 32px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '6px',
                    color: 'rgba(74,222,128,0.9)',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                  You're on the list.
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-4)', marginTop: '8px' }}>
                  Redirecting to your dashboard…
                </p>
                <div style={{ margin: '16px auto 0', width: '18px', height: '18px', border: '2px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

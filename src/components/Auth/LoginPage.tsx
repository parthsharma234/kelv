import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import RedPandaLogo from '../RedPandaLogo';

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
    if (user) navigate('/platform');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail(''); setPassword(''); setFullName(''); setError('');
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
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar strip */}
      <header
        style={{
          height: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--page-outer)',
          borderBottom: '1px solid var(--border)',
          maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <RedPandaLogo size="md" animate={true} />
          <span style={{ fontSize: '15px', fontWeight: 590, color: 'var(--text)', letterSpacing: '-0.01em' }}>Kelv</span>
        </Link>
        <Link
          to="/"
          style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back to home
        </Link>
      </header>

      {/* Main two-column layout */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: brand side */}
        <div
          style={{
            padding: '80px var(--page-outer) 80px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
              Interview intelligence
            </p>
            <h1 style={{ fontSize: 'clamp(32px, 3vw, 48px)', fontWeight: 510, letterSpacing: '-0.022em', lineHeight: 1.08, color: 'var(--text)', marginBottom: '20px' }}>
              Honest feedback before the real interview.
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-3)', lineHeight: '1.65', marginBottom: '48px', maxWidth: '440px' }}>
              Kelv asks the hard questions, listens the way a hiring manager does, and tells you exactly what it heard.
            </p>

            {/* Signal rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', maxWidth: '440px' }}>
              {[
                { num: '01', label: 'Voice analysis', desc: 'Pace, fillers, hesitation — flagged and timestamped.' },
                { num: '02', label: 'Story structure', desc: 'STAR scoring applied to every answer.' },
                { num: '03', label: 'Targeted practice', desc: 'Focused sessions built around your actual weak point.' },
              ].map((item) => (
                <div key={item.num} style={{ background: 'var(--surface)', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '2px', flexShrink: 0 }}>{item.num}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: form side */}
        <div
          style={{
            padding: '80px var(--page-outer) 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ maxWidth: '400px' }}
          >
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '32px', width: 'fit-content' }}>
              {[{ label: 'Sign in', val: false }, { label: 'Join waitlist', val: true }].map((m) => (
                <button
                  key={m.label}
                  onClick={() => { setIsSignUp(m.val); setEmail(''); setPassword(''); setFullName(''); setError(''); }}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: isSignUp === m.val ? 'var(--orange)' : 'var(--surface)',
                    color: isSignUp === m.val ? '#fff' : 'var(--text-3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 510, letterSpacing: '-0.015em', color: 'var(--text)', marginBottom: '6px' }}>
                {isSignUp ? 'Join the waitlist' : 'Welcome back'}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
                {isSignUp ? 'Get early access before the public launch.' : 'Continue where you left off.'}
              </p>
            </div>

            {!isConfigured && (
              <div style={{ marginBottom: '20px', padding: '10px 14px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '6px', fontSize: '13px', color: 'rgba(253,224,71,0.9)' }}>
                Demo mode — authentication offline.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ada Lovelace"
                      required={isSignUp}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="login-email" style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="login-password" style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Create a password (min. 6 chars)' : 'Your password'}
                    required
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '13px', color: '#f87171' }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: '14px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <>
                    {isSignUp ? 'Join waitlist' : 'Sign in'}
                    <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                {isSignUp ? 'Already on the list?' : "Don't have an account?"}
              </span>
              <button
                onClick={toggleMode}
                style={{ fontSize: '13px', color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {isSignUp ? 'Sign in' : 'Join waitlist'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '16px var(--page-outer)', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>© 2026 Kelv. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;

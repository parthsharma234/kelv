import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Calendar, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import RedPandaLogo from './RedPandaLogo';

const WaitlistSuccess: React.FC = () => {
  const { user } = useAuth();
  const [waitlistCount, setWaitlistCount] = useState<number>(2847);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: totalUsers } = await supabase.rpc('get_user_count');
          if (totalUsers) setWaitlistCount(totalUsers);
        } catch {}
      }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
        <Link to="/" style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}>
          ← Back to home
        </Link>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)',
          margin: '0 auto',
          width: '100%',
          padding: '80px var(--page-outer)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '48px', alignItems: 'start' }}>
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Confirmation badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'rgba(74,222,128,0.9)',
                marginBottom: '32px',
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.04em',
              }}
            >
              <Check style={{ width: '12px', height: '12px' }} />
              Waitlist confirmed
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 510, letterSpacing: '-0.022em', lineHeight: 1.05, color: 'var(--text)', marginBottom: '20px' }}>
              {firstName ? `${firstName}, you're on the list.` : "You're on the list."}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-3)', lineHeight: '1.65', maxWidth: '480px', marginBottom: '48px' }}>
              Your spot is locked in. We're opening access in small groups so the experience doesn't get rushed — you'll hear from us directly when your turn comes.
            </p>

            {/* What happens next */}
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                What happens next
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                {[
                  { num: '01', title: 'Build notes', desc: 'Short monthly updates on what shipped and what\'s coming.' },
                  { num: '02', title: 'Invite window', desc: 'We open cohorts in waves for a focused onboarding experience.' },
                  { num: '03', title: 'Beta access', desc: 'Hands-on access plus direct feedback channels with the team.' },
                ].map((step) => (
                  <div key={step.num} style={{ background: 'var(--surface)', padding: '18px 24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', paddingTop: '2px', flexShrink: 0 }}>{step.num}</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px' }}>{step.title}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.5' }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: status card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {/* Status panel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>Your status</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Waitlist members</span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {isLoading ? '…' : waitlistCount.toLocaleString()}
                  </span>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Joined on</span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{joinedDate}</span>
                </div>
              </div>

              {/* Readiness progress */}
              <p style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Cohort readiness
              </p>
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: '35%', background: 'var(--orange)', borderRadius: '2px' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>Prepping onboarding flow and interview packs.</p>
            </div>

            {/* Benefits */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Included with your invite
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { title: 'Early access', desc: 'Before the public launch.' },
                  { title: 'Role packs', desc: 'Role-specific drills as they ship.' },
                  { title: 'Priority updates', desc: 'Cohort invites delivered directly.' },
                  { title: 'Founders pricing', desc: 'Launch pricing locked for you.' },
                ].map((b) => (
                  <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' }}>
                    <Check style={{ width: '12px', height: '12px', color: 'var(--orange)', marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '1px' }}>{b.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '14px 20px',
                background: 'var(--orange)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Explore Kelv
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>

            {user && (
              <Link
                to="/platform"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '14px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--text-2)',
                  textDecoration: 'none',
                }}
              >
                Try the platform
                <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--orange)' }} />
              </Link>
            )}
          </motion.div>
        </div>

        {/* Footer contact */}
        <div style={{ marginTop: '56px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <Mail style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-4)' }}>Questions?</span>
          <a href="mailto:team@kelvai.com" style={{ fontSize: '13px', color: 'var(--orange)', textDecoration: 'none' }}>team@kelvai.com</a>
        </div>
      </main>
    </div>
  );
};

export default WaitlistSuccess;

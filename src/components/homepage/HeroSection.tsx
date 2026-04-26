import React from 'react';
import { motion } from 'framer-motion';
import MockupDashboard from './MockupDashboard';

const HeroSection: React.FC = () => {
  return (
    <section
      className="relative pt-[calc(var(--header-h)+80px)] pb-0 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Faint radial glow behind headline */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,101,26,0.08) 0%, transparent 100%)',
        }}
      />

      <div
        className="relative"
        style={{
          maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)',
          margin: '0 auto',
          padding: '0 var(--page-outer)',
        }}
      >
        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
          style={{ justifyContent: 'center' }}
        >
          <span className="pulse-dot" />
          <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em' }}>
            Early access open
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-center"
          style={{ maxWidth: '860px', margin: '0 auto' }}
        >
          <h1 style={{ marginBottom: '28px' }}>
            Stop guessing.
            <br />
            <span style={{ color: 'var(--orange)' }}>Start proving.</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-3)',
              lineHeight: '1.65',
              maxWidth: '560px',
              margin: '0 auto 40px',
            }}
          >
            Kelv runs your mock interviews and tells you, word-for-word,
            what landed and what cost you the room.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              className="btn-primary"
              onClick={() => {
                document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Request early access
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See how it works →
            </button>
          </motion.div>
        </motion.div>

        {/* Product screenshot — full-width dark frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 glow-orange"
        >
          {/* Browser chrome bar */}
          <div
            className="screenshot-frame"
            style={{ borderRadius: '10px 10px 0 0', borderBottom: 'none' }}
          >
            <div
              className="flex items-center gap-1.5 px-4"
              style={{
                height: '36px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div
                className="flex-1 mx-4 flex items-center justify-center rounded"
                style={{
                  height: '20px',
                  background: 'var(--surface)',
                  maxWidth: '280px',
                  margin: '0 auto',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  app.kelv.ai/platform
                </span>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div style={{ background: 'var(--surface)', minHeight: '420px' }}>
              <MockupDashboard />
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div
            style={{
              height: '120px',
              background: 'linear-gradient(to bottom, transparent, var(--bg))',
              marginTop: '-1px',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Set your target',
    description:
      'Choose your role, industry, and experience level. Kelv tailors questions, follow-ups, and rubrics to match real hiring bar for that seat.',
  },
  {
    num: '02',
    title: 'Run the interview',
    description:
      'Kelv asks real questions, pushes with follow-ups, and captures your voice, timing, and answers in a single loop — no separate recording step.',
  },
  {
    num: '03',
    title: 'Get your receipts',
    description:
      'See exactly what landed, what drifted, and where confidence dropped — timestamped to the second, not just a final score.',
  },
  {
    num: '04',
    title: 'Run the drills',
    description:
      'Kelv queues focused reps on the single gap with the highest leverage. Repeat until the pattern changes.',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="section-rule" style={{ background: 'var(--bg)' }}>
      <div className="feature-section page-outer">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{ marginBottom: '72px', maxWidth: '520px' }}
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
            How it works
          </p>
          <h2>From setup to receipts in 15 minutes.</h2>
        </motion.div>

        {/* Steps grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              style={{
                background: 'var(--surface)',
                padding: '32px 28px',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--orange)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  letterSpacing: '0.06em',
                  marginBottom: '20px',
                }}
              >
                {step.num}
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: '12px', color: 'var(--text)' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.6' }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

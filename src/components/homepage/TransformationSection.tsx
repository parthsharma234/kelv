import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const TransformationSection: React.FC = () => {
  return (
    <section className="section-rule" style={{ background: 'var(--bg)' }}>
      <div className="feature-section page-outer">
        {/* Header row — matches Linear's left/right split */}
        <div
          className="grid"
          style={{ gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px', alignItems: 'start' }}
        >
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
              4.0
            </p>
            <h2>Same story. Different delivery.</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            style={{ fontSize: '16px', color: 'var(--text-3)', lineHeight: '1.65', paddingTop: '40px' }}
          >
            Kelv transforms rambling answers into structured receipts that
            hiring managers remember — without changing what you actually did.
          </motion.p>
        </div>

        {/* Before / After */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ background: 'var(--surface)', padding: '32px' }}
          >
            <p
              style={{
                fontSize: '10px',
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-4)',
                marginBottom: '20px',
              }}
            >
              Before Kelv
            </p>

            <div className="flex items-start gap-3 mb-6">
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User className="w-3.5 h-3.5" style={{ color: 'var(--text-4)' }} />
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0 8px 8px 8px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
                  "Um, yeah so I think… we basically had to do this thing where we needed to improve the process?
                  And I, um, worked with the team and we kind of figured out some stuff and it was like, pretty successful I guess?"
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {['7 filler words', 'No metrics', 'Weak structure', 'Hedging language'].map((issue) => (
                <span
                  key={issue}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '4px',
                    color: '#f87171',
                  }}
                >
                  {issue}
                </span>
              ))}
            </div>

            <div
              className="flex items-center justify-between"
              style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Interview score</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f87171', fontFamily: 'IBM Plex Mono, monospace' }}>47</span>
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            style={{ background: 'var(--surface)', padding: '32px' }}
          >
            <p
              style={{
                fontSize: '10px',
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--orange)',
                marginBottom: '20px',
              }}
            >
              After Kelv
            </p>

            <div className="flex items-start gap-3 mb-6">
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                K
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  background: 'rgba(232,101,26,0.05)',
                  border: '1px solid rgba(232,101,26,0.15)',
                  borderRadius: '0 8px 8px 8px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                  "I led a 4-person team to redesign our checkout flow. We identified a 23% cart abandonment rate,
                  A/B tested 3 solutions, and shipped within 6 weeks — resulting in a $2.1M revenue increase."
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {['Zero fillers', 'Clear metrics', 'STAR structure', 'Confident delivery'].map((strength) => (
                <span
                  key={strength}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(74,222,128,0.9)',
                  }}
                >
                  {strength}
                </span>
              ))}
            </div>

            <div
              className="flex items-center justify-between"
              style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>Interview score</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(74,222,128,0.9)', fontFamily: 'IBM Plex Mono, monospace' }}>89</span>
            </div>
          </motion.div>
        </div>

        {/* Improvement callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center mt-8"
        >
          <span
            style={{
              fontSize: '13px',
              color: 'var(--orange)',
              fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.02em',
            }}
          >
            +42 point improvement after 3 sessions
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default TransformationSection;

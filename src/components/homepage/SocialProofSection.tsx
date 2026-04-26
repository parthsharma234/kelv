import React from 'react';
import { motion } from 'framer-motion';

const points = [
  {
    num: '01',
    title: 'Built around real pressure',
    description:
      'Designed for the moment an answer starts to wobble — not for feel-good generic prep that doesn\'t transfer to the real room.',
  },
  {
    num: '02',
    title: 'Privacy-first by default',
    description:
      'Your recordings stay yours. We process locally where possible and never sell your data or share session content.',
  },
  {
    num: '03',
    title: 'Finishing the loop',
    description:
      'We\'re tightening realism, scoring, and drill quality so the product feels credible before it feels broad.',
  },
];

const SocialProofSection: React.FC = () => {
  return (
    <section className="section-rule" style={{ background: 'var(--bg)' }}>
      <div className="feature-section page-outer">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {points.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              style={{ background: 'var(--surface)', padding: '32px 28px' }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  color: 'var(--text-4)',
                  letterSpacing: '0.06em',
                  marginBottom: '20px',
                }}
              >
                {p.num}
              </p>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                  marginBottom: '10px',
                  lineHeight: 1.3,
                }}
              >
                {p.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.65' }}>
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/* ── Inline product mockups ─────────────────────────────────────────── */

const VoiceMockup: React.FC = () => (
  <div style={{ background: 'var(--surface)', padding: '28px 32px', minHeight: '300px' }}>
    <div className="flex items-start justify-between mb-6">
      <div>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-4)', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>
          Voice analysis · Q3
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Leadership story — time-to-impact</p>
      </div>
      <div className="text-right">
        <p style={{ fontSize: '28px', fontWeight: 600, color: 'var(--orange)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>78</p>
        <p style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>delivery score</p>
      </div>
    </div>

    {/* Waveform */}
    <div className="relative flex items-center gap-px" style={{ height: '64px', marginBottom: '20px' }}>
      {Array.from({ length: 72 }).map((_, i) => {
        const h = 15 + Math.abs(Math.sin(i * 0.4 + 1) * 45) + Math.abs(Math.sin(i * 0.8) * 20);
        const isSpike = i >= 42 && i <= 52;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.min(h, 100)}%`,
              borderRadius: '2px',
              background: isSpike ? 'rgba(232,101,26,0.7)' : 'rgba(255,255,255,0.12)',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          top: '-18px',
          left: '59%',
          fontSize: '9px',
          color: 'var(--orange)',
          background: 'rgba(232,101,26,0.12)',
          border: '1px solid rgba(232,101,26,0.25)',
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'IBM Plex Mono, monospace',
          whiteSpace: 'nowrap',
        }}
      >
        hesitation spike
      </div>
    </div>

    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Pace', value: '142 wpm', ok: true },
        { label: 'Fillers', value: '3 detected', ok: false },
        { label: 'Avg pause', value: '2.1 s', ok: true },
        { label: 'Energy', value: 'Steady', ok: true },
      ].map((m) => (
        <div
          key={m.label}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '10px 12px',
          }}
        >
          <p style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontFamily: 'IBM Plex Mono, monospace' }}>{m.label}</p>
          <p style={{ fontSize: '13px', fontWeight: 500, color: m.ok ? 'var(--text)' : 'var(--orange)' }}>{m.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const StoryMockup: React.FC = () => (
  <div style={{ background: 'var(--surface)', padding: '28px 32px', minHeight: '300px' }}>
    <div className="flex items-start justify-between mb-6">
      <div>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-4)', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>
          Story Coach · STAR analysis
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Q2: Tell me about a time you led a team</p>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {['S', 'T', 'A', 'R'].map((letter, i) => (
          <div
            key={letter}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'IBM Plex Mono, monospace',
              background: i < 3 ? 'rgba(232,101,26,0.15)' : 'rgba(255,255,255,0.04)',
              color: i < 3 ? 'var(--orange)' : 'var(--text-4)',
              border: `1px solid ${i < 3 ? 'rgba(232,101,26,0.3)' : 'var(--border)'}`,
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      {[
        { label: 'Situation', note: 'Clear context set', score: 90, ok: true },
        { label: 'Task', note: 'Role defined', score: 82, ok: true },
        { label: 'Action', note: 'Missing specific steps taken', score: 54, ok: false },
        { label: 'Result', note: 'No metric cited', score: 38, ok: false },
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ width: '68px', fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>{row.label}</span>
          <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${row.score}%`,
                background: row.ok ? 'rgba(34,197,94,0.7)' : 'var(--orange)',
                borderRadius: '2px',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', width: '24px', textAlign: 'right' }}>{row.score}</span>
          <span style={{ fontSize: '10px', color: row.ok ? 'rgba(34,197,94,0.8)' : 'var(--orange)', minWidth: '160px' }}>{row.note}</span>
        </div>
      ))}
    </div>
  </div>
);

const DrillsMockup: React.FC = () => (
  <div style={{ background: 'var(--surface)', padding: '28px 32px', minHeight: '300px' }}>
    <div className="flex items-start justify-between mb-6">
      <div>
        <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-4)', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>
          Drill queue · 3 items
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Based on your last session</p>
      </div>
      <div style={{ padding: '4px 10px', background: 'rgba(232,101,26,0.1)', border: '1px solid rgba(232,101,26,0.2)', borderRadius: '4px', fontSize: '11px', color: 'var(--orange)' }}>
        Next up
      </div>
    </div>

    <div className="space-y-2">
      {[
        { name: 'Interrupt Recovery', dur: '3 min', progress: 0, active: true },
        { name: 'Result framing with metrics', dur: '5 min', progress: 40, active: false },
        { name: 'Closing statement cadence', dur: '2 min', progress: 100, active: false },
      ].map((drill, i) => (
        <div
          key={drill.name}
          style={{
            padding: '14px 16px',
            background: drill.active ? 'rgba(232,101,26,0.06)' : 'var(--surface-2)',
            border: `1px solid ${drill.active ? 'rgba(232,101,26,0.2)' : 'var(--border)'}`,
            borderRadius: '6px',
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '13px', fontWeight: 500, color: drill.active ? 'var(--text)' : 'var(--text-3)' }}>{drill.name}</span>
              {drill.active && (
                <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(232,101,26,0.15)', color: 'var(--orange)', borderRadius: '3px', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>{drill.dur}</span>
          </div>
          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${drill.progress || (drill.active ? 0 : 0)}%`,
                background: drill.progress === 100 ? 'rgba(34,197,94,0.7)' : 'var(--orange)',
                borderRadius: '2px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── Feature data ───────────────────────────────────────────────────── */

const features = [
  {
    num: '1.0',
    label: 'Delivery signal',
    heading: 'Your voice leaks confidence before the answer is finished.',
    description:
      'Kelv tracks filler load, pacing swings, and hesitation in real time — so you see the exact moment your answer lost force, not just a number after the fact.',
    linkText: 'See delivery analysis',
    mockup: <VoiceMockup />,
  },
  {
    num: '2.0',
    label: 'Story coach',
    heading: 'Turn loose anecdotes into evidence a hiring manager can cite.',
    description:
      'Kelv scores STAR structure per question, flags where proof goes thin, and prompts for the metric or decision that makes the story credible.',
    linkText: 'See story scoring',
    mockup: <StoryMockup />,
  },
  {
    num: '3.0',
    label: 'Targeted drills',
    heading: 'Practice the exact gap that cost you the room.',
    description:
      'After each session Kelv identifies the single gap with the highest leverage and builds a focused session around it — then tracks whether it actually improved.',
    linkText: 'See drill queue',
    mockup: <DrillsMockup />,
  },
];

/* ── Section ────────────────────────────────────────────────────────── */

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" style={{ background: 'var(--bg)' }}>
      {features.map((f, i) => (
        <div key={f.num} className="section-rule">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: '-80px' }}
            className="feature-section page-outer"
          >
            {/* Top row: left h2 | right description + link */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: '1fr 1fr',
                gap: '48px',
                marginBottom: '64px',
                alignItems: 'start',
              }}
            >
              <div>
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
                  {f.num}
                </p>
                <h2>{f.heading}</h2>
              </div>

              <div style={{ paddingTop: '40px' }}>
                <p style={{ fontSize: '16px', color: 'var(--text-3)', lineHeight: '1.65', marginBottom: '24px' }}>
                  {f.description}
                </p>
                <a
                  href="#waitlist"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="feature-link"
                >
                  <span className="num">{f.num}</span>
                  {f.linkText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Full-width product screenshot */}
            <div className="screenshot-frame">
              {f.mockup}
            </div>
          </motion.div>
        </div>
      ))}
    </section>
  );
};

export default FeaturesSection;

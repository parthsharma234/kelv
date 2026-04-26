import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';

const tabs = ['Storyline', 'Content', 'Delivery', 'Presence'] as const;
type Tab = typeof tabs[number];

const questions = [
  { q: 'Tell me about a time you led under pressure.', content: 84, delivery: 71, presence: 88, flag: 'delivery' },
  { q: 'Describe a conflict with a stakeholder.', content: 91, delivery: 88, presence: 79, flag: null },
  { q: 'How do you prioritize when everything is urgent?', content: 66, delivery: 82, presence: 83, flag: 'content' },
  { q: 'Walk me through a product decision you regret.', content: 78, delivery: 74, presence: 86, flag: null },
];

const scoreColor = (s: number) => {
  if (s >= 85) return 'rgba(74,222,128,0.85)';
  if (s >= 70) return '#f7f8f8';
  return '#E8651A';
};

const MockupResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Storyline');

  return (
    <div style={{ background: '#0a0b0c', minHeight: '460px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header row */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '9px', color: '#62666d', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>
              Session complete · Behavioral · PM · Mid-level
            </p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#f7f8f8' }}>Interview analysis — April 26, 2026</p>
          </div>

          {/* Score ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {[
              { label: 'Content', score: 80 },
              { label: 'Delivery', score: 79 },
              { label: 'Presence', score: 84 },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: scoreColor(m.score), fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{m.score}</p>
                <p style={{ fontSize: '9px', color: '#62666d', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</p>
              </div>
            ))}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>82</p>
              <p style={{ fontSize: '9px', color: '#62666d', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: activeTab === tab ? 500 : 400,
                color: activeTab === tab ? '#f7f8f8' : '#62666d',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #E8651A' : '2px solid transparent',
                transition: 'color 0.15s',
                marginBottom: '-1px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'Storyline' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}
          >
            <p style={{ fontSize: '10px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Per-question breakdown
            </p>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 80px', gap: '8px', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>Question</span>
              <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', textAlign: 'center' }}>Content</span>
              <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', textAlign: 'center' }}>Delivery</span>
              <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', textAlign: 'center' }}>Presence</span>
              <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', textAlign: 'center' }}>Flag</span>
            </div>
            {questions.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 60px 60px 80px',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: '#111213',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '5px',
                }}
              >
                <p style={{ fontSize: '11px', color: '#8a8f98', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.q}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: scoreColor(row.content), fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>{row.content}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: scoreColor(row.delivery), fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>{row.delivery}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: scoreColor(row.presence), fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>{row.presence}</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {row.flag ? (
                    <span style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(232,101,26,0.1)', border: '1px solid rgba(232,101,26,0.2)', borderRadius: '3px', color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase' }}>
                      {row.flag}
                    </span>
                  ) : (
                    <TrendingUp style={{ width: '12px', height: '12px', color: 'rgba(74,222,128,0.7)' }} />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab !== 'Storyline' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
              <div style={{ background: '#111213', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>What landed</p>
                {['Clear STAR structure', 'Specific metrics cited', 'Confident opening cadence'].map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(74,222,128,0.8)', marginTop: '6px', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#8a8f98', lineHeight: '1.5' }}>{s}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#111213', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Next reps</p>
                {['Reduce filler load by 40%', 'Stronger result quantification', 'Don\'t trail off on endings'].map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E8651A', marginTop: '6px', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#8a8f98', lineHeight: '1.5' }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 16px', background: 'rgba(232,101,26,0.06)', border: '1px solid rgba(232,101,26,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Priority drill</p>
                <p style={{ fontSize: '13px', color: '#f7f8f8', fontWeight: 500 }}>Filler word elimination — 3 min rep</p>
              </div>
              <ArrowRight style={{ width: '14px', height: '14px', color: '#E8651A' }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MockupResults;

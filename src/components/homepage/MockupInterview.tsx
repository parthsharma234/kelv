import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, Clock } from 'lucide-react';
import RedPandaLogo from '../RedPandaLogo';

const transcript = [
  { role: 'kelv', text: 'Tell me about a time you had to lead a project under significant pressure.' },
  { role: 'you',  text: 'At Stripe, I led a 5-person team to migrate our payments pipeline before a hard deadline…' },
  { role: 'kelv', text: 'What was the single biggest obstacle, and how did you make the call to push through it?' },
];

const MockupInterview: React.FC = () => {
  const [msgCount, setMsgCount] = useState(1);
  const [typing, setTyping] = useState(false);
  const [elapsed, setElapsed] = useState(312); // 5:12 into session

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loop = setInterval(() => {
      setTyping(true);
      setTimeout(() => {
        setMsgCount((c) => (c < transcript.length ? c + 1 : 1));
        setTyping(false);
      }, 1200);
    }, 4500);
    return () => clearInterval(loop);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div
      style={{
        background: '#0a0b0c',
        minHeight: '460px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Top status bar */}
      <div
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: '#080909',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8651A', display: 'block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '10px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Live session
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock style={{ width: '10px', height: '10px', color: '#62666d' }} />
          <span style={{ fontSize: '11px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace' }}>{mins}:{secs}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: '#8a8f98', fontFamily: 'IBM Plex Mono, monospace' }}>Q 3 / 8</span>
          <span style={{ fontSize: '10px', color: '#62666d' }}>Behavioral · PM</span>
        </div>
      </div>

      {/* Three-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.7fr', minHeight: 0 }}>
        {/* Left: Transcript */}
        <div
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <p style={{ fontSize: '9px', color: '#62666d', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '16px' }}>Live transcript</p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
            <AnimatePresence mode="popLayout">
              {transcript.slice(0, msgCount).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                >
                  {msg.role === 'kelv' ? (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E8651A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <RedPandaLogo size="sm" animate={typing && i === msgCount - 1} />
                    </div>
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', fontSize: '9px', color: '#8a8f98', fontWeight: 600 }}>
                      A
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '9px', color: msg.role === 'kelv' ? '#E8651A' : '#62666d', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {msg.role === 'kelv' ? 'Kelv' : 'You'}
                    </p>
                    <p style={{ fontSize: '12px', color: msg.role === 'kelv' ? '#d0d6e0' : '#8a8f98', lineHeight: '1.55' }}>
                      {msg.text}
                      {i === msgCount - 1 && typing && (
                        <span style={{ display: 'inline-block', width: '6px', height: '12px', background: '#E8651A', marginLeft: '3px', verticalAlign: 'middle', borderRadius: '1px' }} />
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: AI Interviewer + waveform */}
        <div
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            gap: '16px',
            position: 'relative',
          }}
        >
          {/* Ambient glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, rgba(232,101,26,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <motion.div
              animate={{ scale: typing ? [1, 1.12, 1] : 1, opacity: typing ? [0.15, 0.06, 0.15] : 0.1 }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', border: '1px solid rgba(232,101,26,0.3)' }}
            />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E8651A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <RedPandaLogo size="lg" animate={typing} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8', marginBottom: '2px' }}>Kelv</p>
            <p style={{ fontSize: '10px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>AI INTERVIEWER</p>
          </div>

          {/* Live waveform bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '32px', width: '100%', padding: '0 16px' }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const h = typing
                ? 20 + Math.abs(Math.sin(i * 0.7 + Date.now() / 300)) * 75
                : 8 + Math.abs(Math.sin(i * 0.5)) * 20;
              return (
                <motion.div
                  key={i}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.15, repeat: typing ? Infinity : 0 }}
                  style={{ flex: 1, borderRadius: '1px', background: typing ? '#E8651A' : 'rgba(255,255,255,0.1)' }}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Live metrics */}
        <div
          style={{
            background: '#080909',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {[
            { label: 'Confidence', value: '78%', color: 'rgba(74,222,128,0.8)', pct: 78 },
            { label: 'Pace', value: '142wpm', color: '#8a8f98', pct: 65 },
            { label: 'Fillers', value: '2', color: '#E8651A', pct: 30 },
            { label: 'STAR phase', value: 'Task', color: '#E8651A', pct: null },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
                <span style={{ fontSize: '11px', color: m.color, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{m.value}</span>
              </div>
              {m.pct !== null && (
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    style={{ height: '100%', background: m.color, borderRadius: '1px' }}
                  />
                </div>
              )}
              {m.pct === null && (
                <div style={{ display: 'flex', gap: '3px' }}>
                  {['S', 'T', 'A', 'R'].map((l, li) => (
                    <div key={l} style={{ flex: 1, height: '14px', background: li <= 1 ? 'rgba(232,101,26,0.3)' : 'rgba(255,255,255,0.04)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '7px', color: li <= 1 ? '#E8651A' : '#62666d', fontFamily: 'IBM Plex Mono, monospace' }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          height: '52px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: '#080909',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(232,101,26,0.12)', border: '1px solid rgba(232,101,26,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mic style={{ width: '14px', height: '14px', color: '#E8651A' }} />
        </div>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MicOff style={{ width: '14px', height: '14px', color: '#62666d' }} />
        </div>
        <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer' }}>
          <Square style={{ width: '10px', height: '10px', color: '#f87171' }} />
          <span style={{ fontSize: '11px', color: '#f87171', fontFamily: 'IBM Plex Mono, monospace' }}>End session</span>
        </div>
      </div>
    </div>
  );
};

export default MockupInterview;

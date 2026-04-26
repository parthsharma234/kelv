import React from 'react';
import { ArrowRight, Mic } from 'lucide-react';

const MockupDashboard: React.FC = () => {
  return (
    <div style={{ background: '#0a0b0c', padding: '0', display: 'flex', minHeight: '460px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Left sidebar */}
      <div
        style={{
          width: '200px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {[
          { label: 'Dashboard', active: true },
          { label: 'Sessions' },
          { label: 'Analytics' },
          { label: 'Drill queue' },
          { label: 'Settings' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              color: item.active ? '#f7f8f8' : '#62666d',
              background: item.active ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: '4px',
              margin: '0 8px',
              fontWeight: item.active ? 500 : 400,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '24px 28px', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Interview dashboard
            </p>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#f7f8f8', letterSpacing: '-0.01em', margin: 0 }}>
              Good morning, Alex
            </h3>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#E8651A',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <Mic style={{ width: '12px', height: '12px' }} />
            Start interview
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total sessions', value: '12', sub: '+3 this week' },
            { label: 'Avg score', value: '78', sub: '+8 pts vs last week' },
            { label: 'Day streak', value: '5', sub: 'Keep going' },
            { label: 'Drills done', value: '24', sub: '8 remaining' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#111213',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '12px 14px',
              }}
            >
              <p style={{ fontSize: '9px', color: '#62666d', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '6px' }}>{stat.label}</p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#f7f8f8', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1, marginBottom: '4px' }}>{stat.value}</p>
              <p style={{ fontSize: '9px', color: '#E8651A' }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Latest session card */}
        <div
          style={{
            background: '#111213',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '9px', color: '#62666d', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Latest session · Today</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8', margin: 0 }}>Behavioral · Product Manager · Mid Level</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#E8651A', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1, margin: 0 }}>82</p>
              <p style={{ fontSize: '9px', color: '#62666d', marginTop: '2px' }}>overall score</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: 'Content', score: 85, color: 'rgba(34,197,94,0.7)' },
              { label: 'Delivery', score: 72, color: '#E8651A' },
              { label: 'Presence', score: 89, color: 'rgba(34,197,94,0.7)' },
            ].map((d) => (
              <div key={d.label} style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#8a8f98' }}>{d.label}</span>
                  <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', color: '#8a8f98' }}>{d.score}</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${d.score}%`, height: '100%', background: d.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drill queue preview */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { name: 'Interrupt Recovery', priority: true },
            { name: 'Metric framing', priority: false },
            { name: 'Closing statement', priority: false },
          ].map((drill) => (
            <div
              key={drill.name}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: drill.priority ? 'rgba(232,101,26,0.06)' : '#111213',
                border: `1px solid ${drill.priority ? 'rgba(232,101,26,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px',
              }}
            >
              <p style={{ fontSize: '10px', color: drill.priority ? '#E8651A' : '#8a8f98', fontWeight: 500, margin: 0 }}>{drill.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockupDashboard;

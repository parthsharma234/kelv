import React, { useMemo, useRef, useState } from 'react';

interface QuestionAnalysis {
  summary: string;
  strengths: string[];
  gaps: string[];
  confidenceScore: number;
}

interface TimelineEvent {
  time: number;
  label: string;
  value: number;
  color?: string;
  analysis?: QuestionAnalysis;
}

interface InterviewTimelineProps {
  duration: number;
  events: TimelineEvent[];
}

const HEIGHT = 200;
const WAVE_COLOR = '#FF9800';
const HOVER_COLOR = '#42A5F5';

const SAMPLE_EVENTS = (duration: number): TimelineEvent[] => [
  {
    time: duration * 0.1,
    label: 'Introduction',
    value: 7,
    analysis: {
      summary: 'Clear opening with professional presence. Rapport established early.',
      strengths: ['Clear articulation', 'Professional tone', 'Good rapport building'],
      gaps: ['Background details too brief', 'Needed one concrete example'],
      confidenceScore: 70
    }
  },
  {
    time: duration * 0.25,
    label: 'Technical challenge',
    value: 8,
    analysis: {
      summary: 'Strong problem-solving approach. Demonstrated structured methodology.',
      strengths: ['Multi-approach thinking', 'Basic architecture understanding', 'Acknowledged trade-offs'],
      gaps: ['Algorithm efficiency thin', 'Data security not addressed', 'Scalability assumptions weak'],
      confidenceScore: 80
    }
  },
  {
    time: duration * 0.4,
    label: 'Behavioral question',
    value: 6,
    analysis: {
      summary: 'Relevant experience shared but metrics were missing from the story.',
      strengths: ['STAR structure used', 'Clear communication', 'Relevant context'],
      gaps: ['No quantifiable outcome', 'Impact stayed vague', 'Leadership proof thin'],
      confidenceScore: 60
    }
  },
  {
    time: duration * 0.55,
    label: 'System design',
    value: 9,
    analysis: {
      summary: 'Outstanding architectural thinking with clear trade-off reasoning.',
      strengths: ['Comprehensive scope', 'Scalability considered', 'Security awareness', 'Trade-off articulation'],
      gaps: ['Cost optimization skipped', 'Monitoring not mentioned'],
      confidenceScore: 88
    }
  },
  {
    time: duration * 0.7,
    label: 'Team collaboration',
    value: 7,
    analysis: {
      summary: 'Strong teamwork examples with concrete conflict resolution.',
      strengths: ['Conflict resolution', 'Cross-functional context', 'Leadership examples'],
      gaps: ['Remote team dynamics not addressed', 'Stakeholder framing weak'],
      confidenceScore: 70
    }
  },
  {
    time: duration * 0.85,
    label: 'Candidate questions',
    value: 8,
    analysis: {
      summary: 'Thoughtful questions showing genuine interest in the role and team.',
      strengths: ['Questions showed research', 'Genuine curiosity', 'Cultural awareness'],
      gaps: ['More role-specific technical questions would help', 'Compensation prep missing'],
      confidenceScore: 80
    }
  }
];

export const InterviewTimeline: React.FC<InterviewTimelineProps> = ({ duration, events }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showSample, setShowSample] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const displayDuration = duration || 300;
  const displayEvents = showSample ? SAMPLE_EVENTS(displayDuration) : events;

  const points = useMemo(() => {
    if (!displayEvents.length) return [];
    return displayEvents.map((e) => {
      const x = (e.time / displayDuration) * 1000;
      const normalizedValue = e.value / 10;
      const amplifiedValue = Math.pow(normalizedValue, 0.3);
      const y = HEIGHT - (amplifiedValue * (HEIGHT - 30)) - 15;
      return { x, y, ...e };
    });
  }, [displayEvents, displayDuration]);

  const path = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q ${cpx},${prev.y} ${curr.x},${curr.y}`;
    }
    return d;
  }, [points]);

  const gradientPath = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q ${cpx},${prev.y} ${curr.x},${curr.y}`;
    }
    d += ` L ${points[points.length - 1].x},${HEIGHT} L ${points[0].x},${HEIGHT} Z`;
    return d;
  }, [points]);

  const activeIdx = selectedIdx !== null ? selectedIdx : hoverIdx;
  const activeEvent = activeIdx !== null ? displayEvents[activeIdx] : null;

  if (!events.length && !showSample) {
    return (
      <div className="w-full">
        <div className="w-full bg-[#0f0f12] rounded-2xl p-8 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-1">Performance timeline</h3>
          <p className="text-xs text-gray-500 mb-8">Complete a session to see your performance arc.</p>
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-5">No data yet</p>
            <button
              onClick={() => setShowSample(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 rounded-xl transition-colors"
            >
              Preview sample timeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full bg-[#0f0f12] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Performance timeline
              {showSample && <span className="text-orange-400/70 font-normal ml-2 text-xs">(sample)</span>}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Click any point for the full breakdown</p>
          </div>
          {showSample && (
            <button
              onClick={() => setShowSample(false)}
              className="text-xs text-gray-500 hover:text-white px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
              Hide sample
            </button>
          )}
        </div>

        <svg
          ref={svgRef}
          width={1000}
          height={HEIGHT}
          viewBox={`0 0 1000 ${HEIGHT}`}
          className="w-full rounded-xl"
          style={{
            height: HEIGHT,
            background: 'linear-gradient(135deg, #0a0a0d 0%, #0f0f12 100%)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}
        >
          <defs>
            <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity={0.9} />
              <stop offset="50%" stopColor="#FF5722" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#E91E63" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#FF9800" stopOpacity={0.01} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[2, 4, 6, 8, 10].map(score => {
            const nv = score / 10;
            const av = Math.pow(nv, 0.3);
            const y = HEIGHT - (av * (HEIGHT - 30)) - 15;
            return (
              <g key={score}>
                <line x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,6" />
                <text x="8" y={y - 4} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">{score}</text>
              </g>
            );
          })}

          {gradientPath && <path d={gradientPath} fill="url(#areaGradient)" />}
          {path && <path d={path} stroke="url(#performanceGradient)" strokeWidth="2.5" fill="none" filter="url(#glow)" />}

          {points.map((pt, i) => {
            const isActive = selectedIdx === i || hoverIdx === i;
            const isSelected = selectedIdx === i;
            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 14 : isActive ? 11 : 7}
                  fill={isSelected ? '#FFD700' : isActive ? HOVER_COLOR : WAVE_COLOR}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                  filter="url(#glow)"
                />
                {isActive && (
                  <text x={pt.x} y={pt.y - 18} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                    {pt.value}/10
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="flex justify-between mt-4 px-1">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span key={fraction} className="text-[10px] text-gray-600">
              {fraction === 0 ? 'Start' : fraction === 1 ? 'End' : `${Math.round(fraction * 100)}%`}
            </span>
          ))}
        </div>
      </div>

      {activeEvent && (
        <div className="bg-[#0f0f12] border border-white/8 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-1">
                {Math.round(displayEvents[activeIdx!].time)}s into session
              </p>
              <h4 className="text-base font-semibold text-white capitalize">{activeEvent.label}</h4>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-orange-400">{activeEvent.value}<span className="text-sm text-gray-500 font-normal">/10</span></p>
              {activeEvent.analysis && (
                <p className="text-xs text-gray-500 mt-0.5">Confidence: {activeEvent.analysis.confidenceScore}%</p>
              )}
            </div>
          </div>

          {activeEvent.analysis ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">{activeEvent.analysis.summary}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-green-400/80 mb-2">What landed</p>
                  <ul className="space-y-1.5">
                    {activeEvent.analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-orange-400/80 mb-2">Proof gap</p>
                  <ul className="space-y-1.5">
                    {activeEvent.analysis.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500/60 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No detailed analysis for this point.</p>
          )}

          {selectedIdx !== null && (
            <button
              onClick={() => setSelectedIdx(null)}
              className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

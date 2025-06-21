import React, { useMemo, useRef, useState } from 'react';

interface TimelineEvent {
  time: number;
  label: string;
  value: number;
  color?: string;
  details?: string;
}

interface InterviewTimelineProps {
  duration: number;
  events: TimelineEvent[];
}

const HEIGHT = 200; // Increased height for better visibility
const WAVE_COLOR = '#FF9800';
const HOVER_COLOR = '#42A5F5';

export const InterviewTimeline: React.FC<InterviewTimelineProps> = ({ duration, events }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showSample, setShowSample] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);  // Generate sample timeline data
  const generateSampleEvents = (duration: number): TimelineEvent[] => {
    const sampleEvents: TimelineEvent[] = [
      {
        time: duration * 0.1,
        label: "📋 Introduction Question",
        value: 7,
        details: "🎯 Strong opening with clear communication and confidence. Good eye contact and professional demeanor established early in the interview.\n\n✓ Strengths: Clear Articulation, Professional Presence, Good Rapport Building\n\n⚠ Areas For Improvement: Expand On Background Details, Provide More Specific Examples\n\n📊 Enthusiasm: 7/10"
      },
      {
        time: duration * 0.25,
        label: "💼 Technical Challenge",        value: 8,
        details: "⚡ Excellent problem-solving approach. Demonstrated strong analytical thinking and structured methodology for tackling complex challenges.\n\n✓ Strengths: Attempted Problem-Solving, Consideration Of Multiple Approaches, Basic Understanding Of Problem, Attempt To Solve The Problem, Acknowledgment Of Duplicates, Mention Of Cloud Hosting, Acknowledgment Of Compliance Importance\n\n⚠ Areas For Improvement: Structured Problem-Solving, Understanding Of Optimization, Algorithm Efficiency, Data Security Awareness, Understanding Of Scalable Architecture, Knowledge Of Data Security And Compliance\n\n📊 Enthusiasm: 8/10"
      },
      {
        time: duration * 0.4,
        label: "🧠 Behavioral Question",
        value: 6,
        details: "💭 Good storytelling with relevant examples. Could improve on providing more specific metrics and outcomes in responses.\n\n✓ Strengths: Relevant Experience Shared, Good Use Of STAR Method, Clear Communication\n\n⚠ Areas For Improvement: Provide Quantifiable Results, More Detailed Impact Metrics, Stronger Leadership Examples\n\n📊 Enthusiasm: 6/10"
      },
      {
        time: duration * 0.55,
        label: "🔧 System Design",
        value: 9,
        details: "🏗️ Outstanding architectural thinking! Showed deep understanding of scalability, trade-offs, and best practices.\n\n✓ Strengths: Comprehensive System Design, Scalability Considerations, Trade-off Analysis, Security Awareness\n\n⚠ Areas For Improvement: Cost Optimization Strategies, Monitoring And Observability, Disaster Recovery Planning\n\n📊 Enthusiasm: 9/10"
      },
      {
        time: duration * 0.7,
        label: "👥 Team Collaboration",
        value: 7,
        details: "🤝 Demonstrated strong teamwork skills with concrete examples. Good understanding of team dynamics and conflict resolution.\n\n✓ Strengths: Conflict Resolution Skills, Team Leadership Examples, Cross-functional Collaboration\n\n⚠ Areas For Improvement: Remote Team Management, Stakeholder Communication, Agile Methodology Knowledge\n\n📊 Enthusiasm: 7/10"
      },
      {
        time: duration * 0.85,
        label: "❓ Q&A Session",
        value: 8,
        details: "🔍 Asked thoughtful questions about company culture and growth opportunities. Shows genuine interest in the role.\n\n✓ Strengths: Thoughtful Questions, Genuine Interest, Cultural Fit Awareness\n\n⚠ Areas For Improvement: More Technical Questions About The Role, Deeper Company Research, Salary Negotiation Preparation\n\n📊 Enthusiasm: 8/10"
      }
    ];
    return sampleEvents;
  };
  // Use sample events if showing sample or no real events
  const displayEvents = showSample ? generateSampleEvents(duration || 300) : events;
  const displayDuration = duration || 300; // Default to 5 minutes if no duration  // Calculate points using useMemo with proper dependencies
  const points = useMemo(() => {
    if (!displayEvents.length) return [];
    return displayEvents.map((e) => {
      const x = (e.time / displayDuration) * 1000;      // Make changes much more dramatic by stretching the Y-axis range significantly
      const normalizedValue = e.value / 10; // 0 to 1
      const amplifiedValue = Math.pow(normalizedValue, 0.3); // Even more dramatic differences
      const y = HEIGHT - (amplifiedValue * (HEIGHT - 30)) - 15; // Maximum vertical range for drama
      return { x, y, ...e };
    });  }, [displayEvents, displayDuration, showSample]);

  // If no events and not showing sample, show a placeholder with sample option
  if (!events.length && !showSample) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full bg-gradient-to-br from-dark-800/90 to-dark-900/70 rounded-3xl p-8 border border-orange-500/30 shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              Performance Timeline
            </h3>
            <p className="text-gray-400 text-sm">Your interview performance progression over time</p>
          </div>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Performance Data Available</h4>
            <p className="text-gray-500 text-sm mb-6">Complete interview questions with responses to see your performance timeline.</p>
            
            <button
              onClick={() => setShowSample(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Sample Timeline
            </button>
          </div>
        </div>
      </div>
    );
  }  // Debug the path calculation
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

  // Debug the gradient path calculation
  const gradientPath = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q ${cpx},${prev.y} ${curr.x},${curr.y}`;
    }
    // Close the path to bottom for gradient fill
    d += ` L ${points[points.length - 1].x},${HEIGHT} L ${points[0].x},${HEIGHT} Z`;
    return d;
  }, [points]);
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full bg-gradient-to-br from-dark-800/90 to-dark-900/70 rounded-3xl p-8 border border-orange-500/30 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              Performance Timeline
              {showSample && <span className="text-sm font-normal text-orange-400 ml-2">(Sample Data)</span>}
            </h3>
            <p className="text-gray-400 text-sm">Your interview performance progression over time</p>
          </div>
          {showSample && (
            <button
              onClick={() => setShowSample(false)}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
            >
              Hide Sample
            </button>
          )}
        </div>
          <svg
          ref={svgRef}
          width={1000}
          height={HEIGHT}
          viewBox={`0 0 1000 ${HEIGHT}`}
          className="w-full rounded-2xl"
          style={{ 
            height: HEIGHT, 
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%)',
            border: '1px solid rgba(255, 152, 0, 0.1)'
          }}
        >          <defs>
            <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#FF5722" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#E91E63" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FF9800" stopOpacity={0.05} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background area fill */}
          {gradientPath && (
            <path 
              d={gradientPath} 
              fill="url(#areaGradient)" 
            />
          )}
          
          {/* Main performance line */}
          {path && (
            <path 
              d={path} 
              stroke="url(#performanceGradient)" 
              strokeWidth="5" 
              fill="none"
              filter="url(#glow)"
            />
          )}
            {/* Score reference lines */}          {[2, 4, 6, 8, 10].map(score => {
            const normalizedValue = score / 10;
            const amplifiedValue = Math.pow(normalizedValue, 0.3);
            const y = HEIGHT - (amplifiedValue * (HEIGHT - 30)) - 15;
            return (
              <line
                key={score}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}
            {/* Data points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={selectedIdx === i ? 16 : hoverIdx === i ? 14 : 8}
                fill={selectedIdx === i ? '#FFD700' : hoverIdx === i ? HOVER_COLOR : WAVE_COLOR}
                stroke="#fff"
                strokeWidth={selectedIdx === i ? 4 : 3}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                filter="url(#glow)"
              />
              {/* Score label on hover or selection */}
              {(hoverIdx === i || selectedIdx === i) && (
                <text
                  x={pt.x}
                  y={pt.y - 25}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {pt.value}/10
                </text>
              )}
            </g>
          ))}
        </svg>
          {/* Time axis labels */}
        <div className="flex justify-between mt-6 px-4">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => (
            <div 
              key={fraction} 
              className="text-sm text-gray-400 text-center font-medium"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-xs text-gray-600">
                {fraction === 0 ? 'Start' : fraction === 1 ? 'End' : `${Math.round(fraction * 100)}%`}
              </div>
            </div>
          ))}
        </div>
      </div>
        {/* Enhanced hover tooltip */}
      {(hoverIdx !== null || selectedIdx !== null) && (
        <div 
          className="mt-6 px-8 py-6 rounded-2xl bg-gradient-to-br from-dark-700 to-dark-800 text-white shadow-2xl border border-orange-500/40 backdrop-blur-sm transform transition-all duration-300 ease-out"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
            <div className="font-bold text-orange-400 text-xl">
              {displayEvents[selectedIdx !== null ? selectedIdx : hoverIdx!].label}
            </div>
            {selectedIdx !== null && (
              <button
                onClick={() => setSelectedIdx(null)}
                className="ml-auto text-gray-400 hover:text-white text-sm px-2 py-1 border border-gray-600 rounded hover:border-gray-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="bg-dark-900/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Time</div>
              <div className="text-xl font-bold text-white">
                {Math.round(displayEvents[selectedIdx !== null ? selectedIdx : hoverIdx!].time)}s
              </div>
            </div>
            <div className="bg-dark-900/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Score</div>
              <div className="text-xl font-bold text-orange-400">
                {displayEvents[selectedIdx !== null ? selectedIdx : hoverIdx!].value}/10
              </div>
            </div>
          </div>          {displayEvents[selectedIdx !== null ? selectedIdx : hoverIdx!]?.details && (
            <div className="pt-4 border-t border-gray-600/50 text-gray-300">
              <div className="text-sm font-medium text-gray-400 mb-3">Analysis</div>
              <div className="space-y-3">
                {displayEvents[selectedIdx !== null ? selectedIdx : hoverIdx!].details!.split('\n\n').map((section, idx) => {
                  // Check if this section contains structured feedback
                  if (section.includes('✓') || section.includes('⚠') || section.includes('📊')) {
                    const lines = section.split('\n').filter(line => line.trim());
                    return (
                      <div key={idx} className="space-y-2">                        {lines.map((line, lineIdx) => {
                          if (line.includes('✓ Strengths:')) {
                            const content = line.replace('✓ Strengths:', '').trim();
                            return (
                              <div key={lineIdx} className="flex items-start gap-2">
                                <span className="text-green-400 font-semibold text-sm mt-0.5">✓</span>
                                <div>
                                  <span className="text-green-400 font-medium text-sm">Your Strengths:</span>
                                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">{content}</p>
                                </div>
                              </div>
                            );
                          } else if (line.includes('⚠ Areas to improve:')) {
                            const content = line.replace('⚠ Areas to improve:', '').trim();
                            return (
                              <div key={lineIdx} className="flex items-start gap-2">
                                <span className="text-yellow-400 font-semibold text-sm mt-0.5">⚠</span>
                                <div>
                                  <span className="text-yellow-400 font-medium text-sm">Areas For Improvement:</span>
                                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">{content}</p>
                                </div>
                              </div>
                            );
                          } else if (line.includes('⚠ Areas For Improvement:')) {
                            const content = line.replace('⚠ Areas For Improvement:', '').trim();
                            return (
                              <div key={lineIdx} className="flex items-start gap-2">
                                <span className="text-yellow-400 font-semibold text-sm mt-0.5">⚠</span>
                                <div>
                                  <span className="text-yellow-400 font-medium text-sm">Areas For Improvement:</span>
                                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">{content}</p>
                                </div>
                              </div>
                            );
                          } else if (line.includes('📊 Enthusiasm:')) {
                            const content = line.replace('📊 Enthusiasm:', '').trim();
                            const score = parseInt(content.split('/')[0]);
                            const color = score >= 7 ? 'text-green-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400';
                            return (
                              <div key={lineIdx} className="flex items-start gap-2">
                                <span className="text-blue-400 font-semibold text-sm mt-0.5">📊</span>
                                <div>
                                  <span className="text-blue-400 font-medium text-sm">Enthusiasm:</span>
                                  <p className={`${color} text-sm mt-1 font-medium`}>{content}</p>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <p key={lineIdx} className="text-gray-300 text-sm leading-relaxed">
                                {line}
                              </p>
                            );
                          }
                        })}
                      </div>
                    );
                  } else {
                    // Regular text sections
                    return (
                      <p key={idx} className="text-gray-300 text-sm leading-relaxed">
                        {section}
                      </p>
                    );
                  }
                })}
              </div>
            </div>
          )}
          {selectedIdx !== null && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Click the ✕ button or click another point to close
            </div>
          )}
        </div>
      )}
    </div>
  );
};

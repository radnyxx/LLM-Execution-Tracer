import React from 'react';

export default function Stage2Vectors({ tokens = [] }) {
  // Constants for the SVG coordinate system
  const size = 300;
  const center = size / 2;
  const radius = 100;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <div style={{ padding: '8px 12px', background: '#1e293b', fontSize: 10, color: '#00d4ff', fontWeight: 800 }}>
        STAGE_02 // VECTOR_EMBEDDING_SPACE
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid Circles for depth */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth="1" />
          <circle cx={center} cy={center} r={radius/2} fill="none" stroke="#1e293b" strokeDasharray="4" />
          
          {/* Axis Lines */}
          <line x1={center} y1="20" x2={center} y2={size-20} stroke="#1e293b" strokeWidth="1" />
          <line x1="20" y1={center} x2={size-20} y2={center} stroke="#1e293b" strokeWidth="1" />

          {tokens.map((t, i) => {
            // MATH: Distribute tokens in a spiral so they don't overlap
            // Use Golden Angle (approx 2.399 rad) for natural distribution
            const angle = i * 2.399; 
            const r = (radius / (tokens.length || 1)) * i + 20; 
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);

            return (
              <g key={t.id || i}>
                {/* Connection line to center (The Vector) */}
                <line 
                  x1={center} y1={center} x2={x} y2={y} 
                  stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" 
                />
                {/* The Vector Point */}
                <circle cx={x} cy={y} r="3" fill="#00d4ff" />
                {/* Token Label */}
                <text 
                  x={x + 5} y={y - 5} 
                  fill="#94a3b8" fontSize="8" fontFamily="monospace"
                >
                  {t.word}
                </text>
              </g>
            );
          })}
        </svg>

        {tokens.length === 0 && (
          <div style={{ position: 'absolute', color: '#334155', fontSize: 10 }}>
            AWAITING_VECTOR_MAPPING...
          </div>
        )}
      </div>
    </div>
  );
}

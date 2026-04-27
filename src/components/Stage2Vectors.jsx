import React, { useMemo } from 'react'

export default function Stage2Vectors({ vectors = {}, tokens = [] }) {
  const activeWords = useMemo(() => tokens.map(t => t.word), [tokens]);

  // Project 3D coordinates to 2D SVG space
  const projectedPoints = useMemo(() => {
    return Object.entries(vectors).map(([word, coords]) => {
      // Simple orthographic projection with a slight tilt
      const x = coords[0] * 80 + coords[1] * 20 + 110;
      const y = -coords[2] * 80 + coords[1] * 30 + 110;
      return { word, x, y, active: activeWords.includes(word) };
    });
  }, [vectors, activeWords]);

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>2</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Vector Embedding Space
        </span>
      </div>

      <div style={{ padding: 12 }}>
        {/* Compact Table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginBottom: 15 }}>
          {tokens.map((t, i) => (
            <div key={i} style={{ 
              padding: '4px 8px', background: 'var(--bg4)', borderRadius: 2, border: '1px solid var(--border)',
              fontSize: 9, display: 'flex', justifyContent: 'space-between'
            }}>
              <span style={{ color: 'var(--text1)' }}>{t.word}</span>
              <span style={{ color: 'var(--blue)', fontFamily: 'monospace' }}>v_{i}</span>
            </div>
          ))}
        </div>

        {/* LIGHTWEIGHT SVG PROJECTION */}
        <div style={{ 
          height: 220, background: '#000', borderRadius: 4, position: 'relative', 
          border: '1px solid var(--border2)', overflow: 'hidden' 
        }}>
          <svg viewBox="0 0 220 220" style={{ width: '100%', height: '100%' }}>
            {/* Grid Floor */}
            <path d="M 20 180 L 110 140 L 200 180 L 110 220 Z" fill="none" stroke="var(--border)" strokeWidth="0.5" />
            
            {/* Vector Lines & Points */}
            {projectedPoints.map((p, i) => (
              <g key={i}>
                {/* Vertical projection line to "floor" */}
                <line x1={p.x} y1={p.y} x2={p.x} y2={180} stroke={p.active ? "var(--blue)" : "var(--border)"} strokeDasharray="2,2" opacity="0.3" />
                
                {/* The Point */}
                <circle cx={p.x} cy={p.y} r={p.active ? 4 : 2} fill={p.active ? "var(--blue)" : "#475569"}>
                   {p.active && <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />}
                </circle>

                {/* Word Label */}
                <text x={p.x + 6} y={p.y + 3} fill={p.active ? "var(--blue)" : "var(--text3)"} style={{ fontSize: 8, fontFamily: 'var(--font)', pointerEvents: 'none' }}>
                  {p.word}
                </text>
              </g>
            ))}
          </svg>
          
          <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 8, color: 'var(--blue)', opacity: 0.5 }}>
            [ ENGINE: SVG_LITE ]
          </div>
        </div>
      </div>
    </div>
  )
}

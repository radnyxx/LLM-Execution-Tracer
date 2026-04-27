import React, { useState, useMemo } from 'react';

export default function Stage2Vectors({ tokens = [] }) {
  const [rotation, setRotation] = useState({ x: 25, y: 45 });
  const [hovered, setHovered] = useState(null);

  const projectedPoints = useMemo(() => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    return tokens.map((t, i) => {
      // 1. DISTANCE FROM CENTER (Radius)
      // Words with weight 0.9 are very close to center (radius 10)
      // Words with weight 0.1 are far away (radius 120)
      const radius = (1.1 - (t.weight || 0.5)) * 110; 
      
      // 2. DISTRIBUTION (Angle)
      // We use the ID to give each word a unique, stable position in the circle
      const angle = (t.id * 137.5) * (Math.PI / 180); // Golden angle for even distribution
      
      const rawX = Math.cos(angle) * radius;
      const rawY = Math.sin(angle) * radius;
      const rawZ = ((t.weight || 0.5) * 60) - 30; // Z-depth based on weight

      // 3. 3D ROTATION MATH
      let x = rawX * Math.cos(radY) - rawZ * Math.sin(radY);
      let z = rawX * Math.sin(radY) + rawZ * Math.cos(radY);
      let y = rawY * Math.cos(radX) - z * Math.sin(radX);

      return { 
        word: t.word, 
        id: t.id,
        weight: t.weight,
        x: x + 150, // Center in 300px width
        y: y + 150, // Center in 300px height
        z: z 
      };
    });
  }, [tokens, rotation]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)' }}>STAGE_02 // VECTOR_SPACE_PROJECTION</span>
        <span style={{ fontSize: 9, color: 'var(--text3)' }}>{tokens.length} NODES_ACTIVE</span>
      </div>
      
      <div 
        style={{ flex: 1, position: 'relative', cursor: 'grab', background: 'var(--bg4)' }}
        onMouseMove={(e) => {
          if (e.buttons === 1) {
            setRotation(prev => ({ 
              x: prev.x + e.movementY * 0.5, 
              y: prev.y + e.movementX * 0.5 
            }));
          }
        }}
      >
        <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%' }}>
          {/* Depth-simulating grid lines */}
          <circle cx="150" cy="150" r="120" fill="none" stroke="var(--border2)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
          <line x1="150" y1="30" x2="150" y2="270" stroke="var(--border2)" strokeWidth="0.5" opacity="0.2" />
          <line x1="30" y1="150" x2="270" y2="150" stroke="var(--border2)" strokeWidth="0.5" opacity="0.2" />

          {projectedPoints.sort((a, b) => a.z - b.z).map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(p.word)} onMouseLeave={() => setHovered(null)}>
              {/* Connection lines to origin (The "Attention" pull) */}
              <line 
                x1="150" y1="150" x2={p.x} y2={p.y} 
                stroke={p.weight > 0.7 ? "var(--green)" : "var(--blue)"} 
                strokeWidth={p.weight > 0.7 ? 1 : 0.5}
                opacity={hovered === p.word ? 0.8 : 0.15} 
                style={{ transition: 'opacity 0.3s' }}
              />
              
              {/* Node Point */}
              <circle 
                cx={p.x} cy={p.y} 
                r={hovered === p.word ? 5 : 2 + (p.weight * 3)} 
                fill={p.weight > 0.7 ? "var(--green)" : "var(--blue)"}
                style={{ transition: 'all 0.2s', filter: p.weight > 0.7 ? 'drop-shadow(0 0 4px var(--green))' : 'none' }}
              />

              {/* Dynamic Label */}
              {(hovered === p.word || p.weight > 0.8) && (
                <text 
                  x={p.x + 8} y={p.y + 4} 
                  fill={p.weight > 0.8 ? "var(--green)" : "var(--text1)"} 
                  style={{ fontSize: 9, fontWeight: 700, pointerEvents: 'none', fontFamily: 'monospace' }}
                >
                  {p.word}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Rotation UI Indicator */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 8, color: 'var(--text3)', pointerEvents: 'none' }}>
           θ: {Math.round(rotation.x)}° φ: {Math.round(rotation.y)}° | DRAG_TO_ORBIT
        </div>
      </div>
    </div>
  );
}

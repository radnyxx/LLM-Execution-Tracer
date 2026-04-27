import React, { useState, useMemo } from 'react';

export default function Stage2Vectors({ vectors = {}, tokens = [] }) {
  const [rotation, setRotation] = useState({ x: 30, y: 45 });
  const [hovered, setHovered] = useState(null);

  // Math to project 3D coords to 2D SVG space
  const projectedPoints = useMemo(() => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    return tokens.map((t, i) => {
      // Mock 3D coords if none exist, otherwise use vectors prop
      const [rawX, rawY, rawZ] = vectors[t.word] || [
        Math.sin(i) * 50, 
        Math.cos(i) * 50, 
        (i - tokens.length/2) * 20
      ];

      // Rotation math
      let x = rawX * Math.cos(radY) - rawZ * Math.sin(radY);
      let z = rawX * Math.sin(radY) + rawZ * Math.cos(radY);
      let y = rawY * Math.cos(radX) - z * Math.sin(radX);

      return { 
        word: t.word, 
        id: t.id,
        x: x + 150, // Center in 300px width
        y: y + 200, // Center in 400px height
        active: t.weight > 0.5 
      };
    });
  }, [tokens, vectors, rotation]);

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', fontSize: 10, color: 'var(--blue)' }}>
        STAGE_02 // VECTOR_SPACE_PROJECTION
      </div>
      
      <div 
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab' }}
        onMouseMove={(e) => {
          if (e.buttons === 1) { // Rotate on click-drag
            setRotation(prev => ({ x: prev.x + e.movementY, y: prev.y + e.movementX }));
          }
        }}
      >
        <svg viewBox="0 0 300 400" style={{ width: '100%', height: '100%' }}>
          {/* Coordinate Axes */}
          <line x1="150" y1="50" x2="150" y2="350" stroke="var(--border2)" strokeWidth="0.5" />
          <line x1="50" y1="200" x2="250" y2="200" stroke="var(--border2)" strokeWidth="0.5" />

          {projectedPoints.map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(p.word)} onMouseLeave={() => setHovered(null)}>
              {/* Connection to Origin */}
              <line x1="150" y1="200" x2={p.x} y2={p.y} stroke={hovered === p.word ? "var(--blue)" : "var(--border2)"} opacity="0.3" />
              
              {/* Data Point */}
              <circle 
                cx={p.x} cy={p.y} r={hovered === p.word ? 5 : 3} 
                fill={p.active ? "var(--green)" : "var(--blue)"} 
                style={{ transition: 'all 0.2s' }}
              />

              {/* Label */}
              {(hovered === p.word || p.active) && (
                <text x={p.x + 8} y={p.y} fill="var(--text1)" style={{ fontSize: 8, fontFamily: 'monospace' }}>
                  {p.word} [ID:{p.id}]
                </text>
              )}
            </g>
          ))}
        </svg>
        
        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 8, color: 'var(--text3)' }}>
          ROT_X: {rotation.x}° | ROT_Y: {rotation.y}° <br />
          [DRAG_TO_ROTATE]
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';

export default function Stage2Vectors({ tokens = [] }) {
  const [rot, setRot] = useState({ x: 20, y: 40 });
  const [zoom, setZoom] = useState(1); // Zoom state
  const [hovered, setHovered] = useState(null);

  // Identify the top 3 heaviest words
  const topTokens = useMemo(() => {
    return [...tokens]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(t => t.word);
  }, [tokens]);

  const points = useMemo(() => {
    const rx = (rot.x * Math.PI) / 180;
    const ry = (rot.y * Math.PI) / 180;

    return tokens.map((t, i) => {
      // Apply zoom to the radius calculation
      const radius = ((1.2 - t.weight) * 90) * zoom; 
      const angle = (t.id * 137.5) * (Math.PI / 180);
      
      const x3d = Math.cos(angle) * radius;
      const y3d = Math.sin(angle) * radius;
      const z3d = ((t.weight * 40) - 20) * zoom;

      // Rotation math
      let x = x3d * Math.cos(ry) - z3d * Math.sin(ry);
      let z = x3d * Math.sin(ry) + z3d * Math.cos(ry);
      let y = y3d * Math.cos(rx) - z * Math.sin(rx);

      return { 
        word: t.word, 
        weight: t.weight, 
        x: x + 150, 
        y: y + 150, 
        z,
        isTop: topTokens.includes(t.word) 
      };
    });
  }, [tokens, rot, zoom, topTokens]);

  // Handle scroll to zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3)); // Limit zoom between 0.5x and 3x
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', background: 'var(--bg3)', fontSize: 10, color: 'var(--blue)', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
        <span>STAGE_02 // VECTOR_SPACE</span>
        <span style={{ color: 'var(--text3)' }}>ZOOM: {zoom.toFixed(1)}x</span>
      </div>
      <div 
        style={{ flex: 1, position: 'relative', cursor: 'grab', background: '#000', overflow: 'hidden' }}
        onMouseMove={(e) => e.buttons === 1 && setRot(p => ({ x: p.x + e.movementY * 0.5, y: p.y + e.movementX * 0.5 }))}
        onWheel={handleWheel}
      >
        <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%' }}>
          {/* Dynamic Grid Rings based on Zoom */}
          {[50, 100, 150].map(r => (
            <circle key={r} cx="150" cy="150" r={r * zoom} fill="none" stroke="var(--border2)" strokeWidth="0.5" opacity="0.1" />
          ))}
          
          {points.sort((a,b) => a.z - b.z).map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(p.word)} onMouseLeave={() => setHovered(null)}>
              {/* Focal Lines */}
              <line 
                x1="150" y1="150" x2={p.x} y2={p.y} 
                stroke={p.isTop ? "var(--green)" : "var(--blue)"} 
                opacity={p.isTop || hovered === p.word ? 0.4 : 0.05} 
              />
              
              {/* The Node */}
              <circle 
                cx={p.x} cy={p.y} 
                r={(2 + (p.weight * 4)) * (zoom * 0.8)} 
                fill={p.isTop ? "var(--green)" : "var(--blue)"} 
                style={{ 
                  filter: p.isTop ? 'drop-shadow(0 0 8px var(--green))' : 'none',
                  transition: 'r 0.2s ease'
                }}
              />

              {/* Top 3 Labels (Always Visible) or Hovered Labels */}
              {(p.isTop || hovered === p.word) && (
                <text 
                  x={p.x + 8} y={p.y + 3} 
                  fill={p.isTop ? "var(--green)" : "var(--text1)"} 
                  style={{ 
                    fontSize: p.isTop ? 10 : 8, 
                    fontWeight: 800, 
                    pointerEvents: 'none',
                    textShadow: '0 0 5px #000' 
                  }}
                >
                  {p.word.toUpperCase()} {p.isTop && `[${p.weight}]`}
                </text>
              )}
            </g>
          ))}
        </svg>
        
        <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 8, color: 'var(--text3)', pointerEvents: 'none' }}>
          SCROLL_TO_ZOOM | DRAG_TO_ORBIT
        </div>
      </div>
    </div>
  );
}

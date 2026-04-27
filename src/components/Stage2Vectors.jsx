import React, { useState, useRef, useMemo } from 'react';

export default function Stage2Vectors({ tokens = [] }) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 300, h: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  const center = 150;
  const radius = 100;

  // NEW: Generate "Ghost Clusters" only once for performance
  const ghostNodes = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      x: center + (Math.random() - 0.5) * 600,
      y: center + (Math.random() - 0.5) * 600,
      opacity: Math.random() * 0.15 + 0.05
    }));
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setViewBox(prev => ({
      ...prev,
      x: prev.x - e.movementX * (prev.w / 300),
      y: prev.y - e.movementY * (prev.h / 300)
    }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = Math.max(50, Math.min(1000, prev.w * scaleFactor));
      const newH = Math.max(50, Math.min(1000, prev.h * scaleFactor));
      return {
        x: prev.x + (prev.w - newW) / 2,
        y: prev.y + (prev.h - newH) / 2,
        w: newW,
        h: newH
      };
    });
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>STAGE_02 // LATENT_VECTOR_MAPPING</span>
        <span style={statusStyle}>SPACE_DIM: 4096d</span>
      </div>
      
      <div 
        style={{ flex: 1, cursor: isDragging ? 'grabbing' : 'grab', outline: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg 
          ref={svgRef}
          width="100%" height="100%" 
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* THE GHOST CLOUD: Fills the empty space */}
          {ghostNodes.map((gn, i) => (
            <circle key={i} cx={gn.x} cy={gn.y} r="0.8" fill="#94a3b8" style={{ opacity: gn.opacity }} />
          ))}

          {/* Reference Axis */}
          <line x1={center} y1="-500" x2={center} y2="800" stroke="#1e293b" strokeWidth={viewBox.w/600} />
          <line x1="-500" y1={center} x2="800" y2={center} stroke="#1e293b" strokeWidth={viewBox.w/600} />
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={viewBox.w/400} strokeDasharray="5,5" />

          {tokens.map((t, i) => {
            const angle = i * 2.399; 
            const r = (radius / (tokens.length || 1)) * i + 20; 
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);

            return (
              <g key={t.id || i}>
                <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(0, 212, 255, 0.3)" strokeWidth={viewBox.w/800} />
                <circle cx={x} cy={y} r={2.5 * (viewBox.w/300)} fill="#00ff9d" style={{ filter: 'drop-shadow(0 0 2px #00ff9d)' }} />
                <text 
                  x={x + (4 * (viewBox.w/300))} y={y - (4 * (viewBox.w/300))} 
                  fill="#f8fafc" fontSize={8 * (viewBox.w/300)} fontFamily="monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none', fontWeight: 600 }}
                >
                  {t.word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Footer detailing the coordinates */}
      <div style={footerStyle}>
        <span>X_OFFSET: {viewBox.x.toFixed(0)}</span>
        <span>Y_OFFSET: {viewBox.y.toFixed(0)}</span>
        <span>ZOOM: {(300 / viewBox.w).toFixed(2)}x</span>
      </div>
    </div>
  );
}

const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden' };
const headerStyle = { padding: '8px 12px', background: '#1e293b', fontSize: 10, color: '#00d4ff', fontWeight: 800, display: 'flex', justifyContent: 'space-between' };
const statusStyle = { color: '#64748b', fontSize: 9 };
const footerStyle = { height: 24, borderTop: '1px solid #1e293b', background: '#020617', color: '#475569', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontWeight: 800 };

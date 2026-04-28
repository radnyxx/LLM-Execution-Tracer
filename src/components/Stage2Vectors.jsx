import React, { useState, useRef, useMemo, useCallback } from 'react';
import Tooltip from './Tooltip';
import { cosineSimilarity } from '../schema';

export default function Stage2Vectors({ tokens = [], vectors = {}, highlighted = false }) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 300, h: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredToken, setHoveredToken] = useState(null);
  const svgRef = useRef(null);
  const center = 150;

  // Ghost nodes — stable
  const ghostNodes = useMemo(() => Array.from({ length: 80 }, (_, i) => {
    const a = (i * 137.508) * Math.PI / 180;
    const r = 30 + (i % 5) * 40;
    return { x: center + r * Math.cos(a) * 1.8, y: center + r * Math.sin(a) * 1.4, opacity: 0.04 + (i % 3) * 0.02 };
  }), []);

  // Map tokens to 2D positions using actual vector data
  const tokenPositions = useMemo(() => {
    return tokens.map((t, i) => {
      const vec = vectors[t.word] || vectors[Object.keys(vectors)[i]] || null;
      let x, y;
      if (vec && vec.length >= 2) {
        // Use first two dims, scale to canvas
        x = center + (vec[0] - 0.5) * 220;
        y = center + (vec[1] - 0.5) * 220;
      } else {
        // Fallback: spiral
        const angle = i * 2.399;
        const r = 30 + i * 18;
        x = center + r * Math.cos(angle);
        y = center + r * Math.sin(angle);
      }
      return { ...t, x, y, vec: vec || [0, 0, 0] };
    });
  }, [tokens, vectors]);

  // Centroid / Intent vector
  const intentPos = useMemo(() => {
    const iv = vectors['Intent'];
    if (iv) return { x: center + (iv[0] - 0.5) * 220, y: center + (iv[1] - 0.5) * 220 };
    if (tokenPositions.length === 0) return { x: center, y: center };
    const avgX = tokenPositions.reduce((s, t) => s + t.x, 0) / tokenPositions.length;
    const avgY = tokenPositions.reduce((s, t) => s + t.y, 0) / tokenPositions.length;
    return { x: avgX, y: avgY };
  }, [vectors, tokenPositions]);

  // Cosine similarity pairs
  const simPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < tokenPositions.length; i++) {
      for (let j = i + 1; j < tokenPositions.length; j++) {
        const sim = cosineSimilarity(tokenPositions[i].vec, tokenPositions[j].vec);
        if (sim > 0.7) pairs.push({ i, j, sim });
      }
    }
    return pairs;
  }, [tokenPositions]);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setViewBox(prev => ({
      ...prev,
      x: prev.x - e.movementX * (prev.w / 300),
      y: prev.y - e.movementY * (prev.h / 300),
    }));
  }, [isDragging]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const sf = e.deltaY > 0 ? 1.12 : 0.88;
    setViewBox(prev => {
      const nw = Math.max(80, Math.min(800, prev.w * sf));
      const nh = Math.max(80, Math.min(800, prev.h * sf));
      return { x: prev.x + (prev.w - nw) / 2, y: prev.y + (prev.h - nh) / 2, w: nw, h: nh };
    });
  }, []);

  const dotR = 3 * (viewBox.w / 300);
  const fs = 8 * (viewBox.w / 300);

  return (
    <div style={containerStyle}>
      <div style={headerStyle} className="stage-header-s2">
        <span>STAGE_02 // LATENT_VECTOR_MAPPING</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Tooltip term="cosine"><span style={{ fontSize: 8, color: '#475569', cursor: 'help', borderBottom: '1px dashed #334155' }}>SIM_LINES</span></Tooltip>
          <span style={{ color: '#334155', fontSize: 8 }}>SPACE_DIM: 4096d → 2d</span>
        </div>
      </div>

      <div
        style={{ flex: 1, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet">

          {/* Ghost cloud */}
          {ghostNodes.map((gn, i) => (
            <circle key={i} cx={gn.x} cy={gn.y} r="0.7" fill="#94a3b8" opacity={gn.opacity} />
          ))}

          {/* Axes */}
          <line x1={center} y1="-500" x2={center} y2="800" stroke="#1e293b" strokeWidth={viewBox.w / 600} />
          <line x1="-500" y1={center} x2="800" y2={center} stroke="#1e293b" strokeWidth={viewBox.w / 600} />
          <circle cx={center} cy={center} r={100} fill="none" stroke="#1e293b" strokeWidth={viewBox.w / 500} strokeDasharray="4,4" />

          {/* Cosine similarity lines */}
          {simPairs.map(({ i, j, sim }) => (
            <line key={`sim-${i}-${j}`}
              x1={tokenPositions[i].x} y1={tokenPositions[i].y}
              x2={tokenPositions[j].x} y2={tokenPositions[j].y}
              stroke="#a855f7" strokeWidth={viewBox.w / 900}
              opacity={sim * 0.5}
              strokeDasharray="3,3"
            />
          ))}

          {/* Lines from centroid to tokens */}
          {tokenPositions.map((t, i) => (
            <line key={`line-${i}`}
              x1={intentPos.x} y1={intentPos.y}
              x2={t.x} y2={t.y}
              stroke="rgba(0,212,255,0.15)"
              strokeWidth={viewBox.w / 900}
            />
          ))}

          {/* Intent centroid */}
          <circle cx={intentPos.x} cy={intentPos.y} r={dotR * 1.4}
            fill="none" stroke="#f59e0b" strokeWidth={viewBox.w / 600} opacity={0.8} />
          <circle cx={intentPos.x} cy={intentPos.y} r={dotR * 0.6} fill="#f59e0b" opacity={0.9} />
          <text x={intentPos.x + dotR * 2} y={intentPos.y - dotR * 2}
            fill="#f59e0b" fontSize={fs * 0.9} fontFamily="monospace" fontWeight={700} opacity={0.9}>
            INTENT
          </text>

          {/* Token dots */}
          {tokenPositions.map((t, i) => {
            const isHovered = hoveredToken === i;
            const dotColor = t.weight > 0.7 ? '#00ff9d' : t.weight > 0.4 ? '#00d4ff' : '#64748b';
            return (
              <g key={t.id || i}
                onMouseEnter={() => setHoveredToken(i)}
                onMouseLeave={() => setHoveredToken(null)}
                style={{ cursor: 'pointer' }}>
                {/* Glow */}
                {isHovered && <circle cx={t.x} cy={t.y} r={dotR * 3} fill={dotColor} opacity={0.1} />}
                <circle cx={t.x} cy={t.y} r={dotR * (isHovered ? 1.6 : 1)} fill={dotColor}
                  style={{ filter: `drop-shadow(0 0 ${isHovered ? 6 : 2}px ${dotColor})`, transition: 'r 0.2s' }} />
                <text x={t.x + dotR * 1.5} y={t.y - dotR * 1.5}
                  fill="#f8fafc" fontSize={fs} fontFamily="monospace" fontWeight={600}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {t.word}
                </text>
                {/* Hover tooltip in SVG */}
                {isHovered && t.vec && (
                  <foreignObject x={t.x + dotR * 2} y={t.y + dotR} width="120" height="60">
                    <div style={svgTooltip}>
                      <div style={{ color: '#00d4ff', fontWeight: 800 }}>{t.word}</div>
                      <div>vec: [{t.vec.map(v => v.toFixed(2)).join(', ')}]</div>
                      <div>attn: {t.weight.toFixed(3)}</div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={footerStyle}>
        <span>X: {viewBox.x.toFixed(0)}</span>
        <span>Y: {viewBox.y.toFixed(0)}</span>
        <span>ZOOM: {(300 / viewBox.w).toFixed(2)}x</span>
        <span style={{ marginLeft: 'auto', color: '#334155' }}>scroll=zoom · drag=pan</span>
        <span style={{ color: '#a855f7', fontSize: 8 }}>━━ cosine sim &gt;0.7</span>
        <span style={{ color: '#f59e0b', fontSize: 8 }}>◉ intent</span>
      </div>
    </div>
  );
}

const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden' };
const headerStyle = { padding: '7px 12px', background: '#0a0f1e', fontSize: 10, color: '#a855f7', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const footerStyle = { height: 22, borderTop: '1px solid #1e293b', background: '#020617', color: '#334155', fontSize: 8, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 10, fontWeight: 800 };
const svgTooltip = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 3, padding: '4px 6px', fontSize: 8, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6, pointerEvents: 'none' };

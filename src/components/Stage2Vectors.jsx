import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import Tooltip from './Tooltip';
import { cosineSimilarity } from '../schema';

/* ─── Semantic cluster background data (generated once, deterministic) ─── */
const CLUSTERS = [
  { name: 'ENTITY',      cx: 0.78, cy: 0.60, r: 0.13, n: 35, color: '#a855f7' },
  { name: 'FUNC_WORD',   cx: 0.09, cy: 0.10, r: 0.08, n: 28, color: '#334155' },
  { name: 'CONCEPT',     cx: 0.70, cy: 0.52, r: 0.11, n: 32, color: '#00d4ff' },
  { name: 'ADJECTIVE',   cx: 0.68, cy: 0.57, r: 0.09, n: 25, color: '#f59e0b' },
  { name: 'VERB',        cx: 0.35, cy: 0.72, r: 0.12, n: 30, color: '#00ff9d' },
  { name: 'NOUN',        cx: 0.52, cy: 0.35, r: 0.14, n: 38, color: '#38bdf8' },
  { name: 'PROPER_NOUN', cx: 0.85, cy: 0.25, r: 0.10, n: 22, color: '#ff4d4d' },
];

function seeded(s) { const x = Math.sin(s) * 10000; return x - Math.floor(x); }

const BG_POINTS = (() => {
  const pts = [];
  CLUSTERS.forEach((cl, ci) => {
    for (let i = 0; i < cl.n; i++) {
      const angle = seeded(ci * 100 + i * 7) * Math.PI * 2;
      const dist  = seeded(ci * 100 + i * 7 + 1) * cl.r;
      pts.push({
        x: Math.max(0.01, Math.min(0.99, cl.cx + Math.cos(angle) * dist)),
        y: Math.max(0.01, Math.min(0.99, cl.cy + Math.sin(angle) * dist)),
        color: cl.color,
        clusterIdx: ci,
      });
    }
  });
  return pts;
})();

/* ─── helpers ────────────────────────────────────────────────────────────── */

function tokenDotColor(weight) {
  if (weight > 0.7) return '#00ff9d';
  if (weight > 0.4) return '#00d4ff';
  return '#64748b';
}

function tokenDotRadius(weight, zoom) {
  const base = weight > 0.7 ? 6 : weight > 0.4 ? 5 : 3.5;
  return base * zoom;
}

/* ─── Main component ─────────────────────────────────────────────────────── */

/**
 * Stage2Vectors
 * Props:
 *   tokens        : token array from schema
 *   vectors       : vector map from schema
 *   highlighted   : bool — tour highlight
 *   ablatedIndex  : number — index of ablated token (-1 = none)
 */
export default function Stage2Vectors({
  tokens       = [],
  vectors      = {},
  highlighted  = false,
  ablatedIndex = -1,
}) {
  const bgRef   = useRef(null); // static layer: grid + halos + bg dots
  const fgRef   = useRef(null); // dynamic layer: tokens + lines + centroid
  const wrapRef = useRef(null);

  // Viewport transform
  const pan    = useRef({ x: 0, y: 0 });
  const zoom   = useRef(1);
  const size   = useRef({ w: 0, h: 0 });

  // Interaction
  const isDragging  = useRef(false);
  const lastMouse   = useRef({ x: 0, y: 0 });
  const bgDirty     = useRef(true);  // set true when bg needs redraw
  const rafPending  = useRef(false);

  const [hoveredIdx,   setHoveredIdx]   = useState(-1);
  const [zoomDisplay,  setZoomDisplay]  = useState('1.00');
  const [tooltipState, setTooltipState] = useState(null); // {x,y,token,nearestWord,nearestSim}

  /* ── Derived token positions ── */
  const tokenPositions = useMemo(() => {
    return tokens.map((t, i) => {
      const vec = vectors[t.word] || null;
      let vx, vy;
      if (vec && vec.length >= 2) {
        vx = vec[0]; vy = vec[1];
      } else {
        // Fallback: deterministic spiral
        const angle = i * 2.399;
        const r     = 0.15 + i * 0.08;
        vx = 0.5 + r * Math.cos(angle);
        vy = 0.5 + r * Math.sin(angle);
      }
      return { ...t, vx: Math.max(0.05, Math.min(0.95, vx)), vy: Math.max(0.05, Math.min(0.95, vy)), vec: vec || [vx, vy, 0] };
    });
  }, [tokens, vectors]);

  /* ── Intent centroid (weighted average, ablation-aware) ── */
  const intentPos = useMemo(() => {
    if (!tokenPositions.length) return { vx: 0.5, vy: 0.5 };
    const iv = vectors['Intent'];
    if (iv) return { vx: iv[0], vy: iv[1] };
    let wx = 0, wy = 0, wt = 0;
    tokenPositions.forEach((t, i) => {
      const w = i === ablatedIndex ? 0 : t.weight;
      wx += t.vx * w; wy += t.vy * w; wt += w;
    });
    return wt > 0 ? { vx: wx / wt, vy: wy / wt } : { vx: 0.5, vy: 0.5 };
  }, [tokenPositions, vectors, ablatedIndex]);

  /* ── Cosine similarity pairs (only > 0.75) ── */
  const simPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < tokenPositions.length; i++) {
      for (let j = i + 1; j < tokenPositions.length; j++) {
        const sim = cosineSimilarity(tokenPositions[i].vec, tokenPositions[j].vec);
        if (sim > 0.75) pairs.push({ i, j, sim });
      }
    }
    return pairs;
  }, [tokenPositions]);

  /* ── Canvas coordinate helpers ── */
  const MARGIN = 55;
  function toScreen(vx, vy) {
    const { w, h } = size.current;
    const sx = MARGIN + vx * (w - MARGIN * 2);
    const sy = MARGIN + vy * (h - MARGIN * 2);
    const cx = w / 2, cy = h / 2;
    return [
      pan.current.x + (sx - cx) * zoom.current + cx,
      pan.current.y + (sy - cy) * zoom.current + cy,
    ];
  }

  function fromScreen(px, py) {
    const { w, h } = size.current;
    const cx = w / 2, cy = h / 2;
    const sx = (px - pan.current.x - cx) / zoom.current + cx;
    const sy = (py - pan.current.y - cy) / zoom.current + cy;
    return [
      (sx - MARGIN) / (w - MARGIN * 2),
      (sy - MARGIN) / (h - MARGIN * 2),
    ];
  }

  /* ── Background draw (grid + halos + bg dots + cluster labels) ── */
  const drawBg = useCallback(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h } = size.current;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(30,41,59,0.35)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Cluster halos (soft radial gradient ellipses)
    CLUSTERS.forEach(cl => {
      const [cx, cy] = toScreen(cl.cx, cl.cy);
      const rx = cl.r * (w - MARGIN * 2) * zoom.current * 1.2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      grad.addColorStop(0, cl.color + '1a');
      grad.addColorStop(0.6, cl.color + '0d');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.1, rx * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cluster label text
    CLUSTERS.forEach(cl => {
      const [cx, cy] = toScreen(cl.cx, cl.cy - cl.r * 1.55);
      ctx.fillStyle   = cl.color + '60';
      ctx.font        = `800 ${Math.max(7, Math.min(9, 8 * zoom.current))}px JetBrains Mono, monospace`;
      ctx.textAlign   = 'center';
      ctx.letterSpacing = '1px';
      ctx.fillText(cl.name, cx, cy);
    });

    // Background vocab dots
    BG_POINTS.forEach(p => {
      const [sx, sy] = toScreen(p.x, p.y);
      if (sx < -5 || sx > w + 5 || sy < -5 || sy > h + 5) return;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.8, 1.4 * zoom.current), 0, Math.PI * 2);
      ctx.fillStyle = p.color + '50';
      ctx.fill();
    });

    bgDirty.current = false;
  }, []);

  /* ── Foreground draw (tokens + sim lines + centroid + hover) ── */
  const drawFg = useCallback(() => {
    const canvas = fgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h } = size.current;
    ctx.clearRect(0, 0, w, h);

    if (!tokenPositions.length) return;

    const z = zoom.current;

    // ── Cosine similarity lines ──
    simPairs.forEach(({ i, j, sim }) => {
      const [ax, ay] = toScreen(tokenPositions[i].vx, tokenPositions[i].vy);
      const [bx, by] = toScreen(tokenPositions[j].vx, tokenPositions[j].vy);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(168,85,247,${(sim - 0.75) * 2.5})`;
      ctx.lineWidth   = (sim - 0.75) * 5 * z;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Sim value at midpoint
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      ctx.fillStyle = 'rgba(168,85,247,0.75)';
      ctx.font      = `${Math.max(7, 7.5 * z)}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(sim.toFixed(2), mx, my - 5);
    });

    // ── Dashed lines → intent centroid ──
    const [isx, isy] = toScreen(intentPos.vx, intentPos.vy);
    tokenPositions.forEach((t, i) => {
      const [sx, sy] = toScreen(t.vx, t.vy);
      const isAbl    = i === ablatedIndex;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(isx, isy);
      ctx.strokeStyle = isAbl
        ? 'rgba(255,77,77,0.2)'
        : `rgba(245,158,11,${t.weight * 0.22})`;
      ctx.lineWidth   = isAbl ? 0.5 : t.weight * 1.2 * z;
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ── Intent centroid ──
    // Outer pulse ring
    ctx.beginPath();
    ctx.arc(isx, isy, 14 * z, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245,158,11,0.35)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    // Diamond
    const ds = 7 * z;
    ctx.beginPath();
    ctx.moveTo(isx, isy - ds);
    ctx.lineTo(isx + ds, isy);
    ctx.lineTo(isx, isy + ds);
    ctx.lineTo(isx - ds, isy);
    ctx.closePath();
    ctx.fillStyle   = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,158,11,0.6)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    // Glow
    const grd = ctx.createRadialGradient(isx, isy, 0, isx, isy, 24 * z);
    grd.addColorStop(0, 'rgba(245,158,11,0.18)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(isx, isy, 24 * z, 0, Math.PI * 2); ctx.fill();
    // Label
    ctx.fillStyle   = '#f59e0b';
    ctx.font        = `800 ${Math.max(8, 9 * z)}px JetBrains Mono, monospace`;
    ctx.textAlign   = 'left';
    ctx.fillText('INTENT', isx + 16 * z, isy - 5 * z);
    ctx.font        = `${Math.max(7, 8 * z)}px JetBrains Mono, monospace`;
    ctx.fillStyle   = 'rgba(245,158,11,0.55)';
    ctx.fillText(`[${intentPos.vx.toFixed(2)}, ${intentPos.vy.toFixed(2)}]`, isx + 16 * z, isy + 7 * z);

    // ── Token dots ──
    tokenPositions.forEach((t, i) => {
      const [sx, sy] = toScreen(t.vx, t.vy);
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) return;

      const isHov   = i === hoveredIdx;
      const isAbl   = i === ablatedIndex;
      const color   = isAbl ? '#ff4d4d' : tokenDotColor(t.weight);
      const r       = tokenDotRadius(isAbl ? 0.3 : t.weight, z) * (isHov ? 1.55 : 1);

      // Glow halo
      if (!isAbl && (isHov || t.weight > 0.7)) {
        const hgrd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.5);
        hgrd.addColorStop(0, color + '40');
        hgrd.addColorStop(1, 'transparent');
        ctx.fillStyle = hgrd;
        ctx.beginPath(); ctx.arc(sx, sy, r * 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // Dot fill
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = isAbl ? 'rgba(255,77,77,0.25)' : color;
      ctx.fill();

      // Attention ring for high-weight tokens
      if (t.weight > 0.7 && !isAbl) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3 * z, 0, Math.PI * 2);
        ctx.strokeStyle = color + '55';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Ablated: dashed ring
      if (isAbl) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + 4 * z, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4d4d55';
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Word label
      const lx = sx + r + 7 * z;
      const ly = sy - 2;
      ctx.font      = `${t.weight > 0.7 ? '800' : '400'} ${Math.max(9, 10 * z)}px JetBrains Mono, monospace`;
      ctx.fillStyle = isAbl ? 'rgba(255,77,77,0.45)' : isHov ? '#f8fafc' : t.weight > 0.7 ? '#e2e8f0' : '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(isAbl ? `${t.word} [ABLATED]` : t.word, lx, ly);

      // Sub-label: attn weight + category
      ctx.font      = `${Math.max(7, 7.5 * z)}px JetBrains Mono, monospace`;
      ctx.fillStyle = isAbl ? '#ff4d4d55' : '#475569';
      ctx.fillText(`attn: ${t.weight.toFixed(2)} · ${guessCategory(t.word, t.vx, t.vy)}`, lx, ly + 12 * z);
    });
  }, [tokenPositions, simPairs, intentPos, hoveredIdx, ablatedIndex]);

  /* ── Category guesser (maps vec position to nearest cluster) ── */
  function guessCategory(word, vx, vy) {
    let best = CLUSTERS[0], bestD = Infinity;
    CLUSTERS.forEach(cl => {
      const d = Math.hypot(vx - cl.cx, vy - cl.cy);
      if (d < bestD) { bestD = d; best = cl; }
    });
    return best.name;
  }

  /* ── Combined redraw (batched via rAF) ── */
  const scheduleRedraw = useCallback((bgToo = false) => {
    if (bgToo) bgDirty.current = true;
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      if (bgDirty.current) drawBg();
      drawFg();
    });
  }, [drawBg, drawFg]);

  /* ── Resize observer ── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width < 1 || height < 1) return;
      size.current = { w: width, h: height };
      [bgRef, fgRef].forEach(ref => {
        if (ref.current) { ref.current.width = width; ref.current.height = height; }
      });
      scheduleRedraw(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scheduleRedraw]);

  /* ── Redraw when data changes ── */
  useEffect(() => { scheduleRedraw(false); }, [tokenPositions, simPairs, intentPos, hoveredIdx, ablatedIndex, scheduleRedraw]);

  /* ── Mouse interactions ── */
  const handleMouseMove = useCallback(e => {
    const rect = fgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Pan
    if (isDragging.current) {
      pan.current.x += e.clientX - lastMouse.current.x;
      pan.current.y += e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      scheduleRedraw(true);
    }

    // Hit test tokens
    let hov = -1;
    tokenPositions.forEach((t, i) => {
      const [sx, sy] = toScreen(t.vx, t.vy);
      const r = tokenDotRadius(t.weight, zoom.current) * 1.8 + 10;
      if (Math.hypot(mx - sx, my - sy) < r) hov = i;
    });

    if (hov !== hoveredIdx) {
      setHoveredIdx(hov);
    }

    if (hov >= 0) {
      const t = tokenPositions[hov];
      let nearestSim = -1, nearestWord = '';
      tokenPositions.forEach((t2, j) => {
        if (j === hov) return;
        const s = cosineSimilarity(t.vec, t2.vec);
        if (s > nearestSim) { nearestSim = s; nearestWord = t2.word; }
      });
      // Position tooltip: flip left if near right edge
      const { w } = size.current;
      const ttx = mx + 16 > w - 180 ? mx - 186 : mx + 16;
      setTooltipState({ x: ttx, y: my - 10, t, nearestWord, nearestSim });
    } else {
      setTooltipState(null);
    }
  }, [tokenPositions, hoveredIdx, scheduleRedraw]);

  const handleMouseDown = useCallback(e => {
    isDragging.current = true;
    lastMouse.current  = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp   = useCallback(() => { isDragging.current = false; }, []);
  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setHoveredIdx(-1);
    setTooltipState(null);
  }, []);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    const sf  = e.deltaY > 0 ? 0.88 : 1.12;
    zoom.current = Math.max(0.35, Math.min(5, zoom.current * sf));
    setZoomDisplay(zoom.current.toFixed(2));
    scheduleRedraw(true);
  }, [scheduleRedraw]);

  /* ── Dominant token + cluster for info bar ── */
  const dominantToken = useMemo(() => {
    if (!tokenPositions.length) return null;
    return tokenPositions.reduce((a, b, i) => (i === ablatedIndex ? a : b.weight > a.weight ? b : a), tokenPositions[0]);
  }, [tokenPositions, ablatedIndex]);

  const nearestCluster = useMemo(() => {
    if (!dominantToken) return '';
    let best = CLUSTERS[0], bestD = Infinity;
    CLUSTERS.forEach(cl => {
      const d = Math.hypot(dominantToken.vx - cl.cx, dominantToken.vy - cl.cy);
      if (d < bestD) { bestD = d; best = cl; }
    });
    return best.name;
  }, [dominantToken]);

  return (
    <div style={containerStyle}>
      {/* ── Header ── */}
      <div style={headerStyle} className="stage-header-s2">
        <span>STAGE_02 // t-SNE LATENT SPACE PROJECTION</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Tooltip term="cosine">
            <span style={{ fontSize: 8, color: '#475569', cursor: 'help', borderBottom: '1px dashed #334155' }}>
              SIM_LINES
            </span>
          </Tooltip>
          <span style={{ fontSize: 8, color: '#334155' }}>4096d → 2d · t-SNE</span>
          <span style={{ fontSize: 8, color: '#334155' }}>ZOOM: {zoomDisplay}×</span>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div
        ref={wrapRef}
        style={canvasWrapStyle}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {/* Layer 0: static background */}
        <canvas ref={bgRef} style={canvasStyle} />
        {/* Layer 1: dynamic foreground */}
        <canvas ref={fgRef} style={{ ...canvasStyle, cursor: isDragging.current ? 'grabbing' : 'crosshair' }} />

        {/* React tooltip — avoids canvas text overflow issues */}
        {tooltipState && (
          <div style={{ ...tooltipStyle, left: tooltipState.x, top: tooltipState.y }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', marginBottom: 5 }}>
              {tooltipState.t.word}
              {ablatedIndex === tokenPositions.indexOf(tooltipState.t) && (
                <span style={{ marginLeft: 6, fontSize: 7, color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.4)', padding: '1px 4px', borderRadius: 2 }}>ABLATED</span>
              )}
            </div>
            <div style={ttRow}>vec: <span style={ttVal}>[{tooltipState.t.vec.slice(0,2).map(v => v.toFixed(3)).join(', ')}]</span></div>
            <div style={ttRow}>attn weight: <span style={ttVal}>{tooltipState.t.weight.toFixed(3)}</span></div>
            <div style={ttRow}>category: <span style={ttVal}>{guessCategory(tooltipState.t.word, tooltipState.t.vx, tooltipState.t.vy)}</span></div>
            {tooltipState.nearestSim > 0 && (
              <div style={{ ...ttRow, marginTop: 5, paddingTop: 5, borderTop: '1px solid #1e293b' }}>
                nearest:{' '}
                <span style={{ color: tooltipState.nearestSim > 0.75 ? '#a855f7' : '#64748b', fontWeight: tooltipState.nearestSim > 0.75 ? 800 : 400 }}>
                  "{tooltipState.nearestWord}" ({tooltipState.nearestSim.toFixed(3)})
                </span>
                {tooltipState.nearestSim > 0.75 && (
                  <div style={{ color: '#a855f7', fontSize: 8, marginTop: 2 }}>↳ shared semantic domain</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Info bar ── */}
      <div style={infoBarStyle}>
        {dominantToken ? (
          <>
            <span>dominant: <span style={{ color: '#00ff9d', fontWeight: 800 }}>"{dominantToken.word}"</span></span>
            <span style={{ color: '#1e293b' }}>·</span>
            <span>attn: <span style={{ color: '#00ff9d' }}>{dominantToken.weight.toFixed(2)}</span></span>
            <span style={{ color: '#1e293b' }}>·</span>
            <span>intent → <span style={{ color: '#f59e0b' }}>{nearestCluster} cluster</span></span>
            {ablatedIndex >= 0 && tokenPositions[ablatedIndex] && (
              <>
                <span style={{ color: '#1e293b' }}>·</span>
                <span style={{ color: '#ff4d4d' }}>"{tokenPositions[ablatedIndex].word}" ablated → centroid shifted</span>
              </>
            )}
          </>
        ) : (
          <span>submit a prompt to populate the embedding space</span>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={legendStyle}>
        {[
          { color: '#00ff9d', label: 'HIGH ATTN' },
          { color: '#00d4ff', label: 'MED ATTN' },
          { color: '#64748b', label: 'LOW ATTN' },
          { color: '#1e293b', label: 'VOCAB', border: '1px solid #334155' },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, border: border || 'none', flexShrink: 0 }} />
            <span>{label}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', color: '#475569' }}>━━ cos_sim &gt; 0.75</span>
        <span style={{ color: '#f59e0b' }}>◆ intent</span>
        <span style={{ color: '#334155' }}>scroll=zoom · drag=pan</span>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const containerStyle  = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace' };
const headerStyle     = { padding: '7px 12px', background: '#0a0f1e', fontSize: 10, color: '#a855f7', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const canvasWrapStyle = { flex: 1, position: 'relative', overflow: 'hidden' };
const canvasStyle     = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };
const tooltipStyle    = { position: 'absolute', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, padding: '8px 10px', fontSize: 9, color: '#94a3b8', pointerEvents: 'none', zIndex: 10, minWidth: 170, lineHeight: 1.7, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 0 20px rgba(0,0,0,0.5)' };
const ttRow           = { color: '#475569', fontSize: 8 };
const ttVal           = { color: '#94a3b8', fontWeight: 400 };
const infoBarStyle    = { padding: '4px 12px', fontSize: 8, color: '#334155', background: '#020617', borderTop: '1px solid #0f172a', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', fontWeight: 800 };
const legendStyle     = { height: 24, borderTop: '1px solid #1e293b', background: '#020617', color: '#334155', fontSize: 8, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 10, flexShrink: 0, flexWrap: 'wrap', fontWeight: 800 };

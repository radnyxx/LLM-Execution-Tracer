import React, { useRef, useEffect } from 'react'

function toScreen(val, min, max, lo, hi) {
  return lo + ((val - min) / (max - min)) * (hi - lo)
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const headLen = 7
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
}

export default function Stage2({ vectors }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const W = cv.offsetWidth || 420
    const H = 200
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d')

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Axes
    const cx = W / 2, cy = H / 2
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
    ctx.fillStyle = '#475569'; ctx.font = '9px JetBrains Mono'
    ctx.fillText('X', W - 14, cy - 6)
    ctx.fillText('Y', cx + 6, 12)
    ctx.fillText('0', cx + 4, cy + 10)

    const pts = {}
    const keys = Object.keys(vectors)
    const allPts = keys.map(k => vectors[k]).filter(Boolean)
    if (!allPts.length) return

    const allX = allPts.map(p => p[0])
    const allY = allPts.map(p => p[1])
    const mnX = Math.min(...allX) - 0.25, mxX = Math.max(...allX) + 0.25
    const mnY = Math.min(...allY) - 0.25, mxY = Math.max(...allY) + 0.25

    const pad = 30
    keys.forEach(k => {
      if (vectors[k]) {
        pts[k] = [
          toScreen(vectors[k][0], mnX, mxX, pad, W - pad),
          toScreen(vectors[k][1], mnY, mxY, H - pad, pad),
          vectors[k][2]
        ]
      }
    })

    const origin = [cx, cy]

    // Dashed lines from origin to football/poem
    const colors = ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b']
    keys.forEach((k, i) => {
      if (!pts[k]) return
      const col = colors[i % colors.length]
      const isCentroid = k.toLowerCase().includes('centroid') || k.toLowerCase().includes('intent')

      // Draw dashed line from origin
      ctx.save()
      ctx.globalAlpha = isCentroid ? 0.6 : 0.35
      ctx.strokeStyle = col
      ctx.setLineDash(isCentroid ? [6, 4] : [4, 5])
      ctx.beginPath(); ctx.moveTo(origin[0], origin[1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke()
      ctx.restore()

      // Draw the point
      ctx.save()
      ctx.shadowBlur = isCentroid ? 16 : 10; ctx.shadowColor = col
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], isCentroid ? 6 : 5, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 9px JetBrains Mono'
      ctx.fillText(k, pts[k][0] + 8, pts[k][1] + 3)
    })
    
    // Origin dot
    ctx.fillStyle = '#334155'
    ctx.beginPath(); ctx.arc(origin[0], origin[1], 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#475569'; ctx.font = '9px JetBrains Mono'
    ctx.fillText('origin', origin[0] + 5, origin[1] - 5)

    // Cosine similarity annotation
    const vKeys = Object.keys(vectors);
    if (vKeys.length >= 2) {
      const k1 = vKeys[0];
      const k2 = vKeys[1];
      const v1 = vectors[k1];
      const v2 = vectors[k2];

    // Dot product
    const dot = v1.reduce((s, v, i) => s + v * (v2[i] || 0), 0);
    // Magnitudes
    const mag1 = Math.sqrt(v1.reduce((s, v) => s + v * v, 0));
    const mag2 = Math.sqrt(v2.reduce((s, v) => s + v * v, 0));
  
    const sim = (dot / (mag1 * mag2)).toFixed(3);

    ctx.fillStyle = '#334155';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`cos_sim(${k1}, ${k2}) ≈ ${sim}`, 8, H - 8);
  }

  }, [vectors])

  const cosSim = (() => {
    if (!vectors.football || !vectors.poem) return null
    const dot = vectors.football.reduce((s, v, i) => s + v * vectors.poem[i], 0)
    const magF = Math.sqrt(vectors.football.reduce((s, v) => s + v * v, 0))
    const magP = Math.sqrt(vectors.poem.reduce((s, v) => s + v * v, 0))
    return (dot / (magF * magP)).toFixed(3)
  })()

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>2</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Vector Embedding Space
        </span>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
          // 2D PROJECTION OF 3D EMBEDDING SPACE  →  triangulating semantic intent
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 200, display: 'block', borderRadius: 3, border: '1px solid var(--border)' }}
        />
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 9, color: 'var(--text2)', flexWrap: 'wrap' }}>
          {Object.keys(vectors).map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b'][i % 5], 
                boxShadow: `0 0 5px currentColor`, flexShrink: 0 
              }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    {Object.keys(vectors).length > 1 && (
          <div style={{ marginTop: 8, fontSize: 9, color: 'var(--border2)' }}>
            // dimensions: 3D projection applied
            {cosSim && <span style={{ marginLeft: 12 }}>semantic_spread ≈ {cosSim}</span>}
          </div>
        )}
      </div> {/* This closes the padding div */}
    </div>   {/* This closes the main container div */}
  );         {/* This closes the return statement */}
}            {/* This closes the Stage2 function */}

function StageNum({ children }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'var(--blue3)', border: '1px solid var(--blue)',
      color: 'var(--blue)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

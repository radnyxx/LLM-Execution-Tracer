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
    const keys = ['football', 'poem', 'centroid']
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
        ]
      }
    })

    const origin = [cx, cy]

    // Dashed lines from origin to football/poem
    ;[['football', '#ff4444'], ['poem', '#a855f7']].forEach(([k, col]) => {
      if (!pts[k]) return
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = col
      ctx.lineWidth = 1
      ctx.setLineDash([4, 5])
      ctx.beginPath(); ctx.moveTo(origin[0], origin[1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke()
      ctx.restore()
    })

    // Glowing trajectory to centroid
    if (pts.centroid) {
      ctx.save()
      ctx.shadowBlur = 14; ctx.shadowColor = '#00d4ff'
      ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(origin[0], origin[1]); ctx.lineTo(pts.centroid[0], pts.centroid[1]); ctx.stroke()
      ctx.restore()
    }

    // Draw points
    const drawPt = (pt, label, col, r) => {
      if (!pt) return
      ctx.save()
      ctx.shadowBlur = 16; ctx.shadowColor = col
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(pt[0], pt[1], r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 9px JetBrains Mono'
      ctx.fillText(label, pt[0] + r + 4, pt[1] + 3)
    }

    drawPt(pts.football, 'football', '#ff4444', 5)
    drawPt(pts.poem, 'poem', '#a855f7', 5)
    drawPt(pts.centroid, 'centroid [intent]', '#00d4ff', 6)

    // Origin dot
    ctx.fillStyle = '#334155'
    ctx.beginPath(); ctx.arc(origin[0], origin[1], 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#475569'; ctx.font = '9px JetBrains Mono'
    ctx.fillText('origin', origin[0] + 5, origin[1] - 5)

    // Cosine similarity annotation
    if (vectors.football && vectors.poem) {
      const dot = vectors.football.reduce((s, v, i) => s + v * vectors.poem[i], 0)
      const magF = Math.sqrt(vectors.football.reduce((s, v) => s + v * v, 0))
      const magP = Math.sqrt(vectors.poem.reduce((s, v) => s + v * v, 0))
      const sim = (dot / (magF * magP)).toFixed(3)
      ctx.fillStyle = '#334155'; ctx.font = '9px JetBrains Mono'
      ctx.fillText(`cos_sim(football, poem) ≈ ${sim}`, 8, H - 8)
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
          {[
            { col: '#ff4444', label: 'football [sport cluster]' },
            { col: '#a855f7', label: 'poem [literary cluster]' },
            { col: '#00d4ff', label: 'centroid → inferred intent' },
          ].map(({ col, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 5px ${col}`, flexShrink: 0 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        {vectors.football && vectors.poem && (
          <div style={{ marginTop: 8, fontSize: 9, color: 'var(--border2)' }}>
            // dim[0]={vectors.football[0]}  dim[1]={vectors.football[1]}  dim[2]={vectors.football[2]}
            {cosSim && <span style={{ marginLeft: 12 }}>cos_sim ≈ {cosSim}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

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
  )
}

import React from 'react'

function heatColor(w) {
  const r = Math.round(30 * (1 - w))
  const g = Math.round(212 * w)
  const b = Math.round(30 + 225 * w)
  return `rgb(${r},${g},${b})`
}

function weightLabel(w) {
  if (w > 0.7) return 'HIGH'
  if (w > 0.3) return 'MED'
  return 'LOW'
}

export default function Stage1({ tokens }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg3)',
      }}>
        <StageNum>1</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Tokenization & Attention Heatmap
        </span>
      </div>

      <div style={{ padding: 12 }}>
        {/* Token table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr>
              {['Word', 'Token ID', 'Attention Weight', 'Entropy'].map(h => (
                <th key={h} style={{
                  padding: '4px 8px', textAlign: 'left', color: 'var(--text3)',
                  fontWeight: 400, borderBottom: '1px solid var(--border)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => {
              const col = heatColor(t.weight ?? 0)
              const w = t.weight ?? 0
              return (
                <tr key={i}>
                  <td style={{ padding: '5px 8px', color: 'var(--text)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>
                    {t.word ?? '?'}
                  </td>
                  <td style={{ padding: '5px 8px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                    {t.id ?? '—'}
                  </td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: `${Math.round(w * 60)}px`,
                        height: 8,
                        background: col,
                        borderRadius: 2,
                        boxShadow: w > 0.7 ? `0 0 6px ${col}` : undefined,
                        transition: 'all 0.4s',
                        minWidth: 2,
                      }} />
                      <span style={{ color: col, fontSize: 9 }}>{w.toFixed(2)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '5px 8px', color: 'var(--text3)', fontSize: 9, borderBottom: '1px solid var(--border)' }}>
                    {weightLabel(w)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Heatmap */}
        <div style={{ marginTop: 12, fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
          // ATTENTION HEATMAP
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tokens.map((t, i) => {
            const w = t.weight ?? 0
            const col = heatColor(w)
            const alpha = 0.15 + w * 0.85
            return (
              <div key={i} style={{
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: w > 0.7 ? 700 : 400,
                color: col,
                background: `rgba(0,212,255,${(alpha * 0.3).toFixed(2)})`,
                border: `1px solid rgba(0,212,255,${(alpha * 0.6).toFixed(2)})`,
                boxShadow: w > 0.7 ? `0 0 10px ${col}, 0 0 20px rgba(0,212,255,0.15)` : undefined,
                transform: `scale(${(0.9 + w * 0.2).toFixed(2)})`,
                transition: 'all 0.4s',
                cursor: 'default',
              }}>
                {t.word ?? '?'}
              </div>
            )
          })}
        </div>
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

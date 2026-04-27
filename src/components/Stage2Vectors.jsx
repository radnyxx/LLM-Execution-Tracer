import React from 'react'
// Correct path: up one level to find schema.js in /src
import { DEFAULT_SCHEMA } from '../schema.js' 

export default function Stage2Vectors({ vectors, tokens }) {
  // Fallback to default if props are missing
  const activeVectors = vectors || DEFAULT_SCHEMA.vectors || {}
  const activeTokens = tokens || DEFAULT_SCHEMA.tokens || []

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>2</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Vector Embedding Space (High-Dim)
        </span>
      </div>

      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 10, fontFamily: 'monospace' }}>
          // mapping_tokens_to_coordinates...
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeTokens.map((t, i) => {
            const vec = activeVectors[t.word] || [0, 0, 0]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg4)', padding: '6px 10px', borderRadius: 3, border: '1px solid var(--border2)' }}>
                <span style={{ fontSize: 10, fontWeight: 600, width: 60, color: 'var(--text2)' }}>{t.word}</span>
                
                {/* Visual coordinate bars */}
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  {vec.map((coord, ci) => (
                    <div key={ci} style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: '50%', 
                        width: `${Math.abs(coord * 50)}%`, 
                        height: '100%', 
                        background: ci === 0 ? '#ff4b4b' : ci === 1 ? '#4bff4b' : '#4b4bff',
                        transform: coord < 0 ? 'translateX(-100%)' : 'translateX(0)',
                        transition: 'all 0.5s ease'
                      }} />
                    </div>
                  ))}
                </div>

                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text3)', width: 80, textAlign: 'right' }}>
                  [{vec.map(v => v.toFixed(2)).join(', ')}]
                </span>
              </div>
            )
          })}
        </div>

        {/* 3D Simulation Placeholder - To match your Niri vibe */}
        <div style={{ 
          marginTop: 15, height: 100, border: '1px dashed var(--border)', borderRadius: 4, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          background: 'radial-gradient(circle, var(--blue3) 0%, transparent 70%)' 
        }}>
           <span style={{ fontSize: 9, color: 'var(--blue)', letterSpacing: '2px' }}>[ 3D_PROJECTION_ACTIVE ]</span>
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

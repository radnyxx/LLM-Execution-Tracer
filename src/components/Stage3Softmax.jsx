import React, { useState, useEffect, useRef, useMemo } from 'react'

const COLORS = ['#00d4ff', '#00ff9d', '#a855f7', '#ff4444', '#ffaa00']

/**
 * Real-world Logit Warping: 
 * Takes raw probabilities, converts to logits, applies temperature, and returns softmax.
 */
function applyTemperature(probs, temp) {
  const logits = probs.map(p => Math.log(Math.max(p, 1e-10)) / Math.max(temp, 0.01))
  const maxL = Math.max(...logits)
  const exps = logits.map(l => Math.exp(l - maxL))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

export default function Stage3({ softmax, temperature, topP = 0.7, onTempChange, onTokenSelected }) {
  const [shaking, setShaking] = useState(false)
  const prevTemp = useRef(temperature)

  // Calculate probabilities and sampling in one pass for consistency
  const { processedProbs, inNucleus, winnerIndex } = useMemo(() => {
    const rawProbs = softmax.map(s => s.prob ?? 0)
    const total = rawProbs.reduce((a, b) => a + b, 0) || 1
    const normalized = rawProbs.map(p => p / total)
    
    // 1. Warp the distribution
    const probs = applyTemperature(normalized, temperature)

    // 2. Determine Nucleus (Top-P) membership
    const indexed = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p)
    let cumul = 0
    const nucleusSet = new Set()
    for (const { p, i } of indexed) {
      nucleusSet.add(i)
      cumul += p
      if (cumul >= topP) break
    }

    // 3. Stochastic Sampling: The actual "AI Decision"
    // We only sample from the allowed nucleus
    const random = Math.random() * cumul
    let acc = 0
    let sampledIdx = indexed[0].i // Fallback
    for (const { p, i } of indexed) {
      acc += p
      if (random <= acc) {
        sampledIdx = i
        break
      }
    }

    return { processedProbs: probs, inNucleus: nucleusSet, winnerIndex: sampledIdx }
  }, [softmax, temperature, topP])

  // Sync the winner back to the LLM Generation stage
  useEffect(() => {
    if (softmax[winnerIndex]) {
      onTokenSelected?.(softmax[winnerIndex])
    }
  }, [winnerIndex, onTokenSelected, softmax])

  const handleTempUpdate = v => {
    onTempChange?.(v)
    if (Math.abs(v - prevTemp.current) > 0.08) {
      setShaking(true)
      setTimeout(() => setShaking(false), 450)
      prevTemp.current = v
    }
  }

  const tempDesc =
    temperature < 0.5 ? '// mode: deterministic (greedy)' :
    temperature > 1.2 ? '// mode: stochastic (creative)' :
                        '// mode: balanced'

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ 
          width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', 
          color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 
        }}>3</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Logit Warper · Nucleus Gate
        </span>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>
          // P(token | context) · top-p: {topP.toFixed(2)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {softmax.map((s, i) => {
            const p = processedProbs[i] ?? 0
            const rawP = (s.prob ?? 0) * 100 // Original probability for the "Ghost Bar"
            const col = s.clusterColor || COLORS[i % COLORS.length]
            const excluded = !inNucleus.has(i)
            const isWinner = i === winnerIndex

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, textAlign: 'right', fontSize: 10, color: isWinner ? '#fff' : 'var(--text3)', fontWeight: isWinner ? 700 : 400, flexShrink: 0 }}>
                  {isWinner ? '➢ ' : ''}{s.word}
                </div>
                
                <div style={{ flex: 1, height: 18, background: 'var(--bg4)', borderRadius: 2, position: 'relative' }}>
                  {/* Ghost Bar: Shows original weight before temperature warping */}
                  <div style={{
                    position: 'absolute', height: '100%', width: `${rawP}%`,
                    borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                    zIndex: 0, transition: 'width 0.3s ease'
                  }} />

                  {/* Active Probability Bar */}
                  <div style={{
                    height: '100%', width: `${(p * 100).toFixed(1)}%`,
                    borderRadius: 2, position: 'relative', zIndex: 1,
                    background: excluded ? '#1e293b' : `linear-gradient(90deg, ${col}44, ${col})`,
                    boxShadow: isWinner ? `0 0 12px ${col}88` : 'none',
                    opacity: excluded ? 0.2 : 1,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: shaking && !excluded ? 'shake 0.4s ease' : undefined,
                  }} />
                </div>

                <div style={{ fontSize: 9, color: excluded ? 'var(--border2)' : col, width: 38, flexShrink: 0, fontFamily: 'JetBrains Mono' }}>
                  {(p * 100).toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Temperature Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text3)' }}>Temperature Control</span>
              <span style={{ fontSize: 10, color: 'var(--blue)', fontFamily: 'JetBrains Mono' }}>{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0.01} max={2} step={0.01}
              value={temperature}
              onChange={e => handleTempUpdate(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
            />
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--border2)', marginTop: 6, fontStyle: 'italic' }}>{tempDesc}</div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}

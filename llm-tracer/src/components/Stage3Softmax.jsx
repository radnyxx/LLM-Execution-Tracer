import React, { useState, useEffect, useRef } from 'react'

const TOP_P = 0.70
const COLORS = ['#00d4ff', '#00ff9d', '#a855f7', '#ff4444', '#ffaa00']

function applyTemperature(probs, temp) {
  const logits = probs.map(p => Math.log(Math.max(p, 1e-10)) / Math.max(temp, 0.01))
  const maxL = Math.max(...logits)
  const exps = logits.map(l => Math.exp(l - maxL))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

export default function Stage3({ softmax, temperature, onTempChange }) {
  const [localTemp, setLocalTemp] = useState(temperature ?? 0.7)
  const [shaking, setShaking] = useState(false)
  const prevTemp = useRef(localTemp)

  useEffect(() => { setLocalTemp(temperature ?? 0.7) }, [temperature])

  const handleTemp = v => {
    setLocalTemp(v)
    onTempChange?.(v)
    if (Math.abs(v - prevTemp.current) > 0.08) {
      setShaking(true)
      setTimeout(() => setShaking(false), 450)
      prevTemp.current = v
    }
  }

  const rawProbs = softmax.map(s => s.prob ?? 0)
  const total = rawProbs.reduce((a, b) => a + b, 0) || 1
  const normalized = rawProbs.map(p => p / total)
  const probs = applyTemperature(normalized, localTemp)

  // Nucleus sampling: which tokens are in top-P?
  const indexed = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p)
  let cumul = 0
  const inNucleus = new Set()
  for (const { p, i } of indexed) {
    if (cumul >= TOP_P) break
    inNucleus.add(i)
    cumul += p
  }

  const tempDesc =
    localTemp < 0.5 ? '// low temp → peaked, deterministic output' :
    localTemp > 1.2 ? '// high temp → flat, chaotic sampling' :
                      '// moderate temp → balanced entropy'

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>3</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Softmax Race · Nucleus Sampling
        </span>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 8 }}>
          // NEXT-TOKEN PROBABILITY DISTRIBUTION  ·  top-p = {TOP_P.toFixed(2)}
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {softmax.map((s, i) => {
            const p = probs[i] ?? 0
            const col = COLORS[i % COLORS.length]
            const excluded = !inNucleus.has(i)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, textAlign: 'right', fontSize: 10, color: excluded ? 'var(--border2)' : 'var(--text2)', flexShrink: 0 }}>
                  {s.word ?? '?'}
                </div>
                <div style={{ flex: 1, height: 20, background: 'var(--bg4)', borderRadius: 2, position: 'relative', overflow: 'visible' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(p * 100).toFixed(1)}%`,
                      borderRadius: 2,
                      background: excluded ? '#1e293b' : `linear-gradient(90deg, ${col}88, ${col})`,
                      boxShadow: excluded ? 'none' : `0 0 8px ${col}55`,
                      opacity: excluded ? 0.25 : 1,
                      transition: 'width 0.45s ease',
                      animation: shaking && !excluded ? 'shake 0.4s ease' : undefined,
                    }}
                  />
                </div>
                <div style={{ fontSize: 9, color: excluded ? 'var(--border2)' : col, width: 38, flexShrink: 0 }}>
                  {(p * 100).toFixed(1)}%
                </div>
                {excluded && (
                  <span style={{ fontSize: 8, color: 'var(--amber)', flexShrink: 0 }}>✕ cut</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Nucleus note */}
        <div style={{
          padding: '6px 8px',
          background: 'rgba(255,170,0,0.05)',
          border: '1px solid rgba(255,170,0,0.2)',
          borderRadius: 3,
          fontSize: 9,
          color: 'var(--amber)',
          marginBottom: 10,
        }}>
          ▶ nucleus samples only from tokens with cumulative P ≥ top-p threshold
        </div>

        {/* Temperature slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
          <span style={{ color: 'var(--text3)', fontSize: 9, minWidth: 84 }}>temperature:</span>
          <input
            type="range"
            min={0.01} max={2} step={0.01}
            value={localTemp}
            onChange={e => handleTemp(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--blue)' }}
          />
          <span style={{ color: 'var(--blue)', width: 30, textAlign: 'right' }}>
            {localTemp.toFixed(2)}
          </span>
        </div>
        <div style={{ fontSize: 9, color: 'var(--border2)', marginTop: 4 }}>{tempDesc}</div>
      </div>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-2px)}30%{transform:translateX(2px)}50%{transform:translateX(-2px)}70%{transform:translateX(2px)}90%{transform:translateX(-2px)}}`}</style>
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

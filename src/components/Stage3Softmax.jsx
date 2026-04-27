import React, { useMemo } from 'react'

// Professional sampling colors
const COLORS = {
  active: 'var(--blue)',
  filtered: '#1e293b',
  winner: 'var(--green)',
}

export default function Stage3Softmax({ softmax, temperature, topP = 0.7, onTokenSelected }) {
  
  // REAL LLM LOGIC: Apply Temperature and Top-P filtering
  const processedData = useMemo(() => {
    if (!softmax || softmax.length === 0) return [];

    // 1. Convert Probs to Logits (Simplified inverse softmax for visualization)
    const logits = softmax.map(s => ({
      ...s,
      logit: Math.log(s.prob / (1 - s.prob))
    }));

    // 2. Apply Temperature Warping
    // T < 1 sharpens (makes peak higher), T > 1 flattens (makes it random)
    const warped = logits.map(l => ({
      ...l,
      warpedProb: Math.exp(l.logit / Math.max(temperature, 0.01))
    }));

    // 3. Normalize back to 100%
    const sum = warped.reduce((a, b) => a + b.warpedProb, 0);
    const normalized = warped.map(w => ({
      ...w,
      finalProb: w.warpedProb / sum
    })).sort((a, b) => b.finalProb - a.finalProb);

    // 4. Top-P (Nucleus) Filtering
    let cumulative = 0;
    return normalized.map(n => {
      const wasInNucleus = cumulative < topP;
      cumulative += n.finalProb;
      return { ...n, inNucleus: wasInNucleus };
    });
  }, [softmax, temperature, topP]);

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>3</StageNum>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Probability Distribution & Sampling
          </span>
          <span style={{ fontSize: 8, color: 'var(--text3)' }}>
            Logit Warping (Temp: {temperature.toFixed(2)}) + Nucleus (P: {topP.toFixed(2)})
          </span>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {/* Visualization of the Sampling Gate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {processedData.map((token, i) => (
            <div 
              key={i} 
              onClick={() => token.inNucleus && onTokenSelected?.(token)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 10, 
                cursor: token.inNucleus ? 'pointer' : 'not-allowed',
                opacity: token.inNucleus ? 1 : 0.4 
              }}
            >
              <div style={{ width: 65, textAlign: 'right', fontSize: 10, color: token.inNucleus ? 'var(--text)' : 'var(--text3)', fontFamily: 'monospace' }}>
                {token.word}
              </div>

              {/* Probability Bar */}
              <div style={{ flex: 1, height: 14, background: 'var(--bg4)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(token.finalProb * 100).toFixed(2)}%`,
                  background: token.inNucleus ? `linear-gradient(90deg, var(--blue3), var(--blue))` : COLORS.filtered,
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: token.inNucleus && i === 0 ? `0 0 10px var(--blue3)` : 'none'
                }} />
              </div>

              <div style={{ width: 35, fontSize: 9, color: token.inNucleus ? 'var(--blue)' : 'var(--text3)', fontFamily: 'monospace' }}>
                {(token.finalProb * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Legend / Status */}
        <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'monospace' }}>
             {temperature < 0.7 ? '// Mode: ArgMax (Greedy)' : temperature > 1.2 ? '// Mode: Stochastic' : '// Mode: Balanced'}
          </div>
          <div style={{ fontSize: 8, color: 'var(--border2)', textTransform: 'uppercase' }}>
            Tokens outside Nucleus are discarded
          </div>
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

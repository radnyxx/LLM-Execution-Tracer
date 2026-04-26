import React, { useState, useEffect, useRef } from 'react'

const POEM =
  'The whistle screams across the pitch,\n' +
  'Eleven warriors surge and switch.\n' +
  'The ball arcs high through fading light,\n' +
  'A poem written in glorious flight.\n\n' +
  'Mud-caked boots and hearts aflame,\n' +
  'Each tackle played like life\'s own game.'

const STEPS = ['TOKENIZE', 'EMBED', 'ATTEND', 'DECODE', 'SAMPLE', 'APPEND']
const KV_SLOTS = 32

export default function Stage4() {
  const [displayed, setDisplayed] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [kvCount, setKvCount] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [done, setDone] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setInterval(() => {
      setCharIdx(prev => {
        if (prev >= POEM.length) {
          clearInterval(timer.current)
          setDone(true)
          return prev
        }
        const next = prev + 1
        setDisplayed(POEM.slice(0, next))
        if (next % 5 === 0) setKvCount(k => Math.min(k + 1, KV_SLOTS))
        setActiveStep(s => (s + 1) % STEPS.length)
        return next
      })
    }, 55)
    return () => clearInterval(timer.current)
  }, [])

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>4</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Iterative Generation Loop
        </span>
      </div>

      <div style={{ padding: 12 }}>
        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 10, rowGap: 6 }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '4px 8px',
                border: `1px solid ${activeStep === i && !done ? 'var(--blue)' : 'var(--border2)'}`,
                borderRadius: 3,
                fontSize: 9,
                color: activeStep === i && !done ? 'var(--blue)' : 'var(--text3)',
                background: activeStep === i && !done ? 'var(--blue4)' : 'var(--bg3)',
                boxShadow: activeStep === i && !done ? '0 0 8px rgba(0,212,255,0.2)' : undefined,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}>
                {step}
              </div>
              <div style={{
                color: i < STEPS.length - 1 ? 'var(--border2)' : 'var(--amber)',
                fontSize: 12,
                padding: '0 3px',
                flexShrink: 0,
              }}>
                {i < STEPS.length - 1 ? '→' : '↻'}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Terminal */}
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>
          // TERMINAL OUTPUT  ·  auto-regressive decoding
        </div>
        <div style={{
          background: '#000',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '10px 12px',
          fontFamily: 'var(--font)',
          fontSize: 11,
          minHeight: 80,
          color: 'var(--green)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}>
          <span style={{ color: 'var(--blue)' }}>$ llm.generate(&quot;Write a poem on football&quot;){'\n'}</span>
          {displayed}
          {!done && <span style={{
            display: 'inline-block',
            width: 7, height: 13,
            background: 'var(--green)',
            verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
          }} />}
        </div>

        {/* KV Cache */}
        <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 10, marginBottom: 4 }}>
          // KV-CACHE  ·  attention memory buffer
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Array.from({ length: KV_SLOTS }, (_, i) => (
            <div key={i} style={{
              width: 14, height: 14,
              borderRadius: 2,
              background: i < kvCount ? 'var(--blue3)' : 'var(--bg4)',
              border: `1px solid ${i < kvCount ? 'var(--blue)' : 'var(--border)'}`,
              transition: 'all 0.3s',
              animation: i === kvCount - 1 ? 'kv-pulse 1s ease-in-out' : undefined,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--border2)', marginTop: 5 }}>
          // {kvCount}/{KV_SLOTS} context slots allocated · memory: {(kvCount * 0.5).toFixed(1)} KB
        </div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes kv-pulse { 0% { box-shadow: 0 0 0 0 rgba(0,212,255,0.5); } 100% { box-shadow: 0 0 0 4px rgba(0,212,255,0); } }
      `}</style>
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

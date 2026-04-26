import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SCHEMA, DEFAULT_JSON } from './schema.js'
import Sidebar from './components/Sidebar.jsx'
import Stage1Tokenization from './components/Stage1Tokenization.jsx'
import Stage2Vectors from './components/Stage2Vectors.jsx'
import Stage3Softmax from './components/Stage3Softmax.jsx'
import Stage4Generation from './components/Stage4Generation.jsx'

function PulseDot() {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: 'var(--green)',
      animation: 'pulse-dot 1.5s ease-in-out infinite',
    }} />
  )
}

function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: 'var(--blue)' }}>{time}</span>
}

export default function App() {
  const [jsonText, setJsonText] = useState(DEFAULT_JSON)
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)
  const [parseError, setParseError] = useState('')
  const [temperature, setTemperature] = useState(DEFAULT_SCHEMA.temperature)

  // Debounced live parse
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonText)
        setSchema(parsed)
        setTemperature(parsed.temperature ?? 0.7)
        setParseError('')
      } catch (e) {
        setParseError(e.message.slice(0, 50))
      }
    }, 400)
    return () => clearTimeout(t)
  }, [jsonText])

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText)
      setSchema(parsed)
      setTemperature(parsed.temperature ?? 0.7)
      setParseError('')
    } catch (e) {
      setParseError('JSON error: ' + e.message.slice(0, 40))
    }
  }, [jsonText])

  // Temperature slider → sync back to JSON
  const handleTempChange = useCallback(v => {
    setTemperature(v)
    try {
      const parsed = JSON.parse(jsonText)
      parsed.temperature = v
      const updated = JSON.stringify(parsed, null, 2)
      setJsonText(updated)
      setSchema(parsed)
    } catch (_) {}
  }, [jsonText])

  const tokens = schema.tokens ?? []
  const vectors = schema.vectors ?? {}
  const softmax = schema.softmax ?? []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <PulseDot />
          LLM Execution Tracer
          <span style={{ color: 'var(--border2)', fontWeight: 300 }}>// prompt: "Write a poem on football"</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text3)' }}>
          <span style={{ padding: '2px 6px', border: '1px solid var(--border2)', borderRadius: 3, fontSize: 10, color: 'var(--blue)', background: 'var(--blue4)' }}>
            claude-sonnet
          </span>
          <span>backend_trace_v2.1</span>
          <Clock />
        </div>
      </header>

      {/* ── Main ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          jsonText={jsonText}
          setJsonText={setJsonText}
          onApply={handleApply}
          parseError={parseError}
        />

        {/* Stage grid */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage1Tokenization tokens={tokens} />
            <Stage2Vectors vectors={vectors} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage3Softmax
              softmax={softmax}
              temperature={temperature}
              onTempChange={handleTempChange}
            />
            <Stage4Generation />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,255,157,0.4); }
          50%      { opacity:0.7; box-shadow:0 0 0 4px rgba(0,255,157,0); }
        }
      `}</style>
    </div>
  )
}

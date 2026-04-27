import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SCHEMA, DEFAULT_JSON } from './schema.js'
import Sidebar from './components/Sidebar.jsx'
import Stage1Tokenization from './components/Stage1Tokenization.jsx'
import Stage2Vectors from './components/Stage2Vectors.jsx'
import Stage3Softmax from './components/Stage3Softmax.jsx'
import Stage4Generation from './components/Stage4Generation.jsx'

// UI Utility: The status indicator in the header
function PulseDot() {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: 'var(--green)',
      animation: 'pulse-dot 1.5s ease-in-out infinite',
    }} />
  )
}

// UI Utility: System clock for the "Rice" aesthetic
function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: 'var(--blue)' }}>{time}</span>
}

export default function App() {
  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [parseError, setParseError] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [selectedToken, setSelectedToken] = useState(null);

  // 1. Debounced Parse: Keeps the UI responsive while you type JSON
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonText)
        setSchema(parsed)
        // Only update local temperature if the JSON actually changed it
        if (parsed.temperature !== undefined && parsed.temperature !== temperature) {
          setTemperature(parsed.temperature)
        }
        setParseError('')
      } catch (e) {
        setParseError(e.message.slice(0, 50))
      }
    }, 400)
    return () => clearTimeout(t)
  }, [jsonText])

  // 2. Explicit Apply: For when you click the "Run" button
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

  // 3. Global Temperature Sync: Connects Stage 3 slider to JSON and Schema
  const handleTempChange = useCallback(v => {
    setTemperature(v)
    setJsonText(prev => {
      try {
        const parsed = JSON.parse(prev)
        parsed.temperature = v
        // We update the schema immediately so Stage 3/4 react instantly
        setSchema(parsed) 
        return JSON.stringify(parsed, null, 2)
      } catch (_) {
        return prev
      }
    })
  }, [])

  const tokens = schema.tokens ?? []
  const vectors = schema.vectors ?? {}
  const softmax = schema.softmax ?? []

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg1)', color: 'var(--text1)' }}>
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
          <span style={{ color: 'var(--border2)', fontWeight: 300, marginLeft: 8, textTransform: 'none' }}>
            // prompt: "{schema.prompt_topic || "Dynamic Context"}"
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text3)' }}>
          <span style={{ padding: '2px 6px', border: '1px solid var(--border2)', borderRadius: 3, fontSize: 10, color: 'var(--blue)', background: 'var(--blue4)' }}>
            cachy-v2-niri
          </span>
          <span>trace_engine_active</span>
          <Clock />
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          jsonText={jsonText}
          setJsonText={setJsonText}
          onApply={handleApply}
          parseError={parseError}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Top Row: Tokenization and 3D Vectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage1Tokenization tokens={tokens} />
            <Stage2Vectors vectors={vectors} tokens={tokens} />
          </div>

          {/* Bottom Row: Softmax Decision and Final Generation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage3Softmax
              softmax={softmax}
              temperature={temperature}
              topP={0.7}
              onTempChange={handleTempChange}
              onTokenSelected={setSelectedToken}
            />
            <Stage4Generation
              selectedToken={selectedToken}
              schema={schema}
              temperature={temperature}
            />
          </div>
        </main>
      </div>

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(0, 212, 255, 0); }
        }
        /* Custom scrollbar for that Linux Terminal look */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); borderRadius: 2px; }
      `}</style>
    </div>
  )
}

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
  
  // Logic States
  const [temperature, setTemperature] = useState(DEFAULT_SCHEMA.temperature)
  const [topP, setTopP] = useState(0.7) // New Nucleus Sampling state
  const [selectedToken, setSelectedToken] = useState(null)

  // Debounced live parse for the JSON Sandbox
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

  // Sync temperature slider back to JSON text
  const handleTempChange = useCallback(v => {
    setTemperature(v)
    try {
      const parsed = JSON.parse(jsonText)
      parsed.temperature = v
      setJsonText(JSON.stringify(parsed, null, 2))
      setSchema(parsed)
    } catch (_) {}
  }, [jsonText])

  const tokens = schema.tokens ?? []
  const vectors = schema.vectors ?? {}
  const softmax = schema.softmax ?? []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg1)', color: 'var(--text1)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <PulseDot />
          LLM Execution Tracer
          <span style={{ color: 'var(--border2)', fontWeight: 300, marginLeft: 8 }}>
            // prompt: "{schema.prompt_topic || "System Trace"}"
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text3)' }}>
          <span style={{ padding: '2px 6px', border: '1px solid var(--border2)', borderRadius: 3, fontSize: 10, color: 'var(--blue)', background: 'var(--blue4)' }}>
            llama-3.1-8b
          </span>
          <Clock />
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          jsonText={jsonText}
          setJsonText={setJsonText}
          onApply={handleApply}
          parseError={parseError}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Top Row: Tokenization & Vectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage1Tokenization tokens={tokens} />
            <Stage2Vectors vectors={vectors} tokens={tokens} />
          </div>

          {/* Bottom Row: Softmax & Live Generation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stage3Softmax
              softmax={softmax}
              temperature={temperature}
              topP={topP}
              onTempChange={handleTempChange}
              onTokenSelected={(token) => {
                // Clicking a bar in Stage 3 injects it into Stage 4
                setSelectedToken({ ...token, timestamp: Date.now() });
              }}
            />
            <Stage4Generation
              schema={schema}
              temperature={temperature}
              selectedToken={selectedToken}
            />
          </div>

          {/* Nucleus Control Overlay (Global) */}
          <div style={{ 
            marginTop: 'auto', padding: '10px', background: 'var(--bg2)', 
            border: '1px solid var(--border)', borderRadius: 4, display: 'flex', 
            alignItems: 'center', gap: 20 
          }}>
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>
                  <span>GLOBAL_NUCLEUS_THRESHOLD (TOP-P)</span>
                  <span style={{ color: 'var(--blue)' }}>{topP.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.1" max="1.0" step="0.01" 
                  value={topP} 
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
                />
             </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,255,157,0.4); }
          50%      { opacity:0.7; box-shadow:0 0 0 4px rgba(0,255,157,0); }
        }
        :root {
          --font: 'JetBrains Mono', monospace;
          --bg1: #020617;
          --bg2: #0f172a;
          --bg3: #1e293b;
          --bg4: #000000;
          --border: #1e293b;
          --border2: #334155;
          --blue: #00d4ff;
          --blue4: rgba(0, 212, 255, 0.05);
          --green: #00ff9d;
          --red: #ff4b4b;
          --text1: #f8fafc;
          --text3: #64748b;
        }
        body { margin: 0; font-family: var(--font); background: var(--bg1); color: var(--text1); }
      `}</style>
    </div>
  )
}

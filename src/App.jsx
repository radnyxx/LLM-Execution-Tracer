import React, { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SCHEMA, DEFAULT_JSON } from './schema.js' 
import Sidebar from './components/Sidebar.jsx'
import Stage1Tokenization from './components/Stage1Tokenization.jsx'
import Stage2Vectors from './components/Stage2Vectors.jsx'
import Stage3Softmax from './components/Stage3Softmax.jsx'
import Stage4Generation from './components/Stage4Generation.jsx'
import SchemaModal from './components/SchemaModal.jsx'

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
  const [showWelcome, setShowWelcome] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promptInput, setPromptInput] = useState("")
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)
  const [temperature, setTemperature] = useState(DEFAULT_SCHEMA.temperature || 0.7)
  const [topP, setTopP] = useState(0.7)

  const handlePromptSubmit = (text) => {
    if (!text.trim()) return;
    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w, i) => ({
      word: w,
      id: Math.floor(Math.random() * 50000),
      // Assigning slightly higher weight to the first few words for visual clustering
      weight: parseFloat((Math.random() * (1.0 - 0.1) + 0.1).toFixed(2))
    }));

    setDisplayed(prev =>
      `[SYSTEM] New schema initialized. ${newTokens.length} tokens mapped to vector space.\n` + prev);

    setSchema(prev => ({
      ...prev,
      prompt_topic: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
      tokens: newTokens
    }));
  };

  const tokens = schema.tokens ?? []
  const vectors = schema.vectors ?? {}

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--bg1)', 
      color: 'var(--text1)', 
      overflow: 'hidden' // Strictly prevent page scroll
    }}>
      
      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-box">
            <h1 style={{ color: 'var(--blue)', fontSize: 18, marginBottom: 10 }}>SYSTEM_INITIALIZED</h1>
            <p style={{ color: 'var(--text3)', fontSize: 11, lineHeight: 1.6 }}>
              Welcome to the LLM Execution Tracer. <br />
              Observe the geometric transformation of language <br />
              into high-dimensional neural vectors.
            </p>
            <div style={{ marginTop: 20, fontSize: 9, color: 'var(--green)' }}>[ CLICK TO ENTER ]</div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <SchemaModal 
          schema={schema} 
          setSchema={setSchema} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)', flexShrink: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <PulseDot />
          LLM Execution Tracer
          <span style={{ color: 'var(--border2)', fontWeight: 300, marginLeft: 8 }}>
            // prompt: "{schema.prompt_topic || "Awaiting Input..."}"
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text3)' }}>
          <span style={{ padding: '2px 6px', border: '1px solid var(--border2)', borderRadius: 3, color: 'var(--blue)', background: 'var(--blue4)' }}>
            llama-3.1-8b
          </span>
          <Clock />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar 
          promptInput={promptInput}
          setPromptInput={setPromptInput}
          onSubmit={handlePromptSubmit}
          onOpenSchema={() => setIsModalOpen(true)}
          temperature={temperature}
          setTemperature={setTemperature}
        />

        {/* 4-QUADRANT SYMMETRIC GRID */}
        <main style={{ 
          flex: 1, 
          padding: 12, 
          display: 'grid',
          gap: 12,
          gridTemplateColumns: '1fr 1fr', 
          gridTemplateRows: '1fr 1fr', 
          // Ensures the grid exactly fits the space between header and footer
          height: '100%',
          overflow: 'hidden' 
        }}>
          <Stage1Tokenization tokens={tokens} />
          <Stage2Vectors vectors={vectors} tokens={tokens} />
          <Stage3Softmax />
          <Stage4Generation schema={schema} temperature={temperature}/>
        </main>
      </div>

      <footer style={{ 
        padding: '8px 16px', background: 'var(--bg2)', 
        borderTop: '1px solid var(--border)', display: 'flex', 
        alignItems: 'center', gap: 20, height: 40, flexShrink: 0
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>GLOBAL_NUCLEUS_THRESHOLD (TOP-P)</span>
            <input 
              type="range" min="0.1" max="1.0" step="0.01" 
              value={topP} 
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--blue)', cursor: 'pointer', height: 4 }}
            />
            <span style={{ color: 'var(--blue)', fontSize: 10, width: 30 }}>{topP.toFixed(2)}</span>
          </div>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,255,157,0.4); }
          50%      { opacity:0.7; box-shadow:0 0 0 4px rgba(0,255,157,0); }
        }
        
        .welcome-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(2, 6, 23, 0.98);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; cursor: pointer;
        }

        .welcome-box {
          border: 1px solid var(--blue);
          background: var(--bg2);
          padding: 40px;
          text-align: center;
          max-width: 400px;
          animation: welcomeFade 0.8s ease-out;
        }

        @keyframes welcomeFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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
          --blue4: rgba(0, 212, 255, 0.1);
          --green: #00ff9d;
          --red: #ff4b4b;
          --text1: #f8fafc;
          --text3: #64748b;
        }
        body { margin: 0; font-family: var(--font); background: var(--bg1); color: var(--text1); overflow: hidden; }
      `}</style>
    </div>
  )
}

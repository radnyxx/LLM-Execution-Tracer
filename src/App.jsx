import React, { useState } from 'react'
import { DEFAULT_SCHEMA } from './schema.js' 
import Sidebar from './components/Sidebar.jsx'
import Stage1Tokenization from './components/Stage1Tokenization.jsx'
import Stage2Vectors from './components/Stage2Vectors.jsx'
import Stage3Softmax from './components/Stage3Softmax.jsx'
import Stage4Generation from './components/Stage4Generation.jsx'
import SchemaModal from './components/SchemaModal.jsx'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promptInput, setPromptInput] = useState("")
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)
  const [temperature, setTemperature] = useState(0.7)
  const [activeStage, setActiveStage] = useState(null);

  // FIXED INITIALIZER: Direct state injection with a visible sequence
  const handlePromptSubmit = (text) => {
    if (!text || !text.trim()) return;
    
    // 1. Reset and Start Sequence
    setActiveStage(1);
    
    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w) => ({
      word: w,
      id: Math.floor(Math.random() * 50000),
      weight: parseFloat((Math.random() * 0.7 + 0.2).toFixed(2)) // Higher min weight for better plot visibility
    }));
    
    // 2. Sequential State Updates (The "Process" you wanted)
    setTimeout(() => {
      setSchema(prev => ({ ...prev, prompt_topic: text.slice(0, 30), tokens: newTokens }));
      setActiveStage(2); 
    }, 600);

    setTimeout(() => setActiveStage(3), 1400);
    setTimeout(() => setActiveStage(null), 2200);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg1)', color: 'var(--text1)', overflow: 'hidden' }}>
      
      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-box">
            <h1 style={{ color: 'var(--blue)', fontSize: 18, letterSpacing: '2px', fontWeight: 900 }}>SYSTEM_TRACE_v2.06</h1>
            <p style={{ color: 'var(--text3)', fontSize: 10 }}>[ CLICK_TO_INITIALIZE ]</p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <SchemaModal schema={schema} setSchema={setSchema} onClose={() => setIsModalOpen(false)} />
      )}

      <header style={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 900 }}>SEQUENCE_TRACER</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 9, fontWeight: 700 }}>
             <span style={{ color: activeStage === 1 ? 'var(--green)' : 'var(--text3)' }}>TOKENIZE</span>
             <span style={{ color: 'var(--border2)' }}>/</span>
             <span style={{ color: activeStage === 2 ? 'var(--green)' : 'var(--text3)' }}>EMBED</span>
             <span style={{ color: 'var(--border2)' }}>/</span>
             <span style={{ color: activeStage === 3 ? 'var(--green)' : 'var(--text3)' }}>ATTEND</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'monospace' }}>
          {activeStage ? `PROCESSING_STAGE_0${activeStage}...` : 'READY'}
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

        <main style={{ 
          flex: 1, padding: 15, display: 'grid', gap: 15,
          gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
          height: 'calc(100vh - 45px)', overflow: 'hidden' 
        }}>
          <div className={activeStage === 1 ? 'stage-active' : ''} style={stageWrapper}>
            <Stage1Tokenization tokens={schema.tokens || []} />
          </div>
          <div className={activeStage === 2 ? 'stage-active' : ''} style={stageWrapper}>
            <Stage2Vectors tokens={schema.tokens || []} />
          </div>
          <div className={activeStage === 3 ? 'stage-active' : ''} style={stageWrapper}>
            <Stage3Softmax />
          </div>
          <div className={activeStage === 4 ? 'stage-active' : ''} style={stageWrapper}>
            <Stage4Generation 
              schema={schema} 
              temperature={temperature} 
              onStart={() => setActiveStage(4)} 
              onEnd={() => setActiveStage(null)} 
            />
          </div>
        </main>
      </div>

      <style>{`
        :root {
          --bg1: #020617; --bg2: #0f172a; --bg3: #1e293b; --bg4: #000;
          --border: #1e293b; --border2: #334155; --blue: #00d4ff;
          --green: #00ff9d; --red: #ff4b4b; --text1: #f8fafc; --text3: #64748b;
          --font: 'JetBrains Mono', monospace;
        }
        body { margin: 0; font-family: var(--font); background: var(--bg1); overflow: hidden; }
        .stage-active { animation: pulse 1.2s infinite; border-color: var(--blue) !important; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0px var(--blue); }
          50% { box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); }
          100% { box-shadow: 0 0 0px var(--blue); }
        }
        .welcome-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.99); z-index: 1000; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .welcome-box { border: 1px solid var(--blue); padding: 50px; background: var(--bg2); text-align: center; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }
      `}</style>
    </div>
  )
}

const stageWrapper = { height: '100%', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg2)' };

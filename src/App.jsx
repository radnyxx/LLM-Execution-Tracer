import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Stage1Tokenization from './components/Stage1Tokenization';
import Stage2Vectors from './components/Stage2Vectors';
import Stage3Softmax from './components/Stage3Softmax';
import Stage4Generation from './components/Stage4Generation';
import { DEFAULT_SCHEMA } from './schema';

export default function App() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [temperature, setTemperature] = useState(0.7);
  const [showWelcome, setShowWelcome] = useState(true); // WELCOME SCREEN STATE
  
  // SHARED NEURAL STATE
  const [neuralState, setNeuralState] = useState({
    probs: [],
    activeTokenIndex: -1,
    isProcessing: false
  });

  // The "Neural Bridge" - keeps the heatmap and terminal in sync
  const handleNeuralUpdate = useCallback((data) => {
    setNeuralState(prev => ({ ...prev, ...data }));
  }, []);

  // FIXED INITIALIZE LOGIC
  const handlePromptSubmit = (text) => {
    if (!text || !text.trim()) return;

    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w) => ({
      word: w,
      id: Math.random().toString(36).substr(2, 9),
      weight: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2))
    }));

    // We use a functional update here to ensure we don't miss any state changes
    setSchema(prev => ({
      ...prev,
      prompt_topic: text.slice(0, 30),
      tokens: newTokens
    }));
  };

  return (
    <div style={containerStyle}>
      {/* THE WELCOME OVERLAY */}
      {showWelcome && (
        <div style={welcomeOverlayStyle} onClick={() => setShowWelcome(false)}>
          <div style={welcomeBoxStyle}>
            <div style={{ color: 'var(--blue)', fontWeight: 900, marginBottom: 10 }}>[ SYSTEM_INITIALIZED ]</div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#94a3b8' }}>
              Neural Sequence Tracer v2.0 detected. Matrix weights loaded. 
              Initialize tokens to begin inference sequence.
            </p>
            <div style={{ marginTop: 20, fontSize: 9, color: 'var(--green)', animate: 'pulse 2s infinite' }}>
              &gt; CLICK_TO_ENTER_DASHBOARD
            </div>
          </div>
        </div>
      )}

      <header style={headerStyle}>
        <span style={{ color: 'var(--blue)', fontWeight: 900 }}>NEURAL_FLOW_v2</span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ color: neuralState.isProcessing ? 'var(--green)' : 'var(--text3)', fontSize: 10 }}>
            {neuralState.isProcessing ? "● GEN_IN_PROGRESS" : "○ STANDBY"}
          </span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar 
          onSubmit={handlePromptSubmit} 
          temperature={temperature} 
          setTemperature={setTemperature} 
        />
        
        <main style={gridStyle}>
          <div style={boxStyle}><Stage1Tokenization tokens={schema.tokens} /></div>
          <div style={boxStyle}><Stage2Vectors tokens={schema.tokens} /></div>
          
          <div style={boxStyle}>
            <Stage3Softmax 
              tokens={schema.tokens} 
              activeTokenIndex={neuralState.activeTokenIndex} 
            />
          </div>

          <div style={boxStyle}>
            <Stage4Generation 
              schema={schema} 
              temperature={temperature}
              onNeuralUpdate={handleNeuralUpdate}
            />
          </div>
        </main>
      </div>

      <style>{`
        :root {
          --blue: #00d4ff;
          --green: #00ff9d;
          --text3: #64748b;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// STYLES - Kept exactly as your "Rice" requires
const containerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', background: '#020617', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', position: 'relative' };
const headerStyle = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12 };
const gridStyle = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15, padding: 15 };
const boxStyle = { border: '1px solid #1e293b', borderRadius: 4, background: '#0f172a', overflow: 'hidden' };

const welcomeOverlayStyle = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const welcomeBoxStyle = {
  width: 400, padding: 30, background: '#0f172a', border: '1px solid #1e293b',
  borderRadius: 4, textAlign: 'center', boxShadow: '0 0 40px rgba(0, 212, 255, 0.1)'
};

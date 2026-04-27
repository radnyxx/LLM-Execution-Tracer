import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Stage1Tokenization from './components/Stage1Tokenization';
import Stage2Vectors from './components/Stage2Vectors';
import Stage3Softmax from './components/Stage3Softmax';
import Stage4Generation from './components/Stage4Generation';
import SchemaModal from './components/SchemaModal'; 
import { DEFAULT_SCHEMA } from './schema';

export default function App() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [temperature, setTemperature] = useState(0.7);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [neuralState, setNeuralState] = useState({
    probs: [],
    activeTokenIndex: -1,
    isProcessing: false
  });

  const handleNeuralUpdate = useCallback((data) => {
    setNeuralState(prev => ({ ...prev, ...data }));
  }, []);

  const handlePromptSubmit = useCallback((text) => {
    if (!text || text.trim() === "") return;
    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w, i) => ({
      word: w,
      id: `t-${Date.now()}-${i}`,
      weight: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2))
    }));

    setSchema(prev => ({
      ...prev,
      prompt_topic: text.slice(0, 30),
      tokens: newTokens
    }));
  }, []);

  return (
    <div style={containerStyle}>
      {showWelcome && (
        <div style={welcomeOverlayStyle} onClick={() => setShowWelcome(false)}>
          <div style={welcomeBoxStyle}>
            <div style={{ color: '#38bdf8', fontWeight: 900, marginBottom: 10 }}>[ SYSTEM_INITIALIZED ]</div>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Click to unlock neural tracer dashboard.</p>
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

      <header style={headerStyle}>
        <span style={{ color: '#38bdf8', fontWeight: 900 }}>NEURAL_FLOW_v2</span>
        <span style={{ color: neuralState.isProcessing ? '#00ff9d' : '#475569', fontSize: 10 }}>
          {neuralState.isProcessing ? "● GEN_IN_PROGRESS" : "○ STANDBY"}
        </span>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar 
          onSubmit={handlePromptSubmit} 
          onOpenSchema={() => setIsModalOpen(true)} 
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
              logits={neuralState.probs}
            />
          </div>
          <div style={boxStyle}>
            {/* RESTORED: Passing only original props back to Stage 4 */}
            <Stage4Generation 
              schema={schema} 
              temperature={temperature} 
              onNeuralUpdate={handleNeuralUpdate} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// STYLES (Kept consistent with your original)
const containerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', background: '#020617', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', position: 'relative' };
const headerStyle = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12 };
const gridStyle = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15, padding: 15 };
const boxStyle = { border: '1px solid #1e293b', borderRadius: 4, background: '#0f172a', overflow: 'hidden' };
const welcomeOverlayStyle = { position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const welcomeBoxStyle = { width: 320, padding: 30, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, textAlign: 'center' };

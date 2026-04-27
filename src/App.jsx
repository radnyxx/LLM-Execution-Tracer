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
  
  // Shared state that Stage 4 will update and Stage 3 will consume
  const [neuralState, setNeuralState] = useState({
    probs: [],
    activeTokenIndex: -1,
    isProcessing: false
  });

  const handleNeuralUpdate = useCallback((data) => {
    setNeuralState(prev => ({ ...prev, ...data }));
  }, []);

  const handlePromptSubmit = (text) => {
    const tokens = text.trim().split(/\s+/).map(w => ({
      word: w,
      id: Math.random(),
      weight: Math.random() * 0.8 + 0.1
    }));
    setSchema({ ...schema, tokens });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <span style={{ color: 'var(--blue)', fontWeight: 900 }}>NEURAL_FLOW_v2</span>
        <span style={{ color: neuralState.isProcessing ? 'var(--green)' : 'var(--text3)', fontSize: 10 }}>
          {neuralState.isProcessing ? "● GEN_IN_PROGRESS" : "○ STANDBY"}
        </span>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onSubmit={handlePromptSubmit} temperature={temperature} setTemperature={setTemperature} />
        
        <main style={gridStyle}>
          <div style={boxStyle}><Stage1Tokenization tokens={schema.tokens} /></div>
          <div style={boxStyle}><Stage2Vectors tokens={schema.tokens} /></div>
          
          {/* STAGE 3: Reacts to activeTokenIndex from App state */}
          <div style={boxStyle}>
            <Stage3Softmax 
              tokens={schema.tokens} 
              activeTokenIndex={neuralState.activeTokenIndex} 
            />
          </div>

          {/* STAGE 4: Updates App state via onNeuralUpdate */}
          <div style={boxStyle}>
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

const containerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', background: '#020617', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' };
const headerStyle = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12 };
const gridStyle = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15, padding: 15 };
const boxStyle = { border: '1px solid #1e293b', borderRadius: 4, background: '#0f172a', overflow: 'hidden' };

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
    isProcessing: false,
    displayedText: "" // Track text here for sync
  });

  // RESTORED: Centralized Logic for Inference
  const handleRunInference = async () => {
    if (neuralState.isProcessing) return;

    setNeuralState(prev => ({ ...prev, isProcessing: true, displayedText: "" }));
    const promptText = schema.tokens.map(t => t.word).join(" ");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: promptText }],
          temperature: temperature,
          stream: true // Keep it streaming for the "Tracer" effect
        })
      });

      // Simple streaming reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Basic parsing for SSE (Server-Sent Events)
        const lines = chunk.split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
          if (line.includes("[DONE]")) break;
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content || "";
            
            if (content) {
              setNeuralState(prev => ({
                ...prev,
                displayedText: prev.displayedText + content,
                activeTokenIndex: Math.floor(Math.random() * schema.tokens.length),
                probs: [
                  { word: content.trim() || "...", p: 0.8 },
                  { word: "node", p: 0.1 },
                  { word: "vector", p: 0.05 }
                ]
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error("Inference Error:", error);
    } finally {
      setNeuralState(prev => ({ ...prev, isProcessing: false, activeTokenIndex: -1 }));
    }
  };

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
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Click to unlock.</p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <SchemaModal schema={schema} setSchema={setSchema} onClose={() => setIsModalOpen(false)} />
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
            <Stage4Generation 
              displayed={neuralState.displayedText}
              loading={neuralState.isProcessing}
              onRun={handleRunInference}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ... Styles (Container, Grid, etc.) remain exactly as you have them
const containerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', background: '#020617', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', position: 'relative' };
const headerStyle = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12 };
const gridStyle = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 15, padding: 15 };
const boxStyle = { border: '1px solid #1e293b', borderRadius: 4, background: '#0f172a', overflow: 'hidden' };
const welcomeOverlayStyle = { position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const welcomeBoxStyle = { width: 320, padding: 30, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, textAlign: 'center' };

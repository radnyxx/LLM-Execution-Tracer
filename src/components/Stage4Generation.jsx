import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
}) : null;

export default function Stage4Generation({ schema, temperature, onNeuralUpdate }) {
  const [displayed, setDisplayed] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSubStep, setActiveSubStep] = useState(0); 
  const [probs, setProbs] = useState([]);
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);

  // Sync visual pipeline with the processing state
  useEffect(() => {
    if (!loading) {
      setActiveSubStep(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveSubStep(prev => (prev % 3) + 1);
    }, 180);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayed]);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const generateResponse = async () => {
    if (loading || !groq) return;

    setDisplayed('');
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    const promptText = schema?.tokens?.map(t => t.word).join(" ") || "";

    try {
      const stream = await groq.chat.completions.create(
        {
          messages: [{ role: "user", content: promptText }],
          model: "llama-3.1-8b-instant",
          temperature: temperature, 
          stream: true,
        },
        { signal: controller.signal }
      );

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        const content = chunk.choices[0]?.delta?.content || "";
        
        if (content) {
          setDisplayed((prev) => prev + content);

          // BROADCAST NEURAL STATE TO APP.JSX
          const currentToken = content.trim() || "...";
          const mockLogits = [
            { word: currentToken, p: 0.75 + Math.random() * 0.2 },
            { word: "layer", p: 0.1 },
            { word: "node", p: 0.05 },
            { word: "vector", p: 0.05 }
          ];
          setProbs(mockLogits);

          onNeuralUpdate({
            probs: mockLogits,
            // Pick a random token from prompt to simulate attention focus
            activeTokenIndex: Math.floor(Math.random() * schema.tokens.length),
            isProcessing: true
          });
          const isPunctuation = /[.!?]/.test(content);
          await delay(isPunctuation ? 300 : 60);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') setDisplayed(p => p + "\n[SYSTEM_ERR]");
    } finally {
      setLoading(false);
      onNeuralUpdate({ isProcessing: false, activeTokenIndex: -1 });
    }
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', border: '1px solid #1e293b' }}>
      {/* --- PASTE THIS HEADER SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', borderBottom: '1px solid #1e293b', background: '#020617' }}>
        <div style={{ fontSize: 8, color: '#64748b' }}>STREAM: <span style={{ color: loading ? '#00ff9d' : '#475569' }}>{loading ? 'ACTIVE' : 'IDLE'}</span></div>
        <div style={{ fontSize: 8, color: '#64748b' }}>TOK/SEC: <span style={{ color: '#00d4ff' }}>14.2</span></div>
        <div style={{ fontSize: 8, color: '#64748b' }}>INF_MODE: <span style={{ color: '#f8fafc' }}>FP16_QUANT</span></div>
      </div>

      {/* YOUR EXISTING SCROLLING TERMINAL AREA */}
      <div style={{ flex: 1, padding: 15, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, color: '#00ff9d', lineHeight: 1.5 }}>
        {displayed}
        {loading && <span style={cursorStyle} />}
      </div>

      {/* --- PASTE THIS FOOTER SECTION --- */}
      <div style={{ height: 20, background: '#1e293b', display: 'flex', alignItems: 'center', fontSize: 8, color: '#94a3b8', gap: 15, paddingLeft: 10 }}>
        <span>STATUS: {loading ? 'EXECUTING_RECURSION' : 'READY'}</span>
        <span>|</span>
        <span>MEM_USE: 442MB</span>
        <span style={{ marginLeft: 'auto', marginRight: 10 }}>UTF-8_READY</span>
      </div>
    </div>
  );
}

const btnRun = { background: 'none', border: '1px solid #00d4ff', color: '#00d4ff', fontSize: 9, fontWeight: 800, padding: '3px 10px', cursor: 'pointer' };
const btnHalt = { background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 10px', cursor: 'pointer' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: '#00ff9d', marginLeft: 4 };

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
    <div style={{ background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
           <span style={{ fontSize: 9, fontWeight: 900, color: '#00d4ff' }}>INFERENCE_TERMINAL</span>
           <div style={{ display: 'flex', gap: 8, fontSize: 8, fontWeight: 700 }}>
              <span style={{ color: activeSubStep === 1 ? '#00ff9d' : '#64748b' }}>EMBED</span>
              <span style={{ color: activeSubStep === 2 ? '#00ff9d' : '#64748b' }}>ATTEND</span>
              <span style={{ color: activeSubStep === 3 ? '#00ff9d' : '#64748b' }}>SOFTMAX</span>
           </div>
        </div>
        <button onClick={loading ? () => abortControllerRef.current?.abort() : generateResponse} style={loading ? btnHalt : btnRun}>
          {loading ? 'HALT' : 'RUN'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', background: '#000', overflow: 'hidden' }}>
        <div ref={scrollRef} style={{ flex: 1, padding: 12, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#00ff9d', fontSize: 11, fontFamily: 'monospace', borderRight: '1px solid #1e293b' }}>
          {displayed}
          {loading && <span style={cursorStyle} />}
        </div>

        <div style={{ width: '120px', padding: '10px', background: '#020617', flexShrink: 0 }}>
          <div style={{ fontSize: 8, color: '#00d4ff', marginBottom: 10, borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>LOGITS</div>
          {probs.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8 }}>
                <span style={{ color: i === 0 ? '#00ff9d' : '#64748b' }}>{p.word}</span>
                <span style={{ opacity: 0.5 }}>{Math.round(p.p * 100)}%</span>
              </div>
              <div style={{ height: 2, background: '#1e293b', marginTop: 2 }}>
                <div style={{ height: '100%', width: `${p.p * 100}%`, background: i === 0 ? '#00ff9d' : '#00d4ff' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btnRun = { background: 'none', border: '1px solid #00d4ff', color: '#00d4ff', fontSize: 9, fontWeight: 800, padding: '3px 10px', cursor: 'pointer' };
const btnHalt = { background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 10px', cursor: 'pointer' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: '#00ff9d', marginLeft: 4 };

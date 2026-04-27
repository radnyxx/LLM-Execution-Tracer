import React, { useState, useRef } from 'react';
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
}) : null;

export default function Stage4Generation({ schema, temperature }) {
  const [displayed, setDisplayed] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const abortControllerRef = useRef(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const clearBuffer = () => {
    stopGeneration();
    setDisplayed('');
    setDone(false);
  };

  const generateResponse = async () => {
    if (loading || !groq) return;

    setDisplayed(''); 
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setIsGenerating(true);
    setDone(false);

    const prompt = schema?.tokens?.map(t => t.word).join(" ") || "";

    try {
      const stream = await groq.chat.completions.create(
        {
          messages: [{ role: "user", content: prompt }],
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
        }
      }
      if (!abortControllerRef.current?.signal.aborted) setDone(true);
    } catch (error) {
      if (error.name !== 'AbortError') setDisplayed(p => p + "\n[SYSTEM_HALT_ERROR]");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER WITH CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>4</div>
           <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase' }}>Inference Terminal</span>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={clearBuffer} style={btnSecondary}>[ CLEAR ]</button>
          {loading ? (
            <button onClick={stopGeneration} style={btnHalt}>HALT_SYSTEM</button>
          ) : (
            <button onClick={generateResponse} style={btnRun}>RUN_INFERENCE</button>
          )}
        </div>
      </div>

      {/* TERMINAL BODY */}
      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ 
          background: '#000', 
          border: '1px solid var(--border2)', 
          borderRadius: 3, 
          padding: '12px', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0 // Crucial for scrolling
        }}>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            whiteSpace: 'pre-wrap', 
            color: 'var(--green)', 
            fontSize: 11, 
            lineHeight: 1.6,
            fontFamily: 'var(--font)'
          }}>
            {displayed}
            {isGenerating && <span className="cursor" style={cursorStyle} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- BUTTON STYLES ---
const btnRun = { background: 'none', border: '1px solid var(--blue)', color: 'var(--blue)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 2, cursor: 'pointer' };
const btnHalt = { background: 'var(--red)', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 2, cursor: 'pointer' };
const btnSecondary = { background: 'none', border: 'none', color: 'var(--text3)', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: 'var(--green)', marginLeft: 4, animation: 'blink 1s step-end infinite' };

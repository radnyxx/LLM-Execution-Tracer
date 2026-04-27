import React, { useState, useRef, useEffect } from 'react';
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
  const [activeSubStep, setActiveSubStep] = useState(0); // 1: Embed, 2: Attend, 3: Softmax
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayed]);

  const generateResponse = async () => {
    if (loading || !groq) return;

    setDisplayed(''); 
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setIsGenerating(true);

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
          // --- THE NEURAL CYCLE ---
          // Every time a word (chunk) comes in, we cycle the visual steps
          setActiveSubStep(1); // Embed
          setTimeout(() => setActiveSubStep(2), 40); // Attend
          setTimeout(() => setActiveSubStep(3), 80); // Softmax/Generate
          
          setDisplayed((prev) => prev + content);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') setDisplayed(p => p + "\n[SYSTEM_ERR]");
    } finally {
      setLoading(false);
      setIsGenerating(false);
      setActiveSubStep(0);
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    setIsGenerating(false);
    setActiveSubStep(0);
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER WITH REAL-TIME PIPELINE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
           <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--blue)', letterSpacing: 1 }}>TERMINAL</span>
           
           {/* THE MINI-GLOW PIPELINE */}
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, fontFamily: 'monospace', fontWeight: 700 }}>
              <span style={{ color: activeSubStep === 1 ? 'var(--green)' : 'var(--text3)', textShadow: activeSubStep === 1 ? '0 0 8px var(--green)' : 'none', transition: 'all 0.1s' }}>EMBED</span>
              <span style={{ color: 'var(--border2)' }}>&gt;</span>
              <span style={{ color: activeSubStep === 2 ? 'var(--green)' : 'var(--text3)', textShadow: activeSubStep === 2 ? '0 0 8px var(--green)' : 'none', transition: 'all 0.1s' }}>ATTEND</span>
              <span style={{ color: 'var(--border2)' }}>&gt;</span>
              <span style={{ color: activeSubStep === 3 ? 'var(--green)' : 'var(--text3)', textShadow: activeSubStep === 3 ? '0 0 8px var(--green)' : 'none', transition: 'all 0.1s' }}>GEN</span>
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          {loading ? (
            <button onClick={stopGeneration} style={btnHalt}>[ HALT ]</button>
          ) : (
            <button onClick={generateResponse} style={btnRun}>RUN_INFERENCE</button>
          )}
        </div>
      </div>

      {/* TERMINAL CONTENT */}
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            whiteSpace: 'pre-wrap', 
            color: 'var(--green)', 
            fontSize: 11, 
            lineHeight: 1.5,
            fontFamily: 'var(--font)'
          }}
        >
          {displayed}
          {isGenerating && <span style={cursorStyle} />}
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const btnRun = { background: 'none', border: '1px solid var(--blue)', color: 'var(--blue)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 2, cursor: 'pointer' };
const btnHalt = { background: 'var(--red)', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 2, cursor: 'pointer' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: 'var(--green)', marginLeft: 4, animation: 'blink 1s step-end infinite' };

import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
});

const STEPS = ['TOKENIZE', 'EMBED', 'ATTEND', 'DECODE', 'SAMPLE', 'APPEND'];
const KV_SLOTS = 32;

export default function Stage4Generation({ schema, temperature, selectedToken }) {
  const [displayed, setDisplayed] = useState('');
  const [kvCount, setKvCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  // 1. Sync Logic: If Stage 3 picks a "manual" winner from the JSON, 
  // we show it here to keep the "Tracer" visual consistent.
  useEffect(() => {
    if (selectedToken && !isGenerating) {
      setDisplayed(prev => prev + " " + selectedToken.word);
      setKvCount(prev => Math.min(prev + 1, KV_SLOTS));
    }
  }, [selectedToken, isGenerating]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const generateResponse = async () => {
    if (loading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setIsGenerating(true);
    setDisplayed('');
    setKvCount(0);
    setDone(false);
    setActiveStep(0);

    // Use the words from your Stage 1 Tokenization as the prompt!
    const userPrompt = schema?.tokens?.map(t => t.word).join(" ") || "Hello";

    try {
      const stream = await groq.chat.completions.create(
        {
          messages: [
            {
              role: "system",
              content: "You are a completion engine. Continue the sequence naturally. No explanations, notes."
            },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.1-8b-instant",
          // CRITICAL: Using the global temperature from your slider!
          temperature: temperature, 
          stream: true,
        },
        { signal: controller.signal }
      );

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;

        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          // Animated "Inference" steps for that high-tech feel
          for (let i = 0; i < STEPS.length; i++) {
            if (abortControllerRef.current?.signal.aborted) break;
            setActiveStep(i);
            await new Promise(resolve => setTimeout(resolve, 40)); 
          }

          if (abortControllerRef.current?.signal.aborted) break;
          setDisplayed((prev) => prev + content);
          setKvCount((prev) => Math.min(prev + 1, KV_SLOTS));
        }
      }
      
      if (!abortControllerRef.current?.signal.aborted) setDone(true);

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Inference Error:", error);
        setDisplayed("SIGNAL_LOST: Check API Key.");
      }
    } finally {
      setLoading(false);
      setActiveStep(0); 
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>4</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Inference Terminal
        </span>
      </div>

      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Step Visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '2px 6px',
                border: `1px solid ${activeStep === i && isGenerating ? 'var(--blue)' : 'var(--border2)'}`,
                borderRadius: 3,
                fontSize: 8,
                fontWeight: activeStep === i ? 700 : 400,
                color: activeStep === i && isGenerating ? '#fff' : 'var(--text3)',
                background: activeStep === i && isGenerating ? 'var(--blue)' : 'transparent',
                transition: 'all 0.1s',
              }}>
                {step}
              </div>
              {i < STEPS.length - 1 && <span style={{ color: 'var(--border2)', fontSize: 10 }}>/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Terminal Window */}
        <div style={{
          background: '#000',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '12px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          flex: 1,
          color: 'var(--green)',
          lineHeight: 1.6,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <button 
              onClick={generateResponse}
              disabled={loading}
              style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 700 }}
            >
              {loading ? "> EXEC_IN_PROGRESS..." : "> RUN_INFERENCE"}
            </button>
            {loading && (
              <button onClick={stopGeneration} style={{ color: 'var(--red)', background: 'none', border: '1px solid var(--red)', cursor: 'pointer', fontSize: 9, padding: '1px 4px', borderRadius: 2 }}>
                HALT
              </button>
            )}
          </div>
          
          <div style={{ minHeight: '60px' }}>
            {displayed}
            {(loading || (displayed && !done)) && <span style={{ display: 'inline-block', width: 6, height: 12, background: 'var(--green)', marginLeft: 4, animation: 'blink 1s step-end infinite' }} />}
          </div>
        </div>

        {/* KV Cache Buffer */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 8, color: 'var(--text3)', marginBottom: 4, letterSpacing: '1px' }}>KV_CACHE_RESIDUE</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {Array.from({ length: KV_SLOTS }, (_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: 1,
                background: i < kvCount ? 'var(--blue)' : 'var(--bg4)',
                opacity: i < kvCount ? 1 : 0.3,
                border: `1px solid ${i < kvCount ? 'var(--blue)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

function StageNum({ children }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'var(--blue3)', border: '1px solid var(--blue)',
      color: 'var(--blue)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

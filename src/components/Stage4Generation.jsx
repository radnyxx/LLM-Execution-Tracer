import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

// Initialize Groq (The "Engine")
const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
});

const STEPS = ['TOKENIZE', 'EMBED', 'ATTEND', 'DECODE', 'SAMPLE', 'APPEND'];
const KV_SLOTS = 32;

export default function Stage4Generation({ schema, temperature }) {
  const [displayed, setDisplayed] = useState('');
  const [kvCount, setKvCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

const [isGenerating, setIsGenerating] = useState(false);
const abortControllerRef = useRef(null);

const stopGeneration = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    setIsGenerating(false);
    setLoading(false);
  }
};

const generateResponse = async () => {
  if (loading) return;

  // 1. Reset everything before starting
  const controller = new AbortController();
  abortControllerRef.current = controller;
  
  setLoading(true);
  setIsGenerating(true);
  setDisplayed('');
  setKvCount(0);
  setDone(false);
  setActiveStep(0);

  const userPrompt = schema?.tokens?.map(t => t.word).join(" ") || "";

  try {
    const stream = await groq.chat.completions.create(
      {
        messages: [
          {
            role: "system",
            content: "You are an autoregressive language model completion engine. The following tokens represent the current sequence. Continue the generation naturally based on these tokens. Do not provide explanations or notes, only the completion."
          },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: temperature,
        stream: true,
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      // 2. IMMEDIATE OUTER CHECK: Kill the stream processing if aborted
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // 3. UI SYNC LOOP: Tokenize -> Embed -> Attend -> etc.
        for (let i = 0; i < STEPS.length; i++) {
          // 4. INNER CHECK: Stop the light animation immediately if aborted
          if (abortControllerRef.current?.signal.aborted) break;
          
          setActiveStep(i);
          await new Promise(resolve => setTimeout(resolve, 60)); 
        }

        // 5. Final check before updating text
        if (abortControllerRef.current?.signal.aborted) break;

        setDisplayed((prev) => prev + content);
        setKvCount((prev) => Math.min(prev + 1, KV_SLOTS));
      }
    }
    
    // Only set done if we didn't manually abort
    if (!abortControllerRef.current?.signal.aborted) {
      setDone(true);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Inference manually halted by user.");
    } else {
      console.error("Inference Error:", error);
      setDisplayed("SIGNAL_LOST: Check API Key and Network.");
    }
  } finally {
    setLoading(false);
    setActiveStep(0); 
    setIsGenerating(false);
    abortControllerRef.current = null; // Clean up the ref
  }
};
   return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <StageNum>4</StageNum>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Real-time Inference Loop
        </span>
      </div>

      <div style={{ padding: 12 }}>
        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 10, rowGap: 6 }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '4px 8px',
                border: `1px solid ${activeStep === i && !done && !loading ? 'var(--blue)' : 'var(--border2)'}`,
                borderRadius: 3,
                fontSize: 9,
                color: activeStep === i && !done ? 'var(--blue)' : 'var(--text3)',
                background: activeStep === i && !done ? 'var(--blue4)' : 'var(--bg3)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}>
                {step}
              </div>
              <div style={{ color: 'var(--border2)', fontSize: 12, padding: '0 3px' }}>
                {i < STEPS.length - 1 ? '→' : '↻'}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Terminal */}
        <div style={{
          background: '#000',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '10px 12px',
          fontFamily: 'monospace',
          fontSize: 11,
          minHeight: 100,
          color: 'var(--green)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <button 
            onClick={generateResponse}
            disabled={loading}
            style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            {loading ? "$ system.processing..." : "$ llm.generate()"}
          </button>

          {loading && (
            <button 
              onClick={stopGeneration}
              style={{ 
                color: 'var(--red)', 
                background: 'none', 
                border: '1px solid var(--red)', 
                cursor: 'pointer', 
                fontSize: 9, 
                padding: '2px 6px', 
                borderRadius: 2,
                textTransform: 'uppercase'
              }}
            >
              [STOP]
            </button>
          )}
        </div>
          <br />
          {displayed}
          {(loading || (displayed && !done)) && <span className="cursor" style={{
            display: 'inline-block', width: 7, height: 13, background: 'var(--green)', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite',
          }} />}
        </div>

        {/* KV Cache */}
        <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 10, marginBottom: 4 }}>// KV-CACHE BUFFER</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Array.from({ length: KV_SLOTS }, (_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: 2,
              background: i < kvCount ? 'var(--blue3)' : 'var(--bg4)',
              border: `1px solid ${i < kvCount ? 'var(--blue)' : 'var(--border)'}`,
              transition: 'all 0.3s',
            }} />
          ))}
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

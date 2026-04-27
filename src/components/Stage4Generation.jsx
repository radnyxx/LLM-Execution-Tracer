import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
}) : null;

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

  // 1. MANUAL INJECTION (Stage 3 -> Stage 4)
  useEffect(() => {
    if (selectedToken && !isGenerating) {
      setDisplayed(prev => prev + (prev.length > 0 ? " " : "") + selectedToken.word);
      setKvCount(prev => Math.min(prev + 1, KV_SLOTS));
    }
  }, [selectedToken, isGenerating]);

  // 2. MANUAL WIPE FUNCTION
  const handleManualClear = () => {
    stopGeneration();
    setDisplayed('');
    setKvCount(0);
    setDone(false);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const generateResponse = async () => {
    if (loading || !groq) return;

    // AUTOMATIC WIPE ON RUN
    // This ensures the AI starts fresh based on Stage 1 context + current manual clicks
    const currentManualInput = displayed; 
    setDisplayed(''); 
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setIsGenerating(true);
    setDone(false);

    const contextText = schema?.tokens?.map(t => t.word).join(" ") || "";
    // We feed the previous manual clicks as the start of the response
    const fullPrompt = `${contextText} ${currentManualInput}`.trim();

    try {
      const stream = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: "Continue the sequence. Completion only." },
            { role: "user", content: fullPrompt }
          ],
          model: "llama-3.1-8b-instant",
          temperature: temperature, 
          stream: true,
        },
        { signal: controller.signal }
      );

      // Add the manual part back first so the AI "continues" it
      setDisplayed(currentManualInput);

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          for (let i = 0; i < STEPS.length; i++) {
            if (abortControllerRef.current?.signal.aborted) break;
            setActiveStep(i);
            await new Promise(r => setTimeout(r, 20)); 
          }
          setDisplayed((prev) => prev + content);
          setKvCount((prev) => Math.min(prev + 1, KV_SLOTS));
        }
      }
      if (!abortControllerRef.current?.signal.aborted) setDone(true);
    } catch (error) {
      if (error.name !== 'AbortError') setDisplayed(prev => prev + "\n[ERR_SIGNAL_LOST]");
    } finally {
      setLoading(false);
      setIsGenerating(false);
      setActiveStep(0);
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>4</div>
           <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inference Terminal</span>
        </div>
        {/* MANUAL CLEAR BUTTON */}
        <button 
          onClick={handleManualClear}
          style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace' }}
        >
          [ CLEAR_BUFFER ]
        </button>
      </div>

      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ padding: '2px 6px', border: `1px solid ${activeStep === i && isGenerating ? 'var(--blue)' : 'var(--border2)'}`, borderRadius: 3, fontSize: 8, color: activeStep === i && isGenerating ? '#fff' : 'var(--text3)', background: activeStep === i && isGenerating ? 'var(--blue)' : 'transparent' }}>{step}</div>
              {i < STEPS.length - 1 && <span style={{ color: 'var(--border2)', fontSize: 10 }}>/</span>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ background: '#000', border: '1px solid var(--border)', borderRadius: 3, padding: '12px', flex: 1, color: 'var(--green)', fontSize: 11, lineHeight: 1.6, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={generateResponse} disabled={loading} style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, font: 'inherit' }}>
              {loading ? "> EXEC_TRACE..." : "> RUN_INFERENCE"}
            </button>
            {loading && <button onClick={stopGeneration} style={{ color: 'var(--red)', background: 'none', border: '1px solid var(--red)', padding: '1px 4px', borderRadius: 2, fontSize: 9 }}>HALT</button>}
          </div>
          <div style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
            {displayed}
            {(loading || (displayed && !done)) && <span style={{ display: 'inline-block', width: 6, height: 12, background: 'var(--green)', marginLeft: 4, animation: 'blink 1s step-end infinite' }} />}
          </div>
        </div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

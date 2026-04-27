import React, { useState, useRef } from 'react';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export default function Stage4Generation({ schema, temperature, onNeuralUpdate }) {
  const [displayed, setDisplayed] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const generateResponse = async () => {
    if (loading) return;
    
    setDisplayed("");
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const promptText = schema?.tokens?.map(t => t.word).join(" ") || "Hello";

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
          temperature: temperature || 0.7,
          stream: true
        }),
        signal: controller.signal
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          if (line.includes("[DONE]")) break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || "";
              
              if (content) {
                setDisplayed((prev) => prev + content);
                
                onNeuralUpdate({
                  probs: [
                    { word: content.trim() || "...", p: 0.85 },
                    { word: "layer", p: 0.10 },
                    { word: "node", p: 0.05 }
                  ],
                  activeTokenIndex: Math.floor(Math.random() * (schema?.tokens?.length || 1)),
                  isProcessing: true
                });
                await delay(60); 
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setDisplayed(p => p + "\n[SYSTEM_ERROR_COMM_LINK_SEVERED]");
    } finally {
      setLoading(false);
      onNeuralUpdate({ isProcessing: false, activeTokenIndex: -1 });
    }
  };

  return (
    <div style={terminalContainer}>
      {/* HEADER: System Metrics */}
      <div style={headerMetrics}>
        <div style={metricItem}>
          STREAM: <span style={{ color: loading ? '#00ff9d' : '#475569' }}>{loading ? 'ACTIVE' : 'IDLE'}</span>
        </div>
        <div style={metricItem}>
          TOK/SEC: <span style={{ color: '#00d4ff' }}>{loading ? '14.2' : '0.0'}</span>
        </div>
        <div style={metricItem}>
          INF_MODE: <span style={{ color: '#f8fafc' }}>FP16_QUANT</span>
        </div>
        <button onClick={generateResponse} disabled={loading} style={runBtn}>
          {loading ? "PROCESSSING..." : "RUN_INFERENCE"}
        </button>
      </div>

      {/* TERMINAL: The Output Area */}
      <div style={outputArea}>
        {displayed || (loading ? "" : "> AWAITING_INPUT_SEQUENCE...")}
        {loading && <span style={cursorStyle} />}
      </div>

      {/* FOOTER: Hardware Specs */}
      <div style={footerMetrics}>
        <span>STATUS: {loading ? 'EXECUTING_RECURSION' : 'SYSTEM_READY'}</span>
        <span>|</span>
        <span>MEM_USE: {loading ? '442MB' : '12MB'}</span>
        <span style={{ marginLeft: 'auto', marginRight: 10 }}>UTF-8_ENCODED</span>
      </div>
    </div>
  );
}

// STYLES
const terminalContainer = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden' };
const headerMetrics = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', borderBottom: '1px solid #1e293b', background: '#0f172a' };
const metricItem = { fontSize: 8, color: '#64748b', fontFamily: 'monospace' };
const runBtn = { background: '#00ff9d', color: '#020617', border: 'none', borderRadius: 2, padding: '4px 12px', fontSize: 9, fontWeight: 900, cursor: 'pointer' };
const outputArea = { flex: 1, padding: 15, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, color: '#00ff9d', lineHeight: 1.6, whiteSpace: 'pre-wrap' };
const footerMetrics = { height: 20, background: '#1e293b', display: 'flex', alignItems: 'center', fontSize: 8, color: '#94a3b8', gap: 15, paddingLeft: 10, fontFamily: 'monospace' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: '#00ff9d', marginLeft: 4 };

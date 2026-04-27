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
      // USING DIRECT FETCH - NO SDK NEEDED
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
                
                // SEND DATA BACK TO APP.JSX
                onNeuralUpdate({
                  probs: [
                    { word: content.trim() || "...", p: 0.85 },
                    { word: "layer", p: 0.10 },
                    { word: "node", p: 0.05 }
                  ],
                  activeTokenIndex: Math.floor(Math.random() * (schema?.tokens?.length || 1)),
                  isProcessing: true
                });
                await delay(50); 
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setDisplayed(p => p + "\n[SYSTEM_ERROR]");
    } finally {
      setLoading(false);
      onNeuralUpdate({ isProcessing: false, activeTokenIndex: -1 });
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#020617' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <div style={{ fontSize: 8, color: '#64748b' }}>STREAM: <span style={{ color: loading ? '#00ff9d' : '#475569' }}>{loading ? 'ACTIVE' : 'IDLE'}</span></div>
        <button onClick={generateResponse} disabled={loading} style={{ background: '#00ff9d', border: 'none', padding: '2px 8px', fontSize: 8, cursor: 'pointer' }}>
          RUN
        </button>
      </div>
      <div style={{ flex: 1, padding: 15, overflowY: 'auto', color: '#00ff9d', fontFamily: 'monospace', fontSize: 11 }}>
        {displayed || "> READY..."}
      </div>
    </div>
  );
}

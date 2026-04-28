import React, { useState, useRef, useCallback } from 'react';
import KVCache from './KVCache';
import Tooltip from './Tooltip';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export default function Stage4Generation({ schema, temperature, onNeuralUpdate }) {
  const [displayed, setDisplayed] = useState([]);   // array of {word, p, isNew}
  const [loading, setLoading] = useState(false);
  const [tokSec, setTokSec] = useState(0);
  const [generatedTokens, setGeneratedTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'kvcache'
  const abortRef = useRef(null);
  const startTimeRef = useRef(null);
  const tokCountRef = useRef(0);
  const outputRef = useRef(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    onNeuralUpdate({ isProcessing: false, activeTokenIndex: -1 });
  }, [onNeuralUpdate]);

  const generateResponse = async () => {
    if (loading) return;
    setDisplayed([]);
    setGeneratedTokens([]);
    setLoading(true);
    setTokSec(0);
    tokCountRef.current = 0;
    startTimeRef.current = Date.now();

    const controller = new AbortController();
    abortRef.current = controller;
    const promptText = schema?.tokens?.map(t => t.word).join(' ') || 'Hello';

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: promptText }],
          temperature: temperature || 0.7,
          stream: true,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]')) break;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (!content) continue;

              // Real tok/sec
              tokCountRef.current++;
              const elapsed = (Date.now() - startTimeRef.current) / 1000;
              const tps = elapsed > 0 ? (tokCountRef.current / elapsed).toFixed(1) : '0';
              setTokSec(tps);

              // Fake probability distribution based on content length + temp
              const fakeP = Math.max(0.3, Math.min(0.99, 0.85 - temperature * 0.15 + Math.random() * 0.1));
              const altP1 = (1 - fakeP) * 0.65;
              const altP2 = (1 - fakeP) * 0.25;
              const altP3 = (1 - fakeP) * 0.10;

              // Split content into words for display
              const words = content.split(/(\s+)/).filter(Boolean);
              for (const word of words) {
                setDisplayed(prev => [...prev, { word, p: fakeP, isNew: true }]);
                setGeneratedTokens(prev => [...prev, { word, id: tokCountRef.current }]);

                // Reset isNew after animation
                setTimeout(() => {
                  setDisplayed(prev => prev.map((t, i) =>
                    i === prev.length - 1 ? { ...t, isNew: false } : t
                  ));
                }, 600);
              }

              onNeuralUpdate({
                probs: [
                  { word: content.trim().split(' ')[0] || '...', p: fakeP },
                  { word: 'and', p: altP1 },
                  { word: 'the', p: altP2 },
                  { word: ',', p: altP3 },
                ],
                activeTokenIndex: Math.floor(Math.random() * (schema?.tokens?.length || 1)),
                isProcessing: true,
              });

              // Scroll to bottom
              if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
              await delay(50);
            } catch (e) { /* skip malformed chunks */ }
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setDisplayed(prev => [...prev, { word: '\n[SYSTEM_ERROR_COMM_LINK_SEVERED]', p: 0, isNew: false }]);
      }
    } finally {
      setLoading(false);
      onNeuralUpdate({ isProcessing: false, activeTokenIndex: -1 });
    }
  };

  const totalToks = displayed.filter(t => t.word.trim()).length;

  return (
    <div style={terminalContainer}>
      {/* HEADER */}
      <div style={headerMetrics}>
        <Metric label="STREAM" value={loading ? 'ACTIVE' : 'IDLE'} color={loading ? '#00ff9d' : '#334155'} />
        <Metric label="TOK/SEC" value={loading ? tokSec : '0.0'} color="#00d4ff" />
        <Metric label="TOKENS" value={totalToks} color="#64748b" />
        <Metric label="TEMP" value={temperature.toFixed(2)} color="#f59e0b" />
        <Metric label="INF_MODE" value="FP16" color="#475569" />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <TabBtn label="OUTPUT" active={activeTab === 'output'} onClick={() => setActiveTab('output')} />
          <TabBtn label="KV_CACHE" active={activeTab === 'kvcache'} onClick={() => setActiveTab('kvcache')} />
          {loading && (
            <button onClick={stop} style={stopBtn}>■ STOP</button>
          )}
          <button
            onClick={generateResponse}
            disabled={loading}
            style={{ ...runBtn, opacity: loading ? 0.5 : 1 }}
            className={!loading ? 'run-btn-active' : ''}
          >
            {loading ? 'RUNNING...' : 'RUN_INFERENCE'}
          </button>
        </div>
      </div>

      {/* OUTPUT / KV CACHE */}
      {activeTab === 'output' ? (
        <div ref={outputRef} style={outputArea}>
          {displayed.length === 0 && !loading && (
            <span style={{ color: '#334155' }}>{'>'} AWAITING_INPUT_SEQUENCE...</span>
          )}
          {displayed.map((tok, i) => (
            <span
              key={i}
              title={`p=${(tok.p * 100).toFixed(1)}%`}
              style={{
                color: tok.isNew ? '#ffffff' : tok.p > 0.7 ? '#00ff9d' : tok.p > 0.4 ? '#94a3b8' : '#64748b',
                background: tok.isNew ? 'rgba(0,255,157,0.15)' : 'transparent',
                transition: 'color 0.6s ease, background 0.6s ease',
                borderRadius: 2,
                cursor: 'default',
              }}
            >
              {tok.word}
            </span>
          ))}
          {loading && <span style={cursorStyle} className="cursor-blink" />}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          <KVCache
            tokens={schema?.tokens || []}
            generatedTokens={generatedTokens}
            isProcessing={loading}
          />
        </div>
      )}

      {/* FOOTER */}
      <div style={footerMetrics}>
        <span>STATUS: {loading ? 'EXECUTING_FORWARD_PASS' : 'SYSTEM_READY'}</span>
        <span>|</span>
        <Tooltip term="kvCache">
          <span style={{ cursor: 'help', borderBottom: '1px dashed #334155' }}>
            KV_CACHE: {schema?.tokens?.length + generatedTokens.length} entries
          </span>
        </Tooltip>
        <span>|</span>
        <span>MEM: {loading ? `${(42 + tokCountRef.current * 0.08).toFixed(0)}MB` : '12MB'}</span>
        <span style={{ marginLeft: 'auto', marginRight: 10 }}>UTF-8_ENCODED</span>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={metricItem}>
      {label}: <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 7, padding: '2px 7px',
      border: `1px solid ${active ? '#00ff9d' : '#1e293b'}`,
      background: active ? 'rgba(0,255,157,0.1)' : 'none',
      color: active ? '#00ff9d' : '#334155',
      borderRadius: 2, cursor: 'pointer',
      fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
    }}>{label}</button>
  );
}

const terminalContainer = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', overflow: 'hidden' };
const headerMetrics = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '5px 12px', borderBottom: '1px solid #1e293b', background: '#0a0f1e', minHeight: 36 };
const metricItem = { fontSize: 8, color: '#475569', fontFamily: 'monospace', whiteSpace: 'nowrap' };
const runBtn = { background: '#00ff9d', color: '#020617', border: 'none', borderRadius: 2, padding: '4px 12px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const stopBtn = { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: 2, padding: '4px 8px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' };
const outputArea = { flex: 1, padding: '12px 14px', overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const footerMetrics = { height: 22, background: '#0a0f1e', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', fontSize: 8, color: '#334155', gap: 12, paddingLeft: 10, fontFamily: 'monospace' };
const cursorStyle = { display: 'inline-block', width: 6, height: 12, background: '#00ff9d', marginLeft: 2, verticalAlign: 'middle' };

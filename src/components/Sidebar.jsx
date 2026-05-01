import React, { useState } from 'react';
import Tooltip from './Tooltip';

export default function Sidebar({ onSubmit, onOpenSchema, temperature, setTemperature, onStop, isProcessing, onGuidedTour }) {
  const [promptInput, setPromptInput] = useState("Socrates was a Greek thinker");

  const handleSubmit = () => {
    if (promptInput.trim()) onSubmit(promptInput.trim());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
  };

  const tempLabel = temperature < 0.4 ? 'DETERMINISTIC' : temperature < 0.9 ? 'BALANCED' : temperature < 1.4 ? 'CREATIVE' : 'CHAOTIC';
  const tempColor = temperature < 0.4 ? '#00d4ff' : temperature < 0.9 ? '#00ff9d' : temperature < 1.4 ? '#f59e0b' : '#ff4d4d';

  return (
    <div style={sidebarStyle}>

      {/* ── PROMPT INPUT — tour target ── */}
      <div id="tour-sidebar-prompt" style={sectionStyle}>
        <label style={labelStyle}>INPUT_PROMPT</label>
        <textarea
          style={textareaStyle}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Enter sequence logic... (Ctrl+Enter to submit)"
          spellCheck={false}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            style={{ ...btnPrimary, flex: 1, opacity: isProcessing ? 0.5 : 1 }}
          >
            INITIALIZE_TOKENS
          </button>
          {isProcessing && (
            <button onClick={onStop} style={btnStop}>■ STOP</button>
          )}
        </div>
        <div style={{ fontSize: 8, color: '#334155' }}>
          {promptInput.trim().split(/\s+/).filter(Boolean).length} tokens · Ctrl+Enter
        </div>
      </div>

      {/* ── SYSTEM CONFIG ── */}
      <div style={sectionStyle}>
        <label style={labelStyle}>SYSTEM_CONFIG</label>

        {/* Schema button — tour target */}
        <div id="tour-sidebar-schema">
          <button onClick={onOpenSchema} style={btnSecondary}>
            VIEW_JSON_SCHEMA
          </button>
        </div>

        {/* Temperature — tour target */}
        <div id="tour-sidebar-temp" style={tempSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tooltip term="temperature">
              <span style={{ ...labelStyle, fontSize: 8, cursor: 'help' }}>TEMP</span>
            </Tooltip>
            <span style={{ fontSize: 11, color: tempColor, fontWeight: 800 }}>{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0.01" max="2" step="0.01"
            style={rangeStyle}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#334155' }}>
            <span>0.0</span>
            <span style={{ color: tempColor, fontWeight: 800 }}>{tempLabel}</span>
            <span>2.0</span>
          </div>
          <TempDistPreview temperature={temperature} />
        </div>
      </div>

      {/* ── MODEL INFO ── */}
      <div style={sectionStyle}>
        <label style={labelStyle}>MODEL_INFO</label>
        <div style={infoGrid}>
          <InfoRow label="MODEL"   value="Llama-3.1-8B" />
          <InfoRow label="PARAMS"  value="8.03B" />
          <InfoRow label="LAYERS"  value="32" />
          <InfoRow label="HEADS"   value="32" />
          <InfoRow label="CTX_LEN" value="128K" />
          <InfoRow label="QUANT"   value="FP16" />
        </div>
      </div>

      {/* ── GUIDED TOUR ── */}
      <div style={{ marginTop: 'auto' }}>
        <button onClick={onGuidedTour} style={btnTour}>
          ▶ GUIDED_TOUR
        </button>
        <div style={{ fontSize: 7, color: '#334155', marginTop: 6, textAlign: 'center' }}>
          9-step walkthrough of the full pipeline
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, padding: '3px 0', borderBottom: '1px solid #0f172a' }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function TempDistPreview({ temperature }) {
  const baseLogits = [2.5, 1.8, 1.2, 0.9, 0.5, 0.2];
  const temp       = Math.max(0.01, temperature);
  const scaled     = baseLogits.map(l => l / temp);
  const maxVal     = Math.max(...scaled);
  const exps       = scaled.map(v => Math.exp(v - maxVal));
  const sum        = exps.reduce((a, b) => a + b, 0);
  const probs      = exps.map(e => e / sum);
  const color      = temperature < 0.4 ? '#00d4ff' : temperature < 0.9 ? '#00ff9d' : temperature < 1.4 ? '#f59e0b' : '#ff4d4d';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 7, color: '#334155', marginBottom: 4 }}>DISTRIBUTION_PREVIEW</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 30 }}>
        {probs.map((p, i) => (
          <div key={i} style={{
            flex:        1,
            height:      `${p * 100}%`,
            background:  color,
            opacity:     0.6 + p * 0.4,
            borderRadius:'1px 1px 0 0',
            transition:  'height 0.2s ease, background 0.2s ease',
            minHeight:   1,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const sidebarStyle  = { width: 220, borderRight: '1px solid #1e293b', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20, background: '#020617', zIndex: 10, overflowY: 'auto' };
const sectionStyle  = { display: 'flex', flexDirection: 'column', gap: 8 };
const labelStyle    = { fontSize: 8, color: '#00d4ff', fontWeight: 800, letterSpacing: 1.5 };
const textareaStyle = { background: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc', padding: '8px 10px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', borderRadius: 3, height: 90, resize: 'none', outline: 'none', lineHeight: 1.5 };
const btnPrimary    = { background: '#00ff9d', color: '#020617', border: 'none', borderRadius: 2, padding: '7px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const btnStop       = { background: 'rgba(255,77,77,0.15)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: 2, padding: '7px 10px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' };
const btnSecondary  = { width: '100%', background: 'none', color: '#00d4ff', border: '1px solid #1e293b', borderRadius: 2, padding: '7px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const btnTour       = { width: '100%', background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 2, padding: '8px', fontSize: 8, fontWeight: 900, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const tempSection   = { display: 'flex', flexDirection: 'column', gap: 4, padding: '8px', background: '#0a0f1e', borderRadius: 3, border: '1px solid #1e293b' };
const rangeStyle    = { width: '100%', accentColor: '#00d4ff', cursor: 'pointer' };
const infoGrid      = { display: 'flex', flexDirection: 'column', background: '#0a0f1e', borderRadius: 3, padding: '6px 8px', border: '1px solid #1e293b' };

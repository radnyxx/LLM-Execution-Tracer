import React, { useState } from 'react';

export default function Sidebar({ onSubmit, onOpenSchema, temperature, setTemperature }) {
  const [promptInput, setPromptInput] = useState("");

  return (
    <div style={sidebarStyle}>
      <div style={sectionStyle}>
        <label style={labelStyle}>INPUT_PROMPT</label>
        <textarea 
          style={textareaStyle}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Enter sequence logic..."
        />
        <button onClick={() => onSubmit(promptInput)} style={btnPrimary}>
          INITIALIZE_TOKENS
        </button>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>SYSTEM_CONFIG</label>
        {/* OPEN SCHEMA BUTTON */}
        <button onClick={onOpenSchema} style={btnSecondary}>
          VIEW_JSON_SCHEMA
        </button>
        
        <div style={{ marginTop: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b' }}>
            <span>TEMP</span>
            <span>{temperature}</span>
          </div>
          <input 
            type="range" min="0" max="2" step="0.1" 
            style={{ width: '100%', marginTop: 5 }}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

const sidebarStyle = { width: 260, borderRight: '1px solid #1e293b', padding: 20, display: 'flex', flexDirection: 'column', gap: 30, background: '#020617', zIndex: 10 };
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const labelStyle = { fontSize: 9, color: '#00d4ff', fontWeight: 800, letterSpacing: 1 };
const textareaStyle = { background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: 10, fontSize: 11, fontFamily: 'inherit', borderRadius: 4, height: 100 };
const btnPrimary = { background: '#00ff9d', color: '#020617', border: 'none', borderRadius: 2, padding: '8px', fontSize: 9, fontWeight: 900, cursor: 'pointer' };
const btnSecondary = { background: 'none', color: '#00d4ff', border: '1px solid #00d4ff', borderRadius: 2, padding: '8px', fontSize: 9, fontWeight: 900, cursor: 'pointer' };

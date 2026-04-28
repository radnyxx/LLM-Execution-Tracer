import React, { useState } from 'react';
import { DEFAULT_SCHEMA } from '../schema';

export default function SchemaModal({ schema, setSchema, onClose }) {
  const [activeTab, setActiveTab] = useState('tokens');
  const [error, setError] = useState('');

  const updateToken = (index, field, value) => {
    const newTokens = [...(schema.tokens || [])];
    let finalValue = value;
    if (field === 'id') finalValue = parseInt(value) || 0;
    if (field === 'weight') {
      finalValue = Math.max(0, Math.min(1, parseFloat(value) || 0));
    }
    newTokens[index] = { ...newTokens[index], [field]: finalValue };
    setSchema({ ...schema, tokens: newTokens });
  };

  const addToken = () => {
    const newToken = { word: 'new_node', id: Math.floor(Math.random() * 9999), weight: 0.5 };
    setSchema({ ...schema, tokens: [...(schema.tokens || []), newToken] });
  };

  const removeToken = (index) => {
    if (schema.tokens.length <= 1) { setError('Need at least 1 token'); return; }
    setSchema({ ...schema, tokens: schema.tokens.filter((_, i) => i !== index) });
    setError('');
  };

  const updateVector = (word, axis, value) => {
    const vec = [...(schema.vectors?.[word] || [0, 0, 0])];
    vec[axis] = Math.max(0, Math.min(1, parseFloat(value) || 0));
    setSchema({ ...schema, vectors: { ...schema.vectors, [word]: vec } });
  };

  const updateSoftmax = (index, field, value) => {
    const newSoftmax = [...(schema.softmax || [])];
    newSoftmax[index] = { ...newSoftmax[index], [field]: field === 'prob' ? parseFloat(value) || 0 : value };
    setSchema({ ...schema, softmax: newSoftmax });
  };

  const resetToDefault = () => {
    setSchema(DEFAULT_SCHEMA);
    setError('');
  };

  const validateAndClose = () => {
    const invalid = schema.tokens?.filter(t => !t.word.trim());
    if (invalid?.length > 0) { setError('Token words cannot be empty'); return; }
    setError('');
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && validateAndClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#00d4ff', letterSpacing: '0.1em' }}>
            ADVANCED_SCHEMA_EDITOR // NODE_CONFIG
          </span>
          <button onClick={validateAndClose} style={closeButtonStyle}>[ CLOSE ]</button>
        </div>

        {/* Tabs */}
        <div style={tabRowStyle}>
          {['tokens', 'vectors', 'softmax'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...tabBtn,
                color: activeTab === tab ? '#00d4ff' : '#334155',
                borderBottom: `2px solid ${activeTab === tab ? '#00d4ff' : 'transparent'}`,
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>

          {activeTab === 'tokens' && (
            <>
              <div style={colHeader}>
                <span>TOKEN_LABEL</span>
                <span>VECTOR_ID</span>
                <span>ATTN_WEIGHT [0–1]</span>
                <span></span>
              </div>
              {(schema.tokens || []).map((t, i) => (
                <div key={i} style={rowStyle}>
                  <input value={t.word} onChange={e => updateToken(i, 'word', e.target.value)} style={inputStyle} placeholder="word" />
                  <input type="number" value={t.id} onChange={e => updateToken(i, 'id', e.target.value)} style={inputStyle} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="range" min="0" max="1" step="0.01" value={t.weight}
                      onChange={e => updateToken(i, 'weight', e.target.value)}
                      style={{ flex: 1, accentColor: '#00d4ff' }} />
                    <span style={{ fontSize: 9, color: '#94a3b8', width: 28 }}>{t.weight?.toFixed(2)}</span>
                  </div>
                  <button onClick={() => removeToken(i)} style={deleteButtonStyle}>DEL</button>
                </div>
              ))}
            </>
          )}

          {activeTab === 'vectors' && (
            <>
              <div style={{ fontSize: 8, color: '#475569', marginBottom: 10 }}>
                Each token has a 3D vector [x, y, z] in range 0–1. X and Y determine position in the embedding space visualization.
              </div>
              {Object.entries(schema.vectors || {}).map(([word, vec]) => (
                <div key={word} style={vecRowStyle}>
                  <span style={{ fontSize: 9, color: '#00d4ff', width: 70, fontWeight: 700 }}>{word}</span>
                  {['X', 'Y', 'Z'].map((axis, ai) => (
                    <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 8, color: '#475569', width: 10 }}>{axis}</span>
                      <input type="range" min="0" max="1" step="0.01"
                        value={vec[ai] || 0}
                        onChange={e => updateVector(word, ai, e.target.value)}
                        style={{ flex: 1, accentColor: ai === 0 ? '#ff4d4d' : ai === 1 ? '#00ff9d' : '#00d4ff' }} />
                      <span style={{ fontSize: 8, color: '#94a3b8', width: 28 }}>{(vec[ai] || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {activeTab === 'softmax' && (
            <>
              <div style={{ fontSize: 8, color: '#475569', marginBottom: 10 }}>
                Default softmax candidates shown before inference runs. Probabilities don't need to sum to 1 — they'll be recomputed.
              </div>
              <div style={colHeader}>
                <span>WORD</span>
                <span>PROBABILITY</span>
              </div>
              {(schema.softmax || []).map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <input value={s.word} onChange={e => updateSoftmax(i, 'word', e.target.value)} style={inputStyle} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="range" min="0" max="1" step="0.01" value={s.prob}
                      onChange={e => updateSoftmax(i, 'prob', e.target.value)}
                      style={{ flex: 1, accentColor: '#f59e0b' }} />
                    <span style={{ fontSize: 9, color: '#94a3b8', width: 28 }}>{s.prob?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={resetToDefault} style={resetButtonStyle}>↺ RESET_DEFAULTS</button>
          {activeTab === 'tokens' && (
            <button onClick={addToken} style={addButtonStyle}>+ INSERT_NODE</button>
          )}
          <button onClick={validateAndClose} style={commitButtonStyle}>COMMIT_CHANGES</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)' };
const modalStyle = { width: 580, background: '#0a0f1e', border: '1px solid #00d4ff', borderRadius: 4, display: 'flex', flexDirection: 'column', maxHeight: '75vh', boxShadow: '0 0 40px rgba(0,212,255,0.15)' };
const headerStyle = { padding: '14px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' };
const tabRowStyle = { display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', padding: '0 20px' };
const tabBtn = { background: 'none', border: 'none', padding: '8px 14px', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, cursor: 'pointer', letterSpacing: 1, transition: 'color 0.2s' };
const colHeader = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 50px', gap: 10, padding: '12px 0 8px', fontSize: 8, color: '#334155', fontWeight: 700, borderBottom: '1px solid #1e293b', marginBottom: 8 };
const rowStyle = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 50px', gap: 10, marginBottom: 8, alignItems: 'center' };
const vecRowStyle = { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '6px 8px', background: '#0f172a', borderRadius: 3, border: '1px solid #1e293b' };
const inputStyle = { background: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc', padding: '5px 8px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', borderRadius: 2, outline: 'none', width: '100%' };
const closeButtonStyle = { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' };
const deleteButtonStyle = { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 8, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' };
const addButtonStyle = { background: 'none', border: '1px solid #00ff9d', color: '#00ff9d', padding: '5px 10px', fontSize: 8, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' };
const resetButtonStyle = { background: 'none', border: '1px solid #334155', color: '#475569', padding: '5px 10px', fontSize: 8, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' };
const commitButtonStyle = { background: '#00d4ff', border: 'none', color: '#000', padding: '5px 16px', fontSize: 9, fontWeight: 800, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' };
const footerStyle = { padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', gap: 8, alignItems: 'center', background: '#0f172a' };
const errorStyle = { margin: '6px 20px', padding: '5px 10px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 3, fontSize: 9, color: '#ff4d4d', fontFamily: 'monospace' };

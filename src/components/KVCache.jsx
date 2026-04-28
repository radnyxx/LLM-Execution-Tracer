import React from 'react';
import Tooltip from './Tooltip';

export default function KVCache({ tokens = [], generatedTokens = [], isProcessing = false }) {
  const allTokens = [...tokens, ...generatedTokens.slice(0, 8)];

  return (
    <div style={containerStyle}>
      <div style={headerRow}>
        <Tooltip term="kvCache">
          <span style={headerLabel}>KV_CACHE // MEMORY_STATE</span>
        </Tooltip>
        <span style={{ fontSize: 8, color: isProcessing ? '#00ff9d' : '#334155', fontWeight: 800 }}>
          {isProcessing ? '● WRITING' : '○ IDLE'}
        </span>
      </div>

      <div style={tableStyle}>
        <div style={colHeader}>
          <span style={colCell}>POSITION</span>
          <span style={colCell}>TOKEN</span>
          <span style={colCell}>KEY_VEC</span>
          <span style={colCell}>VAL_VEC</span>
          <span style={colCell}>STATUS</span>
        </div>

        {allTokens.map((t, i) => {
          const isGen = i >= tokens.length;
          const isNew = isProcessing && i === allTokens.length - 1;
          return (
            <div key={i} style={{
              ...rowStyle,
              borderLeft: `2px solid ${isGen ? '#00ff9d' : '#00d4ff'}`,
              background: isNew ? 'rgba(0,255,157,0.05)' : 'transparent',
              animation: isNew ? 'fade-in-up 0.3s ease' : 'none',
            }}>
              <span style={{ ...cell, color: '#475569' }}>[{String(i).padStart(3,'0')}]</span>
              <span style={{ ...cell, color: isGen ? '#00ff9d' : '#00d4ff', fontWeight: 700 }}>
                {t.word?.slice(0,8) || '?'}
              </span>
              <span style={{ ...cell, color: '#334155', fontFamily: 'monospace' }}>
                {fakeVec(t.id || i, 0)}
              </span>
              <span style={{ ...cell, color: '#334155', fontFamily: 'monospace' }}>
                {fakeVec(t.id || i, 1)}
              </span>
              <span style={{ ...cell }}>
                <span style={{
                  fontSize: 7, padding: '1px 5px', borderRadius: 2,
                  background: isNew ? 'rgba(0,255,157,0.2)' : 'rgba(0,212,255,0.1)',
                  color: isNew ? '#00ff9d' : '#00d4ff',
                }}>
                  {isNew ? 'NEW' : 'CACHED'}
                </span>
              </span>
            </div>
          );
        })}

        {allTokens.length === 0 && (
          <div style={{ padding: '12px 8px', fontSize: 9, color: '#334155', fontStyle: 'italic' }}>
            Cache empty — run inference to populate
          </div>
        )}
      </div>

      <div style={statsRow}>
        <span>ENTRIES: {allTokens.length}</span>
        <span>MEM: {(allTokens.length * 0.024).toFixed(2)}MB</span>
        <span>HIT_RATE: {allTokens.length > 0 ? ((tokens.length / allTokens.length) * 100).toFixed(0) : 0}%</span>
      </div>
    </div>
  );
}

function fakeVec(seed, offset) {
  const a = ((seed * 1664525 + offset * 1013904223) >>> 0) / 0xFFFFFFFF;
  const b = (((seed + 1) * 22695477 + offset) >>> 0) / 0xFFFFFFFF;
  return `[${a.toFixed(2)},${b.toFixed(2)}…]`;
}

const containerStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: 6 };
const headerLabel = { fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: 1, cursor: 'help' };
const tableStyle = { display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 160, overflowY: 'auto' };
const colHeader = { display: 'grid', gridTemplateColumns: '50px 60px 90px 90px 60px', gap: 4, padding: '3px 6px', borderBottom: '1px solid #1e293b' };
const colCell = { fontSize: 7, color: '#334155', fontWeight: 800 };
const rowStyle = { display: 'grid', gridTemplateColumns: '50px 60px 90px 90px 60px', gap: 4, padding: '3px 6px', borderBottom: '1px solid #0f172a', transition: 'background 0.3s' };
const cell = { fontSize: 8, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const statsRow = { display: 'flex', gap: 16, fontSize: 8, color: '#334155', fontWeight: 800, paddingTop: 4, borderTop: '1px solid #1e293b' };

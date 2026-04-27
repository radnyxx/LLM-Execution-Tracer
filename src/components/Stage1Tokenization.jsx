import React from 'react';

export default function Stage1Tokenization({ tokens = [] }) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>STAGE_01 // PRE_PROCESSOR_TOKENIZER</span>
        <span style={statusStyle}>RAW_BYTES: {tokens.length * 8}b</span>
      </div>

      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th>WORD</th>
              <th>TOKEN_ID</th>
              <th>ATTENTION_WEIGHT</th>
              <th>ENTROPY</th>
              <th>HEX_MAP</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr key={i} style={rowStyle}>
                <td style={{ color: '#00ff9d', fontWeight: 900 }}>{t.word}</td>
                <td style={monoStyle}>
                  {t.id ? String(t.id).slice(0, 12) : 'N/A'}...
                </td>
                <td>
                  <div style={barBg}>
                    <div style={{ ...barFill, width: `${t.weight * 100}%` }} />
                  </div>
                </td>
                <td style={{ color: t.weight > 0.7 ? '#ff4d4d' : '#94a3b8' }}>
                  {t.weight > 0.7 ? 'HIGH' : t.weight > 0.4 ? 'MED' : 'LOW'}
                </td>
                <td style={hexStyle}>0x{Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW: Metadata Footer to fill space */}
      <div style={footerStyle}>
        <div style={statBox}>
          <div style={statLabel}>SEQUENCE_COMPLEXITY</div>
          <div style={statValue}>{(tokens.length * 1.42).toFixed(2)}%</div>
        </div>
        <div style={statBox}>
          <div style={statLabel}>VOCAB_DENSITY</div>
          <div style={statValue}>{(tokens.length / 512).toFixed(4)}</div>
        </div>
        <div style={statBox}>
          <div style={statLabel}>ENCODING</div>
          <div style={statValue}>UTF-8/GPT-Llama</div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617' };
const headerStyle = { padding: '8px 12px', background: '#1e293b', fontSize: 10, color: '#00d4ff', fontWeight: 800, display: 'flex', justifyContent: 'space-between' };
const statusStyle = { color: '#64748b', fontSize: 9 };
const tableWrapper = { flex: 1, overflowY: 'auto', padding: '0 10px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 10 };
const theadStyle = { textAlign: 'left', fontSize: 8, color: '#475569', borderBottom: '1px solid #1e293b' };
const rowStyle = { borderBottom: '1px solid #0f172a', fontSize: 10 };
const monoStyle = { fontFamily: 'monospace', fontSize: 9, opacity: 0.6 };
const hexStyle = { fontFamily: 'monospace', fontSize: 9, color: '#64748b' };
const barBg = { width: '60px', height: '4px', background: '#1e293b', borderRadius: 2 };
const barFill = { height: '100%', background: '#00d4ff', borderRadius: 2 };

const footerStyle = { height: 50, borderTop: '1px solid #1e293b', display: 'flex', padding: '0 15px', gap: 20, alignItems: 'center' };
const statBox = { display: 'flex', flexDirection: 'column' };
const statLabel = { fontSize: 7, color: '#475569', fontWeight: 800 };
const statValue = { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' };

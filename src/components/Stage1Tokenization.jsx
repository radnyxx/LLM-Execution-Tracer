import React, { useMemo } from 'react';
import Tooltip from './Tooltip';
import { shannonEntropy, tokenHex, bpeSplit } from '../schema';

export default function Stage1Tokenization({ tokens = [], highlighted = false }) {
  // Stable computed values (no random on every render)
  const enriched = useMemo(() => tokens.map((t, i) => ({
    ...t,
    entropy: t.entropy ?? shannonEntropy(t.weight),
    hex: tokenHex(t.id ?? i),
    subwords: t.subwords ?? bpeSplit(t.word),
    byteLen: new TextEncoder().encode(t.word).length,
  })), [tokens]);

  const totalBytes = enriched.reduce((s, t) => s + t.byteLen, 0);
  const avgEntropy = enriched.length ? (enriched.reduce((s, t) => s + t.entropy, 0) / enriched.length).toFixed(3) : '0';
  const complexity = enriched.length ? (enriched.reduce((s, t) => s + t.weight, 0) / enriched.length * 100).toFixed(1) : '0';
  const vocabDensity = enriched.length ? (enriched.length / 32000).toFixed(5) : '0';

  return (
    <div style={containerStyle} className={highlighted ? 'stage-highlight-s1' : ''}>
      {/* HEADER */}
      <div style={{ ...headerStyle }} className="stage-header-s1">
        <span>STAGE_01 // PRE_PROCESSOR_TOKENIZER</span>
        <span style={statusStyle}>RAW_BYTES: {totalBytes * 8}b</span>
      </div>

      {/* TABLE */}
      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th>
                <Tooltip term="bpe"><span style={{ cursor: 'help' }}>WORD / SUBWORDS</span></Tooltip>
              </th>
              <th>TOKEN_ID</th>
              <th>
                <Tooltip term="attention"><span style={{ cursor: 'help' }}>ATTN_WEIGHT</span></Tooltip>
              </th>
              <th>
                <Tooltip term="entropy"><span style={{ cursor: 'help' }}>ENTROPY</span></Tooltip>
              </th>
              <th>HEX_MAP</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((t, i) => (
              <TokenRow key={t.id ?? i} token={t} index={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div style={footerStyle}>
        <StatBox label="AVG_ENTROPY" value={avgEntropy} tip="entropy" />
        <StatBox label="AVG_ATTN" value={`${complexity}%`} tip="attention" />
        <StatBox label="VOCAB_DENSITY" value={vocabDensity} />
        <StatBox label="ENCODING" value="BPE/UTF-8" tip="bpe" />
      </div>
    </div>
  );
}

function TokenRow({ token, index }) {
  const entropyLabel = token.entropy > 0.7 ? 'HIGH' : token.entropy > 0.4 ? 'MED' : 'LOW';
  const entropyColor = token.entropy > 0.7 ? '#ff4d4d' : token.entropy > 0.4 ? '#f59e0b' : '#94a3b8';

  return (
    <tr
      style={{
        ...rowStyle,
        animationDelay: `${index * 80}ms`,
      }}
      className="animate-token"
    >
      {/* WORD + BPE SUBWORDS */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#00ff9d', fontWeight: 900 }}>{token.word}</span>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {token.subwords.map((sw, j) => (
              <span key={j} style={subwordChip}>{sw}</span>
            ))}
          </div>
        </div>
      </td>

      {/* TOKEN ID */}
      <td style={monoStyle}>
        {String(token.id).padStart(5, '0')}
      </td>

      {/* ATTENTION BAR */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={barBg}>
            <div style={{
              ...barFill,
              width: `${token.weight * 100}%`,
              background: token.weight > 0.7 ? '#00ff9d' : token.weight > 0.4 ? '#00d4ff' : '#475569',
            }} />
          </div>
          <span style={{ fontSize: 8, color: '#64748b', width: 26 }}>{token.weight.toFixed(2)}</span>
        </div>
      </td>

      {/* ENTROPY */}
      <td style={{ color: entropyColor, fontSize: 9, fontWeight: 800 }}>
        <Tooltip term="entropy" label={`Shannon entropy: ${token.entropy.toFixed(3)} bits`}>
          <span style={{ cursor: 'help' }}>{entropyLabel}</span>
        </Tooltip>
        <div style={{ fontSize: 7, color: '#334155' }}>{token.entropy.toFixed(3)}</div>
      </td>

      {/* HEX */}
      <td style={hexStyle}>{token.hex}</td>
    </tr>
  );
}

function StatBox({ label, value, tip }) {
  const content = (
    <div style={statBox}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
  return tip ? <Tooltip term={tip}><span style={{ cursor: 'help' }}>{content}</span></Tooltip> : content;
}

const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617' };
const headerStyle = { padding: '7px 12px', background: '#0a0f1e', fontSize: 10, color: '#00d4ff', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const statusStyle = { color: '#334155', fontSize: 8 };
const tableWrapper = { flex: 1, overflowY: 'auto', padding: '0 10px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
const theadStyle = { textAlign: 'left', fontSize: 8, color: '#475569', borderBottom: '1px solid #1e293b', height: 24 };
const rowStyle = { borderBottom: '1px solid #0f172a', fontSize: 10, transition: 'background 0.2s' };
const monoStyle = { fontFamily: 'monospace', fontSize: 9, color: '#64748b' };
const hexStyle = { fontFamily: 'monospace', fontSize: 9, color: '#334155' };
const barBg = { width: '55px', height: '5px', background: '#1e293b', borderRadius: 2, overflow: 'hidden' };
const barFill = { height: '100%', borderRadius: 2, transition: 'width 0.4s ease' };
const subwordChip = { fontSize: 7, padding: '1px 4px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 2, color: '#00d4ff', fontFamily: 'monospace' };
const footerStyle = { minHeight: 46, borderTop: '1px solid #1e293b', display: 'flex', padding: '0 12px', gap: 16, alignItems: 'center', flexWrap: 'wrap' };
const statBox = { display: 'flex', flexDirection: 'column' };
const statLabel = { fontSize: 7, color: '#334155', fontWeight: 800, letterSpacing: 0.5 };
const statValue = { fontSize: 10, color: '#64748b', fontFamily: 'monospace' };

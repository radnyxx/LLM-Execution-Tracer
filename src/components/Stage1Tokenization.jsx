import React, { useMemo } from 'react';
import Tooltip from './Tooltip';
import { shannonEntropy, tokenHex, bpeSplit } from '../schema';

/**
 * Stage1Tokenization
 * New props vs original:
 *   ablatedIndex    : number   — index of currently zeroed token (-1 = none)
 *   onAblate        : (i) => void — called when user clicks a row to toggle ablation
 *
 * When a row is clicked its weight is visually zeroed and a red ABLATED badge
 * replaces the attention bar. The parent (App.jsx) receives the index and
 * builds the ablatedWeights array to pass down to Stage3Softmax.
 */
export default function Stage1Tokenization({
  tokens       = [],
  highlighted  = false,
  ablatedIndex = -1,
  onAblate     = () => {},
}) {
  const enriched = useMemo(() => tokens.map((t, i) => ({
    ...t,
    entropy:  t.entropy  ?? shannonEntropy(t.weight),
    hex:      tokenHex(t.id ?? i),
    subwords: t.subwords ?? bpeSplit(t.word),
    byteLen:  new TextEncoder().encode(t.word).length,
  })), [tokens]);

  const totalBytes   = enriched.reduce((s, t) => s + t.byteLen, 0);
  const avgEntropy   = enriched.length ? (enriched.reduce((s, t) => s + t.entropy, 0) / enriched.length).toFixed(3) : '0';
  const complexity   = enriched.length ? (enriched.reduce((s, t) => s + t.weight,  0) / enriched.length * 100).toFixed(1) : '0';
  const vocabDensity = enriched.length ? (enriched.length / 32000).toFixed(5) : '0';

  return (
    <div style={containerStyle} className={highlighted ? 'stage-highlight-s1' : ''}>

      {/* ── HEADER ── */}
      <div style={headerStyle} className="stage-header-s1">
        <span>STAGE_01 // PRE_PROCESSOR_TOKENIZER</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ablatedIndex >= 0 && (
            <span style={ablatedBadge}>
              ABLATING: "{tokens[ablatedIndex]?.word}"
            </span>
          )}
          <span style={statusStyle}>RAW_BYTES: {totalBytes * 8}b</span>
        </div>
      </div>

      {/* ── ABLATION HINT (shown once, disappears after first click) ── */}
      {ablatedIndex < 0 && enriched.length > 0 && (
        <div style={hintBar}>
          <span style={{ color: '#334155' }}>↑</span>
          {' '}click any row to zero-out that token's attention weight — Stage 3 will show the probability shift
        </div>
      )}

      {/* ── TABLE ── */}
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
              <TokenRow
                key={t.id ?? i}
                token={t}
                index={i}
                isAblated={i === ablatedIndex}
                onClick={() => onAblate(i)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div style={footerStyle}>
        <Tooltip term="entropy">
          <span style={{ cursor: 'help' }}>
            <StatBox
              label="AVG_ENTROPY"
              value={avgEntropy}
              hint="Shannon entropy averaged across tokens. Higher = model is less certain about next token."
            />
          </span>
        </Tooltip>
        <Tooltip term="attention">
          <span style={{ cursor: 'help' }}>
            <StatBox
              label="AVG_ATTN"
              value={`${complexity}%`}
              hint="Mean attention weight across all tokens. Higher = this prompt has strong semantic anchors."
            />
          </span>
        </Tooltip>
        <StatBox
          label="VOCAB_DENSITY"
          value={vocabDensity}
          hint={`This prompt uses ${vocabDensity} of the 32,000-token vocabulary — most prompts stay below 0.0002.`}
        />
        <Tooltip term="bpe">
          <span style={{ cursor: 'help' }}>
            <StatBox label="ENCODING" value="BPE/UTF-8" />
          </span>
        </Tooltip>

        {/* Reset ablation */}
        {ablatedIndex >= 0 && (
          <button onClick={() => onAblate(-1)} style={resetBtn}>
            ↺ RESET_ABLATION
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── TokenRow ────────────────────────────────────────────────────────────── */

function TokenRow({ token, index, isAblated, onClick }) {
  const entropyLabel = token.entropy > 0.7 ? 'HIGH' : token.entropy > 0.4 ? 'MED' : 'LOW';
  const entropyColor = token.entropy > 0.7 ? '#ff4d4d' : token.entropy > 0.4 ? '#f59e0b' : '#94a3b8';

  return (
    <tr
      onClick={onClick}
      title={isAblated ? 'Click to restore this token' : 'Click to zero-out attention weight (ablate)'}
      style={{
        ...rowStyle,
        animationDelay: `${index * 80}ms`,
        cursor: 'pointer',
        background: isAblated ? 'rgba(255,77,77,0.06)' : 'transparent',
        borderLeft: isAblated ? '2px solid #ff4d4d' : '2px solid transparent',
      }}
      className="animate-token"
    >
      {/* WORD + BPE SUBWORDS */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              color: isAblated ? '#ff4d4d' : '#00ff9d',
              fontWeight: 900,
              textDecoration: isAblated ? 'line-through' : 'none',
              opacity: isAblated ? 0.6 : 1,
            }}>
              {token.word}
            </span>
            {isAblated && (
              <span style={ablatedChip}>ABLATED</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {token.subwords.map((sw, j) => (
              <span key={j} style={{
                ...subwordChip,
                opacity: isAblated ? 0.3 : 1,
              }}>
                {sw}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* TOKEN ID */}
      <td style={{ ...monoStyle, opacity: isAblated ? 0.4 : 1 }}>
        {String(token.id).padStart(5, '0')}
      </td>

      {/* ATTENTION BAR — replaced with zeroed state when ablated */}
      <td>
        {isAblated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ ...barBg, border: '1px dashed rgba(255,77,77,0.3)' }}>
              <div style={{ ...barFill, width: '0%', background: '#ff4d4d' }} />
            </div>
            <span style={{ fontSize: 8, color: '#ff4d4d', width: 26 }}>0.00</span>
          </div>
        ) : (
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
        )}
      </td>

      {/* ENTROPY */}
      <td style={{ color: isAblated ? '#334155' : entropyColor, fontSize: 9, fontWeight: 800 }}>
        <Tooltip term="entropy" label={`Shannon entropy: ${token.entropy.toFixed(3)} bits`}>
          <span style={{ cursor: 'help', opacity: isAblated ? 0.3 : 1 }}>{entropyLabel}</span>
        </Tooltip>
        <div style={{ fontSize: 7, color: '#334155' }}>{token.entropy.toFixed(3)}</div>
      </td>

      {/* HEX */}
      <td style={{ ...hexStyle, opacity: isAblated ? 0.3 : 1 }}>{token.hex}</td>
    </tr>
  );
}

/* ─── StatBox ─────────────────────────────────────────────────────────────── */

function StatBox({ label, value, hint }) {
  return (
    <div style={statBox} title={hint ?? ''}>
      <div style={{ ...statLabel, borderBottom: hint ? '1px dashed #1e293b' : 'none', paddingBottom: hint ? 1 : 0 }}>
        {label}
      </div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const containerStyle  = { height: '100%', display: 'flex', flexDirection: 'column', background: '#020617' };
const headerStyle     = { padding: '7px 12px', background: '#0a0f1e', fontSize: 10, color: '#00d4ff', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const statusStyle     = { color: '#334155', fontSize: 8 };
const ablatedBadge    = { fontSize: 7, padding: '2px 6px', borderRadius: 2, background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', fontWeight: 800, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' };
const hintBar         = { padding: '4px 12px', fontSize: 8, color: '#334155', background: '#0a0f1e', borderBottom: '1px solid #1e293b', fontStyle: 'italic' };
const tableWrapper    = { flex: 1, overflowY: 'auto', padding: '0 10px' };
const tableStyle      = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
const theadStyle      = { textAlign: 'left', fontSize: 8, color: '#475569', borderBottom: '1px solid #1e293b', height: 24 };
const rowStyle        = { borderBottom: '1px solid #0f172a', fontSize: 10, transition: 'background 0.2s, border-left 0.2s' };
const monoStyle       = { fontFamily: 'monospace', fontSize: 9, color: '#64748b' };
const hexStyle        = { fontFamily: 'monospace', fontSize: 9, color: '#334155' };
const barBg           = { width: '55px', height: '5px', background: '#1e293b', borderRadius: 2, overflow: 'hidden' };
const barFill         = { height: '100%', borderRadius: 2, transition: 'width 0.4s ease' };
const subwordChip     = { fontSize: 7, padding: '1px 4px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 2, color: '#00d4ff', fontFamily: 'monospace' };
const ablatedChip     = { fontSize: 6, padding: '1px 4px', background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 2, color: '#ff4d4d', fontFamily: 'monospace', fontWeight: 800, letterSpacing: 0.5 };
const footerStyle     = { minHeight: 46, borderTop: '1px solid #1e293b', display: 'flex', padding: '0 12px', gap: 16, alignItems: 'center', flexWrap: 'wrap' };
const statBox         = { display: 'flex', flexDirection: 'column', cursor: 'default' };
const statLabel       = { fontSize: 7, color: '#334155', fontWeight: 800, letterSpacing: 0.5 };
const statValue       = { fontSize: 10, color: '#64748b', fontFamily: 'monospace' };
const resetBtn        = { marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', borderRadius: 2, padding: '3px 8px', fontSize: 7, fontWeight: 800, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };

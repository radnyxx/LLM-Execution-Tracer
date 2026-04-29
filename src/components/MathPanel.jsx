import React, { useMemo } from 'react';
import Tooltip from './Tooltip';
import { computeSoftmax } from '../schema';

const BASE_LOGITS = [3.2, 2.5, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1];
const BASE_WORDS  = ['Wisdom', 'Justice', 'Virtue', 'Truth', 'Beauty', 'Logic', 'Reason', 'Form'];

/**
 * MathPanel — Stage 3 sub-component
 * Shows the softmax formula with real numbers substituted in,
 * updating live as temperature changes.
 * Props:
 *   temperature  : number   — current temperature value
 *   focusWord    : string   — token to spotlight in the equation (default: first word)
 *   focusLogit   : number   — logit for that token (default: BASE_LOGITS[0])
 */
export default function MathPanel({ temperature = 0.7, focusWord, focusLogit }) {
  const T        = Math.max(temperature, 0.01);
  const word     = focusWord  ?? BASE_WORDS[0];
  const logit    = focusLogit ?? BASE_LOGITS[0];

  const { probs, scaledFocus, expFocus, sumExp, entropy, insight, insightColor } = useMemo(() => {
    const probs      = computeSoftmax(BASE_LOGITS, T);
    const allScaled  = BASE_LOGITS.map(l => l / T);
    const maxScaled  = Math.max(...allScaled);
    const exps       = allScaled.map(v => Math.exp(v - maxScaled));
    const sumExp     = exps.reduce((a, b) => a + b, 0);
    const scaledFocus = logit / T;
    const expFocus   = Math.exp(scaledFocus - maxScaled);
    const entropy    = -probs.reduce((s, p) => p > 0 ? s + p * Math.log2(p) : s, 0);

    let insight, insightColor;
    if (T < 0.4) {
      insight      = `T=${T.toFixed(2)}: distribution collapses to "${BASE_WORDS[0]}" (${(probs[0]*100).toFixed(0)}%). Near-deterministic — the model will almost always pick this token.`;
      insightColor = '#00d4ff';
    } else if (T < 0.9) {
      insight      = `T=${T.toFixed(2)}: balanced distribution. "${BASE_WORDS[0]}" leads but lower-ranked tokens have real probability mass. Entropy: ${entropy.toFixed(2)} bits.`;
      insightColor = '#00ff9d';
    } else if (T < 1.4) {
      insight      = `T=${T.toFixed(2)}: lower-ranked tokens like "${BASE_WORDS[4]}" gain significant probability. The model may surprise — useful for creative tasks.`;
      insightColor = '#f59e0b';
    } else {
      insight      = `T=${T.toFixed(2)}: near-flat distribution (entropy: ${entropy.toFixed(2)} bits). All tokens are almost equally likely — output becomes incoherent.`;
      insightColor = '#ff4d4d';
    }

    return { probs, scaledFocus, expFocus, sumExp, entropy, insight, insightColor };
  }, [T, logit]);

  const prob0pct = (probs[0] * 100).toFixed(1);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Tooltip term="softmax">
          <span style={headerLabel}>LIVE_MATH // SOFTMAX_EQUATION</span>
        </Tooltip>
        <span style={{ fontSize: 8, color: '#334155' }}>updates with temperature slider</span>
      </div>

      {/* Equation block */}
      <div style={equationBlock}>

        {/* Step 1: formula */}
        <div style={stepRow}>
          <span style={stepNum}>①</span>
          <span style={stepDesc}>Scale logit by temperature</span>
        </div>
        <div style={mathLine}>
          <span style={varStyle}>z</span>
          <span style={opStyle}> / </span>
          <span style={varStyle}>T</span>
          <span style={opStyle}> = </span>
          <span style={numStyle}>{logit.toFixed(1)}</span>
          <span style={opStyle}> / </span>
          <span style={{ ...numStyle, color: insightColor }}>{T.toFixed(2)}</span>
          <span style={opStyle}> = </span>
          <span style={resultStyle}>{scaledFocus.toFixed(3)}</span>
        </div>

        <div style={dividerStyle} />

        {/* Step 2: exponentiate */}
        <div style={stepRow}>
          <span style={stepNum}>②</span>
          <span style={stepDesc}>Exponentiate (numerator)</span>
        </div>
        <div style={mathLine}>
          <span style={funcStyle}>exp</span>
          <span style={opStyle}>(</span>
          <span style={resultStyle}>{scaledFocus.toFixed(3)}</span>
          <span style={opStyle}>) = </span>
          <span style={resultStyle}>{expFocus.toFixed(4)}</span>
        </div>

        <div style={dividerStyle} />

        {/* Step 3: normalize */}
        <div style={stepRow}>
          <span style={stepNum}>③</span>
          <span style={stepDesc}>Normalize over vocabulary (Σ = {sumExp.toFixed(3)})</span>
        </div>
        <div style={mathLine}>
          <span style={varStyle}>P</span>
          <span style={opStyle}>("</span>
          <span style={{ ...numStyle, color: '#00ff9d' }}>{word}</span>
          <span style={opStyle}>") = </span>
          <span style={resultStyle}>{expFocus.toFixed(4)}</span>
          <span style={opStyle}> / </span>
          <span style={resultStyle}>{sumExp.toFixed(3)}</span>
          <span style={opStyle}> = </span>
          <span style={{ ...resultStyle, fontSize: 13, color: '#f59e0b' }}>{prob0pct}%</span>
        </div>

        <div style={dividerStyle} />

        {/* Step 4: full distribution preview */}
        <div style={stepRow}>
          <span style={stepNum}>④</span>
          <span style={stepDesc}>Full distribution (top 4)</span>
        </div>
        <div style={distGrid}>
          {BASE_WORDS.slice(0, 4).map((w, i) => {
            const pct = (probs[i] * 100).toFixed(1);
            const barW = probs[i] * 100;
            const barColor = i === 0 ? '#f59e0b' : '#00d4ff';
            return (
              <div key={w} style={distRow}>
                <span style={{ ...distWord, color: i === 0 ? '#f59e0b' : '#94a3b8', fontWeight: i === 0 ? 800 : 400 }}>
                  {i === 0 ? '▶ ' : ''}{w}
                </span>
                <div style={distBarTrack}>
                  <div style={{ ...distBarFill, width: `${barW}%`, background: barColor }} />
                </div>
                <span style={{ ...distPct, color: i === 0 ? '#f59e0b' : '#64748b' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight */}
      <div style={{ ...insightBox, borderColor: `${insightColor}33`, background: `${insightColor}0a` }}>
        <span style={{ fontSize: 7, fontWeight: 800, color: insightColor, letterSpacing: 1 }}>⟐ INTERPRETATION</span>
        <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{insight}</p>
      </div>

      {/* Entropy meter */}
      <div style={entropyRow}>
        <Tooltip term="entropy">
          <span style={{ fontSize: 7, color: '#334155', fontWeight: 800, cursor: 'help' }}>DISTRIBUTION_ENTROPY</span>
        </Tooltip>
        <div style={entropyTrack}>
          <div style={{
            ...entropyFill,
            width: `${(entropy / 3) * 100}%`,
            background: insightColor,
          }} />
        </div>
        <span style={{ fontSize: 8, color: insightColor, fontWeight: 800 }}>{entropy.toFixed(3)} bits</span>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '10px 12px',
  background: '#020617',
  borderTop: '1px solid #1e293b',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 2,
};

const headerLabel = {
  fontSize: 8,
  fontWeight: 800,
  color: '#475569',
  letterSpacing: 1,
  cursor: 'help',
  borderBottom: '1px dashed #334155',
};

const equationBlock = {
  background: '#0a0f1e',
  border: '1px solid #1e293b',
  borderRadius: 4,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const stepRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 2,
};

const stepNum = {
  fontSize: 8,
  color: '#334155',
  fontWeight: 800,
  width: 14,
  flexShrink: 0,
};

const stepDesc = {
  fontSize: 8,
  color: '#475569',
  letterSpacing: 0.5,
};

const mathLine = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 2,
  paddingLeft: 20,
  flexWrap: 'wrap',
};

const varStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  color: '#64748b',
  fontStyle: 'italic',
};

const funcStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  color: '#a855f7',
};

const opStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  color: '#334155',
};

const numStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  color: '#00d4ff',
  fontWeight: 700,
};

const resultStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  color: '#00ff9d',
  fontWeight: 700,
};

const dividerStyle = {
  borderTop: '1px solid #0f172a',
  margin: '2px 0',
};

const distGrid = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  paddingLeft: 20,
};

const distRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const distWord = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9,
  minWidth: 54,
};

const distBarTrack = {
  flex: 1,
  height: 5,
  background: '#1e293b',
  borderRadius: 2,
  overflow: 'hidden',
};

const distBarFill = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.35s ease',
};

const distPct = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 8,
  minWidth: 36,
  textAlign: 'right',
};

const insightBox = {
  border: '1px solid',
  borderRadius: 3,
  padding: '6px 10px',
};

const entropyRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const entropyTrack = {
  flex: 1,
  height: 4,
  background: '#1e293b',
  borderRadius: 2,
  overflow: 'hidden',
};

const entropyFill = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.35s ease, background 0.35s ease',
};

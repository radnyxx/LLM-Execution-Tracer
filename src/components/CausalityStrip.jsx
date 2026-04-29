import React, { useMemo } from 'react';
import { cosineSimilarity } from '../schema';

/**
 * CausalityStrip — placed between the header and the 2×2 stage grid in App.jsx
 *
 * Reads live schema + neuralState and renders a horizontal 4-node chain:
 *   Stage 1 dominant token → Stage 2 embedding position → Stage 3 top candidate → Stage 4 output
 *
 * Each node has:
 *   - A stage label + colour accent matching the existing stage palette
 *   - A 1-line "value" (the concrete output of that stage)
 *   - A 1-line "because" annotation (why it came out that way)
 *
 * Props:
 *   schema         : object  — full schema object from App state
 *   temperature    : number  — current temperature
 *   activeTokenIdx : number  — index of currently-attended token (-1 = idle)
 *   topGenWord     : string  — first generated word from Stage 4 (empty string if not started)
 *   isProcessing   : bool
 */
export default function CausalityStrip({
  schema = {},
  temperature = 0.7,
  activeTokenIdx = -1,
  topGenWord = '',
  isProcessing = false,
}) {
  const nodes = useMemo(() => {
    const tokens  = schema.tokens  || [];
    const vectors = schema.vectors || {};

    /* ── Stage 1: dominant token ── */
    const dominant = tokens.length
      ? tokens.reduce((best, t) => t.weight > best.weight ? t : best, tokens[0])
      : null;

    const s1Value   = dominant ? `"${dominant.word}"` : '—';
    const s1Because = dominant
      ? `weight ${dominant.weight.toFixed(2)} — highest attention score in this prompt`
      : 'no tokens loaded';

    /* ── Stage 2: embedding cluster ── */
    let s2Value   = '—';
    let s2Because = 'no vectors loaded';

    if (dominant && vectors[dominant.word]) {
      const vec = vectors[dominant.word];
      // Find nearest neighbour (excluding self and Intent)
      let bestSim = -1, bestNeighbour = null;
      tokens.forEach(t => {
        if (t.word === dominant.word) return;
        const v2 = vectors[t.word];
        if (!v2) return;
        const sim = cosineSimilarity(vec, v2);
        if (sim > bestSim) { bestSim = sim; bestNeighbour = t.word; }
      });

      const vecStr = `[${vec.map(v => v.toFixed(2)).join(', ')}]`;
      s2Value   = vecStr;
      s2Because = bestNeighbour
        ? `clusters near "${bestNeighbour}" (cos_sim ${bestSim.toFixed(2)}) — shared semantic domain`
        : `embedding at ${vecStr}`;
    }

    /* ── Stage 3: softmax top candidate ── */
    const BASE_LOGITS = [3.2, 2.5, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1];
    const BASE_WORDS  = ['Wisdom', 'Justice', 'Virtue', 'Truth', 'Beauty', 'Logic', 'Reason', 'Form'];

    const T       = Math.max(temperature, 0.01);
    const scaled  = BASE_LOGITS.map(l => l / T);
    const maxSc   = Math.max(...scaled);
    const exps    = scaled.map(v => Math.exp(v - maxSc));
    const sum     = exps.reduce((a, b) => a + b, 0);
    const probs   = exps.map(e => e / sum);
    const topIdx  = probs.indexOf(Math.max(...probs));
    const topWord = BASE_WORDS[topIdx];
    const topProb = (probs[topIdx] * 100).toFixed(1);

    const activeWord = activeTokenIdx >= 0 && tokens[activeTokenIdx]
      ? tokens[activeTokenIdx].word
      : null;

    const s3Value   = `"${topWord}" — ${topProb}%`;
    const s3Because = activeWord
      ? `attention focused on "${activeWord}" → logits biased toward semantically related tokens`
      : T < 0.5
        ? `low temperature (${T.toFixed(2)}) sharpens distribution → argmax dominates`
        : T > 1.2
          ? `high temperature (${T.toFixed(2)}) flattens distribution → competition between candidates`
          : `dominant token embedding shifts logit mass toward "${topWord}"`;

    /* ── Stage 4: generated output ── */
    const s4Value   = topGenWord ? `"${topGenWord} …"` : 'awaiting inference';
    const s4Because = topGenWord
      ? `sampled from nucleus (top-P) — "${topWord}" context propagated through all 32 layers`
      : isProcessing
        ? 'forward pass in progress…'
        : 'click RUN_INFERENCE in Stage 4 to generate';

    return [
      { id: 'S1', label: 'STAGE_01', sublabel: 'TOKENIZER',   color: '#00d4ff', value: s1Value,   because: s1Because },
      { id: 'S2', label: 'STAGE_02', sublabel: 'EMBEDDINGS',  color: '#a855f7', value: s2Value,   because: s2Because },
      { id: 'S3', label: 'STAGE_03', sublabel: 'SOFTMAX',     color: '#f59e0b', value: s3Value,   because: s3Because },
      { id: 'S4', label: 'STAGE_04', sublabel: 'GENERATION',  color: '#00ff9d', value: s4Value,   because: s4Because },
    ];
  }, [schema, temperature, activeTokenIdx, topGenWord, isProcessing]);

  return (
    <div style={stripOuter}>
      {/* Left label */}
      <div style={leftLabel}>
        <span style={leftLabelText}>CAUSAL<br />CHAIN</span>
      </div>

      {/* Nodes + connectors */}
      <div style={nodesRow}>
        {nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <div style={nodeWrapper}>
              {/* Stage badge */}
              <div style={{ ...stageBadge, color: node.color, borderColor: `${node.color}44` }}>
                <span style={badgeLabel}>{node.label}</span>
                <span style={{ ...badgeSub, color: `${node.color}99` }}>{node.sublabel}</span>
              </div>

              {/* Value pill */}
              <div style={{ ...valuePill, borderColor: `${node.color}33`, background: `${node.color}0d` }}>
                <span style={{ ...valueText, color: node.color }}>{node.value}</span>
              </div>

              {/* Because annotation */}
              <div style={becauseBox}>
                <span style={becauseArrow}>↳</span>
                <span style={becauseText}>{node.because}</span>
              </div>
            </div>

            {/* Arrow connector */}
            {i < nodes.length - 1 && (
              <div style={connectorCol}>
                <div style={connectorLine} />
                <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
                  <path d="M0 2L4 4L0 6" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ ...connectorLine, width: 4 }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right: entropy / temp summary */}
      <div style={rightSummary}>
        <div style={summaryItem}>
          <span style={summaryLabel}>TEMP</span>
          <span style={{
            ...summaryValue,
            color: temperature < 0.5 ? '#00d4ff' : temperature < 1.1 ? '#00ff9d' : temperature < 1.5 ? '#f59e0b' : '#ff4d4d',
          }}>
            {temperature.toFixed(2)}
          </span>
        </div>
        <div style={summaryItem}>
          <span style={summaryLabel}>TOKENS</span>
          <span style={summaryValue}>{(schema.tokens || []).length}</span>
        </div>
        <div style={summaryItem}>
          <span style={summaryLabel}>STATUS</span>
          <span style={{ ...summaryValue, color: isProcessing ? '#00ff9d' : '#334155' }}>
            {isProcessing ? 'LIVE' : 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const stripOuter = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 0,
  padding: '6px 12px',
  background: '#020617',
  borderBottom: '1px solid #1e293b',
  minHeight: 72,
  flexShrink: 0,
};

const leftLabel = {
  display: 'flex',
  alignItems: 'center',
  paddingRight: 12,
  borderRight: '1px solid #1e293b',
  marginRight: 12,
  alignSelf: 'stretch',
};

const leftLabelText = {
  fontSize: 7,
  fontWeight: 800,
  color: '#1e293b',
  letterSpacing: 1.5,
  lineHeight: 1.4,
  textAlign: 'center',
  fontFamily: 'JetBrains Mono, monospace',
};

const nodesRow = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  overflowX: 'auto',
  paddingBottom: 2,
};

const nodeWrapper = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 148,
  maxWidth: 180,
  flexShrink: 0,
};

const stageBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  border: '1px solid',
  borderRadius: 2,
  padding: '2px 6px',
  width: 'fit-content',
};

const badgeLabel = {
  fontSize: 7,
  fontWeight: 800,
  letterSpacing: 1,
  fontFamily: 'JetBrains Mono, monospace',
};

const badgeSub = {
  fontSize: 7,
  fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: 0.5,
};

const valuePill = {
  border: '1px solid',
  borderRadius: 3,
  padding: '3px 7px',
};

const valueText = {
  fontSize: 9,
  fontWeight: 800,
  fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: 0.3,
};

const becauseBox = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 4,
  paddingLeft: 2,
};

const becauseArrow = {
  fontSize: 8,
  color: '#334155',
  flexShrink: 0,
  marginTop: 1,
};

const becauseText = {
  fontSize: 8,
  color: '#475569',
  lineHeight: 1.5,
  fontFamily: 'JetBrains Mono, monospace',
};

const connectorCol = {
  display: 'flex',
  alignItems: 'center',
  paddingBottom: 24, // aligns with valuePill row vertically
  flexShrink: 0,
  margin: '0 4px',
};

const connectorLine = {
  width: 12,
  height: 1,
  background: '#1e293b',
};

const rightSummary = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 6,
  paddingLeft: 12,
  borderLeft: '1px solid #1e293b',
  marginLeft: 8,
  alignSelf: 'stretch',
  minWidth: 64,
};

const summaryItem = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const summaryLabel = {
  fontSize: 6,
  color: '#1e293b',
  fontWeight: 800,
  letterSpacing: 1.5,
  fontFamily: 'JetBrains Mono, monospace',
};

const summaryValue = {
  fontSize: 10,
  color: '#475569',
  fontWeight: 800,
  fontFamily: 'JetBrains Mono, monospace',
};

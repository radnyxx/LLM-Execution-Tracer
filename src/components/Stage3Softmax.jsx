import React, { useMemo, useState } from 'react';
import Tooltip from './Tooltip';
import AttentionHeads from './AttentionHeads';
import MathPanel from './MathPanel';
import { computeSoftmax } from '../schema';

const BASE_LOGITS = [3.2, 2.5, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1];
const BASE_WORDS  = ['Wisdom', 'Justice', 'Virtue', 'Truth', 'Beauty', 'Logic', 'Reason', 'Form'];

/**
 * Stage3Softmax
 * New props vs original:
 *   ablatedWeights : number[]  — per-token weight overrides from Stage 1 ablation (optional)
 *                                When present, the attention trace and a delta column show
 *                                how zeroing that token shifted the probabilities.
 */
export default function Stage3Softmax({
  tokens          = [],
  activeTokenIndex = -1,
  logits          = [],
  temperature     = 0.7,
  highlighted     = false,
  ablatedWeights  = [],   // NEW — array same length as tokens, or empty
}) {
  const [topP,          setTopP]          = useState(0.9);
  const [showNucleus,   setShowNucleus]   = useState(false);
  const [activeTab,     setActiveTab]     = useState('softmax'); // 'softmax' | 'heads' | 'math' | 'compare'
  const [showAblation,  setShowAblation]  = useState(false);

  /* ── baseline softmax ── */
  const softmaxData = useMemo(() => {
    const probs = computeSoftmax(BASE_LOGITS, temperature);
    let cumulative = 0;
    return BASE_WORDS.map((word, i) => {
      cumulative += probs[i];
      return {
        word,
        logit: BASE_LOGITS[i],
        p: probs[i],
        cumulative,
        inNucleus: cumulative - probs[i] < topP,
      };
    });
  }, [temperature, topP]);

  /* ── ablated softmax (when a token has been zeroed in Stage 1) ── */
  const ablatedData = useMemo(() => {
    if (!ablatedWeights.length) return null;
    // Scale logits by ratio of remaining attention weight
    const origTotal = tokens.reduce((s, t) => s + t.weight, 0) || 1;
    const ablTotal  = ablatedWeights.reduce((s, w) => s + w, 0) || 0.001;
    const ratio     = ablTotal / origTotal;
    const modLogits = BASE_LOGITS.map(l => l * ratio);
    const probs     = computeSoftmax(modLogits, temperature);
    let cumulative  = 0;
    return BASE_WORDS.map((word, i) => {
      cumulative += probs[i];
      return { word, logit: modLogits[i], p: probs[i], cumulative, inNucleus: cumulative - probs[i] < topP };
    });
  }, [ablatedWeights, tokens, temperature, topP]);

  /* ── live logits from inference override base ── */
  const displayData = logits.length > 0
    ? logits.map((l, i) => ({ ...l, logit: BASE_LOGITS[i] || 0, inNucleus: true, cumulative: l.p }))
    : softmaxData;

  const topCandidate = displayData[0];

  /* ── contrastive data (T=0.2 vs T=1.5) ── */
  const contrastiveData = useMemo(() => {
    const make = (T) => {
      const probs = computeSoftmax(BASE_LOGITS, T);
      return BASE_WORDS.map((word, i) => ({ word, p: probs[i], logit: BASE_LOGITS[i] }));
    };
    return { low: make(0.2), high: make(1.5) };
  }, []);

  /* ── ablation delta (show +/- change per word) ── */
  const ablationDeltas = useMemo(() => {
    if (!ablatedData) return null;
    return BASE_WORDS.map((word, i) => ({
      word,
      delta: ablatedData[i].p - softmaxData[i].p,
    }));
  }, [ablatedData, softmaxData]);

  const hasAblation = ablatedWeights.length > 0;

  return (
    <div style={containerStyle}>
      {/* ── HEADER ── */}
      <div style={headerStyle} className="stage-header-s3">
        <span>STAGE_03 // SOFTMAX_DECISION_HUB</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <TabBtn label="SOFTMAX"  active={activeTab === 'softmax'}  onClick={() => setActiveTab('softmax')}  color="#f59e0b" />
          <TabBtn label="MATH"     active={activeTab === 'math'}     onClick={() => setActiveTab('math')}     color="#a855f7" />
          <TabBtn label="COMPARE"  active={activeTab === 'compare'}  onClick={() => setActiveTab('compare')}  color="#00d4ff" />
          <TabBtn label="ATT_HEADS" active={activeTab === 'heads'}   onClick={() => setActiveTab('heads')}    color="#00ff9d" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TAB: SOFTMAX  (original view + ablation layer)
      ══════════════════════════════════════════════ */}
      {activeTab === 'softmax' && (
        <div style={contentStyle}>

          {/* LEFT: Attention trace */}
          <div style={zoneStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={subLabel}>
                <Tooltip term="attention">ATTENTION_TRACE // LAYER_WEIGHTS</Tooltip>
              </div>
              {/* Ablation toggle — only show if tokens have been ablated */}
              {hasAblation && (
                <button
                  onClick={() => setShowAblation(a => !a)}
                  style={{
                    fontSize: 7, padding: '2px 6px', cursor: 'pointer', borderRadius: 2,
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                    border: `1px solid ${showAblation ? '#ff4d4d' : '#1e293b'}`,
                    background: showAblation ? 'rgba(255,77,77,0.08)' : 'none',
                    color: showAblation ? '#ff4d4d' : '#334155',
                  }}
                >
                  ΔABLATION
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {tokens.map((t, i) => {
                const isActive   = i === activeTokenIndex;
                const isAblated  = ablatedWeights.length && ablatedWeights[i] === 0;
                const dispWeight = ablatedWeights.length ? ablatedWeights[i] : t.weight;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 52, fontSize: 8, textAlign: 'right', fontFamily: 'monospace',
                      color: isAblated ? '#ff4d4d' : isActive ? '#f59e0b' : '#475569',
                      fontWeight: isActive || isAblated ? 800 : 400,
                      textDecoration: isAblated ? 'line-through' : 'none',
                    }}>
                      {t.word}
                    </div>
                    <div style={{ flex: 1, height: 10, background: '#1e293b', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%',
                        width: `${dispWeight * 100}%`,
                        background: isAblated ? '#ff4d4d' : isActive ? '#f59e0b' : '#00d4ff',
                        opacity: isAblated ? 0.3 : isActive ? 1 : 0.35,
                        transition: 'width 0.5s ease, background 0.3s',
                        borderRadius: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 8, color: isAblated ? '#ff4d4d' : '#475569', width: 28, textAlign: 'right' }}>
                      {isAblated ? '0.00' : dispWeight.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current focus */}
            <div style={focusBox}>
              <div style={{ fontSize: 7, color: '#475569', marginBottom: 3 }}>CURRENT_FOCUS_TOKEN</div>
              <div style={{ fontSize: 13, color: '#f59e0b', fontFamily: 'monospace', fontWeight: 800 }}>
                {activeTokenIndex >= 0 && tokens[activeTokenIndex] ? tokens[activeTokenIndex].word : 'NULL_IDLE'}
              </div>
            </div>

            {/* Temperature effect */}
            <div style={tempBox}>
              <div style={{ fontSize: 7, color: '#475569', marginBottom: 3 }}>
                <Tooltip term="temperature">TEMP_EFFECT</Tooltip>
              </div>
              <div style={{ fontSize: 9, color: temperature < 0.5 ? '#00d4ff' : temperature < 1 ? '#00ff9d' : '#ff4d4d' }}>
                {temperature < 0.5 ? '▼ SHARP / CERTAIN' : temperature < 1 ? '◆ BALANCED' : '▲ FLAT / RANDOM'}
              </div>
              <div style={{ fontSize: 8, color: '#334155' }}>T = {temperature.toFixed(2)}</div>
            </div>
          </div>

          {/* RIGHT: Candidate logits + optional ablation deltas */}
          <div style={{ ...zoneStyle, borderLeft: '1px solid #1e293b', paddingLeft: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={subLabel}>
                <Tooltip term="logits">CANDIDATE_LOGITS (TOP_K)</Tooltip>
              </div>
              <button
                onClick={() => setShowNucleus(n => !n)}
                style={{
                  fontSize: 7, color: showNucleus ? '#a855f7' : '#334155',
                  background: 'none', border: `1px solid ${showNucleus ? '#a855f7' : '#1e293b'}`,
                  borderRadius: 2, padding: '2px 6px', cursor: 'pointer', fontFamily: 'monospace',
                }}
              >
                <Tooltip term="nucleus">TOP-P</Tooltip>
              </button>
            </div>

            {/* Nucleus slider */}
            {showNucleus && (
              <div style={{ marginTop: 4, padding: '6px 8px', background: 'rgba(168,85,247,0.08)', borderRadius: 3, border: '1px solid rgba(168,85,247,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#a855f7', marginBottom: 3 }}>
                  <span>TOP-P (nucleus)</span><span>{topP.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={topP}
                  onChange={e => setTopP(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#a855f7' }} />
              </div>
            )}

            {/* Logit bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, overflowY: 'auto', flex: 1 }}>
              {displayData.map((item, i) => {
                const delta   = ablationDeltas?.[i]?.delta ?? null;
                const showDlt = showAblation && delta !== null;
                return (
                  <div key={i} style={{ opacity: showNucleus && !item.inNucleus ? 0.25 : 1, transition: 'opacity 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'monospace', marginBottom: 3 }}>
                      <span style={{ color: i === 0 ? '#f59e0b' : '#94a3b8', fontWeight: i === 0 ? 800 : 400 }}>
                        {i === 0 ? '▶ ' : ''}{item.word}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#334155', fontSize: 8 }}>logit: {item.logit?.toFixed(1)}</span>
                        <span style={{ color: i === 0 ? '#f59e0b' : '#64748b' }}>{(item.p * 100).toFixed(1)}%</span>
                        {/* Ablation delta badge */}
                        {showDlt && (
                          <span style={{
                            fontSize: 7, fontWeight: 800, minWidth: 36, textAlign: 'right',
                            color: delta > 0.001 ? '#00ff9d' : delta < -0.001 ? '#ff4d4d' : '#334155',
                          }}>
                            {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bar track — shows both original (dim) and ablated (bright) when active */}
                    <div style={{ height: 5, background: '#1e293b', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                      {/* Original bar (always shown) */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        height: '100%',
                        width: `${item.p * 100}%`,
                        background: i === 0 ? '#f59e0b' : '#00d4ff',
                        borderRadius: 2,
                        opacity: showAblation && ablatedData ? 0.25 : 1,
                        transition: 'width 0.4s ease, opacity 0.3s',
                      }} />
                      {/* Ablated bar overlay */}
                      {showAblation && ablatedData && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0,
                          height: '100%',
                          width: `${ablatedData[i].p * 100}%`,
                          background: delta > 0 ? '#00ff9d' : '#ff4d4d',
                          borderRadius: 2,
                          transition: 'width 0.4s ease',
                        }} />
                      )}
                      {/* Nucleus cutoff */}
                      {showNucleus && item.inNucleus && !displayData[i + 1]?.inNucleus && (
                        <div style={{ position: 'absolute', right: 0, top: -4, width: 1, height: 12, background: '#a855f7' }} />
                      )}
                    </div>

                    {showNucleus && (
                      <div style={{ fontSize: 7, color: '#334155', textAlign: 'right', marginTop: 1 }}>
                        cumul: {(item.cumulative * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ablation legend */}
            {showAblation && ablatedData && (
              <div style={ablationLegend}>
                <span style={{ color: '#475569', fontSize: 7 }}>
                  <span style={{ color: '#00d4ff' }}>■</span> baseline &nbsp;
                  <span style={{ color: '#00ff9d' }}>■</span> after ablation (↑) &nbsp;
                  <span style={{ color: '#ff4d4d' }}>■</span> after ablation (↓)
                </span>
              </div>
            )}

            {/* Chosen token */}
            {topCandidate && (
              <div style={chosenBox}>
                <span style={{ fontSize: 7, color: '#334155' }}>SAMPLED_TOKEN →</span>
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 800 }}>{topCandidate.word}</span>
                <span style={{ fontSize: 8, color: '#475569' }}>{(topCandidate.p * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: MATH  — live substituted softmax equation
      ══════════════════════════════════════════════ */}
      {activeTab === 'math' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MathPanel
            temperature={temperature}
            focusWord={displayData[0]?.word  ?? BASE_WORDS[0]}
            focusLogit={displayData[0]?.logit ?? BASE_LOGITS[0]}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: COMPARE  — side-by-side T=0.2 vs T=1.5
      ══════════════════════════════════════════════ */}
      {activeTab === 'compare' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Explainer */}
          <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.6, borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
            Same logits, two temperatures. This is the clearest demonstration of what temperature actually does to the probability distribution.
          </div>

          <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
            {[
              { label: 'T = 0.2', sublabel: 'DETERMINISTIC', data: contrastiveData.low,  color: '#00d4ff', desc: 'Distribution collapses → model nearly always picks the top token. Predictable but repetitive.' },
              { label: 'T = 1.5', sublabel: 'CREATIVE',      data: contrastiveData.high, color: '#ff4d4d', desc: 'Distribution flattens → lower-ranked tokens become viable. Surprising but risks incoherence.' },
            ].map(({ label, sublabel, data, color, desc }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Column header */}
                <div style={{ padding: '5px 8px', borderRadius: 3, border: `1px solid ${color}44`, background: `${color}0d` }}>
                  <div style={{ fontSize: 10, color, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
                  <div style={{ fontSize: 7, color: `${color}99`, letterSpacing: 1 }}>{sublabel}</div>
                </div>

                {/* Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {data.map((item, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontFamily: 'monospace', marginBottom: 2 }}>
                        <span style={{ color: i === 0 ? color : '#64748b', fontWeight: i === 0 ? 800 : 400 }}>
                          {i === 0 ? '▶ ' : ''}{item.word}
                        </span>
                        <span style={{ color: i === 0 ? color : '#334155' }}>{(item.p * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 5, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${item.p * 100}%`,
                          background: color, borderRadius: 2,
                          opacity: i === 0 ? 1 : 0.35 + (i * 0.05),
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Winner + description */}
                <div style={{ fontSize: 8, color: '#334155', lineHeight: 1.5, borderTop: '1px solid #1e293b', paddingTop: 6 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Current temperature marker */}
          <div style={{ padding: '5px 8px', background: '#0f172a', borderRadius: 3, border: '1px solid #1e293b', fontSize: 8, color: '#475569' }}>
            Your current temperature: <span style={{ color: '#f59e0b', fontWeight: 800 }}>T = {temperature.toFixed(2)}</span>
            {' '}— adjust the sidebar slider to see how it interpolates between these two extremes.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: ATTENTION HEADS
      ══════════════════════════════════════════════ */}
      {activeTab === 'heads' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <AttentionHeads tokens={tokens} activeTokenIndex={activeTokenIndex} />
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function TabBtn({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 7, padding: '2px 8px',
      border: `1px solid ${active ? color : '#1e293b'}`,
      background: active ? `${color}18` : 'none',
      color: active ? color : '#334155',
      borderRadius: 2, cursor: 'pointer',
      fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
    }}>
      {label}
    </button>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const containerStyle  = { height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0f1e' };
const headerStyle     = { padding: '7px 12px', background: '#0a0f1e', borderBottom: '1px solid #1e293b', fontSize: 10, color: '#f59e0b', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 };
const contentStyle    = { flex: 1, display: 'flex', padding: '10px 12px', gap: 12, overflow: 'hidden' };
const zoneStyle       = { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minWidth: 0 };
const subLabel        = { fontSize: 8, color: '#475569', fontWeight: 800, borderBottom: '1px solid #1e293b', paddingBottom: 4, cursor: 'help' };
const focusBox        = { marginTop: 'auto', padding: '6px 8px', border: '1px dashed #1e293b', borderRadius: 3 };
const tempBox         = { padding: '6px 8px', background: '#020617', borderRadius: 3, border: '1px solid #1e293b' };
const chosenBox       = { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 3, border: '1px solid rgba(245,158,11,0.2)', marginTop: 6 };
const ablationLegend  = { padding: '4px 0', marginTop: 4 };

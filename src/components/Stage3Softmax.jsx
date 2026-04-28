import React, { useMemo, useState } from 'react';
import Tooltip from './Tooltip';
import AttentionHeads from './AttentionHeads';
import { computeSoftmax } from '../schema';

const BASE_LOGITS = [3.2, 2.5, 1.8, 1.2, 0.8, 0.4, 0.2, 0.1];
const BASE_WORDS = ['Wisdom', 'Justice', 'Virtue', 'Truth', 'Beauty', 'Logic', 'Reason', 'Form'];

export default function Stage3Softmax({ tokens = [], activeTokenIndex = -1, logits = [], temperature = 0.7, highlighted = false }) {
  const [topP, setTopP] = useState(0.9);
  const [showNucleus, setShowNucleus] = useState(false);
  const [activeTab, setActiveTab] = useState('softmax'); // 'softmax' | 'heads'

  // Real softmax computation
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

  // Live logits from inference override base
  const displayData = logits.length > 0
    ? logits.map((l, i) => ({ ...l, logit: BASE_LOGITS[i] || 0, inNucleus: true, cumulative: l.p }))
    : softmaxData;

  const topCandidate = displayData[0];

  return (
    <div style={containerStyle}>
      <div style={headerStyle} className="stage-header-s3">
        <span>STAGE_03 // SOFTMAX_DECISION_HUB</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <TabBtn label="SOFTMAX" active={activeTab === 'softmax'} onClick={() => setActiveTab('softmax')} color="#f59e0b" />
          <TabBtn label="ATTN_HEADS" active={activeTab === 'heads'} onClick={() => setActiveTab('heads')} color="#00d4ff" />
        </div>
      </div>

      {activeTab === 'softmax' ? (
        <div style={contentStyle}>
          {/* LEFT: Attention trace */}
          <div style={zoneStyle}>
            <div style={subLabel}>
              <Tooltip term="attention">ATTENTION_TRACE // LAYER_WEIGHTS</Tooltip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {tokens.map((t, i) => {
                const isActive = i === activeTokenIndex;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 44, fontSize: 8, color: isActive ? '#f59e0b' : '#475569', textAlign: 'right', fontFamily: 'monospace', fontWeight: isActive ? 800 : 400 }}>
                      {t.word}
                    </div>
                    <div style={{ flex: 1, height: 10, background: '#1e293b', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%',
                        width: `${t.weight * 100}%`,
                        background: isActive ? '#f59e0b' : '#00d4ff',
                        opacity: isActive ? 1 : 0.35,
                        transition: 'width 0.5s ease, background 0.3s',
                        borderRadius: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 8, color: '#475569', width: 28, textAlign: 'right' }}>{t.weight.toFixed(2)}</div>
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

            {/* Temperature effect label */}
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

          {/* RIGHT: Softmax logits */}
          <div style={{ ...zoneStyle, borderLeft: '1px solid #1e293b', paddingLeft: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={subLabel}>
                <Tooltip term="logits">CANDIDATE_LOGITS (TOP_K)</Tooltip>
              </div>
              <button
                onClick={() => setShowNucleus(n => !n)}
                style={{ fontSize: 7, color: showNucleus ? '#a855f7' : '#334155', background: 'none', border: `1px solid ${showNucleus ? '#a855f7' : '#1e293b'}`, borderRadius: 2, padding: '2px 6px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                <Tooltip term="nucleus">TOP-P</Tooltip>
              </button>
            </div>

            {/* Nucleus P slider */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, overflowY: 'auto', flex: 1 }}>
              {displayData.map((item, i) => (
                <div key={i} style={{ opacity: showNucleus && !item.inNucleus ? 0.25 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'monospace', marginBottom: 3 }}>
                    <span style={{ color: i === 0 ? '#f59e0b' : '#94a3b8', fontWeight: i === 0 ? 800 : 400 }}>
                      {i === 0 ? '▶ ' : ''}{item.word}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#334155', fontSize: 8 }}>logit: {item.logit?.toFixed(1)}</span>
                      <span style={{ color: i === 0 ? '#f59e0b' : '#64748b' }}>{(item.p * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#1e293b', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.p * 100}%`,
                      background: i === 0 ? '#f59e0b' : '#00d4ff',
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    }} />
                    {/* Nucleus cutoff line */}
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
              ))}
            </div>

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
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <AttentionHeads tokens={tokens} activeTokenIndex={activeTokenIndex} />
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 7, padding: '2px 8px', border: `1px solid ${active ? color : '#1e293b'}`,
      background: active ? `${color}18` : 'none', color: active ? color : '#334155',
      borderRadius: 2, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
    }}>{label}</button>
  );
}

const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0f1e' };
const headerStyle = { padding: '7px 12px', background: '#0a0f1e', borderBottom: '1px solid #1e293b', fontSize: 10, color: '#f59e0b', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const contentStyle = { flex: 1, display: 'flex', padding: '10px 12px', gap: 12, overflow: 'hidden' };
const zoneStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minWidth: 0 };
const subLabel = { fontSize: 8, color: '#475569', fontWeight: 800, borderBottom: '1px solid #1e293b', paddingBottom: 4, cursor: 'help' };
const focusBox = { marginTop: 'auto', padding: '6px 8px', border: '1px dashed #1e293b', borderRadius: 3 };
const tempBox = { padding: '6px 8px', background: '#020617', borderRadius: 3, border: '1px solid #1e293b' };
const chosenBox = { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 3, border: '1px solid rgba(245,158,11,0.2)', marginTop: 6 };

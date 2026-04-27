import React from 'react';

export default function Stage3Softmax({ tokens = [], activeTokenIndex = -1, logits = [] }) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>STAGE_03 // SOFTMAX_DECISION_HUB</div>
      
      <div style={contentStyle}>
        {/* LEFT ZONE: ATTENTION HEATMAP */}
      <div style={zoneStyle}>
        <div style={subLabel}>ATTENTION_TRACE // LAYER_WEIGHTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {tokens.map((t, i) => {
            const isActive = i === activeTokenIndex;
            const attentionHeight = (t.weight * 100);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, fontSize: 8, color: isActive ? '#00ff9d' : '#64748b',
                  textAlign: 'right', fontFamily: 'monospace'
                }}>{t.word}</div>
          
                <div style={{ flex: 1, height: 12, background: '#1e293b', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: isActive ? '#00ff9d' : '#00d4ff',
                    width: `${attentionHeight}%`, opacity: isActive ? 1 : 0.3,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
          
                <div style={{ fontSize: 8, color: '#475569', width: 25 }}>
                  {t.weight.toFixed(2)}
                </div>
              </div>
            );
          })}
      </div>
    {/* NEW: Bottom Cluster detail */}
    <div style={{ marginTop: 'auto', padding: 10, border: '1px dashed #1e293b', borderRadius: 4 }}>
      <div style={{ fontSize: 7, color: '#475569', marginBottom: 4 }}>CURRENT_FOCUS_TOKEN</div>
      <div style={{ fontSize: 12, color: '#00ff9d', fontFamily: 'monospace' }}>
         {activeTokenIndex >= 0 ? tokens[activeTokenIndex].word : "NULL_IDLE"}
      </div>
    </div>
  </div>
        {/* RIGHT ZONE: TOP-K CANDIDATE RACE */}
        <div style={{ ...zoneStyle, borderLeft: '1px solid #1e293b', paddingLeft: 15 }}>
          <div style={subLabel}>CANDIDATE_LOGITS (TOP_K)</div>
          <div style={logitList}>
            {logits.length > 0 ? logits.map((l, i) => (
              <div key={i} style={logitRow}>
                <div style={logitInfo}>
                  <span style={{ color: i === 0 ? '#00ff9d' : '#f8fafc' }}>{l.word}</span>
                  <span style={{ opacity: 0.5 }}>{(l.p * 100).toFixed(1)}%</span>
                </div>
                <div style={barContainer}>
                  <div style={{ 
                    ...barStyle, 
                    width: `${l.p * 100}%`,
                    background: i === 0 ? '#00ff9d' : '#00d4ff' 
                  }} />
                </div>
              </div>
            )) : (
              <div style={emptyText}>AWAITING_INFERENCE...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' };
const headerStyle = { padding: '8px 12px', background: '#1e293b', fontSize: 10, color: '#00d4ff', fontWeight: 800 };
const contentStyle = { flex: 1, display: 'flex', padding: 12, gap: 15, overflow: 'hidden' };
const zoneStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' };
const subLabel = { fontSize: 8, color: '#64748b', fontWeight: 800, borderBottom: '1px solid #1e293b', paddingBottom: 4 };
const tokenGrid = { display: 'flex', flexWrap: 'wrap', gap: 4 };
const tokenStyle = { padding: '4px 8px', fontSize: 9, borderRadius: 2, border: '1px solid transparent', transition: 'all 0.2s' };
const logitList = { display: 'flex', flexDirection: 'column', gap: 12 };
const logitRow = { display: 'flex', flexDirection: 'column', gap: 4 };
const logitInfo = { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace' };
const barContainer = { height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' };
const barStyle = { height: '100%', transition: 'width 0.3s ease-out' };
const emptyText = { fontSize: 10, color: '#334155', fontStyle: 'italic', marginTop: 20 };

import React, { useMemo } from 'react';
import Tooltip from './Tooltip';

const HEAD_COUNT = 6;
const HEAD_COLORS = ['#00d4ff','#a855f7','#f59e0b','#00ff9d','#ff4d4d','#38bdf8'];

export default function AttentionHeads({ tokens = [], activeTokenIndex = -1 }) {
  const heads = useMemo(() => {
    return Array.from({ length: HEAD_COUNT }, (_, h) =>
      tokens.map((t, i) =>
        tokens.map((t2, j) => {
          // Each head attends differently: mix of weights + head-specific bias
          const base = (t.weight + t2.weight) / 2;
          const headBias = Math.sin((i + j + h * 1.7) * 0.9) * 0.3;
          return Math.max(0, Math.min(1, base + headBias));
        })
      )
    );
  }, [tokens]);

  if (tokens.length === 0) return null;

  const cellSize = Math.min(28, Math.floor(120 / tokens.length));

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Tooltip term="attention">
          <span style={headerLabel}>MULTI_HEAD_ATTENTION // {HEAD_COUNT} HEADS</span>
        </Tooltip>
        <span style={subLabel}>Each head learns different relationships</span>
      </div>
      <div style={headsGrid}>
        {heads.map((matrix, h) => (
          <div key={h} style={headCard}>
            <div style={{ ...headTitle, color: HEAD_COLORS[h] }}>H{h + 1}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tokens.length}, ${cellSize}px)`, gap: 1 }}>
              {matrix.map((row, i) =>
                row.map((val, j) => (
                  <div
                    key={`${i}-${j}`}
                    title={`${tokens[i]?.word} → ${tokens[j]?.word}: ${val.toFixed(2)}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: HEAD_COLORS[h],
                      opacity: val * 0.9 + 0.05,
                      borderRadius: 1,
                      transition: 'opacity 0.3s',
                      outline: (i === activeTokenIndex || j === activeTokenIndex)
                        ? `1px solid ${HEAD_COLORS[h]}` : 'none',
                    }}
                  />
                ))
              )}
            </div>
            <div style={headLabels}>
              {tokens.map((t, i) => (
                <div key={i} style={{ ...headTokenLabel, width: cellSize, color: i === activeTokenIndex ? HEAD_COLORS[h] : '#475569' }}>
                  {t.word.slice(0, 2)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={legendStyle}>
        <span style={{ color: '#334155', fontSize: 8 }}>LOW ATTN</span>
        <div style={legendBar} />
        <span style={{ color: '#94a3b8', fontSize: 8 }}>HIGH ATTN</span>
        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#334155' }}>hover cell = weight</span>
      </div>
    </div>
  );
}

const containerStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' };
const headerStyle = { display: 'flex', flexDirection: 'column', gap: 2 };
const headerLabel = { fontSize: 8, fontWeight: 800, color: '#64748b', letterSpacing: 1, borderBottom: '1px solid #1e293b', paddingBottom: 4, cursor: 'help' };
const subLabel = { fontSize: 7, color: '#334155' };
const headsGrid = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const headCard = { display: 'flex', flexDirection: 'column', gap: 3 };
const headTitle = { fontSize: 8, fontWeight: 800, letterSpacing: 1 };
const headLabels = { display: 'flex', gap: 1 };
const headTokenLabel = { fontSize: 6, textAlign: 'center', overflow: 'hidden', fontFamily: 'monospace' };
const legendStyle = { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 };
const legendBar = {
  flex: 1, height: 4, borderRadius: 2,
  background: 'linear-gradient(to right, rgba(0,212,255,0.05), rgba(0,212,255,0.9))',
};

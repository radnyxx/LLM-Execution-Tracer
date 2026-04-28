import React from 'react';

const STAGES = [
  { id: 'input',    label: 'PROMPT_INPUT',   color: '#64748b' },
  { id: 'tokenize', label: 'TOKENIZE',        color: '#00d4ff' },
  { id: 'embed',    label: 'EMBED',           color: '#a855f7' },
  { id: 'sample',   label: 'ATTN_SOFTMAX',   color: '#f59e0b' },
  { id: 'generate', label: 'GENERATE',        color: '#00ff9d' },
];

export default function PipelineBar({ activeStage, isProcessing }) {
  return (
    <div style={wrapStyle}>
      {STAGES.map((s, i) => {
        const isActive = s.id === activeStage;
        const isPast = STAGES.findIndex(x => x.id === activeStage) > i;
        return (
          <React.Fragment key={s.id}>
            <div style={{
              ...nodeStyle,
              color: isActive ? s.color : isPast ? s.color : '#334155',
              borderColor: isActive ? s.color : isPast ? s.color : '#1e293b',
              background: isActive ? `${s.color}18` : isPast ? `${s.color}0a` : 'transparent',
              boxShadow: isActive ? `0 0 12px ${s.color}40` : 'none',
              animation: isActive && isProcessing ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
            }}>
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1 }}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{
                ...arrowStyle,
                background: isPast ? '#334155' : '#1e293b',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const wrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  padding: '0 20px',
  height: '100%',
};

const nodeStyle = {
  padding: '3px 10px',
  border: '1px solid',
  borderRadius: 2,
  fontSize: 7,
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 800,
  letterSpacing: 1,
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
};

const arrowStyle = {
  width: 20,
  height: 1,
  flexShrink: 0,
  transition: 'background 0.3s',
};

import React from 'react';

export default function Stage3Softmax({ tokens = [], activeTokenIndex = -1 }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <div style={{ padding: '8px 12px', background: '#1e293b', fontSize: 10, color: '#00d4ff', fontWeight: 800, borderBottom: '1px solid #1e293b' }}>
        STAGE_03 // NEURAL_ATTENTION_TRACE
      </div>
      
      <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
          {tokens.map((t, i) => {
            const isActive = i === activeTokenIndex;
            // Calculate "Attention Heat" based on distance from the currently processed token
            const distance = activeTokenIndex === -1 ? 100 : Math.abs(i - activeTokenIndex);
            const heat = isActive ? 1 : Math.max(0.1, 0.8 - (distance * 0.2));

            return (
              <div key={i} style={{
                height: 45,
                background: isActive ? 'rgba(0, 255, 157, 0.25)' : `rgba(0, 212, 255, ${heat * 0.1})`,
                border: `1px solid ${isActive ? '#00ff9d' : '#1e293b'}`,
                borderRadius: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s ease',
                boxShadow: isActive ? '0 0 15px rgba(0, 255, 157, 0.15)' : 'none'
              }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: isActive ? '#00ff9d' : '#94a3b8' }}>
                  {t.word.toUpperCase()}
                </span>
                <div style={{ 
                  height: 2, width: '60%', background: isActive ? '#00ff9d' : '#334155', 
                  marginTop: 4, opacity: heat 
                }} />
              </div>
            );
          })}
        </div>
        {tokens.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
            INITIALIZE_TOKENS_TO_START_TRACE
          </div>
        )}
      </div>
    </div>
  );
}

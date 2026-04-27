import React from 'react';

export default function Stage3Softmax({ tokens = [], activeTokenIndex = 0 }) {
  // Simulating attention weights: Current token "attends" to previous ones
  const attentionMap = tokens.map((_, i) => ({
    weight: i <= activeTokenIndex ? Math.random() : 0,
    label: tokens[i]?.word
  }));

  return (
    <div style={{ height: '100%', background: 'var(--bg2)', padding: '12px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 900, marginBottom: 12 }}>
        S3 // CROSS_ATTENTION_WEIGHTS
      </div>
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '4px' }}>
        {attentionMap.map((cell, i) => (
          <div key={i} style={{ 
            background: `rgba(0, 212, 255, ${cell.weight * 0.8})`, 
            border: '1px solid var(--border2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '50px', borderRadius: '2px', position: 'relative'
          }}>
            <span style={{ fontSize: '8px', color: cell.weight > 0.4 ? '#000' : 'var(--text1)', fontWeight: 800 }}>
              {cell.label}
            </span>
            <span style={{ fontSize: '7px', color: cell.weight > 0.4 ? 'rgba(0,0,0,0.5)' : 'var(--text3)' }}>
              {cell.weight.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '9px', color: 'var(--text3)', fontStyle: 'italic' }}>
        * Higher opacity indicates stronger neural focus on that token.
      </div>
    </div>
  );
}

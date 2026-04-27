import React from 'react'

export default function Sidebar({ 
  promptInput, 
  setPromptInput, 
  onSubmit, 
  onOpenSchema, 
  temperature, 
  setTemperature 
}) {
  return (
    <div style={{ 
      width: 280, 
      borderRight: '1px solid var(--border)', 
      padding: '20px 16px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24,
      background: 'var(--bg1)',
      flexShrink: 0
    }}>
      {/* SECTION 1: PROMPT INPUT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 12, background: 'var(--blue)' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', letterSpacing: '0.05em' }}>
            INPUT_SEQUENCE
          </span>
        </div>
        
        <textarea 
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Enter a prompt to tokenize..."
          style={{ 
            width: '100%', 
            height: 100, 
            background: 'var(--bg4)', 
            border: '1px solid var(--border2)', 
            borderRadius: 4,
            color: 'var(--green)',
            padding: '12px',
            fontSize: 11,
            fontFamily: 'var(--font)',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <button 
          onClick={() => onSubmit(promptInput)}
          style={{ 
            width: '100%',
            background: 'var(--blue)',
            color: '#000',
            border: 'none',
            padding: '10px',
            borderRadius: 3,
            fontWeight: 800,
            fontSize: 10,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          Initialize Tokens
        </button>
      </div>

      {/* SECTION 2: PARAMETERS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 12, background: 'var(--text3)' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text1)', letterSpacing: '0.05em' }}>
            HYPERPARAMETERS
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
            <span>TEMPERATURE (RANDOMNESS)</span>
            <span style={{ color: 'var(--blue)' }}>{temperature.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0.1" max="2.0" step="0.01" 
            value={temperature} 
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* SECTION 3: ADVANCED ACCESS */}
      <div style={{ marginTop: 'auto' }}>
        <button 
          onClick={onOpenSchema}
          style={{ 
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--border2)',
            color: 'var(--text3)',
            padding: '8px',
            fontSize: 9,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            borderRadius: 2
          }}
        >
          [ OPEN_SCHEMA_MODAL ]
        </button>
        <div style={{ fontSize: 8, color: 'var(--border2)', textAlign: 'center', marginTop: 10 }}>
          BUILD_VER: 2026.4.27 // STABLE
        </div>
      </div>
    </div>
  )
}

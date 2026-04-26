import React from 'react'

export default function Sidebar({ jsonText, setJsonText, onApply, parseError }) {
  return (
    <aside style={{
      width: 248,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--text3)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span>JSON Sandbox</span>
        {parseError
          ? <span style={{ color: 'var(--red)', fontSize: 9 }}>✕ error</span>
          : <span style={{ color: 'var(--green)', fontSize: 9 }}>✓ valid</span>
        }
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
            aria-label="JSON Schema Editor"
            style={{
              width: '100%',
              minHeight: 400,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#7dd3fc',
              fontFamily: 'var(--font)',
              fontSize: 10,
              lineHeight: 1.65,
              resize: 'none',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
          // edit schema → live update
        </div>
        <button
          onClick={onApply}
          style={{
            width: '100%',
            padding: '6px 0',
            background: 'var(--blue3)',
            border: '1px solid var(--blue)',
            color: 'var(--blue)',
            fontFamily: 'var(--font)',
            fontSize: 10,
            borderRadius: 3,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(0,212,255,0.2)'}
          onMouseLeave={e => e.target.style.background = 'var(--blue3)'}
        >
          ▶ APPLY SCHEMA
        </button>
        {parseError && (
          <div style={{ color: 'var(--red)', fontSize: 9, marginTop: 4, wordBreak: 'break-word' }}>
            {parseError}
          </div>
        )}
      </div>
    </aside>
  )
}

import React, { useState, useRef } from 'react'

export default function Stage2Vectors({ vectors }) {
  const [rotate, setRotate] = useState({ x: 25, y: -15 })
  const containerRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Sensitivity adjustment for rotation
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 50
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -50
    setRotate({ x, y })
  }

  const keys = Object.keys(vectors)
  const colors = ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b']

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>2</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Neural Perspective Plot
        </span>
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setRotate({ x: 25, y: -15 })}
        style={{ 
          height: 280, 
          position: 'relative', 
          perspective: '1200px', 
          background: '#000',
          overflow: 'hidden',
          cursor: 'none'
        }}
      >
        {/* The Grid "Floor" */}
        <div style={{
          position: 'absolute', width: '300%', height: '300%',
          top: '-100%', left: '-100%',
          backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `rotateX(75deg) rotateZ(${rotate.y * 0.5}deg) translateZ(-100px)`,
          opacity: 0.2,
          pointerEvents: 'none'
        }} />

        {/* Vector Space Container */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s ease-out'
        }}>
          {keys.map((k, i) => {
            const v = vectors[k] || [0, 0, 0]
            const col = colors[i % colors.length]
            
            // Mapping values to visual space
            const tx = v[0] * 120 + 200 
            const ty = v[1] * 120 + 140
            const tz = (v[2] || 0) * 80

            return (
              <div key={k} style={{
                position: 'absolute',
                left: tx, top: ty,
                transform: `translateZ(${tz}px)`,
                transformStyle: 'preserve-3d'
              }}>
                {/* Vertical Stem connecting point to "ground" */}
                <div style={{
                  position: 'absolute', width: 1, height: 200,
                  background: `linear-gradient(to top, ${col}, transparent)`,
                  transform: 'rotateX(-90deg)',
                  transformOrigin: 'top',
                  opacity: 0.3
                }} />
                
                {/* The Point (Glow Effect) */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: col, 
                  boxShadow: `0 0 15px ${col}`,
                  transform: 'translate(-50%, -50%)',
                  border: '1px solid white'
                }} />

                {/* Tag */}
                <div style={{
                  position: 'absolute', left: 12, top: -5,
                  fontSize: 10, color: '#fff', whiteSpace: 'nowrap',
                  fontFamily: 'JetBrains Mono',
                  textShadow: '0 0 5px #000',
                  pointerEvents: 'none'
                }}>
                  {k} <span style={{ color: 'var(--text3)', fontSize: 8 }}>[{v[0]}, {v[1]}, {v[2] || 0}]</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Origin Marker */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 4, height: 4, background: '#334155', borderRadius: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
        
        <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 9, color: 'var(--blue)', opacity: 0.6, letterSpacing: '0.1em' }}>
          LIVE_VIEW // INTERACTIVE_SCAN
        </div>
      </div>
    </div>
  )
}

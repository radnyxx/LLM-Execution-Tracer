import React, { useState, useRef, useEffect } from 'react'

export default function Stage2Vectors({ vectors }) {
  const [rotate, setRotate] = useState({ x: 20, y: -20 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    setIsDragging(true)
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - lastMousePos.current.x
      const deltaY = e.clientY - lastMousePos.current.y
      
      setRotate(prev => ({
        x: prev.x - deltaY * 0.5,
        y: prev.y + deltaX * 0.5
      }))
      
      lastMousePos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const keys = Object.keys(vectors)
  const colors = ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b']

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>2</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Grounded Vector Space
        </span>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        style={{ 
          height: 320, 
          position: 'relative', 
          perspective: '1000px', 
          background: '#050505',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `translateZ(-100px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}>
          
          {/* Axis Lines (X, Y, Z) */}
          {/* X-Axis (Red) */}
          <div style={{ position: 'absolute', width: 400, height: 1, background: 'rgba(255,0,0,0.3)', left: '50%', top: '50%', transform: 'translateX(-50%)' }} />
          {/* Y-Axis (Green) */}
          <div style={{ position: 'absolute', width: 1, height: 400, background: 'rgba(0,255,0,0.3)', left: '50%', top: '50%', transform: 'translateY(-50%)' }} />
          {/* Z-Axis (Blue) */}
          <div style={{ position: 'absolute', width: 1, height: 400, background: 'rgba(0,100,255,0.5)', left: '50%', top: '50%', transform: 'translateY(-50%) rotateX(90deg)' }} />

          {/* Floor Grid */}
          <div style={{
            position: 'absolute', width: 400, height: 400,
            left: '50%', top: '50%',
            marginLeft: -200, marginTop: -200,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'rotateX(90deg) translateZ(-1px)',
          }} />

          {/* Points & Stems */}
          {keys.map((k, i) => {
            const [vx, vy, vz] = vectors[k] || [0, 0, 0]
            const col = colors[i % colors.length]
            const tx = vx * 150 + 200 // Centered
            const ty = vy * 150 + 200
            const tz = (vz || 0) * 100

            return (
              <div key={k} style={{
                position: 'absolute', left: 0, top: 0,
                transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px)`,
                transformStyle: 'preserve-3d'
              }}>
                {/* Stem to floor */}
                <div style={{
                  position: 'absolute', width: 1, height: tz,
                  background: `linear-gradient(to top, transparent, ${col})`,
                  bottom: 0, transform: 'rotateX(-90deg)', transformOrigin: 'bottom',
                  opacity: 0.4
                }} />
                
                {/* Point */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: col,
                  boxShadow: `0 0 12px ${col}`, transform: 'translate(-50%, -50%)'
                }} />

                {/* Label (Billboard effect - roughly stays facing front) */}
                <div style={{
                  position: 'absolute', left: 10, top: -5,
                  fontSize: 10, color: '#fff', whiteSpace: 'nowrap',
                  fontFamily: 'JetBrains Mono', transform: `rotateY(${-rotate.y}deg) rotateX(${-rotate.x}deg)`
                }}>{k}</div>
              </div>
            )
          })}
        </div>
        
        <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 8, color: '#475569', letterSpacing: '0.1em' }}>
          CLICK + DRAG TO ROTATE // SCROLL TO ZOOM SIMULATED
        </div>
      </div>
    </div>
  )
}

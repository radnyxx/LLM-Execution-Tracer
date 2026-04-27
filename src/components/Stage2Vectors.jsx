import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, Html, Float, Stars, PerspectiveCamera } from '@react-three/drei'

// Sub-component for individual vector points
function VectorPoint({ position, word, active }) {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere args={[0.07, 16, 16]} position={position}>
        <meshStandardMaterial 
          color={active ? "var(--blue)" : "#475569"} 
          emissive={active ? "var(--blue)" : "#000"}
          emissiveIntensity={active ? 1.5 : 0}
          toneMapped={false}
        />
        <Html distanceFactor={10} position={[0.12, 0, 0]}>
          <div style={{
            color: active ? 'var(--blue)' : '#94a3b8',
            fontSize: '9px',
            fontFamily: 'var(--font)',
            whiteSpace: 'nowrap',
            padding: '2px 6px',
            background: 'rgba(2, 6, 23, 0.8)',
            border: `1px solid ${active ? 'var(--blue)' : '#1e293b'}`,
            borderRadius: '3px',
            pointerEvents: 'none',
          }}>
            {word}
          </div>
        </Html>
      </Sphere>
    </Float>
  )
}

export default function Stage2Vectors({ vectors = {}, tokens = [] }) {
  const activeWords = useMemo(() => tokens.map(t => t.word), [tokens]);

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>2</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Vector Embedding Space (High-Dim)
        </span>
      </div>

      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Vector Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {tokens.map((t, i) => {
            const vec = vectors[t.word] || [0.00, 0.00, 0.00];
            return (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '4px 8px', background: 'var(--bg4)', borderRadius: 2, border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 10, color: 'var(--text1)' }}>{t.word}</span>
                <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'monospace' }}>
                  [{vec.map(v => v.toFixed(2)).join(', ')}]
                </span>
              </div>
            );
          })}
        </div>

        {/* 3D PROJECTION BOX */}
        <div style={{ 
          height: 250, // Fixed height is safer for Wayland
          minHeight: 250,
          background: '#000', 
          borderRadius: 4, 
          position: 'relative', 
          border: '1px solid var(--border2)',
          overflow: 'hidden' 
        }}>
          <Suspense fallback={<div style={{ color: 'var(--text3)', fontSize: 10, padding: 20 }}>Booting Neural Space...</div>}>
            <Canvas dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={40} />
              <color attach="background" args={['#020617']} />
              <ambientLight intensity={0.8} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
              
              {Object.entries(vectors).map(([word, coords]) => (
                <VectorPoint 
                  key={word} 
                  position={coords} 
                  word={word} 
                  active={activeWords.includes(word)} 
                />
              ))}

              <OrbitControls 
                enableZoom={true} 
                autoRotate={!activeWords.length} 
                autoRotateSpeed={0.5} 
                makeDefault
              />
              <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -1, 0]} />
            </Canvas>
          </Suspense>
          
          <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 8, color: 'var(--blue)', pointerEvents: 'none', opacity: 0.7 }}>
            [ 3D_PROJECTION_ACTIVE ]
          </div>
        </div>
      </div>
    </div>
  )
}

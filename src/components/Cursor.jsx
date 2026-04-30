import { useEffect, useRef, useState } from 'react';

/**
 * Cursor — replaces the native cursor with a smooth dark pill that:
 *  - Lags behind the real pointer using lerp (configurable speed)
 *  - Morphs into a wider pill + shows a label when hovering buttons/interactive elements
 *  - Shows a tiny sharp dot exactly at the real pointer position
 *  - Hides itself when the mouse leaves the window
 */
export default function Cursor() {
  const pillRef    = useRef(null);
  const dotRef     = useRef(null);
  const rafRef     = useRef(null);

  // Real mouse position (updated instantly)
  const mouse  = useRef({ x: -200, y: -200 });
  // Lerped pill position
  const lerped = useRef({ x: -200, y: -200 });

  const [visible,  setVisible]  = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label,    setLabel]    = useState('');

  useEffect(() => {
    const SPEED = 0.10; // lower = more lag (0.06–0.14 feels best)

    /* ── Track real mouse ── */
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Snap dot immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      // Detect hoverable targets
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const isInteractive = el.closest(
          'button, a, input, textarea, select, [role="button"], [tabindex], label'
        );
        if (isInteractive) {
          setHovering(true);
          // Pull a short label from data-cursor, aria-label, title, or inner text
          const target = isInteractive;
          const hint =
            target.dataset?.cursor ||
            target.getAttribute('aria-label') ||
            target.getAttribute('title') ||
            (target.innerText?.trim().slice(0, 18)) ||
            '';
          setLabel(hint);
        } else {
          setHovering(false);
          setLabel('');
        }
      }
    };

    const onLeave  = () => setVisible(false);
    const onEnter  = () => setVisible(true);

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    /* ── RAF lerp loop for pill ── */
    const loop = () => {
      lerped.current.x += (mouse.current.x - lerped.current.x) * SPEED;
      lerped.current.y += (mouse.current.y - lerped.current.y) * SPEED;

      if (pillRef.current) {
        pillRef.current.style.transform =
          `translate(${lerped.current.x}px, ${lerped.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);  // visible intentionally excluded — we only want the effect once

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Sharp dot — sits exactly on pointer */}
      <div
        ref={dotRef}
        style={{
          ...baseStyle,
          width:  5,
          height: 5,
          borderRadius: '50%',
          background: '#f8fafc',
          marginLeft: -2.5,
          marginTop:  -2.5,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s',
          // no lag — transform is set directly in onMove
          transform: 'translate(-200px, -200px)',
        }}
      />

      {/* Lagging pill */}
      <div
        ref={pillRef}
        style={{
          ...baseStyle,
          // Pill dimensions — expand when hovering
          width:        hovering ? 'auto'  : 32,
          minWidth:     hovering ? 56      : 32,
          maxWidth:     180,
          height:       hovering ? 28      : 32,
          borderRadius: hovering ? 20      : 20,
          paddingLeft:  hovering ? 12      : 0,
          paddingRight: hovering ? 12      : 0,

          // Centering offset
          marginLeft: hovering ? undefined : -16,
          marginTop:  hovering ? undefined : -16,
          // When pill is pill-shaped, manually offset based on its variable width
          // We use translate(-50%, -50%) instead
          transform: `translate(-200px, -200px) translate(-50%, -50%)`,

          // Appearance
          background:  hovering
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(15, 23, 42, 0.85)',
          border: `1px solid ${hovering ? 'rgba(248,250,252,0.25)' : 'rgba(248,250,252,0.12)'}`,
          boxShadow: hovering
            ? '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',

          // Text inside pill
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'rgba(248,250,252,0.85)',
          fontSize:        10,
          fontFamily:     'JetBrains Mono, monospace',
          fontWeight:      500,
          letterSpacing:   0.3,
          whiteSpace:     'nowrap',
          overflow:       'hidden',

          opacity: visible ? 1 : 0,

          // All transitions except transform (transform is set in RAF)
          transition: [
            'width 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            'min-width 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            'height 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            'padding 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            'background 0.2s ease',
            'border-color 0.2s ease',
            'box-shadow 0.2s ease',
            'opacity 0.2s ease',
          ].join(', '),
        }}
      >
        {hovering && label && (
          <span style={{
            opacity:    1,
            animation: 'cursor-label-in 0.15s ease forwards',
            maxWidth:   160,
            overflow:   'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </span>
        )}
        {/* Inner dot shown when not hovering */}
        {!hovering && (
          <span style={{
            width:        4,
            height:       4,
            borderRadius: '50%',
            background:   'rgba(248,250,252,0.5)',
            flexShrink:   0,
          }} />
        )}
      </div>
    </>
  );
}

const baseStyle = {
  position:      'fixed',
  top:           0,
  left:          0,
  pointerEvents: 'none',
  zIndex:        99999,
  willChange:    'transform',
};

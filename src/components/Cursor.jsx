import { useEffect, useRef, useState } from 'react';

/**
 * Cursor
 * - Sharp 5px white dot snapping instantly to pointer via style.transform
 * - Dark pill lagging behind via rAF lerp at speed 0.10
 * - Pill morphs wider with spring easing on button/interactive hover
 * - Label pulled from data-cursor > aria-label > title > innerText
 * - Hides when mouse leaves window
 */
export default function Cursor() {
  const pillRef = useRef(null);
  const dotRef  = useRef(null);
  const rafRef  = useRef(null);

  const mouse  = useRef({ x: -200, y: -200 });
  const lerped = useRef({ x: -200, y: -200 });

  const [visible,  setVisible]  = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label,    setLabel]    = useState('');

  useEffect(() => {
    const SPEED = 0.10;

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Dot snaps instantly — direct DOM write, zero React overhead
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      // Detect interactive targets
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest(
        'button, a, input, textarea, select, [role="button"], [tabindex], label'
      );

      if (target) {
        setHovering(true);
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
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    // rAF lerp loop — drives pill position only
    const loop = () => {
      lerped.current.x += (mouse.current.x - lerped.current.x) * SPEED;
      lerped.current.y += (mouse.current.y - lerped.current.y) * SPEED;

      if (pillRef.current) {
        pillRef.current.style.transform =
          `translate(${lerped.current.x}px, ${lerped.current.y}px) translate(-50%, -50%)`;
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
  }, []);

  return (
    <>
      {/* Sharp dot — exact pointer, zero lag */}
      <div
        ref={dotRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         5,
          height:        5,
          borderRadius:  '50%',
          background:    '#ffffff',
          pointerEvents: 'none',
          zIndex:        99999,
          willChange:    'transform',
          transform:     'translate(-200px, -200px)',
          marginLeft:    -2.5,
          marginTop:     -2.5,
          opacity:       visible ? 1 : 0,
          transition:    'opacity 0.2s ease',
        }}
      />

      {/* Lagging dark pill */}
      <div
        ref={pillRef}
        style={{
          position:       'fixed',
          top:            0,
          left:           0,
          pointerEvents:  'none',
          zIndex:         99998,
          willChange:     'transform',
          transform:      'translate(-200px, -200px) translate(-50%, -50%)',

          // Size — expands when hovering
          minWidth:       hovering ? 60  : 32,
          maxWidth:       200,
          width:          hovering ? 'auto' : 32,
          height:         hovering ? 28  : 32,
          borderRadius:   20,
          paddingLeft:    hovering ? 14  : 0,
          paddingRight:   hovering ? 14  : 0,

          // Appearance — opaque dark pill
          background:     'rgba(15, 23, 42, 0.92)',
          border:         `1px solid ${hovering ? 'rgba(248,250,252,0.2)' : 'rgba(248,250,252,0.1)'}`,
          boxShadow:      hovering
            ? '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6)'
            : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',

          // Text
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'rgba(248,250,252,0.85)',
          fontSize:       10,
          fontFamily:     'JetBrains Mono, monospace',
          fontWeight:     500,
          letterSpacing:  0.3,
          whiteSpace:     'nowrap',
          overflow:       'hidden',

          opacity: visible ? 1 : 0,

          // Transitions — spring easing for size, normal for appearance
          transition: [
            'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'min-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'padding 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'background 0.2s ease',
            'border-color 0.2s ease',
            'box-shadow 0.2s ease',
            'opacity 0.2s ease',
          ].join(', '),
        }}
      >
        {/* Label when hovering */}
        {hovering && label && (
          <span style={{
            display:      'block',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     180,
            animation:    'cursor-label-in 0.12s ease forwards',
          }}>
            {label}
          </span>
        )}

        {/* Inner dot when resting */}
        {!hovering && (
          <span style={{
            width:        4,
            height:       4,
            borderRadius: '50%',
            background:   'rgba(248,250,252,0.45)',
            flexShrink:   0,
          }} />
        )}
      </div>
    </>
  );
}

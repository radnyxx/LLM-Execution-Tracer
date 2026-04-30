import { useEffect, useRef, useState } from 'react';

/**
 * Cursor
 * - Tiny white dot that snaps exactly to pointer
 * - Larger outlined circle that lags behind (lerp)
 * - The circle blurs whatever is underneath it via backdrop-filter
 * - Grows smoothly when hovering buttons / interactive elements
 * - Hides when mouse leaves window
 */
export default function Cursor() {
  const circleRef = useRef(null);
  const dotRef    = useRef(null);
  const rafRef    = useRef(null);

  const mouse  = useRef({ x: -200, y: -200 });
  const lerped = useRef({ x: -200, y: -200 });

  const [visible,  setVisible]  = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const SPEED = 0.08; // lag amount — lower = more lag

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Dot snaps instantly — set via style directly, no React re-render
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top  = e.clientY + 'px';
      }

      // Detect interactive elements
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = el?.closest(
        'button, a, input, textarea, select, [role="button"], [tabindex], label'
      );
      setHovering(!!isInteractive);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    // RAF lerp loop — only drives the circle position
    const loop = () => {
      lerped.current.x += (mouse.current.x - lerped.current.x) * SPEED;
      lerped.current.y += (mouse.current.y - lerped.current.y) * SPEED;

      if (circleRef.current) {
        circleRef.current.style.left = lerped.current.x + 'px';
        circleRef.current.style.top  = lerped.current.y + 'px';
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

  const circleSize = hovering ? 72 : 36;

  return (
    <>
      {/* Sharp white dot — exact pointer position */}
      <div
        ref={dotRef}
        style={{
          position:      'fixed',
          pointerEvents: 'none',
          zIndex:        99999,
          willChange:    'left, top',
          width:         6,
          height:        6,
          borderRadius:  '50%',
          background:    '#ffffff',
          transform:     'translate(-50%, -50%)',
          opacity:       visible ? 1 : 0,
          transition:    'opacity 0.2s ease',
          top:           -200,
          left:          -200,
        }}
      />

      {/* Lagging outlined circle — blurs content underneath */}
      <div
        ref={circleRef}
        style={{
          position:       'fixed',
          pointerEvents:  'none',
          zIndex:         99998,
          willChange:     'left, top, width, height',

          width:          circleSize,
          height:         circleSize,
          borderRadius:   '50%',
          transform:      'translate(-50%, -50%)',

          // The blur effect — blurs whatever is behind the circle
          backdropFilter: hovering ? 'blur(3px)' : 'blur(2px)',
          WebkitBackdropFilter: hovering ? 'blur(3px)' : 'blur(2px)',

          // Outlined circle — no fill, just a border
          background:     'transparent',
          border:         '1px solid rgba(255, 255, 255, 0.35)',

          opacity:        visible ? 1 : 0,

          transition: [
            'width 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'backdrop-filter 0.3s ease',
            'opacity 0.2s ease',
            'border-color 0.3s ease',
          ].join(', '),

          top:  -200,
          left: -200,
        }}
      />
    </>
  );
}

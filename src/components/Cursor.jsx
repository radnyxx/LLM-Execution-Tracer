import { useEffect, useRef, useState } from 'react';

/**
 * Cursor
 * - Sharp 5px white dot snapping instantly to pointer
 * - Dark pill lagging behind via rAF lerp at 0.10 speed
 * - Over plain text: pill shrinks to a minimal 12px dot — nothing gets covered
 * - Over buttons/links: pill expands with label and spring bounce
 * - Over inputs: pill shows a text cursor indicator
 */
export default function Cursor() {
  const pillRef = useRef(null);
  const dotRef  = useRef(null);
  const rafRef  = useRef(null);

  const mouse  = useRef({ x: -200, y: -200 });
  const lerped = useRef({ x: -200, y: -200 });

  const [visible, setVisible] = useState(false);
  // mode: 'default' | 'interactive' | 'text'
  const [mode,  setMode]  = useState('default');
  const [label, setLabel] = useState('');

  useEffect(() => {
    const SPEED = 0.10;

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Dot — direct DOM write, zero React overhead
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const interactive = el.closest(
        'button, a, [role="button"], [tabindex]:not([tabindex="-1"]), label, select'
      );
      const inputEl = el.closest('input, textarea');
      const isText  = !interactive && !inputEl && isTextNode(el);

      if (interactive) {
        const hint =
          interactive.dataset?.cursor ||
          interactive.getAttribute('aria-label') ||
          interactive.getAttribute('title') ||
          (interactive.innerText?.trim().slice(0, 22)) ||
          '';
        setMode('interactive');
        setLabel(hint);
      } else if (inputEl) {
        setMode('text');
        setLabel('');
      } else if (isText) {
        setMode('text');
        setLabel('');
      } else {
        setMode('default');
        setLabel('');
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    // rAF lerp — pill only
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

  // Pill dimensions per mode
  const pillSize = {
    default:     { w: 32,   h: 32,  pl: 0,  pr: 0  },
    interactive: { w: 'auto', h: 28, pl: 14, pr: 14 },
    text:        { w: 12,   h: 12,  pl: 0,  pr: 0  },
  }[mode];

  const pillOpacity = {
    default:     0.92,
    interactive: 0.95,
    text:        0.5,   // very subtle over text
  }[mode];

  const borderColor = {
    default:     'rgba(248,250,252,0.10)',
    interactive: 'rgba(248,250,252,0.22)',
    text:        'rgba(248,250,252,0.20)',
  }[mode];

  return (
    <>
      {/* Sharp dot */}
      <div
        ref={dotRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         5,
          height:        5,
          marginLeft:    -2.5,
          marginTop:     -2.5,
          borderRadius:  '50%',
          background:    '#ffffff',
          pointerEvents: 'none',
          zIndex:        99999,
          willChange:    'transform',
          transform:     'translate(-200px, -200px)',
          opacity:       visible ? 1 : 0,
          transition:    'opacity 0.2s ease',
          // Hide dot when pill is tiny over text — dot alone is enough
          ...(mode === 'text' ? { opacity: visible ? 1 : 0 } : {}),
        }}
      />

      {/* Lagging pill */}
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

          minWidth:    mode === 'interactive' ? 60  : pillSize.w,
          maxWidth:    220,
          width:       pillSize.w,
          height:      pillSize.h,
          borderRadius: 20,
          paddingLeft:  pillSize.pl,
          paddingRight: pillSize.pr,

          background:     `rgba(15, 23, 42, ${pillOpacity})`,
          border:         `1px solid ${borderColor}`,
          boxShadow:      mode === 'interactive'
            ? '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6)'
            : mode === 'text'
            ? 'none'
            : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.5)',
          backdropFilter: mode === 'text' ? 'none' : 'blur(8px)',

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

          transition: [
            'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'min-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'padding 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            'background 0.2s ease',
            'border-color 0.2s ease',
            'box-shadow 0.2s ease',
            'backdrop-filter 0.2s ease',
            'opacity 0.2s ease',
          ].join(', '),
        }}
      >
        {/* Label — interactive mode only */}
        {mode === 'interactive' && label && (
          <span style={{
            display:      'block',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     200,
            animation:    'cursor-label-in 0.12s ease forwards',
          }}>
            {label}
          </span>
        )}

        {/* Inner dot — default resting mode */}
        {mode === 'default' && (
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Returns true if the element contains or is a visible text node.
 * Used to detect when the cursor is over readable content.
 */
function isTextNode(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  // Structural/container tags — not "text" per se
  if (['div', 'section', 'main', 'aside', 'nav', 'header', 'footer',
       'canvas', 'svg', 'img', 'video'].includes(tag)) {
    // Only count as text if it has direct visible text content
    const directText = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim())
      .join('');
    return directText.length > 0;
  }
  // Semantic text tags
  if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
       'li', 'td', 'th', 'dt', 'dd', 'code', 'pre',
       'blockquote', 'em', 'strong', 'small'].includes(tag)) {
    return true;
  }
  return false;
}

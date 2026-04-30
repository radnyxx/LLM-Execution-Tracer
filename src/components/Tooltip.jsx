import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export const GLOSSARY = {
  entropy:     "Entropy measures unpredictability. High entropy = the model is uncertain which token comes next. Low entropy = model is confident.",
  attention:   "Attention tells the model which words to 'focus on' when processing each token. Higher weight = more important.",
  softmax:     "Softmax converts raw scores (logits) into probabilities that sum to 1.0. Higher temp = flatter distribution = more randomness.",
  logits:      "Raw unnormalized scores the model assigns to each possible next token before softmax is applied.",
  temperature: "Controls randomness. Low temp (0.1) = deterministic/repetitive. High temp (1.5+) = creative/unpredictable.",
  bpe:         "Byte-Pair Encoding splits rare words into subword pieces. 'thinker' → ['think','er']. Helps the model handle unknown words.",
  embedding:   "A high-dimensional vector (list of numbers) that represents a word's meaning. Similar words cluster together in this space.",
  cosine:      "Cosine similarity measures how similar two vectors are. 1.0 = identical direction, 0 = unrelated, -1 = opposite.",
  kvCache:     "Key-Value Cache stores intermediate computations so the model doesn't recompute past tokens on every step. Speeds up generation.",
  topK:        "Top-K sampling: only consider the K most likely next tokens. Prevents very unlikely tokens from being chosen.",
  nucleus:     "Top-P (nucleus) sampling: choose from the smallest set of tokens whose cumulative probability exceeds P.",
  layer:       "A transformer layer applies attention + feed-forward operations. More layers = deeper reasoning capability.",
};

const TOOLTIP_WIDTH  = 220;
const TOOLTIP_OFFSET = 10; // gap between trigger and tooltip box

export default function Tooltip({ term, children, label }) {
  const tip        = GLOSSARY[term] || label || '';
  const triggerRef = useRef(null);
  const [pos, setPos] = useState(null); // { x, y, dir } — dir: 'up' | 'down'

  const show = useCallback(() => {
    if (!tip || !triggerRef.current) return;
    const rect   = triggerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dir    = spaceAbove >= 80 || spaceAbove > spaceBelow ? 'up' : 'down';

    // Horizontal: centre on trigger, clamp to viewport
    let x = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - TOOLTIP_WIDTH - 8));

    const y = dir === 'up'
      ? rect.top  - TOOLTIP_OFFSET          // tooltip bottom anchors here
      : rect.bottom + TOOLTIP_OFFSET;       // tooltip top anchors here

    setPos({ x, y, dir });
  }, [tip]);

  const hide = useCallback(() => setPos(null), []);

  if (!tip) return <>{children}</>;

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </span>

      {pos && createPortal(
        <div style={{
          position:   'fixed',
          left:        pos.x,
          // anchor top or bottom edge depending on direction
          ...(pos.dir === 'up'
            ? { bottom: window.innerHeight - pos.y }
            : { top: pos.y }
          ),
          width:        TOOLTIP_WIDTH,
          background:  '#0f172a',
          border:      '1px solid #00d4ff',
          color:       '#94a3b8',
          fontSize:     9,
          padding:     '6px 10px',
          borderRadius: 4,
          lineHeight:   1.5,
          pointerEvents:'none',
          zIndex:       999999,
          boxShadow:   '0 0 20px rgba(0,212,255,0.15)',
          fontFamily:  'JetBrains Mono, monospace',
          whiteSpace:  'normal',
          wordBreak:   'break-word',
        }}>
          {tip}
        </div>,
        document.body
      )}
    </>
  );
}

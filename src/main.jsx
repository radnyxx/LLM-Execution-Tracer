import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/*
 * Global font size normalizer — applies to ALL browsers including Firefox.
 *
 * The dashboard was designed at very small px values (7–11px) which look
 * fine on a high-DPI display at 125–150% zoom but become unreadable at
 * 100% zoom on any browser. Rather than hunting down every inline style,
 * we intercept React.createElement and apply a uniform scale to every
 * fontSize prop before it hits the DOM.
 *
 * Scale table:
 *   7px  →  11px
 *   8px  →  11.5px
 *   9px  →  12px
 *  10px  →  13px
 *  11px  →  13.5px
 *  12px  →  14px
 *  13px+ →  unchanged  (headers/output text are already fine)
 */
const SCALE_BELOW = 13;   // only touch sizes below this
const SCALE_MIN   = 11;   // never render below this
const SCALE_RATIO = 1.35; // multiply by this — tune up/down to taste

const _createElement = React.createElement;
React.createElement = function(type, props, ...children) {
  if (props?.style?.fontSize !== undefined) {
    const raw = props.style.fontSize;
    const px  = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!isNaN(px) && px < SCALE_BELOW) {
      const scaled = Math.max(SCALE_MIN, Math.round(px * SCALE_RATIO * 2) / 2);
      props = { ...props, style: { ...props.style, fontSize: scaled } };
    }
  }
  return _createElement.call(this, type, props, ...children);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

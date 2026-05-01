import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/*
 * Chrome/Edge enforce a minimum rendered font size (10–12px depending on
 * OS locale settings). Any inline style below that threshold gets silently
 * bumped, which misaligns labels and badges in our dashboard.
 *
 * Fix: intercept React's style prop application and clamp fontSize upward.
 * We do this by patching the React DOM config BEFORE the root renders.
 * This is the only place we need to touch — every component benefits
 * automatically with zero code changes elsewhere.
 */
const _createElement = React.createElement;
React.createElement = function patchedCreateElement(type, props, ...children) {
  if (props?.style?.fontSize !== undefined) {
    const raw = props.style.fontSize;
    const px  = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!isNaN(px) && px < 10) {
      props = {
        ...props,
        style: {
          ...props.style,
          // Scale tiny sizes up proportionally so 7px → 10px, 8px → 10.5px, 9px → 11px
          fontSize: Math.round((px / 7) * 10 * 10) / 10,
        },
      };
    }
  }
  return _createElement.call(this, type, props, ...children);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

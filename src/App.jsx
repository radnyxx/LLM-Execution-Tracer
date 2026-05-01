import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cursor from './components/Cursor';
import Sidebar from './components/Sidebar';
import Stage1Tokenization from './components/Stage1Tokenization';
import Stage2Vectors from './components/Stage2Vectors';
import Stage3Softmax from './components/Stage3Softmax';
import Stage4Generation from './components/Stage4Generation';
import SchemaModal from './components/SchemaModal';
import PipelineBar from './components/PipelineBar';
import CausalityStrip from './components/CausalityStrip';
import { DEFAULT_SCHEMA, bpeSplit } from './schema';
import './index.css';

/*
 * TOUR_STEPS — each step declares:
 *   title       : string   — monospace header shown in tooltip
 *   body        : string   — explanation text
 *   targetId    : string   — id on the DOM element to spotlight + anchor tooltip to
 *   position    : 'top'|'bottom'|'left'|'right'|'center'
 *                           — which side of the target the tooltip appears on
 *   highlight   : number   — stage box index to glow (0-3), or -1
 *   action      : string?  — optional side-effect key handled in App
 */
const TOUR_STEPS = [
  {
    title:     'STEP 1 // PROMPT INPUT',
    body:      'Type any text here — a question, a sentence, a concept. Hit INITIALIZE_TOKENS or press Ctrl+Enter to push it through the pipeline. The token count below updates live as you type.',
    targetId:  'tour-sidebar-prompt',
    position:  'right',
    highlight: -1,
  },
  {
    title:     'STEP 2 // TEMPERATURE',
    body:      'Temperature controls how random the model\'s output is. Low (0.1) = deterministic and repetitive. High (1.5+) = creative but unpredictable. The mini bar chart updates in real time — watch the distribution flatten as you drag right.',
    targetId:  'tour-sidebar-temp',
    position:  'right',
    highlight: -1,
  },
  {
    title:     'STEP 3 // JSON SCHEMA EDITOR',
    body:      'Every single visualization on this dashboard is driven by one editable JSON object. Click VIEW_JSON_SCHEMA to open it. You can add tokens, change attention weights, move vectors in 3D space, and adjust softmax probabilities — all panels update instantly.',
    targetId:  'tour-sidebar-schema',
    position:  'right',
    highlight: -1,
    action:    'open-schema',
  },
  {
    title:     'STEP 4 // PIPELINE BAR',
    body:      'This bar at the top tracks the active stage as data flows through the model. Stages light up in sequence: PROMPT_INPUT → TOKENIZE → EMBED → ATTN_SOFTMAX → GENERATE. During inference the active node pulses.',
    targetId:  'tour-pipeline-bar',
    position:  'bottom',
    highlight: -1,
  },
  {
    title:     'STEP 5 // CAUSAL CHAIN',
    body:      'This strip connects all four stages with a "because → therefore" narrative. It shows which token dominated attention, where it lives in embedding space, which word it pushed to the top of softmax, and what the model generated — all in one line.',
    targetId:  'tour-causality-strip',
    position:  'bottom',
    highlight: -1,
  },
  {
    title:     'STEP 6 // TOKENIZATION',
    body:      'The tokenizer splits your prompt into sub-word pieces using Byte-Pair Encoding (BPE). Each token gets a vocabulary ID and an attention weight. Click any row to zero-out that token — Stage 3 will immediately show how the probability distribution shifts.',
    targetId:  'tour-stage1',
    position:  'right',
    highlight: 0,
  },
  {
    title:     'STEP 7 // EMBEDDING SPACE',
    body:      'Each token is projected into a 2D plane via t-SNE from a 4096-dimensional vector space. Tokens that share semantic meaning cluster together. The dashed purple lines show cosine similarity > 0.75. The amber diamond is the intent centroid — the weighted average of all token embeddings.',
    targetId:  'tour-stage2',
    position:  'left',
    highlight: 1,
  },
  {
    title:     'STEP 8 // SOFTMAX + MATH',
    body:      'The model converts raw logit scores into probabilities via softmax. Open the MATH tab to see the exact equation with your current temperature substituted in — P("Wisdom") = exp(3.2 / T) / Σ. Try the COMPARE tab to see T=0.2 vs T=1.5 side by side.',
    targetId:  'tour-stage3',
    position:  'right',
    highlight: 2,
  },
  {
    title:     'STEP 9 // AUTOREGRESSIVE GENERATION',
    body:      'Click RUN_INFERENCE to stream real output from Llama-3.1-8B. The model generates one token per forward pass, each word\'s brightness showing its probability. The KV_CACHE tab shows key-value memory being written — this is what makes generation O(n) instead of O(n²).',
    targetId:  'tour-stage4',
    position:  'left',
    highlight: 3,
  },
];

/* ─── Spotlight + positional tooltip ─────────────────────────────────────── */

function TourOverlay({ step, stepIndex, total, onNext, onClose, isModalOpen, onOpenSchema }) {
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!step) return;

    // Close schema modal if this step doesn't need it open
    const measure = () => {
      const el = document.getElementById(step.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    // Re-measure after layout settles (e.g. modal opening)
    const t = setTimeout(measure, 120);
    return () => clearTimeout(t);
  }, [step]);

  // Position tooltip relative to spotlight rect
  useEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const tt   = tooltipRef.current.getBoundingClientRect();
    const GAP  = 16;
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    let top, left;

    switch (step.position) {
      case 'right':
        top  = rect.top + rect.height / 2 - tt.height / 2;
        left = rect.left + rect.width + GAP;
        break;
      case 'left':
        top  = rect.top + rect.height / 2 - tt.height / 2;
        left = rect.left - tt.width - GAP;
        break;
      case 'bottom':
        top  = rect.top + rect.height + GAP;
        left = rect.left + rect.width / 2 - tt.width / 2;
        break;
      case 'top':
        top  = rect.top - tt.height - GAP;
        left = rect.left + rect.width / 2 - tt.width / 2;
        break;
      default: // center
        top  = vh / 2 - tt.height / 2;
        left = vw / 2 - tt.width / 2;
    }

    // Clamp to viewport
    top  = Math.max(8, Math.min(top,  vh - tt.height - 8));
    left = Math.max(8, Math.min(left, vw - tt.width  - 8));
    setTooltipPos({ top, left });
  }, [rect, step]);

  if (!step) return null;

  const PAD = 6; // spotlight padding

  return (
    <>
      {/* Dark overlay with cutout via box-shadow */}
      {rect && (
        <div style={{
          position:      'fixed',
          inset:         0,
          zIndex:        4000,
          pointerEvents: 'none',
        }}>
          {/* Top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rect.top - PAD, background: 'rgba(1,4,9,0.82)' }} />
          {/* Bottom */}
          <div style={{ position: 'absolute', top: rect.top + rect.height + PAD, left: 0, right: 0, bottom: 0, background: 'rgba(1,4,9,0.82)' }} />
          {/* Left */}
          <div style={{ position: 'absolute', top: rect.top - PAD, left: 0, width: rect.left - PAD, height: rect.height + PAD * 2, background: 'rgba(1,4,9,0.82)' }} />
          {/* Right */}
          <div style={{ position: 'absolute', top: rect.top - PAD, left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2, background: 'rgba(1,4,9,0.82)' }} />
          {/* Spotlight border */}
          <div style={{
            position:     'absolute',
            top:          rect.top    - PAD,
            left:         rect.left   - PAD,
            width:        rect.width  + PAD * 2,
            height:       rect.height + PAD * 2,
            border:       '1.5px solid rgba(168,85,247,0.7)',
            borderRadius: 6,
            boxShadow:    '0 0 24px rgba(168,85,247,0.25)',
            transition:   'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position:   'fixed',
          top:        tooltipPos.top,
          left:       tooltipPos.left,
          zIndex:     5000,
          width:      300,
          padding:    18,
          background: '#0a0f1e',
          border:     '1px solid rgba(168,85,247,0.55)',
          borderRadius: 6,
          boxShadow:  '0 0 40px rgba(168,85,247,0.2)',
          fontFamily: 'JetBrains Mono, monospace',
          transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width:        i === stepIndex ? 16 : 5,
              height:       5,
              borderRadius: 3,
              background:   i === stepIndex ? '#a855f7' : i < stepIndex ? '#334155' : '#1e293b',
              transition:   'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#a855f7', fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{step.title}</span>
          <span style={{ color: '#334155', fontSize: 8 }}>{stepIndex + 1} / {total}</span>
        </div>

        <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.65, marginBottom: 14 }}>{step.body}</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button onClick={onClose} style={tourBtnSecondary}>✕ EXIT</button>
          <button
            onClick={() => {
              if (step.action === 'open-schema') onOpenSchema();
              onNext();
            }}
            style={tourBtnPrimary}
          >
            {stepIndex >= total - 1 ? 'FINISH ✓' : 'NEXT →'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────────── */

export default function App() {
  const [schema,      setSchema]      = useState(DEFAULT_SCHEMA);
  const [temperature, setTemperature] = useState(0.7);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourStep,    setTourStep]    = useState(-1);
  const [activeStage, setActiveStage] = useState('input');

  const [ablatedIndex, setAblatedIndex] = useState(-1);
  const ablatedWeights = ablatedIndex >= 0
    ? schema.tokens.map((t, i) => (i === ablatedIndex ? 0 : t.weight))
    : [];

  const handleAblate = useCallback((i) => {
    setAblatedIndex(prev => (i === -1 || prev === i) ? -1 : i);
  }, []);

  const [neuralState, setNeuralState] = useState({
    probs: [], activeTokenIndex: -1, isProcessing: false, topGenWord: '',
  });

  const handleNeuralUpdate = useCallback((data) => {
    setNeuralState(prev => ({ ...prev, ...data }));
    if (data.isProcessing) setActiveStage('generate');
    else if (!data.isProcessing && activeStage === 'generate') setActiveStage('input');
  }, [activeStage]);

  const handleFirstWord = useCallback((word) => {
    setNeuralState(prev => prev.topGenWord ? prev : { ...prev, topGenWord: word });
  }, []);

  const handlePromptSubmit = useCallback((text) => {
    if (!text?.trim()) return;
    setAblatedIndex(-1);
    setNeuralState({ probs: [], activeTokenIndex: -1, isProcessing: false, topGenWord: '' });

    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w, i) => ({
      word:     w,
      id:       (w.charCodeAt(0) * 31 + i * 97) % 32000,
      weight:   parseFloat((0.1 + Math.abs(Math.sin(i * 1.7 + w.length)) * 0.85).toFixed(2)),
      entropy:  parseFloat((Math.random() * 0.8 + 0.1).toFixed(3)),
      subwords: bpeSplit(w),
    }));

    const newVectors = {};
    words.forEach((w, i) => {
      newVectors[w] = [
        parseFloat((0.2 + Math.abs(Math.sin(i * 2.3)) * 0.6).toFixed(3)),
        parseFloat((0.2 + Math.abs(Math.cos(i * 1.9)) * 0.6).toFixed(3)),
        parseFloat((0.3 + Math.random() * 0.4).toFixed(3)),
      ];
    });
    newVectors['Intent'] = [
      parseFloat((words.reduce((s, w) => s + (newVectors[w]?.[0] || 0), 0) / words.length).toFixed(3)),
      parseFloat((words.reduce((s, w) => s + (newVectors[w]?.[1] || 0), 0) / words.length).toFixed(3)),
      0.5,
    ];

    setSchema(prev => ({ ...prev, prompt_topic: text.slice(0, 40), tokens: newTokens, vectors: newVectors }));
    setActiveStage('tokenize');
    setTimeout(() => setActiveStage('embed'),   800);
    setTimeout(() => setActiveStage('sample'), 1600);
  }, []);

  const handleStop = useCallback(() => {
    setNeuralState(prev => ({ ...prev, isProcessing: false, activeTokenIndex: -1 }));
    setActiveStage('input');
  }, []);

  const startTour = useCallback(() => { setIsModalOpen(false); setTourStep(0); }, []);
  const nextTour  = useCallback(() => {
    setTourStep(prev => {
      const next = prev + 1;
      // Close modal when moving past the schema step
      if (TOUR_STEPS[prev]?.action === 'open-schema') setIsModalOpen(false);
      return next >= TOUR_STEPS.length ? -1 : next;
    });
  }, []);
  const closeTour = useCallback(() => { setTourStep(-1); setIsModalOpen(false); }, []);

  const currentTour      = tourStep >= 0 ? TOUR_STEPS[tourStep] : null;
  const highlightedStage = currentTour?.highlight ?? -1;

  return (
    <div style={containerStyle} className="grid-bg">
      <Cursor />

      {/* ── WELCOME ── */}
      {showWelcome && (
        <div style={welcomeOverlayStyle} onClick={() => setShowWelcome(false)}>
          <div style={welcomeBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#00d4ff', fontWeight: 900, fontSize: 14, letterSpacing: 2, marginBottom: 6 }}>
              [ NEURAL_FLOW_v2 ]
            </div>
            <div style={{ color: '#00ff9d', fontSize: 10, marginBottom: 12, letterSpacing: 1 }}>
              LLM EXECUTION TRACER // EDUCATIONAL
            </div>
            <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
              Visualize how a large language model processes your prompt — from tokenization to token generation.
              Type a prompt, adjust temperature, and watch every stage of the LLM pipeline in real time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { setShowWelcome(false); startTour(); }}
                style={{ ...welcomeBtn, background: '#00ff9d', color: '#020617' }}
              >
                ▶ START_GUIDED_TOUR
              </button>
              <button
                onClick={() => setShowWelcome(false)}
                style={{ ...welcomeBtn, background: 'none', border: '1px solid #1e293b', color: '#475569' }}
              >
                SKIP → OPEN_DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOUR OVERLAY ── */}
      <TourOverlay
        step={currentTour}
        stepIndex={tourStep}
        total={TOUR_STEPS.length}
        onNext={nextTour}
        onClose={closeTour}
        isModalOpen={isModalOpen}
        onOpenSchema={() => setIsModalOpen(true)}
      />

      {/* ── SCHEMA MODAL ── */}
      {isModalOpen && (
        <SchemaModal schema={schema} setSchema={setSchema} onClose={() => setIsModalOpen(false)} />
      )}

      {/* ── HEADER ── */}
      <header style={headerStyle}>
        <div id="tour-pipeline-bar" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#00d4ff', fontWeight: 900, fontSize: 12, letterSpacing: 2 }} className="flicker">
            NEURAL_FLOW_v2
          </span>
          <span style={{ color: '#1e293b', fontSize: 10 }}>|</span>
          <PipelineBar activeStage={activeStage} isProcessing={neuralState.isProcessing} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {ablatedIndex >= 0 && (
            <span style={headerAblationBadge}>
              ABLATING "{schema.tokens[ablatedIndex]?.word}" → see Stage 3 ΔABLATION
            </span>
          )}
          <span style={{ fontSize: 9, color: '#334155' }}>
            TOPIC: <span style={{ color: '#64748b' }}>{schema.prompt_topic}</span>
          </span>
          <span
            style={{ fontSize: 9, color: neuralState.isProcessing ? '#00ff9d' : '#334155', fontWeight: 800 }}
            className={neuralState.isProcessing ? 'pulse' : ''}
          >
            {neuralState.isProcessing ? '● GEN_IN_PROGRESS' : '○ STANDBY'}
          </span>
        </div>
      </header>

      {/* ── CAUSALITY STRIP ── */}
      <div id="tour-causality-strip">
        <CausalityStrip
          schema={schema}
          temperature={temperature}
          activeTokenIdx={neuralState.activeTokenIndex}
          topGenWord={neuralState.topGenWord}
          isProcessing={neuralState.isProcessing}
        />
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar — all tour targets live inside */}
        <Sidebar
          onSubmit={handlePromptSubmit}
          onOpenSchema={() => setIsModalOpen(true)}
          temperature={temperature}
          setTemperature={setTemperature}
          onStop={handleStop}
          isProcessing={neuralState.isProcessing}
          onGuidedTour={startTour}
        />

        <main style={gridStyle}>

          {/* Stage 1 */}
          <div
            id="tour-stage1"
            style={{
              ...boxStyle,
              borderColor: highlightedStage === 0 ? '#00d4ff' : '#1e293b',
              boxShadow:   highlightedStage === 0 ? '0 0 20px rgba(0,212,255,0.2)' : 'none',
              transition:  'border-color 0.4s, box-shadow 0.4s',
            }}
          >
            <Stage1Tokenization
              tokens={schema.tokens}
              highlighted={highlightedStage === 0}
              ablatedIndex={ablatedIndex}
              onAblate={handleAblate}
            />
          </div>

          {/* Stage 2 */}
          <div
            id="tour-stage2"
            style={{
              ...boxStyle,
              borderColor: highlightedStage === 1 ? '#a855f7' : '#1e293b',
              boxShadow:   highlightedStage === 1 ? '0 0 20px rgba(168,85,247,0.2)' : 'none',
              transition:  'border-color 0.4s, box-shadow 0.4s',
            }}
          >
            <Stage2Vectors
              tokens={schema.tokens}
              vectors={schema.vectors}
              highlighted={highlightedStage === 1}
            />
          </div>

          {/* Stage 3 */}
          <div
            id="tour-stage3"
            style={{
              ...boxStyle,
              borderColor: highlightedStage === 2 ? '#f59e0b' : '#1e293b',
              boxShadow:   highlightedStage === 2 ? '0 0 20px rgba(245,158,11,0.2)' : 'none',
              transition:  'border-color 0.4s, box-shadow 0.4s',
            }}
          >
            <Stage3Softmax
              tokens={schema.tokens}
              activeTokenIndex={neuralState.activeTokenIndex}
              logits={neuralState.probs}
              temperature={temperature}
              highlighted={highlightedStage === 2}
              ablatedWeights={ablatedWeights}
            />
          </div>

          {/* Stage 4 */}
          <div
            id="tour-stage4"
            style={{
              ...boxStyle,
              borderColor: highlightedStage === 3 ? '#00ff9d' : '#1e293b',
              boxShadow:   highlightedStage === 3 ? '0 0 20px rgba(0,255,157,0.2)' : 'none',
              transition:  'border-color 0.4s, box-shadow 0.4s',
            }}
          >
            <Stage4Generation
              schema={schema}
              temperature={temperature}
              onNeuralUpdate={(data) => {
                if (data.probs?.[0]?.word && !neuralState.topGenWord) {
                  handleFirstWord(data.probs[0].word);
                }
                handleNeuralUpdate(data);
              }}
            />
          </div>

        </main>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const containerStyle      = { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg1)', color: 'var(--text1)', fontFamily: 'var(--font)', position: 'relative' };
const headerStyle         = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#020617', flexShrink: 0 };
const headerAblationBadge = { fontSize: 7, padding: '2px 7px', borderRadius: 2, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: '#ff4d4d', fontWeight: 800, letterSpacing: 0.8, fontFamily: 'JetBrains Mono, monospace' };
const gridStyle           = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 12, overflow: 'hidden' };
const boxStyle            = { border: '1px solid #1e293b', borderRadius: 4, background: '#0a0f1e', overflow: 'hidden' };
const welcomeOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(1,4,9,0.97)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const welcomeBoxStyle     = { width: 360, padding: 30, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 6, textAlign: 'center', boxShadow: '0 0 60px rgba(0,212,255,0.1)' };
const welcomeBtn          = { width: '100%', padding: '10px', fontSize: 10, fontWeight: 900, cursor: 'pointer', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const tourBtnPrimary      = { padding: '6px 16px', fontSize: 9, fontWeight: 800, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, background: '#a855f7', color: '#fff', border: 'none' };
const tourBtnSecondary    = { padding: '6px 12px', fontSize: 9, fontWeight: 800, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, background: 'none', color: '#334155', border: '1px solid #1e293b' };

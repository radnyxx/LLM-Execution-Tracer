import React, { useState, useCallback } from 'react';
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

const TOUR_STEPS = [
  {
    stage: 'tokenize',
    title: 'STEP 1 // TOKENIZATION',
    body: 'Your prompt is split into tokens — sub-word pieces the model can process. Each token gets a unique ID and an attention weight that signals its importance. Click any row to zero-out that token and see how Stage 3 probabilities shift.',
    highlight: 0,
  },
  {
    stage: 'embed',
    title: 'STEP 2 // EMBEDDING SPACE',
    body: 'Each token is mapped to a high-dimensional vector (embedding). Similar words cluster nearby. The dashed lines show cosine similarity — how semantically related tokens are.',
    highlight: 1,
  },
  {
    stage: 'sample',
    title: 'STEP 3 // ATTENTION + SOFTMAX',
    body: 'The model computes attention — which tokens matter for generating the next word. Open the MATH tab to see the softmax equation with real numbers substituted in. Try the COMPARE tab to see T=0.2 vs T=1.5 side by side.',
    highlight: 2,
  },
  {
    stage: 'generate',
    title: 'STEP 4 // GENERATION',
    body: 'Token by token, the model samples from the probability distribution and streams the output. Each word\'s brightness shows its confidence. The KV Cache tab shows memory being built up.',
    highlight: 3,
  },
];

export default function App() {
  const [schema,      setSchema]      = useState(DEFAULT_SCHEMA);
  const [temperature, setTemperature] = useState(0.7);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourStep,    setTourStep]    = useState(-1);
  const [activeStage, setActiveStage] = useState('input');

  // ── Ablation state ────────────────────────────────────────────────────────
  // ablatedIndex: which token row in Stage 1 has been zeroed (-1 = none)
  // ablatedWeights: derived array passed to Stage 3 for probability diff overlay
  const [ablatedIndex, setAblatedIndex] = useState(-1);

  const ablatedWeights = ablatedIndex >= 0
    ? schema.tokens.map((t, i) => (i === ablatedIndex ? 0 : t.weight))
    : [];

  const handleAblate = useCallback((i) => {
    // Passing -1 (reset button) or clicking the same row again clears ablation
    setAblatedIndex(prev => (i === -1 || prev === i) ? -1 : i);
  }, []);

  // ── Neural / generation state ─────────────────────────────────────────────
  const [neuralState, setNeuralState] = useState({
    probs:            [],
    activeTokenIndex: -1,
    isProcessing:     false,
    topGenWord:       '',   // first generated word — fed to CausalityStrip
  });

  const handleNeuralUpdate = useCallback((data) => {
    setNeuralState(prev => ({ ...prev, ...data }));
    if (data.isProcessing)                              setActiveStage('generate');
    else if (!data.isProcessing && activeStage === 'generate') setActiveStage('input');
  }, [activeStage]);

  // Capture the first generated word for CausalityStrip
  const handleFirstWord = useCallback((word) => {
    setNeuralState(prev =>
      prev.topGenWord ? prev : { ...prev, topGenWord: word }
    );
  }, []);

  // ── Prompt submission ─────────────────────────────────────────────────────
  const handlePromptSubmit = useCallback((text) => {
    if (!text?.trim()) return;

    // Clear ablation whenever a new prompt is submitted
    setAblatedIndex(-1);
    setNeuralState({ probs: [], activeTokenIndex: -1, isProcessing: false, topGenWord: '' });

    const words = text.trim().split(/\s+/);
    const newTokens = words.map((w, i) => ({
      word:    w,
      id:      (w.charCodeAt(0) * 31 + i * 97) % 32000,
      weight:  parseFloat((0.1 + Math.abs(Math.sin(i * 1.7 + w.length)) * 0.85).toFixed(2)),
      entropy: parseFloat((Math.random() * 0.8 + 0.1).toFixed(3)),
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

  // ── Guided tour ───────────────────────────────────────────────────────────
  const startTour  = useCallback(() => setTourStep(0), []);
  const nextTour   = useCallback(() => setTourStep(prev => prev >= TOUR_STEPS.length - 1 ? -1 : prev + 1), []);
  const closeTour  = useCallback(() => setTourStep(-1), []);

  const currentTour      = tourStep >= 0 ? TOUR_STEPS[tourStep] : null;
  const highlightedStage = currentTour?.highlight ?? -1;

  return (
    <div style={containerStyle} className="grid-bg">
      <Cursor />

      {/* ── WELCOME OVERLAY ── */}
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

      {/* ── GUIDED TOUR OVERLAY ── */}
      {currentTour && (
        <div style={tourOverlayStyle}>
          <div style={tourBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: '#a855f7', fontSize: 9, fontWeight: 800 }}>{currentTour.title}</span>
              <span style={{ color: '#334155', fontSize: 8 }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>{currentTour.body}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeTour} style={{ ...tourBtn, color: '#334155', border: '1px solid #1e293b' }}>CLOSE</button>
              <button onClick={nextTour}  style={{ ...tourBtn, background: '#a855f7', color: '#fff', border: 'none' }}>
                {tourStep >= TOUR_STEPS.length - 1 ? 'FINISH ✓' : 'NEXT →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEMA MODAL ── */}
      {isModalOpen && (
        <SchemaModal schema={schema} setSchema={setSchema} onClose={() => setIsModalOpen(false)} />
      )}

      {/* ── HEADER ── */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#00d4ff', fontWeight: 900, fontSize: 12, letterSpacing: 2 }} className="flicker">
            NEURAL_FLOW_v2
          </span>
          <span style={{ color: '#1e293b', fontSize: 10 }}>|</span>
          <PipelineBar activeStage={activeStage} isProcessing={neuralState.isProcessing} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Ablation indicator in header */}
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
      <CausalityStrip
        schema={schema}
        temperature={temperature}
        activeTokenIdx={neuralState.activeTokenIndex}
        topGenWord={neuralState.topGenWord}
        isProcessing={neuralState.isProcessing}
      />

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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

          {/* Stage 1 — now receives ablation props */}
          <div style={{
            ...boxStyle,
            borderColor: highlightedStage === 0 ? '#00d4ff' : '#1e293b',
            boxShadow:   highlightedStage === 0 ? '0 0 20px rgba(0,212,255,0.2)' : 'none',
            transition:  'border-color 0.4s, box-shadow 0.4s',
          }}>
            <Stage1Tokenization
              tokens={schema.tokens}
              highlighted={highlightedStage === 0}
              ablatedIndex={ablatedIndex}
              onAblate={handleAblate}
            />
          </div>

          {/* Stage 2 — unchanged */}
          <div style={{
            ...boxStyle,
            borderColor: highlightedStage === 1 ? '#a855f7' : '#1e293b',
            boxShadow:   highlightedStage === 1 ? '0 0 20px rgba(168,85,247,0.2)' : 'none',
            transition:  'border-color 0.4s, box-shadow 0.4s',
          }}>
            <Stage2Vectors
              tokens={schema.tokens}
              vectors={schema.vectors}
              highlighted={highlightedStage === 1}
            />
          </div>

          {/* Stage 3 — now receives ablatedWeights */}
          <div style={{
            ...boxStyle,
            borderColor: highlightedStage === 2 ? '#f59e0b' : '#1e293b',
            boxShadow:   highlightedStage === 2 ? '0 0 20px rgba(245,158,11,0.2)' : 'none',
            transition:  'border-color 0.4s, box-shadow 0.4s',
          }}>
            <Stage3Softmax
              tokens={schema.tokens}
              activeTokenIndex={neuralState.activeTokenIndex}
              logits={neuralState.probs}
              temperature={temperature}
              highlighted={highlightedStage === 2}
              ablatedWeights={ablatedWeights}
            />
          </div>

          {/* Stage 4 — passes first word back up via onNeuralUpdate */}
          <div style={{
            ...boxStyle,
            borderColor: highlightedStage === 3 ? '#00ff9d' : '#1e293b',
            boxShadow:   highlightedStage === 3 ? '0 0 20px rgba(0,255,157,0.2)' : 'none',
            transition:  'border-color 0.4s, box-shadow 0.4s',
          }}>
            <Stage4Generation
              schema={schema}
              temperature={temperature}
              onNeuralUpdate={(data) => {
                // Capture the first real word token for CausalityStrip
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

const containerStyle       = { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg1)', color: 'var(--text1)', fontFamily: 'var(--font)', position: 'relative' };
const headerStyle          = { height: 40, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#020617', flexShrink: 0 };
const headerAblationBadge  = { fontSize: 7, padding: '2px 7px', borderRadius: 2, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: '#ff4d4d', fontWeight: 800, letterSpacing: 0.8, fontFamily: 'JetBrains Mono, monospace' };
const gridStyle            = { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 12, overflow: 'hidden' };
const boxStyle             = { border: '1px solid #1e293b', borderRadius: 4, background: '#0a0f1e', overflow: 'hidden' };
const welcomeOverlayStyle  = { position: 'fixed', inset: 0, background: 'rgba(1,4,9,0.97)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const welcomeBoxStyle      = { width: 360, padding: 30, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 6, textAlign: 'center', boxShadow: '0 0 60px rgba(0,212,255,0.1)' };
const welcomeBtn           = { width: '100%', padding: '10px', fontSize: 10, fontWeight: 900, cursor: 'pointer', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };
const tourOverlayStyle     = { position: 'fixed', bottom: 20, right: 20, zIndex: 5000 };
const tourBoxStyle         = { width: 320, padding: 18, background: '#0a0f1e', border: '1px solid rgba(168,85,247,0.5)', borderRadius: 6, boxShadow: '0 0 30px rgba(168,85,247,0.15)', fontFamily: 'JetBrains Mono, monospace' };
const tourBtn              = { padding: '5px 14px', fontSize: 8, fontWeight: 800, cursor: 'pointer', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 };

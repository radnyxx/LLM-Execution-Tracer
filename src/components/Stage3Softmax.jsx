import React from 'react';

export default function Stage3Softmax() {
  return (
    <div style={{ 
      background: 'var(--bg2)', 
      border: '1px solid var(--border)', 
      borderRadius: 4, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        padding: '8px 12px', 
        borderBottom: '1px solid var(--border)', 
        background: 'var(--bg3)' 
      }}>
        <div style={{ 
          width: 18, height: 18, borderRadius: '50%', 
          background: 'var(--blue3)', border: '1px solid var(--blue)', 
          color: 'var(--blue)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', fontSize: 9, fontWeight: 700 
        }}>3</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Neural Architecture & Logic
        </span>
      </div>

      <div style={{ padding: 15, flex: 1, overflowY: 'auto' }}>
        <section style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 10, color: 'var(--text1)', marginBottom: 8, textTransform: 'uppercase' }}>
            The Mechanics of "Meaning"
          </h4>
          <p style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
            Large Language Models do not understand words as strings. Instead, they process language through 
            <b> High-Dimensional Embeddings</b>. Each token is assigned a coordinate in a multi-thousand-dimensional space. 
            Words like "Socrates" and "Philosophy" are mathematically pulled together based on their statistical co-occurrence 
            in the training data.
          </p>
        </section>

        

        <section style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 10, color: 'var(--text1)', marginBottom: 8, textTransform: 'uppercase' }}>
            Attention & Transformers
          </h4>
          <p style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
            The <b>Transformer Architecture</b> utilizes "Self-Attention" to weigh the importance of different 
            words in a sentence. When you see a high "Attention Weight" in Stage 1, it indicates that the model 
            is focusing heavily on that specific token to determine the context of the next generation.
          </p>
        </section>

        <div style={{ 
          padding: '10px', 
          background: 'var(--bg4)', 
          borderLeft: '2px solid var(--blue)', 
          fontSize: 9, 
          color: 'var(--blue)',
          fontFamily: 'monospace'
        }}>
          // System Status: Operational <br />
          // Model: Llama-3-8B-Instant <br />
          // Projection: 3D SVG-Lite
        </div>
      </div>
    </div>
  );
}

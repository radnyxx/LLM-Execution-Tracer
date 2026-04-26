import React from 'react';
import Plot from 'react-plotly.js';

export default function Stage2Vectors({ vectors }) {
  const keys = Object.keys(vectors);
  
  // Extracting X, Y, Z coordinates for the plot
  const xData = keys.map(k => vectors[k][0]);
  const yData = keys.map(k => vectors[k][1]);
  const zData = keys.map(k => vectors[k][2] || 0); // Default Z to 0 if 2D
  const labels = keys;

  const data = [
    {
      type: 'scatter3d',
      mode: 'markers+text',
      x: xData,
      y: yData,
      z: zData,
      text: labels,
      textposition: 'top center',
      marker: {
        size: 8,
        color: ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b'],
        symbol: 'circle',
        opacity: 0.8,
        line: { color: '#ffffff', width: 0.5 }
      },
      font: { family: 'JetBrains Mono, monospace', size: 10, color: '#e2e8f0' }
    },
    // Adding lines from origin to each point to show "vector" distance
    ...keys.map((k, i) => ({
      type: 'scatter3d',
      mode: 'lines',
      x: [0, vectors[k][0]],
      y: [0, vectors[k][1]],
      z: [0, vectors[k][2] || 0],
      line: {
        color: ['#ff4444', '#a855f7', '#00d4ff', '#10b981', '#f59e0b'][i % 5],
        width: 2,
        dash: 'dash'
      },
      showlegend: false,
      hoverinfo: 'none'
    }))
  ];

  const layout = {
    autosize: true,
    height: 300,
    margin: { l: 0, r: 0, b: 0, t: 0 },
    paper_bgcolor: '#000000',
    plot_bgcolor: '#000000',
    scene: {
      xaxis: { gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#475569', title: 'Dim 1' },
      yaxis: { gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#475569', title: 'Dim 2' },
      zaxis: { gridcolor: '#1e293b', zerolinecolor: '#334155', color: '#475569', title: 'Dim 3' },
      bgcolor: '#000000',
      camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } } // Initial viewing angle
    },
    showlegend: false,
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue3)', border: '1px solid var(--blue)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>2</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Interactive Embedding Space
        </span>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
          // 3D VECTOR PROJECTION (INTERACTIVE)
        </div>
        <div style={{ borderRadius: 3, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <Plot
            data={data}
            layout={layout}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>
      </div>
    </div>
  );
}

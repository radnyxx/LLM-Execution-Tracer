export const DEFAULT_SCHEMA = {
  prompt_topic: "Socrates & Philosophy",
  tokens: [
    { word: 'Socrates', id: 502,  weight: 0.98, entropy: 0.12, subwords: ['Soc', 'rates'] },
    { word: 'was',      id: 10,   weight: 0.15, entropy: 0.71, subwords: ['was'] },
    { word: 'a',        id: 5,    weight: 0.10, entropy: 0.89, subwords: ['a'] },
    { word: 'Greek',    id: 882,  weight: 0.85, entropy: 0.22, subwords: ['Greek'] },
    { word: 'thinker',  id: 441,  weight: 0.92, entropy: 0.18, subwords: ['think', 'er'] },
  ],
  vectors: {
    Socrates: [0.82, 0.61, 0.45],
    was:      [0.10, 0.12, 0.08],
    a:        [0.08, 0.09, 0.06],
    Greek:    [0.75, 0.55, 0.38],
    thinker:  [0.78, 0.58, 0.42],
    Intent:   [0.65, 0.52, 0.40],
  },
  softmax: [
    { word: 'Wisdom',   prob: 0.55 },
    { word: 'Justice',  prob: 0.25 },
    { word: 'Virtue',   prob: 0.15 },
    { word: 'Truth',    prob: 0.05 },
  ],
  temperature: 0.7,
};

export const DEFAULT_JSON = JSON.stringify(DEFAULT_SCHEMA, null, 2);

// Compute real softmax from logits + temperature
export function computeSoftmax(logits, temperature = 1.0) {
  const temp = Math.max(temperature, 0.01);
  const scaled = logits.map(l => l / temp);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

// Shannon entropy
export function shannonEntropy(weight) {
  const p = Math.max(0.001, Math.min(0.999, weight));
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

// Deterministic hex from token id
export function tokenHex(id) {
  const h = (id * 2654435761) >>> 0;
  return '0x' + h.toString(16).slice(0, 3).toUpperCase().padStart(3, '0');
}

// BPE-style subword split (simple heuristic)
export function bpeSplit(word) {
  if (word.length <= 3) return [word];
  const splits = [];
  let i = 0;
  while (i < word.length) {
    const len = i === 0 ? Math.min(4, word.length) : Math.min(2 + Math.floor(Math.random() * 3), word.length - i);
    splits.push(word.slice(i, i + len));
    i += len;
  }
  return splits;
}

export const DEFAULT_SCHEMA = {
  tokens: [
    { word: 'Write',    id: 102, weight: 0.80 },
    { word: 'a',        id: 5,   weight: 0.10 },
    { word: 'poem',     id: 550, weight: 0.95 },
    { word: 'on',       id: 12,  weight: 0.10 },
    { word: 'football', id: 991, weight: 0.99 },
  ],
  vectors: {
    football: [0.92, -0.11, 0.5],
    poem:     [0.05,  0.88, 0.2],
    centroid: [0.48,  0.38, 0.35],
  },
  softmax: [
    { word: 'The',    prob: 0.45 },
    { word: 'Green',  prob: 0.20 },
    { word: 'Eleven', prob: 0.10 },
  ],
  temperature: 0.7,
}

export const DEFAULT_JSON = JSON.stringify(DEFAULT_SCHEMA, null, 2)

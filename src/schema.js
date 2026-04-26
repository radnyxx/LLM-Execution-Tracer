export const DEFAULT_SCHEMA = {
  prompt_topic: "Socrates & Philosophy",
  tokens: [
    { word: 'Socrates', id: 502, weight: 0.98 },
    { word: 'was',      id: 10,  weight: 0.15 },
    { word: 'a',        id: 5,   weight: 0.10 },
    { word: 'Greek',    id: 882, weight: 0.85 },
    { word: 'thinker',  id: 441, weight: 0.92 },
  ],
  vectors: {
    Socrates: [0.12, 0.88, 0.45],
    Athens:   [0.15, 0.82, 0.39],
    Intent:   [0.35, 0.65, 0.42], // This will act as your centroid
  },
  softmax: [
    { word: 'Wisdom', prob: 0.55 },
    { word: 'Justice', prob: 0.25 },
    { word: 'Virtue', prob: 0.15 },
  ],
  temperature: 0.45,
}

export const DEFAULT_JSON = JSON.stringify(DEFAULT_SCHEMA, null, 2)

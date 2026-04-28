import React from 'react';

export const GLOSSARY = {
  entropy: "Entropy measures unpredictability. High entropy = the model is uncertain which token comes next. Low entropy = model is confident.",
  attention: "Attention tells the model which words to 'focus on' when processing each token. Higher weight = more important.",
  softmax: "Softmax converts raw scores (logits) into probabilities that sum to 1.0. Higher temp = flatter distribution = more randomness.",
  logits: "Raw unnormalized scores the model assigns to each possible next token before softmax is applied.",
  temperature: "Controls randomness. Low temp (0.1) = deterministic/repetitive. High temp (1.5+) = creative/unpredictable.",
  bpe: "Byte-Pair Encoding splits rare words into subword pieces. 'thinker' → ['think','er']. Helps the model handle unknown words.",
  embedding: "A high-dimensional vector (list of numbers) that represents a word's meaning. Similar words cluster together in this space.",
  cosine: "Cosine similarity measures how similar two vectors are. 1.0 = identical direction, 0 = unrelated, -1 = opposite.",
  kvCache: "Key-Value Cache stores intermediate computations so the model doesn't recompute past tokens on every step. Speeds up generation.",
  topK: "Top-K sampling: only consider the K most likely next tokens. Prevents very unlikely tokens from being chosen.",
  nucleus: "Top-P (nucleus) sampling: choose from the smallest set of tokens whose cumulative probability exceeds P.",
  layer: "A transformer layer applies attention + feed-forward operations. More layers = deeper reasoning capability.",
};

export default function Tooltip({ term, children, label }) {
  const tip = GLOSSARY[term] || label || '';
  return (
    <span className="tooltip-wrap">
      <span className="tooltip-trigger">{children}</span>
      {tip && <span className="tooltip-box">{tip}</span>}
    </span>
  );
}

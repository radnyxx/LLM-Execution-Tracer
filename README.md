# LLM Execution Tracer

> A high-fidelity, open-source diagnostic dashboard that visualizes the backend execution of a Large Language Model processing the prompt **"Write a poem on football."**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Stack: React + Vite](https://img.shields.io/badge/Stack-React%20%2B%20Vite-61dafb)
![Theme: Dark](https://img.shields.io/badge/Theme-Minimalist%20Dark-000000)

---

## Overview

This tool exposes the four core computational stages of an LLM's forward pass in real time. All visualizations are driven by an **editable JSON sandbox** — modify any value and watch every panel update instantly.

```
Prompt → [Stage 1] Tokenize → [Stage 2] Embed → [Stage 3] Sample → [Stage 4] Generate
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-handle/llm-execution-tracer.git
cd llm-execution-tracer

# 2. Install
npm install

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build
```

> Requires **Node.js ≥ 18**.

---

## The JSON Sandbox

The entire dashboard is driven by a single JSON schema. Edit it live in the left panel:

```json
{
  "tokens": [
    { "word": "Write",    "id": 102, "weight": 0.80 },
    { "word": "a",        "id": 5,   "weight": 0.10 },
    { "word": "poem",     "id": 550, "weight": 0.95 },
    { "word": "on",       "id": 12,  "weight": 0.10 },
    { "word": "football", "id": 991, "weight": 0.99 }
  ],
  "vectors": {
    "football": [0.92, -0.11, 0.5],
    "poem":     [0.05,  0.88, 0.2],
    "centroid": [0.48,  0.38, 0.35]
  },
  "softmax": [
    { "word": "The",    "prob": 0.45 },
    { "word": "Green",  "prob": 0.20 },
    { "word": "Eleven", "prob": 0.10 }
  ],
  "temperature": 0.7
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `tokens[].word` | string | Surface form of the token |
| `tokens[].id` | integer | Vocabulary index (e.g. BPE id) |
| `tokens[].weight` | float `[0,1]` | Simulated attention weight; drives heatmap glow intensity |
| `vectors.*` | float[3] | 3D embedding coordinates; projected to 2D on the canvas |
| `softmax[].prob` | float | Un-normalized probability; re-normalized internally |
| `temperature` | float `(0,2]` | Softmax temperature scalar (linked to Stage 3 slider) |

---

## The Math

### Stage 1 — Tokenization & Attention

A tokenizer (BPE, WordPiece, etc.) splits the input string into sub-word units and maps each to an integer vocabulary id.

Attention weight `α` for token `i` attending to token `j` is computed via scaled dot-product attention:

```
α_ij = softmax( (Q_i · K_j) / √d_k )
```

Where `Q` and `K` are the query and key matrices, and `d_k` is the key dimension. High-weight tokens ("football", "poem") are the *keys* the model attends to most strongly when predicting the next token.

### Stage 2 — Vector Embeddings

Each token is mapped to a dense vector in ℝⁿ (commonly n = 768, 1024, or 4096). Semantically similar words cluster nearby in this space.

The **cosine similarity** between two vectors u and v:

```
cos_sim(u, v) = (u · v) / (‖u‖ · ‖v‖)
```

Values near 1.0 → same semantic cluster. Values near 0 → orthogonal meaning. The **centroid** of all high-weight token embeddings gives the model's inferred intent vector.

### Stage 3 — Softmax & Nucleus Sampling

The model outputs a logit vector `z ∈ ℝᵛ` over the vocabulary. The probability of token `i` is:

```
P(i) = exp(z_i / T) / Σ_j exp(z_j / T)
```

Where `T` is **temperature**:
- `T → 0`: distribution collapses to argmax (greedy/deterministic)
- `T = 1`: raw softmax probabilities
- `T > 1`: distribution flattens (more random)

**Nucleus Sampling (Top-P)** truncates the distribution to the smallest set of tokens whose cumulative probability exceeds threshold `p`:

```
S = min { V ⊆ vocab : Σ_{i∈V} P(i) ≥ p }
```

Only tokens in `S` are eligible for sampling. Tokens outside `S` are shown with a cut marker `✕`.

### Stage 4 — Autoregressive Generation

The model generates one token per forward pass. Each new token is appended to the context and fed back as input — a recursive loop:

```
output_t = model(tokens[0..t-1])
tokens[t] = sample(softmax(output_t))
```

The **KV-Cache** stores the key/value matrices from previous steps so attention over earlier tokens doesn't need to be recomputed on each new pass, reducing inference from O(n²) to O(n) per step.

---

## Project Structure

```
llm-execution-tracer/
├── index.html                     # Vite entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── LICENSE                        # MIT
├── README.md
└── src/
    ├── main.jsx                   # React root
    ├── App.jsx                    # State management + layout
    ├── index.css                  # CSS variables + global styles
    ├── schema.js                  # Default JSON schema constant
    └── components/
        ├── Sidebar.jsx            # Live JSON editor panel
        ├── Stage1Tokenization.jsx # Token table + attention heatmap
        ├── Stage2Vectors.jsx      # 2D embedding canvas
        ├── Stage3Softmax.jsx      # Probability bars + temperature slider
        └── Stage4Generation.jsx   # Terminal output + KV cache
```

---

## Customization

### Change the Prompt

Edit `POEM` in `Stage4Generation.jsx` to change the generated output text.
Edit `DEFAULT_SCHEMA` in `schema.js` to change the default tokens and probabilities.

### Add More Tokens

Just add more entries to the `tokens` array in the JSON sandbox. The heatmap and table scale automatically.

### Add More Softmax Candidates

Add entries to the `softmax` array. The nucleus sampling cutoff is dynamic — tokens outside top-P are automatically marked.

### Adjust the Color Palette

All colors are defined as CSS custom properties in `src/index.css` under `:root`. The primary accent is `--blue: #00d4ff`.

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| React 18 | Component model + state |
| Vite 5 | Build tool + dev server |
| Framer Motion | Animation primitives |
| Lucide React | Minimal icon set |
| Canvas 2D API | Vector embedding visualization |
| Tailwind CSS | Utility classes (minimal usage) |

---

## License

MIT © 2025. See [LICENSE](./LICENSE).

This project is free and open source. Contributions welcome — open a PR or issue on GitHub.

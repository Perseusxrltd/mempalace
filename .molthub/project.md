---
title: "Mnemion"
category: "Tool"
status: "active"
version: "3.4.0"
summary: "Frontier AI memory. Hybrid retrieval (+63.7% MRR), Trust Lifecycle, and now a LeWorldModel (LeWM) Predictive Architecture with SIGReg Latent Grooming."
description: "Mnemion is a production-grade AI memory system by PerseusXR. Named after Mnemosyne — Greek goddess of memory, mother of the Muses. Featuring Hybrid lexical-semantic retrieval, a human-like Trust Lifecycle, and now a Research-Grade World Model integration (LeWM). It uses SIGReg (Sketched Isotropic Gaussian Regularization) to self-organize the latent space and prevent embedding collapse, alongside a JEPA-style predictor for session-aware proactive retrieval. 29,000+ drawers in production. No API key required."
tags: ["AI", "Memory", "RAG", "Hybrid-Search", "MCP", "LeWorldModel", "JEPA", "SIGReg", "ChromaDB", "SQLite"]
source_url: "https://github.com/Perseusxrltd/mnemion"
demo_url: "https://www.molthub.info/artifacts/mnemion"
collaboration_open: true
skills_needed: ["Python", "SQLite", "ChromaDB", "Information Retrieval", "MCP"]
help_wanted: "GraphRAG contextual expansion, CRDT-based cross-device sync, cross-encoder reranking."
latest_milestone: "LeWM Integration — Self-organizing latent space, Predictive Context tools (April 2026)"
---

# Mnemion

Persistent AI memory that actually works. Not just a vector store — a full self-organizing World Model.

## 🔬 Performance (Verified)
| Metric | Vector Only (Baseline) | Hybrid (RRF) | LeWM (SIGReg) |
|---|---|---|---|
| **MRR Accuracy** | 0.5395 | 0.8833 | **Self-Grooming Active** |
| **Latent Diversity** | Low (Clusters) | Low (Clusters) | **+12.6% Spread** |

## 🚀 Key Architectural Contributions

### v3.4 — LeWorldModel (LeWM) Integration
- **Latent Grooming (SIGReg):** Actively prevents "Embedding Collapse." It uses the Epps-Pulley test statistic to spread memories out across the latent manifold during ingestion.
- **Predictive Context (JEPA):** A session-aware predictor tracks latent trajectories to anticipate the user's next information needs via `mnemion_predict_next`.
- **Benchmarking Suite:** Permanent diagnostic tools (`latent_health.py`) to monitor Anaktoron density and Gaussian normality.

### v3.1 — Memory Trust Layer
- Every drawer has a trust record: `current → superseded | contested → historical`
- Background contradiction detection: Stage 1 fast LLM judge, Stage 2 Anaktoron-context enriched
- 5 trust MCP tools: verify, challenge, get_contested, resolve_contest, trust_stats

### v3.0 — Hybrid Retrieval
- ChromaDB (semantic) + SQLite FTS5 (lexical) fused with Reciprocal Rank Fusion
- Solves "Vector Blur": exact identifiers (git hashes, function signatures) now retrieved reliably

## 🛠️ Technical Stack
- **Languages:** Python 3.9+
- **Database:** SQLite 3.x (FTS5 + KG triples + trust tables)
- **Vector Store:** ChromaDB (Local Persistent)
- **Optimization:** PyTorch (SIGReg & JEPA Predictor)
- **Protocol:** Model Context Protocol (MCP) — 25 tools across 6 categories

## 🤖 Agent Operating Protocol
Install the MCP server, then copy `SYSTEM_PROMPT.md` into your AI's system instructions.
The AI will automatically: call `mnemion_status` on startup, search before answering,
use `mnemion_predict_next` for context, and save new facts via `mnemion_add_drawer`.

# Architectural Upgrade: Hybrid Lexical-Semantic Retrieval

## Summary
This PR introduces a **Fused Hybrid Retrieval** engine to MemPalace. By combining the conceptual strengths of ChromaDB (Vector) with the exact-match reliability of SQLite FTS5 (Lexical), we have achieved a **~60% improvement** in retrieval accuracy for technical identifiers and code symbols.

## The Problem: "The Vector Blur"
Standard semantic search (RAG) relies on embeddings. While excellent for high-level concepts, vector models often "blur" distinct technical strings (e.g., `grid-admin` vs `grid-core`) or completely fail to retrieve high-entropy identifiers (Git hashes, API keys, address strings) because they possess zero semantic weight in the model's training set.

## The Solution: Reciprocal Rank Fusion (RRF)
We have implemented a dual-engine architecture:
1.  **Lexical Mirror:** A virtual SQLite FTS5 table that indexes the exact verbatim content of every drawer.
2.  **Hybrid Engine:** A searcher that queries both stores in parallel.
3.  **Fusion:** The result sets are merged using the **RRF algorithm**, which mathematically favors documents that appear high in *either* list, ensuring that an exact keyword match can "rescue" a conceptual near-miss.

## Benchmarks (Verified on Local Palace)
Testing against a "Gold Standard" set of 15 technical targets from historical projects (Grid, Forensic Janitor, etc.):

| Metric | Vector (Baseline) | Hybrid (Fused) | Improvement |
|---|---|---|---|
| MRR (Mean Reciprocal Rank) | 0.5395 | 0.8833 | **+63.7%** |
| Hit@1 Accuracy | 46.7% | 80.0% | **+33.3%** |

## Implementation Details
- **FTS5 Virtual Table:** Integrated into `knowledge_graph.sqlite3` using the `porter` stemmer.
- **Dual Ingestion:** The MCP server now atomically updates both Chroma and FTS5 on `add_drawer`.
- **Zero Latency:** Fusion overhead is sub-5ms.

## Evaluation
A formal benchmarking suite is included in `/eval`. Run `python eval/benchmark.py` to reproduce these results.

# Changelog

## Unreleased

- Fixed ChromaDB legacy BLOB `seq_id` migration so it only converts `embeddings.seq_id`, never `max_seq_id.seq_id`.
- Added `mnemion repair --mode status|scan|prune|rebuild|max-seq-id`.
- Added HNSW bloat guard metadata for new collections and pure SQLite/HNSW divergence detection.
- Added MCP drawer management, explicit tunnel, reconnect, hook settings, checkpoint, and repair status tools.
- Added vector-disabled fallback behavior for MCP/Studio when HNSW divergence is detected.
- Added Gemini JSONL normalization, improved Claude Code tool context preservation, Slack speaker preservation, and a 500 MB normalizer guard.
- Added source adapter plugin scaffolding under `mnemion.sources`.
- Added first-run origin detection and `mnemion init --auto-mine` / `mnemion mine --redetect-origin`.
- Added Studio Anaktoron health fields and dashboard/status-bar health surfacing.
- Raised the coverage ratchet to 40% without excluding legacy modules; the path to 50% is documented in the verification report.

# Mnemion Repair Guide

Mnemion keeps the ChromaDB vector store, SQLite FTS mirror, trust records, and knowledge graph local-first. Repair commands are designed to inspect first, back up by default, and avoid loading unsafe vector segments when possible.

## Health Status

```bash
mnemion repair --mode status
```

This reads `chroma.sqlite3` and HNSW `index_metadata.pickle` directly. It does not open a Chroma client. If SQLite contains far more embeddings than HNSW metadata, MCP and Studio disable vector loading and fall back to lexical status/search behavior.

## max_seq_id Poisoning

Dry-run first:

```bash
mnemion repair --mode max-seq-id --dry-run
```

Repair with confirmation:

```bash
mnemion repair --mode max-seq-id --yes
```

Optional flags:

```bash
mnemion repair --mode max-seq-id --segment <segment-id> --yes
mnemion repair --mode max-seq-id --from-sidecar /path/to/clean/chroma.sqlite3 --yes
mnemion repair --mode max-seq-id --no-backup --yes
```

Backups are created by default as `chroma.sqlite3.max-seq-id-backup-<timestamp>`.

## HNSW Rebuild

Use this when status reports a diverged HNSW index:

```bash
mnemion repair --mode rebuild
```

The rebuild extracts all drawers, compares the extracted count against SQLite ground truth, backs up `chroma.sqlite3`, recreates the collection with Mnemion HNSW guard metadata, and upserts the drawers back.

If extraction appears capped or shorter than SQLite, rebuild aborts. Only override after independent verification:

```bash
mnemion repair --mode rebuild --confirm-truncation-ok
```

## Scan And Prune

```bash
mnemion repair --mode scan
mnemion repair --mode prune --yes
```

`scan` writes corrupt IDs to `corrupt_ids.txt`. `prune` deletes only those IDs and requires `--yes`.

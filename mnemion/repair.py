"""Repair and health tooling for Mnemion Anaktorons."""

from __future__ import annotations

import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from .chroma_compat import close_chroma_handles, hnsw_capacity_status, sqlite_embedding_count
from .config import DRAWER_HNSW_METADATA, MnemionConfig

COLLECTION_NAME = "mnemion_drawers"
CHROMADB_DEFAULT_GET_LIMIT = 10_000
MAX_SEQ_ID_SANITY_THRESHOLD = 1 << 53


class TruncationDetected(Exception):
    def __init__(self, message: str, sqlite_count: Optional[int], extracted: int):
        super().__init__(message)
        self.message = message
        self.sqlite_count = sqlite_count
        self.extracted = extracted


class MaxSeqIdVerificationError(RuntimeError):
    """Raised when post-repair detection still sees poisoned rows."""


def _collection_name() -> str:
    return MnemionConfig().collection_name or COLLECTION_NAME


def _get_anaktoron_path(path: Optional[str] = None) -> str:
    if path:
        return os.path.abspath(os.path.expanduser(path))
    return os.path.abspath(os.path.expanduser(MnemionConfig().anaktoron_path))


def _db_path(anaktoron_path: str) -> str:
    return os.path.join(anaktoron_path, "chroma.sqlite3")


def check_extraction_safety(
    anaktoron_path: str, extracted: int, confirm_truncation_ok: bool = False
) -> None:
    if confirm_truncation_ok:
        return

    sqlite_count = sqlite_embedding_count(anaktoron_path, _collection_name())
    if sqlite_count is not None and sqlite_count > extracted:
        loss = sqlite_count - extracted
        pct = 100 * loss / max(sqlite_count, 1)
        raise TruncationDetected(
            "\n  ABORT: chroma.sqlite3 reports "
            f"{sqlite_count:,} drawers but only {extracted:,} came back through "
            "the Chroma collection layer. Proceeding would silently destroy "
            f"{loss:,} drawers (~{pct:.0f}%). Re-run with "
            "--confirm-truncation-ok only after independent verification.\n",
            sqlite_count,
            extracted,
        )

    if sqlite_count is None and extracted == CHROMADB_DEFAULT_GET_LIMIT:
        raise TruncationDetected(
            "\n  ABORT: extracted exactly ChromaDB's default 10,000-row get() "
            "limit and the SQLite count could not be checked. Re-run with "
            "--confirm-truncation-ok only after independent verification.\n",
            sqlite_count,
            extracted,
        )


def _detect_poisoned_max_seq_ids(
    db_path: str,
    *,
    segment: Optional[str] = None,
    threshold: int = MAX_SEQ_ID_SANITY_THRESHOLD,
) -> list[tuple[str, int]]:
    with sqlite3.connect(db_path) as conn:
        if segment is not None:
            rows = conn.execute(
                "SELECT segment_id, seq_id FROM max_seq_id WHERE segment_id = ? AND seq_id > ?",
                (segment, threshold),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT segment_id, seq_id FROM max_seq_id WHERE seq_id > ?", (threshold,)
            ).fetchall()
    return [(str(segment_id), int(seq_id)) for segment_id, seq_id in rows]


def _compute_heuristic_seq_id(cur: sqlite3.Cursor, segment_id: str) -> int:
    row = cur.execute(
        """
        SELECT MAX(e.seq_id)
        FROM embeddings e
        JOIN segments s ON e.segment_id = s.id
        WHERE s.collection = (
            SELECT collection FROM segments WHERE id = ?
        )
        """,
        (segment_id,),
    ).fetchone()
    return int(row[0]) if row and row[0] is not None else 0


def _read_sidecar_seq_ids(sidecar_path: str) -> dict[str, int]:
    if not os.path.isfile(sidecar_path):
        raise FileNotFoundError(f"Sidecar database not found: {sidecar_path}")
    out: dict[str, int] = {}
    with sqlite3.connect(sidecar_path) as conn:
        rows = conn.execute("SELECT segment_id, seq_id, typeof(seq_id) FROM max_seq_id").fetchall()
    for segment_id, seq_id, kind in rows:
        if kind == "blob":
            raise ValueError(f"Sidecar has BLOB-typed seq_id for {segment_id}; refusing to use it.")
        out[str(segment_id)] = int(seq_id)
    return out


def repair_max_seq_id(
    anaktoron_path: str,
    *,
    segment: Optional[str] = None,
    from_sidecar: Optional[str] = None,
    threshold: int = MAX_SEQ_ID_SANITY_THRESHOLD,
    backup: bool = True,
    dry_run: bool = False,
    assume_yes: bool = False,
) -> dict:
    anaktoron_path = _get_anaktoron_path(anaktoron_path)
    db_path = _db_path(anaktoron_path)
    result: dict = {
        "anaktoron_path": anaktoron_path,
        "dry_run": dry_run,
        "aborted": False,
        "segment_repaired": [],
        "before": {},
        "after": {},
        "backup": None,
    }

    if not os.path.isdir(anaktoron_path):
        result.update({"aborted": True, "reason": "anaktoron-missing"})
        return result
    if not os.path.isfile(db_path):
        result.update({"aborted": True, "reason": "db-missing"})
        return result

    poisoned = _detect_poisoned_max_seq_ids(db_path, segment=segment, threshold=threshold)
    if not poisoned:
        return result

    sidecar_map = _read_sidecar_seq_ids(from_sidecar) if from_sidecar else {}
    plan: list[tuple[str, int, int]] = []
    with sqlite3.connect(db_path) as conn:
        cur = conn.cursor()
        for segment_id, old_val in poisoned:
            if from_sidecar:
                if segment_id not in sidecar_map:
                    continue
                new_val = sidecar_map[segment_id]
            else:
                new_val = _compute_heuristic_seq_id(cur, segment_id)
            plan.append((segment_id, old_val, new_val))
            result["before"][segment_id] = old_val
            result["after"][segment_id] = new_val

    if dry_run or not plan:
        return result

    if not assume_yes:
        result.update({"aborted": True, "reason": "confirmation-required"})
        return result

    if backup:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = os.path.join(anaktoron_path, f"chroma.sqlite3.max-seq-id-backup-{stamp}")
        shutil.copy2(db_path, backup_path)
        result["backup"] = backup_path

    close_chroma_handles()
    with sqlite3.connect(db_path) as conn:
        conn.execute("BEGIN")
        try:
            conn.executemany(
                "UPDATE max_seq_id SET seq_id = ? WHERE segment_id = ?",
                [(new_val, segment_id) for segment_id, _old, new_val in plan],
            )
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    remaining = _detect_poisoned_max_seq_ids(db_path, segment=segment, threshold=threshold)
    if remaining:
        raise MaxSeqIdVerificationError(
            f"Post-repair detection still found {len(remaining)} poisoned row(s): "
            f"{[segment_id for segment_id, _ in remaining]}. Backup at {result['backup']}."
        )

    result["segment_repaired"] = [segment_id for segment_id, _old, _new in plan]
    return result


def status(anaktoron_path: Optional[str] = None, collection_name: Optional[str] = None) -> dict:
    anaktoron_path = _get_anaktoron_path(anaktoron_path)
    collection_name = collection_name or _collection_name()
    info = hnsw_capacity_status(anaktoron_path, collection_name)
    return {
        "anaktoron_path": anaktoron_path,
        "collection": collection_name,
        "drawers": info,
        "vector_disabled": bool(info.get("diverged")),
        "repair_command": "mnemion repair --mode rebuild"
        if info.get("diverged")
        else "mnemion repair --mode status",
    }


def _paginate_ids(col, where=None) -> list[str]:
    ids: list[str] = []
    page = 1000
    offset = 0
    while True:
        try:
            result = col.get(where=where, include=[], limit=page, offset=offset)
        except Exception:
            break
        batch_ids = result.get("ids") or []
        if not batch_ids:
            break
        ids.extend(batch_ids)
        offset += len(batch_ids)
        if len(batch_ids) < page:
            break
    return ids


def scan_anaktoron(anaktoron_path: Optional[str] = None, only_wing: Optional[str] = None) -> dict:
    from .chroma_compat import make_persistent_client

    anaktoron_path = _get_anaktoron_path(anaktoron_path)
    client = make_persistent_client(anaktoron_path)
    col = client.get_collection(_collection_name())
    where = {"wing": only_wing} if only_wing else None
    all_ids = _paginate_ids(col, where=where)
    good: set[str] = set()
    bad: set[str] = set()
    for i in range(0, len(all_ids), 100):
        chunk = all_ids[i : i + 100]
        try:
            result = col.get(ids=chunk, include=["documents"])
            got = set(result.get("ids") or [])
            good.update(got)
            bad.update(set(chunk) - got)
        except Exception:
            for drawer_id in chunk:
                try:
                    result = col.get(ids=[drawer_id], include=["documents"])
                    if result.get("ids"):
                        good.add(drawer_id)
                    else:
                        bad.add(drawer_id)
                except Exception:
                    bad.add(drawer_id)
    bad_file = os.path.join(anaktoron_path, "corrupt_ids.txt")
    Path(anaktoron_path).mkdir(parents=True, exist_ok=True)
    with open(bad_file, "w") as f:
        for drawer_id in sorted(bad):
            f.write(drawer_id + "\n")
    return {"good": len(good), "bad": len(bad), "bad_file": bad_file}


def prune_corrupt(anaktoron_path: Optional[str] = None, assume_yes: bool = False) -> dict:
    from .chroma_compat import make_persistent_client

    anaktoron_path = _get_anaktoron_path(anaktoron_path)
    bad_file = os.path.join(anaktoron_path, "corrupt_ids.txt")
    if not os.path.exists(bad_file):
        return {"deleted": 0, "failed": 0, "reason": "no-corrupt-ids-file"}
    with open(bad_file) as f:
        bad_ids = [line.strip() for line in f if line.strip()]
    if not assume_yes:
        return {"deleted": 0, "failed": 0, "dry_run": True, "queued": len(bad_ids)}
    client = make_persistent_client(anaktoron_path)
    col = client.get_collection(_collection_name())
    deleted = 0
    failed = 0
    for i in range(0, len(bad_ids), 100):
        chunk = bad_ids[i : i + 100]
        try:
            col.delete(ids=chunk)
            deleted += len(chunk)
        except Exception:
            for drawer_id in chunk:
                try:
                    col.delete(ids=[drawer_id])
                    deleted += 1
                except Exception:
                    failed += 1
    return {"deleted": deleted, "failed": failed}


def rebuild_index(
    anaktoron_path: Optional[str] = None,
    *,
    confirm_truncation_ok: bool = False,
    backup: bool = True,
) -> dict:
    from .chroma_compat import make_persistent_client, pin_hnsw_threads

    anaktoron_path = _get_anaktoron_path(anaktoron_path)
    if not os.path.isdir(anaktoron_path):
        return {"aborted": True, "reason": "anaktoron-missing", "rebuilt": 0}

    client = make_persistent_client(anaktoron_path)
    collection_name = _collection_name()
    try:
        col = client.get_collection(collection_name)
        total = col.count()
    except Exception as exc:
        return {"aborted": True, "reason": f"open-failed: {exc}", "rebuilt": 0}
    if total == 0:
        return {"aborted": False, "reason": "empty", "rebuilt": 0}

    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict] = []
    offset = 0
    batch_size = 5000
    while offset < total:
        batch = col.get(limit=batch_size, offset=offset, include=["documents", "metadatas"])
        batch_ids = batch.get("ids") or []
        if not batch_ids:
            break
        ids.extend(batch_ids)
        docs.extend(batch.get("documents") or [])
        metas.extend(batch.get("metadatas") or [])
        offset += len(batch_ids)

    check_extraction_safety(anaktoron_path, len(ids), confirm_truncation_ok)

    backup_path = None
    db_path = _db_path(anaktoron_path)
    if backup and os.path.exists(db_path):
        backup_path = f"{db_path}.rebuild-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        shutil.copy2(db_path, backup_path)

    client.delete_collection(collection_name)
    new_col = client.create_collection(collection_name, metadata=DRAWER_HNSW_METADATA)
    pin_hnsw_threads(new_col)
    rebuilt = 0
    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i : i + batch_size]
        new_col.upsert(
            ids=batch_ids,
            documents=docs[i : i + batch_size],
            metadatas=metas[i : i + batch_size],
        )
        rebuilt += len(batch_ids)
    return {"aborted": False, "rebuilt": rebuilt, "backup": backup_path}


def cli_print_status(result: dict) -> None:
    info = result.get("drawers", {})
    print("\n" + "=" * 55)
    print("  Mnemion Repair — Status")
    print("=" * 55 + "\n")
    print(f"  Anaktoron: {result.get('anaktoron_path')}")
    print(f"  Collection: {result.get('collection')}")
    print(f"  SQLite count: {info.get('sqlite_count')}")
    print(f"  HNSW count:   {info.get('hnsw_count')}")
    print(f"  Divergence:   {info.get('divergence')}")
    print(f"  Status:       {info.get('status')}")
    if info.get("message"):
        print(f"  Note:         {info.get('message')}")
    print(f"  Command:      {result.get('repair_command')}\n")

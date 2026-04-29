import pickle
import sqlite3

from mnemion.config import DRAWER_HNSW_METADATA
from mnemion.chroma_compat import (
    BLOB_FIX_MARKER,
    fix_blob_seq_ids,
    hnsw_capacity_status,
)


def _init_blob_db(path):
    path.mkdir(parents=True, exist_ok=True)
    db_path = path / "chroma.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE embeddings (id TEXT, segment_id TEXT, seq_id)")
        conn.execute("CREATE TABLE max_seq_id (segment_id TEXT PRIMARY KEY, seq_id)")
        conn.execute("INSERT INTO embeddings VALUES ('ok', 'seg1', ?)", ((42).to_bytes(8, "big"),))
        conn.execute("INSERT INTO embeddings VALUES ('sysdb', 'seg1', ?)", (b"\x11\x11abcdef",))
        conn.execute("INSERT INTO max_seq_id VALUES ('seg1', ?)", (b"\x11\x11abcdef",))
        conn.commit()
    return db_path


def test_fix_blob_seq_ids_only_converts_legacy_embedding_rows(tmp_path):
    db_path = _init_blob_db(tmp_path)

    fix_blob_seq_ids(str(tmp_path))

    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT id, seq_id, typeof(seq_id) FROM embeddings ORDER BY id"
        ).fetchall()
        max_row = conn.execute("SELECT seq_id, typeof(seq_id) FROM max_seq_id").fetchone()

    assert rows[0] == ("ok", 42, "integer")
    assert rows[1][0] == "sysdb"
    assert rows[1][1] == b"\x11\x11abcdef"
    assert rows[1][2] == "blob"
    assert max_row == (b"\x11\x11abcdef", "blob")
    assert (tmp_path / BLOB_FIX_MARKER).exists()


def test_fix_blob_seq_ids_marker_prevents_repeated_work(tmp_path):
    db_path = _init_blob_db(tmp_path)
    fix_blob_seq_ids(str(tmp_path))

    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "INSERT INTO embeddings VALUES ('later', 'seg1', ?)", ((7).to_bytes(8, "big"),)
        )
        conn.commit()

    fix_blob_seq_ids(str(tmp_path))

    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT seq_id, typeof(seq_id) FROM embeddings WHERE id = 'later'"
        ).fetchone()
    assert row == ((7).to_bytes(8, "big"), "blob")


def test_fix_blob_seq_ids_fresh_or_missing_db_is_noop(tmp_path):
    fix_blob_seq_ids(str(tmp_path / "missing"))
    assert not (tmp_path / "missing" / BLOB_FIX_MARKER).exists()

    fresh = tmp_path / "fresh"
    fresh.mkdir()
    (fresh / "chroma.sqlite3").write_bytes(b"")
    fix_blob_seq_ids(str(fresh))
    assert not (fresh / BLOB_FIX_MARKER).exists()


def test_drawer_hnsw_metadata_has_bloat_guard_values():
    assert DRAWER_HNSW_METADATA == {
        "hnsw:space": "cosine",
        "hnsw:num_threads": 1,
        "hnsw:batch_size": 50_000,
        "hnsw:sync_threshold": 50_000,
    }


def test_hnsw_capacity_status_flags_divergence_without_chroma(tmp_path):
    db_path = tmp_path / "chroma.sqlite3"
    segment_id = "11111111-1111-1111-1111-111111111111"
    collection_id = "collection-1"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE collections (id TEXT PRIMARY KEY, name TEXT)")
        conn.execute("CREATE TABLE segments (id TEXT PRIMARY KEY, collection TEXT, scope TEXT)")
        conn.execute("CREATE TABLE embeddings (id TEXT, segment_id TEXT, seq_id INTEGER)")
        conn.execute("INSERT INTO collections VALUES (?, ?)", (collection_id, "mnemion_drawers"))
        conn.execute("INSERT INTO segments VALUES (?, ?, 'VECTOR')", (segment_id, collection_id))
        conn.executemany(
            "INSERT INTO embeddings VALUES (?, ?, ?)",
            [(f"id{i}", segment_id, i) for i in range(2501)],
        )
        conn.commit()

    segment_dir = tmp_path / segment_id
    segment_dir.mkdir()
    with open(segment_dir / "index_metadata.pickle", "wb") as f:
        pickle.dump({"id_to_label": {"id0": 0}}, f)

    status = hnsw_capacity_status(str(tmp_path), "mnemion_drawers")

    assert status["status"] == "diverged"
    assert status["sqlite_count"] == 2501
    assert status["hnsw_count"] == 1
    assert status["diverged"] is True

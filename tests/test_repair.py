import sqlite3
from pathlib import Path

import pytest

from mnemion.repair import (
    MAX_SEQ_ID_SANITY_THRESHOLD,
    MaxSeqIdVerificationError,
    check_extraction_safety,
    repair_max_seq_id,
    status,
    TruncationDetected,
)


def _init_max_seq_db(path):
    path.mkdir(parents=True, exist_ok=True)
    db_path = path / "chroma.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE collections (id TEXT PRIMARY KEY, name TEXT)")
        conn.execute("CREATE TABLE segments (id TEXT PRIMARY KEY, collection TEXT, scope TEXT)")
        conn.execute("CREATE TABLE embeddings (id TEXT, segment_id TEXT, seq_id INTEGER)")
        conn.execute("CREATE TABLE max_seq_id (segment_id TEXT PRIMARY KEY, seq_id)")
        conn.execute("INSERT INTO collections VALUES ('c1', 'mnemion_drawers')")
        conn.execute("INSERT INTO segments VALUES ('segA', 'c1', 'METADATA')")
        conn.execute("INSERT INTO segments VALUES ('segB', 'c1', 'VECTOR')")
        conn.executemany(
            "INSERT INTO embeddings VALUES (?, ?, ?)",
            [("a1", "segA", 10), ("a2", "segA", 15), ("b1", "segB", 12)],
        )
        conn.execute(
            "INSERT INTO max_seq_id VALUES ('segA', ?)", (MAX_SEQ_ID_SANITY_THRESHOLD + 1,)
        )
        conn.execute("INSERT INTO max_seq_id VALUES ('segB', 12)")
        conn.commit()
    return db_path


def test_repair_max_seq_id_dry_run_does_not_mutate(tmp_path):
    db_path = _init_max_seq_db(tmp_path)

    result = repair_max_seq_id(str(tmp_path), dry_run=True)

    with sqlite3.connect(db_path) as conn:
        row = conn.execute("SELECT seq_id FROM max_seq_id WHERE segment_id = 'segA'").fetchone()
    assert result["dry_run"] is True
    assert result["before"] == {"segA": MAX_SEQ_ID_SANITY_THRESHOLD + 1}
    assert row[0] == MAX_SEQ_ID_SANITY_THRESHOLD + 1


def test_repair_max_seq_id_repairs_poisoned_rows_and_creates_backup(tmp_path):
    db_path = _init_max_seq_db(tmp_path)

    result = repair_max_seq_id(str(tmp_path), assume_yes=True)

    with sqlite3.connect(db_path) as conn:
        rows = dict(conn.execute("SELECT segment_id, seq_id FROM max_seq_id").fetchall())
    assert rows["segA"] == 15
    assert rows["segB"] == 12
    assert result["segment_repaired"] == ["segA"]
    assert result["backup"]
    assert Path(result["backup"]).exists()


def test_repair_max_seq_id_segment_filter(tmp_path):
    db_path = _init_max_seq_db(tmp_path)

    result = repair_max_seq_id(str(tmp_path), segment="segB", assume_yes=True)

    with sqlite3.connect(db_path) as conn:
        row = conn.execute("SELECT seq_id FROM max_seq_id WHERE segment_id = 'segA'").fetchone()
    assert result["segment_repaired"] == []
    assert row[0] == MAX_SEQ_ID_SANITY_THRESHOLD + 1


def test_repair_max_seq_id_post_verification_fails_loudly(tmp_path):
    db_path = _init_max_seq_db(tmp_path)

    with sqlite3.connect(db_path) as conn:
        conn.execute("UPDATE embeddings SET seq_id = ?", (MAX_SEQ_ID_SANITY_THRESHOLD + 2,))
        conn.commit()

    with pytest.raises(MaxSeqIdVerificationError):
        repair_max_seq_id(str(tmp_path), assume_yes=True, backup=False)


def test_extraction_safety_aborts_when_sqlite_has_more_drawers(tmp_path):
    db_path = tmp_path / "chroma.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE collections (id TEXT PRIMARY KEY, name TEXT)")
        conn.execute("CREATE TABLE segments (id TEXT PRIMARY KEY, collection TEXT)")
        conn.execute("CREATE TABLE embeddings (id TEXT, segment_id TEXT)")
        conn.execute("INSERT INTO collections VALUES ('c1', 'mnemion_drawers')")
        conn.execute("INSERT INTO segments VALUES ('segA', 'c1')")
        conn.executemany(
            "INSERT INTO embeddings VALUES (?, 'segA')",
            [(f"id{i}",) for i in range(3)],
        )
        conn.commit()

    with pytest.raises(TruncationDetected):
        check_extraction_safety(str(tmp_path), extracted=2)


def test_repair_status_returns_health_shape_for_missing_anaktoron(tmp_path):
    result = status(str(tmp_path / "missing"))

    assert result["vector_disabled"] is False
    assert result["drawers"]["status"] == "unknown"
    assert result["repair_command"] == "mnemion repair --mode status"

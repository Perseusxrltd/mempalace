import os
import json
import tempfile
import pytest
from mnemion.normalize import normalize


def test_plain_text():
    f = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    f.write("Hello world\nSecond line\n")
    f.close()
    result = normalize(f.name)
    assert "Hello world" in result
    os.unlink(f.name)


def test_claude_json():
    data = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]
    f = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    json.dump(data, f)
    f.close()
    result = normalize(f.name)
    assert "Hi" in result
    os.unlink(f.name)


def test_empty():
    f = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    f.close()
    result = normalize(f.name)
    assert result.strip() == ""
    os.unlink(f.name)


def _write_temp(content: str, suffix: str = ".jsonl") -> str:
    f = tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8")
    f.write(content)
    f.close()
    return f.name


def test_gemini_jsonl_requires_metadata_and_discards_pre_metadata():
    path = _write_temp(
        "\n".join(
            [
                json.dumps({"type": "user", "message": {"content": "discard me"}}),
                json.dumps({"type": "session_metadata", "model": "gemini"}),
                json.dumps(
                    {
                        "type": "user",
                        "message": {"content": [{"text": "Hello"}, {"text": "Gemini"}]},
                    }
                ),
                json.dumps({"type": "message_update", "message": {"content": "noise"}}),
                json.dumps({"type": "gemini", "message": {"content": "Hi back"}}),
            ]
        )
    )
    try:
        result = normalize(path)
        assert "discard me" not in result
        assert "> Hello Gemini" in result
        assert "Hi back" in result
        assert "noise" not in result
    finally:
        os.unlink(path)


def test_claude_code_preserves_tool_use_and_merges_tool_result():
    path = _write_temp(
        "\n".join(
            [
                json.dumps({"type": "user", "message": {"content": "Inspect the file"}}),
                json.dumps(
                    {
                        "type": "assistant",
                        "message": {
                            "content": [
                                {"type": "text", "text": "I will inspect it."},
                                {
                                    "type": "tool_use",
                                    "name": "Read",
                                    "input": {"file_path": "src/app.py", "limit": 5},
                                },
                            ]
                        },
                    }
                ),
                json.dumps(
                    {
                        "type": "user",
                        "message": {
                            "content": [
                                {
                                    "type": "tool_result",
                                    "content": "def app():\n    return 'ok'",
                                }
                            ]
                        },
                    }
                ),
                json.dumps({"type": "assistant", "message": {"content": "The file returns ok."}}),
            ]
        )
    )
    try:
        result = normalize(path)
        assert "Tool use: Read src/app.py" in result
        assert "Tool result:" in result
        assert "def app()" in result
        assert "The file returns ok." in result
    finally:
        os.unlink(path)


def test_slack_preserves_speaker_ids():
    data = [
        {"type": "message", "user": "U123", "text": "hello"},
        {"type": "message", "user": "U456", "text": "hi"},
    ]
    path = _write_temp(json.dumps(data), suffix=".json")
    try:
        result = normalize(path)
        assert "[U123] hello" in result
        assert "[U456] hi" in result
        assert "Slack provenance:" in result
    finally:
        os.unlink(path)


def test_file_size_guard(monkeypatch):
    path = _write_temp("small", suffix=".txt")
    monkeypatch.setattr(os.path, "getsize", lambda _path: 501 * 1024 * 1024)
    try:
        with pytest.raises(ValueError, match="too large"):
            normalize(path)
    finally:
        os.unlink(path)

#!/bin/bash
# MemPalace vLLM startup script
# Serves Gemma 4 locally for contradiction detection — no cloud, no API key.
#
# IMPORTANT: This script hardcodes PATH because WSL often inherits a broken
# Windows PATH (especially with nvm). Do not remove the export below.
#
# Configuration:
#   VLLM_MODEL   — path to your local model weights
#   VLLM_PORT    — port to serve on (default: 8000)
#   LOG          — log file path
#
# To start:  bash ~/run_vllm.sh &
# To check:  tail -f ~/vllm.log
# To stop:   pkill -f "vllm serve"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

VLLM_MODEL="${VLLM_MODEL:-$HOME/models/gemma-4-E4B-it-FP8}"
VLLM_PORT="${VLLM_PORT:-8000}"
LOG="${LOG:-$HOME/vllm.log}"
VLLM_BIN="$HOME/vllm-env/bin/vllm"

# ── Validate ──────────────────────────────────────────────────────────────────
if [ ! -f "$VLLM_BIN" ]; then
    echo "[ERROR] vLLM not found at $VLLM_BIN"
    echo "Install: python3 -m venv ~/vllm-env && ~/vllm-env/bin/pip install vllm"
    exit 1
fi

if [ ! -d "$VLLM_MODEL" ]; then
    echo "[ERROR] Model not found at $VLLM_MODEL"
    echo "Set VLLM_MODEL=/path/to/your/model and retry"
    exit 1
fi

# ── Kill existing instance ────────────────────────────────────────────────────
pkill -f "vllm serve" 2>/dev/null && echo "[$(date '+%H:%M:%S')] Killed existing vLLM instance"
sleep 1

# ── Launch ────────────────────────────────────────────────────────────────────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting vLLM on port $VLLM_PORT" > "$LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Model: $VLLM_MODEL" >> "$LOG"

exec env VLLM_GPU_MEMORY_UTILIZATION=0.9 \
  "$VLLM_BIN" serve "$VLLM_MODEL" \
  --quantization compressed-tensors \
  --enable-prefix-caching \
  --max-model-len 8192 \
  --port "$VLLM_PORT" \
  --host 0.0.0.0 \
  --trust-remote-code \
  --enforce-eager >> "$LOG" 2>&1

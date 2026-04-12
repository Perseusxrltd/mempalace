"""Allow running as: python -m mnemion"""

import sys

# Force UTF-8 on stdout/stderr so Unicode chars (─ ✓ → ≥ etc.) don't crash
# on Windows terminals that default to cp1252. reconfigure() updates in-place
# so existing logging handlers see the same encoding.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from .cli import main

main()

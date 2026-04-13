import json
import os
import threading
from pathlib import Path
from datetime import datetime

SESSION_FILE = Path(os.path.expanduser("~/.mnemion/session_history.json"))
MAX_HISTORY = 5
_history_lock = threading.Lock()

class RoomPredictor:
    """
    A JEPA-style predictor that takes a sequence of embeddings (recent context)
    and predicts the next 'latent state' (Room/Topic).

    Requires torch — only instantiate when torch is available.
    """
    def __init__(self, input_dim=384, hidden_dim=256):
        import torch.nn as nn

        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.out = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        # x: (B, T, D)
        lstm_out, _ = self.lstm(x)
        last_out = lstm_out[:, -1, :] # (B, hidden_dim)
        return self.out(last_out)

def record_activity(drawer_id, embedding=None):
    """Log a drawer access to the session history. Thread-safe."""
    with _history_lock:
        history = []
        if SESSION_FILE.exists():
            try:
                with open(SESSION_FILE, "r") as f:
                    history = json.load(f)
            except Exception:
                pass

        entry = {
            "id": drawer_id,
            "timestamp": datetime.now().isoformat()
        }
        if embedding is not None:
            entry["embedding"] = embedding

        history.append(entry)
        # Keep last N
        history = history[-MAX_HISTORY:]

        with open(SESSION_FILE, "w") as f:
            json.dump(history, f)

def predict_next_context(current_embeddings):
    """
    Takes a list of recent embeddings and predicts the 'next' embedding.
    This can be used to pre-fetch or suggest Rooms.
    """
    if len(current_embeddings) < 2:
        return None

    import torch

    # In a real lab scenario, we'd load a pre-trained model here.
    # For this prototype, we'll implement a 'Mean-Drift' predictor
    # which is a zero-order JEPA approximation.

    z = torch.tensor(current_embeddings) # (T, D)
    # Simple linear extrapolation of the latent trajectory
    diffs = z[1:] - z[:-1]
    avg_drift = diffs.mean(dim=0)
    prediction = z[-1] + avg_drift

    return prediction.tolist()


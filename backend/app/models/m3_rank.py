import hashlib
import math
import os
import joblib
import numpy as np
from functools import lru_cache
from app.schemas import RankSignal

_MODEL_PATH = "app/engine/m3_rank_model.joblib"

@lru_cache(maxsize=1)
def _load_model():
    if not os.path.exists(_MODEL_PATH):
        raise FileNotFoundError(f"M3 model not found at {_MODEL_PATH}")
    clf = joblib.load(_MODEL_PATH)
    print(f"[M3] Model loaded from {_MODEL_PATH}")
    return clf

def _rider_seed(rider_id: str, salt: int = 17) -> float:
    h = int(hashlib.md5(f"{rider_id}{salt}".encode()).hexdigest(), 16)
    return (h % 100_000) / 100_000.0

def _sv(seed: float, offset: float) -> float:
    return abs(math.sin(seed * 3_571 + offset * 8_221 + 43))

def run_rank_monitor(
    rider_id: str,
    weather_score: float,
    activity_score: float,
) -> RankSignal:
    seed = _rider_seed(rider_id)

    # Simulate rank values (replace with platform data feed in production)
    rank_before = int(50 + _sv(seed, 1) * 49)
    disruption_factor = min((weather_score + activity_score) / 200.0, 1.0)
    rank_drop_pct = round(disruption_factor * 48 + _sv(seed, 2) * 8, 1)
    rank_current = max(1, int(rank_before * (1 - rank_drop_pct / 100)))

    # Hours active proxy from disruption factor
    hours_active = round(2 + disruption_factor * 4, 1)

    # ML scoring
    try:
        clf = _load_model()
        effective_weather = max(weather_score, activity_score)
        features = np.array(
            [[effective_weather, activity_score, rank_before, rank_drop_pct, hours_active]],
            dtype=np.float32
            )
        ml_prob  = float(clf.predict_proba(features)[0][1])
        ml_score = round(ml_prob * 100, 2)
        ml_available = True
    except Exception:
        ml_available = False
        # Fallback rule-based score
        if rank_drop_pct > 30:   ml_score = 78 + _sv(seed, 3) * 22
        elif rank_drop_pct > 15: ml_score = 48 + _sv(seed, 3) * 30
        elif rank_drop_pct > 5:  ml_score = 18 + _sv(seed, 3) * 30
        else:                    ml_score = _sv(seed, 3) * 18
        ml_score = round(min(ml_score, 100.0), 2)

    triggered = rank_drop_pct > 15 and ml_score >= 50
    model_tag = "[ML]" if ml_available else "[fallback]"

    details = (
        f"{model_tag} Rider {rider_id}: rank {rank_before} → {rank_current} "
        f"({rank_drop_pct}% drop) | ML score {ml_score}"
        if triggered
        else f"{model_tag} Rider {rider_id}: rank stable {rank_before} → {rank_current} "
             f"({rank_drop_pct}% — normal variance)"
    )

    return RankSignal(
        rider_id=rider_id,
        rank_before=rank_before,
        rank_current=rank_current,
        rank_drop_pct=rank_drop_pct,
        score=ml_score,
        triggered=triggered,
        details=details,
    )
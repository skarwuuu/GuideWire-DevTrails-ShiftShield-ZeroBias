import os
import joblib
import numpy as np
from datetime import datetime, timezone
from functools import lru_cache
from app.schemas import ShiftSignal, ShiftType

_MODEL_PATH = os.getenv("SHIFT_MODEL_PATH", "app/engine/shift_model.joblib")

_HOURLY_RATES: dict[ShiftType, tuple[float, float]] = {
    "MORNING":   (80,  120),
    "AFTERNOON": (90,  130),
    "EVENING":   (120, 180),
    "NIGHT":     (70,  100),
}

_BASE_OPH: dict[ShiftType, float] = {
    "MORNING":   2.1,
    "AFTERNOON": 3.4,
    "EVENING":   5.2,
    "NIGHT":     1.6,
}

_HOUR_RANGES: dict[ShiftType, tuple[int, int]] = {
    "MORNING":   (6,  12),
    "AFTERNOON": (12, 17),
    "EVENING":   (17, 22),
    "NIGHT":     (22, 24),
}


@lru_cache(maxsize=1)
def _load_model() -> dict:
    if not os.path.exists(_MODEL_PATH):
        raise FileNotFoundError(f"M4 model not found at {_MODEL_PATH}")
    m = joblib.load(_MODEL_PATH)
    print(f"[M4] Model loaded from {_MODEL_PATH}")
    return m


def _classify_shift(hour: int) -> ShiftType:
    if 6  <= hour < 12: return "MORNING"
    if 12 <= hour < 17: return "AFTERNOON"
    if 17 <= hour < 22: return "EVENING"
    return "NIGHT"


def run_shift_classifier(
    rider_id: str,
    shift_start: str,
    *,
    zone_type: str = "metro_suburb",
    weather_flag: int = 0,
    avg_orders_per_shift: float = 12.0,
    past_3_shift_avg: float = 11.5,
    consistency_score: float = 55.0,
) -> ShiftSignal:

    try:
        start_dt = datetime.fromisoformat(shift_start.replace("Z", "+00:00"))
    except Exception:
        start_dt = datetime.now(timezone.utc)

    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    now         = datetime.now(timezone.utc)
    shift_type  = _classify_shift(start_dt.hour)
    day_of_week = start_dt.weekday()
    hour        = start_dt.hour

    raw_hours    = (now - start_dt).total_seconds() / 3600
    active_hours = round(float(np.clip(raw_hours if raw_hours >= 0.02 else 3.5, 0.1, 8.0)), 2)

    lo, hi       = _HOURLY_RATES[shift_type]
    hourly_rate  = (lo + hi) / 2
    base_oph     = _BASE_OPH[shift_type]
    weather_order_factor = {0: 1.0, 1: 0.5, 2: 0.2}.get(weather_flag, 1.0)
    expected_orders = base_oph * active_hours * weather_order_factor
    expected_earnings = round(hourly_rate * active_hours, 2)

    # ML scoring
    try:
        m         = _load_model()
        le        = m["le_shift"]
        clf       = m["clf"]
        shift_enc = int(le.transform([shift_type])[0])

        features  = np.array([[
            hour, day_of_week, shift_enc, weather_flag,
            active_hours, expected_orders, consistency_score
        ]], dtype=np.float32)

        ml_prob      = float(clf.predict_proba(features)[0][1])
        ml_score     = round(ml_prob * 100, 2)
        ml_available = True

    except Exception:
        ml_available = False
        # Fallback rule-based
        if active_hours >= 3:
            ml_score = min(75 + (active_hours - 3) * 5, 100)
        elif active_hours >= 1:
            ml_score = 40 + active_hours * 15
        else:
            ml_score = 15 + active_hours * 25
        if shift_type == "EVENING":
            ml_score = min(ml_score * 1.1, 100)
        ml_score = round(ml_score, 2)

    triggered = active_hours >= 1 and ml_score >= 40
    model_tag = "[ML]" if ml_available else "[fallback]"
    weather_map = {0: "clear", 1: "light rain", 2: "heavy rain"}

    details = (
        f"{model_tag} Rider {rider_id}: {shift_type} | "
        f"{active_hours:.1f}hrs | ₹{expected_earnings:.0f} expected | "
        f"weather: {weather_map.get(weather_flag, 'unknown')} | "
        f"score: {ml_score}"
    )

    return ShiftSignal(
        rider_id=rider_id,
        shift_start=shift_start,
        shift_type=shift_type,
        hours_active=active_hours,
        expected_earnings=expected_earnings,
        score=ml_score,
        triggered=triggered,
        details=details,
    )
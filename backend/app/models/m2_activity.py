import hashlib
import math
import joblib
import numpy as np
from pathlib import Path
from app.schemas import ActivitySignal


# ==============================
# 🔹 ORIGINAL CORE (PRESERVED)
# ==============================
def _rider_seed(rider_id: str) -> float:
    h = int(hashlib.sha256(rider_id.encode()).hexdigest(), 16)
    return (h % 100_000) / 100_000.0


def _sv(seed: float, offset: float) -> float:
    return abs(math.sin(seed * 7919 + offset * 1301 + 17))


# ==============================
# 🔹 LOAD ML MODEL
# ==============================
BASE = Path(__file__).parent.parent / "engine"

try:
    MODEL = joblib.load(BASE / "shiftshield_rf_calibrated.joblib")
    SCALER = joblib.load(BASE / "scaler.joblib")
    MODEL_READY = True
except Exception:
    MODEL_READY = False


FEATURES = [
    "login_consistency", "acceptance_ratio", "completion_ratio", "idle_ratio",
    "proximity_to_event", "time_since_last_order",
    "sudden_logout_flag", "zero_acceptance_flag", "high_rejection_flag",
    "delivery_drop", "bonus_loss_flag", "estimated_income_loss",
]


# ==============================
# 🔹 MAIN FUNCTION (HYBRID)
# ==============================
def run_activity_validator(
    rider_id: str,
    weather_score: float,
    disruption_score: float,
) -> ActivitySignal:

    seed = _rider_seed(rider_id)

    # ----------------------------------
    # 🔹 ORIGINAL SIMULATION (UNCHANGED)
    # ----------------------------------
    disruption_factor = min((weather_score + disruption_score) / 200.0, 1.0)

    last_ping = int(5 + disruption_factor * 90 + _sv(seed, 1) * 15)
    orders_attempted = int((1 - disruption_factor * 0.85) * _sv(seed, 2) * 9)
    orders_completed = int(orders_attempted * max(0, 1 - disruption_factor * 0.7))

    completion_rate = (
        round(orders_completed / orders_attempted, 2)
        if orders_attempted > 0 else 0.0
    )

    # ----------------------------------
    # 🔹 ORIGINAL RULE SCORE (PRESERVED)
    # ----------------------------------
    rule_score = 0.0

    if last_ping > 60:
        rule_score += 40
    elif last_ping > 30:
        rule_score += 20

    if orders_attempted == 0:
        rule_score += 30
    elif orders_attempted <= 2:
        rule_score += 15

    if completion_rate < 0.3:
        rule_score += 30
    elif completion_rate < 0.6:
        rule_score += 15

    rule_score = round(min(rule_score, 100.0), 2)

    # ----------------------------------
    # 🔹 NEW ML FEATURES (ADDED)
    # ----------------------------------
    login_consistency = max(0.2, 1 - disruption_factor * 0.6)
    acceptance_ratio = orders_attempted / (orders_attempted + 2)
    completion_ratio = completion_rate
    idle_ratio = min(0.95, disruption_factor * 0.9)

    proximity_to_event = round(0.5 + disruption_factor * 5, 2)
    time_since_last_order = last_ping

    sudden_logout_flag = 1 if last_ping > 60 else 0
    zero_acceptance_flag = 1 if orders_attempted == 0 else 0
    high_rejection_flag = 1 if acceptance_ratio < 0.3 else 0

    delivery_drop = min(1.0, 1 - completion_ratio)
    bonus_loss_flag = 1 if completion_ratio < 0.5 else 0
    estimated_income_loss = round(delivery_drop * 400 + (150 if bonus_loss_flag else 0), 2)

    feature_dict = {
        "login_consistency": login_consistency,
        "acceptance_ratio": acceptance_ratio,
        "completion_ratio": completion_ratio,
        "idle_ratio": idle_ratio,
        "proximity_to_event": proximity_to_event,
        "time_since_last_order": time_since_last_order,
        "sudden_logout_flag": sudden_logout_flag,
        "zero_acceptance_flag": zero_acceptance_flag,
        "high_rejection_flag": high_rejection_flag,
        "delivery_drop": delivery_drop,
        "bonus_loss_flag": bonus_loss_flag,
        "estimated_income_loss": estimated_income_loss,
    }

    # ----------------------------------
    # 🔹 ML SCORING (ADDED)
    # ----------------------------------
    if MODEL_READY:
        vec = np.array([[feature_dict[f] for f in FEATURES]], dtype=np.float32)
        vec_scaled = SCALER.transform(vec)
        ml_proba = float(MODEL.predict_proba(vec_scaled)[0][1])
        ml_score = ml_proba * 100
    else:
        ml_score = rule_score  # fallback

    # ----------------------------------
    # 🔹 HYBRID DECISION (BEST PRACTICE)
    # ----------------------------------
    final_score = round(0.6 * ml_score + 0.4 * rule_score, 2)

    if final_score >= 75:
        decision = "AUTO_APPROVED"
    elif final_score >= 45:
        decision = "FLAGGED_FOR_REVIEW"
    else:
        decision = "AUTO_REJECTED"

    triggered = decision == "AUTO_APPROVED"

    # ----------------------------------
    # 🔹 DETAILS (ENHANCED)
    # ----------------------------------
    details = (
        f"Rider {rider_id} | Rule={rule_score} | ML={round(ml_score,2)} | Final={final_score} | "
        f"{orders_completed}/{orders_attempted} orders | idle={round(idle_ratio*100)}%"
    )

    # ----------------------------------
    # 🔹 FINAL OUTPUT
    # ----------------------------------
    return ActivitySignal(
        rider_id=rider_id,
        last_app_ping_minutes_ago=last_ping,
        orders_attempted=orders_attempted,
        orders_completed=orders_completed,
        completion_rate=completion_rate,
        score=final_score,
        triggered=triggered,
        details=details,
    )
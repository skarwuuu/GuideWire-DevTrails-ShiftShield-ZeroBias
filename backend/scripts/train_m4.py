import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

RANDOM_SEED = 42
N_SAMPLES   = 4_000
MODEL_PATH  = "app/engine/shift_model.joblib"

SHIFT_TYPES = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"]

# Orders per hour by shift type
_BASE_OPH = {
    "MORNING":   2.1,
    "AFTERNOON": 3.4,
    "EVENING":   5.2,
    "NIGHT":     1.6,
}


def generate_data(n: int, seed: int):
    rng = np.random.default_rng(seed)
    X   = np.zeros((n, 7), dtype=np.float32)
    y   = np.zeros(n, dtype=np.int32)

    le = LabelEncoder()
    le.fit(SHIFT_TYPES)

    for i in range(n):
        scenario   = rng.integers(0, 4)
        shift_type = rng.choice(SHIFT_TYPES)
        shift_enc  = int(le.transform([shift_type])[0])
        day_of_week= rng.integers(0, 7)
        base_oph   = _BASE_OPH[shift_type]

        # Hour based on shift type
        hour_ranges = {
            "MORNING":   (6,  12),
            "AFTERNOON": (12, 17),
            "EVENING":   (17, 22),
            "NIGHT":     (22, 24),
        }
        lo, hi = hour_ranges[shift_type]
        hour   = rng.integers(lo, hi)

        if scenario == 0:
            weather_flag      = rng.integers(1, 3)
            active_hours      = rng.uniform(0.5, 8)       # was (2, 8) — now includes early shifts
            expected_orders   = base_oph * active_hours * rng.uniform(0.1, 0.4)
            consistency_score = rng.uniform(40, 90)
            y[i] = 1

        elif scenario == 1:
            # Normal productive shift
            weather_flag      = 0
            active_hours      = rng.uniform(2, 8)
            expected_orders   = base_oph * active_hours * rng.uniform(0.8, 1.2)
            consistency_score = rng.uniform(50, 95)
            y[i] = 0

        elif scenario == 2:
            # Fraud — claims disruption but shift just started
            weather_flag      = rng.integers(1, 3)
            active_hours      = rng.uniform(0.1, 0.8)    # barely started
            expected_orders   = base_oph * active_hours
            consistency_score = rng.uniform(20, 50)
            y[i] = 0

        else:
            # Partial disruption — borderline
            weather_flag      = 1
            active_hours      = rng.uniform(1, 4)
            expected_orders   = base_oph * active_hours * rng.uniform(0.4, 0.7)
            consistency_score = rng.uniform(30, 70)
            y[i] = 0

        X[i] = [hour, day_of_week, shift_enc, weather_flag,
                active_hours, expected_orders, consistency_score]

    return X, y, le


def train():
    print("[M4 Train] Generating training data...")
    X, y, le = generate_data(N_SAMPLES, RANDOM_SEED)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    print(f"[M4 Train] Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"[M4 Train] Genuine loss: {y_train.mean():.2%}")

    base = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.8,
        random_state=RANDOM_SEED,
    )
    clf = CalibratedClassifierCV(base, method="isotonic", cv=5)
    clf.fit(X_train, y_train)

    y_pred  = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)

    print("\n[M4 Train] Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Income Loss"]))
    print(f"[M4 Train] ROC-AUC: {auc:.4f}")

    # Save model + label encoder together
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"clf": clf, "le_shift": le}, MODEL_PATH)
    print(f"[M4 Train] Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    train()
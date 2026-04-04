"""
Train M2 Activity Validator model.
Run: python -m scripts.train_m2

Features: [login_consistency, acceptance_ratio, completion_ratio, 
           idle_ratio, proximity_to_event, time_since_last_order,
           sudden_logout_flag, zero_acceptance_flag, high_rejection_flag,
           delivery_drop, bonus_loss_flag, estimated_income_loss]
Label: 1 = genuine activity drop due to disruption, 0 = normal/fraud
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline

RANDOM_SEED = 42
N_SAMPLES   = 4_000
MODEL_PATH  = "app/engine/shiftshield_rf_calibrated.joblib"
SCALER_PATH = "app/engine/scaler.joblib"


def generate_data(n: int, seed: int):
    rng = np.random.default_rng(seed)
    X   = np.zeros((n, 12), dtype=np.float32)
    y   = np.zeros(n, dtype=np.int32)

    for i in range(n):
        scenario = rng.integers(0, 4)

        if scenario == 0:
            # Genuine disruption — low activity, high idle, long offline
            login_consistency   = rng.uniform(0.1, 0.4)
            acceptance_ratio    = rng.uniform(0.0, 0.3)
            completion_ratio    = rng.uniform(0.0, 0.3)
            idle_ratio          = rng.uniform(0.6, 0.95)
            proximity_to_event  = rng.uniform(3.0, 5.5)
            time_since_last     = rng.integers(60, 110)
            sudden_logout       = 1
            zero_acceptance     = 1 if acceptance_ratio < 0.1 else 0
            high_rejection      = 1 if acceptance_ratio < 0.3 else 0
            delivery_drop       = rng.uniform(0.6, 1.0)
            bonus_loss          = 1
            income_loss         = round(delivery_drop * 400 + 150, 2)
            y[i] = 1

        elif scenario == 1:
            # Normal productive shift
            login_consistency   = rng.uniform(0.7, 1.0)
            acceptance_ratio    = rng.uniform(0.6, 1.0)
            completion_ratio    = rng.uniform(0.6, 1.0)
            idle_ratio          = rng.uniform(0.05, 0.3)
            proximity_to_event  = rng.uniform(0.0, 1.5)
            time_since_last     = rng.integers(5, 25)
            sudden_logout       = 0
            zero_acceptance     = 0
            high_rejection      = 0
            delivery_drop       = rng.uniform(0.0, 0.2)
            bonus_loss          = 0
            income_loss         = round(delivery_drop * 400, 2)
            y[i] = 0

        elif scenario == 2:
            # Fraud — claims disruption but login consistent, orders normal
            login_consistency   = rng.uniform(0.7, 1.0)   # fraud tell
            acceptance_ratio    = rng.uniform(0.5, 0.9)   # fraud tell
            completion_ratio    = rng.uniform(0.5, 0.9)   # fraud tell
            idle_ratio          = rng.uniform(0.05, 0.25) # fraud tell
            proximity_to_event  = rng.uniform(3.0, 5.5)
            time_since_last     = rng.integers(5, 20)      # fraud tell
            sudden_logout       = 0
            zero_acceptance     = 0
            high_rejection      = 0
            delivery_drop       = rng.uniform(0.0, 0.2)
            bonus_loss          = 0
            income_loss         = round(delivery_drop * 400, 2)
            y[i] = 0

        else:
            # Borderline — some activity drop but not conclusive
            login_consistency   = rng.uniform(0.3, 0.6)
            acceptance_ratio    = rng.uniform(0.2, 0.5)
            completion_ratio    = rng.uniform(0.2, 0.5)
            idle_ratio          = rng.uniform(0.3, 0.6)
            proximity_to_event  = rng.uniform(1.5, 3.5)
            time_since_last     = rng.integers(25, 60)
            sudden_logout       = 0
            zero_acceptance     = 0
            high_rejection      = 1 if acceptance_ratio < 0.3 else 0
            delivery_drop       = rng.uniform(0.2, 0.5)
            bonus_loss          = 1 if completion_ratio < 0.5 else 0
            income_loss         = round(delivery_drop * 400 + (150 if bonus_loss else 0), 2)
            y[i] = 0

        X[i] = [
            login_consistency, acceptance_ratio, completion_ratio,
            idle_ratio, proximity_to_event, time_since_last,
            sudden_logout, zero_acceptance, high_rejection,
            delivery_drop, bonus_loss, income_loss,
        ]

    return X, y


def train():
    print("[M2 Train] Generating training data...")
    X, y = generate_data(N_SAMPLES, RANDOM_SEED)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    print(f"[M2 Train] Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"[M2 Train] Genuine disruption: {y_train.mean():.2%}")

    # Scale features
    scaler  = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    base = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        random_state=RANDOM_SEED,
    )
    clf = CalibratedClassifierCV(base, method="sigmoid", cv=5)
    clf.fit(X_train_scaled, y_train)

    y_pred  = clf.predict(X_test_scaled)
    y_proba = clf.predict_proba(X_test_scaled)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)

    print("\n[M2 Train] Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal/Fraud", "Genuine Drop"]))
    print(f"[M2 Train] ROC-AUC: {auc:.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"[M2 Train] Model saved → {MODEL_PATH}")
    print(f"[M2 Train] Scaler saved → {SCALER_PATH}")


if __name__ == "__main__":
    train()
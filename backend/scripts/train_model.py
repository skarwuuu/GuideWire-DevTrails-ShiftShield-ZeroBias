"""
Features: [m1_score, m2_score, m3_score, m4_score, m5_score]
Label: 1 = legitimate claim, 0 = fraud / no disruption
"""
import os
import json
import datetime
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
RANDOM_SEED  = 42
N_SAMPLES    = 5_000
MODEL_PATH   = "app/engine/scoring_model.joblib"
HISTORY_DIR  = "app/engine/model_history"
HISTORY_FILE = os.path.join(HISTORY_DIR, "training_history.json")
def generate_training_data(n: int, seed: int):
    rng = np.random.default_rng(seed)
    X = np.zeros((n, 5), dtype=np.float32)
    y = np.zeros(n, dtype=np.int32)
    for i in range(n):
        scenario = rng.integers(0, 6)
        if scenario == 0:
            base = rng.uniform(65, 100)
            X[i] = np.clip([
                base + rng.normal(0, 5),
                base + rng.normal(0, 8),
                base + rng.normal(0, 6),
                base + rng.normal(0, 7),
                base + rng.normal(0, 5),
            ], 0, 100)
            y[i] = 1
        elif scenario == 1:
            base = rng.uniform(70, 100)
            X[i] = np.clip([
                base + rng.normal(0, 5),
                base + rng.normal(0, 8),
                base + rng.normal(0, 6),
                rng.uniform(15, 45),
                base + rng.normal(0, 5),
            ], 0, 100)
            y[i] = 1
        elif scenario == 2:
            X[i] = np.clip([
                rng.uniform(70, 100),
                rng.uniform(5,  30),
                rng.uniform(5,  25),
                rng.uniform(60, 90),
                rng.uniform(60, 90),
            ], 0, 100)
            y[i] = 0
        elif scenario == 3:
            n_active   = rng.integers(2, 4)
            active_idx = rng.choice(5, n_active, replace=False)
            scores     = rng.uniform(5, 35, 5)
            scores[active_idx] = rng.uniform(55, 90, n_active)
            X[i] = np.clip(scores, 0, 100)
            y[i] = 0
        elif scenario == 4:
            # No disruption — all signals low
            base = rng.uniform(0, 35)
            X[i] = np.clip([
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
                base + rng.normal(0, 8),
            ], 0, 100)
            y[i] = 0

        else:
            # Bandh on clear weather day — M1/M2 low, M3/M4/M5 high
            X[i] = np.clip([
                rng.uniform(0,  35),    # m1 LOW — clear weather
                rng.uniform(20, 50),    # m2 MODERATE — some activity drop
                rng.uniform(75, 100),   # m3 HIGH — rank dropped
                rng.uniform(75, 100),   # m4 HIGH — shift disrupted
                rng.uniform(75, 100),   # m5 HIGH — bandh confirmed
            ], 0, 100)
            y[i] = 1
    return X, y
def save_history(record: dict):
    os.makedirs(HISTORY_DIR, exist_ok=True)
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            history = json.load(f)
    history.append(record)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)
    print(f"[Train] Model history saved -> {HISTORY_FILE}")
def train():
    print("[Train] Generating synthetic training data...")
    X, y = generate_training_data(N_SAMPLES, RANDOM_SEED)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"[Train] Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"[Train] Legitimate claims in train: {y_train.mean():.2%}")
    base_clf = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=RANDOM_SEED,
    )
    clf = CalibratedClassifierCV(base_clf, method="isotonic", cv=5)
    clf.fit(X_train, y_train)
    y_pred  = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)
    cm      = confusion_matrix(y_test, y_pred).tolist()
    report  = classification_report(y_test, y_pred, target_names=["Fraudulent", "Legitimate"], output_dict=True)
    print("\n[Train] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Fraudulent", "Legitimate"]))
    print(f"[Train] ROC-AUC: {auc:.4f}")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\n[Train] Model saved -> {MODEL_PATH}")
    history_record = {
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "model": "GradientBoostingClassifier + CalibratedClassifierCV",
        "n_samples": N_SAMPLES,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "roc_auc": round(auc, 4),
        "accuracy": round(report["accuracy"], 4),
        "legitimate_precision": round(report["Legitimate"]["precision"], 4),
        "legitimate_recall": round(report["Legitimate"]["recall"], 4),
        "fraudulent_precision": round(report["Fraudulent"]["precision"], 4),
        "fraudulent_recall": round(report["Fraudulent"]["recall"], 4),
        "confusion_matrix": cm,
        "feature_names": ["m1_weather_score", "m2_activity_score", "m3_rank_score", "m4_disruption_score", "m5_shift_score"],
        "model_path": MODEL_PATH,
    }
    save_history(history_record)
if __name__ == "__main__":
    train()

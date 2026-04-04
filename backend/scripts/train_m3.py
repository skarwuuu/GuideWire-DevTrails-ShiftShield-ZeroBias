import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

RANDOM_SEED = 42
N_SAMPLES   = 4_000
MODEL_PATH  = "app/engine/m3_rank_model.joblib"


def generate_data(n: int, seed: int):
    rng = np.random.default_rng(seed)
    X   = np.zeros((n, 5), dtype=np.float32)
    y   = np.zeros(n, dtype=np.int32)

    for i in range(n):
        scenario = rng.integers(0, 4)

        if scenario == 0:
            # Genuine disruption — high weather+activity, large rank drop
            weather    = rng.uniform(65, 100)
            activity   = rng.uniform(60, 100)
            rank_before= rng.uniform(50, 99)
            rank_drop  = rng.uniform(25, 55)
            hours      = rng.uniform(2, 8)
            y[i] = 1

        elif scenario == 1:
            # Normal variance — low scores, small rank drop
            weather    = rng.uniform(0, 40)
            activity   = rng.uniform(0, 40)
            rank_before= rng.uniform(30, 99)
            rank_drop  = rng.uniform(0, 15)
            hours      = rng.uniform(1, 8)
            y[i] = 0

        elif scenario == 2:
            # Fraud attempt — high weather claimed but activity normal
            weather    = rng.uniform(65, 100)
            activity   = rng.uniform(0, 30)   # rider was active — fraud tell
            rank_before= rng.uniform(50, 99)
            rank_drop  = rng.uniform(0, 10)   # rank unchanged — fraud tell
            hours      = rng.uniform(1, 8)
            y[i] = 0

        else:
            # Borderline — moderate disruption, moderate drop
            weather    = rng.uniform(35, 65)
            activity   = rng.uniform(35, 65)
            rank_before= rng.uniform(30, 80)
            rank_drop  = rng.uniform(10, 25)
            hours      = rng.uniform(1, 5)
            y[i] = 0

        X[i] = [weather, activity, rank_before, rank_drop, hours]

    return X, y


def train():
    print("[M3 Train] Generating training data...")
    X, y = generate_data(N_SAMPLES, RANDOM_SEED)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    print(f"[M3 Train] Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"[M3 Train] Legitimate: {y_train.mean():.2%}")

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

    print("\n[M3 Train] Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Genuine Drop"]))
    print(f"[M3 Train] ROC-AUC: {auc:.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"[M3 Train] Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    train()
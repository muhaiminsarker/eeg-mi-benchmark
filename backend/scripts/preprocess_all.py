"""One-time preprocessing script: read BNCI2014_001 .mat files via MOABB,
save processed epochs to backend/data/processed/ as .npz + .csv files.

Run this once from the backend/ directory:
    python scripts/preprocess_all.py

After it completes, loader.py will use the .npz files instead of calling MOABB
at request time, reducing cold load from ~45 s to ~1 s.

The script looks for .mat files in the local C-\ directory tree that MOABB
created when the dataset was first downloaded. It sets MNE_DATA to that path
before importing MOABB so the files are found without re-downloading.
"""

import os
import sys
from pathlib import Path

# ---- Point MNE to the .mat files that already exist locally ----
# MOABB stored data relative to CWD when it was first run (inside backend/).
# That produced the odd backend/C-/Users/sarke/mne_data/ subtree.
# Setting MNE_DATA here lets MOABB find those files without re-downloading.
_BACKEND = Path(__file__).resolve().parent.parent
_LOCAL_MNE_DATA = _BACKEND / "C-" / "Users" / "sarke" / "mne_data"

if _LOCAL_MNE_DATA.exists():
    os.environ["MNE_DATA"] = str(_LOCAL_MNE_DATA)
    print(f"[preprocess] MNE_DATA = {_LOCAL_MNE_DATA}")
else:
    print(f"[preprocess] Local .mat files not found at {_LOCAL_MNE_DATA}")
    print("[preprocess] MOABB will try its default path (~/.moabb) or re-download.")

import numpy as np
import pandas as pd
from moabb.datasets import BNCI2014_001
from moabb.paradigms import MotorImagery

_OUT = _BACKEND / "data" / "processed"
_OUT.mkdir(parents=True, exist_ok=True)

_SUBJECTS = list(range(1, 10))  # subjects 1-9 (all subjects in BNCI2014_001)
_RUNS = {
    "imagined_hand": ["left_hand", "right_hand"],
    "imagined_feet": ["feet"],
    "imagined_tongue": ["tongue"],
}


def _preprocess_one(subject: int, run_label: str, events: list[str]) -> None:
    out_dir = _OUT / f"subj{subject}_{run_label}"
    npz_path = out_dir / "data.npz"
    if npz_path.exists():
        print(f"  [skip] {out_dir.name} already exists")
        return

    print(f"  [load] subject={subject} run={run_label} ...", end=" ", flush=True)
    dataset = BNCI2014_001()
    paradigm = MotorImagery(
        events=events,
        n_classes=len(events),
        fmin=1.0,
        fmax=40.0,
        tmin=-0.5,
        tmax=4.0,
    )
    X, y, metadata = paradigm.get_data(dataset=dataset, subjects=[subject])
    # X shape: (n_epochs, n_channels, n_times)  units: microvolts (MOABB convention)
    print(f"X={X.shape} y={y.shape}")

    out_dir.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(str(npz_path), X=X.astype("float32"), y=y)
    metadata.reset_index(drop=True).to_csv(str(out_dir / "meta.csv"), index=False)
    print(f"  [save] {npz_path}")


def main() -> None:
    print(f"Output directory: {_OUT}\n")
    for subject in _SUBJECTS:
        for run_label, events in _RUNS.items():
            try:
                _preprocess_one(subject, run_label, events)
            except Exception as exc:
                print(f"  [error] subject={subject} run={run_label}: {exc}")
    print("\nDone.")


if __name__ == "__main__":
    main()

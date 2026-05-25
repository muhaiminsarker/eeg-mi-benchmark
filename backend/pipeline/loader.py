import os
from pathlib import Path

import mne
import numpy as np
import pandas as pd

# ---- locate the pre-processed data directory ----
_BACKEND = Path(__file__).resolve().parent.parent
_PROCESSED = _BACKEND / "data" / "processed"

# ---- point MNE to local .mat files if present (MOABB fallback path) ----
# MOABB downloaded data into backend/C-/... when first run from the backend dir.
# Setting MNE_DATA here lets the fallback path work without re-downloading.
_LOCAL_MNE_DATA = _BACKEND / "C-" / "Users" / "sarke" / "mne_data"
if _LOCAL_MNE_DATA.exists() and "MNE_DATA" not in os.environ:
    os.environ["MNE_DATA"] = str(_LOCAL_MNE_DATA)

from moabb.datasets import BNCI2014_001
from moabb.paradigms import MotorImagery


_RUN_OPTIONS = [
    {"value": "imagined_hand", "label": "Imagined Left / Right Hand"},
    {"value": "imagined_feet", "label": "Imagined Feet"},
    {"value": "imagined_tongue", "label": "Imagined Tongue"},
]

_BNCI2014_001_CHANNELS = [
    "Fz",
    "FC3", "FC1", "FCz", "FC2", "FC4",
    "C5", "C3", "C1", "Cz", "C2", "C4", "C6",
    "CP3", "CP1", "CPz", "CP2", "CP4",
    "P1", "Pz", "P2", "POz",
]

_SFREQ = 250.0

_RUN_EVENTS = {
    "imagined_hand": ["left_hand", "right_hand"],
    "imagined_feet": ["feet"],
    "imagined_tongue": ["tongue"],
}


def get_run_options() -> list[dict]:
    return _RUN_OPTIONS


def _load_from_npz(subject: int, run_label: str):
    """Load pre-processed epochs from .npz + .csv files.

    Returns (epochs, error). Fast path: avoids MOABB runtime at request time.
    """
    npz_path = _PROCESSED / f"subj{subject}_{run_label}" / "data.npz"
    meta_path = _PROCESSED / f"subj{subject}_{run_label}" / "meta.csv"
    if not npz_path.exists():
        return None, "npz not found"

    data = np.load(str(npz_path))
    X = data["X"].astype("float64")  # (n_epochs, n_channels, n_times)
    y = data["y"]

    n_channels = X.shape[1]
    ch_names = _BNCI2014_001_CHANNELS[:n_channels]

    info = mne.create_info(ch_names=ch_names, sfreq=_SFREQ, ch_types="eeg", verbose=False)
    # X from preprocessing is in microvolts; EpochsArray expects volts
    epochs = mne.EpochsArray(X * 1e-6, info, tmin=-0.5, verbose=False)

    md: pd.DataFrame
    if meta_path.exists():
        md = pd.read_csv(str(meta_path)).reset_index(drop=True)
        md["labels"] = list(y)
    else:
        md = pd.DataFrame({"labels": list(y)})
    epochs.metadata = md

    return epochs, None


def _load_from_moabb(subject: int, run_label: str):
    """Load epochs via MOABB (slow path, ~45 s for first call per subject).

    Returns (epochs, error).
    """
    events = _RUN_EVENTS.get(run_label)
    if events is None:
        return None, f"Unknown run_label: {run_label}"

    dataset = BNCI2014_001()
    paradigm = MotorImagery(
        events=events, n_classes=len(events),
        fmin=1.0, fmax=40.0,
        tmin=-0.5, tmax=4.0,
    )
    X, y, metadata = paradigm.get_data(dataset=dataset, subjects=[subject])

    n_channels = X.shape[1]
    ch_names = _BNCI2014_001_CHANNELS[:n_channels]
    sfreq = paradigm.resample if paradigm.resample is not None else _SFREQ

    info = mne.create_info(ch_names=ch_names, sfreq=sfreq, ch_types="eeg", verbose=False)
    paradigm_tmin = paradigm.tmin if paradigm.tmin is not None else 0.0
    epochs = mne.EpochsArray(X * 1e-6, info, tmin=paradigm_tmin, verbose=False)
    md = metadata.reset_index(drop=True)
    md["labels"] = list(y)
    epochs.metadata = md
    return epochs, None


def load_subject_epochs(subject: int, run_label: str):
    """Load BNCI2014_001 epochs for one subject and task type.

    Tries the pre-processed .npz fast path first (~1 s), falls back to MOABB
    (~45 s) if the .npz file hasn't been generated yet.

    Returns (epochs, error_string). error_string is None on success.
    """
    try:
        epochs, err = _load_from_npz(subject, run_label)
        if epochs is not None:
            return epochs, None
    except Exception as exc:
        pass  # npz load failed for any reason; fall through to MOABB

    try:
        return _load_from_moabb(subject, run_label)
    except Exception as exc:
        return None, str(exc)

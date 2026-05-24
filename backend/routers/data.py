from fastapi import APIRouter, HTTPException, Query
from pipeline.loader import load_subject_epochs, get_run_options

router = APIRouter()

# Simple in-process cache: (subject, run_label) -> epochs object.
# Added this so repeated requests in the same session don't re-download from MOABB.
_cache: dict[tuple, object] = {}


def _get_epochs(subject: int, run_label: str):
    """Load epochs for a subject/run combo, using cache if already loaded.

    Parameter subject: subject number
    Precondition: subject must be an INT between 1 and 9

    Parameter run_label: task type label
    Precondition: run_label must be a STRING, either 'imagined_hand' or 'imagined_feet'
    """
    key = (subject, run_label)
    if key not in _cache:
        epochs, error = load_subject_epochs(subject, run_label)
        if error:
            raise HTTPException(status_code=500, detail=error)
        _cache[key] = epochs
    return _cache[key]


@router.get("/options")
def get_options():
    """Return dropdown options for dataset, subject, and run selectors."""
    return {
        "datasets": [{"value": "BNCI2014001", "label": "BCI Competition IV 2a (22 channels, 9 subjects)"}],
        "subjects": list(range(1, 10)),
        "runs": get_run_options(),
    }


@router.get("/load")
def load_data(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
):
    """Load EEG epochs for a subject/run and return metadata.

    Parameter dataset: dataset identifier
    Precondition: dataset must be the STRING 'BNCI2014001'

    Parameter subject: subject number
    Precondition: subject must be an INT between 1 and 9

    Parameter run: run label
    Precondition: run must be a STRING, either 'imagined_hand' or 'imagined_feet'
    """
    if dataset != "BNCI2014001":
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {dataset}")
    epochs = _get_epochs(subject, run)
    return {
        "n_epochs": len(epochs),
        "sfreq": epochs.info["sfreq"],
        "tmin": float(epochs.tmin),
        "tmax": float(epochs.tmax),
        "channels": epochs.ch_names,
    }

from fastapi import APIRouter, HTTPException, Query
from routers.data import _get_epochs
from pipeline.preprocessing import get_channel_timeseries, get_psd

router = APIRouter()

# The three motor cortex channels we visualize. C3 and C4 are over left and right
# motor cortex respectively, Cz is the midline reference.
_VISUALIZE_CHANNELS = ["C3", "C4", "Cz"]


@router.get("/timeseries")
def timeseries(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    epoch_idx: int = Query(0),
):
    """Return time-domain EEG signal for C3, C4, and Cz from one epoch.

    Parameter dataset: dataset identifier
    Precondition: dataset must be the STRING 'BNCI2014001'

    Parameter subject: subject number
    Precondition: subject must be an INT between 1 and 9

    Parameter run: run label
    Precondition: run must be a STRING, either 'imagined_hand' or 'imagined_feet'

    Parameter epoch_idx: which epoch to return (0-indexed)
    Precondition: epoch_idx must be an INT >= 0 and < n_epochs
    """
    epochs = _get_epochs(subject, run)
    if epoch_idx >= len(epochs):
        raise HTTPException(
            status_code=400,
            detail=f"epoch_idx {epoch_idx} out of range (n_epochs={len(epochs)})"
        )
    return get_channel_timeseries(epochs, _VISUALIZE_CHANNELS, epoch_idx)

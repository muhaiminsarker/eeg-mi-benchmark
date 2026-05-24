from fastapi import APIRouter, HTTPException, Query
from routers.data import _get_epochs
from pipeline.preprocessing import get_channel_timeseries, get_psd
from pipeline.topoplot import generate_topoplot_svg

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


@router.get("/psd")
def psd(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    channel: str = Query("C3"),
):
    """Return power spectral density for one channel, averaged across epochs.

    Parameter dataset: dataset identifier
    Precondition: dataset must be the STRING 'BNCI2014001'

    Parameter subject: subject number
    Precondition: subject must be an INT between 1 and 9

    Parameter run: run label
    Precondition: run must be a STRING, either 'imagined_hand' or 'imagined_feet'

    Parameter channel: EEG channel name to compute PSD for
    Precondition: channel must be a STRING that exists in the dataset's channel list
    """
    epochs = _get_epochs(subject, run)
    if channel not in epochs.ch_names:
        raise HTTPException(
            status_code=400,
            detail=f"Channel '{channel}' not found. Available: {epochs.ch_names}"
        )
    # fmin=1.0 and fmax=40.0 to cover the full range the chart needs,
    # including delta, Mu (8-12), and Beta (13-30) bands
    return get_psd(epochs, channel, fmin=1.0, fmax=40.0)


@router.get("/topoplot")
def topoplot(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    freq_band: str = Query("mu"),
):
    """Return an MNE-rendered scalp topoplot as an SVG string.

    Parameter dataset: dataset identifier
    Precondition: dataset must be the STRING 'BNCI2014001'

    Parameter subject: subject number
    Precondition: subject must be an INT between 1 and 9

    Parameter run: run label
    Precondition: run must be a STRING, either 'imagined_hand' or 'imagined_feet'

    Parameter freq_band: frequency band to visualize
    Precondition: freq_band must be a STRING, either 'mu' or 'beta'
    """
    epochs = _get_epochs(subject, run)
    try:
        svg = generate_topoplot_svg(epochs, freq_band)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"svg": svg}

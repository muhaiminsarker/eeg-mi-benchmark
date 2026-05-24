import io
import matplotlib
# Must set non-interactive backend before importing pyplot, otherwise it tries to open a display
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import mne

# Frequency bands for the topoplot selector. Got these ranges from the standard BCI literature.
_BANDS = {
    "mu": (8.0, 12.0),
    "beta": (13.0, 30.0),
}

# Cortex Purple theme colors, matched to the frontend design spec
_BG = "#09090f"


def generate_topoplot_svg(epochs, freq_band: str) -> str:
    """Render a scalp topoplot for the mean PSD in freq_band, returned as an SVG string.

    MNE renders the topoplot server-side because there is no equivalent React library
    that handles EEG electrode layouts properly. We serve it as SVG so the frontend
    can embed it without any additional rendering step.

    Raises ValueError for unknown freq_band.

    Parameter epochs: MNE Epochs object
    Precondition: epochs must be a valid mne.EpochsArray — montage is set internally, no digitization required on input

    Parameter freq_band: which frequency band to visualize
    Precondition: freq_band must be a STRING, either 'mu' or 'beta'
    """
    if freq_band not in _BANDS:
        raise ValueError(f"Unknown freq_band '{freq_band}'. Valid: {list(_BANDS)}")

    fmin, fmax = _BANDS[freq_band]

    # MOABB-loaded epochs don't carry digitization points, so plot_topomap has no
    # electrode coordinates to work with. Setting standard_1020 here gives MNE the
    # 3-D positions it needs to project channels onto the scalp. Used on_missing='warn'
    # so channels absent from the standard layout don't crash the call.
    montage = mne.channels.make_standard_montage("standard_1020")
    epochs_copy = epochs.copy()
    epochs_copy.set_montage(montage, on_missing="warn", verbose=False)

    # Compute mean power per channel across all epochs and frequency bins in the band
    psd = epochs_copy.compute_psd(method="welch", fmin=fmin, fmax=fmax, verbose=False)
    power = psd.get_data().mean(axis=(0, 2))

    fig, ax = plt.subplots(figsize=(3.5, 3.5), facecolor=_BG)
    ax.set_facecolor(_BG)

    mne.viz.plot_topomap(
        power,
        epochs_copy.info,
        axes=ax,
        show=False,
        cmap="PuRd",
        sensors=True,
        names=epochs_copy.ch_names,
        outlines="head",
    )

    # Style head outline and sensor dots to match the dark theme
    for child in ax.get_children():
        if hasattr(child, "set_color"):
            try:
                child.set_color("#3a3650")
            except (TypeError, ValueError):
                # Some artist types reject a plain color string — just skip them
                pass

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", facecolor=_BG, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)
    return buf.read().decode("utf-8")

import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np
import mne

_BANDS = {
    "mu":        (8.0,  12.0),
    "beta":      (13.0, 30.0),
    "alpha":     (8.0,  13.0),
    "broadband": (1.0,  40.0),
}

_BG = "#0d0c18"
_HEAD_COLOR = "#4a5568"
_SENSOR_COLOR = "#94a3b8"


def generate_topoplot_svg(epochs, freq_band: str) -> str:
    """Render a scalp topoplot for the mean PSD in freq_band, returned as SVG.

    Uses RdBu_r centered at mean power so motor-cortex channels (C3/C4) stand
    out spatially against the rest of the scalp. No electrode labels shown —
    the spatial pattern is the signal, not the channel names.

    Raises ValueError for unknown freq_band.
    """
    if freq_band not in _BANDS:
        raise ValueError(f"Unknown freq_band '{freq_band}'. Valid: {list(_BANDS)}")

    fmin, fmax = _BANDS[freq_band]

    montage = mne.channels.make_standard_montage("standard_1020")
    epochs_copy = epochs.copy()
    epochs_copy.set_montage(montage, on_missing="warn", verbose=False)

    psd = epochs_copy.compute_psd(method="welch", fmin=fmin, fmax=fmax, verbose=False)
    power = psd.get_data().mean(axis=(0, 2))  # (n_channels,)

    # Center the diverging colormap at the mean so spatial deviations are clear
    mean_p = power.mean()
    max_dev = np.abs(power - mean_p).max() or 1.0
    vlim = (mean_p - max_dev, mean_p + max_dev)

    plt.rcParams.update({
        "text.color": _SENSOR_COLOR,
        "axes.labelcolor": _SENSOR_COLOR,
        "xtick.color": _SENSOR_COLOR,
        "ytick.color": _SENSOR_COLOR,
    })

    fig, ax = plt.subplots(figsize=(4.2, 4.2), facecolor=_BG)
    ax.set_facecolor(_BG)
    ax.axis("off")

    mne.viz.plot_topomap(
        power,
        epochs_copy.info,
        axes=ax,
        show=False,
        cmap="RdBu_r",
        sensors=True,
        names=None,
        outlines="head",
        vlim=vlim,
        sphere=0.09,
    )

    # Style head outline and sensor markers for dark background
    for line in ax.get_lines():
        line.set_color(_HEAD_COLOR)
        line.set_linewidth(1.8)
        line.set_zorder(5)

    for coll in ax.collections:
        try:
            coll.set_edgecolors(_SENSOR_COLOR)
            coll.set_linewidths(0.8)
        except Exception:
            pass

    # Minimal colorbar
    sm = plt.cm.ScalarMappable(cmap="RdBu_r", norm=mcolors.Normalize(vmin=vlim[0], vmax=vlim[1]))
    sm.set_array([])
    cb = fig.colorbar(sm, ax=ax, fraction=0.035, pad=0.02, shrink=0.7)
    cb.ax.yaxis.set_tick_params(color=_SENSOR_COLOR, labelsize=8)
    cb.outline.set_edgecolor("#334155")
    plt.setp(cb.ax.yaxis.get_ticklabels(), color=_SENSOR_COLOR)
    cb.set_label("dB", color=_SENSOR_COLOR, fontsize=9)

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", facecolor=_BG, bbox_inches="tight", pad_inches=0.05, dpi=120)
    plt.close(fig)
    plt.rcParams.update(plt.rcParamsDefault)
    buf.seek(0)
    return buf.read().decode("utf-8")

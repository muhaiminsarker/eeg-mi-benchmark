import numpy as np
import mne


def get_channel_timeseries(epochs, channels: list[str], epoch_idx: int = 0) -> dict:
    """Extract time-domain signal for requested channels from one epoch.

    Returns a dict with 'times' (list of floats, seconds) and
    'channels' (dict mapping channel name to list of floats in microvolts).

    Parameter epochs: MNE Epochs object
    Precondition: epochs must be a valid mne.EpochsArray or mne.Epochs

    Parameter channels: list of channel names to extract
    Precondition: channels must be a list of STRINGs that exist in epochs.ch_names

    Parameter epoch_idx: which epoch to extract
    Precondition: epoch_idx must be an INT >= 0 and < len(epochs)
    """
    epoch = epochs[epoch_idx]
    times = epochs.times.tolist()
    picks = mne.pick_channels(epochs.ch_names, include=channels, ordered=True)
    data = epoch.get_data(picks=picks)[0]

    # Multiply by 1e6 to convert from volts to microvolts for the chart
    return {
        "times": times,
        "channels": {ch: (data[i] * 1e6).tolist() for i, ch in enumerate(channels)},
    }


def get_psd(epochs, channel: str, fmin: float = 1.0, fmax: float = 40.0) -> dict:
    """Compute mean PSD across epochs for one channel.

    Returns a dict with 'freqs' (Hz) and 'power' (dB re 1 uV^2/Hz).

    Parameter epochs: MNE Epochs object
    Precondition: epochs must be a valid mne.EpochsArray or mne.Epochs

    Parameter channel: channel name to compute PSD for
    Precondition: channel must be a STRING that exists in epochs.ch_names

    Parameter fmin: lower frequency bound in Hz
    Precondition: fmin must be a FLOAT >= 0

    Parameter fmax: upper frequency bound in Hz
    Precondition: fmax must be a FLOAT > fmin
    """
    pick = mne.pick_channels(epochs.ch_names, include=[channel])
    psd = epochs.compute_psd(method="welch", fmin=fmin, fmax=fmax, picks=pick, verbose=False)
    freqs = psd.freqs.tolist()

    # Mean over epochs, single channel, then convert to dB.
    # Noticed we need to scale by 1e12 because the data is in volts, and
    # we want dB relative to 1 uV^2/Hz. That's 10*log10(V^2/Hz * 1e12).
    power_uv2 = psd.get_data().mean(axis=0)[0]
    power_db = (10 * np.log10(power_uv2 * 1e12)).tolist()
    return {"freqs": freqs, "power": power_db}

import mne
from moabb.datasets import BNCI2014_001
from moabb.paradigms import MotorImagery

# BNCI2014_001 has two task types we care about for motor imagery.
# Got these event names from the MOABB dataset docs (event_id dict on the dataset object).
_RUN_OPTIONS = [
    {"value": "imagined_hand", "label": "Imagined Left / Right Hand"},
    {"value": "imagined_feet", "label": "Imagined Feet"},
]

# The 22 EEG channel names for BNCI2014_001, in the order MOABB returns them.
# Got these from the dataset source and confirmed they match what paradigm.get_data returns.
_BNCI2014_001_CHANNELS = [
    "Fz",
    "FC3", "FC1", "FCz", "FC2", "FC4",
    "C5", "C3", "C1", "Cz", "C2", "C4", "C6",
    "CP3", "CP1", "CPz", "CP2", "CP4",
    "P1", "Pz", "P2", "POz",
]

# Native sampling rate for this dataset. Paradigm does not resample by default.
_SFREQ = 250.0


def get_run_options() -> list[dict]:
    """Return the list of available run types for the context bar dropdown.

    Returns a list of dicts with 'value' and 'label' keys.
    """
    return _RUN_OPTIONS


def load_subject_epochs(subject: int, run_label: str):
    """Load and epoch BNCI2014_001 data for one subject and task type.

    Returns a tuple (epochs, error_string). On success, error_string is None.
    MOABB downloads the dataset to ~/.moabb/ on first call (~500MB).

    Parameter subject: the subject number to load
    Precondition: subject must be an INT between 1 and 9

    Parameter run_label: which motor imagery task to load
    Precondition: run_label must be a STRING, either 'imagined_hand' or 'imagined_feet'
    """
    try:
        dataset = BNCI2014_001()

        # Map our friendly run labels to the actual MOABB event names.
        # The dataset event_id dict confirms these: left_hand=1, right_hand=2, feet=3, tongue=4.
        if run_label == "imagined_hand":
            events = ["left_hand", "right_hand"]
        elif run_label == "imagined_feet":
            events = ["feet"]
        else:
            return None, f"Unknown run_label: {run_label}"

        # fmin=1.0/fmax=40.0 so the full PSD range (delta through beta) is available
        # downstream. tmin=-0.5 adds a pre-cue baseline window the frontend needs.
        paradigm = MotorImagery(
            events=events, n_classes=len(events),
            fmin=1.0, fmax=40.0,
            tmin=-0.5, tmax=4.0,
        )
        X, y, metadata = paradigm.get_data(dataset=dataset, subjects=[subject])

        # X comes back as (n_epochs, n_channels, n_times) in volts.
        # We wrap it into MNE EpochsArray so downstream code can use MNE's
        # PSD, topoplot, and pick_channels functions without re-implementing them.
        n_channels = X.shape[1]
        ch_names = _BNCI2014_001_CHANNELS[:n_channels]

        # Noticed the paradigm may resample if resample is set, so we read sfreq
        # from the paradigm attribute first. Falls back to the dataset native rate.
        sfreq = paradigm.resample if paradigm.resample is not None else _SFREQ

        info = mne.create_info(
            ch_names=ch_names,
            sfreq=sfreq,
            ch_types="eeg",
            verbose=False,
        )
        # tmin must match the paradigm's tmin so epochs.times reflects the correct
        # time axis (−0.5 s pre-cue through tmax). Without this, EpochsArray assumes
        # tmin=0 and the frontend time axis is shifted by 0.5 s.
        paradigm_tmin = paradigm.tmin if paradigm.tmin is not None else 0.0
        epochs = mne.EpochsArray(X, info, tmin=paradigm_tmin, verbose=False)
        epochs.metadata = metadata.reset_index(drop=True)
        return epochs, None

    except Exception as exc:
        # Added some error handling so the API returns a readable message instead of a traceback
        return None, str(exc)

# EEG Data Loader by Muhaimin Sarker
import mne
import numpy as np
from collections import defaultdict

def load_subject_data(subject=1, run=1):
    """Load and preprocess EEG data with robust event handling."""
    filepath = f"data/S{subject:03d}/S{subject:03d}R{run:02d}.edf"
    
    # Added some error handling
    try:
        raw = mne.io.read_raw_edf(filepath, preload=True, verbose=False)
    except FileNotFoundError:
        return None, None, f"File not found: S{subject:03d}R{run:02d}.edf"
    
    # Channel renaming (simplified from original names obtained from the raw edf when debugging)
    channel_mapping = {
        'Fp1.': 'Fp1', 'Fpz.': 'Fpz', 'Fp2.': 'Fp2',
        'F7..': 'F7', 'F3..': 'F3', 'Fz..': 'Fz', 'F4..': 'F4', 'F8..': 'F8',
        'T7..': 'T7', 'C3..': 'C3', 'Cz..': 'Cz', 'C4..': 'C4', 'T8..': 'T8',
        'P7..': 'P7', 'P3..': 'P3', 'Pz..': 'Pz', 'P4..': 'P4', 'P8..': 'P8',
        'O1..': 'O1', 'Oz..': 'Oz', 'O2..': 'O2',
        'Fc5.': 'FC5', 'Fc3.': 'FC3', 'Fc1.': 'FC1', 'Fcz.': 'FCz', 'Fc2.': 'FC2', 
        'Fc4.': 'FC4', 'Fc6.': 'FC6', 'C5..': 'C5', 'C1..': 'C1', 'C2..': 'C2', 
        'C6..': 'C6', 'Cp5.': 'CP5', 'Cp3.': 'CP3', 'Cp1.': 'CP1', 'Cpz.': 'CPz', 
        'Cp2.': 'CP2', 'Cp4.': 'CP4', 'Cp6.': 'CP6',
        'Af7.': 'AF7', 'Af3.': 'AF3', 'Afz.': 'AFz', 'Af4.': 'AF4', 'Af8.': 'AF8',
        'F5..': 'F5', 'F1..': 'F1', 'F2..': 'F2', 'F6..': 'F6',
        'Ft7.': 'FT7', 'Ft8.': 'FT8',
        'Tp7.': 'TP7', 'Tp8.': 'TP8',
        'Po7.': 'PO7', 'Po3.': 'PO3', 'Poz.': 'POz', 'Po4.': 'PO4', 'Po8.': 'PO8'
    }
    
    # Rename channels and set montage
    raw.rename_channels(channel_mapping)

    # Just added the standard 1020 
    raw.set_montage('standard_1020', on_missing='warn')
    
    # Filter data (Mu/Beta bands: 8-30 Hz) using MNE's firwin technique (comes from scipy) 
    raw.filter(8., 30., fir_design='firwin', verbose=False)
    
    # Get events - handle cases where no events exist (like in baseline runs)
    try:
        events, event_dict = mne.events_from_annotations(raw) # Obtain all the events from the edf
        event_id = {k: v for k, v in event_dict.items() if k in ['T0', 'T1', 'T2']} # Maps it up like T0 : 1 and more
    except ValueError:
        events = np.array([[int(raw.times[-1]*raw.info['sfreq']/2), 0, 1]])  # Middle of recording
        event_id = {1: 'baseline'}
    
    # Epoch data and set the t min and t max based on the project specifications and details
    epochs = mne.Epochs(
        raw, 
        events, 
        event_id=event_id,
        tmin=-0.5, 
        tmax=2.0, 
        baseline=None,
        preload=True,
        verbose=False
    )
    
    return epochs, event_id, None


def get_run_description(run):
    """Enhanced run descriptions with more detail."""
    # Added these descriptions to make it easier for the person to navigate
    # Got these descriptions from the study itself as well
    descriptions = {
        1: "Baseline (eyes open) - 1 min, no task",
        2: "Baseline (eyes closed) - 1 min, no task",
        3: "Task 1: Actual Left/Right Fist Movement",
        4: "Task 2: Imagined Left/Right Fist Movement",
        5: "Task 3: Actual Both Fists/Feet Movement", 
        6: "Task 4: Imagined Both Fists/Feet Movement",
        7: "Repeat Task 1: Actual Left/Right",
        8: "Repeat Task 2: Imagined Left/Right",
        9: "Repeat Task 3: Actual Both",
        10: "Repeat Task 4: Imagined Both",
        11: "Final Task 1: Actual Left/Right",
        12: "Final Task 2: Imagined Left/Right",
        13: "Final Task 3: Actual Both",
        14: "Final Task 4: Imagined Both"
    }
    return descriptions.get(run, f"Run {run} (Unknown)")

def get_task_type(run):
    """Classify runs into categories for comparison."""

    # Noticed a pattern in terms of the categories for the run types
    if run in [1, 2]:
        return "baseline"
    elif run in [3, 7, 11]:
        return "actual_hand"
    elif run in [4, 8, 12]:
        return "imagined_hand" 
    elif run in [5, 9, 13]:
        return "actual_both"
    elif run in [6, 10, 14]:
        return "imagined_both"
    return "unknown"
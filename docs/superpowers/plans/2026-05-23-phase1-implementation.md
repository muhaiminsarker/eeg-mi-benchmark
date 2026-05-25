# eeg-mi-benchmark Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a browser-based EEG motor imagery visualization tool — FastAPI backend serving BNCI2014001 data via MOABB, Next.js frontend with Nivo charts, Cortex Purple theme, and a global Explain toggle for educational captions.

**Architecture:** Backend (FastAPI + MNE + MOABB) loads and preprocesses EEG data, exposing REST endpoints for timeseries, PSD, and topoplot SVG. Frontend (Next.js 14 App Router + TypeScript + Nivo) consumes those endpoints, renders interactive charts, and ships Classify/Benchmark pages as named placeholders. Backend is built and tested first; frontend wires against it second.

**Tech Stack:** Python 3.11, FastAPI, MNE-Python, MOABB, pytest, Next.js 14 App Router, TypeScript, Tailwind CSS v3, Nivo (`@nivo/line`), Vercel (frontend), Railway (backend)

**Design spec:** `docs/superpowers/specs/2026-05-23-eeg-mi-benchmark-phase1-design.md`

---

## File Map

```
backend/
  main.py                        FastAPI app, CORS, router mounting
  requirements.txt
  routers/
    data.py                      GET /data/options, GET /data/load
    visualize.py                 GET /visualize/timeseries, /psd, /topoplot
    classify.py                  placeholder router (Week 2)
    benchmark.py                 placeholder router (Week 3)
  pipeline/
    loader.py                    MOABB data loading (adapted from root loader.py)
    preprocessing.py             bandpass filter, epoch extraction helpers
    topoplot.py                  MNE topoplot → SVG string
  tests/
    conftest.py                  shared fixtures
    test_data.py
    test_visualize.py

frontend/
  app/
    layout.tsx                   root layout, NavBar
    page.tsx                     redirect to /visualize
    visualize/page.tsx           Visualize page (state + chart wiring)
    classify/page.tsx            placeholder
    benchmark/page.tsx           placeholder
  components/
    layout/
      NavBar.tsx
      ContextBar.tsx
    visualize/
      TimeSeriesChart.tsx
      PSDChart.tsx
      TopoplotImage.tsx
    ui/
      Dropdown.tsx
      Toggle.tsx
  lib/
    api.ts                       typed fetch wrappers for all endpoints
    types.ts                     shared TypeScript types
  tailwind.config.ts             Cortex Purple palette + font tokens
  __tests__/
    ContextBar.test.tsx
    TimeSeriesChart.test.tsx
    PSDChart.test.tsx
```

---

## Code Style Guide

Every file in this project — Python and TypeScript — should feel like it was written by the same person who wrote `loader.py` at the project root. Read that file before writing anything.

**The voice:**

- Comments explain the WHY and the context, not the what. Function and variable names already do the what.
- Past tense, first person: "Added some error handling", "Just added the standard 1020", "Noticed a pattern in terms of the categories"
- Reference where knowledge came from: "Got these descriptions from the study itself", "comes from scipy", "obtained from the raw edf when debugging"
- User-centered reasoning: "Added these descriptions to make it easier for the person to navigate"
- Inline comments: plain English, one sentence, explain WHY not what. No walls of text.
- Conversational asides are fine: "I do think this is the cleanest way to handle it", "To me, this is where the real signal lives"
- NO em dashes anywhere — use a comma or a new sentence instead
- **Docstrings on functions:** use structured Parameter/Precondition style (one line per param), like this:

```python
def load_subject_epochs(subject, run_label):
    """Load and epoch BNCI2014001 for one subject.

    Parameter subject: the subject number (1-9)
    Precondition: subject must be an INT between 1 and 9

    Parameter run_label: which task type to load
    Precondition: run_label must be a STRING, either 'imagined_hand' or 'imagined_feet'
    """
```

**Patterns to copy literally:**

```python
# Added some error handling
try:
    ...
except FileNotFoundError:
    ...

# Just added the standard 1020
raw.set_montage('standard_1020', on_missing='warn')

# Noticed a pattern in terms of the categories for the run types
if run in [1, 2]:
    ...

# Got these descriptions from the study itself as well
descriptions = { ... }
```

**Explanation-as-learning requirement:**

Each subagent task must include, at the end of its work output, a short plain-English breakdown of what the code does and why — connecting to the neuroscience where it matters. This goes in the subagent's response (not in the code), so the developer reading along actually learns something.

The explanation must be written in the user's personal voice, not as technical documentation. Confirmed voice patterns:
- "For me, this...", "I do think...", "I do wonder...", "To me,"
- Short punchy sentences mixed with longer flowing ones
- Casual but analytical — like talking through it in a seminar, not writing a paper
- NO em dashes anywhere

Example for a topoplot task (right tone):
"To me, the topoplot is the most interesting part. You are looking at where power is concentrated across the scalp at a specific frequency. I do think it clicks better visually than a number in a table. We pick Mu (8-12 Hz) because that is where motor imagery actually shows up as ERD — event-related desynchronization. MNE renders this on the server because there is no React library that handles EEG electrode layouts properly, so we serve it as SVG and embed it."

---

## Task 1: Backend scaffold

**Files:**
- Create: `backend/main.py`
- Create: `backend/requirements.txt`
- Create: `backend/routers/classify.py`
- Create: `backend/routers/benchmark.py`

- [ ] **Step 1: Install backend dependencies into the existing venv**

```bash
.venv/Scripts/pip install "fastapi>=0.111.0" "uvicorn[standard]>=0.29.0" "mne>=1.7.0" "moabb>=1.0.0" "pyriemann>=0.6" "numpy>=1.26.0" "scipy>=1.12.0" "matplotlib>=3.8.0" "pytest>=8.0.0" "httpx>=0.27.0"
```

- [ ] **Step 2: Create `backend/requirements.txt`**

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
mne>=1.7.0
moabb>=1.0.0
pyriemann>=0.6
numpy>=1.26.0
scipy>=1.12.0
matplotlib>=3.8.0
pytest>=8.0.0
httpx>=0.27.0
```

- [ ] **Step 3: Create placeholder routers so the app can mount them immediately**

`backend/routers/classify.py`:
```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def classify_status():
    return {"status": "coming in Week 2 — after reading Blankertz et al. 2008"}
```

`backend/routers/benchmark.py`:
```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def benchmark_status():
    return {"status": "coming in Week 3 — after reading Lotte et al. 2018"}
```

- [ ] **Step 4: Create `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import data, visualize, classify, benchmark

app = FastAPI(title="eeg-mi-benchmark", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(visualize.router, prefix="/visualize", tags=["visualize"])
app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Verify the server starts**

```bash
cd backend && ../.venv/Scripts/uvicorn main:app --reload
```

Expected: `INFO: Application startup complete.` on `http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/docs` — Swagger UI shows all four routers.

- [ ] **Step 6: Commit**

```bash
git add backend/ && git commit -m "Scaffold FastAPI backend with placeholder routers"
```

---

## Task 2: Data loading pipeline

**Files:**
- Create: `backend/pipeline/__init__.py`
- Create: `backend/pipeline/loader.py`
- Create: `backend/pipeline/preprocessing.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_loader.py`:
```python
import pytest
from pipeline.loader import load_subject_epochs, get_run_options


def test_get_run_options_returns_expected_structure():
    options = get_run_options()
    assert isinstance(options, list)
    assert len(options) > 0
    first = options[0]
    assert "value" in first
    assert "label" in first


def test_load_subject_epochs_returns_epochs_object(moabb_subject_1_run_4):
    epochs, error = moabb_subject_1_run_4
    assert error is None
    assert epochs is not None
    assert len(epochs) > 0
```

`backend/tests/conftest.py`:
```python
import pytest
from pipeline.loader import load_subject_epochs


@pytest.fixture(scope="session")
def moabb_subject_1_run_4():
    # Downloads BNCI2014001 on first run (~500MB); cached to ~/.moabb/ after that
    return load_subject_epochs(subject=1, run_label="imagined_hand")
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_loader.py -v
```

Expected: `ImportError: cannot import name 'load_subject_epochs'`

- [ ] **Step 3: Create `backend/pipeline/__init__.py`**

```python
```
(empty file)

- [ ] **Step 4: Create `backend/pipeline/loader.py`**

```python
import numpy as np
from moabb.datasets import BNCI2014001
from moabb.paradigms import MotorImagery

# Run labels match the event types in BNCI2014001:
# left_hand, right_hand, feet, tongue
_IMAGINED_HAND_EVENTS = ["left_hand", "right_hand"]

_RUN_OPTIONS = [
    {"value": "imagined_hand", "label": "Imagined Left / Right Hand"},
    {"value": "imagined_feet", "label": "Imagined Feet"},
]


def get_run_options() -> list[dict]:
    return _RUN_OPTIONS


def load_subject_epochs(subject: int, run_label: str):
    """Load and epoch BNCI2014001 for one subject and task type.

    Returns (epochs, error_string). On success error_string is None.
    MOABB downloads the dataset to ~/.moabb/ on first call (~500MB).
    """
    try:
        dataset = BNCI2014001()
        if run_label == "imagined_hand":
            events = ["left_hand", "right_hand"]
        elif run_label == "imagined_feet":
            events = ["feet"]
        else:
            return None, f"Unknown run_label: {run_label}"

        paradigm = MotorImagery(events=events, n_classes=len(events), fmin=8.0, fmax=30.0)
        X, y, metadata = paradigm.get_data(dataset=dataset, subjects=[subject])

        # paradigm returns numpy arrays; re-create as MNE epochs for downstream use
        import mne
        info = mne.create_info(
            ch_names=dataset.channel_names,
            sfreq=paradigm.resample,
            ch_types="eeg",
        )
        epochs = mne.EpochsArray(X, info)
        epochs.metadata = metadata.reset_index(drop=True)
        return epochs, None

    except Exception as exc:
        return None, str(exc)
```

- [ ] **Step 5: Run tests**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_loader.py -v
```

Expected: both tests PASS. Note: `test_load_subject_epochs_returns_epochs_object` will download BNCI2014001 on first run — this takes a few minutes.

- [ ] **Step 6: Create `backend/pipeline/preprocessing.py`**

```python
import numpy as np
import mne


def get_channel_timeseries(epochs, channels: list[str], epoch_idx: int = 0) -> dict:
    """Extract time-domain signal for requested channels from one epoch.

    Returns dict with 'times' (list of floats, seconds) and
    'channels' (dict mapping channel name → list of floats, µV).
    """
    epoch = epochs[epoch_idx]
    times = epochs.times.tolist()
    picks = mne.pick_channels(epochs.ch_names, include=channels, ordered=True)
    data = epoch.get_data(picks=picks)[0]  # shape (n_channels, n_times)
    return {
        "times": times,
        "channels": {ch: (data[i] * 1e6).tolist() for i, ch in enumerate(channels)},
    }


def get_psd(epochs, channel: str, fmin: float = 1.0, fmax: float = 40.0) -> dict:
    """Compute mean PSD across epochs for one channel.

    Returns dict with 'freqs' (Hz) and 'power' (dB re 1 µV²/Hz).
    """
    pick = mne.pick_channels(epochs.ch_names, include=[channel])
    psd = epochs.compute_psd(method="welch", fmin=fmin, fmax=fmax, picks=pick, verbose=False)
    freqs = psd.freqs.tolist()
    power_uv2 = psd.get_data().mean(axis=0)[0]  # mean over epochs, single channel
    power_db = (10 * np.log10(power_uv2 * 1e12)).tolist()  # convert to dB re 1 µV²/Hz
    return {"freqs": freqs, "power": power_db}
```

- [ ] **Step 7: Commit**

```bash
git add backend/ && git commit -m "Add MOABB data loader and preprocessing helpers"
```

---

## Task 3: /data endpoints

**Files:**
- Create: `backend/routers/data.py`
- Create: `backend/tests/test_data.py`

- [ ] **Step 1: Write the failing tests**

`backend/tests/test_data.py`:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_options_returns_expected_keys():
    response = client.get("/data/options")
    assert response.status_code == 200
    body = response.json()
    assert "datasets" in body
    assert "subjects" in body
    assert "runs" in body
    assert len(body["runs"]) == 2  # imagined_hand, imagined_feet


def test_get_options_subjects_range():
    response = client.get("/data/options")
    subjects = response.json()["subjects"]
    assert subjects == list(range(1, 10))  # BNCI2014001 has 9 subjects


def test_load_returns_metadata():
    response = client.get("/data/load", params={
        "dataset": "BNCI2014001",
        "subject": 1,
        "run": "imagined_hand",
    })
    assert response.status_code == 200
    body = response.json()
    assert "n_epochs" in body
    assert "sfreq" in body
    assert "tmin" in body
    assert "tmax" in body
    assert "channels" in body
    assert "C3" in body["channels"]
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_data.py -v
```

Expected: `ImportError` or 404 — router not yet implemented.

- [ ] **Step 3: Create `backend/routers/data.py`**

```python
from fastapi import APIRouter, HTTPException, Query
from pipeline.loader import load_subject_epochs, get_run_options
import mne

router = APIRouter()

# Simple in-process cache: (subject, run_label) → epochs
# Avoids re-downloading on repeated requests during a session
_cache: dict[tuple, object] = {}


def _get_epochs(subject: int, run_label: str):
    key = (subject, run_label)
    if key not in _cache:
        epochs, error = load_subject_epochs(subject, run_label)
        if error:
            raise HTTPException(status_code=500, detail=error)
        _cache[key] = epochs
    return _cache[key]


@router.get("/options")
def get_options():
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
```

- [ ] **Step 4: Run tests**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_data.py -v
```

Expected: all three PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/ && git commit -m "Add /data/options and /data/load endpoints"
```

---

## Task 4: /visualize/timeseries endpoint

**Files:**
- Create: `backend/routers/visualize.py`
- Create: `backend/tests/test_visualize.py`

- [ ] **Step 1: Write the failing test**

`backend/tests/test_visualize.py`:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PARAMS = {"dataset": "BNCI2014001", "subject": 1, "run": "imagined_hand"}


def test_timeseries_returns_three_channels():
    response = client.get("/visualize/timeseries", params={**PARAMS, "epoch_idx": 0})
    assert response.status_code == 200
    body = response.json()
    assert "times" in body
    assert "channels" in body
    assert "C3" in body["channels"]
    assert "C4" in body["channels"]
    assert "Cz" in body["channels"]
    assert len(body["times"]) == len(body["channels"]["C3"])


def test_timeseries_epoch_idx_out_of_range():
    response = client.get("/visualize/timeseries", params={**PARAMS, "epoch_idx": 9999})
    assert response.status_code == 400
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py::test_timeseries_returns_three_channels tests/test_visualize.py::test_timeseries_epoch_idx_out_of_range -v
```

Expected: both FAIL — router not yet created.

- [ ] **Step 3: Create `backend/routers/visualize.py`**

```python
from fastapi import APIRouter, HTTPException, Query
from routers.data import _get_epochs
from pipeline.preprocessing import get_channel_timeseries, get_psd
from pipeline.topoplot import generate_topoplot_svg

router = APIRouter()

_VISUALIZE_CHANNELS = ["C3", "C4", "Cz"]


@router.get("/timeseries")
def timeseries(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    epoch_idx: int = Query(0),
):
    epochs = _get_epochs(subject, run)
    if epoch_idx >= len(epochs):
        raise HTTPException(status_code=400, detail=f"epoch_idx {epoch_idx} out of range (n_epochs={len(epochs)})")
    return get_channel_timeseries(epochs, _VISUALIZE_CHANNELS, epoch_idx)
```

- [ ] **Step 4: Run tests**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py::test_timeseries_returns_three_channels tests/test_visualize.py::test_timeseries_epoch_idx_out_of_range -v
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/ && git commit -m "Add /visualize/timeseries endpoint"
```

---

## Task 5: /visualize/psd endpoint

**Files:**
- Modify: `backend/routers/visualize.py`
- Modify: `backend/tests/test_visualize.py`

- [ ] **Step 1: Write the failing test** (add to `test_visualize.py`)

```python
def test_psd_returns_freqs_and_power():
    response = client.get("/visualize/psd", params={**PARAMS, "channel": "C3"})
    assert response.status_code == 200
    body = response.json()
    assert "freqs" in body
    assert "power" in body
    assert len(body["freqs"]) == len(body["power"])
    # Should cover mu and beta bands
    assert min(body["freqs"]) <= 8.0
    assert max(body["freqs"]) >= 30.0


def test_psd_invalid_channel():
    response = client.get("/visualize/psd", params={**PARAMS, "channel": "NOTACHANNEL"})
    assert response.status_code == 400
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py::test_psd_returns_freqs_and_power tests/test_visualize.py::test_psd_invalid_channel -v
```

Expected: both FAIL — route not yet defined.

- [ ] **Step 3: Add PSD route to `backend/routers/visualize.py`**

Add after the `timeseries` route:

```python
@router.get("/psd")
def psd(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    channel: str = Query("C3"),
):
    epochs = _get_epochs(subject, run)
    if channel not in epochs.ch_names:
        raise HTTPException(status_code=400, detail=f"Channel '{channel}' not found. Available: {epochs.ch_names}")
    return get_psd(epochs, channel, fmin=1.0, fmax=40.0)
```

- [ ] **Step 4: Run tests**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py::test_psd_returns_freqs_and_power tests/test_visualize.py::test_psd_invalid_channel -v
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/ && git commit -m "Add /visualize/psd endpoint"
```

---

## Task 6: /visualize/topoplot endpoint

**Files:**
- Create: `backend/pipeline/topoplot.py`
- Modify: `backend/routers/visualize.py`
- Modify: `backend/tests/test_visualize.py`

- [ ] **Step 1: Write the failing test** (add to `test_visualize.py`)

```python
def test_topoplot_returns_svg_string():
    response = client.get("/visualize/topoplot", params={**PARAMS, "freq_band": "mu"})
    assert response.status_code == 200
    body = response.json()
    assert "svg" in body
    assert body["svg"].startswith("<svg") or "<?xml" in body["svg"]


def test_topoplot_invalid_band():
    response = client.get("/visualize/topoplot", params={**PARAMS, "freq_band": "notaband"})
    assert response.status_code == 400
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py::test_topoplot_returns_svg_string tests/test_visualize.py::test_topoplot_invalid_band -v
```

Expected: both FAIL.

- [ ] **Step 3: Create `backend/pipeline/topoplot.py`**

```python
import io
import numpy as np
import matplotlib
matplotlib.use("Agg")  # non-interactive backend, must be set before pyplot import
import matplotlib.pyplot as plt
import mne

_BANDS = {
    "mu": (8.0, 12.0),
    "beta": (13.0, 30.0),
}

_BG = "#09090f"
_ACCENT = "#a78bfa"


def generate_topoplot_svg(epochs, freq_band: str) -> str:
    """Render a topoplot for the mean PSD in freq_band across all epochs.

    Returns an SVG string styled to match the Cortex Purple theme.
    Raises ValueError for unknown freq_band.
    """
    if freq_band not in _BANDS:
        raise ValueError(f"Unknown freq_band '{freq_band}'. Valid: {list(_BANDS)}")

    fmin, fmax = _BANDS[freq_band]
    psd = epochs.compute_psd(method="welch", fmin=fmin, fmax=fmax, verbose=False)
    # Mean power per channel across epochs and frequency bins
    power = psd.get_data().mean(axis=(0, 2))

    fig, ax = plt.subplots(figsize=(3.5, 3.5), facecolor=_BG)
    ax.set_facecolor(_BG)

    mne.viz.plot_topomap(
        power,
        epochs.info,
        axes=ax,
        show=False,
        cmap="PuRd",
        sensors=True,
        names=epochs.ch_names,
        outlines="head",
    )

    # Style the head outline and sensors to match theme
    for child in ax.get_children():
        if hasattr(child, "set_color"):
            try:
                child.set_color("#3a3650")
            except Exception:
                pass

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", facecolor=_BG, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)
    return buf.read().decode("utf-8")
```

- [ ] **Step 4: Add topoplot route to `backend/routers/visualize.py`**

```python
@router.get("/topoplot")
def topoplot(
    dataset: str = Query(...),
    subject: int = Query(...),
    run: str = Query(...),
    freq_band: str = Query("mu"),
):
    epochs = _get_epochs(subject, run)
    try:
        svg = generate_topoplot_svg(epochs, freq_band)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"svg": svg}
```

- [ ] **Step 5: Run all visualize tests**

```bash
cd backend && ../.venv/Scripts/pytest tests/test_visualize.py -v
```

Expected: all six tests PASS.

- [ ] **Step 6: Run the full test suite**

```bash
cd backend && ../.venv/Scripts/pytest tests/ -v
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/ && git commit -m "Add /visualize/topoplot endpoint with MNE SVG rendering"
```

---

## Task 7: Frontend scaffold

**Files:**
- Create: `frontend/` (Next.js project)
- Create: `frontend/tailwind.config.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-git
```

When prompted: choose default for everything. This creates `frontend/` with App Router, TypeScript, and Tailwind.

- [ ] **Step 2: Install Nivo and testing dependencies**

```bash
cd frontend && npm install @nivo/line @nivo/core && npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

- [ ] **Step 3: Configure Jest** — create `frontend/jest.config.ts`

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `frontend/jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Replace `frontend/tailwind.config.ts` with Cortex Purple theme**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#09090f',
        surface: '#100f1a',
        raised: '#141226',
        border: '#1e1a30',
        accent: '#a78bfa',
        'accent-muted': '#c4b5fd',
        'text-primary': '#e2e8f0',
        'text-muted': '#64748b',
        'text-dim': '#3a3650',
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'monospace'],
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Update `frontend/app/globals.css`** — replace entirely with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-geist-sans: 'Geist', system-ui, sans-serif;
  --font-geist-mono: 'Geist Mono', monospace;
}

body {
  background-color: #09090f;
  color: #e2e8f0;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 6: Verify the frontend starts**

```bash
cd frontend && npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`. Visit `http://localhost:3000` — default Next.js page renders (we'll replace it next).

- [ ] **Step 7: Commit**

```bash
cd .. && git add frontend/ && git commit -m "Scaffold Next.js frontend with Cortex Purple Tailwind theme"
```

---

## Task 8: Shared types and API client

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create `frontend/lib/types.ts`**

```typescript
export interface DataOptions {
  datasets: { value: string; label: string }[]
  subjects: number[]
  runs: { value: string; label: string }[]
}

export interface EpochMetadata {
  n_epochs: number
  sfreq: number
  tmin: number
  tmax: number
  channels: string[]
}

export interface TimeseriesData {
  times: number[]
  channels: {
    C3: number[]
    C4: number[]
    Cz: number[]
  }
}

export interface PSDData {
  freqs: number[]
  power: number[]
}

export interface TopoplotData {
  svg: string
}

export type FreqBand = 'mu' | 'beta'
export type ChannelName = 'C3' | 'C4' | 'Cz'
```

- [ ] **Step 2: Create `frontend/lib/api.ts`**

```typescript
import type { DataOptions, EpochMetadata, TimeseriesData, PSDData, TopoplotData } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail ?? res.statusText)
  }
  return res.json()
}

export const api = {
  getOptions: () => get<DataOptions>('/data/options'),

  loadData: (dataset: string, subject: number, run: string) =>
    get<EpochMetadata>('/data/load', { dataset, subject, run }),

  getTimeseries: (dataset: string, subject: number, run: string, epochIdx = 0) =>
    get<TimeseriesData>('/visualize/timeseries', { dataset, subject, run, epoch_idx: epochIdx }),

  getPSD: (dataset: string, subject: number, run: string, channel = 'C3') =>
    get<PSDData>('/visualize/psd', { dataset, subject, run, channel }),

  getTopoplot: (dataset: string, subject: number, run: string, freqBand: 'mu' | 'beta' = 'mu') =>
    get<TopoplotData>('/visualize/topoplot', { dataset, subject, run, freq_band: freqBand }),
}
```

- [ ] **Step 3: Create `frontend/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/ frontend/.env.local && git commit -m "Add typed API client and shared TypeScript types"
```

---

## Task 9: NavBar and ContextBar

**Files:**
- Create: `frontend/components/layout/NavBar.tsx`
- Create: `frontend/components/layout/ContextBar.tsx`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/__tests__/ContextBar.test.tsx`

- [ ] **Step 1: Write the failing test**

`frontend/__tests__/ContextBar.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ContextBar from '@/components/layout/ContextBar'
import type { DataOptions } from '@/lib/types'

const mockOptions: DataOptions = {
  datasets: [{ value: 'BNCI2014001', label: 'BCI Competition IV 2a' }],
  subjects: [1, 2, 3],
  runs: [
    { value: 'imagined_hand', label: 'Imagined Left / Right Hand' },
    { value: 'imagined_feet', label: 'Imagined Feet' },
  ],
}

it('renders explain toggle', () => {
  render(
    <ContextBar
      options={mockOptions}
      explain={false}
      onExplainChange={jest.fn()}
      onLoad={jest.fn()}
    />
  )
  expect(screen.getByLabelText(/explain/i)).toBeInTheDocument()
})

it('calls onExplainChange when toggle is clicked', () => {
  const onExplainChange = jest.fn()
  render(
    <ContextBar
      options={mockOptions}
      explain={false}
      onExplainChange={onExplainChange}
      onLoad={jest.fn()}
    />
  )
  fireEvent.click(screen.getByLabelText(/explain/i))
  expect(onExplainChange).toHaveBeenCalledWith(true)
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd frontend && npm test -- --testPathPattern=ContextBar
```

Expected: FAIL — component not yet created.

- [ ] **Step 3: Create `frontend/components/layout/NavBar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/classify', label: 'Classify' },
  { href: '/benchmark', label: 'Benchmark' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="bg-surface border-b border-border px-6 py-3 flex justify-between items-center">
      <span className="font-mono font-bold text-accent tracking-wide text-sm">
        eeg-mi-benchmark
      </span>
      <div className="flex gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-mono transition-colors ${
                active
                  ? 'text-accent border-b border-accent pb-0.5'
                  : 'text-text-dim hover:text-text-muted'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create `frontend/components/layout/ContextBar.tsx`**

```typescript
'use client'

import type { DataOptions } from '@/lib/types'

interface Props {
  options: DataOptions
  explain: boolean
  onExplainChange: (v: boolean) => void
  onLoad: (dataset: string, subject: number, run: string) => void
}

export default function ContextBar({ options, explain, onExplainChange, onLoad }: Props) {
  // Local state for the three selectors
  const [dataset, setDataset] = useState(options.datasets[0]?.value ?? '')
  const [subject, setSubject] = useState(options.subjects[0] ?? 1)
  const [run, setRun] = useState(options.runs[0]?.value ?? '')

  return (
    <div className="bg-raised border-b border-border px-6 py-2 flex items-center gap-4 text-sm">
      <span className="text-text-dim font-mono text-xs">Dataset</span>
      <select
        value={dataset}
        onChange={(e) => setDataset(e.target.value)}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.datasets.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      <span className="text-text-dim font-mono text-xs">Subject</span>
      <select
        value={subject}
        onChange={(e) => setSubject(Number(e.target.value))}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.subjects.map((s) => (
          <option key={s} value={s}>0{s}</option>
        ))}
      </select>

      <span className="text-text-dim font-mono text-xs">Run</span>
      <select
        value={run}
        onChange={(e) => setRun(e.target.value)}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.runs.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-text-dim font-mono text-xs" aria-label="explain toggle">Explain</span>
          <button
            role="switch"
            aria-label="explain"
            aria-checked={explain}
            onClick={() => onExplainChange(!explain)}
            className={`relative w-8 h-4 rounded-full transition-colors ${
              explain ? 'bg-accent' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                explain ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <button
          onClick={() => onLoad(dataset, subject, run)}
          className="bg-accent text-base font-mono text-xs font-bold px-4 py-1 rounded hover:bg-accent-muted transition-colors"
        >
          Load
        </button>
      </div>
    </div>
  )
}
```

Add `import { useState } from 'react'` at the top of ContextBar.tsx.

- [ ] **Step 5: Update `frontend/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/layout/NavBar'

export const metadata: Metadata = {
  title: 'eeg-mi-benchmark',
  description: 'EEG Motor Imagery Analysis and Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base text-text-primary min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Run the test**

```bash
cd frontend && npm test -- --testPathPattern=ContextBar
```

Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/ && git commit -m "Add NavBar and ContextBar components"
```

---

## Task 10: TimeSeriesChart

**Files:**
- Create: `frontend/components/visualize/TimeSeriesChart.tsx`
- Create: `frontend/__tests__/TimeSeriesChart.test.tsx`

- [ ] **Step 1: Write the failing test**

`frontend/__tests__/TimeSeriesChart.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import type { TimeseriesData } from '@/lib/types'

const mockData: TimeseriesData = {
  times: [-0.5, -0.25, 0, 0.25, 0.5],
  channels: {
    C3: [1.0, 1.2, 0.8, 1.1, 0.9],
    C4: [0.9, 1.0, 1.1, 0.8, 1.2],
    Cz: [0.5, 0.6, 0.7, 0.5, 0.6],
  },
}

it('renders channel toggle buttons', () => {
  render(<TimeSeriesChart data={mockData} explain={false} />)
  expect(screen.getByText('C3')).toBeInTheDocument()
  expect(screen.getByText('C4')).toBeInTheDocument()
  expect(screen.getByText('Cz')).toBeInTheDocument()
})

it('renders explain caption when explain is true', () => {
  render(<TimeSeriesChart data={mockData} explain={true} />)
  expect(screen.getByText(/motor cortex/i)).toBeInTheDocument()
})

it('does not render explain caption when explain is false', () => {
  render(<TimeSeriesChart data={mockData} explain={false} />)
  expect(screen.queryByText(/motor cortex/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd frontend && npm test -- --testPathPattern=TimeSeriesChart
```

Expected: all FAIL.

- [ ] **Step 3: Create `frontend/components/visualize/TimeSeriesChart.tsx`**

```typescript
'use client'

import { useState, useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { TimeseriesData, ChannelName } from '@/lib/types'

const CHANNEL_COLORS: Record<ChannelName, string> = {
  C3: '#e2d9ff',
  C4: '#c4b5fd',
  Cz: '#7c6fff',
}

const NIVO_THEME = {
  background: '#100f1a',
  textColor: '#64748b',
  fontSize: 10,
  fontFamily: 'monospace',
  axis: {
    domain: { line: { stroke: '#1e1a30', strokeWidth: 1 } },
    ticks: { text: { fill: '#64748b', fontSize: 9 } },
    legend: { text: { fill: '#a78bfa', fontSize: 10 } },
  },
  grid: { line: { stroke: '#1e1a30', strokeWidth: 0.5 } },
  crosshair: { line: { stroke: '#a78bfa', strokeWidth: 1, strokeOpacity: 0.4 } },
  tooltip: {
    container: {
      background: '#141226',
      color: '#e2e8f0',
      fontSize: 11,
      borderRadius: '4px',
      border: '1px solid #1e1a30',
    },
  },
}

interface Props {
  data: TimeseriesData
  explain: boolean
}

export default function TimeSeriesChart({ data, explain }: Props) {
  const [visible, setVisible] = useState<Record<ChannelName, boolean>>({
    C3: true, C4: true, Cz: true,
  })

  const nivoData = useMemo(() =>
    (Object.keys(CHANNEL_COLORS) as ChannelName[])
      .filter((ch) => visible[ch])
      .map((ch) => ({
        id: ch,
        color: CHANNEL_COLORS[ch],
        data: data.times.map((t, i) => ({ x: t, y: data.channels[ch][i] })),
      })),
    [data, visible]
  )

  const toggle = (ch: ChannelName) =>
    setVisible((prev) => ({ ...prev, [ch]: !prev[ch] }))

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-accent text-xs tracking-widest">EEG TIME SERIES</span>
        <div className="flex gap-2 ml-2">
          {(Object.keys(CHANNEL_COLORS) as ChannelName[]).map((ch) => (
            <button
              key={ch}
              onClick={() => toggle(ch)}
              className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                visible[ch]
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-dim'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveLine
          data={nivoData}
          theme={NIVO_THEME}
          margin={{ top: 8, right: 16, bottom: 32, left: 48 }}
          xScale={{ type: 'linear', min: data.times[0], max: data.times[data.times.length - 1] }}
          yScale={{ type: 'linear', stacked: false }}
          axisBottom={{
            legend: 'time (s)',
            legendOffset: 28,
            legendPosition: 'middle',
            tickValues: 6,
          }}
          axisLeft={{
            legend: 'µV',
            legendOffset: -40,
            legendPosition: 'middle',
            tickValues: 4,
          }}
          colors={(d) => CHANNEL_COLORS[d.id as ChannelName]}
          lineWidth={1.5}
          enablePoints={false}
          enableGridX={false}
          crosshairType="x"
          useMesh={true}
          layers={[
            // Task period shading (0s to tmax)
            ({ xScale, innerHeight }: any) => (
              <rect
                x={xScale(0)}
                y={0}
                width={xScale(data.times[data.times.length - 1]) - xScale(0)}
                height={innerHeight}
                fill="#a78bfa"
                fillOpacity={0.04}
              />
            ),
            'grid', 'axes', 'lines', 'crosshair', 'mesh', 'legends',
          ]}
        />
      </div>

      {explain && (
        <div className="mt-3 pl-3 border-l border-accent/20 text-text-muted text-xs font-sans leading-relaxed">
          C3 and C4 sit over left and right motor cortex. When you imagine moving your right hand,
          C3 desynchronizes — mu/beta power drops. The shaded region marks the imagery period (0–2s).
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests**

```bash
cd frontend && npm test -- --testPathPattern=TimeSeriesChart
```

Expected: all three PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/ && git commit -m "Add TimeSeriesChart with channel toggles and task shading"
```

---

## Task 11: PSDChart

**Files:**
- Create: `frontend/components/visualize/PSDChart.tsx`
- Create: `frontend/__tests__/PSDChart.test.tsx`

- [ ] **Step 1: Write the failing test**

`frontend/__tests__/PSDChart.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import PSDChart from '@/components/visualize/PSDChart'
import type { PSDData } from '@/lib/types'

const mockData: PSDData = {
  freqs: [1, 4, 8, 10, 12, 15, 20, 25, 30, 35, 40],
  power: [-30, -28, -25, -22, -24, -27, -29, -30, -31, -32, -33],
}

it('renders band labels', () => {
  render(<PSDChart data={mockData} explain={false} />)
  expect(screen.getByText('μ')).toBeInTheDocument()
  expect(screen.getByText('β')).toBeInTheDocument()
})

it('renders explain caption when explain is true', () => {
  render(<PSDChart data={mockData} explain={true} />)
  expect(screen.getByText(/mu rhythm/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd frontend && npm test -- --testPathPattern=PSDChart
```

Expected: FAIL.

- [ ] **Step 3: Create `frontend/components/visualize/PSDChart.tsx`**

```typescript
'use client'

import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { PSDData } from '@/lib/types'

const NIVO_THEME = {
  background: '#100f1a',
  textColor: '#64748b',
  fontSize: 10,
  fontFamily: 'monospace',
  axis: {
    domain: { line: { stroke: '#1e1a30', strokeWidth: 1 } },
    ticks: { text: { fill: '#64748b', fontSize: 9 } },
    legend: { text: { fill: '#a78bfa', fontSize: 10 } },
  },
  grid: { line: { stroke: '#1e1a30', strokeWidth: 0.5 } },
  crosshair: { line: { stroke: '#a78bfa', strokeWidth: 1, strokeOpacity: 0.4 } },
  tooltip: {
    container: {
      background: '#141226',
      color: '#e2e8f0',
      fontSize: 11,
      borderRadius: '4px',
      border: '1px solid #1e1a30',
    },
  },
}

// Band shading layer factory
function BandLayer({ xScale, innerHeight, fmin, fmax, color, label }: any) {
  const x1 = xScale(fmin)
  const x2 = xScale(fmax)
  const w = x2 - x1
  return (
    <g>
      <rect x={x1} y={0} width={w} height={innerHeight} fill={color} fillOpacity={0.12} />
      <text x={x1 + w / 2} y={10} textAnchor="middle" fill={color} fontSize={10} fontFamily="monospace">
        {label}
      </text>
    </g>
  )
}

interface Props {
  data: PSDData
  explain: boolean
}

export default function PSDChart({ data, explain }: Props) {
  const nivoData = useMemo(() => [{
    id: 'psd',
    color: '#a78bfa',
    data: data.freqs.map((f, i) => ({ x: f, y: data.power[i] })),
  }], [data])

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <span className="font-mono text-accent text-xs tracking-widest block mb-3">
        POWER SPECTRAL DENSITY
      </span>

      <div style={{ height: 140 }}>
        <ResponsiveLine
          data={nivoData}
          theme={NIVO_THEME}
          margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
          xScale={{ type: 'linear', min: data.freqs[0], max: data.freqs[data.freqs.length - 1] }}
          yScale={{ type: 'linear', stacked: false }}
          axisBottom={{
            legend: 'frequency (Hz)',
            legendOffset: 28,
            legendPosition: 'middle',
            tickValues: [4, 8, 13, 20, 30, 40],
          }}
          axisLeft={{
            legend: 'dB',
            legendOffset: -40,
            legendPosition: 'middle',
            tickValues: 4,
          }}
          colors={['#a78bfa']}
          lineWidth={1.5}
          enablePoints={false}
          enableGridX={false}
          crosshairType="x"
          useMesh={true}
          layers={[
            ({ xScale, innerHeight }: any) => (
              <BandLayer xScale={xScale} innerHeight={innerHeight}
                fmin={8} fmax={12} color="#a78bfa" label="μ" />
            ),
            ({ xScale, innerHeight }: any) => (
              <BandLayer xScale={xScale} innerHeight={innerHeight}
                fmin={13} fmax={30} color="#7c6fff" label="β" />
            ),
            'grid', 'axes', 'lines', 'crosshair', 'mesh',
          ]}
        />
      </div>

      {explain && (
        <div className="mt-3 pl-3 border-l border-accent/20 text-text-muted text-xs font-sans leading-relaxed">
          The Mu rhythm (8–12 Hz) suppresses during motor imagery — that's event-related
          desynchronization (ERD). Beta (13–30 Hz) follows the same pattern and rebounds
          after movement ends (event-related synchronization, ERS).
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests**

```bash
cd frontend && npm test -- --testPathPattern=PSDChart
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/ && git commit -m "Add PSDChart with Mu and Beta band highlighting"
```

---

## Task 12: TopoplotImage

**Files:**
- Create: `frontend/components/visualize/TopoplotImage.tsx`

- [ ] **Step 1: Create `frontend/components/visualize/TopoplotImage.tsx`**

No test needed here — this component renders server-provided SVG markup. The security model is: SVG comes only from our own FastAPI backend (controlled content), not from user input.

```typescript
'use client'

import { useState } from 'react'
import type { FreqBand } from '@/lib/types'

interface Props {
  svg: string
  explain: boolean
  freqBand: FreqBand
  onBandChange: (band: FreqBand) => void
}

export default function TopoplotImage({ svg, explain, freqBand, onBandChange }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-accent text-xs tracking-widest">TOPOPLOT</span>
        <div className="flex gap-2 ml-2">
          {(['mu', 'beta'] as FreqBand[]).map((band) => (
            <button
              key={band}
              onClick={() => onBandChange(band)}
              className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                freqBand === band
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-dim'
              }`}
            >
              {band === 'mu' ? 'μ (8–12 Hz)' : 'β (13–30 Hz)'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {explain && (
        <div className="mt-3 pl-3 border-l border-accent/20 text-text-muted text-xs font-sans leading-relaxed">
          Spatial distribution of EEG power across the scalp at the selected frequency band.
          Brighter regions indicate more power. During right-hand motor imagery, you should see
          a dark patch over C3 (left motor cortex) — that's the ERD.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/ && git commit -m "Add TopoplotImage component for MNE SVG embedding"
```

---

## Task 13: Visualize page wiring

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/app/visualize/page.tsx`

- [ ] **Step 1: Update `frontend/app/page.tsx`** to redirect to `/visualize`

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/visualize')
}
```

- [ ] **Step 2: Create `frontend/app/visualize/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import ContextBar from '@/components/layout/ContextBar'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import PSDChart from '@/components/visualize/PSDChart'
import TopoplotImage from '@/components/visualize/TopoplotImage'
import type { DataOptions, TimeseriesData, PSDData, FreqBand } from '@/lib/types'

export default function VisualizePage() {
  const [options, setOptions] = useState<DataOptions | null>(null)
  const [explain, setExplain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null)
  const [psd, setPsd] = useState<PSDData | null>(null)
  const [topoSvg, setTopoSvg] = useState<string | null>(null)
  const [freqBand, setFreqBand] = useState<FreqBand>('mu')

  useEffect(() => {
    api.getOptions().then(setOptions).catch((e) => setError(e.message))
  }, [])

  const handleLoad = async (dataset: string, subject: number, run: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.loadData(dataset, subject, run)
      const [ts, psdData, topo] = await Promise.all([
        api.getTimeseries(dataset, subject, run),
        api.getPSD(dataset, subject, run, 'C3'),
        api.getTopoplot(dataset, subject, run, freqBand),
      ])
      setTimeseries(ts)
      setPsd(psdData)
      setTopoSvg(topo.svg)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBandChange = async (band: FreqBand) => {
    setFreqBand(band)
    // Re-fetch topoplot for new band if data is already loaded
    if (timeseries) {
      // options and current selection tracked inside ContextBar;
      // for simplicity re-use last loaded params via a ref if needed
      // For now, user can re-click Load to refresh topoplot
    }
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-text-dim text-sm">
          {error ? `Error: ${error}` : 'Connecting to backend...'}
        </span>
      </div>
    )
  }

  return (
    <main>
      <ContextBar
        options={options}
        explain={explain}
        onExplainChange={setExplain}
        onLoad={handleLoad}
      />

      <div className="px-6 py-5 flex flex-col gap-4">
        {loading && (
          <div className="font-mono text-text-dim text-xs text-center py-8">
            Loading EEG data...
          </div>
        )}

        {error && (
          <div className="font-mono text-red-400 text-xs border border-red-900 rounded px-4 py-2 bg-red-950/20">
            {error}
          </div>
        )}

        {timeseries && (
          <TimeSeriesChart data={timeseries} explain={explain} />
        )}

        {(psd || topoSvg) && (
          <div className="grid grid-cols-2 gap-4">
            {psd && <PSDChart data={psd} explain={explain} />}
            {topoSvg && (
              <TopoplotImage
                svg={topoSvg}
                explain={explain}
                freqBand={freqBand}
                onBandChange={handleBandChange}
              />
            )}
          </div>
        )}

        {!timeseries && !loading && !error && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <p className="font-mono text-text-dim text-sm">Select a dataset, subject, and run — then click Load.</p>
            <p className="font-mono text-text-dim text-xs">BNCI2014001 downloads ~500MB on first load. Subsequent loads are instant.</p>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify in browser**

With both servers running (`uvicorn` on :8000, `npm run dev` on :3000):

1. Visit `http://localhost:3000` — should redirect to `/visualize`
2. Select Subject 1, Imagined Left/Right Hand, click Load
3. After a moment (MOABB downloads on first run): time series, PSD, and topoplot appear
4. Toggle C4 off — trace disappears
5. Click Explain — captions appear below all three charts
6. Switch topoplot to β band

- [ ] **Step 4: Commit**

```bash
git add frontend/ && git commit -m "Wire Visualize page: load, charts, explain toggle"
```

---

## Task 14: Placeholder pages

**Files:**
- Create: `frontend/app/classify/page.tsx`
- Create: `frontend/app/benchmark/page.tsx`

- [ ] **Step 1: Create `frontend/app/classify/page.tsx`**

```typescript
export default function ClassifyPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <h1 className="font-mono text-accent text-lg tracking-wide">CSP + LDA Classification</h1>
      <p className="font-mono text-text-dim text-sm">Coming in Week 2</p>
      <p className="font-mono text-text-dim text-xs">
        After reading Blankertz et al. 2008 (CSP) and Ang et al. 2008 (FBCSP)
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Create `frontend/app/benchmark/page.tsx`**

```typescript
export default function BenchmarkPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <h1 className="font-mono text-accent text-lg tracking-wide">Pipeline Benchmark</h1>
      <p className="font-mono text-text-dim text-sm">Coming in Week 3</p>
      <p className="font-mono text-text-dim text-xs">
        After reading Lotte et al. 2018 (Riemannian geometry section)
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Verify nav links work**

Visit `http://localhost:3000/classify` and `/benchmark` — each shows its placeholder message. NavBar highlights the correct active link.

- [ ] **Step 4: Commit**

```bash
git add frontend/ && git commit -m "Add Classify and Benchmark placeholder pages"
```

---

## Task 15: Deploy

**Files:**
- Create: `frontend/vercel.json`
- Create: `backend/Procfile`
- Create: `backend/railway.json`

- [ ] **Step 1: Create `frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

- [ ] **Step 2: Create `backend/Procfile`** (for Railway)

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 3: Create `backend/railway.json`**

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 4: Deploy backend to Railway**

1. Push all changes to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select `eeg-mi-benchmark`
3. Set root directory to `backend/`
4. Add environment variable: none needed for basic deploy
5. After deploy, copy the Railway URL (e.g. `https://eeg-mi-benchmark-production.up.railway.app`)

- [ ] **Step 5: Update CORS in `backend/main.py`** with the actual Railway URL

Replace the `allow_origins` list:
```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://eeg-mi-benchmark.vercel.app",  # update with actual Vercel URL after deploy
],
```

Commit and push.

- [ ] **Step 6: Deploy frontend to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub → select `eeg-mi-benchmark`
2. Set root directory to `frontend/`
3. Add environment variable: `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy

- [ ] **Step 7: Verify live deployment**

1. Visit the Vercel URL
2. Select Subject 1, Imagined Left/Right Hand, click Load
3. Confirm time series, PSD, and topoplot all load
4. Test Explain toggle and channel toggles

- [ ] **Step 8: Final commit**

```bash
git add . && git commit -m "Add deployment config for Vercel and Railway"
git push origin main
```

---

## Self-Review Notes

**Spec coverage check:**
- Layout (Option D, top nav + context bar): ✓ NavBar + ContextBar in Tasks 9
- Cortex Purple palette: ✓ Tailwind config Task 7, NIVO_THEME in Tasks 10-11
- Channel toggle (C3/C4/Cz): ✓ Task 10
- Task period shading: ✓ Task 10 layers prop
- PSD band highlighting (Mu + Beta): ✓ Task 11 BandLayer
- Topoplot (MNE SVG): ✓ Tasks 6 + 12
- Global Explain toggle: ✓ Tasks 9 + 13
- Week 2/3 placeholders: ✓ Task 14
- Typography (mixed mono/sans): ✓ font classes in components, `font-sans` for captions
- Deployment: ✓ Task 15

**Type consistency:**
- `FreqBand`, `ChannelName`, `TimeseriesData`, `PSDData` defined once in `lib/types.ts`, imported everywhere
- `_get_epochs` cache shared between `data.py` and `visualize.py` via direct import — works because FastAPI runs as a single process

**Known limitation documented in spec:** Topoplot band change requires re-clicking Load (noted inline in Task 13). Acceptable for Week 1 scope.

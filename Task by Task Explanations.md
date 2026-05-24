# Task by Task Explanations

A running log of what each task built and why — written in plain English, connected to the neuroscience where it matters.

---

## Table of Contents

| Task | Description | Status |
|------|-------------|--------|
| [Task 1](#task-1-backend-scaffold) | Backend scaffold — FastAPI, routers, CORS | ✅ Done |
| [Task 2](#task-2-data-loading-pipeline) | Data loading pipeline — MOABB loader, preprocessing | ✅ Done |
| [Task 3](#task-3-data-endpoints) | /data endpoints — options and load | ✅ Done |
| [Task 4](#task-4-visualizetimeseries-endpoint) | /visualize/timeseries endpoint | ✅ Done |
| [Task 5](#task-5-visualizepsd-endpoint) | /visualize/psd endpoint | ✅ Done |
| [Task 6](#task-6-visualizetopoplot-endpoint) | /visualize/topoplot endpoint (MNE SVG) | ✅ Done |
| [Loader Fix](#loader-fix-frequency-range-epoch-window-and-tmin-alignment) | Fix paradigm fmin/fmax, tmin/tmax, and EpochsArray time axis | ✅ Done |
| [Task 7](#task-7-frontend-scaffold) | Frontend scaffold — Next.js, Tailwind, Cortex Purple | ✅ Done |
| [Task 8](#task-8-shared-types-and-api-client) | Shared types and API client | ✅ Done |
| Task 9 | NavBar and ContextBar components | ⏳ Pending |
| Task 10 | TimeSeriesChart — Nivo, channel toggles, task shading | ⏳ Pending |
| Task 11 | PSDChart — Nivo, Mu/Beta band highlighting | ⏳ Pending |
| Task 12 | TopoplotImage — SVG embed | ⏳ Pending |
| Task 13 | Visualize page wiring | ⏳ Pending |
| Task 14 | Classify and Benchmark placeholder pages | ⏳ Pending |
| Task 15 | Deploy — Vercel and Railway | ⏳ Pending |

---

## Task 1: Backend Scaffold

So the core idea here is separation of concerns. I wanted to avoid the thing that happens in prototype code where everything is crammed into one file and six months later nobody can figure out where anything lives. FastAPI's `APIRouter` makes it really easy to split routes by domain, and that's exactly what I did here: one router per concern, `data`, `visualize`, `classify`, `benchmark`. Each gets its own prefix in the URL, so `/data/...` and `/classify/...` are completely separate namespaces.

`main.py` is deliberately thin. It just wires things together. That's intentional. I do think the worst thing you can do in a growing project is let `main.py` become a dumping ground. The actual logic for loading EEG epochs, running CSP, computing covariance matrices for pyRiemann, none of that belongs here. It belongs in the routers.

```python
# main.py — all it does is mount the routers and configure CORS
app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(visualize.router, prefix="/visualize", tags=["visualize"])
app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])
```

The CORS setup only allows GET right now. That's fine for this phase. The browser just needs to read data and visualizations. We're not posting anything back to the server yet.

```python
# GET-only — the API is read-only, so restricting methods is free security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

For me, the most important thing is that `classify.py` and `benchmark.py` have those status endpoints that name the papers directly. Blankertz et al. 2008 is the CSP paper. Lotte et al. 2018 is the big BCI algorithm comparison review. Those aren't arbitrary placeholders, they're a reminder of what the actual implementation weeks are supposed to be grounded in. To me, that kind of thing keeps a project honest.

```python
# classify.py — placeholder until we read Blankertz et al. 2008
@router.get("/status")
def classify_status():
    return {"status": "coming in Week 2 - after reading Blankertz et al. 2008"}
```

---

## Task 2: Data Loading Pipeline

I do think the loader is the most interesting part to understand from a neuroscience angle. BNCI2014_001 is a 4-class motor imagery dataset, meaning subjects sat still and imagined moving their left hand, right hand, feet, or tongue. No actual movement. The brain still produces the same kind of oscillatory suppression in the Mu (8-12 Hz) and Beta (13-30 Hz) bands that you would see with real movement, which is why the bandpass filter in the paradigm is set to 8-30 Hz.

What `paradigm.get_data` does under the hood is download the raw EDF files, epoch them around the cue onset, apply the filter, and hand us back a clean numpy array. To me, this is where MOABB earns its place: instead of manually hunting for event triggers and slicing arrays, we just declare what events we want and get epochs back.

```python
# MotorImagery paradigm handles bandpass filtering and epoching for us.
# Using 8-30 Hz to capture the Mu and Beta bands where ERD shows up.
paradigm = MotorImagery(events=events, n_classes=len(events), fmin=8.0, fmax=30.0)
X, y, metadata = paradigm.get_data(dataset=dataset, subjects=[subject])
```

That numpy array then gets wrapped into an MNE EpochsArray purely so we can use MNE's existing PSD and channel-picking machinery downstream without reinventing it.

```python
# paradigm returns numpy arrays, so we wrap them back into MNE EpochsArray
# so downstream code can use MNE's PSD and topoplot functions
epochs = mne.EpochsArray(X, info)
```

The preprocessing module is the bridge between that epochs object and the frontend. `get_channel_timeseries` pulls out the raw voltage waveform for one epoch, converts volts to microvolts (the chart-friendly unit), and returns plain Python lists the JSON serializer can handle.

```python
# Multiply by 1e6 to convert from volts to microvolts for the chart
return {
    "times": times,
    "channels": {ch: (data[i] * 1e6).tolist() for i, ch in enumerate(channels)},
}
```

`get_psd` computes the power spectral density using Welch's method, averages across all epochs, and converts to decibels. For me, this is where the real signal lives. If you plot the PSD for C3 during left-hand imagery versus right-hand imagery, you should see a clear alpha/Mu band dip contralateral to the imagined hand. That is event-related desynchronization, and it is the core phenomenon the whole benchmark is built around.

```python
# Mean over epochs, single channel, then convert to dB
power_uv2 = psd.get_data().mean(axis=0)[0]
power_db = (10 * np.log10(power_uv2 * 1e12)).tolist()
```

---

## Task 3: /data Endpoints

So the whole point of this project is letting someone explore EEG motor imagery data in a browser without writing any code. For that to work, the frontend needs to know what data is available, and then actually load a chunk of it.

`GET /data/options` handles the first part. It returns the dataset choices, subject numbers (1 through 9 for BNCI2014_001), and the two run types we care about — imagined hand movement and imagined feet movement. Those map to distinct brain patterns in the motor cortex, which is the whole point of motor imagery BCI. The frontend uses this to populate dropdowns before anything is loaded.

`GET /data/load` handles the second part. You hit it with a dataset name, subject number, and run label, and it loads the MOABB data and returns metadata — epoch count, sampling rate, time window, channel names. It does not send the raw signal yet. That is intentional: the visualize endpoints handle the heavy lifting. This endpoint just confirms the data loaded and tells the frontend what it is working with.

I do think the in-process cache is the right call here. MOABB triggers a full download and processing pipeline on first load. Without the cache, every single endpoint call downstream would re-run that whole process. The cache keeps the epochs object alive in memory for the server session, so subsequent requests are instant.

```python
# Simple in-process cache: (subject, run_label) → epochs object.
# Added this so repeated requests in the same session don't re-download from MOABB.
# Imported by visualize.py as well, since both routers share the same in-process cache.
_cache: dict[tuple, object] = {}
```

---

## Task 4: /visualize/timeseries Endpoint

So this endpoint takes a subject, a run label, and an epoch index, and hands back the raw voltage over time for three specific scalp channels: C3, C4, and Cz. That is the core of what you want to look at in motor imagery EEG. When someone imagines moving their left hand, the motor cortex over the right hemisphere (C4) tends to show a drop in the 8-12 Hz mu rhythm. The left side (C3) often does the opposite. Cz sits at the midline and gives you a reference point for what the whole central region is doing.

I do think these three channels are basically the canonical trio for MI work. You could return all 22 channels, but that would be noise in the visualization. Focusing on C3, C4, and Cz means the chart is actually readable and immediately interpretable.

```python
# The three motor cortex channels we visualize. C3 and C4 are over left and right
# motor cortex respectively, Cz is the midline reference.
_VISUALIZE_CHANNELS = ["C3", "C4", "Cz"]
```

The endpoint reuses the in-process `_get_epochs` cache from the data router, so if the user already loaded the dataset once, this call is fast. It converts voltage from volts to microvolts because plotting in raw volts gives you numbers like 0.000023, which nobody wants to read off a chart. The 400 guard on out-of-range `epoch_idx` is there because different datasets and runs have very different epoch counts, and a silent index error would be harder to debug on the frontend than a clean error message.

---

## Task 5: /visualize/psd Endpoint

The PSD endpoint computes the power spectral density for a single EEG channel, averaged across all epochs in a run. To me, PSD is the right next step after timeseries because a raw waveform is honestly hard to interpret. What you actually care about in motor imagery EEG is frequency content. Specifically, you're looking for event-related desynchronization in the mu band (8-12 Hz) and beta band (13-30 Hz) over C3 and C4 while a subject imagines moving their hand. The motor cortex suppresses those oscillations during imagined movement. That's the signal the whole benchmark is trying to classify.

I do think setting `fmin=1.0` and `fmax=40.0` is deliberate here. Going below 8 Hz picks up the delta and theta bands, which gives you a baseline reference to contextualize the mu suppression. Going to 40 Hz captures the full beta range without getting into gamma, which is noisy and less relevant for this task. The Welch method averages across overlapping windows, so we get a stable estimate even with short epochs. The output is in decibels, which compresses the range into something readable on a chart.

```python
# fmin=1.0 and fmax=40.0 to cover the full range the chart needs,
# including delta, Mu (8-12), and Beta (13-30) bands
return get_psd(epochs, channel, fmin=1.0, fmax=40.0)
```

---

## Task 6: /visualize/topoplot Endpoint

Topoplots are basically scalp maps. The idea is to take the power in a specific frequency band, compute it per channel, and then color-code those power values across the head shape. Hotter colors over a region mean more power there. I do think this is one of the most genuinely useful visualizations in EEG work, because the spatial pattern tells you something the PSD chart can't: WHERE the signal is.

For motor imagery specifically, this matters a lot. When you imagine moving your right hand, you expect power in the mu band (8-12 Hz) to drop over C3 (left motor cortex, contralateral to the right hand). That's event-related desynchronization. The topoplot lets you see that lateralization at a glance. To me, that spatial picture is what makes the difference between "there's a mu signal somewhere" and "yes, this is a real motor imagery response."

```python
# Frequency bands for the topoplot selector. Got these ranges from the standard BCI literature.
_BANDS = {
    "mu": (8.0, 12.0),
    "beta": (13.0, 30.0),
}
```

The reason we render it server-side with MNE instead of in the browser is practical. There's no React library that handles the electrode-to-scalp projection geometry correctly. MNE has years of that math built in. We return the SVG string and the frontend embeds it directly, zero additional rendering step needed.

One real issue came up: the MOABB-loaded epochs had no electrode position data attached, so MNE's `plot_topomap` had nowhere to project onto. Fixed by applying the standard 10-20 montage inside `generate_topoplot_svg` on a copy of the epochs before rendering.

```python
# MOABB-loaded epochs don't carry digitization points, so plot_topomap has no
# electrode coordinates to work with. Setting standard_1020 here gives MNE the
# 3-D positions it needs to project channels onto the scalp.
montage = mne.channels.make_standard_montage("standard_1020")
epochs_copy = epochs.copy()
epochs_copy.set_montage(montage, on_missing="warn", verbose=False)
```

---

## Loader Fix: Frequency Range, Epoch Window, and tmin Alignment

Three bugs in `loader.py` that were all connected to how the paradigm was configured before handing data off to MNE.

The first one was the most obvious once you saw it. The paradigm was set to `fmin=8.0, fmax=30.0`, which means MOABB was bandpass filtering the signal to the Mu and Beta range at load time. That is fine for classification, but the PSD endpoint requests `fmin=1.0, fmax=40.0` so the chart can show the full spectrum from delta up through beta. If the loader stripped everything outside 8-30 Hz, the PSD would just be flat on both ends. The fix is to widen the load-time filter to match the broadest range anything downstream will ever ask for.

```python
# fmin=1.0/fmax=40.0 so the full PSD range (delta through beta) is available
# downstream. tmin=-0.5 adds a pre-cue baseline window the frontend needs.
paradigm = MotorImagery(
    events=events, n_classes=len(events),
    fmin=1.0, fmax=40.0,
    tmin=-0.5, tmax=4.0,
)
```

The second issue was the epoch window. Without setting `tmin` and `tmax`, the paradigm uses whatever MOABB defaults to, which does not include any pre-cue baseline. For visualizing motor imagery EEG in the browser, you really want to see what the signal looked like before the cue fired so you have something to compare the post-cue period against. Setting `tmin=-0.5` gives half a second of baseline before the cue, and `tmax=4.0` keeps the full trial window so the frontend can decide how much to show.

The third one was subtle. When you build an `mne.EpochsArray` from the numpy array MOABB returns, MNE does not automatically know what time the epoch started. If you do not pass `tmin` explicitly, it assumes the first sample is at `t=0`. That means the time axis in the frontend would be shifted forward by 0.5 seconds, making every event look like it happened later than it did. The fix is to read `tmin` back off the paradigm object and pass it through.

```python
# tmin must match the paradigm's tmin so epochs.times reflects the correct
# time axis (-0.5 s pre-cue through tmax). Without this, EpochsArray assumes
# tmin=0 and the frontend time axis is shifted by 0.5 s.
paradigm_tmin = paradigm.tmin if paradigm.tmin is not None else 0.0
epochs = mne.EpochsArray(X, info, tmin=paradigm_tmin, verbose=False)
```

To me, the tmin alignment issue is the kind of thing that would have been almost impossible to catch by looking at numbers alone. The data would have loaded, the charts would have rendered, and everything would have looked plausible until you noticed that the ERD was appearing 500 milliseconds after the cue instead of right at it. That is the sort of off-by-one that only shows up when you overlay the event markers on the time series.

---

## Task 7: Frontend Scaffold

For me, Task 7 is the moment the project gets a face. Everything up to this point has been data pipelines, MNE preprocessing, and a FastAPI backend. Task 7 lays down the frontend layer where a researcher will actually interact with results and see EEG visualizations rendered in a browser.

The scaffold uses Next.js 14 with the App Router and TypeScript. I do think the App Router is the right call here. File-based routing means adding a `/classify` page or a `/benchmark` page later is just a matter of creating a folder, no configuration needed. TypeScript catches mismatches between what the FastAPI backend sends and what the frontend expects, which matters when you're dealing with typed EEG payloads like timeseries arrays and PSD vectors.

The Tailwind configuration is where the visual identity lives. The Cortex Purple palette uses dark near-black backgrounds with violet accents:

```typescript
colors: {
  base: '#09090f',
  surface: '#100f1a',
  accent: '#a78bfa',
  'text-primary': '#e2e8f0',
}
```

To me, this color system is not just aesthetic. A dark, low-stimulus UI fits the EEG context, where you might be reviewing data in a lab setting alongside actual recording equipment. High-contrast violet on near-black is also easier to read when you are scanning between a chart and a paper.

Nivo was installed for charting (`@nivo/line`, `@nivo/core`). The line chart component will carry the timeseries and PSD visualizations in Tasks 10 and 11.

The Jest and Testing Library setup gives the frontend a testing foundation from the start. One thing worth noting: the plan had a typo in the Jest config, `setupFilesAfterFramework` instead of `setupFilesAfterEnv`. With the wrong key, Jest silently ignores the setup file and `@testing-library/jest-dom` matchers are unavailable in tests. That was caught and fixed before moving on.

---

## Task 8: Shared Types and API Client

Task 8 established the shared data contract and API communication layer that every future frontend component will depend on. For me, this is one of the most important foundational steps in the whole frontend build, because without a typed interface between the React components and the FastAPI backend, you end up with a lot of guesswork about what shape the data actually is.

The `types.ts` file defines interfaces for every response the backend can return. For example, the timeseries interface maps directly onto what `GET /visualize/timeseries` sends back:

```typescript
export interface TimeseriesData {
  times: number[]
  channels: {
    C3: number[]
    C4: number[]
    Cz: number[]
  }
}
```

This is the EEG signal data the timeseries chart will consume. Having it typed means any component that touches this data gets autocomplete and compile-time safety rather than runtime surprises.

The `api.ts` file wraps all five backend endpoints in a single `api` object with a generic `get<T>` helper. The helper handles URL construction, error extraction from FastAPI's `detail` format, and JSON parsing. Each endpoint call ends up as one line:

```typescript
getTopoplot: (dataset: string, subject: number, run: string, freqBand: 'mu' | 'beta' = 'mu') =>
  get<TopoplotData>('/visualize/topoplot', { dataset, subject, run, freq_band: freqBand }),
```

I do think centralizing the fetch logic this way is the right call. Error handling lives in one place, and every endpoint call is one line. I do wonder if, as the project grows, we will want to add request caching or abort controllers here, but for the current scope this keeps things clean.

The `.env.local` file lets the API base URL be overridden per deployment environment, which matters when moving from local development to any hosted setup on Railway or elsewhere.

---

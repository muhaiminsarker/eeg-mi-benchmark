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
| [Task 9](#task-9-navbar-and-contextbar) | NavBar and ContextBar components | ✅ Done |
| [Task 10](#task-10-timeserieschart) | TimeSeriesChart — Nivo, channel toggles, task shading | ✅ Done |
| [Task 11](#task-11-psdchart) | PSDChart — Nivo, Mu/Beta band highlighting | ✅ Done |
| [Task 12](#task-12-topoplotimage) | TopoplotImage — SVG embed | ✅ Done |
| [Task 13](#task-13-visualize-page-wiring) | Visualize page wiring | ✅ Done |
| [Task 14](#task-14-placeholder-pages) | Classify and Benchmark placeholder pages | ✅ Done |
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

Everything up to this point has been data pipelines, MNE preprocessing, and a FastAPI backend. Task 7 is where the project gets a face: a Next.js 14 app with the App Router, TypeScript, and the Cortex Purple design system that will carry every page from here on.

The App Router choice is deliberate. File-based routing means adding a `/classify` or `/benchmark` page later is just a matter of creating a folder. TypeScript catches mismatches between what the FastAPI backend sends and what the frontend expects, which matters when you are dealing with structured EEG payloads like timeseries arrays and PSD vectors.

The Tailwind config is where the visual identity lives:

```typescript
colors: {
  base: '#09090f',
  surface: '#100f1a',
  accent: '#a78bfa',
  'text-primary': '#e2e8f0',
}
```

The dark, low-stimulus palette is not just aesthetic. You might be reviewing EEG data in a lab alongside actual recording equipment, and a high-contrast violet-on-near-black scheme is easier to read when you're scanning between a chart and a paper. I do think this is the kind of design decision that is easy to dismiss as preference but actually matters for the use case.

Nivo was installed for charting (`@nivo/line`, `@nivo/core`). One catch from this task: the plan had a typo in the Jest config, `setupFilesAfterFramework` instead of `setupFilesAfterEnv`. With the wrong key, Jest silently ignores the setup file and `@testing-library/jest-dom` matchers are unavailable in tests without any error message explaining why. That was caught and fixed here.

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

## Task 9: NavBar and ContextBar

Task 9 is two components: the `NavBar` that wraps every route, and the `ContextBar` that drives the data selection. The NavBar is the simpler one — it uses `usePathname()` to highlight the active link, which means a user always knows where they are in the three-page structure:

```typescript
const active = pathname.startsWith(href)
className={active ? 'text-accent border-b border-accent pb-0.5' : 'text-text-dim hover:text-text-muted'}
```

The ContextBar is the more interesting design problem. EEG motor imagery research always starts with the same three choices: which dataset, which subject, which run type. Those are not page-specific decisions. They apply to every visualization and every classifier run. Putting them in a persistent strip means you never re-select on navigation, and the data context stays consistent as you move between Visualize and Classify.

The Explain toggle is worth calling out separately. When it is on, downstream visualizations render extra captions connecting the raw signal to the neuroscience. I do think this matters for the project's purpose: it turns the app into something closer to a teaching tool rather than just a data viewer. The toggle is implemented as a proper ARIA switch with `role="switch"` and `aria-checked`, which is what makes `getByLabelText(/explain/i)` work in the tests.

I do wonder if a future iteration should persist the context selection in URL query params. Right now switching pages resets nothing, but a direct link to a specific subject and run would be useful for sharing results.

---

## Task 10: TimeSeriesChart

When you look at a motor imagery trial, having all three EEG traces visible at once is not always what you want. The whole point of C3 and C4 is the contrast between them: one hemisphere desynchronizes while the other stays quiet, and that lateralization is what the classifier reads. So the per-channel toggle is not a nice-to-have, it is central to how someone would actually use this chart.

The component builds its Nivo dataset reactively from a `visible` state object, so toggling a channel immediately removes it from the rendered lines:

```typescript
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
```

The shaded region overlays the post-cue window (from t=0 onward), which visually anchors where the imagery period is. Without that, the chart is just a waveform with no spatial reference for when the brain response should appear.

One infrastructural consequence of this task was the `moduleNameMapper` added to `jest.config.ts`, routing all `@nivo/*` imports to a lightweight stub during testing. jsdom cannot execute Nivo's SVG rendering pipeline, so the mock is what makes the component tests possible at all. I do wonder if at some point we will want snapshot tests against the actual rendered SVG, but that would require a different test environment entirely.

---

## Task 11: PSDChart

Power spectral density is where motor imagery EEG becomes legible as a frequency-domain phenomenon. A raw timeseries tells you the voltage is fluctuating, but it does not tell you at which frequencies or by how much. The PSD does. And for motor imagery specifically, the frequencies that matter are already known from the literature: mu (8-12 Hz) and beta (13-30 Hz), both of which suppress over the contralateral motor cortex during imagined movement. I do think that knowing where to look is half the job of a good visualization, which is why the band-highlighting exists.

The key design decision was rendering the band labels twice. Inside the Nivo chart, a custom SVG layer handles the shaded band regions:

```tsx
({ xScale, innerHeight }: any) => (
  <BandLayer xScale={xScale} innerHeight={innerHeight}
    fmin={8} fmax={12} color="#a78bfa" label="μ" />
),
```

But since Nivo is fully mocked in the test environment (returning a bare div), those SVG layers never execute. So the band labels also live as plain HTML in a legend row above the chart:

```tsx
<span style={{ color: '#a78bfa' }}>μ <span className="text-text-muted font-sans">8-12 Hz</span></span>
<span style={{ color: '#7c6fff' }}>β <span className="text-text-muted font-sans">13-30 Hz</span></span>
```

This means the `getByText('μ')` and `getByText('β')` assertions always find something regardless of chart rendering.

The `explain` prop drives a short prose caption about ERD and ERS. To me, that caption matters because the suppression of mu during imagined movement (ERD) and the rebound of beta afterward (ERS) are not obvious from looking at a curve. I do wonder whether future iterations should annotate the actual ERD/ERS windows directly on the plot rather than describing them in text, which would make the causal link between the signal and the neuroscience far more immediate.

---

## Task 12: TopoplotImage

I do think the topoplot is the hardest visualization in this stack to get right from an embedding standpoint. The chart components in Tasks 10 and 11 both pull in Nivo and build their own SVG from data arrays. This one is different: MNE has already rendered the scalp map server-side and handed us back a complete SVG string. So the question is just how to embed it cleanly without re-rendering or losing the dark theme styling that was baked in by the backend.

Using `dangerouslySetInnerHTML` is the correct answer here, but it does carry a note: this is only safe because the SVG content comes exclusively from our own FastAPI backend. If this ever became a user-upload path, that would need to change. For this project, the content is fully server-controlled, so the risk is zero.

The mu/beta toggle is the other interesting piece. Those two bands suppress in the same motor cortex region during imagery, but they do not always do it at the same time or to the same degree. The beta rebound, for instance, often happens after the imagery ends rather than during it. Being able to switch between the two topoplots on the same epoch is a quick way to see that difference without needing to write any code.

---

## Task 13: Visualize Page Wiring

This is the page that actually connects everything. The ContextBar from Task 9 drives the dataset/subject/run selection, and when the user hits Load, the page calls `loadData` to warm the server cache and then fires all three visualization requests in parallel:

```typescript
const [ts, psdData, topo] = await Promise.all([
  api.getTimeseries(dataset, subject, run),
  api.getPSD(dataset, subject, run, 'C3'),
  api.getTopoplot(dataset, subject, run, freqBand),
])
```

The parallel fetch matters because MOABB is the slow part, not the derived computations. Once the epochs are in memory, timeseries slicing, Welch PSD, and topoplot rendering are all fast, so there is no reason to wait on one before starting the next.

One thing I noticed while wiring this up: the `freqBand` state lives at the page level rather than inside `TopoplotImage`. That might look like over-engineering, but it is the right call. Band selection is a property of the data context, not of the chart widget. If we later want the timeseries to highlight the same band, or the PSD to mark the active band with a different color, the state is already in the right place. To me, this is exactly the kind of decision that seems trivial now but prevents a refactor later.

---

## Task 14: Placeholder Pages

The classify and benchmark pages are basically two lines of JSX each, but I do think they are worth explaining because the content choices are not arbitrary. Blankertz et al. 2008 is the CSP paper, and Ang et al. 2008 is the filter bank extension. Those are the papers you have to actually read before the classify implementation will make sense — not as a prerequisite for the code, but as a prerequisite for the design decisions the code is expressing. If you implement CSP without reading Blankertz, you end up with a black box. If you read it first, you understand why the spatial filter is optimizing the ratio of class variances, and that changes how you think about what the algorithm is actually doing to the signal.

The same logic applies to Lotte et al. 2018 on the benchmark side. To me, embedding the citation directly in the UI is a reminder that this project is not just a pipeline but a study tool.

---

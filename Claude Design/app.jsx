// Main app: NavBar + ContextBar + VisualizePage

// --- icons (minimal, inline) ------------------------------------------------
const Icon = {
  Brain: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 3a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 9.5a3 3 0 0 0 1 2.3A3 3 0 0 0 5 16a3 3 0 0 0 2.5 3 3 3 0 0 0 3 2h1V3H9.5Z"/>
      <path d="M14.5 3a3 3 0 0 1 3 3v.2A3 3 0 0 1 20 9.5a3 3 0 0 1-1 2.3A3 3 0 0 1 19 16a3 3 0 0 1-2.5 3 3 3 0 0 1-3 2h-1V3H14.5Z"/>
    </svg>
  ),
  Chevron: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"/></svg>
  ),
  Play: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...props}><polygon points="6 4 20 12 6 20" /></svg>
  ),
  Info: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="8.01"/><line x1="12" y1="11" x2="12" y2="16"/></svg>
  ),
  Spinner: () => <span className="spinner" />,
  Arrow: (props) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"/></svg>,
};

// --- Dropdown ---------------------------------------------------------------
function Dropdown({ label, value, options, onChange, width = 168, disabled = false, mono = true }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ fontSize: 10, color: "#64748b", fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="dropdown-btn"
        style={{ width }}
      >
        <span style={{ fontFamily: mono ? "ui-monospace, monospace" : "Inter, system-ui, sans-serif", color: "#e2e8f0" }}>{value}</span>
        <Icon.Chevron style={{ color: "#64748b", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ width }}>
          {options.map(opt => (
            <button
              key={opt}
              className={"dropdown-item " + (opt === value ? "active" : "")}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
              {opt === value && <span style={{ color: "#a78bfa" }}>●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- NavBar -----------------------------------------------------------------
function NavBar({ tab, onTab }) {
  const tabs = [
    { id: "visualize", label: "Visualize", active: true },
    { id: "classify", label: "Classify" },
    { id: "benchmark", label: "Benchmark" },
  ];
  return (
    <header className="nav">
      <div className="wordmark">
        <span className="mark-serif"><em>Cortex</em></span>
        <span><span style={{ color: "#a78bfa" }}>~/</span>eeg<span style={{ color: "#64748b" }}>·</span>mi</span>
        <span className="nav-badge">v0.1.0</span>
      </div>
      <nav className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={"nav-tab " + (tab === t.id ? "active" : "")}
          >
            {t.label}
            {!t.active && t.id !== "visualize" && <span className="soon">soon</span>}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <div className="status-pill"><span className="status-dot" />api · localhost:8000</div>
        <div className="kbd">⌘K</div>
      </div>
    </header>
  );
}

// --- ContextBar -------------------------------------------------------------
function ContextBar({ dataset, setDataset, subject, setSubject, run, setRun, options, onLoad, loading, explain, setExplain, loaded }) {
  const subjects = options.subjects[dataset] || [];
  const runs = options.runs[dataset] || [];

  return (
    <div className="ctxbar">
      <div className="ctxbar-inner">
        <Dropdown label="dataset" value={dataset} options={options.datasets} onChange={setDataset} width={188} />
        <Dropdown label="subject" value={String(subject)} options={subjects.map(String)} onChange={(v) => setSubject(parseInt(v))} width={96} />
        <Dropdown label="run"     value={run}            options={runs}                  onChange={setRun}      width={112} />

        <button className={"load-btn " + (loading ? "loading" : "")} onClick={onLoad} disabled={loading}>
          {loading ? <><Icon.Spinner /> loading</> : <><Icon.Play /> load</>}
        </button>

        <div style={{ flex: 1 }} />

        <label className="toggle">
          <input type="checkbox" checked={explain} onChange={(e) => setExplain(e.target.checked)} />
          <span className="toggle-slider" />
          <span className="toggle-label"><Icon.Info /> Explain</span>
        </label>
      </div>
      {loaded && (
        <div className="ctxbar-meta">
          <span>n_epochs <b>{loaded.n_epochs}</b></span>
          <span className="sep">·</span>
          <span>sfreq <b>{loaded.sfreq} Hz</b></span>
          <span className="sep">·</span>
          <span>window <b>[{loaded.tmin.toFixed(1)}, {loaded.tmax.toFixed(1)}]s</b></span>
          <span className="sep">·</span>
          <span>channels <b>{loaded.channels.length}</b></span>
          <span className="sep">·</span>
          <span>classes <b>{loaded.classes.join(" / ")}</b></span>
        </div>
      )}
    </div>
  );
}

// --- ChartCard --------------------------------------------------------------
function ChartCard({ title, meta, children, explain, explainText, controls }) {
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          <div className="card-meta">{meta}</div>
        </div>
        {controls && <div className="card-controls">{controls}</div>}
      </header>
      <div className="card-body">{children}</div>
      {explain && (
        <div className="explain">
          <Icon.Info />
          <p>{explainText}</p>
        </div>
      )}
    </section>
  );
}

// --- VisualizePage ----------------------------------------------------------
function VisualizePage() {
  const opts = React.useMemo(() => MOCK.options(), []);
  const [dataset, setDataset] = React.useState("BNCI2014001");
  const [subject, setSubject] = React.useState(1);
  const [run, setRun] = React.useState("run-01");
  const [explain, setExplain] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(null);

  const [epochIdx, setEpochIdx] = React.useState(0);
  const [psdChannel, setPsdChannel] = React.useState("C3");
  const [freqBand, setFreqBand] = React.useState("mu");

  // Reset subject/run if dataset changes
  React.useEffect(() => {
    const subs = opts.subjects[dataset]; const rs = opts.runs[dataset];
    if (subs && !subs.includes(subject)) setSubject(subs[0]);
    if (rs && !rs.includes(run)) setRun(rs[0]);
  }, [dataset]);

  const tsData  = loaded ? MOCK.timeseries(dataset, subject, run, epochIdx) : null;
  const psdData = loaded ? MOCK.psd(dataset, subject, run, psdChannel) : null;
  const topo    = loaded ? MOCK.topoplot(dataset, subject, run, freqBand) : null;

  function doLoad() {
    setLoading(true);
    setLoaded(null);
    setTimeout(() => {
      setLoaded(MOCK.load(dataset, subject, run));
      setLoading(false);
      setEpochIdx(0);
    }, 850);
  }

  // Auto-load once on mount
  React.useEffect(() => {
    doLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalEpochs = loaded?.n_epochs || 1;

  return (
    <>
      <ContextBar
        dataset={dataset} setDataset={setDataset}
        subject={subject} setSubject={setSubject}
        run={run} setRun={setRun}
        options={opts} onLoad={doLoad} loading={loading}
        explain={explain} setExplain={setExplain}
        loaded={loaded}
      />

      <main className="grid">
        {/* Time series — full width */}
        <ChartCard
          title="Time series"
          meta={loaded
            ? <>epoch <b>{epochIdx + 1}/{totalEpochs}</b> <span className="sep">·</span> class <b>{tsData?.class_label}</b> <span className="sep">·</span> window <b>[−0.5, 2.0]s</b></>
            : <>—</>}
          controls={loaded && (
            <div className="row">
              <button className="icon-btn" onClick={() => setEpochIdx(i => Math.max(0, i - 1))} disabled={epochIdx === 0}>
                <Icon.Arrow style={{ transform: "rotate(180deg)" }} />
              </button>
              <span className="mono small">{String(epochIdx + 1).padStart(2, "0")} / {String(totalEpochs).padStart(2, "0")}</span>
              <button className="icon-btn" onClick={() => setEpochIdx(i => Math.min(totalEpochs - 1, i + 1))} disabled={epochIdx === totalEpochs - 1}>
                <Icon.Arrow />
              </button>
            </div>
          )}
          explain={explain}
          explainText={tsData?.class_label === "right_hand"
            ? "This epoch was a right-hand motor imagery cue (at t = 0). Watch C3 — the contralateral motor electrode — its mu rhythm (~10 Hz) attenuates between roughly 0.5–1.5 s. That drop is event-related desynchronization (ERD), the classic signature MI classifiers learn to detect."
            : tsData?.class_label === "left_hand"
            ? "Left-hand motor imagery cue at t = 0. Mu-band amplitude on C4 (contralateral) suppresses between ~0.5–1.5 s. C3 stays comparatively unchanged. The shaded ERD window highlights the time region where features are typically extracted."
            : tsData?.class_label === "feet"
            ? "Feet motor imagery cue at t = 0. ERD concentrates around Cz — foot motor cortex sits medially between the hemispheres, so the central midline channel shows the strongest mu suppression."
            : "Tongue motor imagery cue at t = 0. Activation is broader and harder to localize from 3 channels alone — Classify will use all 22 to do better."}
        >
          {loading
            ? <Skeleton height={280} />
            : tsData && <TimeSeriesChart data={tsData} />}
        </ChartCard>

        {/* PSD */}
        <ChartCard
          title="Power spectral density"
          meta={loaded ? <>welch <span className="sep">·</span> 1–40 Hz <span className="sep">·</span> all epochs averaged</> : "—"}
          controls={loaded && (
            <div className="row">
              {["C3", "C4", "Cz"].map(ch => (
                <button key={ch}
                  className={"pill " + (psdChannel === ch ? "active" : "")}
                  onClick={() => setPsdChannel(ch)}>
                  {ch}
                </button>
              ))}
            </div>
          )}
          explain={explain}
          explainText={`Average power across all epochs for ${psdChannel}. The shaded μ (8–13 Hz) and β (13–30 Hz) bands are the frequency ranges where motor imagery produces the most distinct changes. A healthy peak in μ at rest, suppressed during imagined movement, is what the classifier exploits.`}
        >
          {loading
            ? <Skeleton height={240} />
            : psdData && <PSDChart data={psdData} />}
        </ChartCard>

        {/* Topoplot */}
        <ChartCard
          title="Topography"
          meta={loaded ? <>scalp · {freqBand} band <span className="sep">·</span> rdbu</> : "—"}
          controls={loaded && (
            <div className="row">
              {[
                ["mu", "μ"],
                ["beta", "β"],
                ["alpha", "α"],
                ["broadband", "all"],
              ].map(([b, l]) => (
                <button key={b}
                  className={"pill " + (freqBand === b ? "active" : "")}
                  onClick={() => setFreqBand(b)}>
                  {l}
                </button>
              ))}
            </div>
          )}
          explain={explain}
          explainText={
            freqBand === "mu"
              ? "Mu-band (8–13 Hz) topography. Cool colors over C3 and C4 indicate bilateral motor-cortex desynchronization during the imagined movement — exactly where you'd expect MI activity. This is the spatial signal CSP and Riemannian features encode."
              : freqBand === "beta"
              ? "Beta-band (13–30 Hz) topography. Sensorimotor regions show suppression with a smaller spatial footprint than mu. Beta rebound after the cue is often more lateralized than mu ERD."
              : freqBand === "alpha"
              ? "Alpha-band topography. Hot colors over POz/Pz are occipital alpha — eyes-open posterior alpha, unrelated to motor imagery. Useful as a sanity check that the band ranges are doing what you expect."
              : "Broadband (1–40 Hz) topography. With everything averaged together, motor-cortex specificity is washed out — you mostly see overall signal magnitude. Why narrow-band analysis matters."
          }
        >
          {loading
            ? <Skeleton height={280} />
            : topo && <TopoplotImage data={topo} />}
        </ChartCard>
      </main>

      <footer className="footer">
        <span>mock data · ui prototype</span>
        <span className="sep">·</span>
        <span>backend not connected</span>
        <span style={{ marginLeft: "auto" }} className="mono">CNEW Munich · Jun 17 2026</span>
      </footer>
    </>
  );
}

// --- Placeholder pages ------------------------------------------------------
function PlaceholderPage({ title, blurb }) {
  return (
    <main className="placeholder">
      <div className="placeholder-card">
        <div className="placeholder-tag">week 2+</div>
        <h2>{title}</h2>
        <p>{blurb}</p>
      </div>
    </main>
  );
}

function Skeleton({ height }) {
  return <div className="skeleton" style={{ height }} />;
}

// --- Tweaks: font pairing audition ----------------------------------------
const FONT_PAIRS = /*EDITMODE-BEGIN*/{
  "fontPair": "plex",
  "displayAccent": true
}/*EDITMODE-END*/;

const PAIR_DEFS = {
  plex: {
    label: "Plex",
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
    sans: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    display: '"Instrument Serif", "IBM Plex Sans", serif',
    note: "IBM Plex — coherent designed pair, scientific tone",
  },
  space: {
    label: "Space",
    mono: '"Space Mono", ui-monospace, monospace',
    sans: '"Space Grotesk", -apple-system, system-ui, sans-serif',
    display: '"Instrument Serif", "Space Grotesk", serif',
    note: "Space — geometric, distinctive, designed as siblings",
  },
  jetbrains: {
    label: "JetBrains",
    mono: '"JetBrains Mono", ui-monospace, monospace',
    sans: '"Inter", -apple-system, system-ui, sans-serif',
    display: '"Instrument Serif", "Inter", serif',
    note: "JetBrains Mono + Inter — original default",
  },
};

function AppTweaks() {
  const [t, setTweak] = useTweaks(FONT_PAIRS);

  React.useEffect(() => {
    const def = PAIR_DEFS[t.fontPair] || PAIR_DEFS.plex;
    const r = document.documentElement.style;
    r.setProperty("--mono", def.mono);
    r.setProperty("--sans", def.sans);
    r.setProperty("--display", def.display);
  }, [t.fontPair]);

  React.useEffect(() => {
    // toggle the italic accent on the wordmark "Cortex" word
    const el = document.querySelector(".wordmark .mark-serif em");
    if (el) el.style.color = t.displayAccent ? "var(--accent)" : "var(--text)";
  }, [t.displayAccent]);

  const def = PAIR_DEFS[t.fontPair] || PAIR_DEFS.plex;

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Typography">
        <TweakRadio
          label="Font pair"
          value={t.fontPair}
          onChange={(v) => setTweak("fontPair", v)}
          options={[
            { value: "plex", label: "Plex" },
            { value: "space", label: "Space" },
            { value: "jetbrains", label: "JetBrains" },
          ]}
        />
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
          {def.note}
        </div>
        <TweakToggle
          label="Italic accent in wordmark"
          value={t.displayAccent}
          onChange={(v) => setTweak("displayAccent", v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}
function App() {
  const [tab, setTab] = React.useState("visualize");
  return (
    <>
      <NavBar tab={tab} onTab={setTab} />
      {tab === "visualize" && <VisualizePage />}
      {tab === "classify" && <PlaceholderPage title="Classify" blurb="CSP + LDA, Riemannian, and EEGNet baselines. Per-subject cross-validation, confusion matrices, and feature visualizations. Wired in Week 2." />}
      {tab === "benchmark" && <PlaceholderPage title="Benchmark" blurb="Run any pipeline across all subjects in the selected dataset. Leaderboard view with mean accuracy, kappa, and standard error. Wired in Week 3." />}
      <AppTweaks />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

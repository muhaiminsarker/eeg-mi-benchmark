'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '@/lib/api'
import * as MOCK from '@/lib/mock-data'
import TopBar from '@/components/layout/TopBar'
import { useNavSlot } from '@/lib/nav-slot-context'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import PSDChart from '@/components/visualize/PSDChart'
import TopoplotImage from '@/components/visualize/TopoplotImage'
import type { TimeseriesData, PSDData, TopoplotData } from '@/lib/mock-data'

export interface AppOptions {
  datasets: { value: string; label: string }[]
  subjects: { [datasetId: string]: number[] }
  runs: { [datasetId: string]: { value: string; label: string }[] }
}

export interface LoadedMeta {
  n_epochs: number
  sfreq: number
  tmin: number
  tmax: number
  channels: string[]
  classes: string[]
}

const RUN_LABELS: Record<string, string> = {
  imagined_hand:   'Imagined Left / Right Hand',
  imagined_feet:   'Imagined Feet',
  imagined_tongue: 'Imagined Tongue',
}

function mockToApp(m: MOCK.MockOptions): AppOptions {
  return {
    datasets: m.datasets.map((id) => ({ value: id, label: id })),
    subjects: m.subjects,
    runs: Object.fromEntries(
      Object.entries(m.runs).map(([ds, rs]) => [
        ds,
        rs.map((r) => ({ value: r, label: RUN_LABELS[r] ?? r })),
      ])
    ),
  }
}

function inferClasses(run: string): string[] {
  if (run === 'imagined_hand') return ['left_hand', 'right_hand']
  if (run === 'imagined_feet') return ['feet']
  if (run === 'imagined_tongue') return ['tongue']
  return []
}

// ---- Icons ---------------------------------------------------------------
function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20" />
    </svg>
  )
}

function ArrowIcon({ left }: { left?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: left ? 'rotate(180deg)' : 'none' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// ---- ExplainPanel --------------------------------------------------------
function ExplainPanel({ short, full }: { short: string; full?: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="explain">
      <InfoIcon />
      <p>
        {expanded && full ? full : short}
        {full && !expanded && (
          <>
            {' '}
            <a
              href="#"
              style={{ color: 'var(--accent)', textUnderlineOffset: '2px' }}
              onClick={(e) => { e.preventDefault(); setExpanded(true) }}
            >
              more ↓
            </a>
          </>
        )}
        {expanded && (
          <>
            {' '}
            <a
              href="#"
              style={{ color: 'var(--text-muted)', textUnderlineOffset: '2px', fontSize: '9px' }}
              onClick={(e) => { e.preventDefault(); setExpanded(false) }}
            >
              less ↑
            </a>
          </>
        )}
      </p>
    </div>
  )
}

// ---- ChartCard -----------------------------------------------------------
interface ChartCardProps {
  title: string
  meta: React.ReactNode
  controls?: React.ReactNode
  explain: boolean
  explainText: string
  explainTextFull?: string
  children: React.ReactNode
  animClass?: string
}

function ChartCard({ title, meta, controls, explain, explainText, explainTextFull, children, animClass }: ChartCardProps) {
  return (
    <section className={'card' + (animClass ? ' ' + animClass : '')}>
      <header className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          <div className="card-meta">{meta}</div>
        </div>
        {controls && <div className="card-controls">{controls}</div>}
      </header>
      <div className="card-body">{children}</div>
      {explain && explainText && (
        <ExplainPanel short={explainText} full={explainTextFull} />
      )}
    </section>
  )
}

function Skeleton({ height }: { height: number }) {
  return <div className="skeleton" style={{ height }} />
}

function EmptyState({ onLoad }: { onLoad?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 240,
      gap: 12,
      color: 'var(--text-muted)',
      fontFamily: 'var(--mono)',
      fontSize: 12,
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="10 8 6 12 10 16" />
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>Select dataset and press <b style={{ color: 'var(--text)' }}>load</b></span>
    </div>
  )
}

// ---- Class label pill -----------------------------------------------------
const CLASS_COLORS: Record<string, string> = {
  left_hand: '#6495ed',
  right_hand: '#e06464',
  feet: '#5cb88a',
  tongue: '#888',
}

function ClassBadge({ label }: { label: string }) {
  if (!label) return null
  const color = CLASS_COLORS[label] ?? 'var(--text-dim)'
  const display = label.replace('_', ' ')
  return (
    <span style={{
      fontFamily: 'var(--mono)',
      fontSize: 10,
      color,
      padding: '2px 8px',
      border: `1px solid ${color}`,
      borderRadius: 4,
      opacity: 0.9,
      marginLeft: 4,
    }}>
      {display}
    </span>
  )
}

// ---- EpochStrip ----------------------------------------------------------
const LABEL_COLORS: Record<string, string> = {
  left_hand: '#6495ed',
  right_hand: '#e06464',
  feet: '#5cb88a',
  tongue: '#888',
}

function EpochStrip({ labels, current, onSelect }: { labels: string[]; current: number; onSelect: (i: number) => void }) {
  if (labels.length === 0) return null
  const counts = labels.reduce<Record<string, number>>((acc, l) => { acc[l] = (acc[l] ?? 0) + 1; return acc }, {})
  return (
    <div style={{ marginTop: 8, marginBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Epoch strip
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {Object.entries(counts).map(([label, count]) => (
            <span key={label} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: LABEL_COLORS[label] ?? '#888', letterSpacing: '0.05em' }}>
              {label.replace('_', ' ')} <b style={{ color: 'var(--text)' }}>{count}</b>
            </span>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: 0,
        flexWrap: 'nowrap',
        overflow: 'hidden',
        padding: '3px 0 6px',
        cursor: 'pointer',
      }}>
        {labels.map((label, i) => {
          const isCurrent = i === current
          const color = LABEL_COLORS[label] ?? '#888'
          return (
            <div
              key={i}
              title={`Click to jump · Epoch ${i + 1}: ${label.replace('_', ' ')}`}
              onClick={() => onSelect(i)}
              style={{
                flex: isCurrent ? '2 1 0' : '1 1 0',
                minWidth: isCurrent ? 4 : 2,
                height: 32,
                borderRadius: 1,
                background: color,
                opacity: isCurrent ? 1 : 0.3,
                transition: 'opacity 0.1s, flex 0.12s',
                outline: isCurrent ? `2px solid ${color}` : 'none',
                outlineOffset: 1,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---- Page ----------------------------------------------------------------
export default function VisualizePage() {
  const mockOpts = useMemo(() => MOCK.options(), [])

  const [appOptions, setAppOptions] = useState<AppOptions | null>(null)
  const [isBackend, setIsBackend] = useState(false)
  const [isMockFallback, setIsMockFallback] = useState(false)
  const [explain, setExplain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState<LoadedMeta | null>(null)

  const [dataset, setDataset] = useState('')
  const [subject, setSubject] = useState(1)
  const [run, setRun] = useState('')

  const [epochIdx, setEpochIdx] = useState(0)
  const [psdChannel, setPsdChannel] = useState('C3')
  const [freqBand, setFreqBand] = useState('mu')
  const [playing, setPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState<'slow' | 'normal' | 'fast'>('normal')

  const [tsData, setTsData] = useState<TimeseriesData | null>(null)
  const [psdData, setPsdData] = useState<PSDData | null>(null)
  const [topoData, setTopoData] = useState<TopoplotData | null>(null)
  const [epochLabels, setEpochLabels] = useState<string[]>([])

  // Fetch options — try backend first, fall back to mock
  useEffect(() => {
    api.getOptions()
      .then((opts) => {
        const beOpts: AppOptions = {
          datasets: opts.datasets,
          subjects: Object.fromEntries(opts.datasets.map((d) => [d.value, opts.subjects as number[]])),
          runs: Object.fromEntries(opts.datasets.map((d) => [d.value, opts.runs as { value: string; label: string }[]])),
        }
        setAppOptions(beOpts)
        setIsBackend(true)
        const firstDs = opts.datasets[0]?.value ?? ''
        const firstSubj = (opts.subjects as number[])[0] ?? 1
        const firstRun = (opts.runs as { value: string; label: string }[])[0]?.value ?? ''
        setDataset(firstDs)
        setSubject(firstSubj)
        setRun(firstRun)
        // Don't auto-load — let user press load button
      })
      .catch(() => {
        // Backend unavailable — show mock options but don't auto-load
        const mo = mockToApp(mockOpts)
        setAppOptions(mo)
        setIsBackend(false)
        const firstDs = mockOpts.datasets[0]
        const firstSubj = mockOpts.subjects[firstDs]?.[0] ?? 1
        const firstRun = mockOpts.runs[firstDs]?.[0] ?? ''
        setDataset(firstDs)
        setSubject(firstSubj)
        setRun(firstRun)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doLoad(ds: string, subj: number, r: string, backend: boolean) {
    setLoading(true)
    setLoaded(null)
    setTsData(null)
    setPsdData(null)
    setTopoData(null)
    setEpochIdx(0)
    setIsMockFallback(false)
    setEpochLabels([])

    if (backend) {
      try {
        const meta = await api.loadData(ds, subj, r)
        const classes = inferClasses(r)
        setLoaded({ ...meta, classes })

        const [ts, psdMulti, topo] = await Promise.all([
          api.getTimeseries(ds, subj, r, 0),
          api.getPSDMulti(ds, subj, r, 'C3,C4,Cz'),
          api.getTopoplot(ds, subj, r, freqBand as 'mu' | 'beta'),
        ])
        setTsData({ ...ts, class_label: ts.class_label ?? '' })
        const allCh = psdMulti.channels as { C3: number[]; C4: number[]; Cz: number[] }
        setPsdData({
          freqs: psdMulti.freqs,
          power: allCh[psdChannel as 'C3' | 'C4' | 'Cz'] ?? allCh.C3,
          channel: psdChannel,
          allChannels: allCh,
        })
        setTopoData({ svg: topo.svg, band: freqBand, vmin: -1, vmax: 1 })
        // Fetch all epoch labels for the strip (non-blocking)
        api.getLabels(ds, subj, r).then((res) => setEpochLabels(res.labels)).catch(() => {})
      } catch (e) {
        console.error('Backend load failed, falling back to mock:', e)
        setIsMockFallback(true)
        loadFromMock(ds, subj, r, 0)
      }
    } else {
      // Pure mock mode — add artificial delay so skeleton is visible
      await new Promise((res) => setTimeout(res, 650))
      loadFromMock(ds, subj, r, 0)
    }
    setLoading(false)
  }

  function loadFromMock(ds: string, subj: number, r: string, epochI: number) {
    const meta = MOCK.load(ds, subj, r)
    setLoaded(meta)
    const tsM = MOCK.timeseries(ds, subj, r, epochI)
    setTsData(tsM)
    const psdC3 = MOCK.psd(ds, subj, r, 'C3')
    const psdC4 = MOCK.psd(ds, subj, r, 'C4')
    const psdCz = MOCK.psd(ds, subj, r, 'Cz')
    const activePsd = psdChannel === 'C4' ? psdC4 : psdChannel === 'Cz' ? psdCz : psdC3
    setPsdData({
      freqs: psdC3.freqs,
      power: activePsd.power,
      channel: psdChannel,
      allChannels: { C3: psdC3.power, C4: psdC4.power, Cz: psdCz.power },
    })
    setTopoData(MOCK.topoplot(ds, subj, r, freqBand))
  }

  const handleLoad = useCallback(async (ds: string, subj: number, r: string) => {
    setDataset(ds)
    setSubject(subj)
    setRun(r)
    await doLoad(ds, subj, r, isBackend)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBackend])

  const { setSlot } = useNavSlot()

  useEffect(() => {
    if (!appOptions) return
    setSlot(
      <TopBar
        options={appOptions}
        loaded={loaded}
        loading={loading}
        explain={explain}
        onExplainChange={setExplain}
        onLoad={handleLoad}
      />
    )
    return () => setSlot(null)
  }, [appOptions, loaded, loading, explain, setExplain, handleLoad, setSlot])

  // Keyboard navigation for epochs
  useEffect(() => {
    if (!loaded) return
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') setEpochIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setEpochIdx((i) => Math.min((loaded?.n_epochs ?? 1) - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const PLAY_MS = { slow: 1200, normal: 500, fast: 150 }

  // Auto-play: advance one epoch at the chosen speed
  useEffect(() => {
    if (!playing || !loaded) return
    const timer = setInterval(() => {
      setEpochIdx((i) => {
        if (i >= (loaded?.n_epochs ?? 1) - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, PLAY_MS[playSpeed])
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, loaded, playSpeed])

  // When epoch changes
  useEffect(() => {
    if (!loaded) return
    if (isBackend && !isMockFallback) {
      api.getTimeseries(dataset, subject, run, epochIdx)
        .then((ts) => setTsData({ ...ts, class_label: ts.class_label ?? '' }))
        .catch(() => setTsData(MOCK.timeseries(dataset, subject, run, epochIdx)))
    } else {
      setTsData(MOCK.timeseries(dataset, subject, run, epochIdx))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epochIdx])

  // When PSD channel changes — update the highlighted series from cached allChannels
  useEffect(() => {
    if (!psdData?.allChannels) return
    const ch = psdChannel as 'C3' | 'C4' | 'Cz'
    setPsdData((prev) => prev ? { ...prev, power: prev.allChannels![ch], channel: psdChannel } : prev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psdChannel])

  // When band changes — refetch topoplot
  useEffect(() => {
    if (!loaded) return
    if (isBackend && !isMockFallback && (freqBand === 'mu' || freqBand === 'beta')) {
      api.getTopoplot(dataset, subject, run, freqBand as 'mu' | 'beta')
        .then((t) => setTopoData({ svg: t.svg, band: freqBand, vmin: -1, vmax: 1 }))
        .catch(() => setTopoData(MOCK.topoplot(dataset, subject, run, freqBand)))
    } else {
      setTopoData(MOCK.topoplot(dataset, subject, run, freqBand))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freqBand])

  const totalEpochs = loaded?.n_epochs ?? 1

  const tsExplainShort =
    tsData?.class_label === 'right_hand'
      ? 'Each line is a scalp electrode near your motor cortex. Watch the C3 line (left hemisphere) dip after the 0 s cue — that\'s your brain going quieter as you imagine moving your right hand.'
      : tsData?.class_label === 'left_hand'
      ? 'C4 (right hemisphere) dips after the cue for left-hand imagery. Your brain suppresses activity on the side opposite to the imagined limb — the wider the gap between C3 and C4, the easier it is to classify.'
      : tsData?.class_label === 'feet'
      ? 'Foot motor cortex sits at the top-center of the brain, so the Cz line (midline) drops most after the cue. The sides (C3/C4) stay relatively flat — a clean midline-only dip.'
      : tsData?.class_label === 'tongue'
      ? 'Tongue motor cortex is near the midline and slightly lateral. After the cue, Cz and neighboring channels dip — distinct from the strong left/right asymmetry you\'d see for hand imagery.'
      : 'Three electrodes near motor cortex. The flat region before 0 s is baseline. After the cue, watch for a dip in the lines — that\'s your brain "quieting down" during imagined movement.'

  const tsExplainFull =
    tsData?.class_label === 'right_hand'
      ? 'When you imagine moving your right hand, neurons in the left motor cortex (C3) suppress their natural 8–13 Hz rhythm — like turning down background radio static. This drop is called event-related desynchronization (ERD). The classifier learns to spot which electrode dips most to determine which hand you imagined.'
      : tsData?.class_label === 'left_hand'
      ? 'Imagining your left hand quiets the right motor cortex, so C4 dips after the cue. C3 stays relatively active. The classifier reads this asymmetry: if C4 drops more than C3, it predicts left hand. This left-right pattern is the core feature that makes motor imagery classifiable.'
      : tsData?.class_label === 'feet'
      ? 'Feet motor imagery activates the top-center of cortex (the medial wall), which maps directly to the Cz electrode. Unlike hand imagery — which creates an obvious left-right asymmetry — feet imagery creates a front-to-back pattern centered on Cz. C3 and C4 stay quiet while Cz dips.'
      : tsData?.class_label === 'tongue'
      ? 'Tongue motor cortex sits near the midline and slightly lateral. Its imagery pattern is more diffuse than hand imagery, showing a modest dip at Cz with less pronounced left-right asymmetry. The classifier uses the unique spatial fingerprint to distinguish tongue from hand or feet imagery.'
      : `Motor imagery epoch from subject ${subject}. Baseline runs from −0.5 s before the cue to 0 s. The imagery window is 0–4 s. C3 sits over left motor cortex, C4 over right, and Cz is the midline. Use arrow keys or the play button to browse all ${loaded?.n_epochs ?? ''} epochs.`

  const psdExplainShort =
    run === 'imagined_hand'
      ? 'This "frequency fingerprint" shows brain activity at each Hz. The dip between 8–13 Hz (mu rhythm) is your motor cortex going quieter during imagined movement — that dip is the core signal this BCI uses.'
      : run === 'imagined_feet'
      ? 'The hollow around 8–13 Hz is the mu rhythm suppressing during foot imagery. Cz typically shows the deepest dip, since foot motor cortex is on the midline directly below it.'
      : run === 'imagined_tongue'
      ? 'Tongue imagery produces a broader mu suppression (8–13 Hz) across channels. Compare channels using the buttons above to see where the dip is deepest.'
      : 'Brain activity at each frequency, averaged across all trials. The dip around 8–13 Hz is the mu rhythm — your motor cortex goes quieter when you imagine moving.'

  const psdExplainFull =
    run === 'imagined_hand'
      ? `This shows how much electrical power exists at each frequency (1–40 Hz), averaged across all ${loaded?.n_epochs ?? ''} trials. Your motor cortex has a natural "idle" rhythm at 8–13 Hz (mu) and 13–30 Hz (beta). When you imagine a movement, these rhythms suppress — leaving a dip in the curve. A deeper C3 dip vs. C4 signals right-hand imagery; a deeper C4 signals left hand. Use the C3 / C4 / Cz buttons to compare.`
      : `This shows how much electrical power exists at each frequency (1–40 Hz), averaged across all ${loaded?.n_epochs ?? ''} trials. The dip around 8–13 Hz is the mu rhythm suppressing during motor imagery — the brain turning down its "idle" motor oscillation. For feet and tongue imagery, the suppression is strongest at Cz (midline) rather than the lateral channels.`

  const topoExplainShort =
    freqBand === 'mu'
      ? 'A top-down head view. Cool/blue areas have lower brain activity — motor cortex goes "quiet" during imagined movement. That cool patch over C3/C4 is the signal the classifier reads.'
      : freqBand === 'beta'
      ? 'Beta (13–30 Hz) map. Suppression is more focused than the mu map and recovers sharply after the imagery window ends — a separate but complementary signature.'
      : freqBand === 'alpha'
      ? 'Alpha in the occipital region (back of head) is a visual resting rhythm, unrelated to motor imagery. It\'s shown here as a sanity check — that hot patch at the back should look the same regardless of task.'
      : 'All frequencies averaged together — this washes out task-specific patterns. You\'re seeing overall signal strength, not the motor-specific information the classifier uses.'

  const topoExplainFull =
    freqBand === 'mu'
      ? 'The mu map (8–13 Hz) shows which brain areas suppressed their rhythms during motor imagery, averaged across all trials. Cool colors (blue) over C3 and C4 mean motor cortex went "quiet" — exactly where it should. CSP and Riemannian classifiers encode this spatial pattern as a covariance matrix to distinguish classes.'
      : freqBand === 'beta'
      ? 'Beta-band (13–30 Hz) topography shows sensorimotor suppression with a tighter spatial pattern than mu. After the imagery window ends, beta rebounds strongly — a phenomenon called "beta rebound" — which is a reliable contralateral signature that some BCI pipelines also exploit.'
      : freqBand === 'alpha'
      ? 'Alpha topography is dominated by the posterior alpha rhythm in occipital cortex — completely unrelated to motor imagery. This view is intentionally included as a sanity check: the occipital "hotspot" should look the same regardless of which hand or movement you imagined.'
      : 'Broadband power (1–40 Hz) blends the task-specific motor signal with unrelated rhythms like occipital alpha and frontal theta. The result shows raw amplitude distribution across the scalp. Switch to the mu or beta maps to see the motor-specific patterns the classifier actually uses.'

  if (!appOptions) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
        <div className="ctxbar">
          <div className="ctxbar-inner">
            <div className="skeleton" style={{ width: 188, height: 54 }} />
            <div className="skeleton" style={{ width: 96, height: 54 }} />
            <div className="skeleton" style={{ width: 112, height: 54 }} />
          </div>
        </div>
        <div className="viz-grid">
          <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 280 }} /></div></div>
          <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 240 }} /></div></div>
          <div className="card"><div className="card-body"><div className="skeleton" style={{ height: 240 }} /></div></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {isMockFallback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 6,
          marginTop: 12,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: '#fbbf24',
        }}>
          <WarnIcon />
          Backend load failed — showing synthetic mock data as fallback. Real data unavailable.
        </div>
      )}

      {epochLabels.length > 0 && (
        <EpochStrip labels={epochLabels} current={epochIdx} onSelect={setEpochIdx} />
      )}

      <main className="viz-grid" key={loaded ? `loaded-${dataset}-${subject}-${run}` : 'empty'}>
        {/* Time Series — full width */}
        <ChartCard
          animClass={loaded ? 'chart-reveal chart-reveal-1' : undefined}
          title="Time series"
          meta={
            loaded ? (
              <>
                epoch <b>{epochIdx + 1}/{totalEpochs}</b>
                <span className="sep">·</span>
                window <b>[{loaded.tmin.toFixed(1)}, {loaded.tmax.toFixed(1)}]s</b>
                <span className="sep">·</span>
                <span style={{ fontSize: 9, letterSpacing: '0.05em', opacity: 0.5 }}>← →</span>
                {tsData?.class_label && <ClassBadge label={tsData.class_label} />}
              </>
            ) : '—'
          }
          controls={
            loaded ? (
              <div className="row">
                <button className="icon-btn" onClick={() => setEpochIdx((i) => Math.max(0, i - 1))} disabled={epochIdx === 0 || playing}
                  title="Previous epoch (←)">
                  <ArrowIcon left />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setPlaying((p) => !p)}
                  title={playing ? 'Pause' : 'Auto-play epochs'}
                  style={{ color: playing ? 'var(--accent)' : undefined }}
                >
                  {playing
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>
                    : <PlayIcon />
                  }
                </button>
                <span className="mono small">
                  {String(epochIdx + 1).padStart(2, '0')} / {String(totalEpochs).padStart(2, '0')}
                </span>
                <button className="icon-btn" onClick={() => setEpochIdx((i) => Math.min(totalEpochs - 1, i + 1))} disabled={epochIdx === totalEpochs - 1 || playing}
                  title="Next epoch (→)">
                  <ArrowIcon />
                </button>
                <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
                {(['slow', 'normal', 'fast'] as const).map((s) => (
                  <button key={s} className={'pill' + (playSpeed === s ? ' active' : '')} onClick={() => setPlaySpeed(s)}
                    title={s === 'slow' ? '1.2 s/epoch' : s === 'normal' ? '0.5 s/epoch' : '0.15 s/epoch'}>
                    {s === 'slow' ? '0.5×' : s === 'normal' ? '1×' : '3×'}
                  </button>
                ))}
              </div>
            ) : undefined
          }
          explain={explain}
          explainText={tsExplainShort}
          explainTextFull={tsExplainFull}
        >
          {loading ? <Skeleton height={280} /> : tsData ? <TimeSeriesChart data={tsData} /> : <EmptyState />}
        </ChartCard>

        {/* PSD */}
        <ChartCard
          animClass={loaded ? 'chart-reveal chart-reveal-2' : undefined}
          title="Power spectral density"
          meta={loaded ? <>welch <span className="sep">·</span> 1–40 Hz <span className="sep">·</span> {loaded.n_epochs} epochs averaged</> : '—'}
          controls={
            loaded ? (
              <div className="row">
                {(['C3', 'C4', 'Cz'] as const).map((ch) => (
                  <button key={ch} className={'pill' + (psdChannel === ch ? ' active' : '')} onClick={() => setPsdChannel(ch)}>
                    {ch}
                  </button>
                ))}
              </div>
            ) : undefined
          }
          explain={explain}
          explainText={psdExplainShort}
          explainTextFull={psdExplainFull}
        >
          {loading ? <Skeleton height={240} /> : psdData ? <PSDChart data={psdData} /> : <EmptyState />}
        </ChartCard>

        {/* Topoplot */}
        <ChartCard
          animClass={loaded ? 'chart-reveal chart-reveal-3' : undefined}
          title="Topography"
          meta={loaded ? <>scalp · {freqBand} band <span className="sep">·</span> {isBackend && !isMockFallback ? 'MNE · rdbu' : 'mock · rdbu'}</> : '—'}
          controls={
            loaded ? (
              <div className="row">
                {(['mu', 'beta', 'alpha', 'broadband'] as const).map((b) => (
                  <button key={b} className={'pill' + (freqBand === b ? ' active' : '')} onClick={() => setFreqBand(b)}>
                    {b === 'mu' ? 'μ' : b === 'beta' ? 'β' : b === 'alpha' ? 'α' : 'all'}
                  </button>
                ))}
              </div>
            ) : undefined
          }
          explain={explain}
          explainText={topoExplainShort}
          explainTextFull={topoExplainFull}
        >
          {loading ? <Skeleton height={280} /> : topoData ? <TopoplotImage data={topoData} /> : <EmptyState />}
        </ChartCard>
      </main>

      <footer className="footer">
        <span style={{ color: isBackend ? '#22c55e' : 'var(--text-muted)' }}>
          {isBackend ? '● backend connected' : '○ backend offline'}
        </span>
        {isMockFallback && <span style={{ color: '#fbbf24', marginLeft: 8 }}>⚠ mock fallback</span>}
        <span className="sep">·</span>
        <span>BNCI2014001 · MNE / MOABB</span>
        <span style={{ marginLeft: 'auto' }} className="mono">CNEW Munich · Jun 17 2026</span>
      </footer>
    </>
  )
}

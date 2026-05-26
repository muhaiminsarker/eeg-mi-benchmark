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
function ExplainPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="explain">
      <InfoIcon />
      <p>{children}</p>
    </div>
  )
}

// ---- ChartCard -----------------------------------------------------------
interface ChartCardProps {
  title: string
  meta: React.ReactNode
  controls?: React.ReactNode
  explain: boolean
  explainContent?: React.ReactNode
  children: React.ReactNode
  animClass?: string
}

function ChartCard({ title, meta, controls, explain, explainContent, children, animClass }: ChartCardProps) {
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
      {explain && explainContent && (
        <ExplainPanel>{explainContent}</ExplainPanel>
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
        <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Epoch strip
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {Object.entries(counts).map(([label, count]) => (
            <span key={label} style={{ fontSize: 9, color: LABEL_COLORS[label] ?? '#888', letterSpacing: '0.05em' }}>
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

  const tsExplain: React.ReactNode =
    tsData?.class_label === 'right_hand'
      ? <>Watch the <strong>C3 line dip</strong> after 0 s — that&apos;s left motor cortex going quiet as you imagine your right hand.</>
      : tsData?.class_label === 'left_hand'
      ? <>The <strong>C4 line dips</strong> after the cue — motor cortex quiets on the side opposite to the imagined hand.</>
      : tsData?.class_label === 'feet'
      ? <>The <strong>Cz line dips</strong> most — foot motor cortex sits on the midline, right below that electrode.</>
      : tsData?.class_label === 'tongue'
      ? <>A <strong>modest Cz dip</strong> after the cue — tongue imagery is more midline and less asymmetric than hand imagery.</>
      : <>Watch for a <strong>dip in the lines</strong> after 0 s — that&apos;s motor cortex going quiet during imagined movement.</>

  const psdExplain: React.ReactNode =
    run === 'imagined_hand'
      ? <>The <strong>hollow at 8–13 Hz</strong> is the mu rhythm quieting — the deeper the dip, the stronger the imagery signal the BCI reads.</>
      : run === 'imagined_feet'
      ? <>The <strong>Cz dip at 8–13 Hz</strong> is clearest for feet imagery — foot motor cortex sits on the midline, right below that electrode.</>
      : run === 'imagined_tongue'
      ? <>The <strong>mu dip (8–13 Hz)</strong> is more diffuse for tongue imagery — compare channels to see where it&apos;s deepest.</>
      : <>The <strong>dip around 8–13 Hz</strong> is the mu rhythm — motor cortex goes quieter when you imagine moving.</>

  const topoExplain: React.ReactNode =
    freqBand === 'mu'
      ? <><strong>Cool patches over C3/C4</strong> mean motor cortex went quiet — that spatial pattern is exactly what the classifier reads.</>
      : freqBand === 'beta'
      ? <><strong>Beta suppression</strong> is more focused than mu and rebounds sharply after imagery ends — a separate useful signature.</>
      : freqBand === 'alpha'
      ? <>The <strong>occipital hotspot</strong> (back of head) is visual cortex at rest — unrelated to movement, shown as a sanity check.</>
      : <><strong>All frequencies blended</strong> — switch to mu or beta to see the motor-specific patterns the classifier actually uses.</>

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
          explainContent={tsExplain}
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
          explainContent={psdExplain}
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
          explainContent={topoExplain}
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
        <span style={{ marginLeft: 'auto' }}>CNEW Munich · Jun 17 2026</span>
      </footer>
    </>
  )
}

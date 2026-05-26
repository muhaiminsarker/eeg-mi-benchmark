// Mock data generators for EEG MI benchmark.
// Matches the single dataset the backend currently serves: BNCI2014001.
// Epoch counts and time window mirror what MOABB returns for that dataset.

export interface DatasetInfo {
  id: string
  label: string
  subjects: number
}

export interface MockOptions {
  datasets: string[]
  subjects: Record<string, number[]>
  runs: Record<string, string[]>
}

export interface LoadedMeta {
  n_epochs: number
  sfreq: number
  tmin: number
  tmax: number
  channels: string[]
  classes: string[]
}

export interface TimeseriesData {
  times: number[]
  channels: { C3: number[]; C4: number[]; Cz: number[] }
  class_label?: string
}

export interface PSDData {
  freqs: number[]
  power: number[]
  channel: string
  allChannels?: { C3: number[]; C4: number[]; Cz: number[] }
}

export interface TopoplotData {
  svg: string
  band: string
  vmin: number
  vmax: number
}

// Only the dataset the backend actually serves.
const DATASETS: DatasetInfo[] = [
  { id: 'BNCI2014001', label: 'BCI Competition IV 2a (22 channels, 9 subjects)', subjects: 9 },
]

// BNCI2014001: 3 run types matching loader._RUN_OPTIONS.
const BNCI2014001_RUNS = ['imagined_hand', 'imagined_feet', 'imagined_tongue']

// Classes available per run, matching loader._RUN_EVENTS.
const RUN_CLASSES: Record<string, string[]> = {
  imagined_hand:   ['left_hand', 'right_hand'],
  imagined_feet:   ['feet'],
  imagined_tongue: ['tongue'],
}

// Epoch counts per run for BNCI2014001:
// 2 sessions × 6 runs × 12 trials per class per run.
// imagined_hand has 2 classes → 2 × 6 × 12 × 2 = 288
// imagined_feet / imagined_tongue have 1 class → 2 × 6 × 12 = 144
const RUN_N_EPOCHS: Record<string, number> = {
  imagined_hand:   288,
  imagined_feet:   144,
  imagined_tongue: 144,
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerpColor(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

export function options(): MockOptions {
  return {
    datasets: DATASETS.map((d) => d.id),
    subjects: Object.fromEntries(
      DATASETS.map((d) => [d.id, Array.from({ length: d.subjects }, (_, i) => i + 1)])
    ),
    runs: { BNCI2014001: BNCI2014001_RUNS },
  }
}

export function load(dataset: string, subject: number, run: string): LoadedMeta {
  const classes = RUN_CLASSES[run] ?? ['left_hand', 'right_hand']
  const n_epochs = RUN_N_EPOCHS[run] ?? 144
  return {
    n_epochs,
    sfreq: 250,
    tmin: -0.5,
    tmax: 4.0,
    channels: [
      'Fz', 'FC3', 'FC1', 'FCz', 'FC2', 'FC4',
      'C5', 'C3', 'C1', 'Cz', 'C2', 'C4', 'C6',
      'CP3', 'CP1', 'CPz', 'CP2', 'CP4',
      'P1', 'Pz', 'P2', 'POz',
    ],
    classes,
  }
}

export function timeseries(
  dataset: string,
  subject: number,
  run: string,
  epoch_idx: number,
  klass?: number
): TimeseriesData {
  const sfreq = 250
  const tmin = -0.5
  const tmax = 4.0
  const N = Math.round((tmax - tmin) * sfreq) + 1
  const times = Array.from({ length: N }, (_, i) => tmin + i / sfreq)
  const rng = mulberry32(hash(`${dataset}|${subject}|${run}|${epoch_idx}`))

  // Determine class label from run type, cycling only within that run's classes.
  const classes = RUN_CLASSES[run] ?? ['left_hand', 'right_hand']
  const clsName = klass != null
    ? (['left_hand', 'right_hand', 'feet', 'tongue'][klass] ?? classes[0])
    : classes[epoch_idx % classes.length]

  // Numeric class index used to select ERD target channel.
  const CLS_IDX: Record<string, number> = { left_hand: 0, right_hand: 1, feet: 2, tongue: 3 }
  const cls = CLS_IDX[clsName] ?? 0

  // ERD envelope: Gaussian dip centred at 1.25 s, recovering by ~3 s.
  const erdOn = (t: number, target: boolean): number => {
    if (t < 0) return 1
    const center = 1.25
    const width = 0.8
    const depth = target ? 0.62 : 0.05
    return 1 - depth * Math.exp(-((t - center) ** 2) / (2 * width * width))
  }

  function chan(targetMap: Record<number, boolean>): number[] {
    const target = targetMap[cls] || false
    const muFreq = 10 + (rng() - 0.5) * 1.5
    const betaFreq = 20 + (rng() - 0.5) * 3
    const muPhase = rng() * Math.PI * 2
    const betaPhase = rng() * Math.PI * 2
    const driftPhase = rng() * Math.PI * 2
    return times.map((t) => {
      const env = erdOn(t, target)
      const mu = 7 * env * Math.sin(2 * Math.PI * muFreq * t + muPhase)
      const beta = 2.5 * env * Math.sin(2 * Math.PI * betaFreq * t + betaPhase)
      const drift = 1.2 * Math.sin(2 * Math.PI * 1.3 * t + driftPhase)
      const noise = (rng() - 0.5) * 3.2
      return +(mu + beta + drift + noise).toFixed(3)
    })
  }

  return {
    times: times.map((t) => +t.toFixed(4)),
    channels: {
      // C3 is contralateral for right_hand (cls=1), C4 for left_hand (cls=0), Cz for feet (cls=2).
      C3: chan({ 1: true }),
      C4: chan({ 0: true }),
      Cz: chan({ 2: true }),
    },
    class_label: clsName,
  }
}

export function psd(
  dataset: string,
  subject: number,
  run: string,
  channel: string
): PSDData {
  const freqs: number[] = []
  for (let f = 1; f <= 40; f += 0.5) freqs.push(+f.toFixed(1))
  const rng = mulberry32(hash(`${dataset}|${subject}|${run}|${channel}|psd`))

  // Mu suppression is run- and channel-specific.
  // imagined_hand: bilateral motor cortex (C3, C4) suppressed.
  // imagined_feet: midline (Cz) suppressed.
  // imagined_tongue: weak diffuse suppression across all channels.
  const muSuppression =
    run === 'imagined_hand'   ? (channel === 'C3' || channel === 'C4' ? 0.50 : 0.90) :
    run === 'imagined_feet'   ? (channel === 'Cz' ? 0.50 : 0.85) :
    run === 'imagined_tongue' ? 0.80 :
    0.70

  const power = freqs.map((f) => {
    const oneOverF = 22 - 10 * Math.log10(f)
    const alpha = muSuppression * 9 * Math.exp(-((f - 10.2) ** 2) / (2 * 1.4 ** 2))
    const beta = 4 * Math.exp(-((f - 22) ** 2) / (2 * 3.0 ** 2))
    const noise = (rng() - 0.5) * 1.4
    return +(oneOverF + alpha + beta + noise).toFixed(3)
  })

  return { freqs, power, channel }
}

export function topoplot(
  dataset: string,
  subject: number,
  run: string,
  freq_band: string
): TopoplotData {
  const W = 360, H = 360
  const cx = W / 2, cy = H / 2
  const R = 140

  const electrodes: { name: string; x: number; y: number }[] = [
    ['Fz', 0.0, 0.55],
    ['FC3', -0.4, 0.35], ['FC1', -0.18, 0.38], ['FCz', 0.0, 0.4], ['FC2', 0.18, 0.38], ['FC4', 0.4, 0.35],
    ['C5', -0.7, 0.0], ['C3', -0.45, 0.0], ['C1', -0.2, 0.0], ['Cz', 0.0, 0.0], ['C2', 0.2, 0.0], ['C4', 0.45, 0.0], ['C6', 0.7, 0.0],
    ['CP3', -0.42, -0.35], ['CP1', -0.2, -0.36], ['CPz', 0.0, -0.38], ['CP2', 0.2, -0.36], ['CP4', 0.42, -0.35],
    ['P1', -0.18, -0.58], ['Pz', 0.0, -0.6], ['P2', 0.18, -0.58],
    ['POz', 0.0, -0.78],
  ].map(([n, x, y]) => ({ name: n as string, x: cx + (x as number) * R, y: cy - (y as number) * R }))

  // Source maps reflect run-specific spatial patterns.
  // imagined_hand: bilateral C3/C4 suppression.
  // imagined_feet: midline Cz suppression.
  // imagined_tongue: weak midline, more frontal spread.
  const sourcesMap: Record<string, Record<string, { name: string; v: number }[]>> = {
    mu: {
      imagined_hand:   [{ name: 'C3', v: -1.0 }, { name: 'C4', v: -0.9 }, { name: 'Cz', v: -0.1 }, { name: 'Pz', v: 0.2 }, { name: 'Fz', v: 0.3 }],
      imagined_feet:   [{ name: 'Cz', v: -1.0 }, { name: 'C1', v: -0.7 }, { name: 'C2', v: -0.7 }, { name: 'CPz', v: -0.5 }, { name: 'Fz', v: 0.2 }],
      imagined_tongue: [{ name: 'Cz', v: -0.5 }, { name: 'FCz', v: -0.4 }, { name: 'C3', v: -0.3 }, { name: 'C4', v: -0.3 }],
    },
    beta: {
      imagined_hand:   [{ name: 'C3', v: -0.6 }, { name: 'C4', v: -0.55 }, { name: 'FCz', v: -0.2 }, { name: 'CPz', v: 0.0 }],
      imagined_feet:   [{ name: 'Cz', v: -0.6 }, { name: 'CPz', v: -0.4 }, { name: 'C1', v: -0.3 }, { name: 'C2', v: -0.3 }],
      imagined_tongue: [{ name: 'FCz', v: -0.4 }, { name: 'Cz', v: -0.3 }, { name: 'Fz', v: -0.2 }],
    },
    alpha: {
      imagined_hand:   [{ name: 'POz', v: 1.0 }, { name: 'Pz', v: 0.85 }, { name: 'P1', v: 0.7 }, { name: 'P2', v: 0.7 }, { name: 'Cz', v: 0.2 }],
      imagined_feet:   [{ name: 'POz', v: 1.0 }, { name: 'Pz', v: 0.85 }, { name: 'P1', v: 0.7 }, { name: 'P2', v: 0.7 }, { name: 'Cz', v: 0.2 }],
      imagined_tongue: [{ name: 'POz', v: 1.0 }, { name: 'Pz', v: 0.85 }, { name: 'P1', v: 0.7 }, { name: 'P2', v: 0.7 }, { name: 'Cz', v: 0.2 }],
    },
    broadband: {
      imagined_hand:   [{ name: 'Cz', v: 0.4 }, { name: 'FCz', v: 0.3 }, { name: 'CPz', v: 0.3 }, { name: 'Fz', v: 0.2 }],
      imagined_feet:   [{ name: 'Cz', v: 0.4 }, { name: 'FCz', v: 0.3 }, { name: 'CPz', v: 0.3 }, { name: 'Fz', v: 0.2 }],
      imagined_tongue: [{ name: 'Cz', v: 0.4 }, { name: 'FCz', v: 0.3 }, { name: 'CPz', v: 0.3 }, { name: 'Fz', v: 0.2 }],
    },
  }

  const sources =
    sourcesMap[freq_band]?.[run] ??
    sourcesMap[freq_band]?.['imagined_hand'] ??
    [{ name: 'Cz', v: 0.5 }]

  const evals = electrodes.map((e) => {
    let num = 0, den = 0
    for (const s of sources) {
      const t = electrodes.find((x) => x.name === s.name)
      if (!t) continue
      const d = Math.hypot(e.x - t.x, e.y - t.y) + 8
      const w = 1 / (d * d)
      num += w * s.v
      den += w
    }
    return { ...e, v: num / den }
  })

  const GRID = 28
  const cells: { x: number; y: number; v: number }[] = []
  let vMin = Infinity, vMax = -Infinity
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = cx - R + (2 * R * (i + 0.5)) / GRID
      const y = cy - R + (2 * R * (j + 0.5)) / GRID
      if (Math.hypot(x - cx, y - cy) > R - 2) continue
      let num = 0, den = 0
      for (const e of evals) {
        const d = Math.hypot(x - e.x, y - e.y) + 4
        const w = 1 / Math.pow(d, 3)
        num += w * e.v
        den += w
      }
      const v = num / den
      vMin = Math.min(vMin, v)
      vMax = Math.max(vMax, v)
      cells.push({ x, y, v })
    }
  }
  const cellSize = (2 * R) / GRID + 1.2

  const absMax = Math.max(Math.abs(vMin), Math.abs(vMax)) || 1
  function color(v: number): string {
    const t = Math.max(-1, Math.min(1, v / absMax))
    const stops =
      t < 0
        ? lerpColor([5, 48, 97], [247, 247, 247], 1 + t)
        : lerpColor([247, 247, 247], [103, 0, 31], t)
    return `rgb(${stops.join(',')})`
  }

  const cellSvg = cells
    .map(
      (c) =>
        `<rect x="${(c.x - cellSize / 2).toFixed(2)}" y="${(c.y - cellSize / 2).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color(c.v)}" />`
    )
    .join('')

  const electrodeSvg = electrodes
    .map(
      (e) =>
        `<circle cx="${e.x.toFixed(2)}" cy="${e.y.toFixed(2)}" r="2.4" fill="var(--topo-electrode-fill, #0b0b14)" stroke="var(--topo-electrode-stroke, #e2e8f0)" stroke-width="0.9"/>`
    )
    .join('')

  const labelSvg = electrodes
    .filter((e) => ['C3', 'C4', 'Cz', 'Fz', 'Pz', 'POz'].includes(e.name))
    .map(
      (e) =>
        `<text x="${(e.x + 6).toFixed(2)}" y="${(e.y - 6).toFixed(2)}" font-family="var(--sans)" font-size="9" fill="var(--topo-label, #cbd5e1)">${e.name}</text>`
    )
    .join('')

  const head = `
    <defs><clipPath id="headClip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
    <g clip-path="url(#headClip)">${cellSvg}</g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--topo-outline, #475569)" stroke-width="1.6"/>
    <path d="M ${cx - 10} ${cy - R + 4} L ${cx} ${cy - R - 16} L ${cx + 10} ${cy - R + 4} Z" fill="none" stroke="var(--topo-outline, #475569)" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M ${cx - R} ${cy - 18} Q ${cx - R - 12} ${cy} ${cx - R} ${cy + 18}" fill="none" stroke="var(--topo-outline, #475569)" stroke-width="1.6"/>
    <path d="M ${cx + R} ${cy - 18} Q ${cx + R + 12} ${cy} ${cx + R} ${cy + 18}" fill="none" stroke="var(--topo-outline, #475569)" stroke-width="1.6"/>
    ${electrodeSvg}
    ${labelSvg}
  `

  const cbX = W - 26, cbY = 40, cbW = 12, cbH = H - 80
  const stopStrs: string[] = []
  for (let i = 0; i <= 10; i++) {
    const t = -1 + (2 * i) / 10
    stopStrs.push(`<stop offset="${i * 10}%" stop-color="${color(t * absMax)}"/>`)
  }
  const cb = `
    <defs><linearGradient id="cbGrad" x1="0" y1="1" x2="0" y2="0">${stopStrs.join('')}</linearGradient></defs>
    <rect x="${cbX}" y="${cbY}" width="${cbW}" height="${cbH}" fill="url(#cbGrad)" stroke="var(--topo-cb-stroke, #334155)" stroke-width="0.6"/>
    <text x="${cbX + cbW + 4}" y="${cbY + 6}" font-family="var(--sans)" font-size="9" fill="var(--topo-cb-label, #94a3b8)">+${absMax.toFixed(2)}</text>
    <text x="${cbX + cbW + 4}" y="${cbY + cbH / 2 + 3}" font-family="var(--sans)" font-size="9" fill="var(--topo-cb-label, #94a3b8)">0</text>
    <text x="${cbX + cbW + 4}" y="${cbY + cbH + 2}" font-family="var(--sans)" font-size="9" fill="var(--topo-cb-label, #94a3b8)">-${absMax.toFixed(2)}</text>
  `

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <rect width="${W}" height="${H}" fill="var(--topo-bg, #100f1a)"/>
    ${head}
    ${cb}
  </svg>`

  return { svg, band: freq_band, vmin: -absMax, vmax: absMax }
}

export const MOCK = { options, load, timeseries, psd, topoplot, DATASETS }

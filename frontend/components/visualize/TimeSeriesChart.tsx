'use client'

import { useRef, useState, useEffect } from 'react'
import type { TimeseriesData } from '@/lib/mock-data'

const CC = (name: string, fallback?: string) =>
  `var(${name}${fallback ? `, ${fallback}` : ''})`

const C = {
  C3: CC('--chart-c3', '#e2d9ff'),
  C4: CC('--chart-c4', '#c4b5fd'),
  Cz: CC('--chart-cz', '#7c6fff'),
  axis: CC('--chart-axis', '#334155'),
  axisLabel: CC('--chart-axis-label', '#64748b'),
  gridLine: CC('--chart-grid', '#1e1a30'),
  erdBand: CC('--chart-mu-band', 'rgba(167, 139, 250, 0.09)'),
  baseline: 'rgba(255, 255, 255, 0.03)',
  cueLine: CC('--chart-cue', '#a78bfa'),
  zero: CC('--chart-zero', '#2a2640'),
  glow: CC('--chart-glow', 'none'),
}

function ticks(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => +(min + step * i).toFixed(2))
}

interface Props {
  data: TimeseriesData
  height?: number
}

interface HoverState {
  idx: number
  t: number
  C3: number
  C4: number
  Cz: number
}

export default function TimeSeriesChart({ data, height = 280 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { times, channels } = data
  const M = { top: 18, right: 20, bottom: 38, left: 56 }
  const W = Math.max(320, width)
  const H = height
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const xMin = times[0], xMax = times[times.length - 1]
  const visibleChannels = (['C3', 'C4', 'Cz'] as const).filter(ch => !hidden.has(ch))
  const all = visibleChannels.length > 0
    ? visibleChannels.flatMap(ch => channels[ch])
    : [...channels.C3, ...channels.C4, ...channels.Cz]
  const yMaxAbs = Math.max(...all.map(Math.abs)) * 1.1 || 10
  const yMin = -yMaxAbs, yMax = yMaxAbs

  const xScale = (t: number) => M.left + ((t - xMin) / (xMax - xMin)) * innerW
  const yScale = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * innerH

  function pathFor(values: number[]): string {
    let d = ''
    for (let i = 0; i < values.length; i++) {
      const x = xScale(times[i]).toFixed(2)
      const y = yScale(values[i]).toFixed(2)
      d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' '
    }
    return d
  }

  // Dynamic X tick count based on epoch duration
  const duration = xMax - xMin
  const xTickCount = duration > 3 ? 9 : 6
  const xTicks = ticks(xMin, xMax, xTickCount)
  const yTicks = ticks(yMin, yMax, 5)

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    if (px < M.left || px > M.left + innerW) { setHover(null); return }
    const t = xMin + ((px - M.left) / innerW) * (xMax - xMin)
    let lo = 0, hi = times.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (times[mid] < t) lo = mid; else hi = mid
    }
    const idx = Math.abs(times[lo] - t) < Math.abs(times[hi] - t) ? lo : hi
    setHover({ idx, t: times[idx], C3: channels.C3[idx], C4: channels.C4[idx], Cz: channels.Cz[idx] })
  }

  function toggleChannel(ch: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(ch)) next.delete(ch)
      else next.add(ch)
      return next
    })
  }

  // ERD window: ~0.5 to 2.5s (motor cortex desynchronization peak)
  const erdStart = 0.5, erdEnd = Math.min(2.5, xMax - 0.1)
  // Baseline: xMin to 0
  const baselineStart = xMin, baselineEnd = 0

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg
        width={W}
        height={H}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block' }}
      >
        {/* Baseline region */}
        <rect x={xScale(baselineStart)} y={M.top} width={xScale(baselineEnd) - xScale(baselineStart)} height={innerH}
          fill={C.baseline} />

        {/* ERD window */}
        {erdEnd > erdStart && (
          <rect x={xScale(erdStart)} y={M.top} width={xScale(erdEnd) - xScale(erdStart)} height={innerH}
            fill={C.erdBand} />
        )}

        {/* Grid */}
        {yTicks.map((v, i) => (
          <line key={'yg' + i} x1={M.left} x2={M.left + innerW} y1={yScale(v)} y2={yScale(v)} stroke={C.gridLine} strokeWidth="1" />
        ))}
        {xTicks.map((t, i) => (
          <line key={'xg' + i} x1={xScale(t)} x2={xScale(t)} y1={M.top} y2={M.top + innerH} stroke={C.gridLine} strokeWidth="1" />
        ))}

        {/* Zero line */}
        <line x1={M.left} x2={M.left + innerW} y1={yScale(0)} y2={yScale(0)} stroke={C.zero} strokeWidth="1" strokeDasharray="3 3" />

        {/* Baseline label */}
        {baselineEnd > baselineStart + 0.1 && (
          <text x={(xScale(baselineStart) + xScale(baselineEnd)) / 2} y={M.top + 12}
            textAnchor="middle" fontSize="9" fontFamily="var(--mono)" fill={C.axisLabel} opacity="0.7">
            baseline
          </text>
        )}

        {/* imagery window label */}
        {erdEnd > erdStart && (
          <text x={(xScale(erdStart) + xScale(erdEnd)) / 2} y={M.top + 12}
            textAnchor="middle" fontSize="9" fontFamily="var(--mono)" fill={C.cueLine} opacity="0.8">
            imagery
          </text>
        )}

        {/* Cue line at t=0 */}
        <line x1={xScale(0)} x2={xScale(0)} y1={M.top} y2={M.top + innerH} stroke={C.cueLine} strokeWidth="1.4" strokeDasharray="4 3" opacity="0.8" />
        <text x={xScale(0) + 5} y={M.top + 24} fontSize="10" fontFamily="var(--mono)" fill={C.cueLine} opacity="0.9">cue</text>

        {/* Axes */}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={C.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={C.axis} />

        {/* Y axis ticks */}
        {yTicks.map((v, i) => (
          <g key={'yt' + i}>
            <line x1={M.left - 4} x2={M.left} y1={yScale(v)} y2={yScale(v)} stroke={C.axis} />
            <text x={M.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill={C.axisLabel}>
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <text x={14} y={M.top + innerH / 2} fontSize="10" fontFamily="var(--mono)" fill={C.axisLabel}
          transform={`rotate(-90, 14, ${M.top + innerH / 2})`} textAnchor="middle">μV</text>

        {/* X axis ticks */}
        {xTicks.map((t, i) => (
          <g key={'xt' + i}>
            <line x1={xScale(t)} x2={xScale(t)} y1={M.top + innerH} y2={M.top + innerH + 4} stroke={C.axis} />
            <text x={xScale(t)} y={M.top + innerH + 16} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={C.axisLabel}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={M.top + innerH + 30} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={C.axisLabel}>
          time (s)
        </text>

        {/* Signal traces */}
        {!hidden.has('C3') && <path d={pathFor(channels.C3)} fill="none" stroke={C.C3} strokeWidth="1.4" opacity="0.9" style={{ filter: C.glow }} />}
        {!hidden.has('C4') && <path d={pathFor(channels.C4)} fill="none" stroke={C.C4} strokeWidth="1.4" opacity="0.95" style={{ filter: C.glow }} />}
        {!hidden.has('Cz') && <path d={pathFor(channels.Cz)} fill="none" stroke={C.Cz} strokeWidth="1.6" style={{ filter: C.glow }} />}

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line x1={xScale(hover.t)} x2={xScale(hover.t)} y1={M.top} y2={M.top + innerH} stroke={C.cueLine} strokeWidth="1" opacity="0.5" />
            {!hidden.has('C3') && <circle cx={xScale(hover.t)} cy={yScale(hover.C3)} r="3" fill={C.C3} />}
            {!hidden.has('C4') && <circle cx={xScale(hover.t)} cy={yScale(hover.C4)} r="3" fill={C.C4} />}
            {!hidden.has('Cz') && <circle cx={xScale(hover.t)} cy={yScale(hover.Cz)} r="3" fill={C.Cz} />}
          </g>
        )}
      </svg>

      {/* Legend — clickable to toggle channels */}
      <div style={{ display: 'flex', gap: 16, padding: '10px 0 0 56px', fontFamily: 'var(--mono)', fontSize: 11, flexWrap: 'wrap' }}>
        {(['C3', 'C4', 'Cz'] as const).map((ch) => {
          const isHidden = hidden.has(ch)
          return (
            <button
              key={ch}
              onClick={() => toggleChannel(ch)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: isHidden ? 'var(--text-muted)' : 'var(--text-dim)',
                opacity: isHidden ? 0.4 : 1,
              }}
            >
              <span style={{ width: 14, height: 2.5, background: C[ch], display: 'inline-block' }} />
              <span>{ch}</span>
              {hover && !isHidden && (
                <span style={{ color: 'var(--text)' }}>
                  {hover[ch] >= 0 ? '+' : ''}{hover[ch].toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, color: 'var(--text-dim)', fontSize: 10 }}>
          <span>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: C.erdBand, border: '1px solid rgba(167,139,250,0.3)', marginRight: 4, verticalAlign: 'middle' }} />
            imagery window
          </span>
          {hover && <span style={{ color: 'var(--text)' }}>t = {hover.t.toFixed(3)} s</span>}
        </div>
      </div>
    </div>
  )
}

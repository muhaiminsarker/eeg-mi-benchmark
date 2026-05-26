'use client'

import { useRef, useState, useEffect } from 'react'
import type { PSDData } from '@/lib/mock-data'

const CC = (name: string, fallback?: string) =>
  `var(${name}${fallback ? `, ${fallback}` : ''})`

const C = {
  axis: CC('--chart-axis', '#334155'),
  axisLabel: CC('--chart-axis-label', '#64748b'),
  gridLine: CC('--chart-grid', '#1e1a30'),
  muBand: CC('--chart-mu-band', 'rgba(167, 139, 250, 0.10)'),
  betaBand: CC('--chart-beta-band', 'rgba(124, 111, 255, 0.10)'),
  cueLine: CC('--chart-cue', '#a78bfa'),
  C3: CC('--chart-c3', '#e2d9ff'),
  C4: CC('--chart-c4', '#c4b5fd'),
  Cz: CC('--chart-cz', '#7c6fff'),
  glow: CC('--chart-glow', 'none'),
}

function ticks(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => +(min + step * i).toFixed(2))
}

interface Props {
  data: PSDData
  height?: number
  explain?: boolean
}

export default function PSDChart({ data, height = 240, explain }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [hoverFreq, setHoverFreq] = useState<number | null>(null)

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { freqs, channel, allChannels } = data
  const M = { top: 16, right: 16, bottom: 36, left: 52 }
  const W = Math.max(280, width)
  const H = height
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const xMin = freqs[0], xMax = freqs[freqs.length - 1]

  // Compute Y range across all channels
  const allPower = allChannels
    ? [...allChannels.C3, ...allChannels.C4, ...allChannels.Cz]
    : data.power
  const yMin = Math.min(...allPower) - 1
  const yMax = Math.max(...allPower) + 1

  const xScale = (f: number) => M.left + ((f - xMin) / (xMax - xMin)) * innerW
  const yScale = (p: number) => M.top + (1 - (p - yMin) / (yMax - yMin)) * innerH

  function makePath(power: number[]): string {
    let d = ''
    for (let i = 0; i < freqs.length; i++) {
      d += (i === 0 ? 'M' : 'L') + xScale(freqs[i]).toFixed(2) + ' ' + yScale(power[i]).toFixed(2) + ' '
    }
    return d
  }

  function makeFill(power: number[]): string {
    const d = makePath(power)
    return d + `L ${xScale(xMax)} ${yScale(yMin)} L ${xScale(xMin)} ${yScale(yMin)} Z`
  }

  const xTickVals = [1, 5, 10, 15, 20, 25, 30, 35, 40]
  const yTicks = ticks(yMin, yMax, 5)

  // Active channel series
  const channels = allChannels
    ? ([['C3', allChannels.C3], ['C4', allChannels.C4], ['Cz', allChannels.Cz]] as const)
    : ([[channel as 'C3' | 'C4' | 'Cz', data.power]] as const)

  // Hover handler
  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    if (px < M.left || px > M.left + innerW) { setHoverFreq(null); return }
    const f = xMin + ((px - M.left) / innerW) * (xMax - xMin)
    let lo = 0, hi = freqs.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (freqs[mid] < f) lo = mid; else hi = mid
    }
    const idx = Math.abs(freqs[lo] - f) < Math.abs(freqs[hi] - f) ? lo : hi
    setHoverFreq(freqs[idx])
  }

  const hoverIdx = hoverFreq != null ? freqs.indexOf(hoverFreq) : -1

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }}
        onMouseMove={onMove} onMouseLeave={() => setHoverFreq(null)}>
        {/* Band shading: mu 8-13, beta 13-30 */}
        <rect x={xScale(8)} y={M.top} width={xScale(13) - xScale(8)} height={innerH} fill={C.muBand} />
        <rect x={xScale(13)} y={M.top} width={xScale(30) - xScale(13)} height={innerH} fill={C.betaBand} />

        {/* Band boundary lines */}
        <line x1={xScale(8)} x2={xScale(8)} y1={M.top} y2={M.top + innerH} stroke={C.cueLine} strokeWidth="0.6" strokeDasharray="3 3" opacity="0.4" />
        <line x1={xScale(13)} x2={xScale(13)} y1={M.top} y2={M.top + innerH} stroke={C.cueLine} strokeWidth="0.6" strokeDasharray="3 3" opacity="0.4" />
        <line x1={xScale(30)} x2={xScale(30)} y1={M.top} y2={M.top + innerH} stroke={C.Cz} strokeWidth="0.6" strokeDasharray="3 3" opacity="0.4" />

        {/* Grid */}
        {yTicks.map((v, i) => (
          <line key={i} x1={M.left} x2={M.left + innerW} y1={yScale(v)} y2={yScale(v)} stroke={C.gridLine} />
        ))}

        {/* Axes */}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={C.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={C.axis} />

        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={M.left - 4} x2={M.left} y1={yScale(v)} y2={yScale(v)} stroke={C.axis} />
            <text x={M.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--sans)" fill={C.axisLabel}>
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <text x={14} y={M.top + innerH / 2} fontSize="10" fontFamily="var(--sans)" fill={C.axisLabel}
          transform={`rotate(-90, 14, ${M.top + innerH / 2})`} textAnchor="middle">dB</text>

        {xTickVals.map((t, i) => (
          <g key={i}>
            <line x1={xScale(t)} x2={xScale(t)} y1={M.top + innerH} y2={M.top + innerH + 4} stroke={C.axis} />
            <text x={xScale(t)} y={M.top + innerH + 16} textAnchor="middle" fontSize="10" fontFamily="var(--sans)" fill={C.axisLabel}>
              {t}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={M.top + innerH + 30} textAnchor="middle" fontSize="10" fontFamily="var(--sans)" fill={C.axisLabel}>
          frequency (Hz)
        </text>

        {/* Band labels */}
        <text x={(xScale(8) + xScale(13)) / 2} y={M.top + 12} textAnchor="middle" fontSize="10" fontFamily="var(--sans)" fill={C.cueLine} opacity="0.8">μ</text>
        {explain && (
          <text x={(xScale(8) + xScale(13)) / 2} y={M.top + 23} textAnchor="middle" fontSize="8" fontFamily="var(--sans)" fill={C.cueLine} opacity="0.6">dips</text>
        )}
        <text x={(xScale(13) + xScale(30)) / 2} y={M.top + 12} textAnchor="middle" fontSize="10" fontFamily="var(--sans)" fill={C.Cz} opacity="0.8">β</text>
        {explain && (
          <text x={(xScale(13) + xScale(30)) / 2} y={M.top + 23} textAnchor="middle" fontSize="8" fontFamily="var(--sans)" fill={C.Cz} opacity="0.6">rebounds</text>
        )}

        {/* Dim channels first */}
        {allChannels && channels.map(([ch, power]) => {
          if (ch === channel) return null
          const color = C[ch as 'C3' | 'C4' | 'Cz']
          const d = makePath(power)
          return (
            <path key={ch} d={d} fill="none" stroke={color} strokeWidth="1.2" opacity="0.25" />
          )
        })}

        {/* Active channel: fill + highlighted line */}
        {channels.map(([ch, power]) => {
          if (ch !== channel) return null
          const color = C[ch as 'C3' | 'C4' | 'Cz']
          const fillD = makeFill(power)
          const lineD = makePath(power)
          return (
            <g key={ch}>
              <path d={fillD} fill={color} opacity="0.08" />
              <path d={lineD} fill="none" stroke={color} strokeWidth="1.8" style={{ filter: C.glow }} />
            </g>
          )
        })}

        {/* Hover line + dots */}
        {hoverIdx >= 0 && (
          <g>
            <line x1={xScale(freqs[hoverIdx])} x2={xScale(freqs[hoverIdx])} y1={M.top} y2={M.top + innerH}
              stroke={C.cueLine} strokeWidth="1" opacity="0.4" />
            {allChannels && channels.map(([ch, power]) => {
              const color = C[ch as 'C3' | 'C4' | 'Cz']
              const isActive = ch === channel
              return (
                <circle key={ch} cx={xScale(freqs[hoverIdx])} cy={yScale(power[hoverIdx])} r={isActive ? 3.5 : 2.5}
                  fill={color} opacity={isActive ? 1 : 0.45} />
              )
            })}
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', gap: 16, padding: '8px 0 0 52px', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
        {allChannels && (['C3', 'C4', 'Cz'] as const).map((ch) => {
          const color = C[ch]
          const isActive = ch === channel
          const power = allChannels[ch]
          const muStart = freqs.findIndex(f => f >= 8)
          const muEnd = freqs.findIndex(f => f >= 13)
          const muMean = power.slice(muStart, muEnd).reduce((a, b) => a + b, 0) / (muEnd - muStart)
          return (
            <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: isActive ? 1 : 0.45 }}>
              <span style={{ width: 14, height: isActive ? 2.5 : 1.5, background: color, display: 'inline-block' }} />
              <span style={{ color: isActive ? 'var(--text)' : undefined }}>{ch}</span>
              {hoverIdx >= 0
                ? <span style={{ color: isActive ? 'var(--text)' : undefined }}>{allChannels[ch][hoverIdx].toFixed(1)} dB</span>
                : <span>{muMean.toFixed(1)} dB<span style={{ opacity: 0.5, marginLeft: 3 }}>(μ-band)</span></span>
              }
            </div>
          )
        })}
        <span style={{ marginLeft: 'auto' }}>
          {hoverFreq != null ? <>{hoverFreq.toFixed(1)} Hz</> : <>welch · hann · 1 s window</>}
        </span>
      </div>
    </div>
  )
}

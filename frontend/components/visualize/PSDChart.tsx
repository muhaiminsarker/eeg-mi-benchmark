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

      {/* Band legend rendered as plain HTML so tests can find the labels */}
      <div className="flex gap-4 mb-2 text-xs font-mono" aria-label="frequency band legend">
        <span style={{ color: '#a78bfa' }}>μ <span className="text-text-muted font-sans">8-12 Hz</span></span>
        <span style={{ color: '#7c6fff' }}>β <span className="text-text-muted font-sans">13-30 Hz</span></span>
      </div>

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
          The Mu rhythm (8-12 Hz) suppresses during motor imagery -- that is event-related
          desynchronization (ERD). Beta (13-30 Hz) follows the same pattern and rebounds
          after movement ends (event-related synchronization, ERS).
        </div>
      )}
    </div>
  )
}

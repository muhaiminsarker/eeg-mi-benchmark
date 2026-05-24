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

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import ContextBar from '@/components/layout/ContextBar'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import PSDChart from '@/components/visualize/PSDChart'
import TopoplotImage from '@/components/visualize/TopoplotImage'
import type { DataOptions, TimeseriesData, PSDData, FreqBand } from '@/lib/types'

export default function VisualizePage() {
  const [options, setOptions] = useState<DataOptions | null>(null)
  const [explain, setExplain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null)
  const [psd, setPsd] = useState<PSDData | null>(null)
  const [topoSvg, setTopoSvg] = useState<string | null>(null)
  const [freqBand, setFreqBand] = useState<FreqBand>('mu')

  useEffect(() => {
    api.getOptions().then(setOptions).catch((e) => setError(e.message))
  }, [])

  const handleLoad = async (dataset: string, subject: number, run: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.loadData(dataset, subject, run)
      const [ts, psdData, topo] = await Promise.all([
        api.getTimeseries(dataset, subject, run),
        api.getPSD(dataset, subject, run, 'C3'),
        api.getTopoplot(dataset, subject, run, freqBand),
      ])
      setTimeseries(ts)
      setPsd(psdData)
      setTopoSvg(topo.svg)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBandChange = (band: FreqBand) => {
    setFreqBand(band)
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-text-dim text-sm">
          {error ? `Error: ${error}` : 'Connecting to backend...'}
        </span>
      </div>
    )
  }

  return (
    <main>
      <ContextBar
        options={options}
        explain={explain}
        onExplainChange={setExplain}
        onLoad={handleLoad}
      />

      <div className="px-6 py-5 flex flex-col gap-4">
        {loading && (
          <div className="font-mono text-text-dim text-xs text-center py-8">
            Loading EEG data...
          </div>
        )}

        {error && (
          <div className="font-mono text-red-400 text-xs border border-red-900 rounded px-4 py-2 bg-red-950/20">
            {error}
          </div>
        )}

        {timeseries && (
          <TimeSeriesChart data={timeseries} explain={explain} />
        )}

        {(psd || topoSvg) && (
          <div className="grid grid-cols-2 gap-4">
            {psd && <PSDChart data={psd} explain={explain} />}
            {topoSvg && (
              <TopoplotImage
                svg={topoSvg}
                explain={explain}
                freqBand={freqBand}
                onBandChange={handleBandChange}
              />
            )}
          </div>
        )}

        {!timeseries && !loading && !error && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <p className="font-mono text-text-dim text-sm">Select a dataset, subject, and run -- then click Load.</p>
            <p className="font-mono text-text-dim text-xs">BNCI2014001 downloads ~500MB on first load. Subsequent loads are instant.</p>
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import type { FreqBand } from '@/lib/types'

interface Props {
  svg: string
  explain: boolean
  freqBand: FreqBand
  onBandChange: (band: FreqBand) => void
}

export default function TopoplotImage({ svg, explain, freqBand, onBandChange }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-accent text-xs tracking-widest">TOPOPLOT</span>
        <div className="flex gap-2 ml-2">
          {(['mu', 'beta'] as FreqBand[]).map((band) => (
            <button
              key={band}
              onClick={() => onBandChange(band)}
              className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                freqBand === band
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-dim'
              }`}
            >
              {band === 'mu' ? 'μ (8-12 Hz)' : 'β (13-30 Hz)'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {explain && (
        <div className="mt-3 pl-3 border-l border-accent/20 text-text-muted text-xs font-sans leading-relaxed">
          Spatial distribution of EEG power across the scalp at the selected frequency band.
          Brighter regions indicate more power. During right-hand motor imagery, you should see
          a dark patch over C3 (left motor cortex) -- that is the ERD.
        </div>
      )}
    </div>
  )
}

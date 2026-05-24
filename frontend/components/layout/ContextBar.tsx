'use client'

import { useState } from 'react'
import type { DataOptions } from '@/lib/types'

interface Props {
  options: DataOptions
  explain: boolean
  onExplainChange: (v: boolean) => void
  onLoad: (dataset: string, subject: number, run: string) => void
}

export default function ContextBar({ options, explain, onExplainChange, onLoad }: Props) {
  const [dataset, setDataset] = useState(options.datasets[0]?.value ?? '')
  const [subject, setSubject] = useState(options.subjects[0] ?? 1)
  const [run, setRun] = useState(options.runs[0]?.value ?? '')

  return (
    <div className="bg-raised border-b border-border px-6 py-2 flex items-center gap-4 text-sm">
      <span className="text-text-dim font-mono text-xs">Dataset</span>
      <select
        value={dataset}
        onChange={(e) => setDataset(e.target.value)}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.datasets.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      <span className="text-text-dim font-mono text-xs">Subject</span>
      <select
        value={subject}
        onChange={(e) => setSubject(Number(e.target.value))}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.subjects.map((s) => (
          <option key={s} value={s}>0{s}</option>
        ))}
      </select>

      <span className="text-text-dim font-mono text-xs">Run</span>
      <select
        value={run}
        onChange={(e) => setRun(e.target.value)}
        className="bg-surface border border-border rounded px-2 py-1 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
      >
        {options.runs.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-text-dim font-mono text-xs">Explain</span>
          <button
            role="switch"
            aria-label="explain"
            aria-checked={explain}
            onClick={() => onExplainChange(!explain)}
            className={`relative w-8 h-4 rounded-full transition-colors ${
              explain ? 'bg-accent' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                explain ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <button
          onClick={() => onLoad(dataset, subject, run)}
          className="bg-accent text-base font-mono text-xs font-bold px-4 py-1 rounded hover:bg-accent-muted transition-colors"
        >
          Load
        </button>
      </div>
    </div>
  )
}

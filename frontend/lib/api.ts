import type { DataOptions, EpochMetadata, TimeseriesData, PSDData, TopoplotData } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail ?? res.statusText)
  }
  return res.json()
}

export const api = {
  getOptions: () => get<DataOptions>('/data/options'),

  loadData: (dataset: string, subject: number, run: string) =>
    get<EpochMetadata>('/data/load', { dataset, subject, run }),

  getTimeseries: (dataset: string, subject: number, run: string, epochIdx = 0) =>
    get<TimeseriesData>('/visualize/timeseries', { dataset, subject, run, epoch_idx: epochIdx }),

  getPSD: (dataset: string, subject: number, run: string, channel = 'C3') =>
    get<PSDData>('/visualize/psd', { dataset, subject, run, channel }),

  getTopoplot: (dataset: string, subject: number, run: string, freqBand: 'mu' | 'beta' = 'mu') =>
    get<TopoplotData>('/visualize/topoplot', { dataset, subject, run, freq_band: freqBand }),

  getPSDMulti: (dataset: string, subject: number, run: string, channels = 'C3,C4,Cz') =>
    get<{ freqs: number[]; channels: Record<string, number[]> }>('/visualize/psd_multi', { dataset, subject, run, channels }),

  getLabels: (dataset: string, subject: number, run: string) =>
    get<{ labels: string[] }>('/data/labels', { dataset, subject, run }),
}

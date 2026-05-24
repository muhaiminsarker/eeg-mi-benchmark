export interface DataOptions {
  datasets: { value: string; label: string }[]
  subjects: number[]
  runs: { value: string; label: string }[]
}

export interface EpochMetadata {
  n_epochs: number
  sfreq: number
  tmin: number
  tmax: number
  channels: string[]
}

export interface TimeseriesData {
  times: number[]
  channels: {
    C3: number[]
    C4: number[]
    Cz: number[]
  }
}

export interface PSDData {
  freqs: number[]
  power: number[]
}

export interface TopoplotData {
  svg: string
}

export type FreqBand = 'mu' | 'beta'
export type ChannelName = 'C3' | 'C4' | 'Cz'

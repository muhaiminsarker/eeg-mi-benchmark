import { render, screen } from '@testing-library/react'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import type { TimeseriesData } from '@/lib/mock-data'

const mockData: TimeseriesData = {
  times: [-0.5, -0.25, 0, 0.25, 0.5],
  channels: {
    C3: [1.0, 1.2, 0.8, 1.1, 0.9],
    C4: [0.9, 1.0, 1.1, 0.8, 1.2],
    Cz: [0.5, 0.6, 0.7, 0.5, 0.6],
  },
}

it('renders channel toggle buttons', () => {
  render(<TimeSeriesChart data={mockData} />)
  expect(screen.getByText('C3')).toBeInTheDocument()
  expect(screen.getByText('C4')).toBeInTheDocument()
  expect(screen.getByText('Cz')).toBeInTheDocument()
})

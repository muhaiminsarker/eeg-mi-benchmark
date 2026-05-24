import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeSeriesChart from '@/components/visualize/TimeSeriesChart'
import type { TimeseriesData } from '@/lib/types'

const mockData: TimeseriesData = {
  times: [-0.5, -0.25, 0, 0.25, 0.5],
  channels: {
    C3: [1.0, 1.2, 0.8, 1.1, 0.9],
    C4: [0.9, 1.0, 1.1, 0.8, 1.2],
    Cz: [0.5, 0.6, 0.7, 0.5, 0.6],
  },
}

it('renders channel toggle buttons', () => {
  render(<TimeSeriesChart data={mockData} explain={false} />)
  expect(screen.getByText('C3')).toBeInTheDocument()
  expect(screen.getByText('C4')).toBeInTheDocument()
  expect(screen.getByText('Cz')).toBeInTheDocument()
})

it('renders explain caption when explain is true', () => {
  render(<TimeSeriesChart data={mockData} explain={true} />)
  expect(screen.getByText(/motor cortex/i)).toBeInTheDocument()
})

it('does not render explain caption when explain is false', () => {
  render(<TimeSeriesChart data={mockData} explain={false} />)
  expect(screen.queryByText(/motor cortex/i)).not.toBeInTheDocument()
})

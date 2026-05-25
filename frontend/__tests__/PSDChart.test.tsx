import { render, screen } from '@testing-library/react'
import PSDChart from '@/components/visualize/PSDChart'
import type { PSDData } from '@/lib/mock-data'

const mockData: PSDData = {
  freqs: [1, 4, 8, 10, 12, 15, 20, 25, 30, 35, 40],
  power: [-30, -28, -25, -22, -24, -27, -29, -30, -31, -32, -33],
  channel: 'C3',
}

it('renders band labels', () => {
  render(<PSDChart data={mockData} />)
  expect(screen.getByText('μ')).toBeInTheDocument()
  expect(screen.getByText('β')).toBeInTheDocument()
})

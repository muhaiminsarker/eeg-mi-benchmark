import { render, screen, fireEvent } from '@testing-library/react'
import ContextBar from '@/components/layout/ContextBar'
import type { AppOptions } from '@/app/visualize/page'

const mockOptions: AppOptions = {
  datasets: [{ value: 'BNCI2014001', label: 'BCI Competition IV 2a' }],
  subjects: { BNCI2014001: [1, 2, 3] },
  runs: {
    BNCI2014001: [
      { value: 'imagined_hand', label: 'Imagined Left / Right Hand' },
      { value: 'imagined_feet', label: 'Imagined Feet' },
    ],
  },
}

it('renders explain toggle', () => {
  render(
    <ContextBar
      options={mockOptions}
      loaded={null}
      loading={false}
      explain={false}
      onExplainChange={jest.fn()}
      onLoad={jest.fn()}
    />
  )
  expect(screen.getByLabelText(/explain/i)).toBeInTheDocument()
})

it('calls onExplainChange when toggle is clicked', () => {
  const onExplainChange = jest.fn()
  render(
    <ContextBar
      options={mockOptions}
      loaded={null}
      loading={false}
      explain={false}
      onExplainChange={onExplainChange}
      onLoad={jest.fn()}
    />
  )
  fireEvent.click(screen.getByLabelText(/explain/i))
  expect(onExplainChange).toHaveBeenCalledWith(true)
})

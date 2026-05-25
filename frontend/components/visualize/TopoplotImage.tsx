'use client'

import type { TopoplotData } from '@/lib/mock-data'

interface Props {
  data: TopoplotData
  height?: number
}

export default function TopoplotImage({ data, height = 280 }: Props) {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
      <div
        style={{ width: height, height, maxWidth: '100%' }}
        dangerouslySetInnerHTML={{ __html: data.svg }}
      />
    </div>
  )
}

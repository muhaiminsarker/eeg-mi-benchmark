'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface NavSlotContextType {
  slot: ReactNode
  setSlot: (node: ReactNode) => void
}

const NavSlotContext = createContext<NavSlotContextType>({
  slot: null,
  setSlot: () => {},
})

export function NavSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode>(null)
  return (
    <NavSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </NavSlotContext.Provider>
  )
}

export function useNavSlot() {
  return useContext(NavSlotContext)
}

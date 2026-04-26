'use client'

import { createContext, useContext } from 'react'
import { useSSE } from '@/hooks/useSSE'

const SSEContext = createContext({ isConnected: false, lastEvent: null })

export function SSEProvider({ children }) {
  const { isConnected, lastEvent } = useSSE()
  return (
    <SSEContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSEContext() {
  return useContext(SSEContext)
}

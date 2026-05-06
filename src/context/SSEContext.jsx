'use client'

import { createContext, useContext } from 'react'
import { useSSE } from '@/hooks/useSSE'

const SSEContext = createContext({ isConnected: false, subscribe: () => () => {} })

export function SSEProvider({ children }) {
  const { isConnected, subscribe } = useSSE()
  return (
    <SSEContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSEContext() {
  return useContext(SSEContext)
}

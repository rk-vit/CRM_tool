"use client"

import { createContext, useContext, useState } from "react"

interface CallState {
  isOpen: boolean
  lead: any
}

const CallContext = createContext<any>(null)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    lead: null,
  })

  return (
    <CallContext.Provider value={{ callState, setCallState }}>
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  return useContext(CallContext)
}
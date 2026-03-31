"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { currentUser, adminUser } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulated authentication
    if (email.includes("admin")) {
      setUser(adminUser)
      return true
    } else if (email && password) {
      setUser(currentUser)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
  }

  const switchRole = (role: UserRole) => {
    if (role === "admin") {
      setUser(adminUser)
    } else {
      setUser(currentUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

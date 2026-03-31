"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import type { UserRole } from "./types"

interface AuthContextType {
  user: any | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return !!res?.ok
  }

  const logout = () => {
    signOut({ callbackUrl: "/" })
  }

  const switchRole = async (role: UserRole) => {
    // This is a dummy switchRole for the demo
    // In a real app, you might update the user role in the DB and then refresh the session
    console.log("Switching to role:", role)
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isAuthenticated: status === "authenticated",
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

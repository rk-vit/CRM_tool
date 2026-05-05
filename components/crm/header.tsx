"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Search, PhoneIncoming } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback } from "react"
import { UnknownCallersPanel } from "./unknown-callers-panel"
import Link from "next/link"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const [unknownCallersOpen, setUnknownCallersOpen] = useState(false)
  const [unknownCount, setUnknownCount] = useState(0)

  // Poll for unknown callers count every 30 seconds
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/unknown-callers")
      if (!res.ok) return
      const data = await res.json()
      setUnknownCount(data.count)
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
        <div className="flex-1 pl-12 lg:pl-0">
          <h1 className="text-lg font-semibold md:text-xl text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - hidden on small screens */}
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-9 bg-secondary border-0"
            />
          </div>

          {/* Unknown Callers Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setUnknownCallersOpen(true)}
          >
            <PhoneIncoming className="h-5 w-5" />
            {unknownCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-2 border-card">
                {unknownCount}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <Link href="/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Unknown Callers Slide-out Panel */}
      <UnknownCallersPanel
        open={unknownCallersOpen}
        onOpenChange={setUnknownCallersOpen}
        onCountChange={setUnknownCount}
      />
    </>
  )
}
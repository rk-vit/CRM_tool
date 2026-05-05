"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  Phone,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const salesNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/emails", label: "Emails", icon: Mail }
]

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/leads", label: "All Leads", icon: Users },
  { href: "/admin/team", label: "Team", icon: UserCog },
  { href: "/admin/allocate", label: "Allocate", icon: Building2 },
  { href: "/admin/calls", label: "Call Logs", icon: Phone }
]

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAdmin = user?.role === "admin"
  const navItems = isAdmin ? adminNavItems : salesNavItems

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              RE
            </div>
            <span className="font-semibold text-lg">SriRam's CRM</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm mx-auto">
            RE
          </div>
        )}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
        ) : (
          <Avatar className="h-9 w-9 mx-auto mb-4">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-2"
            )}
            asChild
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Settings</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full justify-start text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 lg:hidden bg-card shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      </aside>
    </>
  )
}

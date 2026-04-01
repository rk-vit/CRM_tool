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
import { Bell, Search, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserPlus } from "lucide-react"
import { useState } from "react"


interface HeaderProps {
  title: string
  subtitle?: string
}

interface Notification {
  id: string
  title: string
  time: string
  unread?: boolean
}
// useEffect(() => {
//   const channel = pusher.subscribe('leads');
//   channel.bind('new-lead', (data) => {
//     // This is where you update your state in real-time
//     setNotifications(prev => [data, ...prev]);
//   });
// }, []);

export function Header({ title, subtitle }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, switchRole } = useAuth()

  return (
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

        <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {/* Badge: Show only if notifications exist */}
      {notifications?.length > 0 && (
        <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-2 border-card">
          {notifications.length}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-80 p-0">
    <DropdownMenuLabel className="p-4 font-normal">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Notifications</span>
        <span className="text-xs text-muted-foreground">{notifications?.length || 0} New Leads</span>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator className="m-0" />
    
    <ScrollArea className="h-[300px]">
      {notifications?.length > 0 ? (
        notifications.map((item) => (
          <DropdownMenuItem key={item.id} className="flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-secondary">
            <div className="flex items-center gap-3 w-full">
              <div className="bg-primary/10 p-2 rounded-full">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
              </div>
              {item.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </DropdownMenuItem>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">No new leads at the moment</p>
        </div>
      )}
    </ScrollArea>

    <DropdownMenuSeparator className="m-0" />
    <DropdownMenuItem className="p-3 justify-center text-xs text-muted-foreground cursor-pointer hover:text-foreground">
      View All Activity
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
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
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

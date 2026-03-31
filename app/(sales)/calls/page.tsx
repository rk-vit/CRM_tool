"use client"

import { useState } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { callLogs, leads } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import {
  Search,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  Play,
  Download,
  Pause,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { format } from "date-fns"

export default function CallsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [directionFilter, setDirectionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [playingId, setPlayingId] = useState<string | null>(null)

  const myCalls = callLogs.filter(c => c.assignedTo === user?.id)

  const filteredCalls = myCalls.filter((call) => {
    const lead = leads.find(l => l.id === call.leadId)
    const matchesSearch = 
      call.callerTo.includes(searchQuery) ||
      call.callerNumber.includes(searchQuery) ||
      call.leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesDirection = directionFilter === "all" || call.direction === directionFilter
    const matchesStatus = statusFilter === "all" || call.status === statusFilter

    return matchesSearch && matchesDirection && matchesStatus
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Call Logs" subtitle={`${filteredCalls.length} calls`} />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by phone or lead ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{myCalls.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Answered</p>
                  <p className="text-2xl font-bold">{myCalls.filter(c => c.status === "answered").length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Missed</p>
                  <p className="text-2xl font-bold">{myCalls.filter(c => c.status === "missed").length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(Math.round(myCalls.reduce((acc, c) => acc + c.duration, 0) / myCalls.length || 0))}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call List */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No calls found</p>
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const lead = leads.find(l => l.id === call.leadId)
                  return (
                    <div key={call.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          call.direction === "outbound" ? "bg-success/10 text-success" : "bg-chart-1/10 text-chart-1"
                        }`}>
                          {call.direction === "outbound" ? (
                            <PhoneOutgoing className="h-5 w-5" />
                          ) : (
                            <PhoneIncoming className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{lead?.name || "Unknown"}</p>
                            <Badge variant="outline" className="text-xs">{call.leadId}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{call.callerTo}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(call.createdAt), "MMM dd, yyyy hh:mm a")}</span>
                            <span>|</span>
                            <span>{formatDuration(call.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`hidden sm:flex ${
                          call.direction === "outbound" ? "text-success border-success" : "text-chart-1 border-chart-1"
                        }`}>
                          {call.direction}
                        </Badge>
                        <Badge variant="outline" className={
                          call.status === "answered" ? "text-success border-success" :
                          call.status === "missed" ? "text-destructive border-destructive" :
                          ""
                        }>
                          {call.status}
                        </Badge>
                        {call.recordingUrl && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setPlayingId(playingId === call.id ? null : call.id)}
                            >
                              {playingId === call.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

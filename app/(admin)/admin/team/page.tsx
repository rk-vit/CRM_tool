"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { salesExecutives, leads, callLogs, timelineEvents } from "@/lib/mock-data"
import {
  Users,
  Phone,
  TrendingUp,
  Eye,
  Mail,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const selectedExec = selectedMember 
    ? salesExecutives.find(e => e.id === selectedMember)
    : null

  const memberLeads = selectedMember 
    ? leads.filter(l => l.assignedTo === selectedMember)
    : []

  const memberCalls = selectedMember
    ? callLogs.filter(c => c.assignedTo === selectedMember)
    : []

  const memberTimeline = selectedMember
    ? timelineEvents.filter(e => {
        const lead = leads.find(l => l.id === e.leadId)
        return lead?.assignedTo === selectedMember
      })
    : []

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Team Management" subtitle="Monitor team performance" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Team Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesExecutives.map((exec) => (
            <Card 
              key={exec.id} 
              className={`border-0 shadow-sm cursor-pointer transition-all ${
                selectedMember === exec.id 
                  ? "ring-2 ring-primary" 
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedMember(selectedMember === exec.id ? null : exec.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {exec.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{exec.name}</p>
                    <p className="text-xs text-muted-foreground">Sales Executive</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conversion</span>
                    <span className="font-semibold">{exec.conversionRate}%</span>
                  </div>
                  <Progress value={exec.conversionRate} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="font-bold text-lg">{exec.leadsAssigned}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-success">{exec.leadsConverted}</p>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{exec.totalCalls}</p>
                    <p className="text-xs text-muted-foreground">Calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Member Details */}
        {selectedExec && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedExec.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedExec.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedExec.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="leads">
                <TabsList>
                  <TabsTrigger value="leads" className="gap-2">
                    <Users className="h-4 w-4" />
                    Leads ({memberLeads.length})
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Calls ({memberCalls.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="leads" className="mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberLeads.slice(0, 5).map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium text-primary">{lead.id}</TableCell>
                            <TableCell>{lead.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                            <TableCell>
                              <Badge className={
                                lead.status === "qualified" ? "bg-success text-success-foreground" :
                                lead.status === "new" ? "bg-chart-1 text-white" :
                                lead.status === "won" ? "bg-primary text-primary-foreground" :
                                "bg-secondary text-secondary-foreground"
                              }>
                                {lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/leads/${lead.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="calls" className="mt-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {memberCalls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No calls recorded</p>
                      </div>
                    ) : (
                      memberCalls.map((call) => {
                        const lead = leads.find(l => l.id === call.leadId)
                        return (
                          <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                call.direction === "outbound" ? "bg-success/10 text-success" : "bg-chart-1/10 text-chart-1"
                              }`}>
                                <Phone className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{lead?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(call.createdAt), "MMM dd, hh:mm a")} | {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={
                              call.status === "answered" ? "text-success border-success" : "text-destructive border-destructive"
                            }>
                              {call.status}
                            </Badge>
                          </div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {memberTimeline.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No activity recorded</p>
                      </div>
                    ) : (
                      memberTimeline.slice(0, 10).map((event, index) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="relative flex flex-col items-center">
                            <div className={`h-2 w-2 rounded-full ${
                              event.type === "call" ? "bg-success" :
                              event.type === "email" ? "bg-chart-1" :
                              event.type === "status_change" ? "bg-warning" :
                              "bg-muted-foreground"
                            }`} />
                            {index < memberTimeline.length - 1 && (
                              <div className="flex-1 w-px bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Team</p>
                  <p className="text-2xl font-bold">{salesExecutives.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Conversion</p>
                  <p className="text-2xl font-bold">
                    {(salesExecutives.reduce((a, b) => a + b.conversionRate, 0) / salesExecutives.length).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">
                    {salesExecutives.reduce((a, b) => a + b.leadsAssigned, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-chart-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">
                    {salesExecutives.reduce((a, b) => a + b.totalCalls, 0)}
                  </p>
                </div>
                <Phone className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

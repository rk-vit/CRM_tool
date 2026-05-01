"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Tag,
  MessageSquare,
  History,
  FileText,
  MoreVertical,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Plus,
  Building
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Lead, TimelineEvent, CallLog, EmailLog, Comment } from "@/lib/types"

export default function AdminLeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<{
    lead: Lead;
    timeline: TimelineEvent[];
    calls: CallLog[];
    emails: EmailLog[];
    comments: Comment[];
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeadDetails() {
      try {
        setLoading(true)
        const res = await fetch(`/api/leads/${id}`)
        if (!res.ok) throw new Error("Failed to fetch lead details")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
        setError("Could not load lead details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeadDetails()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-end justify-center min-h-screen space-y-4 pr-6">
        <p className="text-destructive font-medium">{error || "Lead not found"}</p>
        <Button asChild variant="outline">
          <Link href="/admin/leads">Back to All Leads</Link>
        </Button>
      </div>
    )
  }

  const { lead, timeline, calls, emails, comments } = data

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-chart-1 text-white",
      contacted: "bg-chart-2 text-white",
      qualified: "bg-green-600 text-white",
      negotiation: "bg-orange-500 text-white",
      won: "bg-emerald-600 text-white",
      lost: "bg-destructive text-destructive-foreground"
    }
    return colors[status] || "bg-secondary text-secondary-foreground"
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4 md:p-6 pl-14 md:pl-6">
          <div className=" flex flex-col items-end max-h-max p-0 justify-center mb-2">
          <Link
            href="/admin/leads"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to All Leads
          </Link>
          </div>
          <div className="flex flex-col gap-4">
            {/* Lead identity */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base md:text-xl font-bold shrink-0">
                {lead.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold truncate">{lead.name}</h1>
                  <Badge variant="outline" className="font-mono text-xs shrink-0">{lead.id}</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lead.project}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" /> Added {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 shrink-0" /> Assigned to:&nbsp;<span className="font-medium text-primary">{lead.assignedToName || "Unassigned"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Status + actions */}
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(lead.status)} px-3 py-1 text-xs`}>
                {lead.status.toUpperCase()}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Reassign Lead</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Won</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Lost</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Lead Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Management */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reassign Executive</p>
                  <Button variant="outline" className="w-full justify-between text-sm">
                    <span className="truncate">{lead.assignedToName || "Select Executive"}</span>
                    <Plus className="h-4 w-4 shrink-0 ml-2" />
                  </Button>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Internal Notes</p>
                  <p className="text-sm text-muted-foreground italic break-words">
                    {lead.notes || "No internal admin notes."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                  <p className="font-medium text-sm break-all">{lead.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="font-medium text-sm break-all">{lead.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 gap-4 rounded-none overflow-x-auto flex-nowrap">
                <TabsTrigger value="timeline" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
                  <History className="h-3.5 w-3.5 mr-1.5" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="calls" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Logs
                </TabsTrigger>
                <TabsTrigger value="emails" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Emails
                </TabsTrigger>
                <TabsTrigger value="notes" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="pt-6 space-y-6">
                <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[23px] mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-4 ring-background" />
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground shrink-0">{format(new Date(event.createdAt), "MMM dd, hh:mm a")}</p>
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{event.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-bold">
                          BY {event.createdBy === "system" ? "SYSTEM" : event.createdBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="calls" className="pt-6">
                <div className="space-y-4">
                  {calls.map((call) => (
                    <Card key={call.id} className="border-0 shadow-sm bg-secondary/30">
                      <CardContent className="p-4 flex flex-col gap-3">
                        {/* Call info row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                              call.direction === "inbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                            }`}>
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">
                                {call.direction === "inbound" ? "Incoming Call" : "Outgoing Call"}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                <span>{format(new Date(call.createdAt), "MMM dd, hh:mm a")}</span>
                                <span>•</span>
                                <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={call.status === "answered" ? "default" : "destructive"} className="shrink-0 text-xs">
                            {call.status}
                          </Badge>
                        </div>

                        {/* Recording - full width below */}
                        {call.recordingUrl && (
                          <audio
                            controls
                            src={`/api/calls/recording?url=${encodeURIComponent(call.recordingUrl)}`}
                            className="w-full h-8"
                            title="Listen to call recording"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {calls.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-lg">
                      No call logs found.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="pt-6">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="border-0 shadow-sm bg-secondary/30">
                      <CardContent className="p-4">
                        <p className="text-sm break-words">{comment.text}</p>
                        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-primary">{comment.createdByName}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM dd, hh:mm a")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      No notes recorded yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="emails" className="pt-6">
                <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-lg">
                  No email history available.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
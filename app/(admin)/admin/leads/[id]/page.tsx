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
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
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
      <div className="border-b bg-card">
        <div className="p-4 md:p-6">
          <Link
            href="/admin/leads"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to All Leads
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {lead.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{lead.name}</h1>
                  <Badge variant="outline" className="font-mono">{lead.id}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> {lead.project}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Added {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Assigned to: <span className="font-medium text-primary ml-1">{lead.assignedToName || "Unassigned"}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(lead.status)} px-3 py-1 text-sm`}>
                {lead.status.toUpperCase()}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline">
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
          <div className="lg:col-span-1 space-y-6">
            {/* Lead Status Control */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reassign Executive</p>
                  <Button variant="outline" className="w-full justify-between">
                    {lead.assignedToName || "Select Executive"}
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Internal Notes</p>
                  <p className="text-sm text-muted-foreground italic">
                    {lead.notes || "No internal admin notes."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="font-medium">{lead.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tabs for Activities */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 gap-6 rounded-none">
                <TabsTrigger value="timeline" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto">
                  <History className="h-4 w-4 mr-2" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="calls" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto">
                  <Phone className="h-4 w-4 mr-2" /> Call Logs
                </TabsTrigger>
                <TabsTrigger value="emails" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto">
                  <Mail className="h-4 w-4 mr-2" /> Emails
                </TabsTrigger>
                <TabsTrigger value="notes" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 py-3 h-auto">
                  <FileText className="h-4 w-4 mr-2" /> Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="pt-6 space-y-6">
                <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[23px] mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-4 ring-background" />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.createdAt), "MMM dd, hh:mm a")}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
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
                    <Card key={call.id} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            call.direction === "inbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}>
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {call.direction === "inbound" ? "Incoming Call" : "Outgoing Call"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(call.createdAt), "MMM dd, hh:mm a")}</span>
                              <span>•</span>
                              <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={call.status === "answered" ? "default" : "destructive"}>
                          {call.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {calls.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-lg">
                      No call logs found for this lead.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="pt-6">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="border-0 shadow-sm bg-secondary/30">
                      <CardContent className="p-4">
                        <p className="text-sm">{comment.text}</p>
                        <div className="flex items-center justify-between mt-3">
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

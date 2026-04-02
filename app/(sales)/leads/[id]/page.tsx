"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  MapPin,
  Tag,
  MessageSquare,
  History,
  FileText,
  MoreVertical,
  ChevronLeft,
  Loader2,
  ExternalLink,
  ArrowLeft, 
  Plus,
  Zap
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Lead, TimelineEvent, CallLog, EmailLog, Comment, LeadStatus, LeadSubStatus } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { leads } from "@/lib/mock-data"

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
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
          <Link href="/leads">Back to Leads</Link>
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
      <Header 
        title={`Lead Details`} 
        subtitle={`${lead.id} - ${lead.name}`}
      />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            <Sheet open={quickActionOpen} onOpenChange={setQuickActionOpen}>
              <SheetTrigger asChild>
                <Button size="sm">
                  <Zap className="h-4 w-4 mr-2" /> Quick Action
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl p-6 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Quick Action</SheetTitle>
                </SheetHeader>
                <QuickActionForm lead={lead} onClose={() => setQuickActionOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Lead Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full">
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                  <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-0 text-white">
                    <Calendar className="h-4 w-4 mr-2" /> Schedule
                  </Button>
                  <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-0 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
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
                  <p className="font-medium flex items-center justify-between">
                    {lead.phone}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
                {lead.alternatePhone && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Alternate Phone</p>
                    <p className="font-medium">{lead.alternatePhone}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="font-medium flex items-center justify-between">
                    {lead.email}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" className="w-full justify-start text-xs h-8">
                    <Plus className="h-3 w-3 mr-2" /> Add Social Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lead Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Property Interest
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Source</p>
                    <p className="text-sm font-medium">{lead.medium}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Sub-Status</p>
                    <p className="text-sm font-medium">
                      <Badge variant="outline" className="text-xs font-normal">
                        {lead.subStatus}
                      </Badge>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Budget</p>
                    <p className="text-sm font-medium">{lead.budget || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Follow Up</p>
                    <p className="text-sm font-medium">
                      {lead.followUpDate ? format(new Date(lead.followUpDate), "MMM dd, hh:mm a") : "None"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Requirements</p>
                  <p className="text-sm">{lead.requirements || "No specific requirements mentioned."}</p>
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

              {/* Timeline Content */}
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
                          {event.createdBy === "system" ? "SYSTEM TRIGGERED" : `ACTION BY ${event.createdBy === lead.assignedTo ? "YOU" : event.createdBy}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      No activities recorded yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Calls Content */}
              <TabsContent value="calls" className="pt-6">
                <div className="space-y-4">
                  {calls.map((call) => (
                    <Card key={call.id} className="border-0 shadow-sm bg-secondary/30">
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
                      No call logs found.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Emails Content */}
              <TabsContent value="emails" className="pt-6">
                <div className="space-y-4">
                  {emails.map((email) => (
                    <Card key={email.id} className="border-0 shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{email.subject}</p>
                          <Badge variant="outline" className="text-[10px]">{email.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">To: {email.to}</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">{email.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-3 uppercase">
                          Sent on {format(new Date(email.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {emails.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-lg">
                      No emails sent yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Notes Content */}
              <TabsContent value="notes" className="pt-6">
                <div className="space-y-6">
                  <div className="relative">
                    <textarea 
                      placeholder="Add a private note about this lead..."
                      className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                    />
                    <div className="absolute right-3 bottom-3">
                      <Button size="sm">Save Note</Button>
                    </div>
                  </div>
                  
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
                        No notes added to this lead.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
  function QuickActionForm({ lead, onClose }: { lead: typeof leads[0], onClose: () => void }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [subStatus, setSubStatus] = useState<LeadSubStatus>(lead.subStatus)
  const [comment, setComment] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")

  return (
    <div className="space-y-4 mt-6">
      <div className="p-3 rounded-lg bg-secondary/50">
        <p className="text-sm text-muted-foreground">Lead ID</p>
        <p className="font-medium">{lead.id}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Comment</label>
        <Textarea 
          placeholder="Add a comment about this interaction..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Lead Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sub Status</label>
          <Select value={subStatus} onValueChange={(v) => setSubStatus(v as LeadSubStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Follow-up Date</label>
        <Input 
          type="datetime-local"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={onClose} className="flex-1">Save</Button>
      </div>
    </div>
  )
}
}

function Building(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}

"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { leads, timelineEvents, callLogs, emailLogs, comments } from "@/lib/mock-data"
import type { LeadStatus, LeadSubStatus } from "@/lib/types"
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Building,
  DollarSign,
  FileText,
  Play,
  Download,
  Send,
  Plus,
  Zap,
  ChevronDown,
  PhoneOutgoing,
  PhoneIncoming,
  CheckCircle,
  XCircle
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const lead = leads.find(l => l.id === id)
  const [activeTab, setActiveTab] = useState("timeline")
  const [newComment, setNewComment] = useState("")
  const [quickActionOpen, setQuickActionOpen] = useState(false)

  if (!lead) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Lead Not Found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Lead with ID {id} not found</p>
            <Button asChild className="mt-4">
              <Link href="/leads">Back to Leads</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const leadTimeline = timelineEvents.filter(e => e.leadId === lead.id)
  const leadCalls = callLogs.filter(c => c.leadId === lead.id)
  const leadEmails = emailLogs.filter(e => e.leadId === lead.id)
  const leadComments = comments.filter(c => c.leadId === lead.id)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-chart-1 text-white",
      contacted: "bg-chart-2 text-white",
      qualified: "bg-success text-success-foreground",
      negotiation: "bg-warning text-warning-foreground",
      won: "bg-chart-2 text-white",
      lost: "bg-destructive text-destructive-foreground"
    }
    return colors[status] || "bg-secondary text-secondary-foreground"
  }

  const getSubStatusColor = (subStatus: string) => {
    const colors: Record<string, string> = {
      hot: "bg-destructive/10 text-destructive",
      warm: "bg-warning/10 text-warning",
      cold: "bg-chart-1/10 text-chart-1"
    }
    return colors[subStatus] || ""
  }

  const getTimelineIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      comment: <MessageSquare className="h-4 w-4" />,
      status_change: <Zap className="h-4 w-4" />,
      workflow: <Zap className="h-4 w-4" />,
      sms: <MessageSquare className="h-4 w-4" />,
      whatsapp: <MessageSquare className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />
    }
    return icons[type] || <Clock className="h-4 w-4" />
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lead Info Panel */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lead Information</CardTitle>
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {lead.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{lead.name}</p>
                  <Badge variant="outline" className={getSubStatusColor(lead.subStatus)}>
                    {lead.subStatus}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                {lead.alternatePhone && (
                  <InfoRow icon={Phone} label="Alt. Phone" value={lead.alternatePhone} />
                )}
                <InfoRow icon={Mail} label="Email" value={lead.email} />
                <InfoRow icon={Building} label="Project" value={lead.project} />
                <InfoRow icon={User} label="Source" value={lead.medium} />
                {lead.budget && <InfoRow icon={DollarSign} label="Budget" value={lead.budget} />}
                <InfoRow icon={User} label="Assigned To" value={lead.assignedToName} />
                <InfoRow 
                  icon={Calendar} 
                  label="Created" 
                  value={format(new Date(lead.createdAt), "MMM dd, yyyy hh:mm a")} 
                />
                {lead.followUpDate && (
                  <InfoRow 
                    icon={Clock} 
                    label="Follow-up" 
                    value={format(new Date(lead.followUpDate), "MMM dd, yyyy hh:mm a")} 
                  />
                )}
              </div>

              {lead.requirements && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Requirements</p>
                  <p className="text-sm">{lead.requirements}</p>
                </div>
              )}

              {lead.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Tabs */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-secondary">
                  <TabsTrigger value="timeline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Timeline</span>
                    <Badge variant="secondary" className="h-5 px-1.5">{leadTimeline.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Comments</span>
                    <Badge variant="secondary" className="h-5 px-1.5">{leadComments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">Calls</span>
                    <Badge variant="secondary" className="h-5 px-1.5">{leadCalls.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="emails" className="gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Emails</span>
                    <Badge variant="secondary" className="h-5 px-1.5">{leadEmails.length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="timeline" className="mt-0">
                  <TimelineTab events={leadTimeline} />
                </TabsContent>
                <TabsContent value="comments" className="mt-0">
                  <CommentsTab 
                    comments={leadComments} 
                    newComment={newComment}
                    setNewComment={setNewComment}
                  />
                </TabsContent>
                <TabsContent value="calls" className="mt-0">
                  <CallsTab calls={leadCalls} />
                </TabsContent>
                <TabsContent value="emails" className="mt-0">
                  <EmailsTab emails={leadEmails} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  )
}

function TimelineTab({ events }: { events: typeof timelineEvents }) {
  const getTimelineIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      comment: <MessageSquare className="h-4 w-4" />,
      status_change: <Zap className="h-4 w-4" />,
      workflow: <Zap className="h-4 w-4" />,
      sms: <MessageSquare className="h-4 w-4" />,
      whatsapp: <MessageSquare className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />
    }
    return icons[type] || <Clock className="h-4 w-4" />
  }

  const getTimelineColor = (type: string) => {
    const colors: Record<string, string> = {
      call: "bg-success text-success-foreground",
      email: "bg-chart-1 text-white",
      status_change: "bg-warning text-warning-foreground",
      workflow: "bg-primary text-primary-foreground",
      comment: "bg-secondary text-secondary-foreground"
    }
    return colors[type] || "bg-muted text-muted-foreground"
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getTimelineColor(event.type)}`}>
              {getTimelineIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="flex-1 w-px bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between">
              <p className="font-medium text-sm">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(event.createdAt), "MMM dd, yyyy hh:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CommentsTab({ 
  comments, 
  newComment, 
  setNewComment 
}: { 
  comments: typeof import("@/lib/mock-data").comments
  newComment: string
  setNewComment: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea 
          placeholder="Add your comment here..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
      <Button className="w-full sm:w-auto">
        <Send className="h-4 w-4 mr-2" /> Post Comment
      </Button>

      <div className="border-t border-border pt-4 space-y-4 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {comment.createdByName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="font-medium text-sm">{comment.createdByName}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function CallsTab({ calls }: { calls: typeof callLogs }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No call logs</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {calls.map((call) => (
        <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              call.direction === "outbound" ? "bg-success/10 text-success" : "bg-chart-1/10 text-chart-1"
            }`}>
              {call.direction === "outbound" ? (
                <PhoneOutgoing className="h-5 w-5" />
              ) : (
                <PhoneIncoming className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{call.callerTo}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(call.createdAt), "MMM dd, hh:mm a")}</span>
                <span>|</span>
                <span>{formatDuration(call.duration)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={
              call.status === "answered" ? "text-success border-success" :
              call.status === "missed" ? "text-destructive border-destructive" :
              ""
            }>
              {call.status === "answered" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {call.status}
            </Badge>
            {call.recordingUrl && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmailsTab({ emails }: { emails: typeof emailLogs }) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No emails sent</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {emails.map((email) => (
        <div key={email.id} className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-start justify-between mb-2">
            <p className="font-medium text-sm">{email.subject}</p>
            <Badge variant="outline" className={
              email.status === "opened" ? "text-success border-success" :
              email.status === "clicked" ? "text-chart-1 border-chart-1" :
              email.status === "bounced" ? "text-destructive border-destructive" :
              ""
            }>
              {email.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{email.body}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(email.createdAt), "MMM dd, yyyy hh:mm a")}
          </p>
        </div>
      ))}
    </div>
  )
}

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

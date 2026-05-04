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
  Building,
  Edit
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Lead, TimelineEvent, CallLog, EmailLog, Comment } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    project: "",
    budget: "",
    requirements: "",
    notes: ""
  })

useEffect(() => {
  if (!data?.timeline) return
  
  const uniqueIds = [...new Set(
    data.timeline
      .map((e: TimelineEvent) => e.createdBy)
      .filter((id: string) => id && id !== "system")
  )]

  uniqueIds.forEach(async (id: string) => {
    if (userNames[id]) return
    try {
      const res = await fetch(`/api/sales/${id}`)
      const data2 = await res.json()
      console.log(data2); 
      setUserNames(prev => ({ ...prev, [id]: data2.name }))
    } catch {
      setUserNames(prev => ({ ...prev, [id]: id }))
    }
  })
}, [data])

  const fetchLeadDetails = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) throw new Error("Failed to fetch lead details")
      const json = await res.json()
      setData(json)

      // Initialize edit form
      if (json.lead) {
        setEditForm({
          name: json.lead.name,
          email: json.lead.email,
          phone: json.lead.phone,
          alternatePhone: json.lead.alternatePhone || "",
          project: json.lead.project,
          budget: json.lead.budget || "",
          requirements: json.lead.requirements || "",
          notes: json.lead.notes || ""
        })
      }
    } catch (err) {
      console.error(err)
      setError("Could not load lead details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadDetails()
  }, [id])

  const handleUpdateLead = async () => {
    try {
      setIsUpdating(true)
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update lead")
      }
      
      await fetchLeadDetails()
      setIsEditDialogOpen(false)
      toast.success("Lead details updated successfully")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update lead details")
    } finally {
      setIsUpdating(false)
    }
  }

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

  const whatsappUrl = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent([
    `Dear ${lead.name},`,
    ``,
    `Thank you for expressing interest in our project "${lead.project}" by SRIRAM BUILDERS located in Chennai, Madhavaram.`,
    ``,
    `Project Preview:`,
    `https://www.instagram.com/reel/DVTT0ImAHl9/?igsh=aHF1azk4M3dld3o3`,
    ``,
    `Location (Google Maps):`,
    `https://maps.google.com/?q=Madhavaram,Chennai`,
    ``,
    `We would be pleased to discuss the project details with you at your convenience. Kindly let us know a suitable time to connect.`,
    ``,
    `Best Regards,`,
    `SRIRAM BUILDERS`,
    `95 0094 0094`,
  ].join("\n"))}`;

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
                    <User className="h-3 w-3 shrink-0" /> Assigned to:&nbsp;<span className="font-medium text-primary">{lead.assigned_users?.join(", ") || lead.assigned_to || "Unassigned"}</span>
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
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                  </DropdownMenuItem>
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
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button variant="secondary" className="w-full min-w-0" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Email</span>
                    </a>
                  </Button>
                  <Button variant="secondary" className="w-full min-w-0 bg-white/10 hover:bg-white/20 border-0 text-white">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Schedule</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full min-w-0 bg-white/10 hover:bg-white/20 border-0 text-white"
                    onClick={() => window.open(whatsappUrl, "_blank")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">WhatsApp</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Management */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reassign Executive</p>
                  <Button variant="outline" className="w-full justify-between text-sm">
                    <span className="truncate">{lead.assigned_users?.join(", ") || lead.assigned_to || "Select Executive"}</span>
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
                {lead.alternatePhone && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Alternate Phone</p>
                    <p className="font-medium text-sm break-all">{lead.alternatePhone}</p>
                  </div>
                )}
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
                          BY {event.createdBy === "system" ? "SYSTEM" : (userNames[event.createdBy] || event.createdBy)}
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
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${call.direction === "inbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
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

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead Details</DialogTitle>
            <DialogDescription>Update the lead's contact and project information. Only admins can perform this action.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altPhone">Alternate Phone</Label>
              <Input 
                id="altPhone" 
                value={editForm.alternatePhone} 
                onChange={(e) => setEditForm({...editForm, alternatePhone: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Input 
                id="project" 
                value={editForm.project} 
                onChange={(e) => setEditForm({...editForm, project: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input 
                id="budget" 
                value={editForm.budget} 
                onChange={(e) => setEditForm({...editForm, budget: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea 
                id="requirements" 
                value={editForm.requirements} 
                onChange={(e) => setEditForm({...editForm, requirements: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Internal Admin Notes</Label>
              <Textarea 
                id="notes" 
                value={editForm.notes} 
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLead} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
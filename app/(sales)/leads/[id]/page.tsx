"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import {
  Phone,
  Mail,
  Calendar,
  User,
  Tag,
  MessageSquare,
  History,
  FileText,
  Loader2,
  ExternalLink,
  ArrowLeft, 
  Zap,
  ChevronDown,
  Send,
  PhoneCall
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FloatingCallWidget } from "../../call_widget/call_widget"

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [isCalling, setIsCalling] = useState(false)
  const [data, setData] = useState<{
    lead: Lead;
    timeline: TimelineEvent[];
    calls: CallLog[];
    emails: EmailLog[];
    comments: Comment[];
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showCallInterface, setShowCallInterface] = useState(false);

  const fetchLeadDetails = async () => {
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

  const handleExotelCall = async () => {
    try {
      setIsCalling(true)
      const response = await fetch('/api/calls/exotel-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          to: lead.phone 
        })
      })
      if (!response.ok) throw new Error("Call failed to initiate")
      console.log("Call initiated via Exotel")
    } catch (err) {
      console.error(err)
    } finally {
      setIsCalling(false)
    }
  }

  useEffect(() => {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={`Lead Details`} subtitle={`${lead.id} - ${lead.name}`} />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
            </Link>
          </Button>
          
          <div className="flex gap-2">
          <Button
                variant="outline"
                size="sm"
                disabled={isCalling}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedLead(lead)
                  setOpenConfirm(true)
                }}
              >
                {isCalling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Call
            </Button>
            {showCallInterface && selectedLead && (
                        <FloatingCallWidget
                          contactName={selectedLead.name}
                          contactPhone={selectedLead.phone}
                          onClose={() => setShowCallInterface(false)}
                        />
                      )}
            <Sheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Mail className="h-4 w-4 mr-2" /> Email
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl flex flex-auto p-6 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Send Email</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 mt-6 flex flex-col overflow-hidden">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To</label>
                    <Input value={lead.email} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input 
                      placeholder="Email Title / Subject" 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea 
                      placeholder="Type your mail content here..." 
                      className="flex-1 min-h-[300px] resize-none" 
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                    />
                  </div>
                </div>
                <SheetFooter className="pt-4">
                  <Button onClick={() => setEmailSheetOpen(false)} className="w-full">
                    <Send className="h-4 w-4 mr-2" /> Send Email
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

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
                <QuickActionForm 
                  lead={lead} 
                  onClose={() => setQuickActionOpen(false)} 
                  refreshData={fetchLeadDetails}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full" onClick={handleExotelCall}>
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => setEmailSheetOpen(true)}>
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
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="font-medium flex items-center justify-between">
                    {lead.email}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 gap-6 rounded-none">
                <TabsTrigger value="timeline" className="px-1 py-3 h-auto">
                  <History className="h-4 w-4 mr-2" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="calls" className="px-1 py-3 h-auto">
                  <Phone className="h-4 w-4 mr-2" /> Call Logs
                </TabsTrigger>
                <TabsTrigger value="emails" className="px-1 py-3 h-auto">
                  <Mail className="h-4 w-4 mr-2" /> Emails
                </TabsTrigger>
                <TabsTrigger value="notes" className="px-1 py-3 h-auto">
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
                      </div>
                    </div>
                  ))}
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {openConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Confirm Call</h2>

              <p className="text-sm text-gray-600 mb-5">
                You are calling the lead. You will receive a call on your mobile.
                Please attend it and wait for it to connect to the lead.
                <br /><br />
                Are you sure you want to make the call?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenConfirm(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    setOpenConfirm(false)

                    // 🔥 1. show widget
                    setShowCallInterface(true)

                    // 🔥 2. call API
                    await fetch('/api/call', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phone: selectedLead?.phone
                      })
                    })
                  }}
                  className="px-4 py-2 rounded bg-green-600 text-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

function QuickActionForm({ lead, onClose, refreshData }: { lead: Lead, onClose: () => void, refreshData: () => Promise<void> }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [subStatus, setSubStatus] = useState<LeadSubStatus>(lead.subStatus)
  const [comment, setComment] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/leads/${lead.id}/quickaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          status,
          subStatus,
          comment,
          followUpDate
        })
      })
      if (!response.ok) throw new Error("Update failed")
      await refreshData()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="p-3 rounded-lg bg-secondary/50">
        <p className="text-sm text-muted-foreground">Lead ID</p>
        <p className="font-medium">{lead.id}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Comment</label>
        <Textarea 
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)} disabled={isSubmitting}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Select value={subStatus} onValueChange={(v) => setSubStatus(v as LeadSubStatus)} disabled={isSubmitting}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  )
}
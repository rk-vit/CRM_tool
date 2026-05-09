"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mail,
  Calendar,
  Clock,
  User,
  MessageSquare,
  History,
  FileText,
  MoreVertical,
  ChevronLeft,
  Loader2,
  Plus,
  Building,
  Edit,
  Zap,
  Minimize2,
  Maximize2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Lead, TimelineEvent, CallLog, EmailLog, Comment, LeadStatus, LeadSubStatus } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSession } from "next-auth/react";

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
  const [quickActionOpen, setQuickActionOpen] = useState(false)

  const [callConfirmOpen, setCallConfirmOpen] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callLoading, setCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [callMinimized, setCallMinimized] = useState(false)
  const [callSid, setCallSid] = useState<string | null>(null)
  const [callResult, setCallResult] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [isCalling])

  useEffect(() => {
    if (!isCalling || !callSid) return

    const startTime = Date.now()
    const TIMEOUT_MS = 90_000

    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        clearInterval(pollInterval)
        setIsCalling(false)
        setCallSid(null)
        setCallResult("Call timed out — no response from server")
        setTimeout(() => setCallResult(null), 5000)
        fetchLeadDetails()
        return
      }

      try {
        const res = await fetch(`/api/calls/status?callSid=${callSid}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.ended) {
          clearInterval(pollInterval)
          setIsCalling(false)
          setCallSid(null)
          setCallResult(
            data.status === "answered"
              ? `Call completed — ${Math.floor(data.duration / 60)}m ${data.duration % 60}s`
              : data.status === "busy"
              ? "Lead was busy"
              : "Call was not answered"
          )
          setTimeout(() => setCallResult(null), 5000)
          fetchLeadDetails()
        }
      } catch (err) {
        console.error("Poll error:", err)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [isCalling, callSid])

  const handleCallClick = () => {
    setCallError(null)
    setCallConfirmOpen(true)
  }

  const handleConfirmCall = async () => {
    setCallLoading(true)
    setCallError(null)
    try {
      const res = await fetch("/api/calls/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to initiate call")
      setCallSid(result.callSid || null)
      setCallConfirmOpen(false)
      setIsCalling(true)
    } catch (err: any) {
      setCallError(err.message || "Something went wrong. Please try again.")
    } finally {
      setCallLoading(false)
    }
  }

  const handleEndCall = () => {
    setIsCalling(false)
    setCallSid(null)
    setCallResult("Call ended by agent")
    setTimeout(() => setCallResult(null), 5000)
    fetchLeadDetails()
  }

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

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
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-6">
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
    `Project Gallery:`,
    `https://photos.app.goo.gl/3sJssYN7bRqu3QGWA`,
    ``,
    `Project Preview:`,
    `https://www.instagram.com/reel/DYHceT2JbV_/?igsh=cmlhMHB4NmR5bTVm`,
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
      new: "bg-blue-600 text-white",
      contacted: "bg-purple-600 text-white",
      qualified: "bg-green-600 text-white",
      negotiation: "bg-orange-500 text-white",
      won: "bg-emerald-600 text-white",
      lost: "bg-red-600 text-white"
    }
    return colors[status] || "bg-secondary text-secondary-foreground"
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* HEADER SECTION - Optimised for Mobile View */}
      <div className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <Link className="flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors" href="/admin/leads">
              <ChevronLeft className="h-4 w-4 mr-1"/> Back to All Leads
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0 shadow-sm border border-primary/10">
                {lead.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <h1 className="text-lg font-bold text-slate-900 truncate max-w-[180px] sm:max-w-none">{lead.name}</h1>
                  <Badge className="font-mono text-[9px] px-1 py-0 h-4" variant="secondary">{lead.id}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-1.5 rounded py-0.5">
                    <Building className="h-2.5 w-2.5"/> {lead.project}
                  </span>
                  <Badge className={`${getStatusColor(lead.status)} border-0 font-bold text-[9px] px-1.5 h-4 uppercase tracking-wider`}>
                    {lead.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-center absolute top-4 right-4 md:static">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 w-8 p-0 rounded-lg" size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2"/> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 pb-32 md:pb-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* ACTION CARD - Layout matching image_766779.png */}
            <Card className="border-0 shadow-md overflow-hidden rounded-2xl bg-primary ring-1 ring-white/10">
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button className="h-10 rounded-xl font-bold shadow-sm bg-white text-slate-900 hover:bg-slate-50" onClick={handleCallClick}>
                    <Phone className="h-4 w-4 mr-2"/> Call
                  </Button>
                  <Button className="h-10 rounded-xl font-bold shadow-sm bg-emerald-500 text-white hover:bg-emerald-600 border-0" onClick={async () => {
                      if (Capacitor.isNativePlatform()) {
                        await Browser.open({ url: whatsappUrl });
                      } else {
                        window.open(whatsappUrl, "_blank");
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2"/> Whatsapp
                  </Button>
                </div>
                <Sheet onOpenChange={setQuickActionOpen} open={quickActionOpen}>
                  <SheetTrigger asChild>
                    <Button className="w-full h-10 rounded-xl font-bold shadow-sm bg-slate-100 text-slate-900 hover:bg-slate-200" variant="secondary">
                      <Zap className="h-4 w-4 mr-2 fill-current text-yellow-500"/> Quick Action
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="rounded-t-[2rem] h-[85vh] p-0 overflow-hidden border-0" side="bottom">
                    <div className="h-full flex flex-col">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                      <SheetHeader className="px-6 pt-2">
                        <SheetTitle className="text-center text-xl font-bold">Quick Action</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 pb-10">
                        <AdminQuickActionForm lead={lead} onClose={() => setQuickActionOpen(false)}
                          refreshData={fetchLeadDetails}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>

            {/* INFO CARDS */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-2 border-b border-slate-50 px-4">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-primary"/> Assignment & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 px-4 space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Assigned To</p>
                  <p className="text-xs font-semibold text-slate-700 leading-tight">
                    {lead.assignedUserNames?.join(", ") || lead.assignedToName || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Internal Admin Notes</p>
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                    <p className="text-xs text-amber-900/80 leading-normal italic">
                      {lead.notes || "No internal notes recorded."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-2 border-b border-slate-50 px-4">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary"/> Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 px-4 space-y-3">
                <div className="flex items-center justify-between group py-1" onClick={() => window.open(`tel:${lead.phone}`)}>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Primary Phone</p>
                    <p className="text-sm font-bold text-slate-700">{lead.phone}</p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 transition-colors">
                    <Phone className="h-3.5 w-3.5"/>
                  </div>
                </div>
                {lead.alternatePhone && (
                  <div className="flex items-center justify-between group py-1 border-t border-slate-50 pt-2" onClick={() => window.open(`tel:${lead.alternatePhone}`)}>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Alternate Phone</p>
                      <p className="text-sm font-bold text-slate-700">{lead.alternatePhone}</p>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                      <Phone className="h-3.5 w-3.5"/>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between group py-1 border-t border-slate-50 pt-2" onClick={() => window.open(`mailto:${lead.email}`)}>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Email Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{lead.email || "—"}</p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                    <Mail className="h-3.5 w-3.5"/>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs className="w-full" defaultValue="timeline">
              <TabsList className="w-full h-11 p-1 bg-white border rounded-2xl mb-4 shadow-sm overflow-x-auto no-scrollbar flex-nowrap justify-start lg:justify-center">
                <TabsTrigger className="rounded-xl px-4 py-1.5 text-[11px] font-bold" value="timeline">
                  Timeline
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-1.5 text-[11px] font-bold" value="calls">
                  Calls
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-1.5 text-[11px] font-bold" value="notes">
                  Notes
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-1.5 text-[11px] font-bold" value="emails">
                  Emails
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-0 outline-none" value="timeline">
                <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[20px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary shadow-sm" />
                      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                          <p className="font-bold text-xs text-slate-800 leading-tight">{event.title}</p>
                          <p className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 rounded-full">
                            {format(new Date(event.createdAt), "MMM dd, hh:mm a")}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal mb-2">{event.description}</p>
                        <div className="flex items-center gap-1.5">
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            BY {event.createdBy === "system" ? "SYSTEM" : (userNames[event.createdBy] || event.createdBy)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent className="mt-0 outline-none space-y-3" value="calls">
                {calls.map((call) => (
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden" key={call.id}>
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            call.direction === "inbound" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            <Phone className="h-4 w-4"/>
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800 leading-none mb-1">
                              {call.direction === "inbound" ? "Inbound" : "Outbound"}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 leading-none">
                              {format(new Date(call.createdAt), "MMM dd • hh:mm a")}
                            </p>
                          </div>
                        </div>
                        <Badge className="text-[9px] font-bold h-5 px-1.5" variant="secondary">
                          {Math.floor(call.duration / 60)}m {call.duration % 60}s
                        </Badge>
                      </div>
                      {call.recordingUrl && (
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <audio controls src={`/api/calls/recording?url=${encodeURIComponent(call.recordingUrl)}`} className="w-full h-7"/>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {calls.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400">No calls recorded.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent className="mt-0 outline-none space-y-3" value="notes">
                {comments.map((comment) => (
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden" key={comment.id}>
                    <CardContent className="p-3.5">
                      <p className="text-[11px] text-slate-700 leading-relaxed mb-3 font-medium italic">"{comment.text}"</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <p className="text-[9px] font-bold text-slate-800">{comment.createdByName}</p>
                        <p className="text-[9px] font-medium text-slate-400">{format(new Date(comment.createdAt), "MMM dd, hh:mm a")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400">No notes found.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent className="mt-0 outline-none" value="emails">
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <p className="text-xs font-medium text-slate-400">No email history.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog onOpenChange={setIsEditDialogOpen} open={isEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-slate-900 px-6 py-5 text-white">
            <DialogTitle className="text-lg font-bold">Edit Lead</DialogTitle>
          </div>
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, name: e.target.value})} value={editForm.name} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, email: e.target.value})} type="email" value={editForm.email} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Primary Phone</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, phone: e.target.value})} value={editForm.phone} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Alt Phone</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, alternatePhone: e.target.value})} value={editForm.alternatePhone} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, project: e.target.value})} value={editForm.project} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Budget</Label>
                <Input className="rounded-xl h-10 text-sm" onChange={(e) => setEditForm({...editForm, budget: e.target.value})} value={editForm.budget} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Requirements</Label>
                <Textarea className="rounded-xl min-h-[70px] text-sm" onChange={(e) => setEditForm({...editForm, requirements: e.target.value})} value={editForm.requirements} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Notes</Label>
                <Textarea className="rounded-xl min-h-[70px] text-sm" onChange={(e) => setEditForm({...editForm, notes: e.target.value})} value={editForm.notes} />
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
            <Button onClick={() => setIsEditDialogOpen(false)} variant="ghost" size="sm">Cancel</Button>
            <Button className="rounded-xl font-bold" disabled={isUpdating} onClick={handleUpdateLead} size="sm">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setCallConfirmOpen} open={callConfirmOpen}>
        <DialogContent className="max-w-[85vw] sm:max-w-md rounded-[2rem] p-6 border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-50/50">
              <PhoneCall className="h-8 w-8 text-emerald-600"/>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black text-slate-900">Initiate Call?</DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500">
                Securely connect to <span className="text-slate-900 font-bold">{lead.name}</span>
              </DialogDescription>
            </div>
            <div className="flex flex-col w-full gap-2.5">
              <Button className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-600/20" disabled={callLoading} onClick={handleConfirmCall}>
                {callLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : "Confirm Call"}
              </Button>
              <Button onClick={() => setCallConfirmOpen(false)} variant="ghost" className="w-full h-10 rounded-2xl text-slate-400 font-bold" disabled={callLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CALL UI */}
      {isCalling && (
        <div className={`fixed z-[100] transition-all duration-500 ease-in-out ${
          callMinimized 
            ? "bottom-20 right-6 w-14 h-14 rounded-full" 
            : "bottom-0 right-0 left-0 top-0 md:top-auto md:left-auto md:right-8 md:bottom-8 md:w-80 md:h-[420px] md:rounded-[2.5rem]"
        }`}>
          {callMinimized ? (
            <button onClick={() => setCallMinimized(false)} className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-green-500/20 group overflow-hidden">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
              <Phone className="h-5 w-5 text-white group-hover:scale-110 transition-transform"/>
            </button>
          ) : (
            <div className="w-full h-full bg-slate-900 md:shadow-2xl md:border md:border-white/10 flex flex-col p-6 overflow-hidden relative">
              <button onClick={() => setCallMinimized(true)} className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <Minimize2 className="h-4 w-4"/>
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 mt-4">
                <div className="text-center">
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 mb-3 px-3 py-0.5 rounded-full text-[8px] font-black tracking-widest animate-pulse">
                    ACTIVE CALL
                  </Badge>
                  <h2 className="text-white text-2xl font-black">{lead.name.split(' ')[0]}</h2>
                  <p className="text-slate-400 font-mono text-lg mt-1">{formatCallDuration(callDuration)}</p>
                </div>

                <div className="relative">
                  <div className="absolute -inset-10 bg-green-500/5 rounded-full animate-ping [animation-duration:3s]" />
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                       <span className="text-white text-3xl font-black">{lead.name[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleEndCall} className="w-full h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-red-500/20 mb-2">
                <PhoneOff className="h-5 w-5 rotate-[135deg]"/>
                <span className="text-lg font-black tracking-tight">End Call</span>
              </button>
            </div>
          )}
        </div>
      )}

      {callResult && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm">
           <div className="bg-slate-900/95 backdrop-blur shadow-xl rounded-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-green-500 shrink-0">
                <PhoneCall className="h-4 w-4 text-white"/>
              </div>
              <p className="text-white text-[10px] font-bold">{callResult}</p>
           </div>
        </div>
      )}
    </div>
  )
}

function AdminQuickActionForm({
  lead,
  onClose,
  refreshData,
}: {
  lead: Lead;
  onClose: () => void;
  refreshData: () => Promise<void>;
}) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [subStatus, setSubStatus] = useState<LeadSubStatus>(lead.subStatus);
  const [comment, setComment] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/leads/${lead.id}/quickaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          status,
          subStatus,
          comment,
          followUpDate,
          createdBy: session?.user?.id,
        }),
      });
      if (!response.ok) throw new Error("Update failed");
      await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 mt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</Label>
          <Select onValueChange={(v) => setStatus(v as LeadStatus)} value={status}>
            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-xs">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</Label>
          <Select onValueChange={(v) => setSubStatus(v as LeadSubStatus)} value={subStatus}>
            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-xs">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="hot">Hot 🔥</SelectItem>
              <SelectItem value="warm">Warm ⚡</SelectItem>
              <SelectItem value="cold">Cold ❄️</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Follow-up</Label>
        <Input className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-xs" onChange={(e) => setFollowUpDate(e.target.value)} type="datetime-local" value={followUpDate}/>
      </div>

      <div className="space-y-1 flex-1">
        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remarks</Label>
        <Textarea className="h-28 rounded-xl border-slate-200 bg-slate-50 text-xs resize-none" onChange={(e) => setComment(e.target.value)} placeholder="Type here..." value={comment}/>
      </div>

      <div className="flex gap-3 pt-4 shrink-0 mb-4">
        <Button className="h-12 rounded-xl flex-1 font-bold text-xs" onClick={onClose} variant="ghost">Cancel</Button>
        <Button className="h-12 rounded-xl flex-1 font-black bg-slate-900" disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Action"}
        </Button>
      </div>
    </div>
  )
}
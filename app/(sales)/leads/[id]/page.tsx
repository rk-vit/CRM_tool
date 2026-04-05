"use client";
import { useState, useEffect, use } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Phone,
  PhoneCall,
  PhoneOff,
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
  Plus,
  Minimize2,
  Maximize2,
  Zap,
  ChevronDown,
  Send,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type {
  Lead,
  TimelineEvent,
  CallLog,
  EmailLog,
  Comment,
  LeadStatus,
  LeadSubStatus,
} from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
 
const formatDate = (date: string | null | undefined) =>
  date ? format(new Date(date), "MMM dd, yyyy hh:mm a") : "—";

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [callConfirmOpen, setCallConfirmOpen] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callLoading, setCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [callMinimized, setCallMinimized] = useState(false)
  const [callSid, setCallSid] = useState<string | null>(null)
  const [callResult, setCallResult] = useState<string | null>(null)
 
  // Timer for the calling screen
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval)
  }, [isCalling])
 
  // Poll Exotel callback for call status — auto-end when call completes
  useEffect(() => {
    if (!isCalling || !callSid) return
 
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/status?callSid=${callSid}`)
        if (!res.ok) return
        const data = await res.json()
 
        if (data.ended) {
          // Call has ended — auto-dismiss widget
          clearInterval(pollInterval)
          setIsCalling(false)
          setCallResult(
            data.status === "answered"
              ? `Call completed — ${Math.floor(data.duration / 60)}m ${data.duration % 60}s`
              : data.status === "busy"
              ? "Lead was busy"
              : "Call was not answered"
          )
          // Clear result after 5 seconds
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
        body: JSON.stringify({ leadId: lead.id }),
      })
 
      const result = await res.json()
 
      if (!res.ok) {
        throw new Error(result.error || "Failed to initiate call");
      }
 
      setCallSid(result.callSid || null)
      setCallConfirmOpen(false)
      setIsCalling(true)
    } catch (err: any) {
      setCallError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCallLoading(false);
    }
  }
 
  const handleEndCall = () => {
    setIsCalling(false)
    setCallSid(null)
    // Refresh data to show the new call log and timeline entry
    fetchLeadDetails();
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [data, setData] = useState<{
    lead: Lead;
    timeline: TimelineEvent[];
    calls: CallLog[];
    emails: EmailLog[];
    comments: Comment[];
  } | null>(null);

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) {
      alert("Please fill in both subject and content.");
      return;
    }

    try {
      setIsSendingEmail(true);
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          to: lead.email,
          subject: emailSubject,
          body: emailContent,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      setEmailSheetOpen(false);
      setEmailSubject("");
      setEmailContent("");
      // Refresh data to show the new email log
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.message || "Something went wrong sending the email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lead details");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Could not load lead details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
 
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-destructive font-medium">
          {error || "Lead not found"}
        </p>
        <Button asChild variant="outline">
          <Link href="/leads">Back to Leads</Link>
        </Button>
      </div>
    );
  }

  const { lead, timeline, calls, emails, comments } = data;

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
      <Header title={`Lead Details`} subtitle={`${lead.id} - ${lead.name}`} />
 
      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 max-w-full overflow-x-hidden">
        {/* Top bar: back button + action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="self-start shrink-0">
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
            </Link>
          </Button>
          
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:gap-2">
            <Button variant="outline" size="sm" onClick={handleCallClick} className="w-full sm:w-auto">
              <Phone className="h-4 w-4 mr-1 sm:mr-2" /> <span>Call</span>
            </Button>
           
            <Sheet open={emailSheetOpen} onOpenChange={setEmailSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Mail className="h-4 w-4 mr-1 sm:mr-2" /> <span>Email</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl flex flex-auto p-4 sm:p-6 overflow-y-auto">
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
                  <Button
                    onClick={handleSendEmail}
                    className="w-full"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Send Email
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
 
            <Sheet open={quickActionOpen} onOpenChange={setQuickActionOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Zap className="h-4 w-4 mr-1 sm:mr-2" /> <span>Quick Action</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl p-4 sm:p-6 overflow-y-auto">
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
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left sidebar — full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <Card className="border-0 shadow-sm bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button variant="secondary" className="w-full min-w-0" onClick={handleCallClick}>
                    <Phone className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Call</span>
                  </Button>
                  <Button variant="secondary" className="w-full min-w-0" onClick={() => setEmailSheetOpen(true)}>
                    <Mail className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Email</span>
                  </Button>
                  <Button variant="secondary" className="w-full min-w-0 bg-white/10 hover:bg-white/20 border-0 text-white">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Schedule</span>
                  </Button>
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent([
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
                      `I'd love to connect with you to discuss the details further. Please let me know a convenient time for us to speak.`,
                      ``,
                      `Best Regards,`,
                      `SRIRAM BUILDERS`,
                      `95 0094 0094`,
                    ].join("\n"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-w-0 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rounded-md px-3 py-2 text-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">WhatsApp</span>
                  </a>
                </div>
              </CardContent>
            </Card>
 
            <Card className="border-0 shadow-md rounded-2xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" /> Lead Details
                  </CardTitle>
                </CardHeader>
 
                <CardContent className="space-y-5 text-sm px-4 pb-4 sm:px-6 sm:pb-6">
 
                  {/* Phone */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-semibold text-base text-foreground">{lead.phone}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
 
                  {/* Email */}
                  <div>
                    <p className="text-medium text-muted-foreground uppercase tracking-wide">Email</p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="font-semibold text-base text-foreground break-all min-w-0">
                        {lead.email}
                      </p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
 
                  {/* Source */}
                  <div>
                    <p className="text-medium text-muted-foreground uppercase tracking-wide">Source</p>
                    <p className="mt-1 font-semibold text-foreground">{lead.source || "-"}</p>
                  </div>
 
                  {/* Status */}
                  <div>
                    <p className="text-medium text-muted-foreground uppercase tracking-wide">Sub Status</p>
                    <div className="mt-1">
                      <Badge className="px-2 py-0.5 text-xs capitalize">
                        {lead.subStatus || "N/A"}
                      </Badge>
                    </div>
                  </div>
 
                  {/* Follow Up */}
                  <div>
                    <p className="text-medium text-muted-foreground uppercase tracking-wide">
                      Next Follow Up
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatDate(lead.followUpDate)}
                    </p>
                  </div>
 
                </CardContent>
              </Card>
 
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Property Interest
                </CardTitle>
              </CardHeader>
 
              <CardContent className="space-y-4 text-sm px-4 pb-4 sm:px-6 sm:pb-6">
 
                <div>
                  <p className="text-medium text-muted-foreground uppercase tracking-wide">
                    Project
                  </p>
                  <p className="mt-1 font-semibold text-foreground leading-relaxed">
                    {lead.project || "-"}
                  </p>
                </div>
 
              </CardContent>
            </Card>
          </div>
 
          {/* Right content — full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="timeline" className="w-full">
              {/* Scrollable tabs on small screens */}
              <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 gap-4 sm:gap-6 rounded-none overflow-x-auto flex-nowrap">
                <TabsTrigger value="timeline" className="px-1 py-3 h-auto whitespace-nowrap shrink-0">
                  <History className="h-4 w-4 mr-2" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="calls" className="px-1 py-3 h-auto whitespace-nowrap shrink-0">
                  <Phone className="h-4 w-4 mr-2" /> Call Logs
                </TabsTrigger>
                <TabsTrigger value="emails" className="px-1 py-3 h-auto whitespace-nowrap shrink-0">
                  <Mail className="h-4 w-4 mr-2" /> Emails
                </TabsTrigger>
                <TabsTrigger value="notes" className="px-1 py-3 h-auto whitespace-nowrap shrink-0">
                  <FileText className="h-4 w-4 mr-2" /> Notes
                </TabsTrigger>
              </TabsList>
 
              <TabsContent value="timeline" className="pt-6 space-y-6">
                <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[23px] mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-4 ring-background" />
                      <div className="space-y-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(event.createdAt),
                              "MMM dd, hh:mm a",
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
 
              {/* Calls Content */}
              <TabsContent value="calls" className="pt-6">
                <div className="space-y-4">
                  {calls.map((call) => (
                    <Card key={call.id} className="border-0 shadow-sm bg-secondary/30">
                      <CardContent className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${call.direction === "inbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
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
                        <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                          <Badge variant={call.status === "answered" ? "default" : "destructive"}>
                            {call.status}
                          </Badge>
                          {call.recordingUrl && (
                            <audio 
                              controls 
                              src={`/api/calls/recording?url=${encodeURIComponent(call.recordingUrl)}`} 
                              className="h-8 w-full max-w-[200px]" 
                              title="Listen to call recording"
                            />
                          )}
                        </div>
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
                      <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm">{email.subject}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{email.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">To: {email.to}</p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
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
 
              <TabsContent value="notes" className="pt-6">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="border-0 shadow-sm bg-secondary/30">
                      <CardContent className="p-3 sm:p-4">
                        <p className="text-sm">{comment.text}</p>
                        <div className="flex flex-col gap-1 mt-3 sm:flex-row sm:items-center sm:justify-between">
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
 
      {/* Call Confirmation Dialog */}
      <Dialog open={callConfirmOpen} onOpenChange={setCallConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              Confirm Call
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to call{" "}
              <span className="font-semibold text-foreground">{lead.name}</span>{" "}
              at{" "}
              <span className="font-semibold text-foreground">
                {lead.phone}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          {callError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {callError}
              </p>
            </div>
          )}
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCallConfirmOpen(false)}
              disabled={callLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCall}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={callLoading}
            >
              {callLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" /> Yes, Call Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Calling Widget — Bottom-right pop-up */}
      {isCalling &&
        (callMinimized ? (
          /* Minimized: small floating pill */
          <button
            onClick={() => setCallMinimized(false)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-full bg-slate-900 border border-slate-700 shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 hover:scale-105 group cursor-pointer"
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full bg-green-500/30 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">
                {lead.name.split(" ")[0]}
              </span>
              <span className="text-green-400 font-mono text-sm">
                {formatCallDuration(callDuration)}
              </span>
            </div>
            <Maximize2 className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        ) : (
          /* Expanded: pop-up card */
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] w-[calc(100vw-2rem)] max-w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-700/50" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Header bar with minimize */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
                  On Call
                </span>
              </div>
              <button
                onClick={() => setCallMinimized(true)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
 
            {/* Call content */}
            <div className="px-6 py-5 flex flex-col items-center gap-4">
              {/* Avatar with pulse */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div
                  className="absolute -inset-2 rounded-full border border-green-500/15 animate-pulse"
                  style={{ animationDuration: "2s" }}
                />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <span className="text-xl font-bold text-white">
                    {lead.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
              </div>
 
              {/* Lead info */}
              <div className="text-center space-y-0.5">
                <p className="text-white font-semibold text-base">
                  {lead.name}
                </p>
                <p className="text-slate-400 text-xs font-mono">{lead.phone}</p>
              </div>
 
              {/* Timer */}
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <p className="text-white font-mono text-sm tracking-widest">
                  {formatCallDuration(callDuration)}
                </p>
              </div>
            </div>
 
            {/* End call footer */}
            <div className="px-6 pb-5 flex justify-center">
              <button
                onClick={handleEndCall}
                className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95"
              >
                <PhoneOff className="h-4 w-4 text-white transition-transform group-hover:rotate-[135deg] duration-300" />
                <span className="text-white text-sm font-medium">End Call</span>
              </button>
            </div>
          </div>
        )
      )}
 
      {/* Call Result Toast — shown when auto-ended by webhook */}
      {callResult && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/40">
            <div className={`h-3 w-3 shrink-0 rounded-full ${callResult?.startsWith("Call completed") ? "bg-green-400" : "bg-amber-400"}`} />
            <span className="text-white text-sm font-medium">{callResult}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionForm({
  lead,
  onClose,
  refreshData,
}: {
  lead: Lead;
  onClose: () => void;
  refreshData: () => Promise<void>;
}) {
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
 
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as LeadStatus)}
            disabled={isSubmitting}
          >
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
          <Select
            value={subStatus}
            onValueChange={(v) => setSubStatus(v as LeadSubStatus)}
            disabled={isSubmitting}
          >
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
          disabled={isSubmitting}
        />
      </div>
 
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  )
}
 

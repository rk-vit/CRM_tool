"use client";

import { useState, useEffect, use } from "react";
import { Header } from "@/components/crm/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
} from "@/components/ui/dropdown-menu";

export default function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [callConfirmOpen, setCallConfirmOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callMinimized, setCallMinimized] = useState(false);

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
    return () => clearInterval(interval);
  }, [isCalling]);

  const handleCallClick = () => {
    setCallError(null);
    setCallConfirmOpen(true);
  };

  const handleConfirmCall = async () => {
    setCallLoading(true);
    setCallError(null);

    try {
      const res = await fetch("/api/calls/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to initiate call");
      }

      setCallConfirmOpen(false);
      setIsCalling(true);
    } catch (err: any) {
      setCallError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCallLoading(false);
    }
  };

  const handleEndCall = () => {
    setIsCalling(false);
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
            <Button variant="outline" size="sm" onClick={handleCallClick}>
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
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
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleCallClick}
                  >
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setEmailSheetOpen(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full bg-white/10 hover:bg-white/20 border-0 text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" /> Schedule
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full bg-white/10 hover:bg-white/20 border-0 text-white"
                  >
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
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Phone
                  </p>
                  <p className="font-medium flex items-center justify-between">
                    {lead.phone}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Email
                  </p>
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
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Source
                    </p>
                    <p className="text-sm font-medium">{lead.medium}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Sub-Status
                    </p>
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

              <TabsContent value="notes" className="pt-6">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card
                      key={comment.id}
                      className="border-0 shadow-sm bg-secondary/30"
                    >
                      <CardContent className="p-4">
                        <p className="text-sm">{comment.text}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs font-semibold text-primary">
                            {comment.createdByName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(comment.createdAt),
                              "MMM dd, hh:mm a",
                            )}
                          </p>
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
        <DialogContent showCloseButton={false} className="sm:max-w-md">
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
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-full bg-slate-900 border border-slate-700 shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 hover:scale-105 group cursor-pointer"
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
          <div
            className="fixed bottom-6 right-6 z-[100] w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-700/50"
            style={{
              background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            }}
          >
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
        ))}
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

      <div className="grid grid-cols-2 gap-4">
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
  );
}


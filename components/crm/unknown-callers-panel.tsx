"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, UserPlus, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import type { UnknownCaller, LeadSource } from "@/lib/types"

interface UnknownCallersPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCountChange?: (count: number) => void
}

export function UnknownCallersPanel({ open, onOpenChange, onCountChange }: UnknownCallersPanelProps) {
  const [callers, setCallers] = useState<UnknownCaller[]>([])
  const [loading, setLoading] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [selectedCaller, setSelectedCaller] = useState<UnknownCaller | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formProject, setFormProject] = useState("")
  const [formSource, setFormSource] = useState<LeadSource>("direct")
  const [formNotes, setFormNotes] = useState("")

  const fetchCallers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/unknown-callers")
      if (!res.ok) return
      const data = await res.json()
      setCallers(data.callers)
      onCountChange?.(data.count)
    } catch (err) {
      console.error("Failed to fetch unknown callers:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCallers()
    }
  }, [open])

  const handleConvertClick = (caller: UnknownCaller) => {
    setSelectedCaller(caller)
    setFormName("")
    setFormEmail("")
    setFormProject("")
    setFormSource("direct")
    setFormNotes("")
    setConvertDialogOpen(true)
  }

  const handleDiscardClick = (caller: UnknownCaller) => {
    setSelectedCaller(caller)
    setDiscardDialogOpen(true)
  }

  const handleConvertSubmit = async () => {
    if (!selectedCaller || !formName || !formEmail || !formProject) return

    try {
      setSubmitting(true)
      setError(null)

      // Retry up to 2 times for Neon timeouts
      let res: Response | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(`/api/unknown-callers/${selectedCaller.id}/convert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            project: formProject,
            source: formSource,
            medium: "Phone Call",
            notes: formNotes,
          }),
        })
        if (res.ok) break
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
      }

      if (!res?.ok) {
        setError("Failed to create lead. Please try again.")
        return
      }

      setConvertDialogOpen(false)
      setCallers((prev) => prev.filter((c) => c.id !== selectedCaller.id))
      onCountChange?.(callers.length - 1)
    } catch (err) {
      console.error("Convert error:", err)
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiscardConfirm = async () => {
    if (!selectedCaller) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/unknown-callers/${selectedCaller.id}/discard`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to discard")

      setDiscardDialogOpen(false)
      setCallers((prev) => prev.filter((c) => c.id !== selectedCaller.id))
      onCountChange?.(callers.length - 1)
    } catch (err) {
      console.error("Discard error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "busy": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      default: return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center justify-between pb-1">
              <span>Unknown Callers</span>
              {callers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {callers.length} pending
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">Review and manage unknown inbound callers</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : callers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Phone className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No unknown callers to review</p>
              </div>
            ) : (
              <div className="divide-y">
                {callers.map((caller) => (
                  <div key={caller.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    {/* Phone + status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <a href={`tel:${caller.phone}`}>
                            <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </a>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{caller.phone}</p>
                            {caller.callCount > 1 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400">
                                {caller.callCount} calls
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(caller.createdAt), "MMM dd, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${statusColor(caller.callStatus)}`}>
                        {caller.callStatus === "answered" ? "Answered" 
                          : caller.callStatus === "busy" ? "Busy" 
                          : "No Answer"}
                      </Badge>
                    </div>

                    {/* Duration + recording */}
                    <div className="ml-[52px] space-y-2">
                      {caller.callDuration > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {formatDuration(caller.callDuration)}
                        </p>
                      )}

                      {caller.recordingUrl && (
                        <audio
                          controls
                          src={`/api/calls/recording?url=${encodeURIComponent(caller.recordingUrl)}`}
                          className="h-8 w-full max-w-[240px]"
                        />
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs"
                          onClick={() => handleConvertClick(caller)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Add as Lead
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDiscardClick(caller)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Convert to Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convert to Lead
            </DialogTitle>
            <DialogDescription>
              Create a new lead from caller <span className="font-semibold text-foreground">{selectedCaller?.phone}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={selectedCaller?.phone || ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="Enter lead name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
              <Input
                placeholder="Enter email address"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Enter project name"
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v as LeadSource)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="99acres">99acres</SelectItem>
                    <SelectItem value="magicbricks">MagicBricks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Any additional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertSubmit}
              disabled={submitting || !formName || !formEmail || !formProject}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Create Lead</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Dialog */}
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Discard this number?
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className="font-semibold text-foreground">{selectedCaller?.phone}</span> will be permanently blocked. 
              Future calls from this number will be silently ignored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setDiscardDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscardConfirm} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Blocking...</>
              ) : (
                "Yes, Discard"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

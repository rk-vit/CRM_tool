"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import type { Lead, LeadStatus, LeadSubStatus } from "@/lib/types"

interface QuickActionFormProps {
  lead: Lead
  onClose: () => void
  refreshData: () => Promise<void>
}

export function QuickActionForm({
  lead,
  onClose,
  refreshData,
}: QuickActionFormProps) {
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [subStatus, setSubStatus] = useState<LeadSubStatus>(lead.subStatus)
  const [comment, setComment] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/leads/${lead.id}/quickaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          status,
          subStatus,
          comment,
          followUpDate,
          createdBy: user?.id,
        }),
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

"use client"

import { useState } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { emailLogs, leads } from "@/lib/mock-data"
import {
  Search,
  Mail,
  Send,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"

export default function EmailsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredEmails = emailLogs.filter((email) => {
    const lead = leads.find(l => l.id === email.leadId)
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || email.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Send className="h-4 w-4" />
      case "delivered": return <CheckCircle className="h-4 w-4" />
      case "opened": return <Eye className="h-4 w-4" />
      case "clicked": return <MousePointer className="h-4 w-4" />
      case "bounced": return <AlertCircle className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-muted text-muted-foreground"
      case "delivered": return "bg-chart-1/10 text-chart-1"
      case "opened": return "bg-success/10 text-success"
      case "clicked": return "bg-primary/10 text-primary"
      case "bounced": return "bg-destructive/10 text-destructive"
      default: return ""
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Emails" subtitle={`${filteredEmails.length} emails`} />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by subject, email, or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{emailLogs.length}</p>
                </div>
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{emailLogs.filter(e => e.status === "delivered").length}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-chart-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Opened</p>
                  <p className="text-2xl font-bold">{emailLogs.filter(e => e.status === "opened").length}</p>
                </div>
                <Eye className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                  <p className="text-2xl font-bold">{emailLogs.filter(e => e.status === "clicked").length}</p>
                </div>
                <MousePointer className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bounced</p>
                  <p className="text-2xl font-bold">{emailLogs.filter(e => e.status === "bounced").length}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredEmails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No emails found</p>
                </div>
              ) : (
                filteredEmails.map((email) => {
                  const lead = leads.find(l => l.id === email.leadId)
                  return (
                    <div key={email.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(email.status)}`}>
                            {getStatusIcon(email.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{email.subject}</p>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{email.leadId}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">To: {email.to}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{email.body}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge className={getStatusColor(email.status)}>
                            {email.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(email.createdAt), "MMM dd, hh:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

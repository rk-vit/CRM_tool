"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Header } from "@/components/crm/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import type { Lead, LeadStatus } from "@/lib/types"
import {
  Search,
  Filter,
  Phone,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Loader2,
  UserPlus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { FloatingCallWidget } from "../call_widget/call_widget"

const statusFilters: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All Leads" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "reengaged", label: "Re-Engaged" },
]

export default function LeadsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status") as LeadStatus | "all" | null
  
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">(statusParam || "all")
  const [openConfirm, setOpenConfirm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const [showCallInterface, setShowCallInterface] = useState(false)
  
  const itemsPerPage = 10

  const fetchLeadsData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const [leadsRes, projectsRes] = await Promise.all([
        fetch(`/api/leads?assignedTo=${user.id}`),
        fetch("/api/projects")
      ])
      const leadsData = await leadsRes.json()
      const projectsData = await projectsRes.json()
      if (Array.isArray(leadsData)) setLeads(leadsData)
      if (Array.isArray(projectsData)) setProjects(projectsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam)
  }, [statusParam])

  useEffect(() => {
    fetchLeadsData()
  }, [user?.id])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.source && lead.source.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesProject = projectFilter === "all" || lead.project === projectFilter
      return matchesSearch && matchesStatus && matchesProject
    })
  }, [leads, searchQuery, statusFilter, projectFilter])

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLeads.slice(start, start + itemsPerPage)
  }, [filteredLeads, currentPage])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length }
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1
    })
    return counts
  }, [leads])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-chart-1 text-white",
      contacted: "bg-chart-2 text-white",
      qualified: "bg-green-600 text-white",
      negotiation: "bg-orange-500 text-white",
      won: "bg-emerald-600 text-white",
      lost: "bg-destructive text-destructive-foreground",
      reengaged: "bg-purple-600 text-white",
    }
    return colors[status.toLowerCase()] || "bg-secondary text-secondary-foreground"
  }

  const getSubStatusColor = (subStatus: string) => {
    const colors: Record<string, string> = {
      hot: "bg-destructive/10 text-destructive border-destructive/20",
      warm: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      cold: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    }
    return colors[subStatus] || ""
  }

  if (loading && leads.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Leads" subtitle={`${filteredLeads.length} leads assigned to you`} />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        <Tabs 
          value={statusFilter} 
          onValueChange={(v) => {
            setStatusFilter(v as LeadStatus | "all")
            const params = new URLSearchParams(searchParams.toString())
            if (v === "all") params.delete("status")
            else params.set("status", v)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
          }}
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-secondary">
            {statusFilters.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {filter.label}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{statusCounts[filter.value] || 0}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary"><UserPlus className="h-4 w-4 mr-2" /> Add Lead</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add Manual Lead</DialogTitle>
                  <DialogDescription>Create a manual entry for walk-in clients.</DialogDescription>
                </DialogHeader>
                <AddLeadForm onSuccess={() => { setAddDialogOpen(false); fetchLeadsData() }} />
              </DialogContent>
            </Dialog>

            <div className="hidden md:flex border rounded-lg overflow-hidden">
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")} className="rounded-none"><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")} className="rounded-none"><Grid className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <Card className="border-0 shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary/50">
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden lg:table-cell">Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedLeads.map((lead) => (
          <TableRow 
            key={lead.id} 
            className="hover:bg-accent/50 group cursor-pointer transition-colors"
            // Routing when the row is clicked
            onClick={() => router.push(`/leads/${lead.id}`)}
          >
            <TableCell className="font-medium text-primary font-mono text-xs">
              {lead.id}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <p className="font-medium text-sm">{lead.name}</p>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-xs">
              <Badge variant="outline" className="font-normal">{lead.project}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${getStatusColor(lead.status)} text-[10px] uppercase px-2 py-0`}>
                  {lead.status}
                </Badge>
                {lead.subStatus && (
                  <Badge variant="outline" className={`${getSubStatusColor(lead.subStatus)} text-[10px] uppercase px-2 py-0`}>
                    {lead.subStatus}
                  </Badge>
                )}
              </div>
            </TableCell>
            {/* We use stopPropagation here so clicking the button doesn't trigger the row's router.push */}
            <TableCell onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/leads/${lead.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => { setSelectedLead(lead); setOpenConfirm(true) }} 
                    className="text-green-600"
                  >
                    <Phone className="h-4 w-4 mr-2" /> Call Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</Card>        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLeads.map((lead) => (
              <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      <p className="font-bold">{lead.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{lead.id}</p>
                    </Link>
                    <Badge variant="secondary" className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2 truncate"><Mail className="h-3 w-3" /> {lead.email}</div>
                    <Badge variant="outline" className="mt-2 text-[10px]">{lead.project}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedLead(lead); setOpenConfirm(true) }}><Phone className="h-3 w-3 mr-2" /> Call</Button>
                    <Button size="sm" variant="outline" className="flex-1" asChild><Link href={`/leads/${lead.id}`}>Details</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showCallInterface && selectedLead && (
          <FloatingCallWidget
            contactName={selectedLead.name}
            onClose={() => setShowCallInterface(false)}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs font-medium">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {openConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Call</h2>
            <p className="text-sm text-muted-foreground mb-6">Initiating call to <b>{selectedLead?.name}</b>. You will receive an incoming call on your device first.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpenConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                setOpenConfirm(false)
                setShowCallInterface(true)
                await fetch('/api/calls/connect', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ leadId: selectedLead?.id })
                })
              }}>Call Now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", project: "", source: "Walk-in" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (res.ok) onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Phone</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Email</label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
      </div>
      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Project</label><Input value={form.project} onChange={e => setForm({...form, project: e.target.value})} /></div>
      <Button type="submit" className="w-full h-10 mt-2" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Lead"}</Button>
    </form>
  )
}

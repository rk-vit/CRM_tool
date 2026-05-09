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
  DialogDescription
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import type { Lead, LeadStatus, SalesExecutive } from "@/lib/types"
import {
  Search,
  Filter,
  Phone,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
  Loader2,
  Users,
  CheckCircle2,
  TrendingUp
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import downloadLeadsCSV from "@/lib/file-download"

const statusFilters: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All Leads" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" }
]

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [executives, setExecutives] = useState<SalesExecutive[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status") as LeadStatus | "all" | null

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">(statusParam || "all")

  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam)
    }
  }, [statusParam])
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = async () => {
    try {
      setLoading(true)
      const [leadsRes, projectsRes, execRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/projects"),
        fetch("/api/admin/users")
      ])

      const leadsData = await leadsRes.json()
      const projectsData = await projectsRes.json()
      const execData = await execRes.json()

      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setExecutives(Array.isArray(execData) ? execData : [])
    } catch (error) {
      console.error("Error fetching admin leads data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      lost: "bg-destructive text-destructive-foreground"
    }
    return colors[status] || "bg-secondary text-secondary-foreground"
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="All Leads" subtitle={`${filteredLeads.length} leads `} />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Leads Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{statusCounts.new || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Won Leads</p>
                <p className="text-2xl font-bold">{statusCounts.won || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {leads.length > 0 ? ((statusCounts.won || 0) / leads.length * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" /> Add New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add Manual Lead</DialogTitle>
                  <DialogDescription>Create a manual entry for walk-in clients.</DialogDescription>
                </DialogHeader>
                <AddLeadForm onSuccess={() => { setAddDialogOpen(false); fetchData() }} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => downloadLeadsCSV(statusFilter)}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as LeadStatus | "all")
            const params = new URLSearchParams(searchParams.toString())
            if (v === "all") {
              params.delete("status")
            } else {
              params.set("status", v)
            }
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
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts[filter.value] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leads Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-accent/50 group cursor-pointer transition-colors" onClick={() => router.push(`/admin/leads/${lead.id}`)}>
                    <TableCell className="font-medium text-primary">
                      <Link href={`/admin/leads/${lead.id}`}>{lead.id}</Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.project}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {(lead.assignedUserNames?.[0] || lead.assignedToName || "U").split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm">{lead.assignedUserNames?.join(", ") || lead.assignedToName || "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.source || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/leads/${lead.id}`}>Edit Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reassign Lead</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
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
      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Email</label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-muted-foreground">Project</label><Input value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} /></div>
      <Button type="submit" className="w-full h-10 mt-2" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Lead"}</Button>
    </form>
  )
}

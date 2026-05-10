"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Header } from "@/components/crm/header"
import { Card } from "@/components/ui/card"
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
import type { Lead, LeadStatus, SalesExecutive } from "@/lib/types"
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
  Loader2,
  Building,
  Globe,
  Users
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
  { value: "reengaged", label: "Re-engaged" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" }
]

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [, setExecutives] = useState<SalesExecutive[]>([])
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
      new: "bg-blue-600 text-white",
      contacted: "bg-purple-600 text-white",
      qualified: "bg-green-600 text-white",
      negotiation: "bg-orange-500 text-white",
      won: "bg-emerald-600 text-white",
      lost: "bg-red-600 text-white"
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
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Header title="All Leads" subtitle={`${filteredLeads.length} leads total`} />

      <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-row items-center gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none h-10 rounded-xl shadow-sm">
                <UserPlus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add Manual Lead</DialogTitle>
                <DialogDescription>Create a manual entry for walk-in clients.</DialogDescription>
              </DialogHeader>
              <AddLeadForm onSuccess={() => { setAddDialogOpen(false); fetchData() }} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-xl bg-white shadow-sm" onClick={() => downloadLeadsCSV(statusFilter)}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>

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
          <TabsList className="w-full h-11 p-1 bg-white border rounded-2xl shadow-sm overflow-x-auto no-scrollbar justify-start flex-nowrap">
            {statusFilters.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="rounded-xl px-3 text-[11px] font-bold h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {filter.label}
                <span className="ml-1.5 opacity-60 font-mono">{statusCounts[filter.value] || 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/20"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-2xl border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Project" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-6">ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Project</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Source</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="w-[50px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer" 
                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  >
                    <TableCell className="pl-6 py-4">
                      <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                        {lead.id}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-slate-900 truncate">{lead.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{lead.phone}</span>
                        <div className="flex flex-col gap-1 mt-1 sm:hidden">
                          <div className="flex items-start gap-1">
                            <Building className="h-2.5 w-2.5 text-slate-300 mt-1 shrink-0" />
                            <span className="text-[10px] text-slate-500 font-medium leading-tight whitespace-normal break-words">{lead.project}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                            <span className="text-[10px] text-slate-500 font-medium truncate">{lead.source || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden sm:table-cell">
                      <div className="flex items-start gap-1.5 max-w-[200px] lg:max-w-[300px]">
                        <Building className="h-3 w-3 text-slate-300 mt-1 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 leading-normal whitespace-normal break-words">
                          {lead.project}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-slate-300" />
                        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">{lead.source || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusColor(lead.status)} border-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/leads/${lead.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reassign</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-slate-200" />
                        <p className="text-sm font-medium text-slate-400">No leads found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLeads.length)} OF {filteredLeads.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl bg-white shadow-sm border-slate-200"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-9 px-4 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-black">{currentPage} / {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl bg-white shadow-sm border-slate-200"
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
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
        <Input 
          className="rounded-xl h-11 border-slate-200 focus-visible:ring-primary/20" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          required 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
          <Input 
            className="rounded-xl h-11 border-slate-200 focus-visible:ring-primary/20" 
            value={form.phone} 
            onChange={e => setForm({ ...form, phone: e.target.value })} 
            required 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
          <Input 
            className="rounded-xl h-11 border-slate-200 focus-visible:ring-primary/20" 
            type="email" 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project</label>
        <Input 
          className="rounded-xl h-11 border-slate-200 focus-visible:ring-primary/20" 
          value={form.project} 
          onChange={e => setForm({ ...form, project: e.target.value })} 
        />
      </div>
      <Button type="submit" className="w-full h-12 mt-2 rounded-2xl font-black text-base shadow-lg shadow-primary/20" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Lead"}
      </Button>
    </form>
  )
}
"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { leads, projects, salesExecutives } from "@/lib/mock-data"
import type { LeadStatus } from "@/lib/types"
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

const statusFilters: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" }
]

export default function AdminLeadsPage() {
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
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesProject = projectFilter === "all" || lead.project === projectFilter
      const matchesAssignee = assigneeFilter === "all" || lead.assignedTo === assigneeFilter

      return matchesSearch && matchesStatus && matchesProject && matchesAssignee
    })
  }, [searchQuery, statusFilter, projectFilter, assigneeFilter])

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
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-chart-1 text-white",
      contacted: "bg-chart-2 text-white",
      qualified: "bg-success text-success-foreground",
      negotiation: "bg-warning text-warning-foreground",
      won: "bg-chart-2 text-white",
      lost: "bg-destructive text-destructive-foreground"
    }
    return colors[status] || "bg-secondary text-secondary-foreground"
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="All Leads" subtitle={`${filteredLeads.length} total leads`} />

      <div className="flex-1 p-4 md:p-6 space-y-4">
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
          <div className="flex gap-2 flex-wrap">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[150px]">
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
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {salesExecutives.map((exec) => (
                  <SelectItem key={exec.id} value={exec.id}>{exec.name}</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Project</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium text-primary">
                      <Link href={`/admin/leads/${lead.id}`}>{lead.id}</Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{lead.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">{lead.project}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.assignedToName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
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
                            <Link href={`/admin/leads/${lead.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reassign Lead</DropdownMenuItem>
                          <DropdownMenuItem>View Timeline</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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

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
import { leads, projects } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import type { LeadStatus } from "@/lib/types"
import {
  Search,
  Filter,
  Phone,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Grid,
  List
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

const statusFilters: { value: LeadStatus | "all"; label: string; count: number }[] = [
  { value: "all", label: "All Leads", count: 0 },
  { value: "new", label: "New", count: 0 },
  { value: "contacted", label: "Contacted", count: 0 },
  { value: "qualified", label: "Qualified", count: 0 },
  { value: "negotiation", label: "Negotiation", count: 0 },
  { value: "won", label: "Won", count: 0 },
  { value: "lost", label: "Lost", count: 0 }
]

export default function LeadsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status") as LeadStatus | "all" | null
  
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">(statusParam || "all")

  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam)
    }
  }, [statusParam])
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const myLeads = leads.filter(l => l.assignedTo === user?.id)

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesProject = projectFilter === "all" || lead.project === projectFilter

      return matchesSearch && matchesStatus && matchesProject
    })
  }, [myLeads, searchQuery, statusFilter, projectFilter])

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLeads.slice(start, start + itemsPerPage)
  }, [filteredLeads, currentPage])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

  // Update status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: myLeads.length }
    myLeads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1
    })
    return counts
  }, [myLeads])

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

  const getSubStatusColor = (subStatus: string) => {
    const colors: Record<string, string> = {
      hot: "bg-destructive/10 text-destructive border-destructive/20",
      warm: "bg-warning/10 text-warning border-warning/20",
      cold: "bg-chart-1/10 text-chart-1 border-chart-1/20"
    }
    return colors[subStatus] || ""
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Leads" subtitle={`${filteredLeads.length} leads assigned to you`} />

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
            <div className="hidden md:flex border rounded-lg">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Display */}
        {viewMode === "list" ? (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Project</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-medium text-primary">
                        <Link href={`/leads/${lead.id}`}>{lead.id}</Link>
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
                      <TableCell className="hidden md:table-cell">{lead.medium}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getSubStatusColor(lead.subStatus)}`}>
                            {lead.subStatus}
                          </Badge>
                        </div>
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
                              <Link href={`/leads/${lead.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" /> Call
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" /> Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-sm text-primary">{lead.id}</p>
                      </div>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{lead.phone}</p>
                      <p className="truncate">{lead.email}</p>
                      <Badge variant="outline">{lead.project}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-4 w-4 mr-1" /> Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="h-4 w-4 mr-1" /> Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

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

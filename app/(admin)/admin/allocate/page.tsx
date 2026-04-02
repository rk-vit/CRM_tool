"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  UserPlus,
  Users,
  CheckCircle,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Lead, SalesExecutive } from "@/lib/types"

export default function AllocatePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [executives, setExecutives] = useState<SalesExecutive[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedExecutive, setSelectedExecutive] = useState<string>("")

  const fetchAllocationData = async () => {
    try {
      setLoading(true)
      const [leadsRes, execsRes, projectsRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/admin/users"),
        fetch("/api/projects")
      ])
      const leadsData = await leadsRes.json()
      const execsData = await execsRes.json()
      const projectsData = await projectsRes.json()

      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setExecutives(Array.isArray(execsData) ? execsData : [])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
    } catch (error) {
      console.error("Error fetching allocation data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllocationData()
  }, [])

  // Show only unassigned leads or new leads
  const unassignedLeads = leads.filter(l => !l.assignedTo || l.status === "new")

  const filteredLeads = useMemo(() => {
    return unassignedLeads.filter((lead) => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesProject = projectFilter === "all" || lead.project === projectFilter

      return matchesSearch && matchesStatus && matchesProject
    })
  }, [unassignedLeads, searchQuery, statusFilter, projectFilter])

  const toggleLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const toggleAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id))
    }
  }

  const handleAllocate = async () => {
    if (!selectedExecutive || selectedLeads.length === 0) return
    
    try {
      // Basic implementation for bulk assign - calling patch for each
      // In a real app, a bulk update API endpoint is better
      await Promise.all(
        selectedLeads.map(id => 
          fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedTo: selectedExecutive })
          })
        )
      )

      const exec = executives.find(e => e.id === selectedExecutive)
      toast.success(`${selectedLeads.length} leads allocated to ${exec?.name}`)
      setSelectedLeads([])
      setSelectedExecutive("")
      // Refresh data
      fetchAllocationData()
    } catch (error) {
      console.error("Allocation failed", error)
      toast.error("Failed to allocate leads")
    }
  }

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

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Lead Allocation" subtitle="Assign leads to your team" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Team Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {executives.map((exec) => (
            <Card 
              key={exec.id} 
              className={`border-0 shadow-sm cursor-pointer transition-all ${
                selectedExecutive === exec.id 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setSelectedExecutive(exec.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {exec.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{exec.name}</p>
                    <p className="text-xs text-muted-foreground">{exec.leadsAssigned} leads assigned</p>
                  </div>
                  {selectedExecutive === exec.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Allocation Action Bar */}
        {selectedLeads.length > 0 && (
          <Card className="border-0 shadow-sm bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {selectedLeads.length}
                  </Badge>
                  <span className="font-medium">leads selected</span>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                    <SelectTrigger className="w-[200px] bg-primary-foreground text-primary">
                      <SelectValue placeholder="Select executive" />
                    </SelectTrigger>
                    <SelectContent>
                      {executives.map((exec) => (
                        <SelectItem key={exec.id} value={exec.id}>
                          {exec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="secondary" 
                    onClick={handleAllocate}
                    disabled={!selectedExecutive}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Allocate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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

        {/* Leads Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Unassigned Leads</CardTitle>
              <Badge variant="outline">{filteredLeads.length} leads</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Project</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No unassigned leads found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedLeads.includes(lead.id) ? "bg-primary/5" : "hover:bg-accent/50"
                        }`}
                        onClick={() => toggleLead(lead.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-primary">{lead.id}</TableCell>
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
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/crm/header"
import { StatsCard } from "@/components/crm/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter} from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import {
  Users,
  UserPlus,
  Calendar,
  AlertCircle,
  TrendingUp,
  Building,
  CheckCircle2,
  Phone,
  Clock,
  ArrowRight,
  Loader2,
  PieChart,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Lead, TimelineEvent, DashboardStats, SalesExecutive } from "@/lib/types"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [executives, setExecutives] = useState<SalesExecutive[]>([])
  const [recentTimeline, setRecentTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [statsRes, leadsRes, execRes, timelineRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/leads?limit=5"),
          fetch("/api/admin/users"),
          fetch("/api/timeline?limit=5")
        ])
        
        const statsData = await statsRes.json()
        const leadsData = await leadsRes.json()
        const execData = await execRes.json()
        const timelineData = await timelineRes.json()
        
        setStats(statsData)
        setLeads(Array.isArray(leadsData) ? leadsData : [])
        setExecutives(Array.isArray(execData) ? execData : [])
        setRecentTimeline(Array.isArray(timelineData) ? timelineData : [])
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Admin Overview" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatsCard
    title="New Leads"
    value={stats?.newLeads || 0}
    icon={UserPlus}
    variant="primary"
  />
  <StatsCard
    title="Today Follow-up"
    value={stats?.todayFollowUp || 0}
    icon={Calendar}
    variant="warning"
  />
  <StatsCard
    title="Missed Follow-up"
    value={stats?.missedFollowUp || 0}
    icon={AlertCircle}
    variant="destructive"
  />
  <StatsCard
    title="Booked"
    value={stats?.booked || 0}
    icon={CheckCircle2}
    variant="success"
  />
</div>

{/* Stats Grid — Row 2 */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatsCard
    title="Re-Engaged"
    value={stats?.reEngaged || 0}
    icon={TrendingUp}
    onClick={() => window.location.href = `/admin/leads?status=reengaged`}
  />
  <StatsCard
    title="Today Leads"
    value={stats?.todayLeads || 0}
    icon={Users}
  />
  <StatsCard
    title="Site Visits"
    value={stats?.siteVisitCompleted || 0}
    icon={Building}
  />
  <StatsCard
    title="Active Executives"
    value={stats?.totalSales || 0}
    icon={Users}
    variant="warning"
    onClick={() => window.location.href = `/admin/team`}
  />
</div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Leads */}
          <Card className="md:col-span-2 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Latest Leads Across Team</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/leads" className="text-primary">
                  Manage Leads <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left py-2 font-medium">Lead Name</th>
                      <th className="text-left py-2 font-medium">Project</th>
                      <th className="text-left py-2 font-medium">Assigned To</th>
                      <th className="text-left py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors" onClick={() => router.push(`admin/leads/${lead.id}`)}>
                        <td className="py-3">
                            {lead.name}
                        </td>
                        <td className="py-3 text-muted-foreground">{lead.project}</td>
                        <td className="py-3">
                          <Badge variant="secondary" className="font-normal">
                            {lead.assignedToName || "Unassigned"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No leads found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {executives.map((exec) => (
                <div key={exec.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{exec.name}</span>
                    <span className="text-muted-foreground">{exec.leadsConverted} / {exec.leadsAssigned}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${exec.conversionRate}%` }}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/team">View Team Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Activity */}
        <div className="grid md:grid-cols-2 gap-6">
           {/* Recent Activity */}
           <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">System Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTimeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        event.type === "call" ? "bg-green-500" :
                        event.type === "email" ? "bg-blue-500" :
                        event.type === "status_change" ? "bg-orange-500" :
                        "bg-muted-foreground"
                      }`} />
                      {index < recentTimeline.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.title}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal text-muted-foreground">
                        {event.leadId}
                        </Badge>
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          {event.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {event.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5" /> Leads by Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] flex items-center justify-center border-2 border-dashed rounded-xl">
                 <p className="text-sm text-muted-foreground italic">Project chart will be live after more data is added</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
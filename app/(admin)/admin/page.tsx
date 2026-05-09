"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/crm/header"
import { StatsCard } from "@/components/crm/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
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
  Clock,
  ArrowRight,
  Loader2,
  PieChart,
  BarChart3,
  Phone
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Lead, TimelineEvent, DashboardStats, SalesExecutive } from "@/lib/types"


export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = new Date().toISOString().split("T")[0];
  const [stats, setStats] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [executives, setExecutives] = useState<SalesExecutive[]>([])
  const [recentTimeline, setRecentTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = new Date().toISOString().split("T")[0];
  const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [statsRes, leadsRes, execRes, timelineRes, allLeadsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/leads"),
          fetch("/api/admin/users"),
          fetch("/api/timeline?limit=5"),
          fetch("/api/leads")
        ])

        const statsData = await statsRes.json()
        const leadsData = await leadsRes.json()
        const execData = await execRes.json()
        const timelineData = await timelineRes.json()
        const allLeadsData = await allLeadsRes.json()

        setStats(statsData)
        setLeads(Array.isArray(leadsData) ? leadsData : [])
        setAllLeads(Array.isArray(allLeadsData) ? allLeadsData : [])
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
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
      <Header title="Admin Overview" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />

      <div className="flex-1 p-3 md:p-6 space-y-5 md:space-y-6 max-w-full overflow-x-hidden min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
          <StatsCard
            title="New Leads"
            value={stats?.newLeads || 0}
            icon={UserPlus}
            variant="primary"
            onClick={() => router.push("/admin/leads?status=new")}
          />
          <StatsCard
            title="Today Follow-up"
            value={stats?.todayFollowUp || 0}
            icon={Calendar}
            variant="warning"
            onClick={() => scrollToSection("today-follow")}
            onClick={() => scrollToSection("today-follow")}
          />
          <StatsCard
            title="Missed Follow-up"
            value={stats?.missedFollowUp || 0}
            icon={AlertCircle}
            variant="destructive"
            onClick={() => scrollToSection("missed-follow")}
          />
          <StatsCard
            title="Booked"
            value={stats?.booked || 0}
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
          <StatsCard
            title="Re-Engaged"
            value={stats?.reEngaged || 0}
            icon={TrendingUp}
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
          />
        </div>

        <div className="flex flex-col gap-6 w-full min-w-0 [&>*]:min-w-0">
          <Card className="col-span-1 md:col-span-2 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Latest Leads Across Team</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/leads" className="text-primary">
                  Manage Leads <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-lg w-full max-w-full">
                <table className="min-w-0 w-full text-xs md:text-sm table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[25%]" />
                    <col className="w-[20%]" />
                    <col className="w-[15%]" />
                    <col className="hidden md:table-column w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-muted-foreground border-b text-xs">
                      <th className="text-left py-2 font-medium pr-3">Lead Name</th>
                      <th className="text-left py-2 font-medium pr-3">Project</th>
                      <th className="text-left py-2 font-medium pr-3">Assigned</th>
                      <th className="text-left py-2 font-medium pr-3">Source</th>
                      <th className="hidden md:table-cell text-right py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
                        onClick={() => router.push(`admin/leads/${lead.id}`)}
                      >
                        <td className="py-2 md:py-3 pr-3 truncate overflow-hidden max-w-0">
                          {lead.name}
                        </td> 
                        <td className="py-2 md:py-3 pr-3 truncate overflow-hidden max-w-0 text-muted-foreground">
                          {lead.project}
                        </td>
                        <td className="py-2 md:py-3 pr-3 overflow-hidden max-w-0">
                          <Badge className="font-normal text-[10px] md:text-xs px-1.5 py-0.5 truncate max-w-full block">
                            {lead.assignedUserNames?.join(", ") || lead.assignedToName || "Unassigned"}
                          </Badge>
                        </td>
                        <td className="py-2 md:py-3 pr-3 text-muted-foreground truncate overflow-hidden max-w-0">
                          {lead.source || "—"}
                        </td>
                        <td className="hidden md:table-cell py-2 md:py-3 text-right">
                          <Badge className={`${getStatusColor(lead.status)} text-[10px] md:text-xs px-1.5 md:px-2 py-0.5`}>
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

          <Card className="col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 truncate">
                <BarChart3 className="h-5 w-5 shrink-0" /> Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {executives.map((exec) => (
                <div key={exec.id} className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between text-sm gap-2 min-w-0">
                    <span className="font-medium truncate min-w-0">{exec.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {exec.leadsConverted} / {exec.leadsAssigned}
                    </span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0 [&>*]:min-w-0">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">System Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTimeline.map((event, index) => (
                  <div key={event.id} className="flex gap-2 md:gap-3">
                    <div className="relative flex flex-col items-center shrink-0">
                      <div
                        className={`h-2 w-2 rounded-full ${event.type === "call"
                            ? "bg-green-500"
                            : event.type === "email"
                              ? "bg-blue-500"
                              : event.type === "status_change"
                                ? "bg-orange-500"
                                : "bg-muted-foreground"
                          }`}
                      />
                      {index < recentTimeline.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-sm font-medium truncate min-w-0">
                          {event.title}
                        </p>
                        <Badge className="text-[10px] px-1.5 shrink-0">
                          {event.leadId}
                        </Badge>
                      </div>
                      <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {event.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(event.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card id="today-follow" className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Today&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.filter(l => l.followUpDate?.startsWith(todayString)).slice(0, 6).map((lead) => (
                <Link
                  href={`/leads/${lead.id}`}
                  key={lead.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    Don't show phone number as of now
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                   
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4" />
                    </Link>
                  </Button>
                 
                </Link>
              ))}
              {leads.filter(l => l.followUpDate?.startsWith(todayString)).length === 0 && (
                <p className="col-span-full text-center py-4 text-sm text-muted-foreground">No follow-ups scheduled for today.</p>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Today's Follow-ups */}
        <Card id="today-follow" className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Today&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLeads.filter(l => l.followUpDate?.startsWith(todayString)).slice(0, 6).map((lead) => (
                <Link
                  href={`/admin/leads/${lead.id}`}
                  key={lead.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {lead.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.project}</p>
                  </div>
                  <Badge className="text-[10px] shrink-0">
                    {lead.assignedUserNames?.join(", ") || lead.assignedToName || "Unassigned"}
                  </Badge>
                </Link>
              ))}
              {allLeads.filter(l => l.followUpDate?.startsWith(todayString)).length === 0 && (
                <p className="col-span-full text-center py-4 text-sm text-muted-foreground">No follow-ups scheduled for today.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Missed Follow Ups */}
        <Card id="missed-follow" className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Missed Follow Ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLeads
                .filter(l => {
                  if (!l.followUpDate) return false;
                  const followUp = new Date(l.followUpDate);
                  return followUp < today;
                })
                .slice(0, 6)
                .map((lead) => (
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    key={lead.id}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {lead.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.project}</p>
                    </div>
                    <Badge className="text-[10px] shrink-0">
                      {lead.assignedUserNames?.join(", ") || lead.assignedToName || "Unassigned"}
                    </Badge>
                  </Link>
                ))}
              {allLeads.filter(l => {
                if (!l.followUpDate) return false;
                const followUp = new Date(l.followUpDate);
                return followUp < today;
              }).length === 0 && (
                <p className="col-span-full text-center py-4 text-sm text-muted-foreground">No missed follow-ups.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
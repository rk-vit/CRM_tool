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
  BarChart3,
  ChevronRight,
  Activity,
  Globe,
  User
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Lead, TimelineEvent, SalesExecutive } from "@/lib/types"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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
      new: "bg-blue-500/10 text-blue-600 border-blue-200",
      contacted: "bg-purple-500/10 text-purple-600 border-purple-200",
      qualified: "bg-green-500/10 text-green-600 border-green-200",
      negotiation: "bg-orange-500/10 text-orange-600 border-orange-200",
      won: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      lost: "bg-red-500/10 text-red-600 border-red-200"
    }
    return colors[status] || "bg-slate-100 text-slate-600 border-slate-200"
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/80" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 overflow-x-hidden w-full">
      <Header title="Admin Overview" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />

      <div className="flex-1 p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* STATS SECTION */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard title="Re-Engaged" value={stats?.reEngaged || 0} icon={TrendingUp} />
            <StatsCard title="Today Leads" value={stats?.todayLeads || 0} icon={Users} />
            <StatsCard title="Site Visits" value={stats?.siteVisitCompleted || 0} icon={Building} />
            <StatsCard title="Active Executives" value={stats?.totalSales || 0} icon={Users} variant="warning" />
          </div>
        </div>

        {/* FOLLOW UPS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Today's Follow-ups */}
          <Card id="today-follow" className="border-0 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200/60">
            <CardHeader className="bg-white pb-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2.5 text-slate-800">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  Today's Schedule
                </CardTitle>
                <Badge variant="outline" className="bg-amber-50/50 text-amber-700 border-amber-100 font-bold px-3">
                  {allLeads.filter(l => l.followUpDate?.startsWith(todayString)).length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {allLeads.filter(l => l.followUpDate?.startsWith(todayString)).slice(0, 6).map((lead) => (
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    key={lead.id}
                    className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all group min-w-0"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                      {lead.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">{lead.name}</p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{lead.project}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                         <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 font-semibold bg-slate-100 text-slate-600 truncate max-w-[100px]">
                           {lead.assignedUserNames?.join(", ") || "Unassigned"}
                         </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
                {allLeads.filter(l => l.followUpDate?.startsWith(todayString)).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">All caught up for today!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Missed Follow Ups */}
          <Card id="missed-follow" className="border-0 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200/60">
            <CardHeader className="bg-white pb-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2.5 text-slate-800">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  Missed Actions
                </CardTitle>
                <Badge variant="destructive" className="font-bold px-3">
                  {allLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < today).length} Overdue
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {allLeads
                  .filter(l => l.followUpDate && new Date(l.followUpDate) < today)
                  .slice(0, 6)
                  .map((lead) => (
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      key={lead.id}
                      className="flex items-center gap-4 p-5 hover:bg-red-50/30 transition-all group min-w-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold text-sm shadow-sm border border-red-100 group-hover:scale-110 transition-transform">
                        {lead.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate group-hover:text-red-600 transition-colors">{lead.name}</p>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{lead.project}</p>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1.5">Action Overdue</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                {allLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < today).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <TrendingUp className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No overdue tasks!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RECENT LEADS & PERFORMANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-0 shadow-md rounded-2xl bg-white ring-1 ring-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-slate-50">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">Latest Leads</CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time team performance</p>
              </div>
              <Button variant="outline" size="sm" asChild className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-slate-50 shadow-sm transition-all">
                <Link href="/admin/leads" className="flex items-center gap-2">
                  Explore All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-50 text-[11px] font-bold uppercase tracking-widest bg-slate-50/30">
                      <th className="text-left px-6 py-4 font-bold w-[25%]">Lead Profile</th>
                      <th className="text-left px-6 py-4 font-bold w-[25%]">Project</th>
                      <th className="text-left px-6 py-4 font-bold w-[20%]">Source</th>
                      <th className="text-left px-6 py-4 font-bold w-[20%]">Assigned To</th>
                      <th className="text-right px-6 py-4 font-bold w-[10%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                        onClick={() => router.push(`admin/leads/${lead.id}`)}
                      >
                        <td className="px-6 py-4 truncate font-bold text-slate-700 group-hover:text-primary transition-colors">
                          <div className="flex flex-col">
                            <span className="truncate">{lead.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight font-medium">#{lead.id}</span>
                          </div>
                        </td> 
                        <td className="px-6 py-4 truncate text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3 w-3 text-slate-300 shrink-0" />
                            <span className="truncate">{lead.project}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 truncate">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3 text-slate-300 shrink-0" />
                            <span className="text-xs font-medium text-slate-500">{lead.source || "Direct"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 truncate">
                           <div className="flex items-center gap-2">
                             <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200 shrink-0">
                               {(lead.assignedUserNames?.[0] || "U")[0]}
                             </div>
                             <span className="text-xs font-semibold text-slate-600 truncate">
                               {lead.assignedUserNames?.join(", ") || "Unassigned"}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge className={`${getStatusColor(lead.status)} border text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-tighter rounded-full shadow-sm`}>
                            {lead.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-2xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary-foreground shrink-0" />
                </div>
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 space-y-6">
              {executives.map((exec) => (
                <div key={exec.id} className="space-y-2.5 group">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-100 truncate group-hover:text-primary transition-colors">{exec.name}</span>
                    <Badge className="bg-white/10 text-white border-0 font-mono text-[11px]">
                      {exec.leadsConverted} <span className="mx-1 opacity-40">/</span> {exec.leadsAssigned}
                    </Badge>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-out" 
                      style={{ width: `${exec.conversionRate}%` }} 
                    />
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="lg" className="w-full mt-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border-0 text-white transition-all shadow-lg" asChild>
                <Link href="/admin/team" className="flex items-center justify-center gap-2">
                  Full Team Analytics <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SYSTEM ACTIVITY */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-5 bg-white border-b border-slate-50">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2.5 text-slate-800">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Activity className="h-5 w-5 text-slate-400" />
                  </div>
                  Live Feed
                </CardTitle>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Active</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-8 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-100" />
                {recentTimeline.map((event, index) => (
                    <div key={event.id} className="flex gap-6 relative">
                    <div className="relative flex flex-col items-center shrink-0 z-10">
                        <div className={`h-[22px] w-[22px] rounded-full border-4 border-white shadow-sm ${
                            event.type === "call" ? "bg-green-500" : 
                            event.type === "email" ? "bg-blue-500" : 
                            event.type === "status_change" ? "bg-orange-500" : "bg-slate-400"
                        }`} />
                    </div>
                    <div className="flex-1 pb-1 min-w-0 bg-slate-50/40 p-4 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <p className="text-sm font-bold text-slate-800 truncate">{event.title}</p>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-white text-slate-400 border-slate-200 w-fit">
                            ID: {event.leadId}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{event.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true }).toUpperCase()}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
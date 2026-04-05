"use client"
 
import { useState, useEffect } from "react"
import { Header } from "@/components/crm/header"
import { StatsCard } from "@/components/crm/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Loader2
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Lead, TimelineEvent, DashboardStats } from "@/lib/types"
import { useRouter } from "next/navigation"
const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayString = new Date().toISOString().split("T")[0];
export default function SalesDashboard() {
  const router = useRouter();
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [myLeads, setMyLeads] = useState<Lead[]>([])
  const [recentTimeline, setRecentTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return
      
      try {
        setLoading(true)
        const [statsRes, leadsRes, timelineRes] = await Promise.all([
          fetch(`/api/dashboard/stats?assignedTo=${user.id}`),
          fetch(`/api/leads?assignedTo=${user.id}&limit=5`),
          fetch(`/api/timeline?limit=5`)
        ])
        
        const statsData = await statsRes.json()
        const leadsData = await leadsRes.json()
        const timelineData = await timelineRes.json()
        
        setStats(statsData)
        setMyLeads(Array.isArray(leadsData) ? leadsData : [])
        setRecentTimeline(Array.isArray(timelineData) ? timelineData : [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
 
    fetchData()
  }, [user?.id])
 
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
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />
      
      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
        {/* Stats Grid — 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

        {/* Second Row Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gap-4">
          <StatsCard
            title="Re-Engaged"
            value={stats?.reEngaged || 0}
             onClick={() => router.push("/leads?status=reengaged")}

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
            title="All Leads"
            value={stats?.allLeads || 0}
            icon={Users}
          />
        </div>
 
        {/* Main Content Grid — stacked on mobile, side-by-side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Leads */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">My Recent Leads</CardTitle>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/leads" className="text-primary">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 sm:px-6 sm:pb-6">
              {myLeads.slice(0, 7).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{lead.name}</p>
                      <Badge variant="outline" className="font-normal text-[10px] h-4 px-1.5 text-muted-foreground shrink-0">
                        {lead.id}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{lead.project}</p>
                  </div>
                  <Badge className={`${getStatusColor(lead.status)} shrink-0 text-xs`}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
              {myLeads.length === 0 && (
                <p className="text-center py-4 text-sm text-muted-foreground">No recent leads found.</p>
              )}
            </CardContent>
          </Card>
 
          {/* Recent Activity */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-4">
                {recentTimeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${
                        event.type === "call" ? "bg-green-500" :
                        event.type === "email" ? "bg-blue-500" :
                        event.type === "status_change" ? "bg-orange-500" :
                        "bg-muted-foreground"
                      }`} />
                      {index < recentTimeline.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal text-muted-foreground">
                        {event.leadId}
                      </Badge>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentTimeline.length === 0 && (
                  <p className="text-center py-4 text-sm text-muted-foreground">No recent activity found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        

        {/* Today's Schedule */}
        <Card id= "today-follow" className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Today&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLeads.filter(l => l.followUpDate?.startsWith(todayString)).slice(0, 6).map((lead) => (
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
                    {/*Don't show phone number as of now
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    */}
                  </div>
                  {/*Don't show call button as of now
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4" />
                    </Link>
                  </Button>
                  */}
                </Link>
              ))}
              {myLeads.filter(l => l.followUpDate).length === 0 && (
                <p className="col-span-full text-center py-4 text-sm text-muted-foreground">No follow-ups scheduled for today.</p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Missed Follow Ups */}
        <Card id="missed-follow" className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Missed Follow Ups&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLeads
                .filter(l => {
                  if (!l.followUpDate) return false;

                  const followUp = new Date(l.followUpDate);
                  return followUp < today;
                })
                .slice(0, 6)
                .map((lead) => (
                <Link
                  href={`/leads/${lead.id}`}
                  key={lead.id}
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                  </div>
                </Link>
              ))}
              {myLeads.filter(l => l.followUpDate).length === 0 && (
                <p className="col-span-full text-center py-4 text-sm text-muted-foreground">No follow-ups scheduled for today.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
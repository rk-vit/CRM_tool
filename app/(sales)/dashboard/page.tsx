"use client"

import { Header } from "@/components/crm/header"
import { StatsCard } from "@/components/crm/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { dashboardStats, leads, timelineEvents } from "@/lib/mock-data"
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
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function SalesDashboard() {
  const { user } = useAuth()
  const myLeads = leads.filter(l => l.assignedTo === user?.id)
  const recentTimeline = timelineEvents.slice(0, 5)

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
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="New Leads"
            value={dashboardStats.newLeads}
            icon={UserPlus}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Today Follow-up"
            value={dashboardStats.todayFollowUp}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Missed Follow-up"
            value={dashboardStats.missedFollowUp}
            icon={AlertCircle}
            variant="destructive"
          />
          <StatsCard
            title="Booked"
            value={dashboardStats.booked}
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard
            title="Re-Engaged"
            value={dashboardStats.reEngaged}
            icon={TrendingUp}
          />
          <StatsCard
            title="Today Leads"
            value={dashboardStats.todayLeads}
            icon={Users}
          />
          <StatsCard
            title="Site Visits"
            value={dashboardStats.siteVisitCompleted}
            icon={Building}
          />
          <StatsCard
            title="All Leads"
            value={dashboardStats.allLeads}
            icon={Users}
          />
          <StatsCard
            title="Total Calls"
            value={234}
            icon={Phone}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">My Recent Leads</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/leads" className="text-primary">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {myLeads.slice(0, 5).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <Badge variant="outline" className="text-xs">{lead.id}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{lead.project}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTimeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        event.type === "call" ? "bg-success" :
                        event.type === "email" ? "bg-chart-1" :
                        event.type === "status_change" ? "bg-warning" :
                        "bg-muted-foreground"
                      }`} />
                      {index < recentTimeline.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Today&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLeads.filter(l => l.followUpDate).slice(0, 3).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

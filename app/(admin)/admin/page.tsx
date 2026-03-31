"use client"

import { Header } from "@/components/crm/header"
import { StatsCard } from "@/components/crm/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { dashboardStats, leads, salesExecutives, timelineEvents } from "@/lib/mock-data"
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
  ArrowRight,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function AdminDashboard() {
  const { user } = useAuth()

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
      <Header title="Admin Dashboard" subtitle={`Welcome back, ${user?.name?.split(" ")[0]}`} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Leads"
            value={dashboardStats.allLeads}
            icon={Users}
            variant="primary"
            trend={{ value: 8, isPositive: true }}
            onClick={() => window.location.href = `/admin/leads`}
          />
          <StatsCard
            title="New Today"
            value={dashboardStats.todayLeads}
            icon={UserPlus}
            onClick={() => window.location.href = `/leads`}
          />
          <StatsCard
            title="Pending Follow-ups"
            value={dashboardStats.missedFollowUp}
            icon={AlertCircle}
            variant="warning"
          />
          <StatsCard
            title="Conversions"
            value={dashboardStats.booked}
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Team Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Team Performance</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/team" className="text-primary">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesExecutives.map((exec) => (
                <div key={exec.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {exec.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{exec.name}</p>
                      <span className="text-sm text-muted-foreground">{exec.conversionRate}%</span>
                    </div>
                    <Progress value={exec.conversionRate} className="h-2" />
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{exec.leadsAssigned}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{exec.leadsConverted}</p>
                      <p className="text-xs text-muted-foreground">Converted</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{exec.totalCalls}</p>
                      <p className="text-xs text-muted-foreground">Calls</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lead Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Lead Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "New", count: leads.filter(l => l.status === "new").length, color: "bg-chart-1" },
                  { label: "Contacted", count: leads.filter(l => l.status === "contacted").length, color: "bg-chart-2" },
                  { label: "Qualified", count: leads.filter(l => l.status === "qualified").length, color: "bg-success" },
                  { label: "Negotiation", count: leads.filter(l => l.status === "negotiation").length, color: "bg-warning" },
                  { label: "Won", count: leads.filter(l => l.status === "won").length, color: "bg-primary" },
                  { label: "Lost", count: leads.filter(l => l.status === "lost").length, color: "bg-destructive" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {Math.round((item.count / leads.length) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Badge variant="outline">{timelineEvents.length} events</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {timelineEvents.slice(0, 6).map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        event.type === "call" ? "bg-success" :
                        event.type === "email" ? "bg-chart-1" :
                        event.type === "status_change" ? "bg-warning" :
                        "bg-muted-foreground"
                      }`} />
                      {index < 5 && (
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

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/admin/allocate">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserPlus className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Allocate Leads</p>
                  <p className="text-sm text-muted-foreground">Assign leads to team</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/analytics">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:bg-chart-2 transition-colors">
                  <BarChart3 className="h-6 w-6 text-chart-2 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Performance reports</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/calls">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success transition-colors">
                  <Phone className="h-6 w-6 text-success group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">Call Logs</p>
                  <p className="text-sm text-muted-foreground">Monitor calls</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

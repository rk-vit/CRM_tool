"use client"

import { Header } from "@/components/crm/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { leads, salesExecutives, callLogs, projects } from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts"

export default function AnalyticsPage() {
  // Lead source distribution
  const sourceData = [
    { name: "Google Ads", value: leads.filter(l => l.source === "google_ads").length },
    { name: "Facebook", value: leads.filter(l => l.source === "facebook").length },
    { name: "Website", value: leads.filter(l => l.source === "website").length },
    { name: "Referral", value: leads.filter(l => l.source === "referral").length },
    { name: "99 Acres", value: leads.filter(l => l.source === "99acres").length },
    { name: "MagicBricks", value: leads.filter(l => l.source === "magicbricks").length }
  ]

  // Team performance data
  const teamData = salesExecutives.map(exec => ({
    name: exec.name.split(" ")[0],
    leads: exec.leadsAssigned,
    converted: exec.leadsConverted,
    calls: exec.totalCalls
  }))

  // Status distribution
  const statusData = [
    { name: "New", value: leads.filter(l => l.status === "new").length, color: "#3b82f6" },
    { name: "Contacted", value: leads.filter(l => l.status === "contacted").length, color: "#10b981" },
    { name: "Qualified", value: leads.filter(l => l.status === "qualified").length, color: "#22c55e" },
    { name: "Negotiation", value: leads.filter(l => l.status === "negotiation").length, color: "#f59e0b" },
    { name: "Won", value: leads.filter(l => l.status === "won").length, color: "#8b5cf6" },
    { name: "Lost", value: leads.filter(l => l.status === "lost").length, color: "#ef4444" }
  ]

  // Project performance
  const projectData = projects.map(project => ({
    name: project.split(" ").slice(0, 2).join(" "),
    leads: leads.filter(l => l.project === project).length,
    converted: leads.filter(l => l.project === project && l.status === "won").length
  }))

  // Weekly trend data (simulated)
  const trendData = [
    { week: "Week 1", leads: 45, calls: 120, conversions: 5 },
    { week: "Week 2", leads: 52, calls: 145, conversions: 7 },
    { week: "Week 3", leads: 48, calls: 132, conversions: 6 },
    { week: "Week 4", leads: 61, calls: 178, conversions: 9 }
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Analytics" subtitle="Performance metrics and insights" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-3xl font-bold text-primary">
                {Math.round((leads.filter(l => l.status === "won").length / leads.length) * 100)}%
              </p>
              <Progress value={14} className="mt-2 h-1" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold text-success">2.4h</p>
              <p className="text-xs text-muted-foreground mt-1">-12% from last week</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-3xl font-bold">{salesExecutives.reduce((a, b) => a + b.totalCalls, 0)}</p>
              <p className="text-xs text-success mt-1">+8% from last week</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Call Success Rate</p>
              <p className="text-3xl font-bold">
                {Math.round((callLogs.filter(c => c.status === "answered").length / callLogs.length) * 100)}%
              </p>
              <Progress value={75} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weekly Trends */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                        <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                        <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status Distribution */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Team Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="leads" fill="#3b82f6" name="Leads Assigned" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="converted" fill="#22c55e" name="Converted" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="calls" fill="#f59e0b" name="Total Calls" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Individual Performance Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {salesExecutives.map((exec) => (
                <Card key={exec.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {exec.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold">{exec.name}</p>
                        <p className="text-xs text-muted-foreground">Sales Executive</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-semibold">{exec.conversionRate}%</span>
                      </div>
                      <Progress value={exec.conversionRate} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="text-center">
                          <p className="font-bold">{exec.leadsAssigned}</p>
                          <p className="text-xs text-muted-foreground">Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-success">{exec.leadsConverted}</p>
                          <p className="text-xs text-muted-foreground">Won</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{exec.totalCalls}</p>
                          <p className="text-xs text-muted-foreground">Calls</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Source Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sourceData.map((source, index) => (
                      <div key={source.name} className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="flex-1 text-sm">{source.name}</span>
                        <Badge variant="secondary">{source.value} leads</Badge>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round((source.value / leads.length) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Project Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="leads" fill="#3b82f6" name="Total Leads" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="converted" fill="#22c55e" name="Converted" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

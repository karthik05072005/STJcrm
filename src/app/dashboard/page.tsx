'use client'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils'
import {
  Users, UserCheck, Building2, TrendingUp, Calendar, ArrowUpRight,
  ArrowDownRight, IndianRupee, BarChart2, Clock, CheckCircle2, ListTodo, Link2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

function StatCard({ title, value, subtitle, icon: Icon, trend, color, href, index = 0 }: any) {
  return (
    <Link href={href || '#'} className="block animate-fade-up" style={{ animationDelay: `${index * 45}ms` }}>
      <Card className="card-lift cursor-pointer h-full relative overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-1 ${color}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight truncate">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'}`}>
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || {}
  const revenueGrowth = stats.lastMonthRevenue > 0
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : 0

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back 👋</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s what&apos;s happening across your business today.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-lg border bg-card">
            <Calendar className="w-4 h-4" />
            {formatDate(new Date().toISOString(), 'EEEE, dd MMMM yyyy')}
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard index={0} title="Total Leads" value={stats.totalLeads?.toLocaleString() || 0} subtitle="All time" icon={Users} color="bg-blue-500" href="/leads" />
            <StatCard index={1} title="Active Clients" value={stats.activeClients?.toLocaleString() || 0} subtitle="Active bookings" icon={UserCheck} color="bg-purple-500" href="/customers" />
            <StatCard index={2} title="Sold Units" value={stats.soldUnits?.toLocaleString() || 0} subtitle="Total sold" icon={Building2} color="bg-green-500" href="/inventory" />
            <StatCard
              index={3}
              title="Monthly Revenue"
              value={formatCurrency(stats.monthlyRevenue || 0)}
              subtitle="This month"
              icon={IndianRupee}
              color="bg-amber-500"
              trend={revenueGrowth}
              href="/payments"
            />
            <StatCard index={4} title="Total Revenue" value={formatCurrency(stats.totalRevenue || 0)} subtitle="All payments" icon={TrendingUp} color="bg-emerald-500" href="/reports" />
            <StatCard index={5} title="Follow-Ups Due" value={stats.followUpsPending || 0} subtitle="Pending follow-ups" icon={Clock} color="bg-orange-500" href="/follow-ups" />
            <StatCard index={6} title="Open Tasks" value={stats.tasksOpen || 0} subtitle="Not yet done" icon={ListTodo} color="bg-rose-500" href="/tasks" />
            <StatCard index={7} title="Conversion Rate" value={`${stats.conversionRate || 0}%`} subtitle="Leads to won" icon={BarChart2} color="bg-indigo-500" href="/reports" />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data?.monthlySales || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead Sources Pie */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data?.leadsBySource?.map((l: any) => ({ name: l.source, value: l._count })) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(data?.leadsBySource || []).map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead Status + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Status */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Lead Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3">
                  {(data?.leadsByStatus || []).map((s: any) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                          {s.status}
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{s._count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Leads</CardTitle>
              <Link href="/leads" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="divide-y">
                  {(data?.recentLeads || []).map((lead: any) => (
                    <div key={lead.id} className="py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                        {lead.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone} • {lead.city || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(lead.status)}`}>{lead.status}</span>
                        {lead.budget && <span className="text-xs text-muted-foreground">{formatCurrency(lead.budget)}</span>}
                      </div>
                    </div>
                  ))}
                  {(data?.recentLeads || []).length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">No leads yet</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Follow-ups + Open Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Upcoming Follow-Ups</CardTitle>
              <Link href="/follow-ups" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? <Skeleton className="h-32" /> : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {(data?.upcomingFollowUps || []).map((f: any) => (
                    <div key={f.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{f.title}</p>
                          <p className="text-xs text-muted-foreground">{f.lead?.name}</p>
                          <p className="text-xs text-primary mt-1">{formatDateTime(f.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(f.priority)}`}>{f.priority}</span>
                        <span className="text-xs text-muted-foreground">{f.type}</span>
                      </div>
                    </div>
                  ))}
                  {(data?.upcomingFollowUps || []).length === 0 && (
                    <div className="sm:col-span-2 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      No upcoming follow-ups. You&apos;re all caught up!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Open Tasks</CardTitle>
              <Link href="/tasks" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? <Skeleton className="h-32" /> : (
                <div className="space-y-2">
                  {(data?.upcomingTasks || []).map((t: any) => (
                    <Link key={t.id} href="/tasks" className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex items-start gap-2">
                        <ListTodo className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
                            {t.dueDate && <span className="text-xs text-muted-foreground">{formatDate(t.dueDate)}</span>}
                          </div>
                          {t.relatedTo && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Link2 className="w-3 h-3" />{t.relatedTo}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {(data?.upcomingTasks || []).length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      No open tasks.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

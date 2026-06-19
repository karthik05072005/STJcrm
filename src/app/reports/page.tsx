'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import { Download, BarChart3 } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316']

export default function ReportsPage() {
  const [months, setMonths] = useState('6')

  const { data: salesReport, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', months],
    queryFn: () => apiFetch(`/api/reports?type=sales&months=${months}`),
  })

  const { data: leadsReport, isLoading: loadingLeads } = useQuery({
    queryKey: ['report-leads'],
    queryFn: () => apiFetch('/api/reports?type=leads'),
  })

  const { data: inventoryReport, isLoading: loadingInventory } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => apiFetch('/api/reports?type=inventory'),
  })

  const totalRevenue = salesReport?.data?.reduce((s: number, m: any) => s + m.revenue, 0) || 0
  const totalLeads = leadsReport?.byStatus?.reduce((s: number, l: any) => s + l._count, 0) || 0
  const wonLeads = leadsReport?.byStatus?.find((l: any) => l.status === 'Won')?._count || 0
  const convRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return
    const keys = Object.keys(data[0])
    const csv = [keys.join(','), ...data.map((row) => keys.map((k) => row[k]).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Comprehensive business performance insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => exportCSV(salesReport?.data || [], 'sales-report')}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: `Last ${months} months` },
            { label: 'Total Leads', value: totalLeads, sub: 'All time' },
            { label: 'Won Leads', value: wonLeads, sub: 'Converted' },
            { label: 'Conversion Rate', value: `${convRate}%`, sub: 'Lead to sale' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Revenue by Month</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(salesReport?.data || [], 'monthly-revenue')}>
                <Download className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingSales ? <Skeleton className="h-52" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesReport?.data || []}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Leads & Customers</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingSales ? <Skeleton className="h-52" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesReport?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Leads" />
                    <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 0, 0]} name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead & Inventory Reports */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Leads by Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingLeads ? <Skeleton className="h-52" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={(leadsReport?.byStatus || []).map((l: any) => ({ name: l.status, value: l._count }))}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    >
                      {(leadsReport?.byStatus || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingLeads ? <Skeleton className="h-52" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart layout="vertical" data={(leadsReport?.bySource || []).map((l: any) => ({ name: l.source, count: l._count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingInventory ? <Skeleton className="h-52" /> : (
                <div className="space-y-3 mt-2">
                  {(inventoryReport?.byStatus || []).map((s: any, i: number) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{s.status}</span>
                      </div>
                      <span className="text-sm font-semibold">{s._count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

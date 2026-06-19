'use client'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/hooks/useApi'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { TrendingUp, IndianRupee, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function SalesPage() {
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiFetch('/api/bookings?limit=20'),
  })
  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['sales-report'],
    queryFn: () => apiFetch('/api/reports?type=sales&months=6'),
  })

  const totalRevenue = reports?.data?.reduce((s: number, m: any) => s + m.revenue, 0) || 0
  const totalTransactions = reports?.data?.reduce((s: number, m: any) => s + m.transactions, 0) || 0

  return (
    <DashboardLayout title="Sales">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Sales Management</h1>
          <p className="text-sm text-muted-foreground">Track your bookings, revenue, and sales pipeline</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'bg-green-500' },
            { label: 'Transactions', value: totalTransactions, icon: TrendingUp, color: 'bg-blue-500' },
            { label: 'Bookings', value: bookings?.total || 0, icon: Building2, color: 'bg-purple-500' },
            { label: 'Customers', value: bookings?.data?.length || 0, icon: Users, color: 'bg-amber-500' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reports?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads & Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={reports?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} name="Leads" />
                    <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} name="Customers" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <Link href="/customers" className="text-xs text-primary hover:underline">View customers</Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Unit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingBookings
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5}><Skeleton className="h-10 m-2" /></td></tr>
                    ))
                    : (bookings?.data || []).map((b: any) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{b.customer?.applicantName}</p>
                          <p className="text-xs text-muted-foreground">{b.customer?.applicantPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm hidden sm:table-cell">
                          {b.unit?.unitNumber} — {b.unit?.project?.name}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold">{formatCurrency(b.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">Booking: {formatCurrency(b.bookingAmount)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(b.bookingDate)}</td>
                      </tr>
                    ))
                  }
                  {!loadingBookings && (bookings?.data || []).length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No bookings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

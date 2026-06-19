import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  const [
    totalLeads,
    activeClients,
    soldUnits,
    availableUnits,
    bookedUnits,
    followUpsPending,
    allPayments,
    monthlyPayments,
    lastMonthPayments,
    recentLeads,
    upcomingFollowUps,
    recentActivities,
    leadsByStatus,
    leadsBySource,
    monthlySales,
    tasksOpen,
    upcomingTasks,
  ] = await Promise.all([
    prisma.lead.count({ where: { userId: user.id, isDeleted: false } }),
    prisma.customer.count({ where: { userId: user.id, isDeleted: false, bookingStatus: 'Active' } }),
    prisma.unit.count({ where: { status: 'Sold', isDeleted: false } }),
    prisma.unit.count({ where: { status: 'Available', isDeleted: false } }),
    prisma.unit.count({ where: { status: { in: ['Booked', 'Reserved'] }, isDeleted: false } }),
    prisma.followUp.count({ where: { userId: user.id, isDeleted: false, status: 'Pending' } }),
    prisma.payment.findMany({
      where: { userId: user.id, isDeleted: false, status: 'Paid' },
      select: { amount: true, paymentDate: true },
    }),
    prisma.payment.aggregate({
      where: { userId: user.id, isDeleted: false, status: 'Paid', paymentDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { userId: user.id, isDeleted: false, status: 'Paid', paymentDate: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.lead.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, phone: true, status: true, source: true, budget: true, createdAt: true, city: true },
    }),
    prisma.followUp.findMany({
      where: { userId: user.id, isDeleted: false, status: 'Pending', dueDate: { gte: now } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { lead: { select: { name: true, phone: true } } },
    }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    }),
    // Monthly sales for last 6 months
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(now, 5 - i)
        const start = startOfMonth(month)
        const end = endOfMonth(month)
        return prisma.payment.aggregate({
          where: { userId: user.id, isDeleted: false, status: 'Paid', paymentDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }).then((result) => ({
          month: month.toLocaleString('en', { month: 'short', year: '2-digit' }),
          revenue: result._sum.amount || 0,
        }))
      })
    ),
    prisma.task.count({ where: { userId: user.id, isDeleted: false, status: { not: 'Done' } } }),
    prisma.task.findMany({
      where: { userId: user.id, isDeleted: false, status: { not: 'Done' } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 5,
    }),
  ])

  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const monthlyRevenue = monthlyPayments._sum.amount || 0
  const lastMonthRevenue = lastMonthPayments._sum.amount || 0
  const wonLeads = leadsByStatus.find((l) => l.status === 'Won')?._count || 0
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0'

  const bookingPayments = await prisma.payment.aggregate({
    where: { userId: user.id, isDeleted: false, type: 'Booking', status: 'Paid' },
    _sum: { amount: true },
  })

  return Response.json({
    stats: {
      totalLeads,
      activeClients,
      soldUnits,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      followUpsPending,
      conversionRate: parseFloat(conversionRate),
      bookingAmount: bookingPayments._sum.amount || 0,
      availableUnits,
      bookedUnits,
      tasksOpen,
    },
    recentLeads,
    upcomingFollowUps,
    upcomingTasks,
    recentActivities,
    leadsByStatus,
    leadsBySource,
    monthlySales,
  })
}

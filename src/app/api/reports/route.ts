import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'sales'
  const months = parseInt(searchParams.get('months') || '6')
  const now = new Date()

  if (type === 'sales') {
    const data = await Promise.all(
      Array.from({ length: months }, (_, i) => {
        const month = subMonths(now, months - 1 - i)
        const start = startOfMonth(month)
        const end = endOfMonth(month)
        return Promise.all([
          prisma.payment.aggregate({
            where: { userId: user.id, isDeleted: false, status: 'Paid', paymentDate: { gte: start, lte: end } },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.lead.count({ where: { userId: user.id, isDeleted: false, createdAt: { gte: start, lte: end } } }),
          prisma.customer.count({ where: { userId: user.id, isDeleted: false, createdAt: { gte: start, lte: end } } }),
        ]).then(([payment, leads, customers]) => ({
          month: format(month, 'MMM yy'),
          revenue: payment._sum.amount || 0,
          transactions: payment._count,
          leads,
          customers,
        }))
      })
    )
    return Response.json({ data })
  }

  if (type === 'leads') {
    const byStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    })
    const bySource = await prisma.lead.groupBy({
      by: ['source'],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    })
    const byPriority = await prisma.lead.groupBy({
      by: ['priority'],
      where: { userId: user.id, isDeleted: false },
      _count: true,
    })
    return Response.json({ byStatus, bySource, byPriority })
  }

  if (type === 'inventory') {
    const byStatus = await prisma.unit.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: true,
    })
    const byType = await prisma.unit.groupBy({
      by: ['type'],
      where: { isDeleted: false },
      _count: true,
    })
    return Response.json({ byStatus, byType })
  }

  return Response.json({ error: 'Invalid report type' }, { status: 400 })
}

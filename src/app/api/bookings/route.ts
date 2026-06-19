import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''
  const skip = (page - 1) * limit

  const where: any = { isDeleted: false }
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { applicantName: true, applicantPhone: true } },
        unit: { select: { unitNumber: true, type: true, project: { select: { name: true } } } },
        payments: { select: { amount: true, status: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const booking = await prisma.booking.create({
    data: {
      ...body,
      bookingDate: new Date(body.bookingDate || Date.now()),
    },
  })

  await prisma.unit.update({ where: { id: body.unitId }, data: { status: 'Booked' } })

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'created', entity: 'Booking', entityId: booking.id, description: 'Booking created' },
  })

  return Response.json(booking, { status: 201 })
}

import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const skip = (page - 1) * limit

  const where: any = { userId: user.id, isDeleted: false }
  if (search) {
    where.OR = [
      { applicantName: { contains: search } },
      { applicantPhone: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (status) where.bookingStatus = status

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        lead: { select: { name: true, status: true } },
        project: { select: { name: true } },
        unit: { select: { unitNumber: true, type: true, status: true } },
        _count: { select: { payments: true, documents: true } },
      },
    }),
    prisma.customer.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const customer = await prisma.customer.create({
      data: {
        ...body,
        userId: user.id,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        dateOfAgreement: body.dateOfAgreement ? new Date(body.dateOfAgreement) : null,
      },
    })

    if (body.unitId) {
      await prisma.unit.update({ where: { id: body.unitId }, data: { status: 'Booked' } })
    }

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'created', entity: 'Customer', entityId: customer.id, description: `Customer ${customer.applicantName} created` },
    })

    return Response.json(customer, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

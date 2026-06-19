import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''
  const customerId = searchParams.get('customerId') || ''
  const skip = (page - 1) * limit

  const where: any = { userId: user.id, isDeleted: false }
  if (status) where.status = status
  if (customerId) where.customerId = customerId

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { applicantName: true, applicantPhone: true } },
        booking: { select: { id: true } },
      },
    }),
    prisma.payment.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const payment = await prisma.payment.create({
    data: {
      ...body,
      userId: user.id,
      receiptNumber: generateReceiptNumber(),
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Payment Recorded',
      message: `Payment of ₹${body.amount.toLocaleString()} recorded`,
      type: 'success',
      link: `/payments/${payment.id}`,
    },
  })

  return Response.json(payment, { status: 201 })
}

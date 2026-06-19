import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, userId: user.id, isDeleted: false },
    include: {
      lead: true,
      project: true,
      unit: true,
      payments: { where: { isDeleted: false }, orderBy: { paymentDate: 'desc' } },
      documents: { where: { isDeleted: false } },
      bookings: { include: { unit: true } },
    },
  })

  if (!customer) return Response.json({ error: 'Customer not found' }, { status: 404 })
  return Response.json(customer)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  await prisma.customer.updateMany({
    where: { id, userId: user.id },
    data: {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      dateOfAgreement: body.dateOfAgreement ? new Date(body.dateOfAgreement) : null,
    },
  })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.customer.updateMany({ where: { id, userId: user.id }, data: { isDeleted: true } })
  return Response.json({ success: true })
}

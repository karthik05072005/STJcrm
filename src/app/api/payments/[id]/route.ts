import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const payment = await prisma.payment.findFirst({
    where: { id, userId: user.id },
    include: { customer: true, booking: { include: { unit: true } } },
  })
  if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })
  return Response.json(payment)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  await prisma.payment.updateMany({ where: { id, userId: user.id }, data: body })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.payment.updateMany({ where: { id, userId: user.id }, data: { isDeleted: true } })
  return Response.json({ success: true })
}

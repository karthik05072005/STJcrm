import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const unit = await prisma.unit.findFirst({
    where: { id, isDeleted: false },
    include: {
      project: true,
      tower: true,
      floor: true,
      customers: { where: { isDeleted: false } },
      bookings: true,
    },
  })

  if (!unit) return Response.json({ error: 'Unit not found' }, { status: 404 })
  return Response.json(unit)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  const totalPrice = (body.price || 0) + (body.plcCharges || 0) + (body.parkingCharges || 0) + (body.otherCharges || 0)

  // Drop relation objects / read-only fields the edit form may carry along
  const { id: _id, project, tower, floor, customers, bookings, _count, createdAt, updatedAt, ...rest } = body

  await prisma.unit.update({ where: { id }, data: { ...rest, totalPrice } })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.unit.update({ where: { id }, data: { isDeleted: true } })
  return Response.json({ success: true })
}

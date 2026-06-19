import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const lead = await prisma.lead.findFirst({
    where: { id, userId: user.id, isDeleted: false },
    include: {
      followUps: { where: { isDeleted: false }, orderBy: { dueDate: 'asc' } },
      callLogs: { orderBy: { createdAt: 'desc' } },
      customer: true,
    },
  })

  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })
  return Response.json(lead)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const body = await req.json()

    // Prevent updating a lead's phone to one that already belongs to another lead
    if (body.phone) {
      const incoming = body.phone.replace(/\D/g, '')
      const others = await prisma.lead.findMany({
        where: { userId: user.id, isDeleted: false, id: { not: id } },
        select: { name: true, phone: true },
      })
      const duplicate = others.find((l) => l.phone.replace(/\D/g, '') === incoming)
      if (duplicate) {
        return Response.json(
          { error: `Another lead already uses this phone number (${duplicate.name}).` },
          { status: 409 }
        )
      }
    }

    // Only persist known columns (avoid leaking client-only fields like _count)
    const { id: _id, userId: _userId, createdAt, _count, customer, followUps, callLogs, ...rest } = body
    const lead = await prisma.lead.updateMany({
      where: { id, userId: user.id },
      data: {
        ...rest,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        updatedAt: new Date(),
      },
    })

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'updated', entity: 'Lead', entityId: id, description: `Lead updated` },
    })

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.lead.updateMany({ where: { id, userId: user.id }, data: { isDeleted: true } })
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'deleted', entity: 'Lead', entityId: id, description: 'Lead deleted' },
  })

  return Response.json({ success: true })
}

import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const projectId = searchParams.get('projectId') || ''
  const towerId = searchParams.get('towerId') || ''
  const type = searchParams.get('type') || ''
  const skip = (page - 1) * limit

  const where: any = { isDeleted: false }
  if (search) where.OR = [{ unitNumber: { contains: search } }, { type: { contains: search } }]
  if (status) where.status = status
  if (projectId) where.projectId = projectId
  if (towerId) where.towerId = towerId
  if (type) where.type = type

  const [data, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      orderBy: [{ projectId: 'asc' }, { unitNumber: 'asc' }],
      skip,
      take: limit,
      include: {
        project: { select: { name: true } },
        tower: { select: { name: true } },
        floor: { select: { number: true } },
      },
    }),
    prisma.unit.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const totalPrice = (body.price || 0) + (body.plcCharges || 0) + (body.parkingCharges || 0) + (body.otherCharges || 0)

    const unit = await prisma.unit.create({
      data: { ...body, totalPrice },
    })

    await prisma.project.update({
      where: { id: body.projectId },
      data: { totalUnits: { increment: 1 } },
    })

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'created', entity: 'Unit', entityId: unit.id, description: `Unit ${unit.unitNumber} added` },
    })

    return Response.json(unit, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

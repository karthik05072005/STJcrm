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
  const priority = searchParams.get('priority') || ''
  const type = searchParams.get('type') || ''
  const skip = (page - 1) * limit

  const where: any = { userId: user.id, isDeleted: false }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (type) where.type = type

  const [data, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip,
      take: limit,
      include: { lead: { select: { name: true, phone: true, status: true } } },
    }),
    prisma.followUp.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const followUp = await prisma.followUp.create({
    data: {
      ...body,
      userId: user.id,
      dueDate: new Date(body.dueDate),
    },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Follow-up Scheduled',
      message: `Follow-up "${followUp.title}" scheduled`,
      type: 'info',
      link: `/follow-ups`,
    },
  })

  return Response.json(followUp, { status: 201 })
}

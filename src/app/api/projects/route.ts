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

  const where: any = { isDeleted: false }
  if (search) where.OR = [{ name: { contains: search } }, { city: { contains: search } }]
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { towers: true, units: true, customers: true } },
      },
    }),
    prisma.project.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const project = await prisma.project.create({
      data: {
        ...body,
        launchDate: body.launchDate ? new Date(body.launchDate) : null,
        possessionDate: body.possessionDate ? new Date(body.possessionDate) : null,
        reraExpiry: body.reraExpiry ? new Date(body.reraExpiry) : null,
      },
    })
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'created', entity: 'Project', entityId: project.id, description: `Project ${project.name} created` },
    })
    return Response.json(project, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

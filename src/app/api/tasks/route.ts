import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  relatedTo: z.string().optional(),
  dueDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const skip = (page - 1) * limit

  const where: any = { userId: user.id, isDeleted: false }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { relatedTo: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (priority) where.priority = priority

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || 'To Do',
        priority: data.priority || 'Medium',
        category: data.category || 'General',
        relatedTo: data.relatedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completedAt: data.status === 'Done' ? new Date() : null,
        userId: user.id,
      },
    })

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'created', entity: 'Task', entityId: task.id, description: `Task "${task.title}" created` },
    })

    return Response.json(task, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return Response.json({ error: 'Invalid data', details: err.errors }, { status: 400 })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

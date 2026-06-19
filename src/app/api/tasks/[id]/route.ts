import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const task = await prisma.task.findFirst({ where: { id, userId: user.id, isDeleted: false } })
  if (!task) return Response.json({ error: 'Task not found' }, { status: 404 })
  return Response.json(task)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const body = await req.json()
    const { id: _id, userId: _userId, createdAt, updatedAt, ...rest } = body

    const data: any = {
      ...rest,
      updatedAt: new Date(),
    }
    if ('dueDate' in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if ('status' in body) data.completedAt = body.status === 'Done' ? new Date() : null

    await prisma.task.updateMany({ where: { id, userId: user.id }, data })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.task.updateMany({ where: { id, userId: user.id }, data: { isDeleted: true } })
  return Response.json({ success: true })
}

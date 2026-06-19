import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, isDeleted: false },
    include: {
      towers: {
        where: { isDeleted: false },
        include: {
          floors: { where: { isDeleted: false } },
          units: { where: { isDeleted: false } },
        },
      },
      units: { where: { isDeleted: false } },
      _count: { select: { customers: true } },
    },
  })

  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })
  return Response.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json()
  await prisma.project.update({
    where: { id },
    data: {
      ...body,
      launchDate: body.launchDate ? new Date(body.launchDate) : null,
      possessionDate: body.possessionDate ? new Date(body.possessionDate) : null,
    },
  })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  await prisma.project.update({ where: { id }, data: { isDeleted: true } })
  return Response.json({ success: true })
}

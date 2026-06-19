import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } })
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId: user.id } })
  }
  return Response.json(settings)
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: body,
  })
  return Response.json(settings)
}

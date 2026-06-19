import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } })
  return Response.json({ success: true })
}

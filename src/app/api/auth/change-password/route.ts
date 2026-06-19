import { NextRequest } from 'next/server'
import { getAuthUser, comparePassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = schema.parse(body)

    // Load the full user record (getAuthUser omits the password hash)
    const user = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    const valid = await comparePassword(currentPassword, user.password)
    if (!valid) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const sameAsOld = await comparePassword(newPassword, user.password)
    if (sameAsOld) {
      return Response.json({ error: 'New password must be different from the current password' }, { status: 400 })
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'updated', entity: 'User', entityId: user.id, description: 'Password changed' },
    })

    return Response.json({ success: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return Response.json({ error: err.errors?.[0]?.message || 'Invalid data' }, { status: 400 })
    }
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

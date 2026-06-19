import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return Response.json({ error: 'Invalid email or password' }, { status: 401 })

    const valid = await comparePassword(data.password, user.password)
    if (!valid) return Response.json({ error: 'Invalid email or password' }, { status: 401 })

    const token = signToken({ userId: user.id, email: user.email })
    const { password: _, ...safeUser } = user

    const res = Response.json({ user: safeUser, token })
    res.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`)
    return res
  } catch (err: any) {
    if (err.name === 'ZodError') return Response.json({ error: 'Invalid data' }, { status: 400 })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return Response.json({ error: 'Email already registered' }, { status: 400 })

    const hashedPassword = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword },
      select: { id: true, name: true, email: true, avatar: true },
    })

    await prisma.settings.create({ data: { userId: user.id } })

    const token = signToken({ userId: user.id, email: user.email })

    const res = Response.json({ user, token }, { status: 201 })
    res.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`)
    return res
  } catch (err: any) {
    if (err.name === 'ZodError') return Response.json({ error: 'Invalid data', details: err.errors }, { status: 400 })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

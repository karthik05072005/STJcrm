import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  budget: z.number().optional(),
  budgetMax: z.number().optional(),
  propertyType: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  channelPartner: z.string().optional(),
  projectName: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
})

// Strip non-digits so different formats of the same number are treated as duplicates
function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const source = searchParams.get('source') || ''
  const priority = searchParams.get('priority') || ''
  const skip = (page - 1) * limit

  const where: any = { userId: user.id, isDeleted: false }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (source) where.source = source
  if (priority) where.priority = priority

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { followUps: true, callLogs: true } },
      },
    }),
    prisma.lead.count({ where }),
  ])

  return Response.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Prevent duplicate leads with the same contact number
    const incomingPhone = normalizePhone(data.phone)
    const existing = await prisma.lead.findMany({
      where: { userId: user.id, isDeleted: false },
      select: { name: true, phone: true },
    })
    const duplicate = existing.find((l) => normalizePhone(l.phone) === incomingPhone)
    if (duplicate) {
      return Response.json(
        { error: `A lead with this phone number already exists (${duplicate.name}).` },
        { status: 409 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        ...data,
        email: data.email || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        userId: user.id,
      },
    })

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'created', entity: 'Lead', entityId: lead.id, description: `Lead ${lead.name} created` },
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'New Lead Added',
        message: `Lead ${lead.name} has been added`,
        type: 'success',
        link: `/leads/${lead.id}`,
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return Response.json({ error: 'Invalid data', details: err.errors }, { status: 400 })
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

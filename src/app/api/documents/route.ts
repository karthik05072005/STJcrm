import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const customerId = searchParams.get('customerId') || ''

  const where: any = { userId: user.id, isDeleted: false }
  if (search) where.OR = [{ name: { contains: search } }, { fileName: { contains: search } }]
  if (category) where.category = category
  if (customerId) where.customerId = customerId

  const data = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { applicantName: true } } },
  })

  return Response.json({ data })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const category = (formData.get('category') as string) || 'General'
    const description = (formData.get('description') as string) || ''
    const customerId = (formData.get('customerId') as string) || null

    if (!file || !name) return Response.json({ error: 'File and name are required' }, { status: 400 })

    const uploadDir = join(process.cwd(), 'public', 'uploads', user.id)
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = join(uploadDir, fileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        name,
        fileName: file.name,
        filePath: `/uploads/${user.id}/${fileName}`,
        fileSize: file.size,
        fileType: file.type,
        category,
        description,
        customerId: customerId || null,
      },
    })

    return Response.json(doc, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

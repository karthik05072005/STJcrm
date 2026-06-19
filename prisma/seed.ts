import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Minimal seed: creates only the admin login + default settings.
// (The original demo-data seed is preserved in prisma/seed.demo.ts —
//  run `npx tsx prisma/seed.demo.ts` if you ever want sample data back.)
async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'admin@stjgroup.com' },
    update: {},
    create: {
      name: 'STJ Admin',
      email: 'admin@stjgroup.com',
      password: hashedPassword,
    },
  })

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  })

  console.log('✅ Seed complete.')
  console.log('   Login: admin@stjgroup.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

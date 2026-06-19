# STJ Group — Property CRM

A single-vendor real-estate CRM built with **Next.js 16 (App Router)**, **Prisma + SQLite**, **Tailwind CSS v4**, JWT auth, TanStack Query and Recharts.

Modules: Dashboard, Leads (table + kanban, channel-partner / project-name, duplicate-phone guard, CSV export), Customers (with per-customer Documents), Inventory (grid + table, notes), Data Centre, Sales, Follow-ups, Tasks (board), Payments, Reports, Settings, Notifications.

## Login

```
Email:    admin@gmail.com
Password: admin123
```

Self-registration is disabled (single-admin). Change the password in **Settings → Change Password**.

## Run locally

```bash
npm install
cp .env.example .env      # DATABASE_URL defaults to a local SQLite file
npm run db:setup          # prisma db push + seed admin
npm run dev               # http://localhost:3000
```

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run db:setup   # prisma db push + seed admin
npm run db:seed    # seed admin only
npm run db:studio  # Prisma Studio (DB browser)
```

## Notes

- Database is **SQLite** (`prisma/schema.prisma` → `provider = "sqlite"`), stored in a local
  `dev.db` file (git-ignored). Note: serverless hosts like Vercel have a read-only/ephemeral
  filesystem, so for a hosted writable deployment you'd switch the Prisma provider to a hosted
  database (e.g. Postgres) and set `DATABASE_URL` accordingly.
- **File uploads** (Documents) are written to `public/uploads` on local disk.
- Sample/demo data is **not** seeded. The original demo seeder is preserved at
  `prisma/seed.demo.ts` — run `npx tsx prisma/seed.demo.ts` for sample records.
```

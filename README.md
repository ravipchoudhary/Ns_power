# NS Power Solution — Inspection Management

Fire & Pump **Routine Inspection Checklist** web application for NS POWER SOLUTION.

## Features

- **Roles:** Admin & Inspector with JWT login
- **Dashboard:** Stats, recent activity, AMC overdue alerts
- **Digital inspection form:** Full paper checklist (14 items, Yes/No/N/A)
- **Photos:** Before / After / General uploads
- **Digital signature** & PDF report generation
- **Admin panel:** Search, assign engineers, view all records
- **AMC reminders:** Due within 7 days
- **WhatsApp share** link after PDF generation

## Quick start

```bash
cd C:\Users\lenovo\ns-power-inspection
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

After seeding, use the accounts created in `prisma/seed.ts`. Change default passwords from **Account Settings** in the app.

## Environment

Copy `.env` and set:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For **MySQL**, change `prisma/schema.prisma` provider to `mysql` and set:

```
DATABASE_URL="mysql://user:pass@localhost:3306/ns_power"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed users & sample data |

## Project structure

```
src/app/(app)/     # Authenticated pages
src/app/api/       # REST API routes
src/components/    # UI & inspection form
src/lib/           # Auth, PDF, checklist constants
prisma/            # Database schema & seed
public/reports/    # Generated PDFs
public/uploads/    # Inspection photos
```

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma + SQLite (dev) / MySQL (production)
- JWT cookies (jose)
- jsPDF for reports

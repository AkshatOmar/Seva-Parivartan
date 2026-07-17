# Seva Parivartan

> Mutual Transfer Matching Platform for Central Government Employees

---

## Project Structure

```
seva-parivartan/
├── web/          # Next.js 14 frontend
├── api/          # Node.js + Express backend
└── supabase/
    ├── migrations/   # Run these in Supabase SQL Editor (in order)
    └── seed/         # Run these after migrations
```

---

## ⚡ Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Save your **Project URL**, **anon key**, and **service_role key**

### 2. Run SQL Migrations
In Supabase SQL Editor, run **in order**:
```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_functions.sql
```

### 3. Seed Data
Then run:
```
supabase/seed/seed_departments.sql
supabase/seed/seed_locations.sql
```

### 4. Configure Environment Variables

**Frontend** (`web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend** (`api/.env`):
```
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run Development Servers

**Terminal 1 – Frontend:**
```bash
cd web
npm run dev
```

**Terminal 2 – API:**
```bash
cd api
npm run dev
```

Open: http://localhost:3000

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + React + shadcn/ui + Tailwind |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Real-time | Supabase Realtime (notifications) |

---

## Features

- 🔍 **Instant matching** — 2-way mutual transfer matching by district × designation × department  
- 📧 **Email/password auth** — via Supabase  
- 💬 **In-app messaging** — after connection accepted  
- 🔔 **Real-time notifications** — new matches, connection requests, messages  
- 🛡️ **Admin panel** — manage users, view matches, add departments/designations  
- 🗺️ **750+ districts** — all Indian states and union territories  
- 🏛️ **5 departments** — Education, Post, Police, IT, Health  

---

## Matching Logic

A matches B when:
- `A.current_district == B.desired_district` ✓
- `B.current_district == A.desired_district` ✓  
- `A.designation == B.designation` ✓  
- `A.department == B.department` ✓

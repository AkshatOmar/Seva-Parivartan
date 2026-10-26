# Seva Parivartan

> Teacher Mutual Transfer Matching — Simple & Focused

Teachers post their current district and desired district. The app finds 2-way matches (same designation, A wants B's location and B wants A's location). They can then send each other connection requests.

---

## Project Structure

```
seva-parivartan/
├── web/          # Next.js 14 frontend (5 pages)
├── api/          # Node.js + Express backend (4 routes)
└── supabase/
    └── schema.sql   # Run this once in Supabase SQL Editor
```

---

## Quick Setup

### 1. Create Supabase Project
Go to [supabase.com](https://supabase.com) → New Project. Save your **Project URL**, **anon key**, and **service_role key**.

### 2. Run the Schema
In Supabase SQL Editor, paste and run `supabase/schema.sql`.

### 3. Environment Variables

**`api/.env`**
```
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**`web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Run

```bash
# Terminal 1
cd api && npm run dev

# Terminal 2
cd web && npm run dev
```

Open: http://localhost:3000

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Next.js 14 + shadcn/ui        |
| Backend  | Node.js + Express             |
| Database | Supabase (PostgreSQL)         |
| Auth     | Supabase Auth                 |

---

## Database (2 tables only)

| Table         | Purpose                              |
|---------------|--------------------------------------|
| `profiles`    | Teacher info: name, designation, current + desired district |
| `connections` | Transfer requests between matched teachers |

---

## Matching Logic

A matches B when:
- `A.current_dist == B.desired_dist`
- `B.current_dist == A.desired_dist`
- `A.designation == B.designation`

It's a single SQL query. No stored functions, no triggers, no cron jobs.

---

## API Routes (4 modules)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/profile` | Get your profile |
| PUT | `/api/profile` | Update your profile |
| GET | `/api/matches` | See your matches |
| GET | `/api/connections` | See all requests |
| POST | `/api/connections` | Send a request |
| PUT | `/api/connections/:id` | Accept or reject |

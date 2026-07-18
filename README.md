# Kandy Garden Club

A management system for a real tennis club: court booking, membership billing, staff/coach administration, and the club's public website — one codebase, four audiences (public visitors, members, coaches, admins).

**Stack:** Node.js + Express · MySQL/MariaDB (raw SQL, no ORM) · React 19 + Vite + Tailwind CSS

---

## Documentation

This repo's docs are split by concern rather than crammed into one file:

| Doc | What's in it |
|---|---|
| [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) | Start here if you're new — purpose, architecture, entry points, key components, data flow, and the gotchas worth knowing before changing something. |
| [`DB.md`](./DB.md) | Full database schema — every table, column, key, and foreign key, generated from the live database. |
| [`backend/schema.sql`](./backend/schema.sql) | The runnable version of `DB.md` — `CREATE TABLE` statements plus reference-data seed (courts, time slots, membership plans, club settings) to bootstrap a fresh database. |
| [`API.md`](./API.md) | Every backend endpoint — method, path, required role, one-line description. |
| [`API_DESIGN.md`](./API_DESIGN.md) | A handful of representative endpoints spelled out in full — request/response body shapes and status codes — as a template for the rest. |
| [`design.md`](./design.md) | The "Heritage Elite" design system — color tokens, type scale, spacing, and component patterns used across the frontend. |

## Getting started

You'll need Node.js and a running MySQL/MariaDB instance.

### 1. Database

Create an empty database, then load the base schema from [`backend/schema.sql`](./backend/schema.sql):

```bash
mysql -u your_db_user -p kandy_garden_club_db < backend/schema.sql
```

That's the actual `CREATE TABLE` DDL (verified against the live database, not hand-transcribed from docs), in foreign-key-safe order, plus the reference/lookup data the app needs to be usable out of the box — courts, time slots, membership plans, and club settings. It does **not** include any member/coach/booking/payment data — that's real per-deployment data, not schema, and isn't seeded.

There's no migration tool beyond this: `backend/utils/schemaBootstrap.js` runs automatically on every server boot and self-heals anything added *since* this file was generated (additive `ALTER TABLE` statements, plus a couple of tables it creates outright via `CREATE TABLE IF NOT EXISTS`). Everything in `schema.sql` already reflects the current state, so on a fresh load those checks are all no-ops — confirmed by running `ensureSchema()` against a database built from this exact file.

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=kandy_garden_club_db
JWT_SECRET=some-long-random-string
JWT_EXPIRES_IN=1d
PORT=5000

# Optional — only needed for the contact-form reply feature
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

```bash
node server.js
```

You should see `🚀 Server running on port 5000` and `✅ Connected to MariaDB/MySQL database successfully.`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optionally, create `frontend/.env` if the backend isn't on the default:

```env
VITE_API_URL=http://localhost:5000
```

Open the printed local URL (Vite's default is `http://localhost:5173`).

### 4. First login

There's no seeded admin account — the very first account has to come from the database directly (insert a `users` row with `role='admin'`, `status='active'`, and a bcrypt hash for the password), or by promoting a registration through the pending queue once one exists. After that, every other account (member, coach, more admins, staff) can be created from the Access Management screen.

## Scripts

| Where | Command | Does |
|---|---|---|
| `backend/` | `node server.js` | Run the API server |
| `backend/` | `npx nodemon server.js` | Run with auto-restart on file changes |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build → `frontend/dist/` |
| `frontend/` | `npm run lint` | ESLint |

## Project layout

```
backend/    Express API — routes/ · controllers/ · middleware/ · validation/ · utils/
frontend/   React SPA — src/pages/{public,admin,member,coach,common} · src/components/ · src/hooks/
```

See `PROJECT_OVERVIEW.md` for the full breakdown of what lives where.

# Kandy Garden Club — Project Overview

*A working overview of the codebase for anyone picking this project up cold — what it does, how it's put together, and what to know before changing something.*

**Stack at a glance:** Node.js + Express · MySQL/MariaDB (no ORM, raw SQL) · React 19 + Vite

---

## 1. Purpose

Kandy Garden Club (KGC) is a full management system for a real tennis club: court booking, membership billing, staff/coach administration, and the club's public website, all in one codebase.

In plain terms, it replaces a mix of spreadsheets, a front-desk diary, and a static brochure site with one system. A prospective member can browse the public site and apply for membership; once approved, they can book courts, pay dues, and track their own attendance. Coaches get their own portal for bookings and payments. Admin staff run the whole operation from a dashboard — approving payments, managing memberships, marking attendance, adjusting court/plan pricing, and publishing announcements.

Four audiences share one deployment: **guests** (the public, no login), **members**, **coaches**, and **admins** — each with a distinct portal but the same underlying data.

---

## 2. Tech stack

### Backend — `/backend`

| Piece | Choice | Why it's here |
|---|---|---|
| Runtime | Node.js + Express 5 | Plain REST API, no framework magic |
| Database | MySQL / MariaDB via `mysql2` | Raw parameterized SQL throughout — **no ORM** (no Sequelize/Prisma) |
| Auth | `jsonwebtoken` + `bcrypt`/`bcryptjs` | Stateless JWT sessions, role embedded in the token payload |
| Validation | `zod` | Every request body/query is schema-checked before it reaches a controller |
| Uploads | `multer` | Payment slips, coach/court photos — stored on local disk, served via `/uploads` |
| Email | `nodemailer` | Replying to public contact-form inquiries |
| Config | `dotenv` | `.env`-based DB credentials, JWT secret, SMTP, port |

### Frontend — `/frontend`

| Piece | Choice | Why it's here |
|---|---|---|
| Framework | React 19 + Vite | SPA, fast dev server, no meta-framework (no Next.js) |
| Routing | `react-router-dom` v7 | Client-side routing across 4 route trees (public/admin/member/coach) |
| Styling | Tailwind CSS v4 | Utility classes; brand tokens defined once in `index.css` |
| Icons | `lucide-react`, `react-icons` | UI icons and social icons |
| Charts | `recharts` | Revenue graphs on the admin Reports page |
| Exports | `jspdf`, `jspdf-autotable`, `html2canvas-pro` | PDF report generation from the admin dashboard |

There's no shared package between frontend and backend — they're two independent Node projects (own `package.json`/`node_modules`) that only talk over HTTP.

---

## 3. Architecture

Both halves follow a conventional layered structure. Nothing exotic — the value is in reading the folder names literally.

```
backend/
├── config/       # db.js — the mysql2 pool + withTransaction() helper
├── routes/       # one file per resource — wires URL + middleware → controller
├── controllers/  # ~25 files — the actual request handlers / business logic
├── middleware/   # auth.js (JWT+role guard), validate.js (zod), upload.js (multer)
├── validation/   # zod schemas, one set per resource
├── utils/        # shared helpers — see Key Components
├── uploads/      # slips/, coaches/, courts/ — user-uploaded files, served statically
└── server.js     # app assembly + boot sequence (entry point)

frontend/src/
├── pages/
│   ├── public/    # Home, Courts, Membership, Updates, Login, Register — no auth
│   ├── admin/     # ~20 pages — the admin dashboard
│   ├── member/    # member portal
│   ├── coach/     # coach portal
│   └── common/    # pages shared by 2+ roles (Weather, Fitness, Attendance log)
├── components/    # grouped by feature area (booking/, courts/, membership/, layouts/...)
├── hooks/         # small shared data hooks (useClubSettings, useCourtsAndSlots)
└── utils/         # api.js (fetch wrapper), date.js, bookingKey.js...
```

**Database:** no migration framework. `backend/utils/schemaBootstrap.js` runs idempotent `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` statements once at server boot, catching the "already applied" errors and moving on. New columns/tables ship as code, not as a separate migration step.

---

## 4. Entry points

**`backend/server.js`** — Boots the Express app: runs `ensureSchema()`, starts two background sweeps (no-show fee charging, expired guest-lock cleanup) on a 5-minute interval, mounts ~19 route groups under `/api/*`, serves `/uploads` statically, and listens on `PORT` (default 5000).

**`frontend/src/main.jsx` → `App.jsx`** — `main.jsx` mounts React to the DOM. `App.jsx` defines every route (public + 3 protected trees) and toggles the public Navbar/Footer off for any `/admin`, `/member`, `/coach`, or auth page.

---

## 5. Key components

The pieces that matter disproportionately more than their file size suggests:

- **`middleware/auth.js`** — `verifyToken` + `requireRole(...roles)`, the two building blocks every protected route is gated by, composed per-router.
- **`utils/membership.js`** — `getCurrentMembership`, `assignOrUpdateMembership`, `syncMembershipPayment`: the single source of truth for "is this member's plan active," reused across booking, payments, and admin member management.
- **`utils/schemaBootstrap.js`** — Every additive schema change lives here. Includes the fix that stopped `bookings` rows from being silently reused across different people's bookings (a generated-column unique index scoped to active rows only).
- **`utils/noShowSweep.js` + `guestLockSweep.js`** — Background jobs (plain `setInterval`, no cron dependency): auto-charge no-show fees once a slot's time passes with nobody checked in, and auto-cancel abandoned 5-minute guest payment holds.
- **`components/booking/CourtSlotGrid.jsx`** — One presentational grid component reused identically by **all four** booking surfaces (guest, member, coach, admin) — the single place slot availability/locking is rendered, so all four stay visually and behaviorally in sync.
- **`components/layouts/DashboardLayout.jsx`** — The shell (sidebar + role-specific nav) for all three authenticated portals, paired with `ProtectedRoute.jsx` for the role check and `MembershipGate.jsx` for blocking expired members from booking-related pages.
- **`controllers/paymentVerificationController.js`** — The approve/reject/undo state machine for every submitted payment receipt (registrations, renewals, bookings, fee settlements) — the most stateful, race-condition-sensitive file in the backend.
- **`utils/accountStatus.js`** — Translates between three *different* status enums (login access vs. member standing vs. coach standing) so editing one from an admin screen keeps the others honest.

---

## 6. Data flow

Two representative paths, since "booking" and "auth" touch almost everything else.

### Booking a court (member, self-service)

1. **Grid loads** — `CourtSlotGrid` fetches `GET /api/courts`, `/api/time-slots`, and `/api/bookings/availability?date=` — the last one is **public**, so a guest's held slot and a member's confirmed one render identically for everyone looking at that date.
2. **Member clicks an open slot** — Frontend calls `POST /api/bookings` with a JWT. `verifyToken` + `requireRole` pass it through.
3. **Membership gate (server-side)** — `bookingController.requireActiveMembership` calls `getCurrentMembership` — no active plan, no booking, regardless of what the UI allowed.
4. **Row-locked write** — Inside `withTransaction`, a locking `SELECT ... FOR UPDATE` on the exact court/date/slot, then an `INSERT`. A DB-level unique index (on an active-rows-only generated column) is the real backstop against double-booking.
5. **Response** — Confirmed booking returned; frontend re-fetches availability so the grid reflects the new state.

### Authentication

1. **Login** — `POST /api/auth/login` checks username + bcrypt-compares the password (always runs the compare, even for an unknown username, to avoid leaking account existence via timing).
2. **Token issued** — JWT signed with `{ user_id, role }`, stored in `localStorage` on the client.
3. **Every request after** — `apiFetch()` (a thin fetch wrapper) attaches it as `Authorization: Bearer`. Route middleware decodes and checks role on the way in.

---

## 7. Current state

This has been under active, iterative development — most core flows are built and have been exercised against the live database, not just written and left untested.

- ✅ **Solid** — Public site, all three portals, booking + payment + attendance + no-show flows, staff/access management, club-settings-driven public contact info.
- ✅ **Solid** — A booking-identity bug where cancelled slots got silently reused (corrupting payment history) was found and fixed — verified against the real dataset, not just in theory.
- ✅ **Solid** — Several security passes: closed an unauthenticated payment-hijack route, a login timing side-channel, and a handful of missing soft-delete filters.
- ⚠️ **Known gap** — No automated test suite — `backend/package.json`'s `test` script is a placeholder. Verification has been manual/live-query based throughout.
- ⚠️ **Known gap** — Guest phone-number de-duplication is enforced in application code going forward, not by a DB constraint — a handful of historical duplicate guest records exist from before that was added.
- ◽ **Cosmetic** — No dedicated design-system doc — brand tokens live only in `frontend/src/index.css`.

---

## 8. Coupling & gotchas

Things worth knowing before changing something, so a "small fix" doesn't quietly break a sibling feature.

> **Shared components, four callers**
> `CourtSlotGrid.jsx` is used identically by the guest widget, member booking, coach booking, and admin booking. A change here touches all four — there's no per-role fork to edit in isolation.

> **Dates and timezones**
> The club is in Sri Lanka (UTC+5:30). Anything comparing "today" learned the hard way that `new Date().toISOString()` is UTC, not local — date/slot-locking logic on the backend prefers MySQL's own `CURDATE()`/`CURTIME()` for this reason, and the frontend has a single shared `utils/date.js` instead of each page rolling its own.

> **Three status enums, one admin screen**
> `users.status`, `members.status`, and `coaches.status` are three different enums for three different concerns. Editing one from Access Management routes through `utils/accountStatus.js` to keep the others in sync — don't update one table directly.

> **No migration tool**
> Every schema change is a hand-written, idempotent statement in `schemaBootstrap.js`, run at every boot. There's no "down" migration and no version history beyond git — changing a column means writing the next additive step, not editing the original.

---

## 9. Run · build · test

### Prerequisites

Node.js, and a MySQL/MariaDB instance. Each half needs its own `.env` (not committed) — the backend's needs at minimum `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, and `PORT`; the frontend optionally takes `VITE_API_URL` (defaults to `http://localhost:5000`).

### Backend

```bash
cd backend && npm install     # install dependencies
node server.js                # run once — schema self-heals on boot
npx nodemon server.js         # dev mode with auto-restart (devDependency, no npm script wraps it yet)
```

### Frontend

```bash
cd frontend && npm install    # install dependencies
npm run dev                   # Vite dev server, default :5173
npm run build                 # production bundle → dist/
npm run lint                  # ESLint
```

### Testing

There is no automated test suite on either side today. In practice, changes have been verified by running targeted read-only (or transaction-wrapped, rolled-back) scripts directly against the live database pool, plus manual exercising of the affected UI flow.

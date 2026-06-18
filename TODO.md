# TODO — Kandy Garden Club (KGC)

Grounded in the schema in `DB.md` and the current state of `frontend/` and `backend/`. Checked items are confirmed working in code.

## Backend API

### Access control (Module 1)
- [x] `POST /api/auth/register` — submits to `registration_requests`
- [x] `POST /api/auth/login` — issues JWT, checks `status === 'active'`
- [ ] Auth middleware to verify JWT + role on protected routes (nothing currently validates the token on any route after login)
- [ ] `GET /api/auth/me` — resolve current user from token
- [ ] Admin: approve/reject `registration_requests` → create `users` + `members` row on approval
- [ ] Admin: user management (list/disable/enable/change role)

### Config & profiles (Modules 2–3)
- [ ] CRUD `membership_types`
- [ ] CRUD `courts` (status: available/maintenance)
- [ ] `members` CRUD (Member Directory)
- [ ] `coaches` CRUD (Coach Profiles)
- [ ] `guests` CRUD

### Bookings & attendance (Module 4)
- [ ] `POST /api/bookings` — create booking, respect `unique_court_slot` constraint
- [ ] `GET /api/bookings` — filtered by role (admin: all, member: own, coach: own sessions)
- [ ] `PATCH /api/bookings/:id` — confirm/reject/cancel, lock/unlock
- [ ] `attendance` check-in/check-out endpoints

### Payments & workflow (Module 5)
- [ ] `payment_verification` — receipt upload + admin approve/reject (Verify Receipts)
- [ ] File upload handling for receipts (`uploads/slips/...` paths exist in `DB.md`, but no multer/static config in backend yet)
- [ ] `payments` — record + list (Payment Flow), revenue aggregation (Revenue Reports)
- [ ] Inquiries — sidebar has a nav entry but no table/endpoint exists yet; needs schema + API

## Frontend

### Routes referenced in `Sidebar`/`DashboardLayout` with no matching `<Route>` in `App.jsx` yet
- [ ] Admin: `/admin/bookings`, `/admin/courts`, `/admin/schedule`, `/admin/requests`, `/admin/members`, `/admin/coaches`, `/admin/inquiries`, `/admin/attendance`, `/admin/verify-payments`, `/admin/payments`, `/admin/reports`, `/admin/announcements`
- [ ] Member: `/member/book`, `/member/schedule`, `/member/history`, `/member/status`, `/member/profile`, `/member/announcements`
- [ ] Coach: `/coach/book`, `/coach/students`, `/coach/sessions`, `/coach/payments`, `/coach/announcements`

### Data wiring
- [ ] `AdminHome.jsx`, `MemberHome.jsx`, `CoachHome.jsx` currently render static mock content — wire to real API data
- [ ] `RegisterPage.jsx` has a file-input UI (`handleFileChange`) but no submit handler — wire to `POST /api/auth/register` (multipart, once upload endpoint exists)
- [ ] Replace scattered `localStorage.getItem('user'/'token')` reads with a shared auth context/hook

## Infra
- [x] Root `.gitignore` covering both `frontend/` and `backend/`
- [x] Request logger middleware (`backend/middleware/logger.js`)
- [x] Role-based route guard (`frontend/src/components/auth/ProtectedRoute.jsx`)
- [ ] Initialize a git repo at the project root and make an initial commit (none of `KGC/`, `KGC/frontend/`, `KGC/backend/` are git repos yet)
- [ ] `.env.example` for both `frontend/` and `backend/` (real `.env` files are gitignored, no template currently checked in)

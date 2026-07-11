# TODO — Kandy Garden Club (KGC)

Grounded in the schema in `DB.md` and the current state of `frontend/` and `backend/`. Checked items are confirmed working in code.

## Backend API

### Access control (Module 1)
- [x] `POST /api/auth/register` — submits to `registration_requests`
- [x] `POST /api/auth/login` — issues JWT, checks `status === 'active'`
- [x] Auth middleware (`verifyToken` + `requireRole`) applied to all protected routes
- [x] `GET /api/auth/me` — resolve current user from token
- [x] Admin: user management — `/api/users` CRUD
- [x] Admin: approve/reject `registration_requests` → create `users` + `members` + `memberships` + `payments` row on approval (full cascade, see `backend/API_DOCS.md`)

### Config & profiles (Modules 2–3)
- [x] `membership_types` CRUD (`/api/membership-types` — GET is public for the registration form, POST/PUT/DELETE are admin-only; delete is blocked with 409 if the plan is still referenced)
- [x] `courts` — list + status toggle (`/api/courts`)
- [x] `members` CRUD (`/api/members`, Member Directory)
- [x] `coaches` CRUD (`/api/coaches`, Coach Profiles)
- [x] `guests` CRUD (`/api/guests`, with search)

### Bookings & attendance (Module 4)
- [x] `POST /api/bookings` — create booking, respects `unique_court_slot`; member/coach self-bookings are free and instantly `confirmed`, admin can book on behalf of a member/coach or create a guest booking with a manual fee (which also creates a linked `payments` row, `payment_type='booking_fee'`). Cancelling/rejecting is a soft status update, and a later booking of that exact slot reuses/overwrites the same row rather than inserting a new one (works around the unique key having no concept of status)
- [x] `GET /api/bookings` — filtered by role (admin: all + `date`/`status`/`court_id` filters; member/coach: own only, server-enforced)
- [x] `GET /api/bookings/availability?date=` — occupied court/slot pairs only, no payer identity, used to render the booking grid
- [x] `PATCH /api/bookings/:id` — `{action: 'cancel'|'reject'|'lock'|'unlock'}`; member/coach may only cancel their own unlocked, non-past booking; admin can do any action on any booking
- [x] `GET /api/time-slots` and `GET /api/courts` (non-admin-gated) — support the booking grid
- [ ] `attendance` check-in/check-out endpoints — explicitly deferred, not part of the bookings pass

### Payments & workflow (Module 5)
- [x] `payment_verification` — admin approve/reject (`/api/payments/pending`, `/approve/:id`, `/reject/:id`), with full registration-approval cascade
- [x] File upload handling for receipts — `multer` saves to `backend/uploads/slips/`, served statically at `/uploads/slips/...`
- [x] `payments` ledger — approving a registration verification creates a `payments` row; `payments.verification_id` (schema addition, see `DB.md`) links it back to the verification that created it
- [x] `GET /api/payments` ledger listing with `type`/`date`/`search` filters
- [x] `GET /api/payments/history` + edit (`/edit/:id`) + undo (`/undo/:id`) for reviewed verifications — undo on an approved registration hard-deletes the created account
- [ ] Booking-type `payment_verification` rows (from the receipt-upload flow) still only get a status update on approve/reject, no cascade to `bookings` — only the new admin-direct `POST /api/bookings` path (Module 4) creates real booking + payment rows so far
- [x] `POST /api/payments/manual` — admin-recorded payment (no receipt/verification queue) for a walk-in New Member (creates `users`+`members`+`memberships`+`payments`), New Coach (creates `users`+`coaches`+`payments`), or a Miscellaneous charge (optionally linked to an existing member); `payments.payment_type` extended with `coach_registration`/`other`, plus `coach_id` and `notes` columns
- [ ] Inquiries — sidebar has a nav entry but no table/endpoint exists yet; needs schema + API

See `backend/API_DOCS.md` for the full endpoint reference.

## Frontend

### Routes referenced in `Sidebar`/`DashboardLayout` with no matching `<Route>` in `App.jsx` yet
- [x] Admin: `/admin/users`, `/admin/members`, `/admin/coaches`, `/admin/guests`, `/admin/courts`, `/admin/verify-payments`, `/admin/payments`, `/admin/membership-types`
- [x] Admin: `/admin/bookings`, `/admin/schedule` (both route to the same `AdminBookings.jsx`), `/admin/announcements`
- [ ] Admin: `/admin/requests`, `/admin/inquiries`, `/admin/attendance`, `/admin/reports`
- [x] Member: `/member/book`, `/member/schedule`, `/member/history`, `/member/announcements`
- [ ] Member: `/member/status`, `/member/profile`
- [x] Coach: `/coach/book`, `/coach/sessions`, `/coach/announcements`
- [ ] Coach: `/coach/students` (no backing schema — not a bookings concept), `/coach/payments`

### Data wiring
- [x] `frontend/src/utils/api.js` — shared `apiFetch` helper, attaches the JWT from `localStorage` to every request (the admin pages were calling the API with no auth header at all, which would have 401'd against the new protected routes)
- [x] AdminUsers/AdminMembers/AdminCoaches/AdminGuests/AdminCourts/AdminReciepts wired to real backend data via `apiFetch`
- [x] `MemberHome.jsx`, `CoachHome.jsx` wired to real profile/membership/announcements/upcoming-bookings data; `AdminHome.jsx` still renders static mock content
- [x] `RegisterPage.jsx` — added Email field + Membership Type dropdown, now submits a real `multipart/form-data` request (with the receipt file) to `POST /api/auth/register` and shows a success/error state
- [ ] Replace scattered `localStorage.getItem('user'/'token')` reads with a shared auth context/hook (`apiFetch` covers the fetch-call side of this, but components still read `localStorage` directly for the current user)

## Infra
- [x] Root `.gitignore` covering both `frontend/` and `backend/`
- [x] Request logger middleware (`backend/middleware/logger.js`)
- [x] Role-based route guard (`frontend/src/components/auth/ProtectedRoute.jsx`)
- [ ] Initialize a git repo at the project root and make an initial commit (none of `KGC/`, `KGC/frontend/`, `KGC/backend/` are git repos yet)
- [ ] `.env.example` for both `frontend/` and `backend/` (real `.env` files are gitignored, no template currently checked in)

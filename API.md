# Kandy Garden Club — API Endpoints

Generated from the live route files (`backend/routes/*.js`), not hand-maintained. Base URL: `http://localhost:5000` in development (`VITE_API_URL` on the frontend, `PORT` on the backend).

**Conventions used below:**
- **Auth** column: `—` means public/no token required. Otherwise it names the required role(s). Every protected route needs `Authorization: Bearer <jwt>`.
- Paths are relative to the mount prefix shown in each section heading.
- `:id`-style segments are route params; validated as positive integers unless noted.
- Routes are listed in the order they're actually declared in code (which matters — Express matches top-down, and a few files rely on a public route being declared *before* a blanket `router.use(verifyToken, ...)` further down).

---

## Contents

- [Auth](#auth--apiauth) · [Health](#health-checks)
- [Bookings](#bookings--apibookings) (public + member/coach/admin)
- [Courts](#courts--apicourts) · [Time slots](#time-slots--apitime-slots) · [Settings](#settings--apisettings) · [Membership types](#membership-types--apimembership-types) · [Announcements](#announcements--apiannouncements) · [Inquiries](#inquiries--apiinquiries) *(public parts)*
- [Admin: dashboard/profile](#admin-dashboard--profile--apiadmin) · [Access mgmt](#access-management--apiusers) · [Members](#member-directory--apimembers) · [Coaches](#coach-directory--apicoaches) · [Guests](#guest-directory--apiguests) · [Staff](#staff-directory--apistaff)
- [Admin: payments/verification](#payments--verification--apipayments) · [Revenue](#revenue-reports--apirevenue) · [Attendance](#attendance--apiattendance)
- [Member portal](#member-portal--apimember) · [Coach portal](#coach-portal--apicoach) · [Weather](#weather--apiweather)

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Public sign-up. Multipart (`receipt` file required) — creates a `registration_requests` row + a pending `payment_verification`, not a live account yet. |
| `POST` | `/login` | — | Username + password → JWT. Always bcrypt-compares even for an unknown username (timing-attack mitigation). |
| `GET` | `/me` | any logged-in role | Current user's `users` row (id, username, role, status). |

## Health checks

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Plain text liveness check. |
| `GET` | `/api/health/db` | — | Runs `SELECT 1` against the pool to confirm DB connectivity. |

---

## Bookings — `/api/bookings`

The one router with the most public surface — the guest-booking widget on the public `/courts` page needs no login at all.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/availability` | — | Occupancy grid (`booked`/`locked`) for a given date — the single source every booking surface (guest/member/coach/admin) renders from. |
| `GET` | `/guest-lookup` | — | Looks up an existing guest by phone/email so a returning guest can reuse their record. |
| `POST` | `/guest-lock` | — | Holds a slot for 5 minutes for a guest (existing or new). Returns a `lock_token` that must be presented to pay. |
| `POST` | `/guest-lock/:id/pay` | — | Multipart (`receipt` + `lock_token` fields). Submits the guest's payment slip for admin review. |
| `GET` | `/` | member, coach, admin | List bookings — self-scoped for member/coach, unrestricted for admin; filterable by date/status/court/`booking_type`. |
| `POST` | `/` | member, coach, admin | Create a booking. Self-service for member/coach (self as the booker); admin can book on behalf of any member/coach/guest. Enforces active-membership and past-slot rules server-side regardless of what the UI shows. |
| `POST` | `/maintenance` | **admin** | Schedules a maintenance block on a court, covering one or more `time_slots` on a single date — body `{ court_id, booking_date, slot_ids: [...] }`. Inserts a `booking_type: 'maintenance'` row per slot in one transaction: if *any* requested slot already has a real booking, the whole request is rejected and nothing is created. Occupies the grid exactly like a real booking (shows as `maintenance`, not `booked`, to every booking surface). |
| `PATCH` | `/:id` | member, coach, admin | Status-transition endpoint — body `{ action }` where `action` is `cancel` \| `reject` \| `lock` \| `unlock` \| `restore`. Self-cancel is member/coach-only and self-scoped; the rest are admin-only. Also how a scheduled maintenance block is undone (`action: 'cancel'` — no dedicated maintenance-cancel endpoint, it's just a booking like any other). |
| `PATCH` | `/:id/details` | **admin** | Corrects a booking's recorded fee amount after the fact; keeps a linked `payments` row in sync. Guest bookings only — 400s if the target booking isn't `booking_type: 'guest'`. |

## Courts — `/api/courts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List bookable courts (incl. `photo_url`, `is_active`) — public court gallery + every booking grid. |
| `GET` | `/all` | **admin** | Same data, admin-facing listing. |
| `POST` | `/:id/photo` | **admin** | Multipart (`photo`). Uploads/replaces a court's public gallery photo. |

There's no whole-court status toggle anymore (`PUT /status/:id` was removed along with `courts.status`) — maintenance is scheduled per date+slot instead, via `POST /api/bookings/maintenance` above.

## Time slots — `/api/time-slots`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | The 16 fixed daily 1-hour blocks. |

## Settings — `/api/settings`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | The full `club_settings` key/value store (fees, bank details, public contact info) — public because the guest-payment flow needs it with no login. |
| `PATCH` | `/` | **admin** | Upsert one or more settings keys. |

## Membership types — `/api/membership-types`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Plan catalog — needed on the public registration form before an account exists. |
| `POST` | `/` | **admin** | Create a plan. |
| `PUT` | `/:id` | **admin** | Edit a plan. |
| `DELETE` | `/:id` | **admin** | Delete a plan (409s cleanly if it's still referenced by a registration/membership). |

## Announcements — `/api/announcements`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Live (non-deleted, published) announcements for the public Updates page. |
| `GET` | `/admin/all` | **admin** | Every announcement, including unpublished/scheduled. |
| `POST` | `/` | **admin** | Create. |
| `PUT` | `/:id` | **admin** | Edit. |
| `DELETE` | `/:id` | **admin** | Soft-delete. |

## Inquiries — `/api/inquiries`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | — | Public contact-form submission. |
| `GET` | `/` | **admin** | List all inquiries. |
| `GET` | `/:id` | **admin** | Fetch one; marks it `read` if it was `unread`. |
| `POST` | `/:id/reply` | **admin** | Sends a real email reply (nodemailer) and marks `replied`. |
| `DELETE` | `/:id` | **admin** | Soft-delete. |

---

## Admin dashboard & profile — `/api/admin`

*(all routes below require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | Overview: revenue summary, member/coach/court counts, recent activity feed, and the `notifications` list (pending plan assignments, unverified receipts, unread inquiries). |
| `GET` | `/me` | The logged-in admin's own profile (joined from `staff`). |
| `PATCH` | `/me` | Update own profile / change password. |

## Access Management — `/api/users`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Every login account across all roles, with a `has_profile` flag (catches a role with no matching `members`/`coaches`/`staff` row). |
| `POST` | `/add` | Create a login + matching profile row in one step (any role). |
| `PUT` | `/update/:id` | Edit username/status/password. Role is immutable after creation. Blocked from disabling/demoting the last active admin. |
| `POST` | `/:id/complete-profile` | Backfill a profile row for an account that was created without one. |

No delete — `status: 'disabled'` (blocked from ever landing on the last active admin) is the only way to deactivate an account.

## Member Directory — `/api/members`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List members with current membership status. |
| `POST` | `/add` | Create a member. Plan is **optional** — selecting one also records the payment. |
| `PUT` | `/update/:id` | Edit profile fields (including `status`); syncs `users.status`. |
| `PUT` | `/:id/membership` | Assign or change a member's plan post-creation, syncing the linked payment. |

No delete — set `status` to `'inactive'`/`'suspended'` instead.

## Coach Directory — `/api/coaches`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/public` | — | Public roster for the home-page coach section — active and `on-leave` coaches both show (on-leave gets a badge), only `inactive` is hidden. Includes `phone`, still excludes `email`. |
| `GET` | `/` | **admin** | Full admin listing. |
| `POST` | `/add` | **admin** | Create a coach. |
| `PUT` | `/update/:id` | **admin** | Edit (including `status`: `active`/`inactive`/`on-leave` — a different enum than members', no `suspended`). |
| `POST` | `/:id/photo` | **admin** | Multipart (`photo`) — profile photo shown publicly. |

No delete — set `status` to `'inactive'`/`'on-leave'` instead.

## Guest Directory — `/api/guests`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List guests (optionally filtered by search) — every guest, any status. |
| `POST` | `/` | Manually create a guest record. |
| `PUT` | `/:id` | Edit (including `status`: `active`/`inactive`). |

No delete or soft-delete/restore — `status` replaced `is_deleted` entirely; set it to `'inactive'` instead.

## Staff Directory — `/api/staff`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List staff (admins/guards/other). |
| `POST` | `/` | Create a staff record. Admin-type records must go through Access Management instead of being edited here. |
| `PUT` | `/:id` | Edit (non-admin staff only, including `status`). |

No delete — set `status` to `'inactive'`/`'suspended'` instead.

## Payments & verification — `/api/payments`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | The settled payments ledger — filterable by type/date/search. |
| `GET` | `/outstanding` | Every unpaid (`status: 'recorded'`) fee, grouped by member/coach — powers the "this person owes X" prompt on the Attendance screen. |
| `POST` | `/manual` | Record a manual payment (new member/coach signup paid off-system, or a misc charge). |
| `PATCH` | `/update/:id` | Correct an existing payment's amount/date/notes/status. |
| `GET` | `/pending` | The receipt-review queue (status `pending`). |
| `GET` | `/history` | Reviewed receipts (approved/rejected), capped at the 100 most recent. |
| `PATCH` | `/approve/:id` | Approve a receipt — cascades into the right side-effect depending on `payment_type`/`settles_payment_id`: activates a registration, confirms a guest booking, extends a membership, settles an outstanding fee, or (every remaining type — donation/tournament fee/cancellation fee/no-show fee/other) simply records a new `payments` row. Every `payment_type` reliably produces or updates a ledger entry — none of them silently approve with no money recorded. |
| `PATCH` | `/reject/:id` | Reject a receipt. For a `booking`-type receipt whose linked booking already resolved independently (e.g. its guest lock expired), this closes the receipt out cleanly instead of erroring — it only still blocks if the booking is already `confirmed` (a real conflict needing a refund decision, not a receipt review one). |
| `PATCH` | `/edit/:id` | Correct a verification's remarks any time. The declared amount can only be edited while the receipt is still `pending` — once a decision's been made, `undo` first if the amount needs correcting. |
| `PATCH` | `/undo/:id` | Reverse an approve/reject back to pending. Cleans up whatever the approval created: deletes the `payments` row it inserted, or reverts a settled fee back to `'recorded'` — so re-approving afterward can't create a duplicate ledger entry or get permanently stuck. Still blocked for an already-approved membership renewal or booking payment (no safe automatic reversal exists for those — the membership/confirmed-booking side effect can't be un-cascaded). |

## Revenue reports — `/api/revenue`

*(all routes require `admin`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/summary` | Totals, trend vs. previous period, breakdown by type, and a day/week/month time series — powers the Reports charts and the dashboard's revenue widget. |
| `GET` | `/transactions` | The raw transaction list backing a given report range (for the exportable table/PDF). |

## Attendance — `/api/attendance`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/my-stats` | member, coach | Own aggregate court-time stats + most frequent playing partner. |
| `GET` | `/my-history` | member, coach | Own check-in/out log. |
| `GET` | `/history` | **admin** | Every check-in ever recorded, filterable by date range/type/search. |
| `GET` | `/` | **admin** | The Daily Attendance table for one date — every confirmed member/coach booking plus who's checked in and any no-show fee status. |
| `POST` | `/checkin` | **admin** | Check someone in (manual time optional). Auto-waives an existing no-show fee on that booking if this is a late check-in. |
| `PATCH` | `/:id/checkout` | **admin** | Check out (manual time optional). |
| `PATCH` | `/:id` | **admin** | Correct a check-in/out record's times. |
| `DELETE` | `/:id` | **admin** | Remove a check-in entirely (wrong person / added by mistake). |
| `POST` | `/:booking_id/no-show` | **admin** | Manually flag a no-show — charge the configured fee, or waive it. |

*(No-show fees are also charged automatically by a background sweep every 5 minutes — see `backend/utils/noShowSweep.js` — this endpoint is for charging sooner or waiving before the sweep gets to it.)*

## Member portal — `/api/member`

*(all routes require `member`)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Own profile. |
| `PATCH` | `/me` | Update own profile / change password. |
| `GET` | `/payments/dues-summary` | Whether the member has any unpaid outstanding fees (surfaced as a warning before booking). |
| `GET` | `/payments` | Own settled payments + own in-flight/reviewed receipt submissions. |
| `POST` | `/payments` | Multipart (`receipt`). Submit a renewal/donation/tournament-fee payment for review. |
| `POST` | `/payments/:paymentId/pay` | Multipart (`receipt`). Settle one specific outstanding fee (e.g. a cancellation charge). |

## Coach portal — `/api/coach`

*(all routes require `coach`; mirrors the member portal minus membership-renewal, since coaches don't have a membership)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Own profile. |
| `PATCH` | `/me` | Update own profile / change password. |
| `GET` | `/payments/dues-summary` | Own outstanding-fee summary. |
| `GET` | `/payments` | Own payments + submissions. |
| `POST` | `/payments` | Multipart (`receipt`). Submit a donation/tournament-fee payment. |
| `POST` | `/payments/:paymentId/pay` | Multipart (`receipt`). Settle one specific outstanding fee. |

## Weather — `/api/weather`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/today` | any logged-in role | Today's forecast for the club's fixed location (Kandy), cached server-side per calendar day. |

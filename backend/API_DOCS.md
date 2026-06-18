# KGC Backend API Reference

Base URL: `http://localhost:5000` (or `VITE_API_URL` on the frontend).

All request/response bodies are JSON. Protected routes require:

```
Authorization: Bearer <jwt>
```

The JWT is issued by `POST /api/auth/login` and stored in `localStorage` by the
frontend. Routes marked **Admin** require `role: 'admin'` on the token (enforced
by `requireRole('admin')`); a non-admin token gets `403`, a missing/invalid
token gets `401`.

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | none | **`multipart/form-data`**, not JSON. Text fields: `full_name, email, phone, username, password, membership_type_id` (all required). File field: `receipt` (JPG/PNG/PDF, max 5MB). Creates a `registration_requests` row (`status: 'pending'`) plus a linked `payment_verification` row (`payment_type: 'registration'`, `amount_declared` = the chosen plan's price). The uploaded file is saved to `backend/uploads/slips/` and deleted again if the request fails validation or hits a duplicate username/email. |
| POST | `/api/auth/login` | none | Body: `{ username, password }`. Returns `{ token, user: { user_id, username, role, status } }`. Fails if account `status !== 'active'`. |
| GET | `/api/auth/me` | any logged-in user | Returns `{ user: { user_id, username, role, status, created_at } }` for the token holder. |

---

## Users — `/api/users` (Admin)

Manages the raw `users` table (login accounts: username/password/role/status).

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/users` | — | `{ data: [{ user_id, username, role, status, created_at }] }`. Password hashes are never returned. |
| POST | `/api/users/add` | `{ username, password, role, status? }` | Creates a login account directly (no linked `members`/`coaches` profile). |
| PUT | `/api/users/update/:id` | `{ username?, password?, role?, status? }` | Partial update. `password` is only re-hashed if non-empty/provided. |
| DELETE | `/api/users/delete/:id` | — | Deletes the user. Cascades to `members`/`coaches` if linked. |

---

## Members — `/api/members` (Admin)

Each member is a `users` row (`role: 'member'`) plus a linked `members` profile row, created/deleted together.

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/members` | — | `{ data: [{ member_id, user_id, full_name, email, phone, status, created_at }] }`. |
| POST | `/api/members/add` | `{ username, password, full_name, email, phone, status? }` | Creates `users` + `members` rows in one transaction. |
| PUT | `/api/members/update/:id` | `{ full_name, email, phone, status }` | Updates the `members` row only (`:id` is `member_id`). Username/password aren't editable here — use `/api/users/update/:id`. |
| DELETE | `/api/members/delete/:id` | — | Deletes the linked `users` row, which cascades to delete the `members` row. |

---

## Coaches — `/api/coaches` (Admin)

Same pattern as Members, with coach-specific fields.

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/coaches` | — | `{ data: [{ coach_id, user_id, full_name, email, phone, specialization, experience_years, status, created_at }] }`. |
| POST | `/api/coaches/add` | `{ username, password, full_name, email, phone, specialization?, experience_years?, status? }` | Creates `users` (`role: 'coach'`) + `coaches` rows in one transaction. |
| PUT | `/api/coaches/update/:id` | `{ full_name, email, phone, specialization, experience_years, status }` | Updates the `coaches` row only (`:id` is `coach_id`). |
| DELETE | `/api/coaches/delete/:id` | — | Deletes the linked `users` row, which cascades to delete the `coaches` row. |

---

## Guests — `/api/guests` (Admin)

Standalone table, no linked `users` account (walk-in/non-member bookings).

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/guests?search=<text>` | — | Returns a **plain array** (not wrapped in `data`). `search` matches `full_name` or `phone` (`LIKE`). |
| POST | `/api/guests` | `{ full_name, phone, email? }` | Creates a guest. |
| PUT | `/api/guests/:id` | `{ full_name, phone, email? }` | Updates a guest (`:id` is `guest_id`). |
| DELETE | `/api/guests/:id` | — | Deletes a guest. |

---

## Courts — `/api/courts` (Admin)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/courts/all` | — | `{ data: [{ court_id, court_name, court_type, status, is_active, created_at }] }`. |
| PUT | `/api/courts/status/:id` | `{ status: 'available' \| 'maintenance' }` | Toggles a court's operational status. |

---

## Payments — `/api/payments` (Admin)

Two related but distinct things live under this prefix: the **payments ledger**
(actual recorded transactions) and the **verification queue** (slips awaiting
or having received a decision). Receipt images are served statically from
`/uploads/slips/...`.

### Ledger

| Method | Path | Query params | Description |
|---|---|---|---|
| GET | `/api/payments` | `type` (`membership`\|`booking_fee`), `date` (`YYYY-MM-DD`, exact day), `search` (matches payer name) — all optional | `{ data: [{ payment_id, amount, payment_date, payment_type, member_id, booking_id, verification_id, handled_by, status, payer_name }] }`. Backs the admin Payment History page. |

### Verification queue

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/payments/pending` | — | Plain array of pending verification rows, with `full_name`/`email` resolved from `registration_requests` (registration payments) or `members`/`guests` via `bookings` (booking payments). |
| GET | `/api/payments/history` | — | Plain array of the most recent 100 **reviewed** (approved or rejected) verification rows, same shape as `/pending`, newest `reviewed_at` first. |
| PATCH | `/api/payments/approve/:id` | `{ remarks? }` | Approves the verification. `reviewed_by` comes from the token, not the request body. Behavior branches on `payment_type` — see below. Returns `409` if it's not currently `pending`. |
| PATCH | `/api/payments/reject/:id` | `{ remarks? }` | Rejects the verification. Same branching/guard as approve. |
| PATCH | `/api/payments/edit/:id` | `{ remarks?, amount_declared? }` | Corrects the record after the fact — works regardless of status. If a `payments` row was already created from this verification (tracked via `payments.verification_id`), its `amount` is updated to match so the ledger stays consistent. |
| PATCH | `/api/payments/undo/:id` | — | Reverses an approve/reject back to `pending`. For an approved **registration**, this deletes the `payments` row and the `users` row it created (which cascades to `members`/`memberships`) — a real account deletion, not just a flag flip. If the member has other activity since (e.g. bookings), the database's FK constraints block the delete and this returns `409` instead of silently failing. Returns `409` if the verification is already `pending`. |

Re-reviewing an already-approved/rejected verification returns `409` instead
of re-running the cascade (prevents double-clicking from creating a duplicate
account).

### `payment_type: 'registration'` — full approval cascade

Approving runs all of the following in a single transaction:
1. `users` row created (`role: 'member'`, `status: 'active'`) — reuses the
   `password_hash` already stored on the registration request, so the
   applicant's original password keeps working without re-hashing.
2. `members` row created, linked to the new user.
3. `memberships` row created (if the request had a `membership_type_id`):
   `purchase_price`/duration come from `membership_types`, `start_date` is
   today, `end_date` is `start_date + duration_months`, `status: 'active'`.
4. `payments` row created: `amount` = the verification's `amount_declared`,
   `payment_type: 'membership'`, `handled_by` = the reviewing admin,
   `status: 'completed'`.
5. `registration_requests.status` → `'approved'`, with `reviewed_by`/`reviewed_at`.
6. `payment_verification.status` → `'approved'`.

Rejecting only sets `registration_requests.status` → `'rejected'` and
`payment_verification.status` → `'rejected'` — no account is created.

### Other `payment_type`s (`booking`, `membership_renewal`, `other`)

No cascade exists yet — approve/reject just updates the `payment_verification`
row's status/reviewer/remarks. Booking creation itself isn't built yet either
(see `TODO.md`).

---

## Membership Types — `/api/membership-types`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/membership-types` | none | `{ data: [{ membership_type_id, name, duration_months, price }] }`. Public — used by the registration form to populate the plan dropdown. No create/update/delete yet (see `TODO.md`). |

---

## Role-scoped dashboard stubs

`/api/admin/dashboard`, `/api/member/dashboard`, `/api/coach/dashboard` — each
requires the matching role and returns `{ message: "Welcome, <username>." }`.
Placeholders for future role-specific features.

# Kandy Garden Club — Bug Report

A record of every bug found during this project's QA passes: three audit rounds (logic/security loopholes, critical flow-breaking bugs, and a final sweep of previously-unreviewed areas), each followed by fixes verified against the live database or a live server request — not just read-through review. This is a project log, not a live tracker — check current code/git history for anything that's moved since.

**Summary:** 22 real bugs found, 20 fixed and verified, 1 partially mitigated (full fix would require a data-cleanup step), 1 left open by choice. Plus 2 suspected issues that turned out to already be handled — kept here so they aren't "rediscovered" later.

---

## Contents

- [Critical](#critical)
- [High](#high)
- [Medium](#medium)
- [Low / minor](#low--minor)
- [Known open issues](#known-open-issues)
- [Investigated, not a bug](#investigated-not-a-bug)

---

## Critical

### BUG-001 — Booking IDs silently reused across different people's bookings
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`bookings.unique_court_slot` was a raw `UNIQUE(court_id, booking_date, slot_id)`, blind to status. When a booking was cancelled/rejected, the next booking for that same slot **overwrote the same row** (same `booking_id`) instead of getting a new one. Any payments already recorded against the original booking (cancellation fee, no-show fee, booking fee) stayed pointed at that `booking_id`, now silently misattributed to a completely different person. Confirmed live in the database before the fix: one booking's `payments` history mixed a member's cancellation fee with a different coach's later no-show fee on the same row.

**Fix:** `backend/utils/schemaBootstrap.js` — replaced the raw unique key with a `UNIQUE` index on a *generated column* (`active_slot_key`) that's only non-`NULL` while a booking is `pending`/`confirmed`. `bookingController.createBooking`/`createGuestLock` no longer `UPDATE` a freed-up row — they always `INSERT` a fresh one. Verified live: cancelling and re-booking the same slot now produces two distinct `booking_id`s with untouched payment history, while double-booking an active slot still correctly fails.

### BUG-002 — Unauthenticated payment-hijack on the public guest-booking flow
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`POST /api/bookings/guest-lock/:id/pay` had no auth (by design — guests have no account) and never verified the caller was the person who created the lock. Anyone who could guess/enumerate a `booking_id` could submit a fake receipt against a stranger's active 5-minute hold, freezing their slot until an admin manually rejected the fraudulent submission.

**Fix:** `createGuestLock` now returns a random `lock_token`; `submitGuestPayment` rejects any submission that doesn't present the matching token. Verified live: no-token and wrong-token attempts both 403, correct token succeeds. Also added a guard against piling up duplicate pending submissions on one booking.

### BUG-003 — `deleteMember` / `deleteCoach` crash with a raw SQL error
**Status:** ✅ Fixed · **Found in:** critical-bugs audit

Both relied on `ON DELETE CASCADE` from `users` → `members`/`coaches`, but `bookings.member_id`/`coach_id`/`created_by_user_id` are `ON DELETE RESTRICT`. Any member/coach who had ever booked a court — the normal case, not an edge one — made the delete 500 with a raw MySQL constraint error. Verified live against real accounts (member #30, coach #2, both with real booking history).

**Fix:** both controllers now catch `ER_ROW_IS_REFERENCED_2` and return a clean 409 ("has booking/payment history — disable the account instead"). Frontend delete buttons (`AdminMembers.jsx`, `AdminCoaches.jsx`) also stopped silently swallowing the response — they now surface the message.

### BUG-004 — Silent failure submitting a payment receipt (bad file type / too large)
**Status:** ✅ Fixed · **Found in:** critical-bugs audit

`authRoutes.js` correctly wrapped multer's upload middleware to convert a rejected file into clean JSON — but that fix was never applied to guest-lock/pay, member-payments, or coach-payments. A rejected upload (phone photo >5MB is extremely common) fell through to Express's default HTML error page. The frontend then called `res.json()` on that HTML, threw an unhandled `SyntaxError`, and the error message never displayed — the submit button just silently re-enabled.

**Fix:** added a shared `singleUpload()` wrapper in `backend/middleware/upload.js`, applied to all 7 file-upload routes across the app. Frontend hardened with a `parseErrorMessage()` helper (`utils/api.js`) so even a genuinely non-JSON error response can't throw unhandled.

### BUG-005 — Booking-date logic used UTC instead of local time
**Status:** ✅ Fixed · **Found in:** critical-bugs audit

`todayISO()` (`new Date().toISOString().slice(0,10)`), duplicated across 17 files, always returns the **UTC** calendar date. Sri Lanka is UTC+5:30, so between roughly 00:00–05:30 local time, "today" resolved to *yesterday* everywhere — the date picker's default/minimum, and the `isToday` check the past-slot-locking feature depends on.

**Fix:** one shared, correct `frontend/src/utils/date.js` (local `getFullYear`/`getMonth`/`getDate`) replacing all 17 duplicated definitions; three backend spots switched to MySQL's `CURDATE()` (self-cancel past-booking check, membership-renewal start-date calc, revenue report default range); two schema-validation/cache spots (no DB access available) use a fixed +5:30 offset instead.

---

## High

### BUG-006 — Concurrent double-approval of a payment verification
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`reviewVerification`/`undoVerification` fetched the verification row with a plain, non-transactional query *before* opening a transaction. Two concurrent requests for the same `verification_id` (double-click, retry, two admin tabs) could both pass the "still pending?" check before either committed — duplicating a membership grant or a payment insert.

**Fix:** the row is now locked (`SELECT ... FOR UPDATE`) and re-checked *inside* the transaction. Verified live: approving the same record twice in a row now correctly 409s the second attempt.

### BUG-007 — Undo → reject could flip an already-paid, confirmed booking to "rejected"
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`undoVerification` didn't special-case an approved `'booking'`-type verification the way it already did for `membership_renewal`. Undo-then-reject on an approved guest-booking payment would flip a real, paid booking straight to `rejected` with no reversal of the underlying payment.

**Fix:** blocked undo on an already-approved `'booking'` verification (same reasoning/message pattern as the existing `membership_renewal` guard); `rejectGuestBooking` also now checks the booking is still `pending` before touching it, as defense in depth.

### BUG-008 — `undoRegistration` looked up the created account by a mutable username
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

If an approved member's `username` was ever changed via Access Management, "undo" on their original registration would silently fail to delete the account it created — but *would* still delete the linked payment record and reset the registration to pending, opening the door to a duplicate account on re-approval.

**Fix:** added `registration_requests.created_user_id`, set once at approval time; undo now looks up by that stable ID. One-time backfill applied for pre-existing approved rows (2 of 3 couldn't be matched — their usernames had already diverged; not recoverable retroactively, but every future approval is solid).

### BUG-009 — "Restore" bypassed the slot-time and collision checks it should have inherited
**Status:** ✅ Fixed · **Found in:** logic/loophole audit (feature built earlier this session)

The admin "restore a cancelled booking" action didn't validate the slot's time hadn't already passed, nor check whether the freed slot had since been claimed by someone else — both rules every *other* booking-mutation path enforces.

**Fix:** restore now re-checks both conditions before flipping status back to `confirmed`, with clean error messages for each.

### BUG-010 — Stuck-forever loading spinner on every booking grid
**Status:** ✅ Fixed · **Found in:** critical-bugs audit

None of the 4 booking pages' courts/time-slots fetches had a `.catch()` or checked `res.ok`. A network hiccup, or simply an expired login token (a valid-JSON 401), left `courts`/`slots` permanently empty with `CourtSlotGrid`'s "Loading courts and time slots..." showing forever — no error, no retry.

**Fix:** new shared `useCourtsAndSlots` hook (`frontend/src/hooks/`) gives all 4 pages a real error state and a "Try again" button.

---

## Medium

### BUG-011 — Coach payment submission had a check-then-act race the member side didn't
**Status:** ✅ Fixed · **Found in:** critical-bugs audit

`memberPaymentController` wraps its "no duplicate pending submission" check in a transaction with a row lock; `coachPaymentController` did the same check with three unguarded, unlocked statements. A double-click on "pay outstanding fee" could create two pending receipts for the same fee (wouldn't double-charge on approval, but left a stuck duplicate for an admin to clean up).

**Fix:** brought `coachPaymentController` up to the same transaction/lock pattern as the member side.

### BUG-012 — Admin `staff.status` not synced with `users.status` at account creation
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`updateUser` already kept a member/coach/admin's Directory `status` in sync on every *edit*, but the initial *creation* path silently forwarded no status at all — a newly-created admin with login status `disabled` still showed as `active` in the Staff Directory until the first unrelated edit touched the row.

**Fix:** both admin-creation paths (`createUser`, `completeProfile`) now translate and forward the actual login status via the existing `toProfileStatus()` helper.

### BUG-013 — Membership-renewal payments never linked back to the membership they paid for
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

`approveMembershipRenewal` inserted a `payments` row without setting `membership_id`. A later "assign/edit membership" correction (which looks up the existing payment *by* `membership_id`) couldn't find it and inserted a second, duplicate payment for the same term instead of updating the original.

**Fix:** the renewal's payment insert now captures and sets the new membership row's ID.

### BUG-014 — Abandoned guest payment holds never got cleaned up
**Status:** ✅ Fixed · **Found in:** logic/loophole audit

A guest's 5-minute payment window could lapse with no receipt ever submitted, leaving the booking permanently `pending` unless someone else happened to book that exact slot again later.

**Fix:** new `backend/utils/guestLockSweep.js`, run at boot and every 5 minutes (same pattern as the existing no-show sweep) — closes out any expired, unpaid lock as `cancelled`. Verified live with three synthetic cases (abandoned/expired, awaiting-review, still-active) — only the genuinely abandoned one got touched.

### BUG-015 — Late check-in left a no-show fee charged after all, with no reconciliation
**Status:** ✅ Fixed · **Found in:** follow-up to the no-show sweep design

If the automatic no-show sweep charged a fee before an admin got around to checking someone in late, nothing ever reversed the fee — a real attendance record and a still-owed no-show charge sat side by side with no link between them.

**Fix:** `checkIn` now automatically waives any existing `no_show_fee` payment (still unpaid/`recorded`) on that same booking when a late check-in comes in. Verified live end-to-end.

### BUG-016 — `AdminReciepts.jsx` could crash the whole Receipt Audit page
**Status:** ✅ Fixed · **Found in:** final sweep

`getPendingVerifications`/`getVerificationHistory` return a bare array on success but `{message, error}` on a 500. Neither the page's mount-time fetch nor its refetch helper checked `res.ok` or confirmed the result was actually an array — a transient backend error turned `slips.map is not a function` into a blank, crashed page with no recovery but reload.

**Fix:** both fetch helpers now check `res.ok && Array.isArray(data)` before setting state, same guard already present in `AdminGuests.jsx`.

### BUG-017 — Login had a timing-based account-enumeration side channel
**Status:** ✅ Fixed · **Found in:** final sweep

The error message was correctly identical either way ("Invalid username or password"), but `bcrypt.compare` — a deliberately slow operation — only ran when the username actually existed. Response latency alone revealed whether an account existed.

**Fix:** `login` now always runs the bcrypt compare, against a fixed dummy hash when the username isn't found. Verified live: both cases now land in the same ~0.11–0.13s range.

---

## Low / minor

### BUG-018 — Two admin pages silently swallowed delete errors
**Status:** ✅ Fixed · **Found in:** final sweep

`AdminAnnouncements.jsx` and `AdminInquiries.jsx`'s delete handlers had no `else`/error branch at all — a failed delete (double-click, transient error) left the row still there with zero explanation, unlike every other admin delete page in the app.

**Fix:** both now show `alert(err.message)` on failure, matching the rest of the app's convention.

### BUG-019 — `guestController.updateGuest` didn't respect soft-delete
**Status:** ✅ Fixed · **Found in:** final sweep

Every other guest mutation (`deleteGuest`, `restoreGuest`) filtered on `is_deleted`; `updateGuest` didn't, so a soft-deleted guest's record could still be silently edited via a direct request against its still-valid ID. Low practical impact — the UI never exposes a deleted guest's ID to edit — but verified live with a synthetic soft-deleted guest.

**Fix:** added the same `AND is_deleted = 0` guard.

### BUG-020 — `inquiryController.replyToInquiry` didn't respect soft-delete
**Status:** ✅ Fixed · **Found in:** final sweep

An inquiry soft-deleted from another tab while an admin still had it open could still receive a real emailed reply and flip to `replied`.

**Fix:** added the same `is_deleted = 0` guard used by the list/detail endpoints.

### BUG-021 — `revenueController` groupBy — investigated as a potential crash risk
**Status:** ⚠️ Was already safe · **Found in:** critical-bugs audit

Suspected: an invalid `groupBy` query param would interpolate as literal `undefined` into SQL and 500. **Turned out to already be blocked** by route-level zod validation (`revenueQuerySchema`) that the initial read of the controller alone didn't surface — confirmed live (`groupBy=bogus` returns a clean validation error, not a 500). A defensive fallback (`GROUP_EXPR[groupBy] || GROUP_EXPR.day`) was added anyway as free insurance, since it's harmless and protects any future caller that bypasses route validation.

### BUG-022 — Membership-plan creation — investigated as a potential validation gap
**Status:** ⚠️ Was already safe · **Found in:** critical-bugs audit

Suspected: a negative price or non-positive `duration_months` could be written straight to the database with no validation. **Turned out to already be validated** by the existing zod schema (`duration_months` required `.positive()`, `price` required `.nonnegative()`) — confirmed by direct schema testing. No change made.

---

## Known open issues

### ISSUE-001 — Guest phone/email de-duplication has no DB-level constraint
**Status:** 🟡 Partially mitigated

`guests.phone`/`email` have no `UNIQUE` constraint — de-duplication was, until this session, purely an application convention (`lookupGuest` was a courtesy the frontend called first, never enforced server-side). A handful of historical duplicate guest records already exist from before this was tightened up (confirmed live: one phone number shared by 4 pre-existing guest rows).

**What was done:** both guest-creation paths (`createGuestLock`, and the admin-guest branch of `createBooking`) now re-check by phone under a row lock before inserting, so **no new duplicates** can be created going forward.

**What's still open:** a real DB-level `UNIQUE` constraint can't be added without first merging the existing duplicate guest records' booking/payment history onto one canonical `guest_id` — a data-cleanup task, not a code fix, and one that needs a judgment call on which record is canonical per duplicate. Left undone deliberately rather than guessed at.

### ISSUE-002 — No automated test suite
**Status:** 🟡 Open, by design so far

Neither `backend` nor `frontend` has a real test suite (`backend/package.json`'s `test` script is a placeholder). Every fix in this report was verified by hand: live (or transaction-wrapped, rolled-back) queries against the real database, and/or a real HTTP request against a running server. That's been effective so far but doesn't leave behind a regression safety net for the next change.

---

## Investigated, not a bug

A handful of areas were reviewed carefully across the three audit passes and found genuinely solid — listed here so they aren't re-flagged as suspicious by a future pass without cause:

- `authController.register` — cleans up its uploaded file on every failure path, zod-validates everything server-side, `ER_DUP_ENTRY` → clean 409.
- `memberPortalController` / `coachPortalController` / `utils/selfProfile.js` — username/email collisions on self-update are caught cleanly; current-password check happens under a row lock inside a transaction; every field is re-validated server-side, not just client-side.
- `announcementController.js` — consistent `is_deleted` filtering everywhere, no FK-crash risk (soft-delete only).
- `membershipTypeController.deleteMembershipType` — already correctly catches `ER_ROW_IS_REFERENCED*` and returns a clean 409.
- Every public-facing page (`Home`, `Membership`, `Updates`, `Courts`, and their fetch-driven child components) — loading/error states all guard correctly, no stuck spinners or crashes found on empty/error data.
- The entire auth/permission layer — every admin-only route file, every self-service ownership check (booking cancel, payment history, profile update) was checked and found correctly scoped to the calling user; the only real gap found was BUG-002 above.

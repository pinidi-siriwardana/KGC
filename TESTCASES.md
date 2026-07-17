# Kandy Garden Club — Test Cases

A manual test plan — there's no automated test suite yet (see `BUG_REPORT.md`, ISSUE-002), so this is what stands in for one. Each case has an ID, priority, preconditions, steps, and expected result. **P0** = breaks a core flow if wrong, **P1** = important but not launch-blocking, **P2** = edge case / polish.

Several cases below are **regression tests** tied directly to a fixed bug in `BUG_REPORT.md` — those are marked explicitly, since they exist specifically to catch that exact bug coming back.

---

## Contents

1. [Authentication & registration](#1-authentication--registration)
2. [Public site & guest booking](#2-public-site--guest-booking)
3. [Member portal](#3-member-portal)
4. [Coach portal](#4-coach-portal)
5. [Admin — access & directories](#5-admin--access--directories)
6. [Admin — bookings](#6-admin--bookings)
7. [Admin — daily attendance & no-show](#7-admin--daily-attendance--no-show)
8. [Admin — payments & verification](#8-admin--payments--verification)
9. [Admin — club settings & dashboard](#9-admin--club-settings--dashboard)
10. [Background jobs & timing](#10-background-jobs--timing)
11. [Regression suite (tied to fixed bugs)](#11-regression-suite-tied-to-fixed-bugs)

---

## 1. Authentication & registration

| ID | Priority | Case |
|---|---|---|
| AUTH-01 | P0 | Register as a new applicant with a valid membership plan + receipt upload → confirm a `pending` `registration_requests` row is created, **no** login works yet. |
| AUTH-02 | P0 | Log in with a correct username/password → redirected to the correct dashboard for that role (`/admin/dashboard`, `/member/dashboard`, `/coach/dashboard`). |
| AUTH-03 | P0 | Log in with a wrong password → generic "Invalid username or password", no indication of which part was wrong. |
| AUTH-04 | P1 | Log in with a username that doesn't exist at all → **identical** error message and similar response time to AUTH-03 (see REG-11). |
| AUTH-05 | P1 | Log in to an account with `status = 'pending'` or `'disabled'` → blocked with a clear "contact an administrator" message, not a generic auth failure. |
| AUTH-06 | P1 | Register with a receipt file over the upload size limit (or wrong file type, e.g. `.exe`) → a clear on-screen error, not a blank/stuck submit button (see REG-04). |
| AUTH-07 | P2 | Register with a username/email that's already pending review → clean 409, not a raw DB error. |
| AUTH-08 | P1 | JWT expires or is tampered with → any protected page redirects to login rather than hanging or crashing. |

## 2. Public site & guest booking

| ID | Priority | Case |
|---|---|---|
| GUEST-01 | P0 | On `/courts`, open the booking widget, pick an open slot for today or a future date → slot locks for 5 minutes, countdown visible. |
| GUEST-02 | P0 | Complete the guest lock with a **new** phone number, upload a receipt → submission lands in the admin's "Verify Receipts" pending queue. |
| GUEST-03 | P0 | Approve that guest's receipt as admin → booking flips to `confirmed`, slot shows as booked on the public grid. |
| GUEST-04 | P1 | Let a guest's 5-minute lock expire without submitting a receipt → slot becomes bookable again by someone else (may take up to 5 min for the background sweep — see BG-02). |
| GUEST-05 | P1 | Look up a **returning** guest by the same phone number used before → their existing record is reused, no duplicate guest created (see REG-09). |
| GUEST-06 | P1 | Try to book a slot whose end time has already passed today → rejected client-side (slot shows "Passed") and server-side if attempted directly. |
| GUEST-07 | P2 | Try to submit a payment slip for a `booking_id` you didn't create (e.g. by editing the request) → rejected, doesn't hijack someone else's hold (see REG-02). |
| GUEST-08 | P1 | Submit the public contact form → lands in Admin → Inquiries as `unread`. |

## 3. Member portal

| ID | Priority | Case |
|---|---|---|
| MEM-01 | P0 | Log in as a member with an active plan → book an open court slot → booking appears `confirmed` immediately (no payment step — covered by membership). |
| MEM-02 | P0 | Log in as a member with **no** membership plan (or an expired one) → attempt to book → blocked with a clear message, both in the UI and if called directly against the API. |
| MEM-03 | P0 | Self-cancel a `confirmed` booking for a future date → status flips to `cancelled`, a cancellation fee is charged per `club_settings.cancellation_fee`. |
| MEM-04 | P1 | Attempt to self-cancel a booking an admin has explicitly **locked** → blocked with a clear message. |
| MEM-05 | P1 | Attempt to self-cancel a **past** booking → blocked. |
| MEM-06 | P1 | Submit a membership-renewal payment with a receipt → lands in the admin pending queue as `membership_renewal`; approving it extends `end_date` from the current expiry (not from today, if the current term hasn't lapsed yet). |
| MEM-07 | P1 | Pay off an existing outstanding fee (e.g. the cancellation fee from MEM-03) via "Pay Now" → creates a `settles_payment_id`-linked verification; approving it flips that specific payment to `completed`, doesn't create a new charge. |
| MEM-08 | P2 | Double-click "Pay Now" on the same outstanding fee → only one pending submission is created, not two (see REG-01 for the coach-side version of this bug). |
| MEM-09 | P1 | Change your own email to one already used by another account → clean "already in use" error, not a raw DB error. |
| MEM-10 | P0 | View "My Attendance" and "My Schedule" → only your own bookings/check-ins appear, never another member's. |
| MEM-11 | P1 | As a member with `status` other than active-and-current (expired membership), confirm the `MembershipGate` blocks booking-related pages but still allows profile/inquiry/weather/attendance pages. |

## 4. Coach portal

| ID | Priority | Case |
|---|---|---|
| COACH-01 | P0 | Log in as a coach, book an open slot → confirms immediately, no membership check applied (coaches don't need one). |
| COACH-02 | P0 | Self-cancel a future confirmed booking → cancellation fee charged, same as the member flow. |
| COACH-03 | P1 | Submit a donation/tournament-fee payment with a receipt → appears in the admin pending queue with the correct `payment_type`. |
| COACH-04 | P1 | Pay off an outstanding fee, same as MEM-07, scoped to `coach_id` instead of `member_id`. |
| COACH-05 | P2 | Upload a payment receipt over the size limit → clear on-screen error (see REG-04). |

## 5. Admin — access & directories

| ID | Priority | Case |
|---|---|---|
| ADM-01 | P0 | Create a new member/coach/admin login from Access Management → both the `users` row and the matching profile row (`members`/`coaches`/`staff`) are created together. |
| ADM-02 | P1 | Create a new admin account with `status: 'disabled'` → the Staff Directory shows them as `inactive`/`suspended` immediately, not `active` (see REG-07). |
| ADM-03 | P0 | Attempt to delete or disable the **last active admin** → blocked with a clear message. |
| ADM-04 | P0 | Delete a member or coach who has **existing booking history** → clean 409 ("has booking or payment history — disable instead"), not a raw crash (see REG-03). |
| ADM-05 | P1 | Delete a member/coach with **no** booking history at all → succeeds cleanly. |
| ADM-06 | P1 | Add a member with **no** membership plan selected → member is created, no payment recorded; assign a plan later from the Member Directory → payment recorded at that point. |
| ADM-07 | P1 | Add a member and select a plan at creation time → both the membership and its payment are recorded in the same step. |
| ADM-08 | P1 | Soft-delete a guest, then attempt to edit that same guest's record directly → rejected (404), not silently applied (see REG-06). |
| ADM-09 | P1 | Restore a soft-deleted guest/staff record → reappears in the directory, fully editable again. |
| ADM-10 | P2 | Attempt to edit/delete an **admin-type** staff record from the Staff Directory (rather than Access Management) → blocked, admins are managed from Access Management only. |
| ADM-11 | P1 | Upload a coach or court photo → appears immediately on the public site (home page coaches, `/courts` gallery); replacing a photo removes the old file from disk. |

## 6. Admin — bookings

| ID | Priority | Case |
|---|---|---|
| BOOK-01 | P0 | Book a court on behalf of a member with an **expired or missing** membership → blocked, same rule as MEM-02 but from the admin side. |
| BOOK-02 | P0 | Cancel a `confirmed` booking as admin → status flips to `cancelled`, **no** fee charged to the member/coach (admin-initiated cancels are free — only self-cancel charges a fee). |
| BOOK-03 | P0 | Reject a `pending` booking as admin → status flips to `rejected`. |
| BOOK-04 | P1 | Restore a cancelled/rejected booking → flips back to `confirmed`; if it had an unpaid cancellation fee, that fee is auto-waived. |
| BOOK-05 | P1 | Attempt to restore a booking whose slot's time has already passed → blocked with a clear message (see REG-05). |
| BOOK-06 | P1 | Attempt to restore a booking whose slot has since been claimed by someone else → blocked with a clear message. |
| BOOK-07 | P1 | Lock a `confirmed` booking, then have that member/coach attempt to self-cancel it → blocked. Unlock it → self-cancel now succeeds. |
| BOOK-08 | P1 | Edit a booking's recorded amount (e.g. correcting a guest fee) → the linked `payments` row (if any) updates to match, not a second row. |
| BOOK-09 | P0 | Try to book a slot for **today** whose end time has already passed (e.g. it's 2:05pm, try the 1–2pm slot) → blocked; the **1:30–2:30pm** slot at 2:05pm should still be **bookable** (locking is end-time-based, not start-time). |
| BOOK-10 | P1 | As admin, book a slot for a **past date** → allowed (admin is exempt from the past-*date* rule, for backfilling), but the past-*time-today* rule (BOOK-09) still applies to admin too. |
| BOOK-11 | P0 | Two people attempt to book the exact same court/date/slot simultaneously → exactly one succeeds, the other gets a clean "already booked" conflict, never both. |
| BOOK-12 | P1 | Cancel a booking, then book the **exact same** court/date/slot again → the new booking gets a **different** `booking_id`; the original's payment history is untouched (see REG-08 in the regression suite). |
| BOOK-13 | P2 | The court-schedule grid on Admin/Member/Coach/Guest surfaces all show identical availability for the same date at the same moment. |

## 7. Admin — daily attendance & no-show

| ID | Priority | Case |
|---|---|---|
| ATT-01 | P0 | Check in a member/coach for their confirmed booking today → attendance row created; check them out later → `checkout_time` recorded. |
| ATT-02 | P1 | Manually enter a check-in/check-out time (rather than "now") → recorded exactly as entered, validated against the booking's own date. |
| ATT-03 | P1 | Search and add an attendee to a session from a long member/coach list → search + pagination both work, correct person gets checked in. |
| ATT-04 | P0 | Manually flag a no-show on a booking whose slot time has passed with nobody checked in → fee charged per `club_settings.no_show_fee`. |
| ATT-05 | P1 | Flag a no-show with the "waive" option checked → no fee charged, but the booking is still marked as reviewed (won't be picked up by the automatic sweep). |
| ATT-06 | P1 | Attempt to mark a no-show **before** the slot's time has ended → blocked. |
| ATT-07 | P1 | Attempt to mark a no-show on a booking that already has attendance recorded → blocked ("already has attendance"). |
| ATT-08 | P1 | Check someone in **after** the automatic sweep already charged them a no-show fee → the fee is automatically waived at check-in time (see REG-10). |
| ATT-09 | P1 | Waive a no-show fee, then undo the waive → fee returns to `recorded` (owed) status. |
| ATT-10 | P1 | Delete a mistaken check-in (wrong person selected) → attendance record removed, booking becomes eligible for no-show handling again as if nobody had checked in. |
| ATT-11 | P1 | Attendance History — filter by date range, type (member/coach), and search by name → results match the filters; edit action from this table works the same as from the daily view. |
| ATT-12 | P2 | Guest bookings never appear anywhere in the attendance or no-show flow — confirm they're excluded (no account exists to charge). |

## 8. Admin — payments & verification

| ID | Priority | Case |
|---|---|---|
| PAY-01 | P0 | Approve a pending registration → creates the real account (`users`+`members`), opens the membership term, records the payment, all together. |
| PAY-02 | P1 | Reject a pending registration → request marked rejected, **no** account created. |
| PAY-03 | P1 | Undo an approved registration → deletes the account it created, resets the request to pending; re-approve it → works cleanly, no duplicate account. |
| PAY-04 | P1 | Approve a guest's booking-payment receipt → booking confirms, `payments` row created with the declared amount. |
| PAY-05 | P0 | Attempt to approve the **same** verification twice in quick succession (e.g. two rapid clicks) → only processed once; the second attempt gets a clean "already approved" (see REG-12). |
| PAY-06 | P1 | Attempt to undo an **approved** `membership_renewal` or `booking`-type verification → blocked with a clear explanation (no safe automatic reversal exists for either). |
| PAY-07 | P1 | Edit a pending verification's declared amount → both the verification and its linked `payments` row (if any already exists) update together. |
| PAY-08 | P1 | Manually record a payment (new member/coach paid off-system, or a misc charge) from the Payments page → ledger entry created correctly, correct `payment_type`. |
| PAY-09 | P1 | Correct an existing payment's amount/date/status directly from the ledger → updates in place. |
| PAY-10 | P1 | Search/filter the Revenue Reports page by date range and payment type → totals, trend %, and the chart all reflect the filtered range; PDF export matches what's on screen. |

## 9. Admin — club settings & dashboard

| ID | Priority | Case |
|---|---|---|
| SET-01 | P0 | Update the club address/email/phone/opening hours from Club Settings → changes appear on the public Home page's Contact section and the site footer without a deploy. |
| SET-02 | P1 | Add a social media link (Facebook/Instagram/X) → icon appears in the public footer, linking correctly; leave one blank → that icon simply doesn't render (not a dead `#` link). |
| SET-03 | P1 | Change the cancellation fee / guest booking fee / no-show fee amounts → subsequent self-cancels / guest bookings / no-shows charge the new amount; already-recorded historical payments are untouched. |
| SET-04 | P0 | Dashboard home page loads with: revenue chart, stat cards, recent-activity feed, and the Notifications panel (pending plan assignments / unverified receipts / unread inquiries) — none of it should block the rest of the page from rendering. |
| SET-05 | P2 | Notifications panel with zero pending items shows a clear "all caught up" state, not a blank space. |

## 10. Background jobs & timing

| ID | Priority | Case |
|---|---|---|
| BG-01 | P1 | A confirmed member/coach booking whose slot time passes with nobody checked in gets automatically charged a no-show fee within ~5 minutes, with no admin action taken. |
| BG-02 | P1 | An abandoned guest payment hold (lock expired, no receipt ever submitted) gets automatically closed out (`cancelled`) within ~5 minutes. |
| BG-03 | P1 | Restart the backend server — both sweeps run once immediately at boot, in addition to the 5-minute interval (confirm via server log). |
| BG-04 | P2 | Around local midnight in Sri Lanka (UTC+5:30), confirm "today" on the booking date picker and the past-slot-locking logic reflect the correct **local** calendar day, not still-yesterday-in-UTC (see REG-13). |

---

## 11. Regression suite (tied to fixed bugs)

Run these whenever touching booking, payments, or auth code — each one exists specifically because it broke before.

| ID | Bug ref | Case |
|---|---|---|
| REG-01 | BUG-011 | Coach: double-click "Pay Now" on the same outstanding fee rapidly → exactly one pending submission created, never two. |
| REG-02 | BUG-002 | Attempt `POST /api/bookings/guest-lock/:id/pay` for a real, currently-active booking ID but with a missing or wrong `lock_token` → 403, not accepted. |
| REG-03 | BUG-003 | Delete a member/coach with real booking history → clean 409 message, never a raw SQL error string shown to the admin. |
| REG-04 | BUG-004 | Upload a receipt over the size limit (or wrong MIME type) on guest-lock/pay, member-payments, or coach-payments → clean on-screen error message, submit button doesn't just silently reset. |
| REG-05 | BUG-009 | Restore a cancelled booking whose slot time has already elapsed → blocked, not silently confirmed. |
| REG-06 | BUG-019 | Attempt to `PUT` a soft-deleted guest's record directly → 404, not a silent successful edit. |
| REG-07 | BUG-012 | Create a new admin account with a non-active login status → Staff Directory shows the matching (non-active) status immediately, not `active`. |
| REG-08 | BUG-001 | Cancel a booking, book the identical court/date/slot again, then check the **original** booking's linked payment(s) — still point at the original `booking_id`, never silently repointed to the new booking. |
| REG-09 | ISSUE-001 | Create two guest bookings back-to-back using the **same** phone number without using "look up existing guest" first → only one `guests` row is created, reused for both. |
| REG-10 | BUG-015 | Let a booking get auto-charged a no-show fee, then check that person in late → the fee flips to `waived` automatically, with a note explaining why. |
| REG-11 | BUG-017 | Time a login attempt with a real username + wrong password against one with a username that doesn't exist at all → response times should be statistically indistinguishable. |
| REG-12 | BUG-006 | Fire two near-simultaneous approve requests at the same `verification_id` → the second one 409s ("already approved"), never processes twice. |
| REG-13 | BUG-005 | Set a test system/browser clock to ~00:30 Sri Lanka time and load any booking page → "today" on the date picker matches the actual local date, not the day before. |

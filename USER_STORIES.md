# Kandy Garden Club — User Stories

User stories for the three account-holding roles, written against what the system actually does today (cross-reference `API.md`/`PROJECT_OVERVIEW.md` for the technical side of any story below). Guests are covered only where they intersect a role's story, since guests have no account of their own.

Format: **As a `<role>`, I want to `<do something>`, so that `<benefit>`.** Grouped by feature area; a short note under a story calls out a real constraint the system enforces, where that constraint is the interesting part.

---

## Contents

- [Member stories](#member-stories)
- [Coach stories](#coach-stories)
- [Admin stories](#admin-stories)

---

## Member stories

### Getting started
- As a prospective member, I want to apply for membership from the public site — picking a plan and uploading my payment slip — so that I don't need to visit the club in person just to sign up.
- As an applicant, I want to know my application is pending review, not silently ignored, so that I'm not left wondering whether it went through.
- As a new member, I want my first login to work the moment my registration is approved, so that I don't need a separate account-activation step.

### Membership
- As a member, I want to see my current plan, its expiry date, and whether it's active, so that I know if I'm actually able to book a court right now.
- As a member with no plan yet (or a lapsed one), I want to be told clearly why I can't book, rather than the booking just silently failing, so I know exactly what to fix.
- As a member, I want to submit a renewal payment before or after my plan expires, so that my membership extends from wherever my current term actually ends (not losing already-paid-for time by renewing early).

### Booking a court
- As a member, I want to see real-time court availability for any date, so that I only ever try to book a slot that's actually open.
- As a member, I want booking to be free (covered by my membership) rather than a per-use fee, so that unlimited court access is the point of paying membership dues.
- As a member, I want a slot that's already ended today to show as unavailable, but a slot still partway through to stay bookable, so the system matches how much time is actually left to play.
- As a member, I want to cancel a booking I no longer need, so that the court frees up for someone else.
  - *A cancellation still costs me a fee if I cancel it myself — cancelling in advance isn't free, but at least I'm not stuck paying for a no-show.*
- As a member, I want to be blocked from cancelling a booking an admin has locked, so that a confirmed arrangement (e.g. already reserved as part of an event) can't be pulled out from under the club.
- As a member, I want to be blocked from cancelling something in the past, so a "cancellation" can't be used to erase attendance history after the fact.

### Payments
- As a member, I want to see my full payment history — what's settled, what's pending review, what's been rejected — in one place, so I don't have to ask the front desk.
- As a member, I want to see any outstanding fee I owe (like a cancellation charge) clearly flagged before I try to book again, so there are no surprises.
- As a member, I want to pay off a specific outstanding fee directly, rather than it getting mixed up with a fresh charge, so my payment history stays accurate.
- As a member, I want to know my payment is "awaiting review," not assume it went through the moment I upload a slip, so I don't show up expecting a confirmed booking that's still pending.

### Attendance & profile
- As a member, I want to see my own attendance history and total court time, so I can track how often I actually use my membership.
- As a member, I want to update my own contact details and password, so I don't need to ask an admin for something this routine.
  - *Changing my email to one another account already uses gives me a clear "already in use" message, not a confusing failure.*
- As a member, I want to check the weather and a quick BMI/calorie calculator from my own dashboard, so I have basic tools without leaving the site.

### Staying informed
- As a member, I want to see club announcements (tournaments, maintenance notices, events) relevant to me, so I'm not missing out on club news.
- As a member, I want a way to reach the admin with a question even if my membership has lapsed and most of my dashboard is otherwise locked, so I'm never completely stuck.

---

## Coach stories

### Booking
- As a coach, I want to book a court for my own use without needing a membership plan, so the system correctly treats coaching staff differently from paying members.
- As a coach, I want the same real-time availability grid everyone else sees, so I'm never trying to book a slot that's already taken.
- As a coach, I want to cancel my own booking when a lesson falls through, understanding a self-cancellation fee applies, so the club can still recover the cost of a held slot.

### Payments
- As a coach, I want to submit a payment (e.g. a tournament fee or a donation) with a receipt for admin review, so informal payments still get properly recorded.
- As a coach, I want to see my own payment history and settle any outstanding fee directly, exactly like a member can, so I'm not treated inconsistently just because I'm staff rather than a paying member.

### Profile & public presence
- As a coach, I want my profile (bio, specialization, years of experience) to be accurate on my own dashboard, so members and admins see current information.
- As a coach, I want my photo to appear on the public home page's coaches section once an admin uploads one, so prospective members can recognize me before ever meeting me.
- As a coach, I want to update my own contact details and password myself, so routine changes don't need an admin's involvement.

### Attendance & tools
- As a coach, I want to see my own attendance/session history, so I have a record of the sessions I've actually run.
- As a coach, I want access to the same weather and fitness tools members get, so I have quick reference info without needing a separate account type.
- As a coach, I want a way to send an inquiry to the admin directly from my dashboard, so I don't have to leave the platform for routine questions.

---

## Admin stories

### Accounts & access
- As an admin, I want to create a login and its matching profile (member/coach/staff) in a single step, so I never end up with a "ghost" account that has a role but no actual profile behind it.
- As an admin, I want to see at a glance which accounts are missing their matching profile, so I can catch and fix a broken account before someone complains they can't use the system.
- As an admin, I want the system to stop me from deleting or disabling the **last** active admin account, so the club can never accidentally lock itself out of its own dashboard.
- As an admin, I want a clean, understandable error — not a raw database crash — when I try to delete an account that still has booking or payment history, so I know to disable it instead of losing that history.

### Members, coaches, guests, staff
- As an admin, I want to register a new member without being forced to collect payment on the spot, so I can onboard someone and let them or the front desk settle the fee later.
- As an admin, I want assigning (or changing) a membership plan to automatically create/update the matching payment record, so the ledger and the membership status can never silently drift apart.
- As an admin, I want a dedicated staff directory (admins, guards, other personnel) separate from the member/coach lists, so I have one place to track everyone who works at the club, not just the ones who log in.
- As an admin, I want to soft-delete a guest or staff record (with the option to restore it) rather than lose it permanently, so removing someone from the active list doesn't erase their history.
- As an admin, I want to upload a real photo for a coach or a court, so the public website reflects the actual club rather than generic stock imagery.

### Bookings
- As an admin, I want to book a court on behalf of a member, coach, or guest, so I can help someone who calls or walks in without needing them to use the system themselves.
- As an admin, I want to be stopped from booking on behalf of a member whose membership has lapsed, so I can't accidentally grant access the system is supposed to gate.
- As an admin, I want to cancel or reject a booking without it automatically charging the customer a fee, so club-initiated changes (e.g. a court closure) don't unfairly penalize someone.
- As an admin, I want to restore a booking I cancelled by mistake, so a slip of the mouse doesn't turn into a real inconvenience for a member.
  - *I can't restore it if the slot's time has already passed, or if someone else has since booked it — the system tells me clearly which one happened.*
- As an admin, I want to lock a specific booking so the person who made it can't self-cancel it, so a confirmed arrangement the club is relying on can't be pulled at the last minute.
- As an admin, I want to correct a booking's recorded fee after the fact (e.g. a mistyped guest charge), so I don't have to cancel and completely recreate a booking just to fix a typo.
- As an admin, I want every booking surface (guest widget, member, coach, and my own admin view) to show identical, real-time availability, so I'm never double-booking a slot someone else just took.

### Attendance & no-shows
- As an admin, I want to check members and coaches in and out for their booked sessions, including entering a time manually if I forgot to do it live, so the attendance record stays accurate even after the fact.
- As an admin, I want a no-show fee charged automatically once a booking's time has passed with nobody checked in, so I don't have to remember to chase this down myself for every missed session.
- As an admin, I want the option to waive a no-show fee for a good reason (an excused absence), and to undo that waiver if I change my mind, so the system gives me judgment, not just automation.
- As an admin, I want checking someone in late to automatically clear a no-show fee that was already charged, so an honest mistake in timing doesn't leave someone unfairly billed.
- As an admin, I want to search and filter a long attendance history by date, person, or type, so I can actually find what I'm looking for instead of scrolling through everything.
- As an admin, I want an "undo" on an accidental check-in, so a wrong click doesn't require a support workaround to fix.

### Payments & verification
- As an admin, I want a single queue of every payment slip awaiting review — registrations, renewals, bookings, donations, fee settlements alike — so I have one place to work through, not five.
- As an admin, I want approving a receipt to automatically trigger the right outcome for what it's for (activate an account, extend a membership, confirm a booking, settle a fee) so I'm not manually reconciling the ledger by hand after every approval.
- As an admin, I want to undo an approval or rejection I got wrong, understanding that some decisions (an already-granted membership renewal, an already-confirmed and paid booking) can't be safely undone automatically, so I'm not tempted to "fix" something in a way that quietly corrupts the records.
- As an admin, I want to correct a verification's declared amount after the fact, so a misread receipt doesn't leave a permanently wrong number in the system.
- As an admin, I want to see total revenue, a trend versus the previous period, and a breakdown by payment type, so I can actually understand how the club is doing financially, not just see a list of transactions.
- As an admin, I want to export a revenue report, so I can share club finances with people who don't have (or need) a login.

### Club configuration & communication
- As an admin, I want to change the club's public contact details (address, phone, email, hours, social links) myself, so a small correction doesn't require asking a developer to edit code.
- As an admin, I want to adjust the cancellation, guest-booking, and no-show fee amounts from a settings screen, so pricing policy can change without a code deployment.
- As an admin, I want a clear, non-blocking notifications area on my dashboard for things that need my attention (members awaiting a plan, receipts awaiting review, unread inquiries), so nothing gets missed, but it also doesn't get in the way of everything else on the page.
- As an admin, I want to publish and schedule announcements for the public site, so club news reaches members and visitors without needing a separate content system.
- As an admin, I want to review and reply to public contact-form inquiries by email directly from the dashboard, so I'm not switching between systems to handle a simple question.

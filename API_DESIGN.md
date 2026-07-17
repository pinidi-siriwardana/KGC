# 4.3 API Design

The system exposes a REST API over JSON (multipart/form-data only for the endpoints that accept a file upload). Authentication is via a JWT bearer token (`Authorization: Bearer <token>`), issued at login and carrying `user_id` and `role`. Every response body follows one of two shapes: `{ "message": "...", ...extra fields }` for a write/action, or `{ "data": ... }` for a read. Error responses are always `{ "message": "human-readable reason" }` with an appropriate HTTP status code (`400` validation, `401`/`403` auth, `404` not found, `409` conflict, `500` unexpected).

The 18 endpoints below are representative of the full API's design — one or two per major feature area. The complete endpoint list (all ~90 routes, method + path + auth + one-line description, without full body/response detail) is maintained separately in `API.md`.

---

## 4.3.1 Register (public sign-up)

- **Endpoint:** `/api/auth/register`
- **Method:** `POST`
- **Request body:** `multipart/form-data`
```json
{
  "full_name": "Nadeesha Perera",
  "email": "nadeesha@example.com",
  "phone": "0771234567",
  "username": "nadeesha_p",
  "password": "S3curePass!",
  "membership_type_id": 2
}
```
plus a file field `receipt` (the payment slip).

- **Response:** `201 Created`
```json
{
  "message": "Registration submitted successfully. Your account is pending admin review.",
  "request_id": 23
}
```

---

## 4.3.2 Log in

- **Endpoint:** `/api/auth/login`
- **Method:** `POST`
- **Request body:**
```json
{
  "username": "nadeesha_p",
  "password": "S3curePass!"
}
```

- **Response:** `200 OK`
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 41,
    "username": "nadeesha_p",
    "role": "member",
    "status": "active"
  }
}
```

---

## 4.3.3 Get court availability for a date

- **Endpoint:** `/api/bookings/availability?date=2026-07-20`
- **Method:** `GET`
- **Request body:** none (query parameter only; public endpoint, no auth required)

- **Response:** `200 OK`
```json
{
  "data": [
    { "court_id": 1, "slot_id": 5, "state": "booked" },
    { "court_id": 2, "slot_id": 8, "state": "locked" }
  ]
}
```
*(any court/slot combination not present in the array is implicitly open)*

---

## 4.3.4 Hold a slot as a guest

- **Endpoint:** `/api/bookings/guest-lock`
- **Method:** `POST`
- **Request body:**
```json
{
  "court_id": 2,
  "slot_id": 7,
  "booking_date": "2026-07-20",
  "guest_full_name": "Ruwan Silva",
  "guest_phone": "0759876543",
  "guest_email": "ruwan@example.com"
}
```
*(or `{ "guest_id": 14, ... }` instead of the three `guest_*` fields, for a returning guest)*

- **Response:** `201 Created`
```json
{
  "message": "Slot held for 5 minutes — complete payment to confirm.",
  "data": {
    "booking_id": 118,
    "lock_expires_at": "2026-07-20 09:45:00",
    "lock_token": "a8bac0169eb736dcfbbf3b7b407cf600921093570b11d210"
  }
}
```

---

## 4.3.5 Submit a booking as an authenticated member/coach/admin

- **Endpoint:** `/api/bookings`
- **Method:** `POST`
- **Request body** (member/coach, self-service):
```json
{
  "court_id": 2,
  "slot_id": 7,
  "booking_date": "2026-07-20"
}
```
- **Request body** (admin, booking on behalf of a guest):
```json
{
  "court_id": 2,
  "slot_id": 7,
  "booking_date": "2026-07-20",
  "booking_type": "guest",
  "guest_full_name": "Ruwan Silva",
  "guest_phone": "0759876543",
  "amount_charged": 1500,
  "note": "Paid cash at front desk"
}
```

- **Response:** `201 Created`
```json
{
  "message": "Booking confirmed.",
  "data": {
    "booking_id": 118,
    "court_id": 2,
    "slot_id": 7,
    "booking_date": "2026-07-20",
    "booking_type": "member",
    "amount_charged": "0.00",
    "member_id": 9,
    "coach_id": null,
    "guest_id": null,
    "status": "confirmed",
    "lock_status": "unlocked",
    "court_name": "Court 2",
    "court_type": "Clay",
    "slot_name": "Slot 08 (13:00 - 14:00)",
    "start_time": "13:00:00",
    "end_time": "14:00:00",
    "payer_name": "Jane Doe"
  }
}
```

---

## 4.3.6 Cancel / reject / lock / restore a booking

- **Endpoint:** `/api/bookings/:id`
- **Method:** `PATCH`
- **Request body:**
```json
{ "action": "cancel" }
```
*(`action` is one of `cancel`, `reject`, `lock`, `unlock`, `restore`; self-service callers may only use `cancel` on their own booking)*

- **Response:** `200 OK`
```json
{
  "message": "Booking cancelled. A cancellation fee of LKR 250 has been charged to your account.",
  "cancellation_fee": 250
}
```

---

## 4.3.7 List membership plans

- **Endpoint:** `/api/membership-types`
- **Method:** `GET`
- **Request body:** none (public endpoint)

- **Response:** `200 OK`
```json
{
  "data": [
    { "membership_type_id": 1, "name": "Junior Membership", "duration_months": 6, "price": "7500.00", "created_at": "2026-04-19 06:35:39" },
    { "membership_type_id": 2, "name": "Senior Membership", "duration_months": 6, "price": "10000.00", "created_at": "2026-04-19 06:35:39" }
  ]
}
```

---

## 4.3.8 Create a login + profile (Access Management)

- **Endpoint:** `/api/users/add`
- **Method:** `POST`
- **Request body:**
```json
{
  "role": "member",
  "username": "kasun_m",
  "password": "TempPass123!",
  "status": "active",
  "full_name": "Kasun Mendis",
  "email": "kasun@example.com",
  "phone": "0771112223",
  "membership_type_id": 1,
  "start_date": "2026-07-20"
}
```
*(the shape of the body depends on `role` — `admin`/`coach` omit the membership fields and add their own role-specific ones, e.g. `specialization`/`experience_years` for a coach)*

- **Response:** `201 Created`
```json
{
  "message": "User created.",
  "user_id": 77,
  "member_id": 33
}
```

---

## 4.3.9 Assign/change a member's plan

- **Endpoint:** `/api/members/:id/membership`
- **Method:** `PUT`
- **Request body:**
```json
{
  "membership_type_id": 2,
  "start_date": "2026-07-20"
}
```

- **Response:** `200 OK`
```json
{
  "message": "Membership plan updated.",
  "membershipId": 25,
  "price": "10000.00"
}
```

---

## 4.3.10 Submit a payment (member self-service)

- **Endpoint:** `/api/member/payments`
- **Method:** `POST`
- **Request body:** `multipart/form-data`
```json
{
  "payment_type": "membership_renewal",
  "membership_type_id": 2,
  "note": "Renewing for another term"
}
```
plus a file field `receipt`. (`payment_type` also accepts `donation`/`tournament_fee`, each requiring `amount_declared` instead of `membership_type_id`.)

- **Response:** `201 Created`
```json
{
  "message": "Payment submitted for review.",
  "verification_id": 41
}
```

---

## 4.3.11 Approve a payment verification (admin)

- **Endpoint:** `/api/payments/approve/:id`
- **Method:** `PATCH`
- **Request body:**
```json
{ "remarks": "Slip matches bank statement" }
```

- **Response:** `200 OK`
```json
{
  "message": "Verification approved.",
  "member_id": 33
}
```
*(the extra field(s) returned alongside `message` depend on what kind of verification was approved — e.g. `member_id` for a new registration, nothing extra for a simple fee settlement)*

---

## 4.3.12 List the payments ledger (admin)

- **Endpoint:** `/api/payments?type=membership&date=2026-07-20&search=Jane`
- **Method:** `GET`
- **Request body:** none (query filters only)

- **Response:** `200 OK`
```json
{
  "data": [
    {
      "payment_id": 5,
      "amount": "5000.00",
      "payment_date": "2026-07-20 04:54:37",
      "payment_type": "membership",
      "member_id": 10,
      "coach_id": null,
      "booking_id": null,
      "membership_id": 12,
      "handled_by": 19,
      "status": "completed",
      "notes": null,
      "payer_name": "Jane Doe",
      "handled_by_username": "pinidi"
    }
  ]
}
```

---

## 4.3.13 Check in a member/coach for their session

- **Endpoint:** `/api/attendance/checkin`
- **Method:** `POST`
- **Request body:**
```json
{
  "booking_id": 118,
  "member_id": 9,
  "checkin_time": "2026-07-20T13:05"
}
```
*(`checkin_time` is optional — omitting it checks in at the current server time; exactly one of `member_id`/`coach_id` is required)*

- **Response:** `201 Created`
```json
{
  "message": "Checked in.",
  "data": {
    "attendance_id": 87,
    "booking_id": 118,
    "member_id": 9,
    "coach_id": null,
    "checkin_time": "2026-07-20 13:05:00",
    "checkout_time": null,
    "attendee_name": "Jane Doe"
  }
}
```

---

## 4.3.14 Mark a booking as a no-show

- **Endpoint:** `/api/attendance/:booking_id/no-show`
- **Method:** `POST`
- **Request body:**
```json
{ "waive": false }
```

- **Response:** `200 OK`
```json
{
  "message": "Marked as a no-show. A fee of LKR 500 has been charged.",
  "no_show_fee": 500,
  "waived": false
}
```

---

## 4.3.15 Admin dashboard overview

- **Endpoint:** `/api/admin/dashboard`
- **Method:** `GET`
- **Request body:** none

- **Response:** `200 OK`
```json
{
  "data": {
    "revenue": { "total": 145000, "trendPercent": 12.4, "timeseries": [ { "period": "2026-07-19", "total": 5000 } ] },
    "members": { "total": 42, "active": 38 },
    "activeCoaches": 3,
    "pendingApplications": 2,
    "todayBookings": 11,
    "courts": { "total": 4, "available": 4 },
    "unreadInquiries": 1,
    "checkedInNow": 3,
    "recentActivity": [
      { "type": "booking", "title": "New member booking", "subtitle": "Jane Doe · Court 2 · confirmed", "timestamp": "2026-07-20 12:58:03" }
    ],
    "membersAwaitingPlan": { "count": 1, "recent": [ { "member_id": 40, "full_name": "New Applicant", "created_at": "2026-07-19 10:00:00" } ] },
    "notifications": [
      { "type": "pending_verifications", "severity": "warning", "title": "2 receipts awaiting verification", "message": "Review and approve or reject submitted payment slips.", "link": "/admin/verify-payments" }
    ]
  }
}
```

---

## 4.3.16 Get / update club settings

- **Endpoint:** `/api/settings`
- **Method:** `GET`
- **Request body:** none (public endpoint)

- **Response:** `200 OK`
```json
{
  "data": {
    "cancellation_fee": "250",
    "guest_booking_fee": "1500.00",
    "no_show_fee": "500.00",
    "bank_name": "Sample Bank",
    "account_name": "Kandy Garden Club",
    "account_number": "000-000-0000",
    "branch": "Kandy",
    "club_address": "Peradeniya Road, Kandy, Sri Lanka",
    "club_email": "hello@kandygardenclub.lk",
    "club_phone": "+94 (81) 222-3333",
    "club_opening_hours": "Mon – Sun: 08:00 – 20:00"
  }
}
```

- **Endpoint:** `/api/settings`
- **Method:** `PATCH` *(admin only)*
- **Request body:**
```json
{
  "club_phone": "+94 (81) 222-4444",
  "no_show_fee": "750"
}
```

- **Response:** `200 OK`
```json
{ "message": "Settings updated." }
```

---

## 4.3.17 Revenue summary report

- **Endpoint:** `/api/revenue/summary?from=2026-06-20&to=2026-07-20&groupBy=week`
- **Method:** `GET`
- **Request body:** none (query filters only)

- **Response:** `200 OK`
```json
{
  "data": {
    "range": { "from": "2026-06-20", "to": "2026-07-20", "groupBy": "week" },
    "totalRevenue": 145000,
    "transactionCount": 28,
    "averageAmount": 5178.57,
    "previousRevenue": 129000,
    "trendPercent": 12.4,
    "byType": [
      { "payment_type": "membership", "total": 90000, "count": 12 },
      { "payment_type": "booking_fee", "total": 30000, "count": 10 }
    ],
    "timeseries": [
      { "period": "2026-06-22", "total": 25000 },
      { "period": "2026-06-29", "total": 40000 }
    ]
  }
}
```

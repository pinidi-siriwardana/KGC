const pool = require('../config/db');
const { fetchRevenueSummary } = require('./revenueController');

// Recent-activity feed merges three unrelated tables (bookings, the
// verification queue, contact inquiries) — each is shaped differently, so
// they're queried separately and merged/sorted in JS rather than forced into
// one fragile UNION.
const fetchRecentActivity = async () => {
    const [bookings] = await pool.query(
        `SELECT b.booking_id, b.booking_type, b.status, b.created_at,
                c.court_name, COALESCE(m.full_name, co.full_name, g.full_name) AS who
         FROM bookings b
         JOIN courts c ON b.court_id = c.court_id
         LEFT JOIN members m ON b.member_id = m.member_id
         LEFT JOIN coaches co ON b.coach_id = co.coach_id
         LEFT JOIN guests g ON b.guest_id = g.guest_id
         ORDER BY b.created_at DESC LIMIT 5`
    );

    const [verifications] = await pool.query(
        `SELECT pv.verification_id, pv.payment_type, pv.status, pv.amount_declared, pv.submitted_at,
                COALESCE(rr.full_name, m2.full_name, c2.full_name, g.full_name) AS who
         FROM payment_verification pv
         LEFT JOIN registration_requests rr ON pv.request_id = rr.request_id
         LEFT JOIN bookings b ON pv.booking_id = b.booking_id
         LEFT JOIN guests g ON b.guest_id = g.guest_id
         LEFT JOIN members m2 ON pv.member_id = m2.member_id
         LEFT JOIN coaches c2 ON pv.coach_id = c2.coach_id
         ORDER BY pv.submitted_at DESC LIMIT 5`
    );

    const [inquiries] = await pool.query(
        `SELECT inquiry_id, full_name, status, created_at
         FROM contact_inquiries WHERE is_deleted = 0
         ORDER BY created_at DESC LIMIT 5`
    );

    const activity = [
        ...bookings.map((b) => ({
            type: 'booking',
            title: `New ${b.booking_type} booking`,
            subtitle: `${b.who || 'Unknown'} · ${b.court_name} · ${b.status}`,
            timestamp: b.created_at,
        })),
        ...verifications.map((v) => ({
            type: 'verification',
            title: v.payment_type === 'registration' ? 'New membership application' : `Payment verification: ${v.payment_type.replace(/_/g, ' ')}`,
            subtitle: `${v.who || 'Unknown'} · LKR ${Number(v.amount_declared).toLocaleString()} · ${v.status}`,
            timestamp: v.submitted_at,
        })),
        ...inquiries.map((i) => ({
            type: 'inquiry',
            title: 'New inquiry',
            subtitle: `${i.full_name} · ${i.status}`,
            timestamp: i.created_at,
        })),
    ];

    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return activity.slice(0, 8);
};

const getDashboardOverview = async (req, res) => {
    try {
        const [
            revenue,
            [[memberCounts]],
            [[coachCounts]],
            [[pendingApps]],
            [[todayBookings]],
            [[courtCounts]],
            [[unreadInquiries]],
            [[checkedIn]],
            recentActivity,
        ] = await Promise.all([
            fetchRevenueSummary({ groupBy: 'day' }),
            pool.query(`SELECT COUNT(*) AS total, SUM(status = 'active') AS active FROM members`),
            pool.query(`SELECT SUM(status = 'active') AS active FROM coaches`),
            pool.query(`SELECT COUNT(*) AS count FROM payment_verification WHERE status = 'pending'`),
            pool.query(`SELECT COUNT(*) AS count FROM bookings WHERE booking_date = CURDATE() AND status IN ('pending', 'confirmed')`),
            pool.query(`SELECT COUNT(*) AS total, SUM(status = 'available' AND is_active = 1) AS available FROM courts`),
            pool.query(`SELECT COUNT(*) AS count FROM contact_inquiries WHERE status = 'unread' AND is_deleted = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM attendance WHERE checkout_time IS NULL`),
            fetchRecentActivity(),
        ]);

        res.json({
            data: {
                revenue: {
                    total: revenue.totalRevenue,
                    trendPercent: revenue.trendPercent,
                    timeseries: revenue.timeseries,
                },
                members: { total: Number(memberCounts.total), active: Number(memberCounts.active) },
                activeCoaches: Number(coachCounts.active) || 0,
                pendingApplications: Number(pendingApps.count),
                todayBookings: Number(todayBookings.count),
                courts: { total: Number(courtCounts.total), available: Number(courtCounts.available) || 0 },
                unreadInquiries: Number(unreadInquiries.count),
                checkedInNow: Number(checkedIn.count),
                recentActivity,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch dashboard overview.', error: err.message });
    }
};

module.exports = { getDashboardOverview };

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const { ensureSchema } = require('./utils/schemaBootstrap');
const { runNoShowSweep } = require('./utils/noShowSweep');
const { sweepExpiredGuestLocks } = require('./utils/guestLockSweep');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const memberRoutes = require('./routes/memberRoutes');
const coachRoutes = require('./routes/coachRoutes');
const userRoutes = require('./routes/userRoutes');
const membersRoutes = require('./routes/membersRoutes');
const coachesRoutes = require('./routes/coachesRoutes');
const guestsRoutes = require('./routes/guestsRoutes');
const staffRoutes = require('./routes/staffRoutes');
const courtsRoutes = require('./routes/courtsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const membershipTypesRoutes = require('./routes/membershipTypesRoutes');
const inquiriesRoutes = require('./routes/inquiriesRoutes');
const announcementsRoutes = require('./routes/announcementsRoutes');
const timeSlotsRoutes = require('./routes/timeSlotsRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const logger = require('./middleware/logger');

ensureSchema()
    .then(() => Promise.all([runNoShowSweep(), sweepExpiredGuestLocks()]))
    .catch((err) => console.error('Schema bootstrap failed:', err.message));

// Periodically charges the no-show fee for any confirmed member/coach
// booking whose time slot has passed with nobody checked in (see
// utils/noShowSweep.js), and closes out any guest lock whose 5-minute
// payment window lapsed without a receipt ever being submitted (see
// utils/guestLockSweep.js). No cron dependency in this project, so a plain
// interval is the simplest fit; every 5 minutes keeps both sweeps timely
// without hammering the DB.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
    runNoShowSweep().catch((err) => console.error('No-show sweep failed:', err.message));
    sweepExpiredGuestLocks().catch((err) => console.error('Guest lock sweep failed:', err.message));
}, SWEEP_INTERVAL_MS);

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// Uploaded payment slips, served back for the admin receipt review UI.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/coach', coachRoutes);

// Admin resource management (CRUD over users/members/coaches/guests/courts/payments)
app.use('/api/users', userRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/coaches', coachesRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/courts', courtsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/membership-types', membershipTypesRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/time-slots', timeSlotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/weather', weatherRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
    res.send('Kandy Garden Club API is running...');
});

app.get('/api/health/db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS ok');
        res.json({ db: 'connected', result: rows[0] });
    } catch (err) {
        res.status(500).json({ db: 'error', message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

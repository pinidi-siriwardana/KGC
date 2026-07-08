const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Auto-create table on first use
const ensureTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
            inquiry_id   INT AUTO_INCREMENT PRIMARY KEY,
            full_name    VARCHAR(255) NOT NULL,
            email        VARCHAR(255) NOT NULL,
            phone        VARCHAR(50),
            message      TEXT NOT NULL,
            status       ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
            reply_message TEXT,
            replied_at   DATETIME,
            is_deleted   TINYINT(1) NOT NULL DEFAULT 0,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

// Public: anyone can submit a contact inquiry
const submitInquiry = async (req, res) => {
    const { full_name, email, phone, message } = req.body;

    if (!full_name || !email || !message) {
        return res.status(400).json({ message: 'full_name, email and message are required.' });
    }

    try {
        await ensureTable();
        const [result] = await pool.query(
            'INSERT INTO contact_inquiries (full_name, email, phone, message) VALUES (?, ?, ?, ?)',
            [full_name, email, phone || null, message]
        );
        res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit inquiry.', error: err.message });
    }
};

// Admin: list all inquiries, newest first
const getInquiries = async (req, res) => {
    try {
        await ensureTable();
        const [rows] = await pool.query(
            'SELECT inquiry_id, full_name, email, phone, message, status, reply_message, replied_at, created_at FROM contact_inquiries WHERE is_deleted = 0 ORDER BY created_at DESC'
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch inquiries.', error: err.message });
    }
};

// Admin: get single inquiry and mark it as read
const getInquiry = async (req, res) => {
    const { id } = req.params;
    try {
        await ensureTable();
        const [[row]] = await pool.query('SELECT * FROM contact_inquiries WHERE inquiry_id = ? AND is_deleted = 0', [id]);
        if (!row) return res.status(404).json({ message: 'Inquiry not found.' });

        if (row.status === 'unread') {
            await pool.query("UPDATE contact_inquiries SET status = 'read' WHERE inquiry_id = ?", [id]);
            row.status = 'read';
        }

        res.json({ data: row });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch inquiry.', error: err.message });
    }
};

// Admin: reply via email and update status
const replyToInquiry = async (req, res) => {
    const { id } = req.params;
    const { reply_message } = req.body;

    if (!reply_message || !reply_message.trim()) {
        return res.status(400).json({ message: 'reply_message is required.' });
    }

    try {
        await ensureTable();
        const [[inquiry]] = await pool.query('SELECT * FROM contact_inquiries WHERE inquiry_id = ?', [id]);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Kandy Garden Club" <${process.env.SMTP_USER}>`,
            to: inquiry.email,
            subject: 'Re: Your Inquiry to Kandy Garden Club',
            text: `Dear ${inquiry.full_name},\n\n${reply_message}\n\nKind regards,\nKandy Garden Club`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#1a1a1a">Kandy Garden Club</h2>
                    <p>Dear <strong>${inquiry.full_name}</strong>,</p>
                    <div style="background:#f9f9f9;border-left:4px solid #2d6a4f;padding:16px;margin:16px 0;white-space:pre-wrap">${reply_message}</div>
                    <p style="color:#666">Kind regards,<br><strong>Kandy Garden Club</strong></p>
                    <hr style="border:none;border-top:1px solid #eee">
                    <p style="font-size:12px;color:#aaa">This is a reply to your inquiry sent on ${new Date(inquiry.created_at).toLocaleDateString()}.</p>
                </div>
            `,
        });

        await pool.query(
            "UPDATE contact_inquiries SET status = 'replied', reply_message = ?, replied_at = NOW() WHERE inquiry_id = ?",
            [reply_message.trim(), id]
        );

        res.json({ message: 'Reply sent successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send reply.', error: err.message });
    }
};

// Admin: soft-delete (hidden from dashboard, preserved in DB)
const deleteInquiry = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'UPDATE contact_inquiries SET is_deleted = 1 WHERE inquiry_id = ? AND is_deleted = 0',
            [id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found.' });
        res.json({ message: 'Inquiry removed from dashboard.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove inquiry.', error: err.message });
    }
};

module.exports = { submitInquiry, getInquiries, getInquiry, replyToInquiry, deleteInquiry };

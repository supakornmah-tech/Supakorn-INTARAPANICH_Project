const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'lost-and-found-dev-secret';
const ADMIN_ROLES = ['admin', 'superadmin'];

function authenticateToken(req, res, next) {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }

    const sql = "SELECT id, username, role, is_banned, ban_reason FROM users WHERE id = ?";
    db.query(sql, [payload.id], (err, rows) => {
        if (err) {
            console.error('ตรวจสอบสิทธิ์ผู้ใช้ล้มเหลว:', err.message);
            return res.status(500).json({ message: 'ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้' });
        }
        if (rows.length === 0) {
            return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่' });
        }

        const account = rows[0];
        if (account.is_banned === 1) {
            return res.status(403).json({
                message: `บัญชีของคุณถูกระงับการใช้งาน${account.ban_reason ? `: ${account.ban_reason}` : ''}`,
                reason: account.ban_reason || null,
                banned: true,
            });
        }

        req.user = {
            id: account.id,
            username: account.username,
            role: account.role,
        };
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    next();
}

function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'เฉพาะ Super Admin เท่านั้นที่ทำรายการนี้ได้' });
    }
    next();
}

module.exports = { authenticateToken, requireAdmin, requireSuperAdmin, JWT_SECRET, ADMIN_ROLES };

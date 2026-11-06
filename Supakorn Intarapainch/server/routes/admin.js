const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAdminAction } = require('../utils/audit');

router.use(authenticateToken, requireAdmin);

router.get('/users', (req, res) => {
    const sql = `
        SELECT u.id, u.username, u.email, u.role, u.is_banned, u.ban_reason, u.banned_at, u.created_at,
        COUNT(p.id) AS post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC, u.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.put('/users/ban/:id', (req, res) => {
    const targetId = Number(req.params.id);
    const body = req.body || {};
    const isBanned = Number(body.is_banned) === 1 ? 1 : 0;
    const reason = String(body.reason || '').trim();

    if (targetId === Number(req.user.id)) {
        return res.status(400).json({ message: 'ไม่สามารถแบนบัญชีของตัวเองได้' });
    }
    if (isBanned && !reason) {
        return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการแบนผู้ใช้' });
    }

    db.query("SELECT id, username, role FROM users WHERE id = ?", [targetId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้รายนี้' });

        const target = rows[0];
        if (target.role === 'superadmin') {
            return res.status(403).json({ message: 'ไม่สามารถแบนหรือระงับบัญชี Super Admin ได้' });
        }
        if (target.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'เฉพาะ Super Admin เท่านั้นที่จัดการบัญชีแอดมินได้' });
        }

        const sql = "UPDATE users SET is_banned = ?, ban_reason = ?, banned_at = ? WHERE id = ?";
        db.query(sql, [isBanned, isBanned ? reason : null, isBanned ? new Date() : null, targetId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            logAdminAction({
                adminId: req.user.id,
                action: isBanned ? 'ban_user' : 'unban_user',
                targetType: 'user',
                targetId,
                detail: isBanned
                    ? `แบนผู้ใช้ "${target.username}" | เหตุผล: ${reason}`
                    : `ปลดแบนผู้ใช้ "${target.username}"`,
            });
            res.json({ message: isBanned ? "แบนผู้ใช้สำเร็จ" : "ปลดแบนผู้ใช้สำเร็จ" });
        });
    });
});

router.put('/users/role/:id', (req, res) => {
    const targetId = Number(req.params.id);
    const { role } = req.body || {};

    if (!['user', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ message: 'บทบาทไม่ถูกต้อง' });
    }
    if (targetId === Number(req.user.id)) {
        return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้' });
    }

    db.query("SELECT id, username, role FROM users WHERE id = ?", [targetId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้รายนี้' });

        const target = rows[0];
        if (target.role === 'superadmin') {
            return res.status(403).json({ message: 'ไม่สามารถลดสิทธิ์หรือเปลี่ยนบทบาท Super Admin ได้' });
        }
        if (target.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'เฉพาะ Super Admin เท่านั้นที่เปลี่ยนสิทธิ์แอดมินได้' });
        }
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'เฉพาะ Super Admin เท่านั้นที่แต่งตั้ง Super Admin ได้' });
        }

        const sql = "UPDATE users SET role = ? WHERE id = ?";
        db.query(sql, [role, targetId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            logAdminAction({
                adminId: req.user.id,
                action: 'change_role',
                targetType: 'user',
                targetId,
                detail: `เปลี่ยนสิทธิ์ "${target.username}" จาก ${target.role} เป็น ${role}`,
            });
            res.json({ message: "เปลี่ยนสิทธิ์สำเร็จ" });
        });
    });
});

router.get('/posts', (req, res) => {
    const sql = `
        SELECT p.*, u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.delete('/posts/:id', (req, res) => {
    const postId = Number(req.params.id);
    const reason = String(req.body?.reason || '').trim();

    if (!reason) {
        return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการลบโพสต์' });
    }

    db.query("SELECT id, title, type, status FROM posts WHERE id = ?", [postId], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์นี้' });

        const post = rows[0];

        db.query("DELETE FROM posts WHERE id = ?", [postId], (deleteErr) => {
            if (deleteErr) return res.status(500).json(deleteErr);

            logAdminAction({
                adminId: req.user.id,
                action: 'delete_post',
                targetType: 'post',
                targetId: postId,
                detail: `ลบโพสต์ "${post.title}" (${post.type === 'found' ? 'พบของ' : 'ของหาย'}, ${post.status === 'resolved' ? 'ปิดแล้ว' : 'ยังไม่ปิด'}) | เหตุผล: ${reason}`,
            });
            res.json({ message: "ลบโพสต์สำเร็จ" });
        });
    });
});

router.put('/posts/status/:id', (req, res) => {
    const postId = Number(req.params.id);
    const { status } = req.body || {};

    if (status !== 'resolved') {
        return res.status(400).json({ message: 'สถานะไม่ถูกต้อง (ปิดประกาศได้เฉพาะสถานะ resolved)' });
    }

    db.query("SELECT id, title, type, status FROM posts WHERE id = ?", [postId], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์นี้' });

        const post = rows[0];
        if (post.status === 'resolved') {
            return res.status(400).json({ message: 'โพสต์นี้ปิดแล้ว' });
        }

        const sql = "UPDATE posts SET status = 'resolved', closed_at = NOW(), closed_by = ? WHERE id = ?";
        db.query(sql, [req.user.id, postId], (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);

            logAdminAction({
                adminId: req.user.id,
                action: 'close_post',
                targetType: 'post',
                targetId: postId,
                detail: `ปิดประกาศ "${post.title}" (${post.type === 'found' ? 'พบของ' : 'ของหาย'})`,
            });
            res.json({ message: "ปิดประกาศสำเร็จ" });
        });
    });
});

router.get('/stats-summary', (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM posts WHERE type = 'lost') as lostCount,
            (SELECT COUNT(*) FROM posts WHERE type = 'found') as foundCount,
            (SELECT COUNT(*) FROM posts WHERE status = 'resolved') as resolvedCount,
            (SELECT COUNT(*) FROM posts WHERE status <> 'resolved' OR status IS NULL) as openCount
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

router.get('/logs', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const sql = `
        SELECT l.id, l.admin_id, l.action, l.target_type, l.target_id, l.detail, l.created_at,
               u.username AS admin_name
        FROM admin_logs l
        LEFT JOIN users u ON l.admin_id = u.id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT ?
    `;
    db.query(sql, [limit], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

module.exports = router;

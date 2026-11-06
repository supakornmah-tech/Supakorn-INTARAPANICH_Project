const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { authenticateToken, ADMIN_ROLES } = require('../middleware/auth');
const { logAdminAction } = require('../utils/audit');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

function isAdmin(user) {
    return !!user && ADMIN_ROLES.includes(user.role);
}

function canManagePost(postUserId, user) {
    return isAdmin(user) || Number(postUserId) === Number(user.id);
}

router.post('/create', authenticateToken, upload.single('image'), (req, res) => {
    const { title, description, contact, type, location_name, lat, lng } = req.body;
    const user_id = req.user.id;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !type) {
        return res.status(400).json({ message: 'กรุณากรอกหัวข้อและประเภทประกาศ' });
    }
    if (!['lost', 'found'].includes(type)) {
        return res.status(400).json({ message: 'ประเภทประกาศไม่ถูกต้อง (lost / found)' });
    }

    const latitude = (lat === undefined || lat === '') ? null : lat;
    const longitude = (lng === undefined || lng === '') ? null : lng;

    const sql = `INSERT INTO posts 
                (title, description, contact, type, image_url, location_name, latitude, longitude, user_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [title, description, contact, type, image_url, location_name || null, latitude, longitude, user_id], (err) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "สร้างโพสต์ไม่สำเร็จ", error: err.message });
        }
        res.status(201).json({ message: "ลงประกาศพร้อมข้อมูลติดต่อและรูปภาพสำเร็จ!" });
    });
});

router.get('/all', (req, res) => {
    const sql = "SELECT * FROM posts ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

router.get('/get-post/:id', (req, res) => {
    const sql = "SELECT * FROM posts WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'ไม่พบประกาศนี้' });
        }
        res.json(result[0]);
    });
});

router.get('/my-posts/:userId', authenticateToken, (req, res) => {
    const requestedId = Number(req.params.userId);
    if (!isAdmin(req.user) && Number(req.user.id) !== requestedId) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }

    const sql = "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [requestedId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.put('/update-status/:id', authenticateToken, (req, res) => {
    const { status } = req.body || {};
    if (status !== 'resolved') {
        return res.status(400).json({ message: 'สถานะไม่ถูกต้อง (ปิดประกาศได้เฉพาะสถานะ resolved)' });
    }

    const sql = "SELECT user_id, status, title, type FROM posts WHERE id = ?";
    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบประกาศนี้' });

        const post = rows[0];
        if (!canManagePost(post.user_id, req.user)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้' });
        }
        if (post.status === 'resolved') {
            return res.status(400).json({ message: 'ประกาศนี้ปิดแล้ว' });
        }

        const updateSql = "UPDATE posts SET status = 'resolved', closed_at = NOW(), closed_by = ? WHERE id = ?";
        db.query(updateSql, [req.user.id, req.params.id], (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);

            if (isAdmin(req.user)) {
                logAdminAction({
                    adminId: req.user.id,
                    action: 'close_post',
                    targetType: 'post',
                    targetId: Number(req.params.id),
                    detail: `ปิดประกาศ "${post.title}" (${post.type === 'found' ? 'พบของ' : 'ของหาย'})`,
                });
            }
            res.json({ message: "ปิดประกาศเรียบร้อย!" });
        });
    });
});

router.put('/update/:id', authenticateToken, (req, res) => {
    const { title, description, contact } = req.body || {};

    db.query("SELECT user_id, status FROM posts WHERE id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบประกาศนี้' });
        if (!canManagePost(rows[0].user_id, req.user)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้' });
        }
        if (rows[0].status === 'resolved') {
            return res.status(400).json({ message: 'ไม่สามารถแก้ไขประกาศที่ปิดแล้ว' });
        }

        const sql = "UPDATE posts SET title = ?, description = ?, contact = ? WHERE id = ?";
        db.query(sql, [title, description, contact, req.params.id], (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);
            res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
        });
    });
});

router.delete('/delete/:id', authenticateToken, (req, res) => {
    const reason = String(req.body?.reason || '').trim();

    db.query("SELECT user_id, status, title, type FROM posts WHERE id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบประกาศนี้' });

        const post = rows[0];
        if (!canManagePost(post.user_id, req.user)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบประกาศนี้' });
        }
        if (post.status === 'resolved') {
            return res.status(400).json({ message: 'ไม่สามารถลบประกาศที่ปิดแล้ว' });
        }
        if (isAdmin(req.user) && !reason) {
            return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการลบประกาศ' });
        }

        db.query("DELETE FROM posts WHERE id = ?", [req.params.id], (deleteErr) => {
            if (deleteErr) return res.status(500).json(deleteErr);

            if (isAdmin(req.user)) {
                logAdminAction({
                    adminId: req.user.id,
                    action: 'delete_post',
                    targetType: 'post',
                    targetId: Number(req.params.id),
                    detail: `ลบประกาศ "${post.title}"${reason ? ` | เหตุผล: ${reason}` : ''}`,
                });
            }
            res.json({ message: "ลบประกาศเรียบร้อยแล้ว" });
        });
    });
});

module.exports = router;

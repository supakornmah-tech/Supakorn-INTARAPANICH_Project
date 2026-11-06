const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, ADMIN_ROLES } = require('../middleware/auth');

// ทุกเส้นทางในไฟล์นี้ ต้องเข้าสู่ระบบก่อน
router.use(authenticateToken);

// --- 1. API: เช็คหรือสร้างห้องสนทนาใหม่ ---
router.post('/get-or-create', (req, res) => {
    const { post_id, user_one } = req.body;
    const user_two = req.user.id; // ใช้ผู้ใช้ที่ล็อกอินจริง ไม่เชื่อค่าจากฝั่งไคลเอนต์

    if (!post_id || !user_one) {
        return res.status(400).json({ message: "ส่งข้อมูลมาไม่ครบ" });
    }

    const findSql = `SELECT id FROM conversations 
                     WHERE post_id = ? 
                     AND ((user_one = ? AND user_two = ?) 
                     OR (user_one = ? AND user_two = ?))`;

    db.query(findSql, [post_id, user_one, user_two, user_two, user_one], (err, results) => {
        if (err) {
            console.error("SQL Find Error:", err.message);
            return res.status(500).json({ message: "ค้นหาห้องไม่สำเร็จ", error: err.message });
        }

        if (results.length > 0) {
            res.json({ conversation_id: results[0].id });
        } else {
            const insertSql = "INSERT INTO conversations (post_id, user_one, user_two) VALUES (?, ?, ?)";
            db.query(insertSql, [post_id, user_one, user_two], (insertErr, result) => {
                if (insertErr) {
                    console.error("SQL Insert Error:", insertErr.message);
                    return res.status(500).json({ message: "สร้างห้องไม่สำเร็จ", error: insertErr.message });
                }
                res.json({ conversation_id: result.insertId });
            });
        }
    });
});

// --- 2. API: ดึงประวัติข้อความ ---
router.get('/messages/:conversationId', (req, res) => {
    const { conversationId } = req.params;

    db.query("SELECT user_one, user_two FROM conversations WHERE id = ?", [conversationId], (err, rooms) => {
        if (err) return res.status(500).json(err);
        if (rooms.length === 0) return res.status(404).json({ message: 'ไม่พบห้องสนทนานี้' });

        const room = rooms[0];
        const isMember = Number(room.user_one) === Number(req.user.id) || Number(room.user_two) === Number(req.user.id);
        if (!isMember && !ADMIN_ROLES.includes(req.user.role)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงห้องสนทนานี้' });
        }

        const sql = "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC";
        db.query(sql, [conversationId], (msgErr, results) => {
            if (msgErr) return res.status(500).json(msgErr);
            res.json(results);
        });
    });
});

// --- 3. API: บันทึกข้อความใหม่ ---
router.post('/send', (req, res) => {
    const { conversation_id, message_text } = req.body;
    const sender_id = req.user.id;

    if (!conversation_id || !message_text) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    db.query("SELECT user_one, user_two FROM conversations WHERE id = ?", [conversation_id], (err, rooms) => {
        if (err) return res.status(500).json(err);
        if (rooms.length === 0) return res.status(404).json({ message: 'ไม่พบห้องสนทนานี้' });

        const room = rooms[0];
        const isMember = Number(room.user_one) === Number(sender_id) || Number(room.user_two) === Number(sender_id);
        if (!isMember) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้' });

        const sql = "INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)";
        db.query(sql, [conversation_id, sender_id, message_text], (insertErr, result) => {
            if (insertErr) {
                console.error("Database Error:", insertErr);
                return res.status(500).json({ message: "DB Error", error: insertErr.message });
            }
            res.json({ success: true, messageId: result.insertId });
        });
    });
});

// --- 4. API: รายการแชท (Chat List / Inbox) ---
router.get('/list/:userId', (req, res) => {
    const { userId } = req.params;
    if (!ADMIN_ROLES.includes(req.user.role) && Number(req.user.id) !== Number(userId)) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }

    const sql = `
        SELECT c.id, c.post_id, p.title, 
        u1.username as owner_name, u2.username as visitor_name,
        c.user_one, c.user_two
        FROM conversations c
        JOIN posts p ON c.post_id = p.id
        JOIN users u1 ON c.user_one = u1.id
        JOIN users u2 ON c.user_two = u2.id
        WHERE c.user_one = ? OR c.user_two = ?
        ORDER BY c.created_at DESC
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const checkSql = "SELECT id FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
        }
        if (results.length > 0) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error(hashErr);
                return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
            }

            const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
            db.query(sql, [username, email, hashedPassword], (insertErr) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ หรืออีเมลซ้ำ' });
                }
                res.status(201).json({ message: 'สมัครสมาชิกสำเร็จแล้ว!' });
            });
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length === 0) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const account = result[0];

        if (account.is_banned === 1) {
            const reason = account.ban_reason || '';
            return res.status(403).json({
                message: `บัญชีของคุณถูกระงับการใช้งาน${reason ? `: ${reason}` : ''}`,
                reason: reason || null,
                banned: true,
            });
        }

        try {
            const isHashed = typeof account.password === 'string' && account.password.startsWith('$2');
            let match = false;

            if (isHashed) {
                match = await bcrypt.compare(password, account.password);
            } else {
                match = password === account.password;
                if (match) {
                    const newHash = await bcrypt.hash(password, 10);
                    db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, account.id], () => {});
                }
            }

            if (!match) {
                return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
            }

            const token = jwt.sign(
                { id: account.id, username: account.username, role: account.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            const user = {
                id: account.id,
                username: account.username,
                email: account.email,
                role: account.role,
                is_banned: account.is_banned,
            };

            res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, user });
        } catch (compareErr) {
            console.error(compareErr);
            return res.status(500).json({ message: 'เข้าสู่ระบบไม่สำเร็จ' });
        }
    });
});

router.get('/me', authenticateToken, (req, res) => {
    const sql = "SELECT id, username, email, role, is_banned, ban_reason, created_at FROM users WHERE id = ?";
    db.query(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'ดึงข้อมูลผู้ใช้ไม่สำเร็จ' });
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
        res.json(rows[0]);
    });
});

router.put('/profile', authenticateToken, (req, res) => {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim();

    if (!username || !email) {
        return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และอีเมลให้ครบถ้วน' });
    }

    const checkSql = "SELECT id FROM users WHERE email = ? AND id <> ?";
    db.query(checkSql, [email, req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'บันทึกข้อมูลไม่สำเร็จ' });
        if (rows.length > 0) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
        }

        const sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        db.query(sql, [username, email, req.user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'บันทึกข้อมูลไม่สำเร็จ' });

            const user = {
                id: req.user.id,
                username,
                email,
                role: req.user.role,
            };
            res.json({ message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ', user });
        });
    });
});

router.put('/change-password', authenticateToken, (req, res) => {
    const currentPassword = req.body.currentPassword || '';
    const newPassword = req.body.newPassword || '';

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    db.query("SELECT password FROM users WHERE id = ?", [req.user.id], async (err, rows) => {
        if (err) return res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });

        const storedPassword = rows[0].password;
        try {
            const isHashed = typeof storedPassword === 'string' && storedPassword.startsWith('$2');
            const match = isHashed
                ? await bcrypt.compare(currentPassword, storedPassword)
                : currentPassword === storedPassword;

            if (!match) {
                return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, req.user.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
                res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
            });
        } catch (hashErr) {
            console.error(hashErr);
            return res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
        }
    });
});

module.exports = router;

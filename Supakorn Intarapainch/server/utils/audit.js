const db = require('../db');

function logAdminAction({ adminId, action, targetType = null, targetId = null, detail = null }) {
    const sql = `
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, detail)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [adminId, action, targetType, targetId, detail], (err) => {
        if (err) console.error('บันทึก Audit Log ล้มเหลว:', err.message);
    });
}

module.exports = { logAdminAction };

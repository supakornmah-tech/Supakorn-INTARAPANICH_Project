const db = require('./db');

const pool = db.promise();

async function hasColumn(table, column) {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
    if (await hasColumn(table, column)) return;
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[schema] เพิ่มคอลัมน์ ${table}.${column}`);
}

async function ensureSchema() {
    const [roleInfo] = await pool.query(
        `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
    );
    if (roleInfo.length > 0) {
        const { DATA_TYPE: dataType, CHARACTER_MAXIMUM_LENGTH: maxLength } = roleInfo[0];
        if (String(dataType).toLowerCase() === 'enum' || Number(maxLength) < 20) {
            await pool.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'");
            console.log('[schema] ปรับคอลัมน์ users.role รองรับ superadmin');
        }
    }

    await addColumnIfMissing('users', 'ban_reason', 'TEXT NULL');
    await addColumnIfMissing('users', 'banned_at', 'DATETIME NULL');
    await addColumnIfMissing('posts', 'closed_at', 'DATETIME NULL');
    await addColumnIfMissing('posts', 'closed_by', 'INT NULL');

    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NULL,
            action VARCHAR(50) NOT NULL,
            target_type VARCHAR(30) NULL,
            target_id INT NULL,
            detail TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin_logs_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [superAdmins] = await pool.query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
    if (superAdmins.length === 0) {
        const [firstAdmins] = await pool.query(
            "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
        );
        if (firstAdmins.length > 0) {
            await pool.query("UPDATE users SET role = 'superadmin' WHERE id = ?", [firstAdmins[0].id]);
            console.log(`[schema] ตั้งผู้ใช้ id=${firstAdmins[0].id} เป็น Super Admin`);
        }
    }

    console.log('[schema] ตรวจสอบโครงสร้างฐานข้อมูลเรียบร้อย');
}

module.exports = { ensureSchema };

const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('เชื่อมต่อ Database ล้มเหลว:', err.message);
        return;
    }
    console.log('--- เชื่อมต่อ MySQL สำเร็จแล้ว! ---');
    connection.release();
});

module.exports = db;

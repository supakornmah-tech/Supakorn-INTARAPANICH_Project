const { ensureSchema } = require('./schema');
const db = require('./db');

ensureSchema()
    .then(() => {
        console.log('อัปเดตโครงสร้างฐานข้อมูลสำเร็จ');
        db.end(() => process.exit(0));
    })
    .catch((err) => {
        console.error('อัปเดตโครงสร้างฐานข้อมูลไม่สำเร็จ:', err);
        db.end(() => process.exit(1));
    });

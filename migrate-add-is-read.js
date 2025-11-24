// migrate-add-is-read.js - เพิ่ม column is_read ใน vaccinations table
const sqlite3 = require('sqlite3').verbose();

console.log('🔧 กำลัง migrate database...\n');

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    }
});

// เช็คว่ามี column is_read หรือยัง
db.all("PRAGMA table_info(vaccinations)", (err, columns) => {
    if (err) {
        console.error('❌ Error checking table:', err);
        db.close();
        process.exit(1);
    }

    const hasIsRead = columns.some(col => col.name === 'is_read');

    if (hasIsRead) {
        console.log('✅ Column is_read มีอยู่แล้ว - ไม่ต้อง migrate');
        db.close();
        process.exit(0);
    }

    // เพิ่ม column is_read
    console.log('➕ กำลังเพิ่ม column is_read...');
    db.run('ALTER TABLE vaccinations ADD COLUMN is_read INTEGER DEFAULT 0', (err) => {
        if (err) {
            console.error('❌ Error adding column:', err);
        } else {
            console.log('✅ เพิ่ม column is_read สำเร็จ!\n');
        }
        
        db.close();
        process.exit(err ? 1 : 0);
    });
});

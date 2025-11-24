const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petizo.db');

console.log('\n========== ตรวจสอบข้อมูล Vaccinations ==========\n');

// ตรวจสอบ vaccinations ทั้งหมดที่มี next_due_date
db.all(
    `SELECT v.id, v.pet_id, p.name as pet_name, p.user_id, v.vaccine_name, v.next_due_date, v.is_read
     FROM vaccinations v
     INNER JOIN pets p ON v.pet_id = p.id
     WHERE v.next_due_date IS NOT NULL
     ORDER BY v.next_due_date ASC
     LIMIT 10`,
    [],
    (err, rows) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        console.log(`พบ ${rows.length} รายการวัคซีนที่มี next_due_date:\n`);
        
        if (rows.length === 0) {
            console.log('❌ ไม่มีข้อมูลวัคซีนที่มี next_due_date');
        } else {
            rows.forEach((row, index) => {
                console.log(`${index + 1}. Pet: ${row.pet_name} (user_id: ${row.user_id})`);
                console.log(`   Vaccine: ${row.vaccine_name}`);
                console.log(`   Due Date: ${row.next_due_date}`);
                console.log(`   Is Read: ${row.is_read}`);
                console.log('');
            });
        }
        
        // ตรวจสอบข้อมูล users
        db.all('SELECT id, username, email FROM users', [], (err, users) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            console.log('\n========== Users ในระบบ ==========\n');
            users.forEach(user => {
                console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
            db.close();
        });
    }
);

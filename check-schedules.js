const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petizo.db');

console.log('\n========== ตรวจสอบ Vaccine Schedules ==========\n');

// ดูโครงสร้างตาราง
db.all("PRAGMA table_info(vaccine_schedules)", [], (err, columns) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Columns in vaccine_schedules:');
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
    console.log('');
    
    // ดูข้อมูลในตาราง
    db.all(
        `SELECT vs.*, p.name as pet_name, p.user_id 
         FROM vaccine_schedules vs
         LEFT JOIN pets p ON vs.pet_id = p.id
         ORDER BY vs.schedule_date ASC
         LIMIT 20`,
        [],
        (err, schedules) => {
            if (err) {
                console.error('Error:', err);
                db.close();
                return;
            }
            
            console.log(`\nพบ ${schedules.length} schedule(s):\n`);
            
            if (schedules.length === 0) {
                console.log('❌ ไม่มีข้อมูล vaccine schedules');
            } else {
                schedules.forEach((s, index) => {
                    console.log(`${index + 1}. Pet: ${s.pet_name || 'N/A'} (user_id: ${s.user_id || 'N/A'})`);
                    console.log(`   Pet ID: ${s.pet_id}`);
                    console.log(`   Vaccine: ${s.vaccine_name}`);
                    console.log(`   Schedule Date: ${s.schedule_date}`);
                    console.log(`   Status: ${s.status}`);
                    console.log('');
                });
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
            db.close();
        }
    );
});

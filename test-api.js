const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petizo.db');

console.log('\n========== ทดสอบ API Query ==========\n');

const userId = 2; // user@petizo.com

db.all(
    `SELECT v.id, v.pet_id, p.name as pet_name, v.vaccine_name, v.next_due_date, v.is_read,
     CASE 
        WHEN date(v.next_due_date) < date('now') THEN 'overdue'
        WHEN date(v.next_due_date) = date('now') THEN 'today'
        WHEN date(v.next_due_date) <= date('now', '+7 days') THEN 'upcoming'
        ELSE 'future'
     END as status
     FROM vaccinations v
     INNER JOIN pets p ON v.pet_id = p.id
     WHERE p.user_id = ? 
     AND v.next_due_date IS NOT NULL 
     AND v.next_due_date != ''
     AND date(v.next_due_date) >= date('now', '-30 days')
     ORDER BY v.next_due_date ASC
     LIMIT 50`,
    [userId],
    (err, notifications) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }
        
        console.log(`พบ ${notifications.length} notification(s):\n`);
        
        notifications.forEach((n, index) => {
            console.log(`${index + 1}.`);
            console.log(`   ID: ${n.id}`);
            console.log(`   Pet ID: ${n.pet_id}`);
            console.log(`   Pet Name: ${n.pet_name}`);
            console.log(`   Vaccine: ${n.vaccine_name}`);
            console.log(`   Due Date: ${n.next_due_date}`);
            console.log(`   Status: ${n.status}`);
            console.log(`   Is Read: ${n.is_read}`);
            console.log('');
        });
        
        console.log('\n' + '='.repeat(50) + '\n');
        db.close();
    }
);

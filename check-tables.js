const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petizo.db');

console.log('\n========== รายชื่อตารางทั้งหมด ==========\n');

db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    [],
    (err, tables) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }
        
        console.log('Tables:');
        tables.forEach(t => console.log(`  - ${t.name}`));
        
        console.log('\n========== โครงสร้างตาราง vaccinations ==========\n');
        
        db.all("PRAGMA table_info(vaccinations)", [], (err, columns) => {
            if (err) {
                console.error('Error:', err);
                db.close();
                return;
            }
            
            console.log('Columns:');
            columns.forEach(col => {
                console.log(`  - ${col.name} (${col.type})`);
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
            db.close();
        });
    }
);

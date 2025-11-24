// database.js - Database Connection Handler
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let db;

// Check if running on Vercel (use PostgreSQL)
if (process.env.POSTGRES_URL) {
    console.log('📊 Using PostgreSQL (Vercel)');
    
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // Wrap PostgreSQL to use SQLite-like API
    db = {
        run: function(sql, params, callback) {
            pool.query(sql, params)
                .then(() => callback(null))
                .catch(err => callback(err));
        },
        get: function(sql, params, callback) {
            pool.query(sql, params)
                .then(result => callback(null, result.rows[0]))
                .catch(err => callback(err));
        },
        all: function(sql, params, callback) {
            pool.query(sql, params)
                .then(result => callback(null, result.rows))
                .catch(err => callback(err));
        }
    };
} else {
    // Use SQLite for local development
    console.log('📊 Using SQLite (Local)');
    db = new sqlite3.Database('./petizo.db', (err) => {
        if (err) {
            console.error('❌ Error connecting to SQLite:', err);
        } else {
            console.log('✅ เชื่อมต่อ Database สำเร็จ');
        }
    });
}

module.exports = db;

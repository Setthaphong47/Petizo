require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in .env file!');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database Connection
const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
    } else {
        console.log('✅ เชื่อมต่อ Database สำเร็จ');
    }
});

// File Upload Configuration
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPEG, PNG, GIF'), false);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
        }
        req.user = user;
        next();
    });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'ต้องมีสิทธิ์ Admin' });
    }
    next();
};

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, phone]
        );
        res.json({ message: 'สำเร็จ', userId: result.lastID });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    });
});

// ============= USER PROFILE ROUTES =============
// เพิ่มส่วนนี้ใน server.js หลังจาก AUTH ROUTES และก่อน PETS ROUTES

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get(
        `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.created_at, u.updated_at,
         (SELECT COUNT(*) FROM pets WHERE user_id = u.id) as pet_count
         FROM users u WHERE u.id = ?`,
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
            }
            if (!user) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
            }
            
            // Don't send password
            delete user.password;
            res.json(user);
        }
    );
});

// Change password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    if (new_password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    
    try {
        // Get current user
        db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
            if (err || !user) {
                return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
            }
            
            // Verify current password
            const validPassword = await bcrypt.compare(current_password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);
            
            // Update password
            db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, req.user.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
                    }
                    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
                }
            );
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ============= PETS ROUTES =============

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get(
        `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.created_at, u.updated_at,
         (SELECT COUNT(*) FROM pets WHERE user_id = u.id) as pet_count
         FROM users u WHERE u.id = ?`,
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
            }
            if (!user) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
            }
            delete user.password;
            res.json(user);
        }
    );
});

// Change password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    if (new_password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    
    try {
        db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
            if (err || !user) {
                return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
            }
            
            const validPassword = await bcrypt.compare(current_password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }
            
            const hashedPassword = await bcrypt.hash(new_password, 10);
            
            db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, req.user.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
                    }
                    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
                }
            );
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// Get all pets
app.get('/api/pets', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, pets) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
            }
            res.json(pets);
        }
    );
});

// Get single pet
app.get('/api/pets/:id', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM pets WHERE id = ? AND user_id = ?', 
        [req.params.id, req.user.id], 
        (err, pet) => {
            if (err || !pet) {
                return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
            }
            res.json(pet);
        }
    );
});

// Create new pet
app.post('/api/pets', authenticateToken, upload.single('photo'), (req, res) => {
    const { name, breed, gender, birth_date, color, weight, microchip_id, notes } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        'INSERT INTO pets (user_id, name, breed, gender, birth_date, color, weight, microchip_id, photo_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, name, breed, gender, birth_date, color, weight, microchip_id, photo_url, notes],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถสร้างข้อมูลสัตว์เลี้ยงได้' });
            }
            res.json({ message: 'สร้างข้อมูลสัตว์เลี้ยงสำเร็จ', petId: this.lastID });
        }
    );
});

// Update pet
app.put('/api/pets/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const { name, breed, gender, birth_date, color, weight, microchip_id, notes } = req.body;
    
    let query = 'UPDATE pets SET name = ?, breed = ?, gender = ?, birth_date = ?, color = ?, weight = ?, microchip_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [name, breed, gender, birth_date, color, weight, microchip_id, notes];
    
    if (req.file) {
        query += ', photo_url = ?';
        params.push(`/uploads/${req.file.filename}`);
    }
    
    query += ' WHERE id = ? AND user_id = ?';
    params.push(req.params.id, req.user.id);
    
    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
        res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
    });
});

// Delete pet
app.delete('/api/pets/:id', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM pets WHERE id = ? AND user_id = ?', 
        [req.params.id, req.user.id], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' });
            }
            res.json({ message: 'ลบข้อมูลสัตว์เลี้ยงสำเร็จ' });
        }
    );
});

// ============= VACCINE SCHEDULE MANAGEMENT =============

// Get vaccine schedules
app.get('/api/vaccine-schedules', (req, res) => {
    db.all('SELECT * FROM vaccine_schedules ORDER BY age_weeks_min ASC', (err, schedules) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลตารางวัคซีนได้' });
        }
        res.json(schedules);
    });
});

// Get recommended vaccines for a pet
app.get('/api/pets/:petId/recommended-vaccines', authenticateToken, (req, res) => {
    // Get pet info
    db.get('SELECT * FROM pets WHERE id = ? AND user_id = ?', 
        [req.params.petId, req.user.id], 
        (err, pet) => {
            if (err || !pet) {
                return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
            }

            if (!pet.birth_date) {
                return res.json({ 
                    message: 'กรุณาระบุวันเกิดของสัตว์เลี้ยงเพื่อคำนวณตารางวัคซีน',
                    vaccines: [] 
                });
            }

            // Calculate pet age in weeks
            const birthDate = new Date(pet.birth_date);
            const today = new Date();
            const ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000));
            const ageInYears = ageInWeeks / 52;
            const ageInMonths = Math.floor(ageInWeeks / 4.33); // คำนวณเดือน

            // pet age calculated (debug logs removed)

            // Get all vaccine schedules
            db.all('SELECT * FROM vaccine_schedules ORDER BY age_weeks_min ASC', (err, schedules) => {
                if (err) {
                    return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลตารางวัคซีนได้' });
                }

                // Get completed vaccinations
                db.all(
                    'SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY vaccination_date DESC', 
                    [req.params.petId], 
                    (err, completed) => {
                        if (err) {
                            return res.status(500).json({ error: 'ไม่สามารถดึงประวัติวัคซีนได้' });
                        }

                        // Map completed vaccinations by schedule_id
                        const completedMap = {};
                        const completedByName = {};
                        
                        completed.forEach(vacc => {
                            if (vacc.schedule_id) {
                                completedMap[vacc.schedule_id] = vacc;
                            }
                            // จัดกลุ่มตามชื่อวัคซีน (สำหรับ booster)
                            if (!completedByName[vacc.vaccine_name]) {
                                completedByName[vacc.vaccine_name] = [];
                            }
                            completedByName[vacc.vaccine_name].push(vacc);
                        });

                        const recommendations = [];

                        schedules.forEach(schedule => {
                            const isCompleted = !!completedMap[schedule.id];
                            
                            let status = 'upcoming';
                            let dueDate = null;
                            let daysUntilDue = null;
                            let shouldShow = true;

                            if (schedule.is_booster) {
                                // 🔄 วัคซีนบูสเตอร์ - ฉีดทุก X ปี
                                
                                // ตรวจสอบว่าแมวอายุพอหรือยัง
                                if (ageInWeeks < schedule.age_weeks_min) {
                                    status = 'upcoming';
                                    dueDate = new Date(birthDate);
                                    dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                                    shouldShow = false; // ยังไม่ถึงเวลา
                                } else {
                                    // หาวันที่ฉีดครั้งล่าสุดของวัคซีนนี้
                                    const baseName = schedule.vaccine_name.replace(/\s*(Booster|บูสเตอร์).*$/i, '').trim();
                                    const relatedVaccinations = completed.filter(v => 
                                        v.vaccine_name.includes(baseName) || baseName.includes(v.vaccine_name)
                                    );

                                    if (relatedVaccinations.length > 0) {
                                        // มีประวัติการฉีด - คำนวณจากวันที่ฉีดครั้งล่าสุด
                                        const lastVaccination = relatedVaccinations[0]; // เรียงล่าสุดไว้แล้ว
                                        const lastVaccDate = new Date(lastVaccination.vaccination_date);
                                        
                                        // ครั้งต่อไปควรฉีดเมื่อ
                                        const nextDue = new Date(lastVaccDate);
                                        nextDue.setFullYear(nextDue.getFullYear() + (schedule.frequency_years || 1));
                                        
                                        dueDate = nextDue;
                                        const daysDiff = Math.floor((nextDue - today) / (24 * 60 * 60 * 1000));
                                        daysUntilDue = daysDiff;

                                        if (daysDiff < -30) {
                                            status = 'overdue';
                                        } else if (daysDiff <= 0) {
                                            status = 'due';
                                        } else if (daysDiff <= 30) {
                                            status = 'due'; // ใกล้ถึงกำหนดแล้ว
                                        } else {
                                            status = 'upcoming';
                                            shouldShow = false; // ยังไม่ต้องแสดง
                                        }
                                    } else {
                                        // ยังไม่เคยฉีดเลย - ให้ฉีดครั้งแรก
                                        dueDate = new Date(birthDate);
                                        dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                                        
                                        const daysDiff = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                                        daysUntilDue = daysDiff;
                                        
                                        if (daysDiff < -30) {
                                            status = 'overdue';
                                        } else if (daysDiff <= 0) {
                                            status = 'due';
                                        } else {
                                            status = 'upcoming';
                                        }
                                    }
                                }
                            } else {
                                // 💉 วัคซีนปกติ (สำหรับลูกแมว)
                                
                                // ถ้าแมวโตเกิน 1 ปีแล้ว ไม่ต้องแสดงวัคซีนลูกแมว
                                if (ageInYears > 1) {
                                    shouldShow = false;
                                } else {
                                    // คำนวณวันที่ควรฉีด
                                    const minDue = new Date(birthDate);
                                    minDue.setDate(minDue.getDate() + (schedule.age_weeks_min * 7));
                                    
                                    dueDate = minDue;
                                    const daysDiff = Math.floor((minDue - today) / (24 * 60 * 60 * 1000));
                                    daysUntilDue = daysDiff;

                                    if (isCompleted) {
                                        status = 'completed';
                                    } else {
                                        if (ageInWeeks < schedule.age_weeks_min) {
                                            status = 'upcoming';
                                        } else if (!schedule.age_weeks_max || ageInWeeks <= schedule.age_weeks_max) {
                                            status = 'due';
                                        } else {
                                            status = 'overdue';
                                        }
                                    }
                                }
                            }

                            // เพิ่มเข้า recommendations ถ้าควรแสดง
                            if (shouldShow) {
                                recommendations.push({
                                    ...schedule,
                                    status,
                                    due_date: dueDate,
                                    days_until_due: daysUntilDue,
                                    is_completed: isCompleted,
                                    pet_age_weeks: ageInWeeks,
                                    pet_age_text: weeksToAgeText(ageInWeeks), // เพิ่มบรรทัดนี้
                                    age_range_text: schedule.is_booster 
                                        ? '1+ ปี' 
                                        : weeksToAgeText(schedule.age_weeks_min) + (schedule.age_weeks_max ? ` - ${weeksToAgeText(schedule.age_weeks_max)}` : '+')
                                });
                            }
                        });

                        // จัดเรียงตามความสำคัญ: overdue > due > upcoming > completed
                        const statusPriority = { 
                            'overdue': 1, 
                            'due': 2, 
                            'upcoming': 3, 
                            'completed': 4 
                        };
                        
                        // ฟังก์ชันแปลงสัปดาห์เป็นเดือนและปี
                        function weeksToAgeText(weeks) {
                            const years = Math.floor(weeks / 52);
                            const months = Math.floor((weeks % 52) / 4.33);
                            
                            if (years > 0) {
                                if (months > 0) {
                                    return `${years} ปี ${months} เดือน`;
                                }
                                return `${years} ปี`;
                            } else if (months > 0) {
                                return `${months} เดือน`;
                            } else {
                                return `${weeks} สัปดาห์`;
                            }
                        }

                        recommendations.sort((a, b) => {
                            if (statusPriority[a.status] !== statusPriority[b.status]) {
                                return statusPriority[a.status] - statusPriority[b.status];
                            }
                            // ถ้าสถานะเดียวกัน เรียงตามวันที่
                            return a.age_weeks_min - b.age_weeks_min;
                        });

                        const activeVaccines = recommendations.filter(v => v.status !== 'completed');
                        const completedVaccines = recommendations.filter(v => v.status === 'completed');

                        res.json({
                            pet_age_weeks: ageInWeeks,
                            vaccines: [...activeVaccines, ...completedVaccines],
                            active_count: activeVaccines.length,
                            completed_count: completedVaccines.length
                        });
                    }
                );
            });
        }
    );
});

// Record vaccination with proof
app.post('/api/pets/:petId/vaccinations', authenticateToken, upload.single('proof'), (req, res) => {
    const { vaccine_name, vaccine_type, vaccination_date, next_due_date, veterinarian, clinic_name, batch_number, notes, schedule_id } = req.body;
    const proof_image = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        `INSERT INTO vaccinations (pet_id, vaccine_name, vaccine_type, vaccination_date, next_due_date, 
         veterinarian, clinic_name, batch_number, notes, schedule_id, proof_image, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [req.params.petId, vaccine_name, vaccine_type, vaccination_date, next_due_date, veterinarian, clinic_name, batch_number, notes, schedule_id, proof_image],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลวัคซีนได้' });
            }
            res.json({ message: 'บันทึกข้อมูลวัคซีนสำเร็จ', vaccinationId: this.lastID });
        }
    );
});

// Create vaccine schedule (Admin only)
app.post('/api/vaccine-schedules', authenticateToken, isAdmin, (req, res) => {
    const { vaccine_name, age_weeks_min, age_weeks_max, is_booster, frequency_years, description } = req.body;
    
    db.run(
        'INSERT INTO vaccine_schedules (vaccine_name, age_weeks_min, age_weeks_max, is_booster, frequency_years, description) VALUES (?, ?, ?, ?, ?, ?)',
        [vaccine_name, age_weeks_min, age_weeks_max, is_booster ? 1 : 0, frequency_years, description],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถเพิ่มตารางวัคซีนได้' });
            }
            res.json({ message: 'เพิ่มตารางวัคซีนสำเร็จ', scheduleId: this.lastID });
        }
    );
});

// Update vaccine schedule (Admin only)
app.put('/api/vaccine-schedules/:id', authenticateToken, isAdmin, (req, res) => {
    const { vaccine_name, age_weeks_min, age_weeks_max, is_booster, frequency_years, description } = req.body;
    
    db.run(
        'UPDATE vaccine_schedules SET vaccine_name = ?, age_weeks_min = ?, age_weeks_max = ?, is_booster = ?, frequency_years = ?, description = ? WHERE id = ?',
        [vaccine_name, age_weeks_min, age_weeks_max, is_booster ? 1 : 0, frequency_years, description, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถอัปเดตตารางวัคซีนได้' });
            }
            res.json({ message: 'อัปเดตตารางวัคซีนสำเร็จ' });
        }
    );
});

// Delete vaccine schedule (Admin only)
app.delete('/api/vaccine-schedules/:id', authenticateToken, isAdmin, (req, res) => {
    db.run('DELETE FROM vaccine_schedules WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถลบตารางวัคซีนได้' });
        }
        res.json({ message: 'ลบตารางวัคซีนสำเร็จ' });
    });
});

// ============= VACCINATION HISTORY =============
// Get vaccination history for a pet
app.get('/api/pets/:petId/vaccination-history', authenticateToken, (req, res) => {
    db.all(
        `SELECT v.*, p.name as pet_name
         FROM vaccinations v
         INNER JOIN pets p ON v.pet_id = p.id
         WHERE v.pet_id = ? AND p.user_id = ?
         ORDER BY v.vaccination_date DESC`,
        [req.params.petId, req.user.id],
        (err, vaccinations) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถโหลดประวัติวัคซีนได้' });
            }
            res.json(vaccinations);
        }
    );
});

// Delete vaccination record
app.delete('/api/vaccinations/:id', authenticateToken, (req, res) => {
    // ตรวจสอบว่าเป็นเจ้าของ
    db.get(
        `SELECT v.id FROM vaccinations v
         INNER JOIN pets p ON v.pet_id = p.id
         WHERE v.id = ? AND p.user_id = ?`,
        [req.params.id, req.user.id],
        (err, vaccination) => {
            if (err || !vaccination) {
                return res.status(404).json({ error: 'ไม่พบข้อมูล' });
            }
            
            db.run('DELETE FROM vaccinations WHERE id = ?', [req.params.id], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' });
                }
                res.json({ message: 'ลบข้อมูลสำเร็จ' });
            });
        }
    );
});

// ============= BLOG ROUTES =============
// Get all blog posts (including drafts for admin)
app.get('/api/blog', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let isAdmin = false;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err && user.role === 'admin') {
                isAdmin = true;
            }
        });
    }
    
    const query = isAdmin 
        ? `SELECT b.*, u.username as author_name FROM blog_posts b 
           INNER JOIN users u ON b.author_id = u.id 
           ORDER BY b.created_at DESC`
        : `SELECT b.*, u.username as author_name FROM blog_posts b 
           INNER JOIN users u ON b.author_id = u.id 
           WHERE b.status = 'published' 
           ORDER BY b.published_at DESC`;
    
    db.all(query, (err, posts) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบทความได้' });
        }
        res.json(posts);
    });
});

// Get single blog post by slug
app.get('/api/blog/:slug', (req, res) => {
    db.get(
        `SELECT b.*, u.username as author_name 
         FROM blog_posts b 
         INNER JOIN users u ON b.author_id = u.id 
         WHERE b.slug = ? AND b.status = 'published'`,
        [req.params.slug],
        (err, post) => {
            if (err || !post) {
                return res.status(404).json({ error: 'ไม่พบบทความ' });
            }
            res.json(post);
        }
    );
});

// Get blog post by ID (Admin only)
app.get('/api/blog/post/:id', authenticateToken, isAdmin, (req, res) => {
    db.get(
        `SELECT b.*, u.username as author_name 
         FROM blog_posts b 
         INNER JOIN users u ON b.author_id = u.id 
         WHERE b.id = ?`,
        [req.params.id],
        (err, post) => {
            if (err || !post) {
                return res.status(404).json({ error: 'ไม่พบบทความ' });
            }
            res.json(post);
        }
    );
});

// Create blog post (Admin only)
app.post('/api/blog', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    const { title, slug, content, excerpt, category, tags, status } = req.body;
    const featured_image = req.file ? `/uploads/${req.file.filename}` : null;
    const published_at = status === 'published' ? new Date().toISOString() : null;
    
    db.run(
        'INSERT INTO blog_posts (author_id, title, slug, content, excerpt, featured_image, category, tags, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, title, slug, content, excerpt, featured_image, category, tags, status, published_at],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถสร้างบทความได้' });
            }
            res.json({ message: 'สร้างบทความสำเร็จ', postId: this.lastID });
        }
    );
});

// Update blog post (Admin only)
app.put('/api/blog/:id', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    const { title, slug, content, excerpt, category, tags, status } = req.body;
    
    let query = 'UPDATE blog_posts SET title = ?, slug = ?, content = ?, excerpt = ?, category = ?, tags = ?, status = ?';
    let params = [title, slug, content, excerpt, category, tags, status];
    
    if (req.file) {
        query += ', featured_image = ?';
        params.push(`/uploads/${req.file.filename}`);
    }
    
    // Update published_at if changing from draft to published
    db.get('SELECT status FROM blog_posts WHERE id = ?', [req.params.id], (err, current) => {
        if (current && current.status !== 'published' && status === 'published') {
            query += ', published_at = ?';
            params.push(new Date().toISOString());
        }
        
        query += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(req.params.id);
        
        db.run(query, params, function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถอัปเดตบทความได้' });
            }
            res.json({ message: 'อัปเดตบทความสำเร็จ' });
        });
    });
});

// Delete blog post (Admin only)
app.delete('/api/blog/:id', authenticateToken, isAdmin, (req, res) => {
    db.run('DELETE FROM blog_posts WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถลบบทความได้' });
        }
        res.json({ message: 'ลบบทความสำเร็จ' });
    });
});


// ============= NOTIFICATIONS API =============
// Get vaccine notifications for logged-in user
app.get('/api/notifications', authenticateToken, (req, res) => {
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
        [req.user.id],
        (err, notifications) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถโหลดการแจ้งเตือนได้' });
            }
            res.json(notifications);
        }
    );
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    db.run(
        `UPDATE vaccinations SET is_read = 1 
         WHERE id = ? AND pet_id IN (SELECT id FROM pets WHERE user_id = ?)`,
        [req.params.id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถอัพเดทได้' });
            }
            res.json({ message: 'อัพเดทสำเร็จ' });
        }
    );
});

// ============= AI CHAT ROUTE (OpenRouter fallback to Ollama) =============
app.post('/api/chat', authenticateToken, async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'กรุณาระบุข้อความ' });
    }

    try {
        // If OPENROUTER_API_KEY is provided in env, use OpenRouter / OpenRouter-compatible API
        if (process.env.OPENROUTER_API_KEY) {
            const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
            const MODEL_NAME = process.env.MODEL_NAME || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

            const payload = {
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: 'คุณคือผู้เชี่ยวชาญด้านการดูแลแมว ตอบเป็นภาษาไทย สั้น ๆ และสุภาพ' },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            };

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('OpenRouter API error:', response.status, text);
                throw new Error('OpenRouter API Error');
            }

            const data = await response.json();

            // Try to read common response shapes
            let aiResponse = '';
            if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                // OpenRouter / OpenAI style
                aiResponse = data.choices[0].message?.content ?? data.choices[0].text ?? '';
            } else if (data && data.output_text) {
                aiResponse = data.output_text;
            } else {
                aiResponse = JSON.stringify(data).slice(0, 2000);
            }

            aiResponse = (aiResponse || '').toString().trim();

            // Save chat history (best effort)
            db.run(
                'INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)',
                [req.user.id, message, aiResponse],
                (err) => { if (err) console.error('Error saving chat:', err); }
            );

            return res.json({ response: aiResponse });
        }

        // Fallback: existing Ollama local logic
        // ทดสอบว่า Ollama ทำงาน
        const testResponse = await fetch('http://localhost:11434/api/tags');
        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error('Ollama error response:', errorText);
            throw new Error('Ollama not running');
        }

        const tags = await testResponse.json();
        const availableModels = tags.models.map(m => m.name);

        let selectedModel = 'llama2';
        if (availableModels.some(m => m.includes('mistral'))) {
            selectedModel = 'mistral';
        } else if (availableModels.some(m => m.includes('llama2'))) {
            selectedModel = 'llama2';
        } else if (availableModels.some(m => m.includes('gemma'))) {
            selectedModel = 'gemma:2b';
        } else if (availableModels.length > 0) {
            selectedModel = availableModels[0];
        }

        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                prompt: `คุณคือผู้เชี่ยวชาญด้านการดูแลแมว ตอบคำถามนี้เป็นภาษาไทย สั้นๆ ไม่เกิน 100 คำ:\n\n${message}`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 200
                }
            })
        });

        if (!ollamaResponse.ok) {
            throw new Error('Ollama API Error');
        }

        const ollamaData = await ollamaResponse.json();
        const ollamaAiResponse = ollamaData.response?.trim() ?? '';

        db.run(
            'INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)',
            [req.user.id, message, ollamaAiResponse],
            (err) => { if (err) console.error('Error saving chat:', err); }
        );

        res.json({ response: ollamaAiResponse });

    } catch (error) {
        console.error('Chat Error:', error);
        res.json({ 
            response: 'ขออภัยค่ะ ระบบ AI ยังไม่พร้อม กรุณาตรวจสอบการตั้งค่า API หรือว่า Ollama กำลังทำงาน' 
        });
    }
});

// ============= ADMIN USER MANAGEMENT =============

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    db.all(
        `SELECT id, username, email, full_name, phone, role, created_at, updated_at,
         (SELECT COUNT(*) FROM pets WHERE user_id = users.id) as pet_count
         FROM users 
         ORDER BY created_at DESC`,
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
            }
            res.json(users);
        }
    );
});

// Update user status (Admin only)
app.put('/api/admin/users/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    
    db.run(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะได้' });
            }
            res.json({ message: 'อัปเดตสถานะสำเร็จ' });
        }
    );
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    if (req.params.id == req.user.id) {
        return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
        }
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    });
});

// Get dashboard stats (Admin only)
app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    db.get(
        `SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM pets) as total_pets,
            (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as total_posts,
            (SELECT COUNT(*) FROM chat_history) as total_chats`,
        (err, stats) => {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสถิติได้' });
            }
            res.json(stats);
        }
    );
});

// ============= BREED MANAGEMENT (สายพันธุ์) =============

// สร้างตารางสายพันธุ์ (ถ้ายังไม่มี - เพิ่มใน init-database.js)
// CREATE TABLE breeds (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     description TEXT,
//     image_url TEXT,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );

// Get all breeds
app.get('/api/breeds', (req, res) => {
    db.all('SELECT * FROM breeds ORDER BY created_at DESC', (err, breeds) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสายพันธุ์ได้' });
        }
        res.json(breeds);
    });
});

// Create breed (Admin only)
app.post('/api/breeds', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    const { name, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        'INSERT INTO breeds (name, description, image_url) VALUES (?, ?, ?)',
        [name, description, image_url],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'ไม่สามารถเพิ่มสายพันธุ์ได้' });
            }
            res.json({ message: 'เพิ่มสายพันธุ์สำเร็จ', breedId: this.lastID });
        }
    );
});

// Update breed (Admin only)
app.put('/api/breeds/:id', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
    const { name, description } = req.body;
    
    let query = 'UPDATE breeds SET name = ?, description = ?';
    let params = [name, description];
    
    if (req.file) {
        query += ', image_url = ?';
        params.push(`/uploads/${req.file.filename}`);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
        res.json({ message: 'อัปเดตสายพันธุ์สำเร็จ' });
    });
});

// Delete breed (Admin only)
app.delete('/api/breeds/:id', authenticateToken, isAdmin, (req, res) => {
    db.run('DELETE FROM breeds WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถลบสายพันธุ์ได้' });
        }
        res.json({ message: 'ลบสายพันธุ์สำเร็จ' });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'เกิดข้อผิดพลาด' 
            : err.message
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)' });
        }
        return res.status(400).json({ error: err.message });
    }
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'เกิดข้อผิดพลาด' 
            : err.message
    });
});

// Start Server
app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Server เริ่มทำงานแล้ว!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('📁 Database: petizo.db');
    console.log('📂 Static Files: public/');
    console.log('📤 Uploads: uploads/');
    console.log('\n💡 ทดสอบ Login:');
    console.log('   Admin: admin@petizo.com / admin123');
    console.log('   User: user@petizo.com / user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
// Export for Vercel
module.exports = app;

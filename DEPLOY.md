# Petizo - Pet Management System

## 🚀 Deploy to Vercel (แนะนำ)

### ขั้นตอนที่ 1: Deploy บน Vercel

1. ไปที่ https://vercel.com/
2. Sign up/Login ด้วย GitHub
3. คลิก "Add New..." → "Project"
4. เลือก repository `Petizo`
5. คลิก "Deploy"

### ขั้นตอนที่ 2: เพิ่ม Vercel Postgres Database

1. ไปที่ Project Dashboard
2. คลิกแท็บ "Storage"
3. คลิก "Create Database" → เลือก "Postgres"
4. ตั้งชื่อ: `petizo-db`
5. เลือก Region ใกล้ที่สุด (Singapore)
6. คลิก "Create"

### ขั้นตอนที่ 3: Import Database Schema

1. ไปที่ Storage → petizo-db
2. คลิกแท็บ "Query"
3. คัดลอกเนื้อหาจากไฟล์ `init-postgres.sql`
4. วางใน Query Editor แล้วกด "Run"

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables

1. ไปที่ Project Settings → Environment Variables
2. Vercel จะเพิ่ม `POSTGRES_URL` อัตโนมัติ
3. เพิ่ม variables เหล่านี้:

```
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

4. คลิก "Redeploy" เพื่อใช้ค่าใหม่

### ขั้นตอนที่ 5: เสร็จสิ้น!

เว็บไซต์จะพร้อมใช้งานที่ URL ที่ Vercel สร้างให้ เช่น:
`https://petizo-xxxxx.vercel.app`

---

## 📝 Login Credentials

**Admin:**
- Email: admin@petizo.com
- Password: admin123

**Test User:**
- Email: user@petizo.com  
- Password: user123

---

## 🔧 Local Development

```bash
# ติดตั้ง dependencies
npm install

# รัน server
node server.js

# เปิดเบราว์เซอร์ที่
http://localhost:3000
```

---

## 📦 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: 
  - SQLite (Local Development)
  - PostgreSQL (Production - Vercel)
- **Authentication**: JWT
- **Hosting**: Vercel

---

## ⚠️ หมายเหตุ

- รูปภาพที่อัพโหลดจะหายหลัง redeploy (Vercel Serverless)
- แนะนำใช้ Cloudinary หรือ AWS S3 สำหรับเก็บรูป
- Database จะใช้ PostgreSQL บน Vercel แทน SQLite

---

## 🆘 Troubleshooting

**ปัญหา: Database connection error**
- ตรวจสอบว่าได้เพิ่ม Vercel Postgres แล้ว
- ตรวจสอบว่า `POSTGRES_URL` มีใน Environment Variables
- ลอง redeploy โปรเจค

**ปัญหา: 404 Not Found**
- ตรวจสอบ `vercel.json` config
- ตรวจสอบ routes ใน `server.js`

**ปัญหา: Images not loading**
- ใช้ Cloudinary สำหรับเก็บรูป
- หรือใช้ Vercel Blob Storage


### ขั้นตอนที่ 1: เตรียม GitHub Repository

1. สร้าง repository ใหม่บน GitHub
2. เปิด terminal และรันคำสั่ง:

```bash
cd "d:\PJ2\petizo chatbot\petizo"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/petizo.git
git push -u origin main
```

### ขั้นตอนที่ 2: Deploy บน Vercel

1. ไปที่ https://vercel.com/
2. Sign up/Login ด้วย GitHub
3. คลิก "Import Project"
4. เลือก repository `petizo`
5. ตั้งค่า:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (เว้นว่าง)
   - **Output Directory**: public
6. คลิก "Deploy"

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables (ถ้ามี)

ไปที่ Project Settings → Environment Variables และเพิ่ม:

```
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### ⚠️ ข้อจำกัดของ Vercel

- **SQLite**: Vercel ไม่รองรับ SQLite persistent storage
- แนะนำใช้ **Vercel Postgres** หรือ **MongoDB Atlas** แทน
- รูปภาพที่อัพโหลดจะหายหลัง deployment ใหม่
- แนะนำใช้ **Cloudinary** หรือ **AWS S3** สำหรับเก็บรูป

## 📦 ทางเลือกอื่น (รองรับ SQLite)

### Railway (แนะนำ)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Render
1. ไปที่ https://render.com/
2. New → Web Service
3. เชื่อม GitHub repo
4. ตั้งค่า:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

## 🔧 การแก้ไขสำหรับ Production

ถ้าต้องการใช้ฐานข้อมูล cloud:

### ใช้ PostgreSQL (Vercel Postgres):
1. ติดตั้ง: `npm install pg`
2. แก้ไข database connection ใน `server.js`

### ใช้ MongoDB (MongoDB Atlas):
1. ติดตั้ง: `npm install mongoose`
2. สร้าง account ที่ https://www.mongodb.com/cloud/atlas
3. แก้ไข database connection

## 📝 หมายเหตุ

- ไฟล์ที่เตรียมไว้แล้ว:
  - ✅ `vercel.json` - Vercel configuration
  - ✅ `.gitignore` - ไฟล์ที่ไม่ต้อง commit
  - ✅ `.vercelignore` - ไฟล์ที่ไม่ deploy
  - ✅ `module.exports = app` - Export สำหรับ Vercel

## 🎯 Next Steps

1. Push code ไป GitHub
2. Deploy บน Vercel/Railway
3. ตั้งค่า environment variables
4. Test บน production URL
5. (Optional) ย้ายไป PostgreSQL/MongoDB

## 🆘 Support

หากมีปัญหา:
1. ตรวจสอบ logs บน Vercel dashboard
2. ตรวจสอบ environment variables
3. ตรวจสอบ database connection

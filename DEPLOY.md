# Petizo - Pet Management System

## 🚀 Deploy to Vercel

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

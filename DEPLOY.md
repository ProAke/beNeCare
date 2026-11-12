# คู่มือติดตั้ง beNeCare บน uarea.in (Shared Hosting)

ระบบ beNeCare พัฒนาด้วย Next.js 16 + TypeScript + Tailwind CSS + MariaDB (Prisma ORM)

## ขั้นตอนที่ 1 — อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์

อัปโหลดทุกไฟล์ในโฟลเดอร์ `beNeCare/` (ยกเว้น `node_modules`, `.next`, `out`, `.env.local`) ไปยังโฟลเดอร์เว็บไซต์ เช่น:

```
/var/www/vhosts/uarea.in/benecare.uarea.in/
```

## ขั้นตอนที่ 2 — สร้างไฟล์ `.env` บนเซิร์ฟเวอร์

สร้างไฟล์ `.env` ในรากโปรเจกต์ (ไม่ต้อง commit ลง git) โดยคัดลอกจาก `.env.example` แล้วแก้ไขค่าให้ตรงกับเซิร์ฟเวอร์:

```bash
cp .env.example .env
nano .env
```

ตัวอย่างค่าที่ตั้งสำหรับ `bebecare.uarea.in`:

```env
# โดเมนเว็บไซต์
NEXTAUTH_URL="https://bebecare.uarea.in"
APP_URL="https://bebecare.uarea.in"

# ฐานข้อมูล MariaDB (ปรับ host ตามที่ตั้งจริงบน uarea.in)
# ถ้าฐานข้อมูลอยู่บนเซิร์ฟเวอร์เดียวกัน ใช้ localhost
# ถ้าใช้ฐานข้อมูลภายนอก ใช้ IP หรือ domain ของ database server
DATABASE_URL="mysql://เบอร์ผู้ใช้_db:รหัสผ่าน_db@localhost:3306/ชื่อฐานข้อมูล"

# รหัสลับสำหรับ session (สร้างค่าสุ่มใหม่ เช่น openssl rand -base64 32)
NEXTAUTH_SECRET="เปลี่ยนเป็นสร็อตสุ่มยาวๆ"

# LINE Official Account (จาก LINE Developers Console)
LINE_CHANNEL_ID="ลำดับช่องทาง LINE ของคุณ"
LINE_CHANNEL_SECRET="รหัสลับช่องทาง LINE ของคุณ"
LINE_CHANNEL_ACCESS_TOKEN="โทเค็นเข้าถึงช่องทาง LINE ของคุณ"

# AI (ตัวเลือก — สำหรับตอบคำถามอัตโนมัติ)
OPENAI_API_KEY="คีย์ API ของคุณ"
OPENAI_MODEL="gpt-4o-mini"

# เวอร์ชันระบบ
APP_NAME="beNeCare"
APP_VERSION="1.0.0"
```

## ขั้นตอนที่ 3 — ติดตั้ง Dependency และสร้าง Prisma Client

```bash
npm install --production
npx prisma generate
```

## ขั้นตอนที่ 4 — สร้างฐานข้อมูลและรันマイกราชัน

```bash
npx prisma migrate deploy
```

หรือถ้ายังไม่มีตารางในฐานข้อมูล ให้สร้างด้วย:

```bash
npx prisma db push --accept-data-loss
```

## ขั้นตอนที่ 5 — Build และรันระบบ

```bash
npm run build
npm start
```

หรือถ้าใช้บน cPanel / Plesk ให้ตั้งค่า Node.js application ผ่าน control panel:
- เลือกเวอร์ชัน Node.js (แนะนำ 18.x ขึ้นไป)
- ตั้งไฟล์เริ่มต้นเป็น `server.js` หรือใช้ `npm start`
- ตั้งค่า environment variables ผ่าน control panel

## ขั้นตอนที่ 6 — ติดตั้งระบบครั้งแรก (Installer)

เปิดเว็บไซต์ `https://bebecare.uarea.in` จะเข้าสู่หน้าติดตั้งอัตโนมัติ

ทำตามขั้นตอน:
1. ตรวจสอบสภาพแวดล้อม
2. ตั้งค่าการเชื่อมต่อ MariaDB
3. สร้างบัญชี Super Admin คนแรก
4. ตั้งค่าบริษัทแรก
5. ตั้งค่า LINE Official Account (ตัวเลือก)

## ขั้นตอนที่ 7 — ตั้งค่า LINE Official Account

ใน LINE Developers Console ตั้งค่า Webhook URL เป็น:

```
https://bebecare.uarea.in/api/line/webhook
```

และตั้ง Redirect URI (ถ้ามี) เป็น:

```
https://bebecare.uarea.in/api/auth/line/callback
```

## การแก้ไขปัญหา Server Error 500

ถ้าเจอข้อผิดพลาด 500 เมื่อเข้าหน้าเว็บ:

| อาการ | วิธีแก้ไข |
|---|---|
| หน้าขาว / 500 Error ทันที | ตรวจสอบว่าไฟล์ `.env` มีอยู่และ `DATABASE_URL` ถูกต้อง |
| ไม่สามารถเชื่อมต่อฐานข้อมูล | ตรวจสอบ host, port, username, password ของ MariaDB |
| Prisma client error | รัน `npx prisma generate` อีกครั้ง |
| ตารางฐานข้อมูลไม่พบ | รัน `npx prisma migrate deploy` |
| Middleware warning | แจ้งเตือนเท่านั้น ไม่ส่งผลต่อการทำงาน (จะแก้ในรอบถัดไป) |

ดูรายละเอียดข้อผิดพลาดได้จากไฟล์ log ของเซิร์ฟเวอร์หรือคอนโซลเบราว์เซอร์ (F12 → Network → ดู response ของ request ที่ล้มเหลว)

## โครงสร้างโฟลเดอร์บนเซิร์ฟเวอร์

```
/var/www/vhosts/uarea.in/benecare.uarea.in/
├── .env                    ← สร้างใหม่ (ไม่ต้อง commit)
├── .env.example            ← ตัวแปรตัวอย่าง
├── package.json
├── package-lock.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── page.tsx        ← หน้าแรก (redirect ตามสถานะ)
│   │   ├── error.tsx       ← จัดการข้อผิดพลาด 500
│   │   └── global-error.tsx
│   └── lib/prisma.ts
├── next.config.ts
└── .next/                  ← สร้างหลังรัน npm run build
```

## หมายเหตุสำคัญ

- **ไม่ควร commit ไฟล์ `.env` ลง git** เนื่องจากมีรหัสผ่านและข้อมูลลับ
- หากเซิร์ฟเวอร์ไม่รองรับการรัน `npm start` ตลอดเวลา ให้ใช้ process manager เช่น `pm2`
- การอัปเกรดระบบในอนาคต ให้เข้าเมนู **การตั้งค่าระบบ → ส่วนอัปเกรดระบบ** หลังล็อกอินในฐานะ Super Admin

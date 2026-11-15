# คู่มือติดตั้ง beNeCare บน uarea.in (Nuxt.js 3 + MariaDB)

ระบบ beNeCare พัฒนาด้วย Nuxt.js 3 + TypeScript + Tailwind CSS + MariaDB
ตั้งค่าทุกอย่างผ่านหน้าเว็บ UI **ไม่จำเป็นต้องมีไฟล์ `.env`**

## ขั้นตอนที่ 1 — อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์

อัปโหลดทุกไฟล์ในโฟลเดอร์ `beNeCare/` (ยกเว้น `node_modules`, `.output`, `dist`, `data/`) ไปยังโฟลเดอร์เว็บไซต์ เช่น:

```
/var/www/vhosts/uarea.in/benecare.uarea.in/
```

## ขั้นตอนที่ 2 — ติดตั้ง Dependency

บนเซิร์ฟเวอร์ ให้รันคำสั่ง:

```bash
cd /var/www/vhosts/uarea.in/benecare.uarea.in
npm install --production
```

## ขั้นตอนที่ 3 — Build ระบบ

```bash
npm run build
```

จะสร้างโฟลเดอร์ `.output/` สำหรับรันใน production

## ขั้นตอนที่ 4 — รันระบบ

```bash
npm start
```

หรือถ้าใช้บน cPanel / Plesk ให้ตั้งค่า Node.js application ผ่าน control panel:
- เลือกเวอร์ชัน Node.js (แนะนำ 18.x ขึ้นไป)
- ตั้งไฟล์เริ่มต้นเป็น `node .output/server/index.mjs`
- ตั้งค่า environment variables ตามจำเป็น (ถ้ามี)

## ขั้นตอนที่ 5 — ติดตั้งระบบครั้งแรกผ่านหน้าเว็บ

เปิดเว็บไซต์ `https://bebecare.uarea.in` จะเข้าสู่หน้าติดตั้งอัตโนมัติ

ทำตามขั้นตอน:
1. **กรอกรหัส PIN** (เริ่มต้น: **524452**) — รหัสนี้ใช้สำหรับเข้าถึงหน้าติดตั้งทุกครั้ง
2. **ตั้งค่าฐานข้อมูล MariaDB** — กรอก host, port, database name, username, password ผ่านหน้า UI
3. **สร้างบัญชี Super Admin** — อีเมล, รหัสผ่าน, ชื่อผู้ดูแลระบบ
4. **ตั้งค่าบริษัทแรก** — ชื่อบริษัท, รหัสประจำตัวผู้เสียภาษี, อีเมลผู้ติดต่อ, เบอร์โทร
5. **ตั้งค่า LINE Official Account** (ตัวเลือก) — Channel ID, Channel Secret (สามารถตั้งค่าทีหลังได้)

หลังติดตั้งเสร็จ ระบบจะสร้างไฟล์ `data/install-config.json` (แทนไฟล์ `.env`)

## ขั้นตอนที่ 6 — ตั้งค่า LINE Official Account

ใน LINE Developers Console ตั้งค่า Webhook URL เป็น:

```
https://bebecare.uarea.in/api/line/webhook
```

## การติดตั้งใหม่ (Reinstall / Reset)

หากการตั้งค่าไม่ครบถ้วนหรือต้องการเริ่มต้นใหม่:
1. เข้าหน้า `https://bebecare.uarea.in/installer/pin`
2. กรอกรหัส PIN (524452)
3. เลือกโหมด "ติดตั้งระบบใหม่ (Reinstall)"
4. ทำเครื่องหมายยืนยันการลบข้อมูลเดิม
5. กรอกข้อมูลใหม่แล้วติดตั้ง

## การอัปเดตเวอร์ชัน (Update Version)

หลังจากติดตั้งแล้ว เข้าเมนู "การตั้งค่าระบบ" → "ส่วนอัปเกรดระบบ"
- ตรวจสอบเวอร์ชันปัจจุบันและเวอร์ชันใหม่
- คลิก "สำรองข้อมูลก่อนอัปเกรด" (แนะนำ)
- คลิก "อัปเกรดเป็นเวอร์ชัน X.X.X" — ระบบจะรันマイกราชันอัตโนมัติ

## การแก้ไขปัญหา Server Error 500

ถ้าเจอข้อผิดพลาด 500 เมื่อเข้าหน้าเว็บ:

| อาการ | วิธีแก้ไข |
|---|---|
| หน้าขาว / 500 Error ทันที | ตรวจสอบว่าไฟล์ `data/install-config.json` มีอยู่หรือไม่ (ยังไม่ได้ติดตั้งระบบ) |
| ไม่สามารถเชื่อมต่อฐานข้อมูล | ตรวจสอบ host, port, username, password ของ MariaDB ในหน้าติดตั้ง |
| Build error เกี่ยวกับ Tailwind | ตรวจสอบว่าได้รัน `npm install` และ `npm run build` แล้ว |
| Middleware warning | แจ้งเตือนเท่านั้น ไม่ส่งผลต่อการทำงาน |

ดูรายละเอียดข้อผิดพลาดได้จากไฟล์ log ของเซิร์ฟเวอร์หรือคอนโซลเบราว์เซอร์ (F12 → Network → ดู response ของ request ที่ล้มเหลว)

## โครงสร้างโฟลเดอร์บนเซิร์ฟเวอร์

```
/var/www/vhosts/uarea.in/benecare.uarea.in/
├── .env.example            ← ตัวแปรตัวอย่าง (ไม่บังคับต้องใช้)
├── package.json
├── package-lock.json
├── nuxt.config.ts
├── app.vue
├── assets/css/main.css
├── composables/
├── components/
├── pages/
│   ├── index.vue
│   ├── login.vue
│   ├── dashboard.vue
│   ├── installer/
│   │   ├── pin.vue
│   │   └── index.vue
│   └── settings/
│       └── index.vue
├── server/
│   └── api/
├── data/
│   ├── install-config.json   ← สร้างโดย Installer (แทน .env)
│   └── backup_config_*.json  ← ไฟล์สำรองการตั้งค่า
├── .output/                  ← สร้างหลังรัน npm run build
├── docs/
├── DEPLOY.md
└── README.md
```

## หมายเหตุสำคัญ

- **ไม่จำเป็นต้องมีไฟล์ `.env`** — การตั้งค่าทั้งหมดทำผ่านหน้า UI และเก็บใน `data/install-config.json`
- **ไม่ควร commit ไฟล์ `data/install-config.json` ลง git** เนื่องจากมีรหัสผ่านและข้อมูลลับ
- หากเซิร์ฟเวอร์ไม่รองรับการรัน `npm start` ตลอดเวลา ให้ใช้ process manager เช่น `pm2`
- การอัปเกรดระบบในอนาคต ให้เข้าเมนู **การตั้งค่าระบบ → ส่วนอัปเกรดระบบ** หลังล็อกอินในฐานะ Super Admin

# beNeCare — Group Insurance Customer Care Platform (LINE OA)

ระบบดูแลลูกค้าประกันกลุ่ม ผ่าน LINE OA ตอบคำถามตลอด 24 ชั่วโมง
แยกข้อมูลแต่ละบริษัท (Multi-tenant) รองรับสูงสุด 5,000 คนต่อบริษัท
พัฒนาบน **Next.js + MariaDB** มีติดตั้งครั้งแรก (Installer) และระบบอัปเกรดในส่วนการตั้งค่า

## โครงสร้างโปรเจกต์

```
beNeCare/
├── prisma/schema.prisma          — โครงสร้างฐานข้อมูล MariaDB (Prisma ORM)
├── .env.example                  — ตัวแปรสภาพแวดล้อมตัวอย่าง
├── src/
│   ├── app/
│   │   ├── page.tsx              — หน้า Landing (redirect ตามสถานะการติดตั้ง)
│   │   ├── installer/            — วิซาร์ดติดตั้งระบบครั้งแรก
│   │   ├── login/                — หน้าเข้าสู่ระบบ
│   │   ├── dashboard/            — แดชบอร์ดภาพรวม
│   │   ├── companies/            — จัดการบริษัทลูกค้า
│   │   ├── employees/            — จัดการพนักงาน
│   │   ├── line-oa/              — ตั้งค่า LINE Official Account
│   │   ├── faq/                  — จัดการคำถามที่พบบ่อย
│   │   ├── conversations/        — ประวัติการสนทนา
│   │   ├── broadcast/            — ส่งข้อความแจ้งเตือน
│   │   ├── settings/             — การตั้งค่าระบบ + ส่วนอัปเกรด
│   │   ├── audit-log/            — ประวัติการดำเนินการ
│   │   ├── api/
│   │   │   ├── installer/        — API สำหรับ Installer (status, env, test-db, install-db, create-admin, create-company, save-line-oa)
│   │   │   ├── auth/login/       — API เข้าสู่ระบบ (JWT)
│   │   │   ├── dashboard/stats/  — API สถิติดashboard
│   │   │   ├── companies/        — API CRUD บริษัท
│   │   │   ├── settings/backup/  — API สำรองข้อมูลก่อนอัปเกรด
│   │   │   ├── settings/upgrade/ — API อัปเกรดระบบ (マイกราชัน)
│   │   │   ├── line/webhook/     — LINE OA Webhook receiver
│   │   │   └── ai/chat/          — AI ตอบคำถาม (OpenAI)
│   │   ├── layout.tsx            — Root layout
│   │   └── globals.css           — Tailwind styles (โทนสีใกล้เคียง AIA)
│   ├── lib/prisma.ts             — Prisma client singleton
│   └── middleware.ts             — Middleware ป้องกันหน้าที่ต้องล็อกอิน
├── docs/                         — เอกสารสองชิ้น (Brand Strategy + AI System Brief)
│   ├── 01_BRAND_STRATEGY_PRESENTATION.md
│   └── 02_AI_SYSTEM_DEVELOPMENT_BRIEF.md
└── middleware.ts
```

## การติดตั้งครั้งแรก

1. คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่าจริง (โดยเฉพาะ `DATABASE_URL`)
2. รัน `npm install` เพื่อติดตั้ง dependency
3. รัน `npm run dev` เพื่อเริ่มต้นเซิร์ฟเวอร์ ontwikk
4. เข้า `http://localhost:3000` จะเข้าสู่ Installer อัตโนมัติ
5. ทำตามขั้นตอนใน Installer: ตรวจสอบสภาพแวดล้อม → ตั้งค่า MariaDB → สร้าง Super Admin → ตั้งค่าบริษัท → ตั้งค่า LINE OA

## การอัปเกรดระบบ

เข้าสู่ระบบในฐานะ Super Admin → ไปที่ **การตั้งค่าระบบ → ส่วนอัปเกรดระบบ**
- ตรวจสอบเวอร์ชันปัจจุบันและเวอร์ชันใหม่
- สำรองข้อมูลฐานข้อมูลก่อนอัปเกรด (แนะนำ)
- รันマイกราชันฐานข้อมูลอัตโนมัติ
- ดูประวัติการอัปเกรดได้ในหน้าเดียวกัน

## เอกสารอ้างอิง

- `docs/01_BRAND_STRATEGY_PRESENTATION.md` — Brand Strategy Presentation (11 สไลด์)
- `docs/02_AI_SYSTEM_DEVELOPMENT_BRIEF.md` — AI System Development Brief (ข้อกำหนดระบบฉบับสมบูรณ์)

## แยกข้อกำหนดชัดเจน

- **ส่วนที่ยืนยันแล้ว (สร้างได้ทันที):** ระบบติดตั้ง, ฐานข้อมูล multi-tenant, LINE OA พื้นฐาน, Admin Web, AI ตอบคำถาม, ส่วนอัปเกรด, Security/RBAC
- **ส่วนที่ต้องยืนยันกับ AIA ก่อน (ห้ามสร้างขึ้นมาเอง):** การเชื่อมต่อ API กับ AIA, การใช้โลโก้/ชื่อ AIA, SSO, การดึงข้อมูลผู้เอาประกันจาก AIA

## เทคโนโลยี

- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS
- Database: MariaDB (ผ่าน Prisma ORM)
- Auth: JWT + bcrypt (รหัสผ่านถูก hash ก่อนจัดเก็บ)
- LINE: LINE Messaging API (Webhook, Rich Menu, Broadcast)
- AI: OpenAI API (Intent classification, FAQ answer)

สาขา git ปัจจุบัน: `arena/8d60f769-benecare`

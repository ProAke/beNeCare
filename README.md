# beNeCare — Group Insurance Customer Care Platform (LINE OA)

ระบบดูแลลูกค้าประกันกลุ่ม ผ่าน LINE OA ตอบคำถามตลอด 24 ชั่วโมง
แยกข้อมูลแต่ละบริษัท (Multi-tenant) รองรับสูงสุด 5,000 คนต่อบริษัท
พัฒนาบน **Nuxt.js 3 + TypeScript + Tailwind CSS + MariaDB**
มีติดตั้งครั้งแรก (Installer) และระบบอัปเกรดในส่วนการตั้งค่า

## เอกสารสองชิ้นที่ใช้งานต่อได้จริง

1. `docs/01_BRAND_STRATEGY_PRESENTATION.md` — สไลด์นำเสนอแนวคิดแบรนด์ beNeCare
   (ภาพลักษณ์, กลุ่มเป้าหมาย, บริการ, โรดแมป, สีใกล้เคียง AIA)
2. `docs/02_AI_SYSTEM_DEVELOPMENT_BRIEF.md` — เอกสารสั่ง AI สร้างระบบ
   (ฟังก์ชัน, หน้าจอ, ผู้ใช้งาน, ฐานข้อมูล, Workflow, AI, LINE OA, Admin, Security, เกณฑ์ตรวจรับ)

## แยกชัดเจน

- **สิ่งที่ยืนยันแล้ว (ระบบ)**: ฟังก์ชันระบบ, ฐานข้อมูล, LINE OA พื้นฐาน, Admin, Security, Installer, อัปเกรด
- **สิ่งที่ต้องยืนยันกับ AIA ก่อน**: การเชื่อมต่อ API/Fintech/claims ของ AIA, การใช้โลโก้และชื่อ AIA, SSO, ข้อมูลเบี้ยประกันและเคลม — **ห้ามให้ AI สร้างฟังก์ชันหรือการเชื่อมต่อนี้ขึ้นมาเอง**

## โครงสร้างโปรเจกต์ (Nuxt.js 3)

```
beNeCare/
├── nuxt.config.ts            — การตั้งค่า Nuxt (ไม่บังคับต้องมี .env)
├── package.json              — Dependency ของโปรเจกต์
├── tsconfig.json             — TypeScript config
├── app.vue                   — Root layout
├── assets/css/main.css       — Tailwind CSS + โทนสีใกล้เคียง AIA
├── composables/
│   ├── useDb.ts              — เชื่อมต่อ MariaDB (mysql2)
│   └── useInstallConfig.ts   — อ่าน/เขียนไฟล์ config JSON (แทน .env)
├── components/               — คอมโพเนนต์ Vue
├── pages/
│   ├── index.vue             — หน้าแรก (redirect ตามสถานะ)
│   ├── login.vue             — หน้าเข้าสู่ระบบ
│   ├── dashboard.vue         — แดชบอร์ดภาพรวม
│   ├── installer/
│   │   ├── pin.vue           — หน้ากรอกรหัส PIN (524452)
│   │   └── index.vue         — วิซาร์ดติดตั้ง (install / reinstall / update)
│   └── settings/
│       └── index.vue         — การตั้งค่าระบบ + ส่วนอัปเกรด
├── server/
│   ├── api/
│   │   ├── installer/
│   │   │   ├── status.get.ts     — ตรวจสอบสถานะการติดตั้ง
│   │   │   ├── pin.post.ts       — ตรวจสอบรหัส PIN
│   │   │   ├── environment.get.ts — ตรวจสอบสภาพแวดล้อม
│   │   │   ├── test-db.post.ts   — ทดสอบเชื่อมต่อฐานข้อมูล
│   │   │   ├── install-db.post.ts — สร้างฐานข้อมูลและตาราง
│   │   │   ├── save-line-oa.post.ts — ตั้งค่า LINE OA
│   │   │   └── reinstall.post.ts — ติดตั้งระบบใหม่ (รีเซต)
│   │   ├── settings/
│   │   │   ├── upgrade.post.ts     — อัปเดตเวอร์ชันระบบ
│   │   │   ├── upgrade-history.get.ts — ประวัติการอัปเกรด
│   │   │   └── backup.post.ts      — สำรองข้อมูลการตั้งค่า
│   │   ├── auth/
│   │   │   └── login.post.ts     — เข้าสู่ระบบ (JWT)
│   │   ├── line/webhook.post.ts  — รับข้อความจาก LINE OA
│   │   └── ai/chat.post.ts       — AI ตอบคำถาม (OpenAI)
│   └── ...
├── data/
│   └── install-config.json   — สร้างโดย Installer (แทน .env)
├── docs/
│   ├── 01_BRAND_STRATEGY_PRESENTATION.md
│   └── 02_AI_SYSTEM_DEVELOPMENT_BRIEF.md
├── DEPLOY.md                 — คู่มือติดตั้งบนเซิร์ฟเวอร์จริง
└── .env.example              — ตัวแปรสภาพแวดล้อมตัวอย่าง
```

## การติดตั้งครั้งแรก (One-click ผ่านหน้า UI)

1. อัปโหลดไฟล์ทั้งหมดขึ้นเซิร์ฟเวอร์ (ยกเว้น `node_modules`, `.output`, `dist`, `data/`)
2. รัน `npm install` เพื่อติดตั้ง dependency
3. รัน `npm run dev` สำหรับพัฒนา หรือ `npm run build` แล้ว `npm start` สำหรับ production
4. เปิดเว็บไซต์ `https://bebecare.uarea.in` จะเข้าสู่หน้าติดตั้งอัตโนมัติ
5. กรอกรหัส PIN (เริ่มต้น: **524452**) เพื่อเข้าหน้าติดตั้ง
6. ทำตามขั้นตอนใน Installer: ตั้งค่า MariaDB → สร้าง Super Admin → ตั้งค่าบริษัท → ตั้งค่า LINE OA
7. หลังติดตั้งเสร็จ ระบบจะสร้างไฟล์ `data/install-config.json` (แทนไฟล์ `.env`)

## การติดตั้งใหม่ (Reinstall / Reset)

หากการตั้งค่าไม่ครบถ้วนหรือต้องการเริ่มต้นใหม่:
1. เข้าหน้า `/installer/pin` และกรอกรหัส PIN
2. เลือกโหมด "ติดตั้งระบบใหม่ (Reinstall)"
3. ทำเครื่องหมายยืนยันการลบข้อมูลเดิม
4. กรอกข้อมูลใหม่แล้วติดตั้ง

## การอัปเดตเวอร์ชัน (Update Version)

หลังจากติดตั้งแล้ว เข้าเมนู "การตั้งค่าระบบ" → "ส่วนอัปเกรดระบบ"
- ตรวจสอบเวอร์ชันปัจจุบันและเวอร์ชันใหม่
- สำรองข้อมูลก่อนอัปเกรด (แนะนำ)
- คลิก "อัปเกรดเป็นเวอร์ชัน X.X.X" ระบบจะรันマイกราชันอัตโนมัติ

## คู่มือการใช้งาน

ดูรายละเอียดใน `DEPLOY.md` สำหรับการติดตั้งบนเซิร์ฟเวอร์จริง (uarea.in shared hosting)

## เอกสารอ้างอิง

- `docs/01_BRAND_STRATEGY_PRESENTATION.md` — Brand Strategy Presentation (11 สไลด์)
- `docs/02_AI_SYSTEM_DEVELOPMENT_BRIEF.md` — AI System Development Brief (ข้อกำหนดระบบฉบับสมบูรณ์)

## แยกข้อกำหนดชัดเจน

- **ส่วนที่ยืนยันแล้ว (สร้างได้ทันที):** ระบบติดตั้ง, ฐานข้อมูล multi-tenant, LINE OA พื้นฐาน, Admin Web, AI ตอบคำถาม, ส่วนอัปเกรด, Security/RBAC
- **ส่วนที่ต้องยืนยันกับ AIA ก่อน (ห้ามสร้างขึ้นมาเอง):** การเชื่อมต่อ API กับ AIA, โลโก้/ชื่อ AIA, SSO, ข้อมูลผู้เอาประกันจาก AIA

## เทคโนโลยี

- Frontend: Nuxt.js 3 (Vue 3), TypeScript, Tailwind CSS
- Database: MariaDB (ผ่าน mysql2 โดยตรง ไม่ใช้ Prisma)
- Auth: JWT + bcrypt (รหัสผ่านถูก hash ก่อนจัดเก็บ)
- LINE: LINE Messaging API (Webhook, Rich Menu, Broadcast)
- AI: OpenAI API (Intent classification, FAQ answer)
- Config: เก็บใน `data/install-config.json` (แทนไฟล์ `.env`)

สาขา git ปัจจุบัน: `arena/2964b5d4-benecare`

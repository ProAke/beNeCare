import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { confirm, adminEmail, adminPassword, adminName, companyName, companyTaxId, companyEmail, companyPhone } = await req.json();

    if (!confirm) {
      return NextResponse.json(
        { ok: false, message: "ต้องยืนยันการติดตั้งใหม่ (ยินยอมให้เขียนทับข้อมูลเดิม)" },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { ok: false, message: "ยังไม่ได้กำหนดค่า DATABASE_URL ในไฟล์ .env" },
        { status: 400 }
      );
    }

    // 1. รันマイกราชันใหม่ (สร้าง/อัปเดตตารางฐานข้อมูล)
    try {
      execSync("npx prisma migrate deploy --accept-data-loss", {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
        timeout: 120000,
      });
    } catch (migrateError: any) {
      // ถ้า migrate deploy ล้มเหลว ให้ลอง db push
      try {
        execSync("npx prisma db push --accept-data-loss", {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: "pipe",
          timeout: 120000,
        });
      } catch (pushError: any) {
        return NextResponse.json(
          { ok: false, message: pushError.message || "รีเซ็ตฐานข้อมูลไม่สำเร็จ" },
          { status: 500 }
        );
      }
    }

    // 2. ลบข้อมูลเดิมทั้งหมด (สำหรับ reinstall ที่ต้องการเริ่มต้นใหม่ทั้งหมด)
    try {
      // ลบตามลำดับที่ไม่ละเมิด foreign key
      await prisma.$executeRawUnsafe(
        `SET FOREIGN_KEY_CHECKS=0;`
      );
      await prisma.auditLog.deleteMany();
      await prisma.message.deleteMany();
      await prisma.conversation.deleteMany();
      await prisma.broadcast.deleteMany();
      await prisma.faq.deleteMany();
      await prisma.employee.deleteMany();
      await prisma.companyUser.deleteMany();
      await prisma.company.deleteMany();
      await prisma.systemAdmin.deleteMany();
      await prisma.systemSetting.deleteMany();
      await prisma.schemaMigration.deleteMany();
      await prisma.$executeRawUnsafe(
        `SET FOREIGN_KEY_CHECKS=1;`
      );
    } catch {
      // ถ้าลบไม่ได้บางตาราง อาจจะยังไม่มีข้อมูล ให้ข้ามไป
    }

    // 3. รันマイกราชันอีกครั้งหลังจากลบข้อมูล (สร้างตารางใหม่ทั้งหมด)
    try {
      execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
        timeout: 120000,
      });
    } catch {
      try {
        execSync("npx prisma db push --accept-data-loss", {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: "pipe",
          timeout: 120000,
        });
      } catch (pushError: any) {
        return NextResponse.json(
          { ok: false, message: pushError.message || "สร้างตารางฐานข้อมูลใหม่ไม่สำเร็จ" },
          { status: 500 }
        );
      }
    }

    // 4. สร้าง Super Admin คนใหม่
    if (!adminEmail || !adminPassword || !adminName) {
      return NextResponse.json(
        { ok: false, message: "กรอกข้อมูล Super Admin ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existingAdmin = await prisma.systemAdmin.findUnique({
      where: { email: adminEmail },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { ok: false, message: "อีเมล Super Admin นี้มีอยู่ในระบบแล้ว" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.systemAdmin.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        role: "super_admin",
      },
    });

    // 5. สร้างบริษัทแรก
    if (!companyName || !companyEmail) {
      return NextResponse.json(
        { ok: false, message: "กรอกชื่อบริษัทและอีเมลผู้ติดต่อให้ครบถ้วน" },
        { status: 400 }
      );
    }

    await prisma.company.create({
      data: {
        name: companyName,
        taxId: companyTaxId || null,
        contactEmail: companyEmail,
        contactPhone: companyPhone || null,
        isActive: true,
      },
    });

    // 6. บันทึกเวอร์ชันระบบ
    await prisma.systemSetting.upsert({
      where: { key: "app_version" },
      update: { value: process.env.APP_VERSION || "1.0.0" },
      create: {
        key: "app_version",
        value: process.env.APP_VERSION || "1.0.0",
        description: "เวอร์ชันของระบบ beNeCare",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "ติดตั้งระบบใหม่ (Reinstall) สำเร็จแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "ติดตั้งระบบใหม่ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

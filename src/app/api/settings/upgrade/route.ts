import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { targetVersion } = await req.json();

    if (!targetVersion) {
      return NextResponse.json(
        { ok: false, message: "ระบุเวอร์ชันเป้าหมาย" },
        { status: 400 }
      );
    }

    // ตรวจสอบ Prisma migrations ที่ยังไม่ได้รัน
    try {
      execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 120000,
      });
    } catch (migrateError: any) {
      return NextResponse.json(
        {
          ok: false,
          message: migrateError.message || "รันマイกราชันไม่สำเร็จ",
        },
        { status: 500 }
      );
    }

    // บันทึกประวัติการอัปเกรด
    await prisma.auditLog.create({
      data: {
        action: "system_upgrade",
        entityType: "system",
        entityId: null,
        oldValue: process.env.APP_VERSION || "1.0.0",
        newValue: targetVersion,
        userType: "system_admin",
      },
    });

    // อัปเดตเวอร์ชันในระบบตัวแปรสภาพแวดล้อม (ใน production ควรเขียนไฟล์ .env)
    // ที่นี่ใช้การบันทึกในฐานข้อมูลแทน
    await prisma.systemSetting.upsert({
      where: { key: "app_version" },
      update: { value: targetVersion },
      create: {
        key: "app_version",
        value: targetVersion,
        description: "เวอร์ชันของระบบ beNeCare",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `อัปเกรดเป็นเวอร์ชัน ${targetVersion} เรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "อัปเกรดระบบไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

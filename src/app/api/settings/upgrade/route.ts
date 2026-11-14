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

    // อ่านเวอร์ชันปัจจุบันจากระบบ (สำหรับบันทึกใน audit log)
    let currentVersion = "1.0.0";
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "app_version" },
      });
      if (setting) {
        currentVersion = setting.value;
      }
    } catch {
      // ใช้ค่าเริ่มต้นถ้ายังไม่มีตาราง system_settings
    }

    // รันマイกราชันฐานข้อมูล
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

    // อัปเดตเวอร์ชันในฐานข้อมูล
    await prisma.systemSetting.upsert({
      where: { key: "app_version" },
      update: { value: targetVersion },
      create: {
        key: "app_version",
        value: targetVersion,
        description: "เวอร์ชันของระบบ beNeCare",
      },
    });

    // บันทึกประวัติการอัปเกรดใน audit log
    await prisma.auditLog.create({
      data: {
        action: "system_upgrade",
        entityType: "system",
        entityId: null,
        oldValue: currentVersion,
        newValue: targetVersion,
        userType: "system_admin",
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

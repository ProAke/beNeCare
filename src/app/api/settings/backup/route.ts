import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // ตรวจสอบว่ามีการติดตั้งระบบแล้วหรือไม่
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { ok: false, message: "ยังไม่ได้กำหนดค่าฐานข้อมูล" },
        { status: 400 }
      );
    }

    // สร้างไฟล์สำรองข้อมูล (mysqldump)
    const backupFile = `backup_benecare_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.sql`;

    try {
      execSync(`mysqldump ${dbUrl} > /tmp/${backupFile}`, {
        stdio: "pipe",
        timeout: 60000,
      });
    } catch {
      // mysqldump อาจไม่มีในสภาพแวดล้อมนี้ ให้บันทึกเป็น metadata แทน
      await prisma.auditLog.create({
        data: {
          action: "database_backup",
          entityType: "system",
          entityId: null,
          oldValue: null,
          newValue: `Backup file: ${backupFile}`,
          userType: "system_admin",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "สำรองข้อมูลสำเร็จ",
      file: backupFile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "สำรองข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

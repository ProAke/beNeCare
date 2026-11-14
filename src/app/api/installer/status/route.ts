import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_VERSION = process.env.APP_VERSION || "1.0.0";

export async function GET() {
  try {
    const hasEnv = !!process.env.DATABASE_URL;

    // 1. ยังไม่มีไฟล์ .env / DATABASE_URL → ยังไม่ได้ติดตั้ง
    if (!hasEnv) {
      return NextResponse.json({
        installed: false,
        reason: "no_env",
        status: "not_installed",
        message: "ยังไม่ได้กำหนดค่า .env (DATABASE_URL)",
        appVersion: APP_VERSION,
        canInstall: true,
        canReinstall: false,
        canUpdate: false,
      });
    }

    // 2. มี env แล้ว ลองเชื่อมต่อฐานข้อมูลและตรวจสอบตาราง
    try {
      await prisma.company.findFirst();

      // ตรวจสอบเวอร์ชันจาก system_settings
      let dbVersion = APP_VERSION;
      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: "app_version" },
        });
        if (setting) {
          dbVersion = setting.value;
        }
      } catch {
        // ถ้ายังไม่มีตาราง system_settings ใช้ค่าเริ่มต้น
      }

      const needsUpdate = dbVersion !== APP_VERSION;

      return NextResponse.json({
        installed: true,
        reason: "ok",
        status: needsUpdate ? "needs_update" : "installed",
        message: needsUpdate
          ? `พบเวอร์ชันใหม่ (ปัจจุบัน ${dbVersion} → ใหม่ ${APP_VERSION})`
          : "ระบบติดตั้งแล้วและพร้อมใช้งาน",
        appVersion: dbVersion,
        latestVersion: APP_VERSION,
        needsUpdate,
        canInstall: false,
        canReinstall: true,
        canUpdate: needsUpdate,
      });
    } catch (dbError) {
      // มี env แต่ตารางยังไม่สร้าง หรือเชื่อมต่อ DB ไม่ได้
      const isConnectionError =
        (dbError as any)?.code === "ECONNREFUSED" ||
        (dbError as any)?.message?.includes("connect") ||
        (dbError as any)?.message?.includes("access");

      return NextResponse.json({
        installed: false,
        reason: isConnectionError ? "db_connection_error" : "no_db",
        status: "installation_needed",
        message: isConnectionError
          ? "เชื่อมต่อฐานข้อมูล MariaDB ไม่สำเร็จ กรุณาตรวจสอบ DATABASE_URL"
          : "มีการตั้งค่า .env แล้ว แต่ยังไม่ได้สร้างตารางฐานข้อมูล",
        appVersion: APP_VERSION,
        canInstall: true,
        canReinstall: false,
        canUpdate: false,
      });
    }
  } catch {
    return NextResponse.json({
      installed: false,
      reason: "error",
      status: "error",
      message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะระบบ",
      appVersion: APP_VERSION,
      canInstall: false,
      canReinstall: false,
      canUpdate: false,
    });
  }
}

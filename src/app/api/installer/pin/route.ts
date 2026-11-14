import { NextResponse } from "next/server";

// รหัส PIN สำหรับเข้าถึงหน้าติดตั้ง / จัดการระบบ (ถ้าไม่ได้กำหนดใน .env ให้ใช้ค่าเริ่มต้น)
const INSTALL_PIN = process.env.INSTALL_PIN || "524452";

// อายุของ session PIN (วินาที) — 1 ชั่วโมง
const PIN_SESSION_TTL = 60 * 60;

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json(
        { ok: false, message: "กรุณากรอกรหัส PIN" },
        { status: 400 }
      );
    }

    if (String(pin) !== INSTALL_PIN) {
      return NextResponse.json(
        { ok: false, message: "รหัส PIN ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบสถานะการติดตั้งปัจจุบัน
    const hasEnv = !!process.env.DATABASE_URL;
    let installed = false;
    let dbReady = false;

    if (hasEnv) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.company.findFirst();
        installed = true;
        dbReady = true;
      } catch {
        // ยังไม่มีตารางหรือเชื่อมต่อไม่ได้
      }
    }

    // ตั้งค่า cookie session สำหรับเข้าหน้าติดตั้ง (อายุ 1 ชั่วโมง)
    const response = NextResponse.json({
      ok: true,
      message: "ยืนยันรหัส PIN สำเร็จ",
      installed,
      dbReady,
      canInstall: !installed || !dbReady, // สามารถติดตั้งใหม่ได้ถ้ายังไม่ติดตั้ง หรือติดตั้งแล้วแต่มีปัญหา
      canReinstall: installed, // สามารถ reinstall ได้ถ้าติดตั้งแล้ว
      canUpdate: installed && dbReady, // สามารถอัปเดตเวอร์ชันได้ถ้าติดตั้งแล้วและฐานข้อมูลพร้อม
    });

    response.cookies.set("benecare_install_pin", "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PIN_SESSION_TTL,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "ตรวจสอบรหัส PIN ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

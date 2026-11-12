import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hasEnv = !!process.env.DATABASE_URL;

    // ถ้ายังไม่มี DATABASEurl ถือว่ายังไม่ติดตั้ง
    if (!hasEnv) {
      return NextResponse.json({ installed: false, reason: "no_env" });
    }

    // พยายามตรวจสอบว่าตารางฐานข้อมูลมีอยู่หรือไม่
    try {
      await prisma.company.findFirst();
      return NextResponse.json({ installed: true });
    } catch {
      // ตารางยังไม่สร้าง (ยังไม่ได้รันマイกราชัน)
      return NextResponse.json({ installed: false, reason: "no_db" });
    }
  } catch {
    return NextResponse.json({ installed: false, reason: "error" });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const env = process.env.DATABASE_URL;
    const hasEnv = !!env;

    // ตรวจสอบว่าไฟล์ .env มี DATABASE_URL หรือไม่
    // ใน production จะตรวจสอบจากตารางฐานข้อมูลจริง
    const installed = hasEnv;

    return NextResponse.json({ installed });
  } catch {
    return NextResponse.json({ installed: false });
  }
}

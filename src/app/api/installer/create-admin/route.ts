import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { ok: false, message: "กรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemAdmin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "อีเมลนี้มีอยู่ในระบบแล้ว" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.systemAdmin.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "super_admin",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "สร้างบัญชีแอดมินไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

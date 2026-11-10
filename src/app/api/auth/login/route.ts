import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "กรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหาใน system_admins ก่อน
    let admin = await prisma.systemAdmin.findUnique({ where: { email } });
    let userType = "system_admin";
    let companyId: string | null = null;

    if (!admin) {
      // ค้นหาใน company_users
      admin = await prisma.companyUser.findUnique({ where: { email } });
      userType = "company_admin";
      if (admin) {
        companyId = (admin as any).companyId;
      }
    }

    if (!admin) {
      return NextResponse.json(
        { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const adminAny = admin as any;
    const passwordMatch = await bcrypt.compare(password, adminAny.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (!adminAny.isActive) {
      return NextResponse.json(
        { ok: false, message: "บัญชีนี้ถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET || "default-secret-change-me";
    const token = sign(
      {
        id: adminAny.id,
        email: adminAny.email,
        role: adminAny.role,
        userType,
        companyId,
      },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: adminAny.id,
        email: adminAny.email,
        fullName: adminAny.fullName,
        role: adminAny.role,
        userType,
        companyId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "เข้าสู่ระบบไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

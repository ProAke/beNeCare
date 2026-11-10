import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, taxId, contactEmail, contactPhone } = await req.json();

    if (!name || !contactEmail) {
      return NextResponse.json(
        { ok: false, message: "กรอกชื่อบริษัทและอีเมลผู้ติดต่อ" },
        { status: 400 }
      );
    }

    await prisma.company.create({
      data: {
        name,
        taxId: taxId || null,
        contactEmail,
        contactPhone: contactPhone || null,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "สร้างบริษัทไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

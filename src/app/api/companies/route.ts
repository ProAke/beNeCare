import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        taxId: true,
        contactEmail: true,
        contactPhone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    return NextResponse.json(companies);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { name, taxId, contactEmail, contactPhone } = await req.json();

    if (!name || !contactEmail) {
      return NextResponse.json(
        { ok: false, message: "กรอกชื่อบริษัทและอีเมลผู้ติดต่อ" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        taxId: taxId || null,
        contactEmail,
        contactPhone: contactPhone || null,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, company });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "สร้างบริษัทไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

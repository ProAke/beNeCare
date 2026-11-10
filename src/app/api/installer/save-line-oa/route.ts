import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { companyName, channelId, channelSecret } = await req.json();

    const company = await prisma.company.findFirst({
      where: { name: companyName },
    });

    if (!company) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบบริษัท" },
        { status: 404 }
      );
    }

    await prisma.company.update({
      where: { id: company.id },
      data: {
        lineOaChannelId: channelId || null,
        lineOaChannelSecret: channelSecret || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "บันทึกการตั้งค่า LINE OA ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

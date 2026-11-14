import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: "system_upgrade" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const history = logs.map((log) => ({
      version: log.newValue || "ไม่ทราบ",
      date: log.createdAt.toLocaleDateString("th-TH"),
      admin: log.userId || "ระบบ",
    }));

    return NextResponse.json(history);
  } catch {
    return NextResponse.json([]);
  }
}

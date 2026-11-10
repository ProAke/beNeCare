import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [companies, employees, conversations, messagesToday] =
      await Promise.all([
        prisma.company.count(),
        prisma.employee.count(),
        prisma.conversation.count(),
        prisma.message.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return NextResponse.json({
      companies,
      employees,
      conversations,
      messagesToday,
    });
  } catch {
    // ถ้ายังไม่มีฐานข้อมูล ให้คืนค่าเริ่มต้น
    return NextResponse.json({
      companies: 0,
      employees: 0,
      conversations: 0,
      messagesToday: 0,
    });
  }
}

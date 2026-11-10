import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // LINE Webhook verification (ถ้าจำเป็น)
  return NextResponse.json({ status: "ok" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type !== "message" || event.message.type !== "text") {
        continue;
      }

      const replyToken = event.replyToken;
      const userId = event.source.userId;
      const userMessage = event.message.text;

      // ค้นหาพนักงานจาก line_user_id
      const employee = await prisma.employee.findFirst({
        where: { lineUserId: userId },
        include: { company: true },
      });

      if (!employee) {
        // ยังไม่ได้ผูกบัญชี LINE กับพนักงาน
        // ส่งข้อความแนะนำให้ติดต่อ HR
        continue;
      }

      // สร้างหรือดึง conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          companyId: employee.companyId,
          lineUserId: userId,
          status: "active",
        },
        orderBy: { startedAt: "desc" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            companyId: employee.companyId,
            lineUserId: userId,
            employeeId: employee.id,
            status: "active",
          },
        });
      }

      // บันทึกข้อความขาเข้า
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "inbound",
          messageType: "text",
          content: userMessage,
          aiHandled: false,
        },
      });

      // ค้นหาคำตอบจาก FAQ ของบริษัทนั้น
      const faqs = await prisma.faq.findMany({
        where: { companyId: employee.companyId, isActive: true },
        take: 10,
      });

      // ค้นหาคำตอบแบบง่าย (keyword matching)
      let replyText =
        "ขออภัยค่ะ ระบบยังไม่พบคำตอบที่ตรงกับคำถามของคุณ ทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ";

      const lowerMessage = userMessage.toLowerCase();
      for (const faq of faqs) {
        if (
          lowerMessage.includes(faq.question.toLowerCase()) ||
          faq.question.toLowerCase().includes(lowerMessage)
        ) {
          replyText = faq.answer;
          break;
        }
      }

      // บันทึกข้อความขาออก (AI ตอบ)
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          messageType: "text",
          content: replyText,
          aiHandled: true,
        },
      });

      // ใน production จะส่ง reply กลับผ่าน LINE Messaging API
      // ที่นี่จำลองการบันทึกไว้ในฐานข้อมูล
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("LINE webhook error:", error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}

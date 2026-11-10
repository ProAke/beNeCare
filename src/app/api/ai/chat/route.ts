import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, companyId, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { ok: false, message: "กรุณาระบุข้อความ" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // ถ้ายังไม่มี API Key ให้ใช้คำตอบเริ่มต้น
      return NextResponse.json({
        ok: true,
        reply:
          "ขออภัยค่ะ ระบบ AI ยังไม่ได้กำหนดค่า กรุณาติดต่อเจ้าหน้าที่บริการลูกค้าค่ะ",
        aiHandled: false,
      });
    }

    // เรียก OpenAI API (จำลองโครงสร้าง)
    // ใน production จะใช้ fetch เรียกจริง
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "คุณคือผู้ช่วยตอบคำถามประกันกลุ่มของ beNeCare ตอบเป็นภาษาไทย กระชับ สุภาพ ถ้าไม่แน่ใจให้บอกว่าต้องส่งต่อเจ้าหน้าที่",
            },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        throw new Error("AI service error");
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "ขออภัยค่ะ ระบบตอบคำถามไม่ได้ในขณะนี้";

      return NextResponse.json({
        ok: true,
        reply,
        aiHandled: true,
      });
    } catch {
      return NextResponse.json({
        ok: true,
        reply:
          "ขออภัยค่ะ ระบบ AI ไม่สามารถตอบได้ในขณะนี้ ทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ",
        aiHandled: false,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}

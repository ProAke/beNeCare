export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { message, companyId, conversationId } = body;

    if (!message) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณาระบุข้อความ",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        ok: true,
        reply: "ขออภัยค่ะ ระบบ AI ยังไม่ได้กำหนดค่า กรุณาติดต่อเจ้าหน้าที่บริการลูกค้าค่ะ",
        aiHandled: false,
      };
    }

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
              content: "คุณคือผู้ช่วยตอบคำถามประกันกลุ่มของ beNeCare ตอบเป็นภาษาไทย กระชับ สุภาพ ถ้าไม่แน่ใจให้บอกว่าต้องส่งต่อเจ้าหน้าที่",
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

      return {
        ok: true,
        reply,
        aiHandled: true,
      };
    } catch {
      return {
        ok: true,
        reply: "ขออภัยค่ะ ระบบ AI ไม่สามารถตอบได้ในขณะนี้ ทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ",
        aiHandled: false,
      };
    }
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});

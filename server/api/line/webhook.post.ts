import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_FILE = join(process.cwd(), "data", "install-config.json");

async function getDbConfig() {
  const content = await readFile(CONFIG_FILE, "utf-8");
  const config = JSON.parse(content);
  return config.database;
}

export default defineEventHandler(async (event) => {
  let connection = null;

  try {
    const body = await readBody(event);
    const events = body.events || [];

    for (const evt of events) {
      if (evt.type !== "message" || evt.message.type !== "text") {
        continue;
      }

      const replyToken = evt.replyToken;
      const userId = evt.source.userId;
      const userMessage = evt.message.text;

      const dbConfig = await getDbConfig();
      connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.name,
        multipleStatements: true,
      });

      // ค้นหาพนักงานจาก line_user_id
      const [empRows] = await connection.query(
        `SELECT e.*, c.name as company_name FROM employees e LEFT JOIN companies c ON e.company_id = c.id WHERE e.line_user_id = ? AND e.is_active = TRUE LIMIT 1`,
        [userId]
      );

      if ((empRows as any[]).length === 0) {
        if (connection) {
          await connection.end();
          connection = null;
        }
        continue; // ยังไม่ได้ผูกบัญชี LINE กับพนักงาน
      }

      const employee = (empRows as any[])[0];

      // สร้างหรือดึง conversation
      let [convRows] = await connection.query(
        `SELECT * FROM conversations WHERE company_id = ? AND line_user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1`,
        [employee.company_id, userId]
      );

      let conversationId: string;
      if ((convRows as any[]).length === 0) {
        const [insertResult] = await connection.query(
          `INSERT INTO conversations (id, company_id, line_user_id, employee_id, status) VALUES (UUID(), ?, ?, ?, 'active')`,
          [employee.company_id, userId, employee.id]
        );
        conversationId = (insertResult as any).insertId || require("crypto").randomUUID();
      } else {
        conversationId = (convRows as any[])[0].id;
      }

      // บันทึกข้อความขาเข้า
      await connection.query(
        `INSERT INTO messages (id, conversation_id, direction, message_type, content, ai_handled) VALUES (UUID(), ?, 'inbound', 'text', ?, FALSE)`,
        [conversationId, userMessage]
      );

      // ค้นหาคำตอบจาก FAQ ของบริษัทนั้น
      const [faqRows] = await connection.query(
        `SELECT question, answer FROM faqs WHERE company_id = ? AND is_active = TRUE LIMIT 10`,
        [employee.company_id]
      );

      let replyText = "ขออภัยค่ะ ระบบยังไม่พบคำตอบที่ตรงกับคำถามของคุณ ทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ";
      const lowerMessage = userMessage.toLowerCase();

      for (const faq of (faqRows as any[])) {
        if (
          lowerMessage.includes(faq.question.toLowerCase()) ||
          faq.question.toLowerCase().includes(lowerMessage)
        ) {
          replyText = faq.answer;
          break;
        }
      }

      // บันทึกข้อความขาออก (AI ตอบ)
      await connection.query(
        `INSERT INTO messages (id, conversation_id, direction, message_type, content, ai_handled) VALUES (UUID(), ?, 'outbound', 'text', ?, TRUE)`,
        [conversationId, replyText]
      );

      if (connection) {
        await connection.end();
        connection = null;
      }
    }

    return { ok: true };
  } catch (error: any) {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }

    return createError({
      statusCode: 500,
      statusMessage: error.message || "LINE webhook error",
    });
  }
});

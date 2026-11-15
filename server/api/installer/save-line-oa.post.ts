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
    const { channelId, channelSecret, channelAccessToken, companyName } = body;

    if (!companyName) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณาระบุชื่อบริษัท",
      });
    }

    const dbConfig = await getDbConfig();

    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name,
      multipleStatements: true,
    });

    // ค้นหาบริษัทแล้วอัปเดตข้อมูล LINE OA
    const [rows] = await connection.query(
      `SELECT id FROM companies WHERE name = ? LIMIT 1`,
      [companyName]
    );

    if ((rows as any[]).length === 0) {
      return createError({
        statusCode: 404,
        statusMessage: "ไม่พบบริษัทที่ระบุ",
      });
    }

    const companyId = (rows as any[])[0].id;

    await connection.query(
      `UPDATE companies SET line_oa_channel_id = ?, line_oa_channel_secret = ?, line_oa_access_token = ? WHERE id = ?`,
      [channelId || null, channelSecret || null, channelAccessToken || null, companyId]
    );

    await connection.end();
    connection = null;

    return { ok: true, message: "บันทึกการตั้งค่า LINE OA เรียบร้อยแล้ว" };
  } catch (error: any) {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }

    return createError({
      statusCode: 500,
      statusMessage: error.message || "บันทึกการตั้งค่า LINE OA ไม่สำเร็จ",
    });
  }
});

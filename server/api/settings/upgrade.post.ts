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
    const { targetVersion } = body;

    if (!targetVersion) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณาระบุเวอร์ชันเป้าหมาย",
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

    // อ่านเวอร์ชันปัจจุบัน
    const [rows] = await connection.query(
      `SELECT value FROM system_settings WHERE key = 'app_version' LIMIT 1`
    );
    const currentVersion = (rows as any[]).length > 0 ? (rows as any[])[0].value : "1.0.0";

    // อัปเดตเวอร์ชัน
    await connection.query(
      `INSERT INTO system_settings (key, value, description) VALUES ('app_version', ?, 'เวอร์ชันของระบบ beNeCare') ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
      [targetVersion]
    );

    // บันทึกประวัติการอัปเกรดใน audit_logs
    const logId = require("crypto").randomUUID();
    await connection.query(
      `INSERT INTO audit_logs (id, user_type, action, entity_type, old_value, new_value) VALUES (?, 'system_admin', 'system_upgrade', 'system', ?, ?)`,
      [logId, currentVersion, targetVersion]
    );

    await connection.end();
    connection = null;

    return {
      ok: true,
      message: `อัปเกรดเป็นเวอร์ชัน ${targetVersion} เรียบร้อยแล้ว`,
    };
  } catch (error: any) {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }

    return createError({
      statusCode: 500,
      statusMessage: error.message || "อัปเกรดระบบไม่สำเร็จ",
    });
  }
});

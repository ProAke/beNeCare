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
    const dbConfig = await getDbConfig();

    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name,
      multipleStatements: true,
    });

    const [rows] = await connection.query(
      `SELECT action, entity_type, old_value, new_value, created_at FROM audit_logs WHERE action = 'system_upgrade' ORDER BY created_at DESC LIMIT 20`
    );

    const history = (rows as any[]).map((log) => ({
      version: log.new_value || "ไม่ทราบ",
      date: new Date(log.created_at).toLocaleDateString("th-TH"),
      admin: log.user_type || "ระบบ",
    }));

    await connection.end();
    connection = null;

    return history;
  } catch {
    return [];
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }
  }
});

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

    const [companies] = await connection.query(
      `SELECT COUNT(*) as cnt FROM companies`
    );
    const [employees] = await connection.query(
      `SELECT COUNT(*) as cnt FROM employees`
    );
    const [conversations] = await connection.query(
      `SELECT COUNT(*) as cnt FROM conversations`
    );
    const [messagesToday] = await connection.query(
      `SELECT COUNT(*) as cnt FROM messages WHERE DATE(created_at) = CURDATE()`
    );

    await connection.end();
    connection = null;

    return {
      companies: (companies as any[])[0].cnt,
      employees: (employees as any[])[0].cnt,
      conversations: (conversations as any[])[0].cnt,
      messagesToday: (messagesToday as any[])[0].cnt,
    };
  } catch {
    return {
      companies: 0,
      employees: 0,
      conversations: 0,
      messagesToday: 0,
    };
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }
  }
});

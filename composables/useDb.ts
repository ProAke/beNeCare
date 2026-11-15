import mysql from "mysql2/promise";
import { useRuntimeConfig } from "#imports";

export function useDb(configOverride?: {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}) {
  const config = useRuntimeConfig();

  const dbConfig = {
    host: configOverride?.host || config.database.host || "localhost",
    port: configOverride?.port || config.database.port || 3306,
    database: configOverride?.database || config.database.name || "benecare",
    user: configOverride?.user || config.database.user || "root",
    password: configOverride?.password || config.database.password || "",
    multipleStatements: true,
  };

  async function getConnection() {
    return mysql.createConnection(dbConfig);
  }

  async function query(sql: string, params?: any[]) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sql, params || []);
      return rows;
    } finally {
      await connection.end();
    }
  }

  async function testConnection() {
    const connection = await getConnection();
    try {
      await connection.ping();
      return { ok: true };
    } catch (error: any) {
      return { ok: false, message: error.message };
    } finally {
      await connection.end();
    }
  }

  return {
    getConnection,
    query,
    testConnection,
    dbConfig,
  };
}

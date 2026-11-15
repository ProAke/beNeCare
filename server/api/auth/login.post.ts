import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

const CONFIG_FILE = join(process.cwd(), "data", "install-config.json");
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default-secret-change-me";

async function getDbConfig() {
  const content = await readFile(CONFIG_FILE, "utf-8");
  const config = JSON.parse(content);
  return config.database;
}

export default defineEventHandler(async (event) => {
  let connection = null;

  try {
    const body = await readBody(event);
    const { email, password } = body;

    if (!email || !password) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณากรอกอีเมลและรหัสผ่าน",
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

    // ค้นหาใน system_admins ก่อน
    const [adminRows] = await connection.query(
      `SELECT * FROM system_admins WHERE email = ? LIMIT 1`,
      [email]
    );

    let user: any = null;
    let userType = "system_admin";
    let companyId: string | null = null;

    if ((adminRows as any[]).length > 0) {
      user = (adminRows as any[])[0];
      userType = "system_admin";
    } else {
      // ค้นหาใน company_users
      const [userRows] = await connection.query(
        `SELECT * FROM company_users WHERE email = ? LIMIT 1`,
        [email]
      );
      if ((userRows as any[]).length > 0) {
        user = (userRows as any[])[0];
        userType = "company_admin";
        companyId = user.company_id;
      }
    }

    if (!user) {
      return createError({
        statusCode: 401,
        statusMessage: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return createError({
        statusCode: 401,
        statusMessage: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    if (!user.is_active) {
      return createError({
        statusCode: 403,
        statusMessage: "บัญชีนี้ถูกระงับการใช้งาน",
      });
    }

    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        userType,
        companyId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        userType,
        companyId,
      },
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: error.message || "เข้าสู่ระบบไม่สำเร็จ",
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }
  }
});

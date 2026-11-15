import mysql from "mysql2/promise";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import bcrypt from "bcryptjs";

const CONFIG_FILE = join(process.cwd(), "data", "install-config.json");

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NULL,
  line_oa_channel_id VARCHAR(255) NULL,
  line_oa_channel_secret VARCHAR(255) NULL,
  line_oa_access_token TEXT NULL,
  line_oa_user_id VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_admins (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_system_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'company_admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_users_company (company_id),
  INDEX idx_company_users_email (email),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  employee_id VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  line_user_id VARCHAR(255) NULL,
  department VARCHAR(100) NULL,
  position VARCHAR(100) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employees_company (company_id),
  INDEX idx_employees_employee_id (employee_id),
  INDEX idx_employees_line_user (line_user_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_faqs_company (company_id),
  INDEX idx_faqs_category (category),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  line_user_id VARCHAR(255) NOT NULL,
  employee_id CHAR(36) NULL,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  INDEX idx_conversations_company (company_id),
  INDEX idx_conversations_line_user (line_user_id),
  INDEX idx_conversations_status (status),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  content TEXT NOT NULL,
  ai_handled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_direction (direction),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS broadcasts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all',
  sent_at TIMESTAMP NULL,
  status VARCHAR(50) DEFAULT 'pending',
  INDEX idx_broadcasts_company (company_id),
  INDEX idx_broadcasts_status (status),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description VARCHAR(500) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_system_settings_key (key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  version VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schema_migrations_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  user_type VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_company (company_id),
  INDEX idx_audit_logs_created (created_at),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export default defineEventHandler(async (event) => {
  let adminConnection = null;
  let appConnection = null;

  try {
    const body = await readBody(event);
    const { host, port, name, user, password, admin, company } = body;

    if (!host || !port || !name || !user || !admin || !company) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    // 1. เชื่อมต่อ MySQL (ยังไม่ระบุ database)
    adminConnection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      multipleStatements: true,
    });

    // 2. สร้าง database ถ้ายังไม่มี
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // 3. ปิดการเชื่อมต่อ admin แล้วเชื่อมต่อ database ใหม่
    await adminConnection.end();
    adminConnection = null;

    appConnection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      database: name,
      multipleStatements: true,
    });

    // 4. รัน SQL สร้างตารางทั้งหมด
    await appConnection.query(TABLES_SQL);

    // 5. สร้าง Super Admin
    const passwordHash = await bcrypt.hash(admin.password, 12);
    const adminId = require("crypto").randomUUID();
    await appConnection.query(
      `INSERT INTO system_admins (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'super_admin')`,
      [adminId, admin.email, passwordHash, admin.fullName]
    );

    // 6. สร้างบริษัทแรก
    const companyId = require("crypto").randomUUID();
    await appConnection.query(
      `INSERT INTO companies (id, name, tax_id, contact_email, contact_phone, is_active) VALUES (?, ?, ?, ?, ?, TRUE)`,
      [companyId, company.name, company.taxId || null, company.contactEmail, company.contactPhone || null]
    );

    // 7. บันทึกเวอร์ชันระบบ
    await appConnection.query(
      `INSERT INTO system_settings (key, value, description) VALUES ('app_version', '1.0.0', 'เวอร์ชันของระบบ beNeCare')`
    );

    // 8. บันทึกマイกราชันเริ่มต้น
    await appConnection.query(
      `INSERT INTO schema_migrations (version, name) VALUES ('001', 'initial_schema')`
    );

    // 9. ปิดการเชื่อมต่อ
    await appConnection.end();
    appConnection = null;

    // 10. บันทึกไฟล์ install-config.json (แทน .env)
    const installConfig = {
      database: {
        host,
        port: Number(port),
        name,
        user,
        password: password || "",
      },
      admin: {
        email: admin.email,
        password: admin.password,
        fullName: admin.fullName,
      },
      company: {
        name: company.name,
        taxId: company.taxId || null,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone || null,
      },
      version: "1.0.0",
      installedAt: new Date().toISOString(),
    };

    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify(installConfig, null, 2), "utf-8");

    return { ok: true, message: "ติดตั้งระบบสำเร็จ" };
  } catch (error: any) {
    if (adminConnection) {
      try { await adminConnection.end(); } catch { /* ignore */ }
    }
    if (appConnection) {
      try { await appConnection.end(); } catch { /* ignore */ }
    }

    return createError({
      statusCode: 500,
      statusMessage: error.message || "ติดตั้งฐานข้อมูลไม่สำเร็จ",
    });
  }
});

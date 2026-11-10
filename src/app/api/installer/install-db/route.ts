import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { host, port, name, user, password } = await req.json();

    // สร้าง DATABASE_URL ชั่วคราวสำหรับマイกราชัน
    const databaseUrl = `mysql://${user}:${password}@${host}:${port}/${name}`;

    // เขียนไฟล์ .env ชั่วคราว (ใน production ควรใช้วิธีที่ปลอดภัยกว่า)
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.resolve(process.cwd(), ".env");

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // อัปเดตหรือเพิ่ม DATABASE_URL
    const dbUrlLine = `DATABASE_URL="${databaseUrl}"`;
    if (envContent.includes("DATABASE_URL=")) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        dbUrlLine
      );
    } else {
      envContent += `\n${dbUrlLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);

    // รันマイกราชันของ Prisma
    try {
      execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
        timeout: 120000,
      });
    } catch (migrateError: any) {
      // ถ้า migrate deploy ล้มเหลว ให้ลองใช้ prisma db push แทน
      try {
        execSync("npx prisma db push --accept-data-loss", {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: "pipe",
          timeout: 120000,
        });
      } catch (pushError: any) {
        return NextResponse.json(
          { ok: false, message: pushError.message || "สร้างโครงสร้างฐานข้อมูลไม่สำเร็จ" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "ติดตั้งฐานข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

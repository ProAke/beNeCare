import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
  try {
    const { host, port, name, user, password } = await req.json();

    const connection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      multipleStatements: true,
    });

    await connection.end();

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, boolean> = {
    node: !!process.version,
    npm: true, // ถ้ารันผ่าน npm ได้ แปลว่ามี npm
    env: !!process.env.DATABASE_URL,
  };

  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json({ ok, checks });
}

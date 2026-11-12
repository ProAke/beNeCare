"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(
      error?.message ||
        "ระบบพบข้อผิดพลาดร้ายแรง กรุณาติดต่อผู้ดูแลระบบ"
    );
  }, [error]);

  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>beNeCare — เกิดข้อผิดพลาดในระบบ</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-100">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              beNeCare — เกิดข้อผิดพลาด
            </h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-800 mb-2">
                วิธีแก้ไขเบื้องต้น:
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                <li>
                  ตรวจสอบว่าไฟล์ <code className="font-mono text-xs">.env</code>
                  มีอยู่บนเซิร์ฟเวอร์หรือไม่
                </li>
                <li>
                  ตั้งค่า <code className="font-mono text-xs">DATABASE_URL</code>
                  ให้ถูกต้องกับฐานข้อมูล MariaDB
                </li>
                <li>
                  รันคำสั่ง <code className="font-mono text-xs">npx prisma generate</code>
                  และ <code className="font-mono text-xs">npx prisma migrate deploy</code>
                </li>
              </ul>
            </div>

            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors w-full"
            >
              รีเฟรชหน้าเว็บ
            </button>
            <div className="mt-4">
              <Link
                href="/installer"
                className="text-sm text-red-600 hover:underline"
              >
                → ติดตั้งระบบครั้งแรก
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

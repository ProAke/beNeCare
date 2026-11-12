"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ErrorPage({
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
        "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง"
    );
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-md w-full p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            เกิดข้อผิดพลาดในระบบ
          </h2>
          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-800 mb-2">
              สาเหตุที่เป็นไปได้:
            </p>
            <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>ยังไม่ได้สร้างไฟล์ `.env` บนเซิร์ฟเวอร์</li>
              <li>ตัวแปร `DATABASE_URL` ยังไม่ได้กำหนดค่า</li>
              <li>ยังไม่ได้รัน `npx prisma generate` และマイกราชันฐานข้อมูล</li>
              <li>การเชื่อมต่อฐานข้อมูล MariaDB ล้มเหลว</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="btn-primary flex-1"
            >
              ลองอีกครั้ง
            </button>
          </div>
          <div className="mt-4">
            <Link href="/installer" className="text-sm text-red-600 hover:underline">
              → ไปยังหน้าติดตั้งระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

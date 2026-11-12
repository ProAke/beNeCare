"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkInstall = async () => {
      try {
        const res = await fetch("/api/installer/status", {
          cache: "no-store",
        });

        if (!res.ok) {
          setError("เซิร์ฟเวอร์ตอบสนองผิดปกติ กรุณาตรวจสอบการตั้งค่า");
          setChecking(false);
          return;
        }

        const data = await res.json();

        if (data.installed) {
          window.location.href = "/login";
        } else {
          window.location.href = "/installer";
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการตั้งค่า .env และฐานข้อมูล"
        );
      } finally {
        setChecking(false);
      }
    };

    checkInstall();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            ระบบยังไม่พร้อมใช้งาน
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-800 mb-2">
              ขั้นตอนแก้ไขเบื้องต้น:
            </p>
            <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>สร้างไฟล์ <code className="font-mono text-xs">.env</code> บนเซิร์ฟเวอร์</li>
              <li>ตั้งค่า <code className="font-mono text-xs">DATABASE_URL</code> ให้ถูกต้อง</li>
              <li>รัน <code className="font-mono text-xs">npx prisma generate</code> และ <code className="font-mono text-xs">npx prisma migrate deploy</code></li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary flex-1">
              รีเฟรชอีกครั้ง
            </button>
          </div>
          <div className="mt-4">
            <Link href="/installer" className="text-sm text-red-600 hover:underline">
              → ไปยังหน้าติดตั้งระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
          <p className="mt-4 text-gray-600">กำลังเตรียมระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
        <p className="mt-4 text-gray-600">กำลังนำทาง...</p>
      </div>
    </div>
  );
}

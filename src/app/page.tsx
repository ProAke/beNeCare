"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // ตรวจสอบว่ามีการติดตั้งระบบแล้วหรือยัง (มี .env และตารางฐานข้อมูลหรือไม่)
    // ถ้ายัง → ไปหน้า Installer
    // ถ้ามีแล้ว → ไปหน้า Login
    const checkInstall = async () => {
      try {
        const res = await fetch("/api/installer/status");
        const data = await res.json();
        if (data.installed) {
          window.location.href = "/login";
        } else {
          window.location.href = "/installer";
        }
      } catch {
        window.location.href = "/installer";
      } finally {
        setChecking(false);
      }
    };
    checkInstall();
  }, []);

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

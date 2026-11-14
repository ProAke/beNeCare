"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PinPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/installer/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "รหัส PIN ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      // PIN ถูกต้องแล้ว ไปยังหน้าติดตั้งหลัก
      router.push("/installer");
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-red-600 text-3xl">🔐</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          รหัสผ่านการติดตั้งระบบ
        </h2>
        <p className="text-sm text-gray-600 mb-8">
          กรุณากรอกรหัส PIN เพื่อเข้าสู่หน้าติดตั้ง / จัดการระบบ beNeCare
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัส PIN
            </label>
            <input
              type="password"
              className="input-field w-full text-center text-xl font-mono tracking-widest"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength="6"
              placeholder="524452"
              required
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "กำลังยืนยัน..." : "ยืนยันรหัส PIN"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
          <p>รหัส PIN เริ่มต้น: <span className="font-mono text-red-600 font-bold">524452</span></p>
          <p className="mt-2">
            รหัสนี้ใช้สำหรับเข้าถึงหน้าติดตั้ง รีเซตระบบ และอัปเดตเวอร์ชันทุกครั้ง
          </p>
        </div>

        <div className="mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:underline">
            ← มีบัญชีผู้ใช้แล้ว? ไปยังหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

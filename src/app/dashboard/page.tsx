"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  companies: number;
  employees: number;
  conversations: number;
  messagesToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    employees: 0,
    conversations: 0,
    messagesToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ใช้ค่าเริ่มต้น
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <h1 className="font-bold text-xl text-gray-900">beNeCare</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Super Admin
            </span>
            <button className="text-sm text-gray-600 hover:text-red-600">
 ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          แดชบอร์ดภาพรวม
        </h2>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">บริษัทลูกค้า</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.companies}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                🏢
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">พนักงานรวม</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.employees}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                👥
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">การสนทนาทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.conversations}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                💬
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ข้อความวันนี้</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.messagesToday}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                📩
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">การดำเนินการด่วน</h3>
            <div className="space-y-3">
              <Link href="/companies" className="btn-secondary w-full">
                จัดการบริษัทลูกค้า
              </Link>
              <Link href="/employees" className="btn-secondary w-full">
                จัดการพนักงาน
              </Link>
              <Link href="/line-oa" className="btn-secondary w-full">
                ตั้งค่า LINE OA
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">คำแนะนำ</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                ระบบพร้อมใช้งานแล้ว
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                เชื่อมต่อ LINE OA Channel
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                เพิ่มคำถามที่พบบ่อย (FAQ)
              </li>
            </ul>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">ข้อมูลระบบ</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>เวอร์ชันระบบ:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ฐานข้อมูล:</span>
                <span className="font-medium">MariaDB</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>สถานะ:</span>
                <span className="text-green-600 font-medium">ปกติ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
          <div className="text-center py-8 text-gray-400">
            ยังไม่มีกิจกรรมล่าสุด เริ่มต้นโดยเพิ่มบริษัทลูกค้าครั้งแรก
          </div>
        </div>
      </main>
    </div>
  );
}

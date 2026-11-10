"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, User } from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.firstName.includes(search) ||
      e.lastName.includes(search) ||
      e.employeeId.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-gray-600 hover:text-red-600">
              ← กลับ
            </Link>
            <h1 className="font-bold text-xl text-gray-900">จัดการพนักงาน</h1>
          </div>
          <Link href="/dashboard" className="btn-primary">
            <User className="w-4 h-4 mr-2" /> กลับหน้าแรก
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10 w-full"
                placeholder="ค้นหารหัสพนักงาน ชื่อ หรือแผนก..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Link href="#" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> เพิ่มพนักงาน
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header py-4 px-6">รหัสพนักงาน</th>
                  <th className="table-header py-4 px-6">ชื่อ - นามสกุล</th>
                  <th className="table-header py-4 px-6">แผนก / ตำแหน่ง</th>
                  <th className="table-header py-4 px-6">อีเมล</th>
                  <th className="table-header py-4 px-6">สถานะ</th>
                  <th className="table-header py-4 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      ไม่พบพนักงานที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {e.employeeId}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {e.firstName} {e.lastName}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {e.department || "-"} / {e.position || "-"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {e.email || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            e.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {e.isActive ? "ใช้งาน" : "ระงับ"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-gray-400 hover:text-blue-600">
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

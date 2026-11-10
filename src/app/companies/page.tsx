"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit3 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  taxId: string | null;
  contactEmail: string;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, contactEmail: newEmail }),
      });
      if (res.ok) {
        setShowForm(false);
        setNewName("");
        setNewEmail("");
        fetchCompanies();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-gray-600 hover:text-red-600">
              ← กลับ
            </Link>
            <h1 className="font-bold text-xl text-gray-900">บริษัทลูกค้า</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> เพิ่มบริษัท
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showForm && (
          <div className="card mb-6">
            <h3 className="font-bold text-gray-900 mb-4">เพิ่มบริษัทใหม่</h3>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อบริษัท
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมลผู้ติดต่อ
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  สร้าง
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header py-4 px-6">ชื่อบริษัท</th>
                  <th className="table-header py-4 px-6">อีเมล</th>
                  <th className="table-header py-4 px-6">สถานะ</th>
                  <th className="table-header py-4 px-6">สร้างเมื่อ</th>
                  <th className="table-header py-4 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      ยังไม่มีบริษัทในระบบ
                    </td>
                  </tr>
                ) : (
                  companies.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {c.name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {c.contactEmail}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            c.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.isActive ? "ใช้งาน" : "ระงับ"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Database, Upload, History, Clock, RefreshCw } from "lucide-react";

type SystemStatus = {
  installed: boolean;
  reason: string;
  message: string;
  appVersion: string;
};

export default function SettingsPage() {
  const [systemVersion, setSystemVersion] = useState("");
  const [latestVersion, setLatestVersion] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [backuping, setBackuping] = useState(false);
  const [upgradeHistory, setUpgradeHistory] = useState<{
    version: string;
    date: string;
    admin: string;
  }[]>([]);

  useEffect(() => {
    const LATEST_VERSION = process.env.NEXT_PUBLIC_LATEST_VERSION || "1.1.0";
    setLatestVersion(LATEST_VERSION);

    const loadStatus = async () => {
      setCheckingVersion(true);
      try {
        const res = await fetch("/api/installer/status", { cache: "no-store" });
        if (res.ok) {
          const data: SystemStatus = await res.json();
          if (data.installed && data.appVersion) {
            setSystemVersion(data.appVersion);
            setUpdateAvailable(data.appVersion !== LATEST_VERSION);
          } else {
            setSystemVersion("ไม่ทราบ");
            setUpdateAvailable(false);
          }
        }
      } catch {
        setSystemVersion("ไม่ทราบ");
      } finally {
        setCheckingVersion(false);
      }

      // โหลดประวัติการอัปเกรด (จากฐานข้อมูลผ่าน API settings/upgrade history)
      try {
        const histRes = await fetch("/api/settings/upgrade-history", {
          cache: "no-store",
        });
        if (histRes.ok) {
          const history = await histRes.json();
          setUpgradeHistory(history || []);
        }
      } catch {
        // ใช้ค่าเริ่มต้น
        setUpgradeHistory([
          {
            version: systemVersion || "1.0.0",
            date: new Date().toLocaleDateString("th-TH"),
            admin: "ระบบติดตั้งครั้งแรก",
          },
        ]);
      }
    };

    loadStatus();
  }, []);

  const handleCheckVersion = async () => {
    setCheckingVersion(true);
    try {
      const res = await fetch("/api/installer/status", { cache: "no-store" });
      if (res.ok) {
        const data: SystemStatus = await res.json();
        if (data.installed && data.appVersion) {
          setSystemVersion(data.appVersion);
          setUpdateAvailable(data.appVersion !== latestVersion);
        }
      }
    } catch {
      // ignore
    } finally {
      setCheckingVersion(false);
    }
  };

  const handleBackup = async () => {
    setBackuping(true);
    try {
      const res = await fetch("/api/settings/backup", { method: "POST" });
      if (res.ok) {
        alert("สำรองข้อมูลสำเร็จแล้ว");
      } else {
        const data = await res.json();
        alert(data.message || "สำรองข้อมูลไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการสำรองข้อมูล");
    } finally {
      setBackuping(false);
    }
  };

  const handleUpgrade = async () => {
    if (
      !confirm(
        "คุณต้องการอัปเกรดระบบหรือไม่? ระบบจะสำรองข้อมูลฐานข้อมูลและรันマイกราชันอัตโนมัติ"
      )
    ) {
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/settings/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion: latestVersion }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "อัปเกรดสำเร็จ");
        setSystemVersion(latestVersion);
        setUpdateAvailable(false);
        setUpgradeHistory((prev) => [
          {
            version: latestVersion,
            date: new Date().toLocaleDateString("th-TH"),
            admin: "Super Admin",
          },
          ...prev,
        ]);
      } else {
        const data = await res.json();
        alert(data.message || "อัปเกรดไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการอัปเกรด");
    } finally {
      setUpgrading(false);
    }
  };

  if (!systemVersion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการตั้งค่าระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-bold text-xl text-gray-900">การตั้งค่าระบบ</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">เมนูการตั้งค่า</h3>
              <div className="space-y-2">
                <Link href="/settings" className="btn-secondary w-full text-left">
                  ทั่วไป
                </Link>
                <Link href="/line-oa" className="btn-secondary w-full text-left">
                  LINE OA
                </Link>
                <Link href="/faq" className="btn-secondary w-full text-left">
                  คำถามที่พบบ่อย
                </Link>
                <Link href="/audit-log" className="btn-secondary w-full text-left">
                  ประวัติการดำเนินการ
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* ระบบอัปเกรด */}
            <div className="card border-l-4 border-red-600">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="w-6 h-6 text-red-600" />
                  <h2 className="font-bold text-lg text-gray-900">
                    ส่วนอัปเกรดระบบ
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      เวอร์ชันปัจจุบัน
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {systemVersion}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      เวอร์ชันล่าสุด
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {latestVersion}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      สถานะ
                    </p>
                    <p className={`text-sm font-medium ${
                      updateAvailable ? "text-red-600" : "text-green-600"
                    }`}>
                      {updateAvailable ? "มีอัปเดตใหม่" : "เป็นเวอร์ชันล่าสุด"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handleCheckVersion}
                    disabled={checkingVersion}
                    className="btn-secondary flex-1"
                  >
                    {checkingVersion ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    ตรวจสอบอัปเดต
                  </button>
                </div>

                {updateAvailable ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800">
                        ก่อนอัปเกรดระบบ ขอแนะนำให้สำรองข้อมูลฐานข้อมูล
                        MariaDB เพื่อป้องกันข้อมูลสูญหาย ระบบจะรันマイกราชัน
                        อัตโนมัติหลังจากสำรองข้อมูลแล้ว
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBackup}
                        disabled={backuping || upgrading}
                        className="btn-secondary flex-1"
                      >
                        {backuping ? (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            กำลังสำรอง...
                          </span>
                        ) : (
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            สำรองข้อมูลก่อนอัปเกรด
                          </span>
                        )}
                      </button>
                      <button
                        onClick={handleUpgrade}
                        disabled={upgrading || backuping}
                        className="btn-primary flex-1"
                      >
                        {upgrading ? (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            กำลังอัปเกรด...
                          </span>
                        ) : (
                          <span>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            อัปเกรดเป็น {latestVersion}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ระบบของคุณเป็นเวอร์ชันล่าสุดแล้ว ไม่จำเป็นต้องอัปเกรด
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ประวัติการอัปเกรด */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold text-lg text-gray-900">
                  ประวัติการอัปเกรด
                </h2>
              </div>
              <div className="p-6">
                {upgradeHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    ยังไม่มีประวัติการอัปเกรด
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {upgradeHistory.map((h, i) => (
                      <li key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            เวอร์ชัน {h.version}
                          </p>
                          <p className="text-sm text-gray-500">
                            ดำเนินการโดย: {h.admin}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">{h.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* การตั้งค่าทั่วไป */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold text-lg text-gray-900">
                  การตั้งค่าทั่วไป
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ชื่อแอปพลิเคชัน
                  </h3>
                  <input
                    type="text"
                    className="input-field w-full max-w-md"
                    value="beNeCare"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    เปลี่ยนชื่อได้ในไฟล์การกำหนดค่าระบบ
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ฐานข้อมูล
                  </h3>
                  <p className="text-sm text-gray-600">
                    MariaDB (ผ่าน Prisma ORM)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ช่องทาง LINE OA
                  </h3>
                  <p className="text-sm text-gray-600">
                    ตั้งค่าได้ที่เมนู LINE OA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

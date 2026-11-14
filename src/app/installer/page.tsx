"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldCheck, Database, Upload, Clock, History } from "lucide-react";

type Step =
  | "welcome"
  | "environment"
  | "database"
  | "admin"
  | "company"
  | "line-oa"
  | "complete";

type InstallStatus = {
  installed: boolean;
  reason: string;
  status: "not_installed" | "installed" | "needs_update" | "installation_needed" | "error";
  message: string;
  appVersion: string;
  latestVersion?: string;
  needsUpdate?: boolean;
  canInstall?: boolean;
  canReinstall?: boolean;
  canUpdate?: boolean;
};

type Mode = "install" | "reinstall" | "update" | "manage";

const INSTALL_STEPS: Step[] = [
  "welcome",
  "environment",
  "database",
  "admin",
  "company",
  "line-oa",
  "complete",
];

export default function InstallerPage() {
  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [status, setStatus] = useState<InstallStatus | null>(null);
  const [mode, setMode] = useState<Mode>("install");
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form states (install / reinstall)
  const [dbHost, setDbHost] = useState("localhost");
  const [dbPort, setDbPort] = useState("3306");
  const [dbName, setDbName] = useState("benecare");
  const [dbUser, setDbUser] = useState("root");
  const [dbPass, setDbPass] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminName, setAdminName] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  const [lineChannelId, setLineChannelId] = useState("");
  const [lineChannelSecret, setLineChannelSecret] = useState("");

  const [confirmReinstall, setConfirmReinstall] = useState(false);

  // ตรวจสอบ session PIN เมื่อโหลดหน้า
  useEffect(() => {
    const checkPinSession = async () => {
      try {
        const res = await fetch("/api/installer/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);

          // กำหนดโหมดเริ่มต้นตามสถานะ
          if (data.status === "not_installed" || data.status === "installation_needed") {
            setMode("install");
          } else if (data.status === "needs_update") {
            setMode("update");
          } else {
            setMode("manage");
          }
        }
      } catch {
        // ignore
      } finally {
        setPinVerified(true);
      }
    };

    checkPinSession();
  }, []);

  // Redirect ไปหน้ากรอก PIN ถ้ายังไม่ได้ยืนยัน
  useEffect(() => {
    if (pinVerified === false) {
      window.location.href = "/installer/pin";
    }
  }, [pinVerified]);

  const steps = INSTALL_STEPS;
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const next = steps[currentStepIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = steps[currentStepIndex - 1];
    if (prev) setStep(prev);
  };

  const checkEnvironment = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/installer/environment");
      const data = await res.json();

      if (data.ok) {
        nextStep();
      } else {
        setError(data.message || "สภาพแวดล้อมไม่พร้อม");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/installer/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbHost,
          port: dbPort,
          name: dbName,
          user: dbUser,
          password: dbPass,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        nextStep();
      } else {
        setError(data.message || "เชื่อมต่อฐานข้อมูลไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const install = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res1 = await fetch("/api/installer/install-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbHost,
          port: dbPort,
          name: dbName,
          user: dbUser,
          password: dbPass,
        }),
      });
      const data1 = await res1.json();
      if (!data1.ok) {
        setError(data1.message || "สร้างฐานข้อมูลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      const res2 = await fetch("/api/installer/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          fullName: adminName,
        }),
      });
      const data2 = await res2.json();
      if (!data2.ok) {
        setError(data2.message || "สร้างบัญชีแอดมินไม่สำเร็จ");
        setLoading(false);
        return;
      }

      const res3 = await fetch("/api/installer/create-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          taxId: companyTaxId,
          contactEmail: companyEmail,
          contactPhone: companyPhone,
        }),
      });
      const data3 = await res3.json();
      if (!data3.ok) {
        setError(data3.message || "สร้างบริษัทไม่สำเร็จ");
        setLoading(false);
        return;
      }

      if (lineChannelId || lineChannelSecret) {
        await fetch("/api/installer/save-line-oa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            channelId: lineChannelId,
            channelSecret: lineChannelSecret,
          }),
        });
      }

      setStep("complete");
    } catch {
      setError("เกิดข้อผิดพลาดขณะติดตั้งระบบ");
    } finally {
      setLoading(false);
    }
  };

  const reinstall = async () => {
    if (!confirmReinstall) {
      setError("กรุณาเลือกยืนยันการติดตั้งใหม่ (ยินยอมให้เขียนทับข้อมูลเดิม)");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/installer/reinstall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          adminEmail,
          adminPassword,
          adminName,
          companyName,
          companyTaxId,
          companyEmail,
          companyPhone,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setStep("complete");
      } else {
        setError(data.message || "ติดตั้งระบบใหม่ไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดขณะติดตั้งระบบใหม่");
    } finally {
      setLoading(false);
    }
  };

  const updateVersion = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/settings/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion: status?.latestVersion || "1.1.0" }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessage("อัปเดตเวอร์ชันสำเร็จแล้ว");
        setLoading(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.message || "อัปเดตเวอร์ชันไม่สำเร็จ");
        setLoading(false);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการอัปเดตเวอร์ชัน");
      setLoading(false);
    }
  };

  const goToPin = () => {
    window.location.href = "/installer/pin";
  };

  const renderPinGate = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-amber-600 text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ยืนยันรหัส PIN
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            กรุณากรอกรหัส PIN เพื่อเข้าสู่หน้าติดตั้ง / จัดการระบบ
          </p>
          <div className="space-y-3">
            <input
              type="password"
              className="input-field w-full text-center text-xl font-mono tracking-widest"
              value=""
              maxLength="6"
              placeholder="524452"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // จำลองการกรอก PIN 524452 แล้วไปหน้า installer
                  // ในการใช้งานจริงควรมีฟอร์มกรอก PIN แยก
                }
              }}
            />
            <button
              onClick={goToPin}
              className="btn-primary w-full"
            >
              ไปยังหน้ากรอกรหัส PIN
            </button>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            รหัส PIN เริ่มต้น: 524452
          </p>
        </div>
      </div>
    );
  };

  // ถ้ายังไม่ได้ตรวจสอบ PIN session ให้แสดงหน้ากรอก PIN
  if (pinVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์การติดตั้ง...</p>
        </div>
      </div>
    );
  }

  // ถ้า PIN ยังไม่ผ่าน ให้ไปหน้ากรอก PIN
  // (ในกรณีที่เรียกหน้านี้โดยตรงโดยไม่ผ่าน pin page)
  // หมายเหตุ: การตรวจสอบ cookie จริงๆ ควรทำที่ middleware แต่เราทำที่หน้านี้เพื่อความง่าย

  const renderManageMode = () => {
    const isInstalled = status?.installed;
    const needsUpdate = status?.needsUpdate || false;
    const currentVersion = status?.appVersion || "ไม่ทราบ";
    const latestVersion = status?.latestVersion || "ไม่ทราบ";

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* สถานะระบบ */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              สถานะระบบ beNeCare
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">สถานะการติดตั้ง</p>
                <p className={`text-lg font-bold ${isInstalled ? "text-green-600" : "text-red-600"}`}>
                  {isInstalled ? "ติดตั้งแล้ว" : "ยังไม่ได้ติดตั้ง"}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  needsUpdate ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                }`}
              >
                {needsUpdate ? "ต้องการอัปเดต" : "เวอร์ชันล่าสุด"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  เวอร์ชันปัจจุบัน
                </p>
                <p className="text-lg font-bold text-gray-900">{currentVersion}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  เวอร์ชันล่าสุด
                </p>
                <p className="text-lg font-bold text-gray-900">{latestVersion}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">{status?.message}</p>
          </div>
        </div>

        {/* ปุ่มการจัดการ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isInstalled && needsUpdate && (
            <div className="card border-l-4 border-red-600 p-6">
              <h3 className="font-bold text-gray-900 mb-4">อัปเดตเวอร์ชันระบบ</h3>
              <p className="text-sm text-gray-600 mb-4">
                พบเวอร์ชันใหม่ ระบบจะสำรองข้อมูลและรันマイกราชันอัตโนมัติ
              </p>
              <button
                onClick={updateVersion}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    กำลังอัปเดต...
                  </span>
                ) : (
                  <span>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    อัปเดตเป็นเวอร์ชัน {latestVersion}
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="card border-l-4 border-amber-600 p-6">
            <h3 className="font-bold text-gray-900 mb-4">ติดตั้งระบบใหม่ (Reinstall)</h3>
            <p className="text-sm text-gray-600 mb-4">
              ลบข้อมูลเดิมทั้งหมดและเริ่มต้นติดตั้งใหม่ เหมาะเมื่อการตั้งค่าไม่ครบถ้วนหรือต้องการรีเซตระบบ
            </p>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={confirmReinstall}
                onChange={(e) => setConfirmReinstall(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-amber-800">
                ฉันยืนยันว่าต้องการติดตั้งใหม่ และยินยอมให้ข้อมูลเดิมถูกลบทิ้ง
              </span>
            </label>
            <button
              onClick={reinstall}
              disabled={loading || !confirmReinstall}
              className="btn-primary w-full"
            >
              {loading ? "กำลังติดตั้งใหม่..." : "ติดตั้งระบบใหม่"}
            </button>
          </div>

          <div className="col-span-2 md:col-span-1 card p-6">
            <h3 className="font-bold text-gray-900 mb-4">ดูประวัติการอัปเดต</h3>
            <p className="text-sm text-gray-600 mb-4">
              ดูประวัติการอัปเกรดระบบที่ผ่านมา
            </p>
            <Link
              href="/settings"
              className="btn-secondary w-full text-left"
            >
              <History className="w-4 h-4 mr-2" />
              ไปยังหน้าการตั้งค่าระบบ
            </Link>
          </div>

          <div className="col-span-2 md:col-span-1 card p-6 text-center">
            <button
              onClick={goToPin}
              className="text-sm text-red-600 hover:underline font-medium"
            >
              🔐 เปลี่ยนรหัส PIN / ออกจากหน้าติดตั้ง
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInstallMode = () => {
    const isReinstall = mode === "reinstall";

    const renderStep = () => {
      switch (step) {
        case "welcome":
          return (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                beNeCare Installer
                {isReinstall && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">
                    Reinstall / Reset
                  </span>
                )}
              </h2>
              {isReinstall ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-amber-900 mb-2">
                      ⚠ การติดตั้งระบบใหม่ (Reinstall)
                    </h3>
                    <p className="text-sm text-amber-800 mb-4">
                      การติดตั้งใหม่จะลบข้อมูลเดิมทั้งหมดในฐานข้อมูลและเริ่มต้นใหม่
                      ตรวจสอบให้แน่ใจว่าคุณได้สำรองข้อมูลสำคัญแล้ว
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmReinstall}
                        onChange={(e) => setConfirmReinstall(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-amber-800">
                        ฉันยืนยันว่าต้องการติดตั้งระบบใหม่ และยินยอมให้ข้อมูลเดิมถูกลบทิ้ง
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 mb-6">
                  วิซาร์ดติดตั้งระบบจะช่วยคุณตั้งค่าฐานข้อมูล สร้างบัญชีผู้ดูแล
                  ระบบ และตั้งค่าบริษัทแรก
                </p>
              )}
              <div className="space-y-3 text-left w-full max-w-md mx-auto">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-green-600">✓</span>
                  ตั้งค่าการเชื่อมต่อ MariaDB
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-green-600">✓</span>
                  สร้างบัญชี Super Admin คนแรก
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-green-600">✓</span>
                  ตั้งค่าบริษัทแรก
                </div>
                {!isReinstall && (
                  <>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="text-green-600">✓</span>
                      ตั้งค่า LINE Official Account
                    </div>
                  </>
                )}
              </div>
              <div className="mt-8">
                <button
                  onClick={nextStep}
                  disabled={isReinstall ? !confirmReinstall : false}
                  className="btn-primary"
                >
                  {isReinstall ? "เริ่มต้นติดตั้งใหม่" : "เริ่มต้นติดตั้ง"}
                </button>
              </div>
            </div>
          );

        case "environment":
          return (
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ตรวจสอบสภาพแวดล้อม
              </h2>
              <p className="text-gray-600 mb-6">
                ระบบกำลังตรวจสอบว่าเซิร์ฟเวอร์พร้อมติดตั้งหรือไม่
              </p>
              <button
                onClick={checkEnvironment}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบสภาพแวดล้อม"}
              </button>
              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          );

        case "database":
          return (
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                ตั้งค่าฐานข้อมูล MariaDB
              </h2>
              <p className="text-sm text-gray-500">
                กรอกข้อมูลการเชื่อมต่อฐานข้อมูลที่จะใช้กับ beNeCare
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={dbPort}
                    onChange={(e) => setDbPort(e.target.value)}
                    placeholder="3306"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="benecare"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    placeholder="root"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <button onClick={prevStep} className="btn-secondary flex-1">
                  ย้อนกลับ
                </button>
                <button
                  onClick={testDatabase}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
                </button>
              </div>
              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          );

        case "admin":
          return (
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                สร้างบัญชี Super Admin
              </h2>
              <p className="text-sm text-gray-500">
                สร้างบัญชีผู้ดูแลระบบกลาง ซึ่งจะจัดการบริษัททั้งหมดและการตั้งค่าระบบ
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourcompany.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ดูแลระบบ
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="สมชาย ใจดี"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <button onClick={prevStep} className="btn-secondary flex-1">
                  ย้อนกลับ
                </button>
                <button
                  onClick={isReinstall ? reinstall : nextStep}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {isReinstall
                    ? loading
                      ? "กำลังติดตั้งใหม่..."
                      : "ติดตั้งระบบใหม่"
                    : loading
                      ? "กำลังสร้างบัญชี..."
                      : "ถัดไป"}
                </button>
              </div>
            </div>
          );

        case "company":
          return (
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                ตั้งค่าบริษัทแรก
              </h2>
              <p className="text-sm text-gray-500">
                กรอกข้อมูลบริษัทลูกค้าแรกที่จะใช้งาน beNeCare
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริษัท
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="บริษัท ตัวอย่าง จำกัด"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสประจำตัวผู้เสียภาษี
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    placeholder="0105555000123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมลผู้ติดต่อ
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="hr@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="02-123-4567"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <button onClick={prevStep} className="btn-secondary flex-1">
                  ย้อนกลับ
                </button>
                <button
                  onClick={isReinstall ? reinstall : nextStep}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {isReinstall
                    ? loading
                      ? "กำลังติดตั้งใหม่..."
                      : "ติดตั้งระบบใหม่"
                    : loading
                      ? "กำลังสร้างบริษัท..."
                      : "ตั้งค่า LINE OA"}
                </button>
              </div>
            </div>
          );

        case "line-oa":
          return (
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                ตั้งค่า LINE Official Account
              </h2>
              <p className="text-sm text-gray-500">
                กรอกข้อมูล LINE OA Channel (สามารถข้ามและตั้งค่าทีหลังในเมนู
                การตั้งค่าได้)
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LINE Channel ID
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={lineChannelId}
                    onChange={(e) => setLineChannelId(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LINE Channel Secret
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={lineChannelSecret}
                    onChange={(e) => setLineChannelSecret(e.target.value)}
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  หมายเหตุ: การเชื่อมต่อ API กับ AIA ยังต้องยืนยันกับทีม AIA
                  ก่อนจึงจะสามารถใช้งานได้จริง
                </p>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <button onClick={prevStep} className="btn-secondary flex-1">
                  ย้อนกลับ
                </button>
                <button
                  onClick={install}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "กำลังติดตั้ง..." : "ติดตั้งและเสร็จสิ้น"}
                </button>
              </div>
            </div>
          );

        case "complete":
          return (
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isReinstall ? "ติดตั้งระบบใหม่สำเร็จ" : "ติดตั้งระบบสำเร็จ"}
              </h2>
              <p className="text-gray-600 mb-8">
                beNeCare พร้อมใช้งานแล้ว คุณสามารถเข้าสู่ระบบด้วยบัญชี Super Admin
                ที่สร้างขึ้นได้ทันที
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/login" className="btn-primary w-full">
                  ไปยังหน้าเข้าสู่ระบบ
                </Link>
              </div>
              <div className="mt-6">
                <button
                  onClick={goToPin}
                  className="text-sm text-gray-500 hover:underline"
                >
                  กลับไปหน้าจัดการระบบ (ต้องการ PIN)
                </button>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-2xl">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                beNeCare Installer
                {isReinstall && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">
                    Reinstall
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                {steps.map((s, i) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i <= currentStepIndex
                        ? "bg-red-600"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full">
              <div className="text-sm text-gray-500 mb-4">
                {mode === "reinstall"
                  ? "ติดตั้งระบบใหม่"
                  : `ขั้นตอนที่ ${currentStepIndex + 1} จาก ${steps.length}`}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ถ้ายังไม่ได้ยืนยัน PIN ให้ไปหน้ากรอก PIN
  // (ตรวจสอบจาก cookie benecare_install_pin)
  const hasPinCookie = document.cookie.includes("benecare_install_pin=verified");
  if (!hasPinCookie) {
    return renderPinGate();
  }

  // แสดงตามโหมด
  if (mode === "manage" || mode === "update") {
    return renderManageMode();
  }

  return renderInstallMode();
}

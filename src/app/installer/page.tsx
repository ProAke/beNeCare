"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Step =
  | "welcome"
  | "environment"
  | "database"
  | "admin"
  | "company"
  | "line-oa"
  | "complete";

type Action = "install" | "reinstall";

const INSTALL_STEPS: Step[] = [
  "welcome",
  "environment",
  "database",
  "admin",
  "company",
  "line-oa",
  "complete",
];

const REINSTALL_STEPS: Step[] = [
  "welcome",
  "database",
  "admin",
  "company",
  "complete",
];

export default function InstallerPage() {
  const [action, setAction] = useState<Action>("install");
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form states
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

  // ตรวจสอบ query param action เมื่อโหลดหน้า
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const actionParam = params.get("action");
      if (actionParam === "reinstall") {
        setAction("reinstall");
        setStep("welcome");
      } else {
        setAction("install");
        setStep("welcome");
      }
    }
  }, []);

  const steps = action === "reinstall" ? REINSTALL_STEPS : INSTALL_STEPS;
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
      // Step 1: Create database and tables
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

      // Step 2: Create Super Admin
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

      // Step 3: Create Company
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

      // Step 4: Save LINE OA settings (optional)
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

  const isReinstall = action === "reinstall";
  const currentStepLabel = step === "complete" ? "เสร็จสิ้น" : `ขั้นตอนที่ ${currentStepIndex + 1}`;

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              beNeCare Installer
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
                      className="rounded text-red-600 focus:ring-red-500"
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
              {isReinstall ? "สร้างบัญชี Super Admin ใหม่" : "สร้างบัญชี Super Admin"}
            </h2>
            <p className="text-sm text-gray-500">
              {isReinstall
                ? "สร้างบัญชีผู้ดูแลระบบกลางคนใหม่ ซึ่งจะจัดการบริษัททั้งหมดและการตั้งค่าระบบ"
                : "สร้างบัญชีผู้ดูแลระบบกลางคนแรก ซึ่งจะจัดการบริษัททั้งหมดและการตั้งค่าระบบ"}
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
              {isReinstall
                ? "ติดตั้งระบบใหม่สำเร็จ"
                : "ติดตั้งระบบสำเร็จ"}
            </h2>
            <p className="text-gray-600 mb-8">
              beNeCare พร้อมใช้งานแล้ว คุณสามารถเข้าสู่ระบบด้วยบัญชี Super Admin
              ที่สร้างขึ้นได้ทันที
            </p>
            <Link href="/login" className="btn-primary w-full">
              ไปยังหน้าเข้าสู่ระบบ
            </Link>
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
              {currentStepLabel} จาก {steps.length}
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
}

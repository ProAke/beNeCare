<template>
  <div v-if="pinVerified === null" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
      <p class="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์การติดตั้ง...</p>
    </div>
  </div>

  <div v-else-if="!hasPinCookie" class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
      <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="text-amber-600 text-3xl">🔐</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">ยืนยันรหัส PIN</h2>
      <p class="text-sm text-gray-600 mb-8">กรุณากรอกรหัส PIN เพื่อเข้าสู่หน้าติดตั้ง / จัดการระบบ</p>
      <div class="space-y-3">
        <input
          type="password"
          class="pin-input w-full text-center"
          maxlength="6"
          placeholder="524452"
          autocomplete="off"
        />
        <button @click="goToPin" class="btn-primary w-full">
          ไปยังหน้ากรอกรหัส PIN
        </button>
      </div>
      <p class="mt-6 text-xs text-gray-400">รหัส PIN เริ่มต้น: 524452</p>
    </div>
  </div>

  <div v-else-if="mode === 'manage' || mode === 'update'" class="max-w-2xl mx-auto space-y-8">
    <!-- สถานะระบบ -->
    <div class="card">
      <div class="p-6 border-b border-gray-200">
        <h2 class="font-bold text-lg text-gray-900 flex items-center gap-2">
          <span class="text-red-600">🛡</span> สถานะระบบ beNeCare
        </h2>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 uppercase">สถานะการติดตั้ง</p>
            <p :class="`text-lg font-bold ${isInstalled ? 'text-green-600' : 'text-red-600'}`">
              {{ isInstalled ? 'ติดตั้งแล้ว' : 'ยังไม่ได้ติดตั้ง' }}
            </p>
          </div>
          <span
            :class="`px-3 py-1 rounded-full text-xs font-medium ${needsUpdate ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`"
          >
            {{ needsUpdate ? 'ต้องการอัปเดต' : 'เวอร์ชันล่าสุด' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-xs font-semibold text-gray-500 uppercase">เวอร์ชันปัจจุบัน</p>
            <p class="text-lg font-bold text-gray-900">{{ currentVersion }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-xs font-semibold text-gray-500 uppercase">เวอร์ชันล่าสุด</p>
            <p class="text-lg font-bold text-gray-900">{{ latestVersion }}</p>
          </div>
        </div>

        <p class="text-sm text-gray-600">{{ statusMessage }}</p>
      </div>
    </div>

    <!-- ปุ่มการจัดการ -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-if="isInstalled && needsUpdate" class="card border-l-4 border-red-600 p-6">
        <h3 class="font-bold text-gray-900 mb-4">อัปเดตเวอร์ชันระบบ</h3>
        <p class="text-sm text-gray-600 mb-4">พบเวอร์ชันใหม่ ระบบจะสำรองข้อมูลและรันマイกราชันอัตโนมัติ</p>
        <button @click="updateVersion" :disabled="upgrading" class="btn-primary w-full">
          <span v-if="upgrading" class="flex items-center gap-2">
            <span class="animate-spin"></span> กำลังอัปเดต...
          </span>
          <span v-else>
            <span class="text-red-600">🔄</span> อัปเดตเป็นเวอร์ชัน {{ latestVersion }}
          </span>
        </button>
      </div>

      <div class="card border-l-4 border-amber-600 p-6">
        <h3 class="font-bold text-gray-900 mb-4">ติดตั้งระบบใหม่ (Reinstall)</h3>
        <p class="text-sm text-gray-600 mb-4">ลบข้อมูลเดิมทั้งหมดและเริ่มต้นติดตั้งใหม่ เหมาะเมื่อการตั้งค่าไม่ครบถ้วนหรือต้องการรีเซตระบบ</p>
        <label class="flex items-center gap-3 cursor-pointer mb-4">
          <input type="checkbox" :checked="confirmReinstall" @change="confirmReinstall = $event.target.checked" class="rounded text-amber-600 focus:ring-amber-500" />
          <span class="text-sm text-amber-800">ฉันยืนยันว่าต้องการติดตั้งใหม่ และยินยอมให้ข้อมูลเดิมถูกลบทิ้ง</span>
        </label>
        <button @click="reinstall" :disabled="upgrading || !confirmReinstall" class="btn-primary w-full">
          <span v-if="upgrading" class="flex items-center gap-2">
            <span class="animate-spin"></span> กำลังติดตั้งใหม่...
          </span>
          <span v-else>ติดตั้งระบบใหม่</span>
        </button>
      </div>

      <div class="col-span-2 md:col-span-1 card p-6">
        <h3 class="font-bold text-gray-900 mb-4">ดูประวัติการอัปเดต</h3>
        <p class="text-sm text-gray-600 mb-4">ดูประวัติการอัปเกรดระบบที่ผ่านมา</p>
        <a href="/settings" class="btn-secondary w-full text-left">
          <span class="text-gray-600">📜</span> ไปยังหน้าการตั้งค่าระบบ
        </a>
      </div>

      <div class="col-span-2 md:col-span-1 card p-6 text-center">
        <button @click="goToPin" class="text-sm text-red-600 hover:underline font-medium">
          🔐 เปลี่ยนรหัส PIN / ออกจากหน้าติดตั้ง
        </button>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-2xl">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">
            beNeCare Installer
            <span v-if="isReinstall" class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-2">Reinstall</span>
          </h2>
          <div class="flex gap-2">
            <div
              v-for="(s, i) in steps"
              :key="s"
              class="w-2 h-2 rounded-full transition-colors"
              :class="i <= currentStepIndex ? 'bg-red-600' : 'bg-gray-300'"
            />
          </div>
        </div>
        <div class="w-full">
          <div class="text-sm text-gray-500 mb-4">
            {{ isReinstall ? 'ติดตั้งระบบใหม่' : `ขั้นตอนที่ ${currentStepIndex + 1} จาก ${steps.length}` }}
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div class="bg-red-600 h-2 rounded-full transition-all duration-300" :style="{ width: progress + '%' }" />
          </div>
          <component :is="currentStepComponent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const INSTALL_PIN = config.public.installPin || "524452";

const pinVerified = ref(null);
const status = ref(null);
const mode = ref("install");
const step = ref("welcome");
const loading = ref(false);
const error = ref("");
const message = ref("");
const upgrading = ref(false);

// Form states
const dbHost = ref("localhost");
const dbPort = ref("3306");
const dbName = ref("benecare");
const dbUser = ref("root");
const dbPass = ref("");

const adminEmail = ref("");
const adminPassword = ref("");
const adminName = ref("");

const companyName = ref("");
const companyTaxId = ref("");
const companyEmail = ref("");
const companyPhone = ref("");

const lineChannelId = ref("");
const lineChannelSecret = ref("");

const confirmReinstall = ref(false);

const INSTALL_STEPS = ["welcome", "environment", "database", "admin", "company", "line-oa", "complete"];

const currentStepIndex = computed(() => INSTALL_STEPS.indexOf(step.value));
const progress = computed(() => ((currentStepIndex.value + 1) / INSTALL_STEPS.length) * 100);

const hasPinCookie = () => document.cookie.includes("benecare_install_pin=verified");

const currentStepComponent = computed(() => {
  return `step-${step.value}`;
});

onMounted(async () => {
  // ตรวจสอบ PIN cookie
  if (!hasPinCookie()) {
    pinVerified.value = false;
    return;
  }
  pinVerified.value = true;

  // ตรวจสอบสถานะระบบ
  try {
    const res = await fetch("/api/installer/status", { cache: "no-store" });
    if (res.ok) {
      status.value = await res.json();
      if (status.value.status === "not_installed" || status.value.status === "installation_needed") {
        mode.value = "install";
      } else if (status.value.status === "needs_update") {
        mode.value = "update";
      } else {
        mode.value = "manage";
      }
    }
  } catch {
    // ignore
  }
});

const isReinstall = computed(() => mode.value === "reinstall");
const isInstalled = computed(() => status.value?.installed || false);
const needsUpdate = computed(() => status.value?.needsUpdate || false);
const currentVersion = computed(() => status.value?.appVersion || "ไม่ทราบ");
const latestVersion = computed(() => status.value?.latestVersion || "ไม่ทราบ");
const statusMessage = computed(() => status.value?.message || "");

const nextStep = () => {
  const next = INSTALL_STEPS[currentStepIndex.value + 1];
  if (next) step.value = next;
};

const prevStep = () => {
  const prev = INSTALL_STEPS[currentStepIndex.value - 1];
  if (prev) step.value = prev;
};

const goToPin = () => {
  window.location.href = "/installer/pin";
};

const checkEnvironment = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch("/api/installer/environment");
    const data = await res.json();
    if (data.ok) {
      nextStep();
    } else {
      error.value = data.message || "สภาพแวดล้อมไม่พร้อม";
    }
  } catch {
    error.value = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
  } finally {
    loading.value = false;
  }
};

const testDatabase = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch("/api/installer/test-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: dbHost.value,
        port: dbPort.value,
        name: dbName.value,
        user: dbUser.value,
        password: dbPass.value,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      nextStep();
    } else {
      error.value = data.message || "เชื่อมต่อฐานข้อมูลไม่สำเร็จ";
    }
  } catch {
    error.value = "เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ";
  } finally {
    loading.value = false;
  }
};

const install = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res1 = await fetch("/api/installer/install-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: dbHost.value,
        port: dbPort.value,
        name: dbName.value,
        user: dbUser.value,
        password: dbPass.value,
        admin: {
          email: adminEmail.value,
          password: adminPassword.value,
          fullName: adminName.value,
        },
        company: {
          name: companyName.value,
          taxId: companyTaxId.value,
          contactEmail: companyEmail.value,
          contactPhone: companyPhone.value,
        },
      }),
    });
    const data1 = await res1.json();
    if (!data1.ok) {
      error.value = data1.message || "สร้างฐานข้อมูลไม่สำเร็จ";
      loading.value = false;
      return;
    }

    if (lineChannelId.value || lineChannelSecret.value) {
      await fetch("/api/installer/save-line-oa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.value,
          channelId: lineChannelId.value,
          channelSecret: lineChannelSecret.value,
        }),
      });
    }

    step.value = "complete";
  } catch {
    error.value = "เกิดข้อผิดพลาดขณะติดตั้งระบบ";
  } finally {
    loading.value = false;
  }
};

const reinstall = async () => {
  if (!confirmReinstall.value) {
    error.value = "กรุณาเลือกยืนยันการติดตั้งใหม่ (ยินยอมให้เขียนทับข้อมูลเดิม)";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const res = await fetch("/api/installer/reinstall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirm: true,
        host: dbHost.value,
        port: dbPort.value,
        name: dbName.value,
        user: dbUser.value,
        password: dbPass.value,
        admin: {
          email: adminEmail.value,
          password: adminPassword.value,
          fullName: adminName.value,
        },
        company: {
          name: companyName.value,
          taxId: companyTaxId.value,
          contactEmail: companyEmail.value,
          contactPhone: companyPhone.value,
        },
      }),
    });
    const data = await res.json();
    if (data.ok) {
      step.value = "complete";
    } else {
      error.value = data.message || "ติดตั้งระบบใหม่ไม่สำเร็จ";
    }
  } catch {
    error.value = "เกิดข้อผิดพลาดขณะติดตั้งระบบใหม่";
  } finally {
    loading.value = false;
  }
};

const updateVersion = async () => {
  upgrading.value = true;
  try {
    const res = await fetch("/api/settings/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetVersion: latestVersion.value }),
    });
    if (res.ok) {
      message.value = "อัปเดตเวอร์ชันสำเร็จแล้ว";
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const data = await res.json();
      error.value = data.message || "อัปเดตเวอร์ชันไม่สำเร็จ";
    }
  } catch {
    error.value = "เกิดข้อผิดพลาดในการอัปเดตเวอร์ชัน";
  } finally {
    upgrading.value = false;
  }
};

// Dynamic step components (inline templates)
const stepWelcome = {
  template: `
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">beNeCare Installer</h2>
      <div v-if="isReinstall" class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
        <h3 class="font-bold text-amber-900 mb-2">⚠ การติดตั้งระบบใหม่ (Reinstall)</h3>
        <p class="text-sm text-amber-800 mb-4">การติดตั้งใหม่จะลบข้อมูลเดิมทั้งหมดในฐานข้อมูลและเริ่มต้นใหม่ ตรวจสอบให้แน่ใจว่าคุณได้สำรองข้อมูลสำคัญแล้ว</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" :checked="confirmReinstall" @change="confirmReinstall = $event.target.checked" class="rounded text-amber-600 focus:ring-amber-500" />
          <span class="text-sm text-amber-800">ฉันยืนยันว่าต้องการติดตั้งระบบใหม่ และยินยอมให้ข้อมูลเดิมถูกลบทิ้ง</span>
        </label>
      </div>
      <p v-else class="text-gray-600 mb-6">วิซาร์ดติดตั้งระบบจะช่วยคุณตั้งค่าฐานข้อมูล สร้างบัญชีผู้ดูแลระบบ และตั้งค่าบริษัทแรก</p>
      <div class="space-y-3 text-left w-full max-w-md mx-auto">
        <div class="flex items-center gap-3 text-sm text-gray-700"><span class="text-green-600">✓</span> ตั้งค่าการเชื่อมต่อ MariaDB</div>
        <div class="flex items-center gap-3 text-sm text-gray-700"><span class="text-green-600">✓</span> สร้างบัญชี Super Admin คนแรก</div>
        <div class="flex items-center gap-3 text-sm text-gray-700"><span class="text-green-600">✓</span> ตั้งค่าบริษัทแรก</div>
        <div v-if="!isReinstall" class="flex items-center gap-3 text-sm text-gray-700"><span class="text-green-600">✓</span> ตั้งค่า LINE Official Account</div>
      </div>
      <div class="mt-8">
        <button @click="nextStep" :disabled="isReinstall ? !confirmReinstall : false" class="btn-primary">
          {{ isReinstall ? 'เริ่มต้นติดตั้งใหม่' : 'เริ่มต้นติดตั้ง' }}
        </button>
      </div>
    </div>
  `,
};

const stepEnvironment = {
  template: `
    <div class="text-center">
      <h2 class="text-xl font-bold text-gray-900 mb-2">ตรวจสอบสภาพแวดล้อม</h2>
      <p class="text-gray-600 mb-6">ระบบกำลังตรวจสอบว่าเซิร์ฟเวอร์พร้อมติดตั้งหรือไม่</p>
      <button @click="checkEnvironment" :disabled="loading" class="btn-primary">
        {{ loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสภาพแวดล้อม' }}
      </button>
      <div v-if="error" class="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</div>
    </div>
  `,
};

const stepDatabase = {
  template: `
    <div class="max-w-md mx-auto space-y-4">
      <h2 class="text-xl font-bold text-gray-900">ตั้งค่าฐานข้อมูล MariaDB</h2>
      <p class="text-sm text-gray-500">กรอกข้อมูลการเชื่อมต่อฐานข้อมูลที่จะใช้กับ beNeCare</p>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Host</label>
          <input type="text" class="input-field" v-model="dbHost" placeholder="localhost" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Port</label>
          <input type="text" class="input-field" v-model="dbPort" placeholder="3306" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
          <input type="text" class="input-field" v-model="dbName" placeholder="benecare" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" class="input-field" v-model="dbUser" placeholder="root" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" class="input-field" v-model="dbPass" placeholder="••••••••" />
        </div>
      </div>
      <div class="flex justify-between gap-2 pt-4">
        <button @click="prevStep" class="btn-secondary flex-1">ย้อนกลับ</button>
        <button @click="testDatabase" :disabled="loading" class="btn-primary flex-1">{{ loading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ' }}</button>
      </div>
      <div v-if="error" class="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</div>
    </div>
  `,
};

const stepAdmin = {
  template: `
    <div class="max-w-md mx-auto space-y-4">
      <h2 class="text-xl font-bold text-gray-900">สร้างบัญชี Super Admin</h2>
      <p class="text-sm text-gray-500">สร้างบัญชีผู้ดูแลระบบกลาง ซึ่งจะจัดการบริษัททั้งหมดและการตั้งค่าระบบ</p>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
          <input type="email" class="input-field" v-model="adminEmail" placeholder="admin@yourcompany.com" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
          <input type="password" class="input-field" v-model="adminPassword" placeholder="••••••••" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ดูแลระบบ</label>
          <input type="text" class="input-field" v-model="adminName" placeholder="สมชาย ใจดี" required />
        </div>
      </div>
      <div class="flex justify-between gap-2 pt-4">
        <button @click="prevStep" class="btn-secondary flex-1">ย้อนกลับ</button>
        <button @click="isReinstall ? reinstall : nextStep" :disabled="loading" class="btn-primary flex-1">
          {{ isReinstall ? (loading ? 'กำลังติดตั้งใหม่...' : 'ติดตั้งระบบใหม่') : (loading ? 'กำลังสร้างบัญชี...' : 'ถัดไป') }}
        </button>
      </div>
    </div>
  `,
};

const stepCompany = {
  template: `
    <div class="max-w-md mx-auto space-y-4">
      <h2 class="text-xl font-bold text-gray-900">ตั้งค่าบริษัทแรก</h2>
      <p class="text-sm text-gray-500">กรอกข้อมูลบริษัทลูกค้าแรกที่จะใช้งาน beNeCare</p>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
          <input type="text" class="input-field" v-model="companyName" placeholder="บริษัท ตัวอย่าง จำกัด" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">รหัสประจำตัวผู้เสียภาษี</label>
          <input type="text" class="input-field" v-model="companyTaxId" placeholder="0105555000123" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้ติดต่อ</label>
          <input type="email" class="input-field" v-model="companyEmail" placeholder="hr@company.com" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
          <input type="text" class="input-field" v-model="companyPhone" placeholder="02-123-4567" />
        </div>
      </div>
      <div class="flex justify-between gap-2 pt-4">
        <button @click="prevStep" class="btn-secondary flex-1">ย้อนกลับ</button>
        <button @click="isReinstall ? reinstall : nextStep" :disabled="loading" class="btn-primary flex-1">
          {{ isReinstall ? (loading ? 'กำลังติดตั้งใหม่...' : 'ติดตั้งระบบใหม่') : (loading ? 'กำลังสร้างบริษัท...' : 'ตั้งค่า LINE OA') }}
        </button>
      </div>
    </div>
  `,
};

const stepLineOa = {
  template: `
    <div class="max-w-md mx-auto space-y-4">
      <h2 class="text-xl font-bold text-gray-900">ตั้งค่า LINE Official Account</h2>
      <p class="text-sm text-gray-500">กรอกข้อมูล LINE OA Channel (สามารถข้ามและตั้งค่าทีหลังในเมนูการตั้งค่าได้)</p>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">LINE Channel ID</label>
          <input type="text" class="input-field" v-model="lineChannelId" placeholder="1234567890" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">LINE Channel Secret</label>
          <input type="text" class="input-field" v-model="lineChannelSecret" placeholder="••••••••••••••••" />
        </div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p class="text-sm text-amber-800">หมายเหตุ: การเชื่อมต่อ API กับ AIA ยังต้องยืนยันกับทีม AIA ก่อนจึงจะสามารถใช้งานได้จริง</p>
      </div>
      <div class="flex justify-between gap-2 pt-4">
        <button @click="prevStep" class="btn-secondary flex-1">ย้อนกลับ</button>
        <button @click="install" :disabled="loading" class="btn-primary flex-1">{{ loading ? 'กำลังติดตั้ง...' : 'ติดตั้งและเสร็จสิ้น' }}</button>
      </div>
    </div>
  `,
};

const stepComplete = {
  template: `
    <div class="text-center max-w-md mx-auto">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-green-600 text-2xl">✓</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ isReinstall ? 'ติดตั้งระบบใหม่สำเร็จ' : 'ติดตั้งระบบสำเร็จ' }}</h2>
      <p class="text-gray-600 mb-8">beNeCare พร้อมใช้งานแล้ว คุณสามารถเข้าสู่ระบบด้วยบัญชี Super Admin ที่สร้างขึ้นได้ทันที</p>
      <div class="flex gap-3 justify-center">
        <a href="/login" class="btn-primary w-full">ไปยังหน้าเข้าสู่ระบบ</a>
      </div>
      <div class="mt-6">
        <button @click="goToPin" class="text-sm text-gray-500 hover:underline">กลับไปหน้าจัดการระบบ (ต้องการ PIN)</button>
      </div>
    </div>
  `,
};

// Register step components
const stepComponents = {
  "step-welcome": stepWelcome,
  "step-environment": stepEnvironment,
  "step-database": stepDatabase,
  "step-admin": stepAdmin,
  "step-company": stepCompany,
  "step-line-oa": stepLineOa,
  "step-complete": stepComplete,
};

// Override computed to use registered components
const currentStepComponentFinal = computed(() => stepComponents[`step-${step.value}`]);

// Expose to template
const steps = INSTALL_STEPS;
</script>

<style>
.pin-input {
  @apply w-12 h-12 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-500 outline-none;
}
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
}
.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2;
}
.input-field {
  @apply block w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors;
}
.card {
  @apply bg-white rounded-xl border border-gray-200 shadow-sm p-6;
}
</style>

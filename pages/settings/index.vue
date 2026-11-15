<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <h1 class="font-bold text-xl text-gray-900">การตั้งค่าระบบ</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-1 space-y-4">
          <div class="card p-6">
            <h3 class="font-bold text-gray-900 mb-4">เมนูการตั้งค่า</h3>
            <div class="space-y-2">
              <a href="/settings" class="btn-secondary w-full text-left">ทั่วไป</a>
              <a href="#" class="btn-secondary w-full text-left">LINE OA</a>
              <a href="#" class="btn-secondary w-full text-left">คำถามที่พบบ่อย</a>
              <a href="#" class="btn-secondary w-full text-left">ประวัติการดำเนินการ</a>
            </div>
          </div>
        </aside>

        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- ส่วนอัปเกรดระบบ -->
          <div class="card border-l-4 border-red-600">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-6">
                <span class="text-red-600">🗄</span>
                <h2 class="font-bold text-lg text-gray-900">ส่วนอัปเกรดระบบ</h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                  <p class="text-xs font-semibold text-gray-500 uppercase">เวอร์ชันปัจจุบัน</p>
                  <p class="text-xl font-bold text-gray-900">{{ systemVersion }}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                  <p class="text-xs font-semibold text-gray-500 uppercase">เวอร์ชันล่าสุด</p>
                  <p class="text-xl font-bold text-gray-900">{{ latestVersion }}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                  <p class="text-xs font-semibold text-gray-500 uppercase">สถานะ</p>
                  <p :class="`text-sm font-medium ${updateAvailable ? 'text-red-600' : 'text-green-600'}`">
                    {{ updateAvailable ? 'มีอัปเดตใหม่' : 'เป็นเวอร์ชันล่าสุด' }}
                  </p>
                </div>
              </div>

              <div class="flex gap-3 mb-6">
                <button @click="checkVersion" :disabled="checkingVersion" class="btn-secondary flex-1">
                  <span v-if="checkingVersion" class="animate-spin"></span> ตรวจสอบอัปเดต
                </button>
              </div>

              <div v-if="updateAvailable" class="space-y-4">
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p class="text-sm text-amber-800">
                    ก่อนอัปเกรดระบบ ขอแนะนำให้สำรองข้อมูลฐานข้อมูล MariaDB เพื่อป้องกันข้อมูลสูญหาย
                  </p>
                </div>

                <div class="flex gap-3">
                  <button
                    @click="backupDatabase"
                    :disabled="backuping || upgrading"
                    class="btn-secondary flex-1"
                  >
                    <span v-if="backuping" class="flex items-center gap-2">
                      <span class="animate-spin"></span> กำลังสำรอง...
                    </span>
                    <span v-else>
                      <span class="text-gray-600">💾</span> สำรองข้อมูลก่อนอัปเกรด
                    </span>
                  </button>
                  <button
                    @click="upgradeSystem"
                    :disabled="upgrading || backuping"
                    class="btn-primary flex-1"
                  >
                    <span v-if="upgrading" class="flex items-center gap-2">
                      <span class="animate-spin"></span> กำลังอัปเกรด...
                    </span>
                    <span v-else>
                      <span class="text-red-600">🛡</span> อัปเกรดเป็นเวอร์ชัน {{ latestVersion }}
                    </span>
                  </button>
                </div>
              </div>

              <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm text-green-800">ระบบของคุณเป็นเวอร์ชันล่าสุดแล้ว ไม่จำเป็นต้องอัปเกรด</p>
              </div>
            </div>
          </div>

          <!-- ประวัติการอัปเกรด -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <h2 class="font-bold text-lg text-gray-900">ประวัติการอัปเกรด</h2>
            </div>
            <div class="p-6">
              <div v-if="upgradeHistory.length === 0" class="text-center py-4 text-gray-500">
                ยังไม่มีประวัติการอัปเกรด
              </div>
              <ul v-else class="space-y-4">
                <li
                  v-for="(h, i) in upgradeHistory"
                  :key="i"
                  class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p class="font-medium text-gray-900">เวอร์ชัน {{ h.version }}</p>
                    <p class="text-sm text-gray-500">ดำเนินการโดย: {{ h.admin }}</p>
                  </div>
                  <span class="text-sm text-gray-500">{{ h.date }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- การตั้งค่าทั่วไป -->
          <div class="card">
            <div class="p-6 border-b border-gray-200">
              <h2 class="font-bold text-lg text-gray-900">การตั้งค่าทั่วไป</h2>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">ชื่อแอปพลิเคชัน</h3>
                <input type="text" class="input-field w-full max-w-md" value="beNeCare" readonly />
                <p class="text-xs text-gray-500 mt-1">เปลี่ยนชื่อได้ในไฟล์การกำหนดค่าระบบ</p>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">ฐานข้อมูล</h3>
                <p class="text-sm text-gray-600">MariaDB (เชื่อมต่อผ่านหน้าติดตั้ง)</p>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">ช่องทาง LINE OA</h3>
                <p class="text-sm text-gray-600">ตั้งค่าได้ที่หน้าติดตั้ง หรือเมนู LINE OA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const systemVersion = ref("1.0.0");
const latestVersion = ref("1.1.0");
const updateAvailable = ref(false);
const checkingVersion = ref(false);
const backuping = ref(false);
const upgrading = ref(false);
const upgradeHistory = ref([]);

onMounted(async () => {
  try {
    const res = await fetch("/api/installer/status", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.installed && data.appVersion) {
        systemVersion.value = data.appVersion;
        latestVersion.value = data.latestVersion || "1.1.0";
        updateAvailable.value = data.needsUpdate || false;
      }
    }
  } catch {
    // ignore
  }

  try {
    const histRes = await fetch("/api/settings/upgrade-history", { cache: "no-store" });
    if (histRes.ok) {
      upgradeHistory.value = await histRes.json();
    }
  } catch {
    // ignore
  }
});

const checkVersion = async () => {
  checkingVersion.value = true;
  try {
    const res = await fetch("/api/installer/status", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.installed && data.appVersion) {
        systemVersion.value = data.appVersion;
        latestVersion.value = data.latestVersion || "1.1.0";
        updateAvailable.value = data.needsUpdate || false;
      }
    }
  } catch {
    // ignore
  } finally {
    checkingVersion.value = false;
  }
};

const backupDatabase = async () => {
  backuping.value = true;
  try {
    const res = await fetch("/api/settings/backup", { method: "POST" });
    if (res.ok) {
      alert("สำรองข้อมูลสำเร็จแล้ว");
    } else {
      alert("สำรองข้อมูลไม่สำเร็จ");
    }
  } catch {
    alert("เกิดข้อผิดพลาดในการสำรองข้อมูล");
  } finally {
    backuping.value = false;
  }
};

const upgradeSystem = async () => {
  if (!confirm("คุณต้องการอัปเกรดระบบหรือไม่? ระบบจะสำรองข้อมูลฐานข้อมูลและรันマイกราชันอัตโนมัติ")) {
    return;
  }
  upgrading.value = true;
  try {
    const res = await fetch("/api/settings/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetVersion: latestVersion.value }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(data.message || "อัปเกรดสำเร็จ");
      systemVersion.value = latestVersion.value;
      updateAvailable.value = false;
      upgradeHistory.value.unshift({
        version: latestVersion.value,
        date: new Date().toLocaleDateString("th-TH"),
        admin: "Super Admin",
      });
    } else {
      const data = await res.json();
      alert(data.message || "อัปเกรดไม่สำเร็จ");
    }
  } catch {
    alert("เกิดข้อผิดพลาดในการอัปเกรด");
  } finally {
    upgrading.value = false;
  }
};
</script>

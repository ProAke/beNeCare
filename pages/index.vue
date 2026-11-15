<template>
  <div v-if="checking" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
      <p class="mt-4 text-gray-600">กำลังตรวจสอบสถานะระบบ...</p>
    </div>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-red-50 p-4">
    <div class="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-lg p-8 text-center">
      <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-red-600 text-2xl">⚠</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">ระบบยังไม่พร้อมใช้งาน</h2>
      <p class="text-sm text-gray-600 mb-6">{{ error }}</p>
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
        <p class="text-xs font-semibold text-amber-800 mb-2">ขั้นตอนแก้ไขเบื้องต้น:</p>
        <ul class="text-sm text-amber-700 list-disc list-inside space-y-1">
          <li>สร้างไฟล์ <code class="font-mono text-xs">.env</code> บนเซิร์ฟเวอร์</li>
          <li>ตั้งค่า <code class="font-mono text-xs">DATABASE_URL</code> ให้ถูกต้อง</li>
          <li>รัน <code class="font-mono text-xs">npm install</code> และ <code class="font-mono text-xs">npx prisma migrate deploy</code></li>
        </ul>
      </div>
      <div class="flex gap-3 justify-center">
        <button @click="location.reload()" class="btn-primary flex-1">รีเฟรชอีกครั้ง</button>
      </div>
      <div class="mt-4">
        <a href="/installer/pin" class="text-sm text-red-600 hover:underline">→ ไปยังหน้าติดตั้งระบบ (ต้องการรหัส PIN)</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const checking = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const res = await fetch("/api/installer/status", { cache: "no-store" });

    if (!res.ok) {
      error.value = "เซิร์ฟเวอร์ตอบสนองผิดปกติ กรุณาตรวจสอบการตั้งค่า";
      checking.value = false;
      return;
    }

    const data = await res.json();

    if (data.installed) {
      window.location.href = "/login";
    } else {
      window.location.href = "/installer/pin";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการตั้งค่า";
  } finally {
    checking.value = false;
  }
});
</script>

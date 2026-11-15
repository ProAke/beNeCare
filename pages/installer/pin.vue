<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="text-red-600 text-3xl">🔐</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">รหัสผ่านการติดตั้งระบบ</h2>
      <p class="text-sm text-gray-600 mb-8">
        กรุณากรอกรหัส PIN เพื่อเข้าสู่หน้าติดตั้ง / จัดการระบบ beNeCare
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">รหัส PIN</label>
          <input
            type="password"
            class="pin-input w-full text-center"
            v-model="pin"
            maxlength="6"
            placeholder="524452"
            required
            autocomplete="off"
          />
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full"
        >
          {{ loading ? "กำลังยืนยัน..." : "ยืนยันรหัส PIN" }}
        </button>
      </form>

      <div class="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
        <p>รหัส PIN เริ่มต้น: <span class="font-mono text-red-600 font-bold">524452</span></p>
        <p class="mt-2">
          รหัสนี้ใช้สำหรับเข้าถึงหน้าติดตั้ง รีเซตระบบ และอัปเดตเวอร์ชันทุกครั้ง
        </p>
      </div>

      <div class="mt-6">
        <a href="/login" class="text-sm text-gray-500 hover:underline">
          ← มีบัญชีผู้ใช้แล้ว? ไปยังหน้าเข้าสู่ระบบ
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const pin = ref("");
const loading = ref(false);
const error = ref("");

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    const res = await fetch("/api/installer/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pin.value }),
    });

    if (!res.ok) {
      const data = await res.json();
      error.value = data.message || "รหัส PIN ไม่ถูกต้อง";
      loading.value = false;
      return;
    }

    await res.json();
    window.location.href = "/installer";
  } catch {
    error.value = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md">
      <div class="card mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">beNeCare</h1>
          <p class="text-sm text-gray-500 mt-2">ระบบดูแลลูกค้าประกันกลุ่มผ่าน LINE OA</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              class="input-field"
              placeholder="name@company.com"
              v-model="email"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              class="input-field"
              placeholder="••••••••"
              v-model="password"
              required
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
            {{ loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ" }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          ยังไม่มีบัญชีผู้ดูแลระบบ?
          <a href="/installer/pin" class="text-red-600 hover:underline font-medium"> เริ่มติดตั้งระบบครั้งแรก</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = data.message || "เข้าสู่ระบบไม่สำเร็จ";
      loading.value = false;
      return;
    }

    // เก็บ token ใน cookie
    document.cookie = `benecare_session=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    window.location.href = "/dashboard";
  } catch {
    error.value = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
    loading.value = false;
  }
};
</script>

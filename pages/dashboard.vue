<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <h1 class="font-bold text-xl text-gray-900">beNeCare</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600 hidden sm:inline">Super Admin</span>
          <a href="/installer/pin" class="text-sm text-red-600 hover:text-red-700">จัดการระบบ (PIN)</a>
          <button class="text-sm text-gray-600 hover:text-red-600">ออกจากระบบ</button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-8">แดชบอร์ดภาพรวม</h2>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">บริษัทลูกค้า</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.companies }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <span class="text-xl">🏢</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">พนักงานรวม</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.employees }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <span class="text-xl">👥</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">การสนทนาทั้งหมด</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.conversations }}</p>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <span class="text-xl">💬</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">ข้อความวันนี้</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.messagesToday }}</p>
            </div>
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <span class="text-xl">📩</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <h3 class="font-bold text-gray-900 mb-4">การดำเนินการด่วน</h3>
          <div class="space-y-3">
            <a href="/settings" class="btn-secondary w-full">การตั้งค่าระบบ</a>
            <a href="#" class="btn-secondary w-full">จัดการบริษัทลูกค้า</a>
            <a href="#" class="btn-secondary w-full">จัดการพนักงาน</a>
          </div>
        </div>

        <div class="card">
          <h3 class="font-bold text-gray-900 mb-4">คำแนะนำ</h3>
          <ul class="space-y-3 text-sm text-gray-600">
            <li class="flex items-center gap-2">
              <span class="text-green-600">✓</span> ระบบพร้อมใช้งานแล้ว
            </li>
            <li class="flex items-center gap-2">
              <span class="text-gray-400">○</span> เชื่อมต่อ LINE OA Channel
            </li>
            <li class="flex items-center gap-2">
              <span class="text-gray-400">○</span> เพิ่มคำถามที่พบบ่อย (FAQ)
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="font-bold text-gray-900 mb-4">ข้อมูลระบบ</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between text-gray-600">
              <span>เวอร์ชันระบบ:</span>
              <span class="font-medium">1.0.0</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>ฐานข้อมูล:</span>
              <span class="font-medium">MariaDB</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>สถานะ:</span>
              <span class="text-green-600 font-medium">ปกติ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="card">
        <h3 class="font-bold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
        <div class="text-center py-8 text-gray-400">
          ยังไม่มีกิจกรรมล่าสุด เริ่มต้นโดยเพิ่มบริษัทลูกค้าครั้งแรก
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const stats = {
  companies: 0,
  employees: 0,
  conversations: 0,
  messagesToday: 0,
};

try {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  if (res.ok) {
    Object.assign(stats, await res.json());
  }
} catch {
  // ใช้ค่าเริ่มต้น
}
</script>

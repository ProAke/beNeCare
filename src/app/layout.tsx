import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "beNeCare — Group Insurance Customer Care Platform",
  description: "ระบบดูแลลูกค้าประกันกลุ่มผ่าน LINE OA ตอบคำถามตลอด 24 ชั่วโมง แยกข้อมูลแต่ละบริษัท พร้อมเชื่อมต่อกับ AIA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

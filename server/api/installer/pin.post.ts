import { setCookie } from "h3";

const INSTALL_PIN = process.env.INSTALL_PIN || "524452";
const PIN_SESSION_TTL = 60 * 60; // 1 ชั่วโมง

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { pin } = body;

    if (!pin) {
      return createError({
        statusCode: 400,
        statusMessage: "กรุณากรอกรหัส PIN",
      });
    }

    if (String(pin) !== INSTALL_PIN) {
      return createError({
        statusCode: 401,
        statusMessage: "รหัส PIN ไม่ถูกต้อง",
      });
    }

    // ตั้งค่า cookie session สำหรับเข้าหน้าติดตั้ง (อายุ 1 ชั่วโมง)
    setCookie(event, "benecare_install_pin", "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PIN_SESSION_TTL,
      path: "/",
    });

    return {
      ok: true,
      message: "ยืนยันรหัส PIN สำเร็จ",
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: error.message || "ตรวจสอบรหัส PIN ไม่สำเร็จ",
    });
  }
});

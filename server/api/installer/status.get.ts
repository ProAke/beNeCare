import { readFile, access, constants } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_FILE = join(process.cwd(), "data", "install-config.json");

export default defineEventHandler(async () => {
  try {
    await access(CONFIG_FILE, constants.R_OK);
    const content = await readFile(CONFIG_FILE, "utf-8");
    const config = JSON.parse(content);

    return {
      installed: true,
      status: "installed",
      message: "ระบบติดตั้งแล้วและพร้อมใช้งาน",
      appVersion: config.version || "1.0.0",
      canInstall: false,
      canReinstall: true,
      canUpdate: false,
    };
  } catch {
    return {
      installed: false,
      status: "not_installed",
      message: "ยังไม่ได้ติดตั้งระบบ กรุณาติดตั้งครั้งแรก",
      appVersion: "1.0.0",
      canInstall: true,
      canReinstall: false,
      canUpdate: false,
    };
  }
});

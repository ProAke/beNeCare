import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_FILE = join(process.cwd(), "data", "install-config.json");

export default defineEventHandler(async (event) => {
  try {
    const content = await readFile(CONFIG_FILE, "utf-8");
    const config = JSON.parse(content);

    const backupFile = join(
      process.cwd(),
      "data",
      `backup_config_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );

    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await writeFile(backupFile, JSON.stringify(config, null, 2), "utf-8");

    return {
      ok: true,
      message: "สำรองข้อมูลการตั้งค่าเรียบร้อยแล้ว",
      file: backupFile,
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: error.message || "สำรองข้อมูลไม่สำเร็จ",
    });
  }
});
